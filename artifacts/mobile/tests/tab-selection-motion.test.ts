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
  let geometry: any = {};
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
    sampleStyle: () => ({ ...geometry, ...animatedStyle() }),
    animatedStyle: () => animatedStyle(),
    render(width: number, index: number, count = 5) {
      cursor = 0;
      const node = module.exports.TabSelectionIndicator({ width, count, index });
      geometry = node.props.style[1];
      const next = prepare();
      react(next, previous);
      previous = next;
      return { node, style: { ...geometry, ...animatedStyle() } };
    },
  };
}

test("first layout snaps without entrance animation; tighter icons preserve capsule dimensions", () => {
  const h = harness();
  assert.equal(h.render(0, 2).style.opacity, 0);
  const { node, style } = h.render(340, 2);
  const slot = (340 - selection.TAB_ROW_PADDING * 2) / 5;
  assert.equal(h.springs.length, 0);
  assert.equal(style.transform[0].translateX, slot * 2);
  assert.equal(style.width, (340 - 14) / 5 + 14);
  assert.equal(node.props.style[0].left, selection.TAB_ROW_PADDING + selection.TAB_SELECTION_INSET);
  assert.equal(slot - 26.5, (340 - 14) / 5 - 25 - 4, "visible icon gaps are exactly 4px smaller");
  assert.equal(node.props.style[0].height, 48 + 2);
  assert.equal(node.props.style[0].top, 3);
  assert.equal(node.props.style[0].top + node.props.style[0].height, 53);
  assert.equal(node.props.style[0].top + node.props.style[0].height / 2, TAB_PILL_BAR_H / 2 - 1);
  assert.equal(node.props.style[0].backgroundColor, "rgba(255,255,255,0.1)");
  assert.equal(node.props.pointerEvents, "none");
  assert.deepEqual(Object.keys(h.animatedStyle()), ["transform"], "spring frames must not send layout properties");
});

test("quick changes continue from the current position, including reversal, with only one position value", () => {
  const h = harness();
  h.render(340, 0);
  h.render(340, 4);
  h.refs[1].value = 120; // The spring is still travelling when a new tab is selected.
  h.render(340, 1);
  const interrupted = h.springs.at(-1);
  assert.equal(interrupted.start, 120);
  assert.equal(interrupted.target, (340 - selection.TAB_ROW_PADDING * 2) / 5);
  assert.equal(interrupted.config.reduceMotion, "system");
  assert.equal(h.refs.length, 2); // One metrics record; one horizontal position.
  h.refs[1].value = 80;
  h.render(340, 0);
  assert.equal(h.springs.at(-1).start, 80);
  assert.equal(h.springs.at(-1).target, 0);
});

test("end-to-end trips have much less overshoot while short trips and resizing stay unchanged", () => {
  const near = selection.tabSelectionSpring(1);
  const far = selection.tabSelectionSpring(4);
  const overshoot = (config: typeof near) => {
    const ratio = config.damping / (2 * Math.sqrt(config.stiffness * config.mass));
    return Math.exp(-Math.PI * ratio / Math.sqrt(1 - ratio * ratio));
  };
  assert.ok(overshoot(near) > 0);
  assert.ok(overshoot(far) < overshoot(near));
  assert.ok(overshoot(far) < 0.006);
  assert.equal(near.damping, 27.4);
  const h = harness();
  h.render(340, 4);
  const { style } = h.render(700, 4);
  assert.equal(style.transform[0].translateX, (700 - selection.TAB_ROW_PADDING * 2) / 5 * 4);
  assert.equal(h.springs.length, 0);
});

test("the entire capsule stays inside the bar during overshoot in both directions", () => {
  for (const width of [320, 340, 768]) {
    const h = harness();
    const { node } = h.render(width, 0);
    const slot = (width - selection.TAB_ROW_PADDING * 2) / 5;
    for (const position of [-10000, -20, 0, slot * 2, slot * 4 + 20, 10000]) {
      h.refs[1].value = position;
      const style = h.sampleStyle();
      const left = node.props.style[0].left + style.transform[0].translateX;
      assert.ok(left >= 1);
      assert.ok(left + style.width <= width - 1 + 1e-9);
    }
  }
});

test("retargeting during edge compression keeps its coordinate without a second compression", () => {
  const h = harness();
  h.render(340, 4);
  h.refs[1].value = 1000;
  const visible = h.sampleStyle().transform[0].translateX;
  h.render(340, 0);
  assert.equal(h.springs.at(-1).start, 1000);
  const slot = (340 - selection.TAB_ROW_PADDING * 2) / 5;
  assert.equal(selection.tabSelectionTranslation(h.springs.at(-1).start, slot, 5), visible);
  assert.equal(h.springs.at(-1).target, 0);
  assert.equal(h.springs.at(-1).config.damping, selection.tabSelectionSpring(4, visible).damping);
});

test("Inicio–Perfil adds one pixel of rebound in either direction, without changing short trips or bounds", () => {
  const peak = (config: ReturnType<typeof selection.tabSelectionSpring>, pixels: number) => {
    const ratio = config.damping / (2 * Math.sqrt(config.stiffness * config.mass));
    return pixels * Math.exp(-Math.PI * ratio / Math.sqrt(1 - ratio * ratio));
  };
  for (const width of [320, 340, 402, 768]) {
    const h = harness();
    const slot = (width - selection.TAB_ROW_PADDING * 2) / 5;
    const travel = slot * 4;
    const originalPeak = peak(selection.tabSelectionSpring(4), travel);
    h.render(width, 0);
    h.render(width, 4);
    const forward = h.springs.at(-1).config;
    h.render(width, 0);
    const backward = h.springs.at(-1).config;
    assert.equal(forward.damping, backward.damping);
    assert.ok(Math.abs(peak(forward, travel) - originalPeak - 1) < 1e-9);
    assert.ok(peak(forward, travel) < 4, "Extra rebound fits inside the existing safe margin");
    const visiblePeak = selection.tabSelectionTranslation(travel + peak(forward, travel), slot, 5) - travel;
    assert.ok(visiblePeak > 0 && visiblePeak <= peak(forward, travel) + 1e-9);
    for (const distance of [1, 2, 3]) {
      assert.deepEqual(selection.tabSelectionSpring(distance, slot * distance), selection.tabSelectionSpring(distance));
    }
  }
});

test("edge rebound keeps moving past the old 4px clamp with a continuous slope", () => {
  const slot = (340 - selection.TAB_ROW_PADDING * 2) / 5;
  const last = slot * 4;
  for (const direction of [-1, 1]) {
    const edge = direction < 0 ? 0 : last;
    const at = (distance: number) => direction * (selection.tabSelectionTranslation(edge + direction * distance, slot, 5) - edge);
    assert.ok(at(6) > at(5));
    assert.ok(at(5) > at(4));
    assert.ok(at(6) < 4);
    const step = 0.0001;
    const leftSlope = (at(2) - at(2 - step)) / step;
    const rightSlope = (at(2 + step) - at(2)) / step;
    assert.ok(Math.abs(leftSlope - rightSlope) < 0.001);
    assert.equal(at(1), 1);
  }
});
