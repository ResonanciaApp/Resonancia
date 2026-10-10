import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { URL } from "node:url";
import test from "node:test";
import React from "react";
import ts from "typescript";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");
function load(path: string, modules: Record<string, any>) {
  const code = ts.transpileModule(read(path), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true },
  }).outputText;
  const module = { exports: {} as any };
  new Function("require", "module", "exports", code)((id: string) => {
    assert.ok(id in modules, `unexpected dependency: ${id}`);
    return modules[id];
  }, module, module.exports);
  return module.exports;
}

function hooks() {
  const slots: any[] = [];
  let cursor = 0;
  return {
    reset() { cursor = 0; },
    react: {
      ...React,
      createContext: () => ({ Provider: "Provider" }),
      useState(initial: any) {
        const index = cursor++;
        if (!(index in slots)) slots[index] = typeof initial === "function" ? initial() : initial;
        return [slots[index], (next: any) => { slots[index] = typeof next === "function" ? next(slots[index]) : next; }];
      },
      useRef(initial: any) {
        const index = cursor++;
        return slots[index] ?? (slots[index] = { current: initial });
      },
      useMemo: (fn: any) => fn(),
      useCallback: (fn: any) => fn,
      useEffect: () => {},
    },
  };
}

class Value {
  constructor(public value: number) {}
  setValue(value: number) { this.value = value; }
  stopAnimation() {}
  interpolate(config: any) { return config; }
}

function providerHarness() {
  const h = hooks();
  const timings: any[] = [];
  const sharedTransition = new Value(0);
  let sessionStops = 0;
  const { MixerPanelProvider } = load("../context/MixerPanelContext.tsx", {
    react: h.react,
    "react-native": {
      Animated: {
        Value,
        timing: (value: Value, config: any) => ({
          start() { timings.push({ value, ...config }); value.setValue(config.toValue); },
        }),
      },
      Dimensions: { get: () => ({ width: 390 }) },
      BackHandler: {},
    },
    "@/constants/motion": { DURATION: {}, easeOutCubic: "cubic" },
    "@/context/audioBridge": { stopSessionPlayback: () => sessionStops++ },
    "@/context/DrawerContext": { useDrawerDestinations: () => ({ drawerTransitionProgress: sharedTransition, closeDrawerIfBlocked() {} }) },
  });
  let ctx: any;
  const render = () => { h.reset(); ctx = MixerPanelProvider({ children: null }).props.value; return ctx; };
  render();
  return { render, timings, sharedTransition, get ctx() { return ctx; }, get sessionStops() { return sessionStops; } };
}

test("drawer mixer prepares immediately without a second entrance, and closes without a separate window", () => {
  const h = providerHarness();
  h.ctx.openMixerFromDrawer(); h.render();
  assert.equal(h.ctx.isMixerOpen, true);
  assert.equal(h.ctx.openedFromDrawer, true);
  assert.equal(h.ctx.panelAnim.value, 1);
  assert.notEqual(h.ctx.panelAnim, h.sharedTransition);
  assert.equal(h.sessionStops, 1, "session audio handoff is preserved");
  assert.equal(h.timings.length, 0);
  h.ctx.closeMixer(); h.render();
  assert.equal(h.ctx.isMixerOpen, false);
  assert.equal(h.ctx.openedFromDrawer, false);
  assert.equal(h.ctx.panelAnim.value, 0);
  assert.equal(h.timings.length, 0);
});

test("ordinary mixer entrance/exit remains the same after a drawer visit and on repeated visits", () => {
  const h = providerHarness();
  for (let visit = 0; visit < 3; visit++) {
    h.ctx.openMixerFromDrawer(); h.render();
    h.ctx.closeMixer(); h.render();
    h.ctx.openMixer(); h.render();
    assert.equal(h.ctx.isMixerOpen, true);
    assert.equal(h.ctx.openedFromDrawer, false);
    h.ctx.closeMixer(); h.render();
  }
  assert.deepEqual(h.timings.map(t => [t.toValue, t.duration, t.useNativeDriver]),
    Array.from({ length: 3 }, () => [[1, 320, true], [0, 320, true]]).flat());
  assert.equal(h.sessionStops, 6);
});

function overlayHarness() {
  const h = hooks();
  const mixer = { isMixerOpen: true, openedFromDrawer: true, closeMixer() {}, panelAnim: new Value(1) };
  const drawer = {
    destinationRequest: 1,
    acknowledgeDestinationReady: (kind: string, target: string) => ready.push([kind, target]),
  };
  const ready: string[][] = [];
  const { CreationPanelsOverlay } = load("../components/CreationPanelsOverlay.tsx", {
    react: h.react,
    "react-native": {
      Animated: { View: "AnimatedView" }, Pressable: "Pressable", View: "View",
      StyleSheet: { absoluteFill: {}, absoluteFillObject: {}, create: (s: any) => s },
    },
    "@/app/(tabs)/geometrix": "Geometrix",
    "@/app/(tabs)/musica": "Mezclador",
    "@/components/MiniPlayer": { MiniPlayer: "MiniPlayer" },
    "@/context/MixerContext": { useMixer: () => ({ activeSounds: [{ id: "rain" }] }) },
    "@/context/MixerPanelContext": { MIXER_PANEL_W: 390, useMixerPanel: () => mixer },
    "@/context/GeometrixPanelContext": { GEOMETRIX_PANEL_W: 390, useGeometrixPanel: () => ({
      isGeometrixOpen: false, openedFromDrawer: false, hasOpenedGeometrix: false,
      closeGeometrix() {}, panelAnim: new Value(0),
    }) },
    "@/context/DrawerContext": { useDrawerDestinations: () => drawer },
  });
  const render = () => { h.reset(); return CreationPanelsOverlay(); };
  return { mixer, drawer, ready, render };
}

function find(node: any, id: string): any {
  if (!node || typeof node !== "object") return null;
  if (node.props?.testID === id) return node;
  for (const child of React.Children.toArray(node.props?.children)) {
    const result = find(child, id);
    if (result) return result;
  }
  return null;
}

test("drawer mixer has zero local translation/backdrop and waits for genuine layout readiness", () => {
  const h = overlayHarness();
  const tree = h.render();
  assert.deepEqual(tree.props.children[0].props.style[1].transform[0].translateX.outputRange, [0, 0]);
  assert.deepEqual(tree.props.children[1].props.style[1].opacity.outputRange, [0, 0]);
  assert.deepEqual(h.ready, []);
  find(tree, "drawer-mixer-ready").props.onLayout();
  assert.deepEqual(h.ready, [["layout", "mixer"]]);
  assert.ok(tree.props.children[0].props.children[2], "active-mix miniplayer remains mounted");
});

test("late readiness cannot complete another selection or a closed mixer; ordinary access has no drawer signal", () => {
  const h = overlayHarness();
  const old = find(h.render(), "drawer-mixer-ready").props.onLayout;
  h.drawer.destinationRequest++; const next = h.render();
  old(); assert.deepEqual(h.ready, []);
  find(next, "drawer-mixer-ready").props.onLayout();
  assert.deepEqual(h.ready, [["layout", "mixer"]]);
  h.mixer.isMixerOpen = false; h.render(); old();
  assert.equal(h.ready.length, 1);
  h.mixer.isMixerOpen = true; h.mixer.openedFromDrawer = false;
  const ordinary = h.render();
  assert.equal(find(ordinary, "drawer-mixer-ready"), null);
  assert.deepEqual(ordinary.props.children[0].props.style[1].transform[0].translateX.outputRange, [390, 0]);
  assert.deepEqual(ordinary.props.children[1].props.style[1].opacity.outputRange, [0, 0.55]);
});

test("drawer menu uses the mixer layout destination rather than opening another window after closing", () => {
  const source = read("../components/DrawerMenu.tsx");
  assert.match(source, /selectFromDrawer\(\{ kind: "layout", target: "mixer", run: openMixerFromDrawer \}\)/);
  assert.doesNotMatch(source, /kind: "afterClose", run: openMixer/);
});
