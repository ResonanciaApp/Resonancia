import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { URL } from "node:url";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";

import {
  createDrawerTransitionController,
  dragProgress,
  drawerOffset,
  drawerSpringConfig,
  foregroundCornerRadius,
  foregroundShadowOpacity,
  foregroundTranslateX,
  foregroundVeilOpacity,
  menuContentOpacity,
  menuContentTranslateY,
  normalizeRoutePath,
  shouldSettleOpen,
} from "../lib/drawerGeometry.ts";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

test("Registro de ánimo is restored with the existing picker, without shifting scenes", () => {
  const menu = read("../components/DrawerMenu.tsx");
  assert.match(menu, /id: "mood-register", label: "Registro de ánimo", icon: "smile", mciIcon: "emoticon-happy-outline", route: "__mood_picker"/);
  assert.match(menu, /testID=\{item\.id \? `drawer-item-\$\{item\.id\}` : undefined\}/);
  const branch = menu.match(/if \(route === "__mood_picker"\) \{([\s\S]*?)\n    \}/)?.[1];
  assert.ok(branch);
  let selection: { kind: string; run: () => void } | undefined;
  let pickerOpens = 0;
  new Function("selectFromDrawer", "requestMoodPicker", branch)(
    (action: typeof selection) => { selection = action; },
    () => { pickerOpens++; },
  );
  assert.equal(selection?.kind, "afterClose");
  assert.equal(pickerOpens, 0, "picker is deferred until the drawer finishes closing");
  selection!.run();
  assert.equal(pickerOpens, 1);
  assert.match(menu, /marginTop: -\(8 \* 8 - 3 \+ 36 \+ 10\)/);
  assert.equal(36 + 10 - (8 * 8 - 3 + 36 + 10), -(8 * 8 - 3));
});

test("geometry initializes after the native Babel/worklet transform, not just TypeScript hoisting", () => {
  const require = createRequire(import.meta.url);
  const babel = require("@babel/core");
  const preset = createRequire(require.resolve("expo/package.json")).resolve("babel-preset-expo");
  const transformed = babel.transformSync(read("../lib/drawerGeometry.ts"), {
    filename: new URL("../lib/drawerGeometry.ts", import.meta.url).pathname,
    configFile: false,
    babelrc: false,
    presets: [preset],
    plugins: [require.resolve("react-native-worklets/plugin")],
    caller: { name: "metro", platform: "ios", supportsStaticESM: false },
  }).code;
  const module = { exports: {} as Record<string, any> };
  const scope: Record<string, any> = { module, exports: module.exports, require, __DEV__: true, console };
  scope.global = scope;
  runInNewContext(transformed, scope);
  assert.ok(module.exports.drawerSpringConfig.__workletHash);
  assert.equal(module.exports.drawerSpringConfig(1600, 390).velocity, 1600 / 315);
});

test("spring handoff preserves finger velocity while only opening allows a mild rebound", () => {
  for (const width of [320, 390, 430, 768]) {
    for (const velocity of [-5000, -1600, -50, 0, 50, 1600, 5000]) {
      const config = drawerSpringConfig(velocity, width, 0);
      assert.ok(Math.abs(config.velocity * drawerOffset(width) - velocity) < 1e-9);
      assert.equal(config.damping ** 2, 4 * config.mass * config.stiffness);
      assert.equal(config.overshootClamping, true);
      // Exact critically damped solution: x(0)=current position, x'(0)=finger velocity.
      for (const progress of [0, 0.05, 0.2, 0.5, 0.8, 1]) {
        const target = velocity < 0 ? 0 : 1;
        const omega = Math.sqrt(config.stiffness / config.mass);
        const d = progress - target;
        const positionAtZero = target + d;
        const speedAtZero = (config.velocity + omega * d) - omega * d;
        assert.ok(Math.abs(positionAtZero - progress) < 1e-9);
        assert.ok(Math.abs(speedAtZero * drawerOffset(width) - velocity) < 1e-9);
      }
    }
  }
  assert.equal(drawerSpringConfig(Number.NaN, 390).velocity, 0);
  const opening = drawerSpringConfig(0, 390, 1);
  assert.equal(opening.damping, 40);
  assert.equal(opening.overshootClamping, false);
  assert.ok(opening.damping ** 2 < 4 * opening.mass * opening.stiffness);
});
test("fully open foreground leaves exactly 75 px visible at multiple widths", () => {
  for (const width of [320, 360, 375, 390, 412, 430, 768]) {
    assert.equal(drawerOffset(width), width - 75);
    assert.equal(width - foregroundTranslateX(1, width), 75);
    assert.equal(foregroundTranslateX(0, width), 0);
    assert.equal(foregroundTranslateX(0.5, width), (width - 75) / 2);
  }
});

test("normal corner and light-layer animations share the drawer progress", () => {
  assert.equal(foregroundCornerRadius(0), 0);
  assert.ok(foregroundCornerRadius(0.08) > 20);
  assert.equal(foregroundCornerRadius(0.2), 50);
  assert.equal(foregroundCornerRadius(1), 50);
  const foreground = read("../components/DrawerForeground.tsx");
  assert.match(foreground, /const radius = foregroundCornerRadius\(p\)/);
  assert.match(foreground, /const radius = foregroundCornerRadius\(drawerProgress.value\)/);
  assert.match(foreground, /<RAnimated.View style=\{\[styles.inner, innerStyle\]\}>/);
  assert.match(foreground, /pointerEvents="none" style=\{\[StyleSheet.absoluteFill, styles.veil, veilStyle\]\}/);
  assert.equal(foregroundVeilOpacity(0), 0);
  assert.equal(foregroundVeilOpacity(0.5), 0.065);
  assert.equal(foregroundVeilOpacity(1), 0.13);
  assert.equal(foregroundShadowOpacity(0), 0);
  assert.ok(foregroundShadowOpacity(0.5) < foregroundShadowOpacity(1));
  assert.equal(menuContentOpacity(0), 0);
  assert.equal(menuContentOpacity(0.4), 0.4);
  assert.ok(Math.abs(menuContentTranslateY(0.55) - 5.4) < 1e-9);
  assert.equal(menuContentTranslateY(0), 12);
  assert.equal(menuContentTranslateY(1), 0);
  assert.equal(menuContentTranslateY(0.5), 6);
  assert.equal(menuContentTranslateY(-1), 12);
  assert.equal(menuContentTranslateY(2), 0);
  const positions = [0, 0.25, 0.5, 0.75, 1].map(menuContentTranslateY);
  assert.deepEqual(positions, [12, 9, 6, 3, 0]);
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

test("root stacking: static menu behind a single animated foreground, no black veil", () => {
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
  assert.match(fg, /foregroundVeilOpacity/);
  assert.match(fg, /backgroundColor: "#FFFFFF"/);
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
  assert.match(menu, /kind: "layout", target: "mixer", run: openMixerFromDrawer/);
  assert.match(menu, /kind: "layout", target: "library", run: \(\) => openLibFromDrawer\(\)/);
  assert.match(menu, /kind: "layout", target, run: \(\) => openOverlayFromDrawer\(target\)/);
  const inicio = read("../app/(tabs)/inicio8.tsx");
  assert.match(inicio, /<SceneThemeBackground/);
  assert.match(inicio, /<DrawerEdgeGesture enabled=\{variant === "inicio3"/);
});

test("Inicio avatar, user name and greeting fade together from the same UI-thread drawer progress", () => {
  const source = read("../app/(tabs)/inicio8.tsx");
  assert.match(source, /drawerProgress: identityDrawerProgress \} = useDrawerMotion\(\)/);
  assert.match(source, /identityDrawerStyle = useAnimatedStyle\(\(\) => \(\{\s*opacity: isInicio3 \? 1 - Math\.max\(0, Math\.min\(1, identityDrawerProgress\.value\)\) : 1,/);
  const start = source.indexOf("styles.inicio2HeroProfileButton,", source.indexOf("const identityDrawerStyle"));
  const groupStart = source.lastIndexOf("<RAnimated.View", start);
  const groupEnd = source.indexOf("</RAnimated.View>", start);
  const group = source.slice(groupStart, groupEnd);
  assert.match(group, /identityDrawerStyle/);
  assert.match(group, /testID="inicio2-avatar-open-drawer"/);
  assert.match(group, /testID="inicio2-open-drawer"/);
  assert.match(group, /\{displayName\}/);
  assert.match(group, /\{greeting\}/);
  assert.equal((source.match(/identityDrawerStyle,/g) ?? []).length, 1, "one shared parent fade, not multiplied fades");
  const expression = source.match(/opacity: (isInicio3 \? 1 - Math\.max\(0, Math\.min\(1, identityDrawerProgress\.value\)\) : 1)/)![1];
  const opacity = new Function("isInicio3", "identityDrawerProgress", `return ${expression};`);
  for (const progress of [0, 0.25, 0.5, 0.75, 1, 0.75, 0.5, 0.25, 0]) {
    assert.equal(opacity(true, { value: progress }), 1 - progress);
    assert.equal(opacity(false, { value: progress }), 1);
  }
  assert.equal(opacity(true, { value: 1.1 }), 0);
  assert.equal(opacity(true, { value: -0.1 }), 1);
});

test("context: Back has priority while blocked/pending, strip close cancels selection, no timers", () => {
  const ctx = read("../context/DrawerContext.tsx");
  assert.match(ctx, /if \(!foregroundBlocked\) return;\s*const subscription = BackHandler/);
  assert.match(ctx, /const close = useCallback\(\(onClosed\?: \(\) => void\) => \{[\s\S]*?controller\.cancelSelection\(\)/);
  assert.doesNotMatch(ctx, /setTimeout/);
  assert.match(ctx, /acknowledgeDestinationReady\("route"\)/);
  assert.match(ctx, /const closeLib = useCallback\(\(\) => \{\s*if \(foregroundBlockedRef.current\) close\(\)/);
  assert.match(ctx, /const closeOverlay = useCallback\(\(\) => \{\s*if \(foregroundBlockedRef.current\) close\(\)/);
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
