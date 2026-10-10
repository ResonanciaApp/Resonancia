import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { URL } from "node:url";

import {
  createDrawerTransitionController,
  dragProgress,
  drawerOffset,
  foregroundCornerRadius,
  foregroundShadowOpacity,
  foregroundTranslateX,
  menuContentOpacity,
  menuContentTranslateY,
  normalizeRoutePath,
  shouldSettleOpen,
} from "../lib/drawerGeometry.ts";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

test("fully open foreground leaves exactly 75 px visible at multiple widths", () => {
  for (const width of [320, 360, 375, 390, 412, 430, 768]) {
    assert.equal(drawerOffset(width), width - 75);
    assert.equal(width - foregroundTranslateX(1, width), 75);
    assert.equal(foregroundTranslateX(0, width), 0);
    assert.equal(foregroundTranslateX(0.5, width), (width - 75) / 2);
  }
});

test("corner animation is restored while the foreground light layer is removed", () => {
  assert.equal(foregroundCornerRadius(0), 0);
  assert.ok(foregroundCornerRadius(0.08) > 20);
  assert.equal(foregroundCornerRadius(0.2), 50);
  assert.equal(foregroundCornerRadius(1), 50);
  const foreground = read("../components/DrawerForeground.tsx");
  assert.match(foreground, /const radius = foregroundCornerRadius\(p\)/);
  assert.match(foreground, /const radius = foregroundCornerRadius\(drawerProgress.value\)/);
  assert.match(foreground, /<RAnimated.View style=\{\[styles.inner, innerStyle\]\}>/);
  assert.doesNotMatch(foreground, /veilStyle|styles\.veil|foregroundVeilOpacity|backgroundColor: "#FFFFFF"/);
  assert.equal(foregroundShadowOpacity(0), 0);
  assert.ok(foregroundShadowOpacity(0.5) < foregroundShadowOpacity(1));
  assert.equal(menuContentOpacity(0), 0);
  assert.equal(menuContentOpacity(0.4), 0.4);
  assert.ok(menuContentTranslateY(0.55) < -3);
  assert.equal(menuContentTranslateY(0), -7);
  assert.equal(menuContentTranslateY(1), 0);
  // Cierre revierte: mismo progreso, misma geometria.
  assert.equal(foregroundCornerRadius(0), 0);
});

test("drag progress and release decisions are clamped and directional", () => {
  assert.equal(dragProgress(0, 157.5, 390), 0.5);
  assert.equal(dragProgress(0, -40, 390), 0);
  assert.equal(dragProgress(1, 900, 390), 1);
  assert.equal(shouldSettleOpen(0.3, 800), true);
  assert.equal(shouldSettleOpen(0.8, -800), false);
  assert.equal(shouldSettleOpen(0.49, 0), false);
  assert.equal(normalizeRoutePath("/(tabs)/profile"), "/profile");
  assert.equal(normalizeRoutePath("/(auth)/sign-in/"), "/sign-in");
});

test("controller: ready acknowledgement, interruptions and obsolete callbacks", () => {
  const c = createDrawerTransitionController();
  const a1 = c.beginAnimation();
  const a2 = c.beginAnimation();
  assert.equal(c.isCurrentAnimation(a1), false);
  assert.equal(c.isCurrentAnimation(a2), true);

  const s = c.beginSelection("layout");
  assert.equal(c.acknowledge("route"), null, "route ack ignored for overlay selection");
  assert.equal(c.isPendingSelection(s), true);
  assert.equal(c.acknowledge("layout"), s);
  assert.equal(c.isCurrentSelection(s), true);
  assert.equal(c.acknowledge("layout"), null, "repeated layout callbacks are no-ops");

  const s2 = c.beginSelection("route");
  c.cancelSelection(); // strip tap / Back / reopen
  assert.equal(c.acknowledge("route"), null);
  assert.equal(c.isCurrentSelection(s2), false);

  const s3 = c.beginSelection("route");
  const acked = c.acknowledge("route");
  const s4 = c.beginSelection("layout");
  assert.equal(acked, s3);
  assert.equal(c.isCurrentSelection(s3), false, "newer selection invalidates old closure");
  assert.equal(c.isPendingSelection(s4), true);
});

test("acknowledged selections and queued tools are invalidated even with no pending layout", () => {
  const c = createDrawerTransitionController();
  const selected = c.beginSelection("layout");
  assert.equal(c.acknowledge("layout"), selected);
  c.cancelSelection();
  assert.equal(c.isCurrentSelection(selected), false, "cancel after readiness must invalidate scheduled frames");
  const tool = c.cancelSelection();
  assert.equal(c.isCurrentSelection(tool), true);
  c.cancelSelection();
  assert.equal(c.isCurrentSelection(tool), false, "reopening invalidates a tool queued after closing");
});

test("a different overlay cannot acknowledge the selected destination", () => {
  const c = createDrawerTransitionController();
  const selected = c.beginSelection("layout", "library");
  assert.equal(c.acknowledge("layout", "/historial"), null);
  assert.equal(c.isPendingSelection(selected), true);
  assert.equal(c.acknowledge("layout", "library"), selected);
});

test("simulated provider closure: close only starts after ready, interrupted close never runs its callback", () => {
  const c = createDrawerTransitionController();
  const frames: Array<() => void> = [];
  let closes = 0;
  let afterSettle: { token: number; cb: () => void } | null = null;
  const animateClose = (cb: () => void) => {
    const token = c.beginAnimation();
    afterSettle = { token, cb };
  };
  const finish = (token: number) => {
    if (!c.isCurrentAnimation(token)) return;
    afterSettle?.cb();
  };
  const ack = () => {
    const t = c.acknowledge("layout");
    if (t === null) return;
    frames.push(() => { if (c.isCurrentSelection(t)) animateClose(() => closes++); });
  };
  c.beginSelection("layout");
  assert.equal(frames.length, 0, "no close before destination layout");
  ack();
  frames.shift()!();
  const first = afterSettle!;
  c.beginAnimation(); // user reopens mid-close
  finish(first.token);
  assert.equal(closes, 0, "obsolete close callback ignored");
});

test("root stacking: static menu behind a single animated foreground, without a light veil", () => {
  const layout = read("../app/_layout.tsx");
  const nav = layout.slice(layout.indexOf("function RootLayoutNav"));
  const order = ["<DrawerMenu />", "<DrawerForeground>", "<NavStack />", "<CreationPanelsOverlay />", "<BibliotecaOverlay />", "<LibraryMixOverlay />", "<DrawerScreenOverlay />", "<ChatOverlay />", "</DrawerForeground>", "<MixerSheet />", "<PremiumPlansOverlay />"];
  let last = -1;
  for (const token of order) {
    const at = nav.indexOf(token);
    assert.ok(at > last, `${token} out of order`);
    last = at;
  }
  assert.doesNotMatch(layout, /PushWrapper|backgroundColor: "#000"/);
  const fg = read("../components/DrawerForeground.tsx");
  assert.doesNotMatch(fg, /foregroundVeilOpacity|styles\.veil|veilStyle|backgroundColor: "#FFFFFF"/);
  assert.doesNotMatch(fg, /useNativeDriver/);
  assert.match(fg, /Gesture\.Exclusive\(pan, tap\)/);
});

test("menu never slides horizontally and keeps the Inicio themed gradient backdrop", () => {
  const menu = read("../components/DrawerMenu.tsx");
  assert.doesNotMatch(menu, /translateX: drawer|DRAWER_PUSH|DRAWER_W\b|PanResponder|drawerAnim|Animated\.timing/);
  assert.match(menu, /<SceneThemeBackground \/>/);
  assert.match(menu, /menuContentOpacity\(drawerProgress\.value\)/);
  assert.match(menu, /translateY: menuContentTranslateY/);
  assert.match(menu, /kind: "afterClose", run: requestMoodPicker/);
  assert.match(menu, /kind: "afterClose", run: openMixer/);
  assert.match(menu, /kind: "layout", target: "library", run: \(\) => openLibFromDrawer\(\)/);
  assert.match(menu, /kind: "layout", target, run: \(\) => openOverlayFromDrawer\(target\)/);
  const inicio = read("../app/(tabs)/inicio8.tsx");
  assert.match(inicio, /<SceneThemeBackground/);
  assert.match(inicio, /<DrawerEdgeGesture enabled=\{variant === "inicio3"/);
});

test("context: Back has priority while blocked/pending, strip close cancels selection, no timers", () => {
  const ctx = read("../context/DrawerContext.tsx");
  assert.match(ctx, /if \(!foregroundBlocked\) return;\s*const subscription = BackHandler/);
  assert.match(ctx, /const close = useCallback\(\(onClosed\?: \(\) => void\) => \{[\s\S]*?controller\.cancelSelection\(\)/);
  assert.doesNotMatch(ctx, /setTimeout/);
  assert.match(ctx, /acknowledgeDestinationReady\("route"\)/);
  assert.match(ctx, /const closeLib = useCallback\(\(\) => \{\s*if \(foregroundBlocked\) close\(\)/);
  assert.match(ctx, /const closeOverlay = useCallback\(\(\) => \{\s*if \(foregroundBlocked\) close\(\)/);
});

test("drawer-origin overlays acknowledge real layout inside Suspense; other origins keep slide transitions", () => {
  const overlay = read("../components/DrawerScreenOverlay.tsx");
  assert.match(overlay, /<Suspense[\s\S]*<Screen \/>[\s\S]*onLayout=\{\(\) => acknowledgeDestinationReady\("layout", activeRoute\)\}[\s\S]*<\/Suspense>/);
  assert.match(overlay, /key=\{destinationRequest\}/);
  assert.match(overlay, /toValue: 0,\s*duration: DURATION\.DRAWER/);
  assert.doesNotMatch(overlay, /drawerTransitionProgress/);
  const lib = read("../components/BibliotecaOverlay.tsx");
  assert.match(lib, /onLayout=\{\(\) => acknowledgeDestinationReady\("layout", "library"\)\}/);
  assert.match(lib, /key=\{destinationRequest\}/);
  assert.match(lib, /toValue: 0, duration: 350/);
  const ret = read("../hooks/useLibraryReturnBack.ts");
  assert.doesNotMatch(ret, /openDrawer/);
  // Mezclador/Geometrix fuera del drawer y chat anidado sin cambios.
  const mixer = read("../context/MixerPanelContext.tsx");
  assert.match(mixer, /const openMixer = useCallback\(\(\) => openMixerWithOrigin\(false\)/);
  assert.match(read("../context/GeometrixPanelContext.tsx"), /drawerTransitionProgress/);
  assert.match(read("../components/ChatOverlay.tsx"), /chatUserId/);
});
