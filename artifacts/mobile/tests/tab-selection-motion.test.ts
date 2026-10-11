import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import React from "react";
import ts from "typescript";
import * as selection from "../constants/tab-selection.ts";
import { TAB_PILL_BAR_H } from "../constants/tab-bar.ts";

function harness() {
  const refs: any[] = [];
  const springs: any[] = [];
  let cursor = 0;
  let previous: any = null;
  let prepare: () => any;
  let react: (next: any, previous: any) => void;
  let animatedStyle: () => any;
  const shared = (value: unknown) => refs[cursor++] ??= { value };
  const reanimated = {
    __esModule: true,
    default: { View: "animated-view" },
    ReduceMotion: { System: "system" },
    useSharedValue: shared,
    useAnimatedReaction: (read: typeof prepare, callback: typeof react) => { prepare = read; react = callback; },
    useAnimatedStyle: (read: typeof animatedStyle) => { animatedStyle = read; return {}; },
    withSpring: (target: number, config: unknown) => {
      springs.push({ start: refs[1].value, target, config });
      return target;
    },
  };
  const source = readFileSync(new URL("../components/TabSelectionIndicator.tsx", import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { jsx: ts.JsxEmit.React, module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  }).outputText;
  const imports: Record<string, unknown> = {
    react: { ...React, useEffect: (fn: () => void) => fn() },
    "react-native": { StyleSheet: { create: (v: unknown) => v } },
    "react-native-reanimated": reanimated,
    "@/constants/tab-selection": selection,
    "@/constants/tab-bar": { TAB_PILL_BAR_H },
  };
  const module = { exports: {} as any };
  vm.runInNewContext(compiled, { module, exports: module.exports, require: (name: string) => imports[name] });
  return {
    refs, springs,
    render(width: number, index: number, count = 5) {
      cursor = 0;
      const node = module.exports.TabSelectionIndicator({ width, count, index });
      const next = prepare();
      react(next, previous);
      previous = next;
      return { node, style: animatedStyle() };
    },
  };
}

test("first layout snaps without an entrance animation; capsule grows another 2px high and 4px wide, centered 1px higher", () => {
  const h = harness();
  assert.equal(h.render(0, 2).style.opacity, 0);
  const { node, style } = h.render(340, 2);
  const slot = (340 - 14) / 5;
  assert.equal(h.springs.length, 0);
  assert.equal(style.transform[0].translateX, slot * 2);
  assert.equal(style.width, slot - 4 + 4);
  assert.equal(node.props.style[0].height, 46 + 2);
  assert.equal(node.props.style[0].top + node.props.style[0].height / 2, TAB_PILL_BAR_H / 2 - 1);
  assert.equal(node.props.style[0].backgroundColor, "rgba(255,255,255,0.1)");
  assert.equal(node.props.pointerEvents, "none");
});

test("quick changes continue from the current position, including reversal, with only one position value", () => {
  const h = harness();
  h.render(340, 0);
  h.render(340, 4);
  h.refs[1].value = 120; // The spring is still travelling when a new tab is selected.
  h.render(340, 1);
  const interrupted = h.springs.at(-1);
  assert.equal(interrupted.start, 120);
  assert.equal(interrupted.target, (340 - 14) / 5);
  assert.equal(interrupted.config.reduceMotion, "system");
  assert.equal(h.refs.length, 2); // One metrics record; one horizontal position.
  h.refs[1].value = 80;
  h.render(340, 0);
  assert.equal(h.springs.at(-1).start, 80);
  assert.equal(h.springs.at(-1).target, 0);
});

test("farther trips have a greater physical overshoot; resizing realigns immediately", () => {
  const near = selection.tabSelectionSpring(1);
  const far = selection.tabSelectionSpring(4);
  const overshoot = (config: typeof near) => {
    const ratio = config.damping / (2 * Math.sqrt(config.stiffness * config.mass));
    return Math.exp(-Math.PI * ratio / Math.sqrt(1 - ratio * ratio));
  };
  assert.ok(overshoot(near) > 0);
  assert.ok(overshoot(far) > overshoot(near));
  assert.ok(overshoot(far) < 0.1);
  const h = harness();
  h.render(340, 4);
  const { style } = h.render(700, 4);
  assert.equal(style.transform[0].translateX, (700 - 14) / 5 * 4);
  assert.equal(h.springs.length, 0);
});
