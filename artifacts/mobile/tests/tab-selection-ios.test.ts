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
  const effects: any[] = [];
  const springs: any[] = [];
  const callbacks: Array<() => void> = [];
  let refCursor = 0, effectCursor = 0, reduced = false;
  let changeMotion: (value: boolean) => void;
  let removed = false;
  class Value {
    value: number;
    constructor(value: number) { this.value = value; }
    setValue(value: number) { this.value = value; }
    stopAnimation(callback?: (value: number) => void) {
      if (callback) {
        const position = this.value;
        callbacks.push(() => callback(position));
      }
    }
    interpolate(config: any) { return config; }
  }
  const imports: Record<string, any> = {
    react: {
      ...React,
      useRef: (value: any) => refs[refCursor++] ??= { current: value },
      useState: () => [reduced, (value: boolean) => { reduced = value; }],
      useMemo: (fn: () => any) => fn(),
      useEffect: (fn: () => any, deps: any[]) => {
        const i = effectCursor++;
        if (effects[i]?.deps.every((value: any, j: number) => Object.is(value, deps[j]))) return;
        effects[i]?.cleanup?.();
        effects[i] = { deps, cleanup: fn() };
      },
    },
    "react-native": {
      StyleSheet: { create: (value: any) => value },
      Animated: {
        Value, View: "native-animated-view",
        spring: (value: Value, config: any) => ({
          start: () => springs.push({ start: value.value, config }),
        }),
      },
      AccessibilityInfo: {
        addEventListener: (_: string, callback: typeof changeMotion) => {
          changeMotion = callback;
          return { remove: () => { removed = true; } };
        },
        isReduceMotionEnabled: () => Promise.resolve(false),
      },
    },
    "@/constants/tab-selection": selection,
    "@/constants/tab-bar": { TAB_PILL_BAR_H },
  };
  const source = readFileSync(new URL("../components/TabSelectionIndicator.ios.tsx", import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { jsx: ts.JsxEmit.React, module: ts.ModuleKind.CommonJS, esModuleInterop: true },
    reportDiagnostics: true,
  });
  assert.equal(compiled.diagnostics?.length, 0);
  const module = { exports: {} as any };
  vm.runInNewContext(compiled.outputText, { module, exports: module.exports, require: (name: string) => imports[name] });
  return {
    refs, springs, callbacks,
    motion: (value: boolean) => changeMotion(value),
    unmount: () => effects.forEach(effect => effect.cleanup?.()),
    removed: () => removed,
    render(width: number, index: number) {
      refCursor = effectCursor = 0;
      return module.exports.TabSelectionIndicator({ width, count: 5, index });
    },
  };
}

test("iOS keeps geometry and sends its spring to the native driver after confirmed navigation", () => {
  const h = harness();
  const node = h.render(340, 0);
  assert.equal(h.springs.length, 0);
  assert.equal(node.props.style[1].width, (340 - selection.TAB_ROW_PADDING * 2) / 5 - selection.TAB_SELECTION_INSET * 2);
  assert.equal(node.props.style[0].height, 50);
  assert.equal(node.props.style[0].backgroundColor, selection.TAB_SELECTION_BACKGROUND);
  h.render(340, 4);
  h.callbacks.shift()!();
  assert.equal(h.springs.length, 1);
  assert.equal(h.springs[0].config.useNativeDriver, true);
  assert.equal(h.springs[0].config.isInteraction, false);
  assert.equal(h.springs[0].config.toValue, (340 - selection.TAB_ROW_PADDING * 2) / 5 * 4);
  // Identical props do not restart an in-flight spring.
  h.render(340, 4);
  assert.equal(h.callbacks.length, 0);
});

test("rapid iOS taps discard stale native callbacks and start at the actual position", () => {
  const h = harness();
  h.render(340, 0);
  h.render(340, 4);
  h.refs[0].current.value = 120;
  h.render(340, 1);
  h.callbacks.shift()!();
  assert.equal(h.springs.length, 0);
  h.callbacks.shift()!();
  assert.equal(h.springs[0].start, 120);
  assert.equal(h.springs[0].config.toValue, (340 - selection.TAB_ROW_PADDING * 2) / 5);
});

test("iOS handles rotation, Reduce Motion, and unmount while awaiting native position", () => {
  const h = harness();
  h.render(340, 0);
  h.render(340, 4);
  h.render(700, 4);
  h.callbacks.shift()!();
  assert.equal(h.springs.length, 0);
  assert.equal(h.refs[0].current.value, (700 - selection.TAB_ROW_PADDING * 2) / 5 * 4);
  h.motion(true);
  h.render(700, 0);
  assert.equal(h.refs[0].current.value, 0);
  assert.equal(h.callbacks.length, 0);
  h.motion(false);
  h.render(700, 1);
  h.unmount();
  h.callbacks.shift()!();
  assert.equal(h.springs.length, 0);
  assert.equal(h.removed(), true);
});

test("native interpolation is linear between all icons and stays inside the pill at the edges", () => {
  const h = harness();
  const node = h.render(340, 0);
  const { inputRange, outputRange } = node.props.style[1].transform[0].translateX;
  const last = (340 - selection.TAB_ROW_PADDING * 2) / 5 * 4;
  for (let i = 0; i < inputRange.length; i++) {
    if (i > 0) assert.ok(inputRange[i] > inputRange[i - 1]);
    assert.ok(outputRange[i] >= -4 && outputRange[i] <= last + 4);
    if (inputRange[i] >= 0 && inputRange[i] <= last) assert.equal(outputRange[i], inputRange[i]);
  }
});
