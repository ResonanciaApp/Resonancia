import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { URL } from "node:url";
import test from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import * as geometry from "../lib/drawerGeometry.ts";

const require = createRequire(import.meta.url);

test("closing a prepared drawer tool before layout aborts the pending selection without blocking Home", () => {
  const h = harness();
  h.ctx.open(); h.flush(); h.finish(); h.flush();
  h.ctx.selectFromDrawer({ kind: "layout", target: "mixer", run() {} }); h.flush();
  h.destinations.closeDrawerIfBlocked(); h.flush(); h.finish(); h.flush();
  assert.equal(h.ctx.foregroundBlocked, false);
  assert.equal(h.ctx.drawerProgress.value, 0);
  h.ctx.acknowledgeDestinationReady("layout", "mixer");
  h.frame(); h.frame(); h.flush();
  assert.equal(h.ctx.drawerProgress.value, 0);
  const version = h.ctx.drawerGestureVersion.value;
  h.destinations.closeDrawerIfBlocked(); h.flush();
  assert.equal(h.ctx.drawerGestureVersion.value, version, "already-closed drawer must not start another spring");
});

test("tap shield remains mounted but neither intercepts nor recognizes touches when Home is restored", () => {
  const h = harness();
  function strip(node: any): any {
    if (!node || typeof node !== "object") return;
    if (node.props?.testID === "drawer-foreground-strip") return node;
    for (const child of node.props?.children ?? []) {
      const result = strip(child);
      if (result) return result;
    }
  }
  for (const open of [false, true, false]) {
    if (open) h.ctx.open();
    else h.ctx.close();
    h.flush(); h.finish(); h.flush();
    const result = h.component("DrawerForeground", { children: null });
    const touchLayer = strip(result.tree);
    assert.ok(touchLayer, "no native hierarchy change at the closing endpoint");
    assert.equal(touchLayer.props.pointerEvents, open ? "auto" : "none");
    assert.equal(touchLayer.props.accessible, open);
    assert.equal(touchLayer.props.accessibilityElementsHidden, !open);
    for (const gesture of result.gestures.slice(-2)) assert.equal(gesture.options.enabled, open);
  }
});

test("delayed JS cannot launch an old settle over a newer held finger", () => {
  const h = harness({ deferJS: true });
  const pan = h.component("DrawerEdgeGesture", { enabled: true, children: null }).gestures[0];
  pan.handlers.onStart();
  pan.handlers.onUpdate({ translationX: 126 });
  pan.handlers.onEnd({ translationX: 126, velocityX: 1600 });
  assert.equal(h.ctx.drawerProgress.animation.target, 1, "spring starts on UI before JS is drained");
  pan.handlers.onStart();
  pan.handlers.onUpdate({ translationX: -31.5 });
  h.drainJS();
  assert.equal(h.ctx.drawerProgress.animation, undefined, "old JS callbacks cannot restart animation");
  assert.equal(h.ctx.foregroundBlocked, false, "old callbacks cannot mount a shield over the new finger");
  pan.handlers.onUpdate({ translationX: -63 });
  assert.ok(Math.abs(h.ctx.drawerProgress.value - 0.2) < 1e-9);
  assert.equal(h.ctx.drawerProgress.animation, undefined);
});

test("slow and fast opening/closing drags keep 1:1 position and pass final velocity to UI spring", () => {
  for (const mode of ["open", "close"] as const) {
    for (const distance of [15, 63, 157.5, 280]) {
      for (const speed of [50, 500, 1600, 5000]) {
        const h = harness({ deferJS: true });
        if (mode === "close") { h.ctx.open(); h.drainJS(); h.finish(); h.drainJS(); }
        const pan = h.component(mode === "open" ? "DrawerEdgeGesture" : "DrawerForeground",
          mode === "open" ? { enabled: true, children: null } : { children: null }).gestures[0];
        pan.handlers.onStart();
        h.drainJS();
        const rendersBefore = h.providerRenders;
        const sign = mode === "open" ? 1 : -1;
        for (const fraction of [0.15, 0.4, 0.8]) {
          pan.handlers.onUpdate({ translationX: sign * distance * fraction, velocityX: sign * speed });
          h.flush();
          const expected = (mode === "open" ? 0 : 1) + sign * distance * fraction / 315;
          assert.ok(Math.abs(h.ctx.drawerProgress.value - expected) < 1e-9);
          assert.equal(h.ctx.drawerProgress.animation, undefined);
        }
        assert.equal(h.providerRenders, rendersBefore, "no provider renders for per-frame movement");
        pan.handlers.onEnd({ translationX: sign * distance, velocityX: sign * speed });
        const animation = h.ctx.drawerProgress.animation;
        assert.ok(Math.abs(h.ctx.drawerProgress.value - ((mode === "open" ? 0 : 1) + sign * distance / 315)) < 1e-9,
          "the final native translation, not the previous update, defines the handoff position");
        assert.equal(animation.kind, "spring");
        assert.equal(animation.options.velocity, sign * speed / 315);
        const expectedTarget = mode === "open" ? 1 : geometry.shouldSettleOpen(h.ctx.drawerProgress.value, -speed) ? 1 : 0;
        assert.equal(animation.target, expectedTarget);
        h.drainJS(); h.finish(); h.drainJS();
        assert.equal(h.ctx.drawerProgress.value, expectedTarget);
        assert.equal(h.ctx.foregroundBlocked, expectedTarget === 1);
      }
    }
  }
});

test("avatar/programmatic opening starts at current position and reversals retain spring momentum", () => {
  const h = harness();
  h.ctx.drawerProgress.value = 0.35;
  h.ctx.open(); h.flush();
  assert.equal(h.ctx.drawerProgress.value, 0.35);
  assert.equal(h.ctx.drawerProgress.animation.options.velocity, 0);
  h.ctx.drawerProgress.animation.velocity = 2.4;
  h.ctx.close(); h.flush();
  assert.equal(h.ctx.drawerProgress.value, 0.35);
  assert.equal(h.ctx.drawerProgress.animation.velocity, 2.4, "Reanimated carries the replaced spring's velocity");
  h.ctx.open(); h.flush(); h.finish();
  assert.equal(h.ctx.drawerProgress.value, 1);
});

test("late animation completion and destination-ready callbacks cannot override a new drag", () => {
  const h = harness({ deferJS: true });
  h.ctx.open(); h.flush(); h.finish(); // finish callback remains queued
  const pan = h.component("DrawerForeground", { children: null }).gestures[0];
  pan.handlers.onStart(); pan.handlers.onUpdate({ translationX: -63 });
  h.drainJS();
  assert.equal(h.ctx.drawerProgress.animation, undefined);
  assert.equal(h.ctx.drawerProgress.value, 0.8);
  pan.handlers.onEnd({ translationX: -63, velocityX: -1600 });
  h.drainJS(); h.finish(); h.drainJS();
  assert.equal(h.ctx.drawerProgress.value, 0);

  const k = harness({ deferJS: true });
  k.ctx.open(); k.flush(); k.finish(); k.drainJS();
  k.ctx.selectFromDrawer({ kind: "layout", target: "/historial", run: () => {} });
  k.flush();
  k.ctx.acknowledgeDestinationReady("layout", "/historial");
  const newer = k.component("DrawerForeground", { children: null }).gestures[0];
  newer.handlers.onStart();
  newer.handlers.onUpdate({ translationX: -63 });
  k.frame(); k.frame(); // pending ready callback before JS sees the new gesture
  assert.equal(k.ctx.drawerProgress.animation, undefined);
  assert.equal(k.ctx.drawerProgress.value, 0.8);
  k.drainJS();
});

test("all three gesture surfaces settle directly on UI, never via a JS animation handoff", () => {
  for (const file of ["../components/DrawerForeground.tsx", "../components/DrawerMenu.tsx"]) {
    const source = readFileSync(new URL(file, import.meta.url), "utf8");
    assert.doesNotMatch(source, /runOnJS\(settleDrawerDrag\)/);
    assert.match(source, /drawerGestureVersion.value \+= 1/);
    assert.match(source, /settleDrawerDrag\([\s\S]*?gestureVersion.value, event.velocityX\)/);
  }
});

test("opening, dragging and closing keep destination and panel subscriptions stable", () => {
  const h = harness();
  const initial = h.destinations;
  h.ctx.beginDrawerDrag();
  h.ctx.drawerProgress.value = 0.4;
  h.flush();
  assert.equal(h.destinations, initial);
  h.ctx.settleDrawerDrag(true);
  h.flush();
  assert.equal(h.ctx.foregroundBlocked, true);
  assert.equal(h.destinations, initial);
  h.finish();
  assert.equal(h.destinations, initial);
  h.ctx.close();
  h.flush();
  assert.equal(h.destinations, initial);
  h.finish();
  assert.equal(h.ctx.foregroundBlocked, false);
  assert.equal(h.destinations, initial);
  h.ctx.open();
  h.flush();
  assert.equal(h.destinations, initial);
});

test("stable destination callbacks read current blocking state and publish real destination changes", () => {
  const h = harness();
  const initial = h.destinations;
  const cachedCloseLibrary = initial.closeLib;
  const cachedCloseOverlay = initial.closeOverlay;
  h.ctx.open();
  h.flush();
  h.ctx.openLibFromDrawer("favoritos");
  h.flush();
  assert.notEqual(h.destinations, initial);
  assert.equal(h.destinations.libOpen, true);
  assert.equal(h.destinations.libraryInitialTab, "favoritos");
  assert.equal(h.destinations.closeLib, cachedCloseLibrary);
  cachedCloseLibrary();
  h.flush();
  assert.equal(h.ctx.isOpen, false);
  assert.equal(h.destinations.libOpen, false);
  h.finish();
  h.ctx.open();
  h.flush();
  h.ctx.openOverlayFromDrawer("/historial");
  h.flush();
  assert.equal(h.destinations.overlayRoute, "/historial");
  assert.equal(h.destinations.closeOverlay, cachedCloseOverlay);
  cachedCloseOverlay();
  h.flush();
  assert.equal(h.ctx.isOpen, false);
  assert.equal(h.destinations.overlayRoute, null);
});

test("navigation, overlay hosts and tool providers subscribe only to destination state", () => {
  for (const path of [
    "../app/_layout.tsx",
    "../components/BibliotecaOverlay.tsx", "../components/DrawerScreenOverlay.tsx",
    "../components/ChatOverlay.tsx", "../components/LibraryMixOverlay.tsx",
    "../context/MixerPanelContext.tsx", "../context/GeometrixPanelContext.tsx",
  ]) {
    const source = readFileSync(new URL(path, import.meta.url), "utf8");
    assert.match(source, /useDrawerDestinations\(\)/, path);
    assert.doesNotMatch(source, /\buseDrawer\(\)/, path);
  }
});

/** Execute the real provider/components with deterministic hooks, native gestures
 * and UI timing. This tests callbacks from production, not a copied controller.
 * Native view rendering, hardware event delivery and pixels still need a device.
 */
function harness({ deferJS = false } = {}) {
  let index = 0;
  let dirty = true;
  let currentPath = "/inicio3";
  const slots: any[] = [];
  const effects: Array<() => void> = [];
  const frames: Array<() => void> = [];
  const backs: Array<() => boolean> = [];
  const gestures: any[] = [];
  const jsTasks: Array<() => void> = [];
  let providerRenders = 0;
  let context: any;
  let destinationContext: any;
  let Provider: any;
  const same = (a: any[], b?: any[]) => b && a.length === b.length && a.every((v, i) => Object.is(v, b[i]));
  const React: any = {
    createContext: () => ({ Provider: "Provider" }),
    createElement: (type: any, props: any, ...children: any[]) => ({ type, props: { ...props, children } }),
    useContext: () => context,
    useRef: (initial: any) => {
      const n = index++;
      return slots[n] ?? (slots[n] = { current: initial });
    },
    useState: (initial: any) => {
      const n = index++;
      if (!slots[n]) slots[n] = { value: typeof initial === "function" ? initial() : initial };
      return [slots[n].value, (value: any) => {
        const next = typeof value === "function" ? value(slots[n].value) : value;
        if (!Object.is(next, slots[n].value)) { slots[n].value = next; dirty = true; }
      }];
    },
    useMemo: (fn: any, deps: any[]) => {
      const n = index++;
      if (!slots[n] || !same(deps, slots[n].deps)) slots[n] = { value: fn(), deps };
      return slots[n].value;
    },
    useCallback: (fn: any, deps: any[]) => React.useMemo(() => fn, deps),
    useEffect: (fn: any, deps: any[]) => {
      const n = index++;
      if (!slots[n] || !same(deps, slots[n].deps)) {
        const previous = slots[n];
        slots[n] = { deps };
        effects.push(() => { previous?.cleanup?.(); slots[n].cleanup = fn(); });
      }
    },
  };
  class Shared {
    animation: any;
    private stored: any;
    constructor(value: any) { this.stored = value; }
    get value() { return this.stored; }
    set value(value: any) {
      const previous = this.animation;
      this.animation = undefined;
      previous?.callback?.(false);
      if (value && typeof value === "object" && "target" in value) {
        value.velocity = (previous?.velocity || 0) + (value.options?.velocity || 0);
        this.animation = value;
      } else this.stored = value;
    }
    finish() {
      const animation = this.animation;
      this.animation = undefined;
      if (!animation) return;
      this.stored = animation.target;
      animation.callback?.(true);
    }
  }
  const Reanimated: any = {
    __esModule: true, default: { View: "AnimatedView" },
    useSharedValue: (value: number) => React.useRef(new Shared(value)).current,
    useAnimatedStyle: (fn: any) => fn(),
    runOnJS: (fn: any) => (...args: any[]) => {
      if (deferJS) jsTasks.push(() => fn(...args));
      else fn(...args);
    },
    runOnUI: (fn: any) => fn,
    cancelAnimation: (value: Shared) => {
      const animation = value.animation;
      value.animation = undefined;
      animation?.callback?.(false);
    },
    withTiming: (target: number, _options: any, callback: any) => ({ target, callback }),
    withSpring: (target: number, options: any, callback: any) => ({ target, options, callback, kind: "spring" }),
    Easing: { out: (v: any) => v, cubic: () => {} },
  };
  class Value {
    value: number;
    constructor(value: number) { this.value = value; }
    stopAnimation() {}
    setValue(value: number) { this.value = value; }
    interpolate(options: any) { return options; }
  }
  function gesture(kind: string) {
    const g: any = { kind, handlers: {}, options: {} };
    for (const key of ["enabled", "hitSlop", "activeOffsetX", "failOffsetX", "failOffsetY"]) {
      g[key] = (value: any) => { g.options[key] = value; return g; };
    }
    for (const key of ["onStart", "onUpdate", "onEnd", "onFinalize"]) {
      g[key] = (fn: any) => { g.handlers[key] = fn; return g; };
    }
    gestures.push(g);
    return g;
  }
  const modules: any = {
    react: { __esModule: true, default: React, ...React },
    "react-native": {
      useWindowDimensions: () => ({ width: 390, height: 844 }),
      Animated: { Value, timing: (value: Value, options: any) => ({ start: (cb?: any) => { value.setValue(options.toValue); cb?.({ finished: true }); } }) },
      BackHandler: { addEventListener: (_event: string, fn: any) => {
        backs.push(fn);
        return { remove: () => { const i = backs.indexOf(fn); if (i >= 0) backs.splice(i, 1); } };
      } },
      StyleSheet: { create: (s: any) => s, absoluteFill: { position: "absolute" } },
      View: "View",
    },
    "expo-router": { usePathname: () => currentPath },
    "react-native-reanimated": Reanimated,
    "react-native-gesture-handler": { GestureDetector: "GestureDetector", Gesture: {
      Pan: () => gesture("pan"), Tap: () => gesture("tap"),
      Exclusive: (...items: any[]) => ({ items }),
    } },
    "@/constants/motion": { DURATION: { DRAWER: 350 }, easeOutCubic: (v: number) => v },
    "@/lib/drawerGeometry": geometry,
    "@/context/DrawerContext": { useDrawer: () => context, useDrawerMotion: () => context },
    "@/context/SceneThemeContext": { useSceneTheme: () => ({ theme: { solid: "#060A0F" } }) },
    "@/components/SacredBackground": { SacredBackground: "Background" },
  };
  function load(file: string) {
    const source = readFileSync(new URL(file, import.meta.url), "utf8");
    const output = ts.transpileModule(source, { compilerOptions: {
      module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true,
    } }).outputText;
    const module = { exports: {} };
    runInNewContext(output, {
      module, exports: module.exports,
      require: (id: string) => modules[id] ?? require(id),
      requestAnimationFrame: (fn: any) => { frames.push(fn); return frames.length; },
      console,
    });
    return module.exports as any;
  }
  Provider = load("../context/DrawerContext.tsx").DrawerProvider;
  const foreground = load("../components/DrawerForeground.tsx");
  function flush() {
    let limit = 20;
    while (dirty && limit-- > 0) {
      dirty = false; index = 0;
      providerRenders++;
      const provider = Provider({ children: null }).props.children[0].props.children[0];
      context = provider.props.value;
      destinationContext = provider.props.children[0].props.value;
      effects.splice(0).forEach(fn => fn());
    }
    assert.ok(limit > 0, "provider settles without an infinite render loop");
    return context;
  }
  flush();
  return {
    get ctx() { return context; }, flush,
    get destinations() { return destinationContext; },
    get providerRenders() { return providerRenders; },
    drainJS: () => { while (jsTasks.length) { jsTasks.shift()!(); flush(); } },
    frame: () => { frames.splice(0).forEach(fn => fn()); flush(); },
    finish: () => { context.drawerProgress.finish(); flush(); },
    path: (path: string) => { currentPath = path; dirty = true; flush(); },
    back: () => { const handled = [...backs].reverse().some(fn => fn()); flush(); return handled; },
    component: (name: "DrawerForeground" | "DrawerEdgeGesture", props: any) => {
      // Separate hook slots: rendering the foreground must not consume provider hooks.
      index = slots.length;
      return { tree: foreground[name](props), gestures };
    },
  };
}

function opened() {
  const h = harness();
  h.ctx.open(); h.flush(); h.finish();
  assert.equal(h.ctx.drawerProgress.value, 1);
  return h;
}

test("real provider waits for overlay layout, then closes with destination still mounted", () => {
  const h = opened();
  h.ctx.selectFromDrawer({ kind: "layout", run: () => h.ctx.openLibFromDrawer() });
  h.flush();
  assert.equal(h.ctx.libOpen, true);
  assert.equal(h.ctx.foregroundBlocked, true);
  assert.equal(h.ctx.drawerProgress.animation, undefined);
  h.ctx.acknowledgeDestinationReady("layout");
  h.frame(); assert.equal(h.ctx.drawerProgress.animation, undefined);
  h.frame(); assert.equal(h.ctx.drawerProgress.animation.target, 0);
  h.finish();
  assert.equal(h.ctx.foregroundBlocked, false);
  assert.equal(h.ctx.libOpen, true);
});

test("reselecting an already mounted overlay requests fresh readiness without accepting another destination", () => {
  const h = opened();
  const choose = () => {
    h.ctx.selectFromDrawer({ kind: "layout", target: "library", run: () => h.ctx.openLibFromDrawer() });
    h.flush();
  };
  choose();
  const first = h.ctx.destinationRequest;
  h.ctx.open(); h.flush(); h.finish();
  choose();
  assert.ok(h.ctx.destinationRequest > first, "a fresh layout probe mounts even if libOpen was already true");
  h.ctx.acknowledgeDestinationReady("layout", "/historial"); h.frame(); h.frame();
  assert.equal(h.ctx.drawerProgress.animation, undefined);
  h.ctx.acknowledgeDestinationReady("layout", "library"); h.frame(); h.frame(); h.finish();
  assert.equal(h.ctx.foregroundBlocked, false);
  assert.equal(h.ctx.libOpen, true);
});

test("real provider invalidates already acknowledged but not yet executed closing frames", () => {
  const h = opened();
  h.ctx.selectFromDrawer({ kind: "layout", run: () => h.ctx.openOverlayFromDrawer("/historial") });
  h.flush(); h.ctx.acknowledgeDestinationReady("layout"); h.frame();
  h.ctx.open(); h.flush(); h.frame();
  assert.equal(h.ctx.isOpen, true);
  assert.equal(h.ctx.drawerProgress.animation.target, 1);
});

test("Back or closing the newly mounted overlay cancels a pending selection in one action", () => {
  for (const action of ["back", "closeOverlay", "closeLib"]) {
    const h = opened();
    h.ctx.selectFromDrawer({ kind: "layout", run: () => action === "closeLib" ? h.ctx.openLibFromDrawer() : h.ctx.openOverlayFromDrawer("/historial") });
    h.flush();
    if (action === "back") assert.equal(h.back(), true);
    else h.ctx[action]();
    h.flush();
    assert.equal(h.ctx.drawerProgress.animation.target, 0);
    h.ctx.acknowledgeDestinationReady("layout"); h.frame(); h.frame(); h.finish();
    assert.equal(h.ctx.foregroundBlocked, false);
  }
});

test("route selection waits for navigation and tools wait for real close, including a late reopen", () => {
  const h = opened();
  let navigations = 0;
  h.ctx.selectFromDrawer({ kind: "route", target: "/respiracion", run: () => navigations++ });
  h.flush(); h.frame();
  assert.equal(navigations, 1);
  assert.equal(h.ctx.drawerProgress.animation, undefined);
  h.path("/respiracion"); h.frame(); h.frame(); h.finish();
  assert.equal(h.ctx.instantNav, false);
  let tools = 0;
  h.ctx.open(); h.flush(); h.finish();
  h.ctx.selectFromDrawer({ kind: "afterClose", run: () => tools++ }); h.flush();
  assert.equal(tools, 0);
  h.finish();
  h.ctx.open(); h.flush(); h.frame();
  assert.equal(tools, 0, "reopening before the queued frame suppresses the obsolete tool");
});

test("edge gesture wraps real content, restricts recognition without a touch-blocking strip, and cancels safely", () => {
  const h = harness();
  const child = { type: "Home", props: {} };
  const result = h.component("DrawerEdgeGesture", { enabled: true, top: 100, children: child });
  assert.equal(result.tree.props.children[0], child);
  const pan = result.gestures[0];
  assert.equal(pan.options.hitSlop, undefined);
  pan.handlers.onFinalize();
  assert.equal(h.ctx.foregroundBlocked, false, "failing before activation does not close or block content");
  pan.handlers.onStart(); pan.handlers.onUpdate({ translationX: 157.5 });
  h.flush();
  assert.equal(h.ctx.foregroundBlocked, false, "no shield mounts over an active finger");
  assert.equal(h.ctx.drawerProgress.value, 0.5);
  pan.handlers.onFinalize(); h.flush(); h.finish();
  assert.equal(h.ctx.drawerProgress.value, 0);
  assert.equal(h.ctx.foregroundBlocked, false);
});

test("an active native drag cannot overwrite or reopen a programmatic Back close", () => {
  const h = opened();
  const result = h.component("DrawerForeground", { children: null });
  const pan = result.gestures[0];
  pan.handlers.onStart(); h.flush();
  assert.equal(h.back(), true);
  pan.handlers.onUpdate({ translationX: -100 });
  assert.equal(h.ctx.drawerProgress.value, 1, "stale gesture update ignored during programmatic closing");
  pan.handlers.onFinalize(); h.flush(); h.finish();
  assert.equal(h.ctx.drawerProgress.value, 0);
  assert.equal(h.ctx.foregroundBlocked, false);
  assert.equal(h.ctx.isOpen, false);
});

test("Inicio follows the held finger in both directions and settles only after release", () => {
  const h = harness();
  const { gestures } = h.component("DrawerEdgeGesture", { enabled: true, children: null });
  const pan = gestures[0];
  pan.handlers.onStart(); h.flush();
  for (const x of [31.5, 126, 63]) {
    pan.handlers.onUpdate({ translationX: x }); h.flush();
    assert.equal(h.ctx.drawerProgress.value, x / 315);
    assert.equal(h.ctx.drawerProgress.animation, undefined, "no timing fights the finger");
    assert.equal(h.ctx.foregroundBlocked, false, "the original gesture keeps its touch target");
    assert.equal(h.ctx.isOpen, false);
  }
  pan.handlers.onEnd({ translationX: 63, velocityX: 0 }); h.flush(); h.finish();
  assert.equal(h.ctx.drawerProgress.value, 1, "a short intentional right swipe opens upon release");
});
