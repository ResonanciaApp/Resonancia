import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import React from "react";
import ts from "typescript";

const src = readFileSync(new URL("../components/ReflectionCategoryTabFill.tsx", import.meta.url), "utf8");
const compiled = ts.transpileModule(src, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true },
}).outputText;

function load(reduce: boolean) {
  const timings: any[] = [], stops: number[] = [], sets: number[] = [];
  let cleanup: any, effect: any;
  let savedRef: any;
  class Value { constructor(_v: number) {} setValue(v: number) { sets.push(v); } }
  const mocks: any = {
    react: { ...React, useRef: (i: any) => (savedRef ??= { current: i }), useEffect: (fn: any) => { effect = fn; } },
    "react-native": {
      View: "view", StyleSheet: { create: (s: any) => s, absoluteFill: {}, absoluteFillObject: {} },
      Animated: { Value, View: "animated-view",
        timing: (_v: any, cfg: any) => { timings.push(cfg); return { start() {}, stop() { stops.push(1); } }; } },
      Easing: { inOut: (e: any) => ["inOut", e], cubic: "cubic" },
    },
    "expo-blur": { BlurView: "blur" },
  };
  const m: any = { exports: {} };
  new Function("require", "module", "exports", compiled)((n: string) => mocks[n], m, m.exports);
  const Fill = m.exports.ReflectionCategoryTabFill.type ?? m.exports.ReflectionCategoryTabFill;
  const tree: any = (m.exports.ReflectionCategoryTabFill.type ?? Fill)({ selected: true, reduceMotion: reduce });
  cleanup = effect();
  return { timings, stops, sets, cleanup, tree,
    rerender(selected: boolean) {
      cleanup?.();
      const next = Fill({ selected, reduceMotion: reduce });
      cleanup = effect();
      return next;
    },
    dispose() { cleanup?.(); },
  };
}

test("fill uses the Premium fade config and stops on cleanup", () => {
  const r = load(false);
  assert.equal(r.timings[0].duration, 400);
  assert.equal(r.timings[0].toValue, 1);
  assert.equal(r.timings[0].useNativeDriver, true);
  assert.deepEqual(r.timings[0].easing, ["inOut", "cubic"]);
  r.cleanup();
  assert.equal(r.stops.length, 1);
  assert.equal(r.tree.props.pointerEvents, "none");
});

test("reduce motion sets the value without animating", () => {
  const r = load(true);
  assert.equal(r.timings.length, 0);
  assert.deepEqual(r.sets, [1]);
  r.rerender(false);
  assert.deepEqual(r.sets, [1, 0]);
  assert.equal(r.timings.length, 0);
});

test("deselection reverses the same native opacity fade without removing its overlay", () => {
  const r = load(false);
  const initialAnimated = (React.Children.toArray(r.tree.props.children) as any[])[1];
  const next = r.rerender(false);
  const nextAnimated = (React.Children.toArray(next.props.children) as any[])[1];
  assert.equal(r.stops.length, 1, "the previous animation stops before the reverse fade");
  assert.equal(nextAnimated.type, initialAnimated.type);
  assert.equal(nextAnimated.props.style[1].opacity, initialAnimated.props.style[1].opacity);
  assert.equal(r.timings[1].toValue, 0);
  assert.equal(r.timings[1].duration, 400);
  assert.equal(r.timings[1].useNativeDriver, true);
  assert.deepEqual(r.timings[1].easing, ["inOut", "cubic"]);
  r.dispose();
  assert.equal(r.stops.length, 2);
});

test("fill source keeps Premium colors and blur", () => {
  for (const t of ["rgba(255,255,255,0.10)", "rgba(107,80,210,0.60)", "intensity={38}", 'tint="light"', "dimezisBlurView"])
    assert.ok(src.includes(t), t);
});
