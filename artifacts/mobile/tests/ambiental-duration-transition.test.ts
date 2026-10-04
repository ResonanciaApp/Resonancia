import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { URL } from "node:url";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";
import {
  createDurationTransition, CIRCLE_DIAMETER, CIRCLE_SHRINK_MS,
  MANUAL_HEIGHT_INCREASE, SHEET_EXPAND_MS, MANUAL_FADE_MS, MANUAL_REVEAL_DELAY_MS,
  type DurationPhase,
} from "../lib/ambiental-duration-transition.ts";

class Value {
  constructor(public value: number, public name = "") {}
  setValue(value: number) { this.value = value; }
  stopAnimation() {}
}
function harness() {
  let now = 0;
  let phase: DurationPhase = "presets";
  const phases: DurationPhase[] = [];
  const jobs: any[] = [];
  const values = {
    scales: Array.from({ length: 4 }, (_, i) => new Value(1, `circle-${i}`)),
    circleOpacities: Array.from({ length: 4 }, () => new Value(1)),
    sheetHeight: new Value(320, "height"),
    manualOpacity: new Value(0, "manual"),
  };
  const transition = createDurationTransition({
    values,
    onPhase: next => { phase = next; phases.push(next); },
    timing: (value, config) => {
      const job: any = { value, config, stopped: false, completed: false };
      return {
        start(callback) {
          Object.assign(job, { callback, start: now, end: now + (config.delay ?? 0) + config.duration });
          jobs.push(job);
        },
        stop() { job.stopped = true; job.callback?.({ finished: false }); },
      };
    },
  });
  const advance = (ms: number) => {
    const end = now + ms;
    for (;;) {
      const job = jobs.find(j => !j.stopped && !j.completed && j.end <= end);
      if (!job) break;
      now = job.end;
      job.completed = true;
      job.value.setValue(job.config.toValue);
      job.callback({ finished: true });
    }
    now = end;
  };
  return { transition, values, jobs, phases, advance, get phase() { return phase; } };
}

test("four circles shrink sequentially +/20/10/5 at 350 ms, grow 95 px, wait 200 ms, then fade the clock", () => {
  const h = harness();
  assert.equal(h.transition.start(341, false), true);
  assert.equal(h.transition.start(341, false), false);
  for (const index of [3, 2, 1, 0]) {
    assert.equal(h.jobs.at(-1).value, h.values.scales[index]);
    assert.equal(h.jobs.at(-1).config.duration, 350);
    assert.equal(h.jobs.at(-1).config.useNativeDriver, true);
    assert.equal(h.jobs.at(-1).config.toValue * CIRCLE_DIAMETER, 1);
    h.advance(349);
    assert.equal(h.values.circleOpacities[index].value, 1);
    assert.equal(h.phase, "shrinking");
    h.advance(1);
    assert.equal(h.values.scales[index].value * CIRCLE_DIAMETER, 1);
    assert.equal(h.values.circleOpacities[index].value, 0);
    for (let pending = 0; pending < index; pending++) assert.equal(h.values.scales[pending].value, 1);
  }
  assert.deepEqual(h.jobs.slice(0, 4).map(job => job.start), [0, 350, 700, 1050]);
  assert.equal(h.phase, "expanding");
  assert.equal(h.values.manualOpacity.value, 0);
  assert.equal(h.jobs[4].start, 1400);
  assert.equal(h.jobs[4].config.toValue, 341 + 95);
  assert.equal(h.jobs[4].config.useNativeDriver, false);
  h.advance(SHEET_EXPAND_MS - 1);
  assert.equal(h.phase, "expanding");
  assert.equal(h.jobs.length, 5);
  h.advance(1);
  assert.equal(h.phase, "revealing");
  assert.equal(h.values.sheetHeight.value, 436);
  assert.equal(h.jobs[5].start, 1400 + SHEET_EXPAND_MS);
  assert.equal(h.jobs[5].config.duration, MANUAL_FADE_MS);
  assert.equal(h.jobs[5].config.useNativeDriver, true);
  assert.equal(h.jobs[5].config.delay, 200);
  h.advance(MANUAL_REVEAL_DELAY_MS);
  assert.equal(h.values.manualOpacity.value, 0);
  assert.equal(h.transition.isTransitioning(), true);
  h.advance(MANUAL_FADE_MS - 1);
  assert.equal(h.transition.isTransitioning(), true);
  h.advance(1);
  assert.equal(h.phase, "manual");
  assert.equal(h.values.manualOpacity.value, 1);
  assert.equal(h.transition.isTransitioning(), false);
  assert.equal(h.transition.start(341, false), false);
});

test("close at every stage cancels the sequence, ignores late completions and reopens cleanly", () => {
  for (const elapsed of [100, 400, 800, 1200, 1450, 1700, 1900]) {
    const h = harness();
    h.transition.start(320, false);
    h.advance(elapsed);
    const oldJob = h.jobs.at(-1);
    h.transition.cancel();
    const count = h.jobs.length;
    oldJob.callback({ finished: true });
    h.advance(10000);
    assert.equal(h.jobs.length, count);
    assert.notEqual(h.phase, "manual");
    h.transition.reset();
    assert.equal(h.phase, "presets");
    assert.deepEqual(h.values.scales.map(v => v.value), [1, 1, 1, 1]);
    assert.deepEqual(h.values.circleOpacities.map(v => v.value), [1, 1, 1, 1]);
    assert.equal(h.values.manualOpacity.value, 0);
    assert.equal(h.transition.start(367, false), true);
    oldJob.callback({ finished: true });
    assert.equal(h.phase, "shrinking");
    h.advance(4 * CIRCLE_SHRINK_MS + SHEET_EXPAND_MS + MANUAL_REVEAL_DELAY_MS + MANUAL_FADE_MS);
    assert.equal(h.values.sheetHeight.value, 367 + MANUAL_HEIGHT_INCREASE);
    assert.equal(h.phase, "manual");
  }
});

test("unexpected interruption restores presets, and reduced motion reaches the same final height without animation", () => {
  const interrupted = harness();
  interrupted.transition.start(320, false);
  interrupted.jobs[0].callback({ finished: false });
  assert.equal(interrupted.phase, "presets");
  assert.equal(interrupted.transition.isTransitioning(), false);
  for (const midSequence of [false, true]) {
    const h = harness();
    h.transition.start(350, !midSequence);
    if (midSequence) {
      h.advance(800);
      const old = h.jobs.at(-1);
      h.transition.finishImmediately();
      old.callback({ finished: true });
    } else assert.equal(h.jobs.length, 0);
    assert.equal(h.phase, "manual");
    assert.equal(h.values.sheetHeight.value, 445);
    assert.equal(h.values.manualOpacity.value, 1);
    assert.deepEqual(h.values.circleOpacities.map(v => v.value), [0, 0, 0, 0]);
  }
  assert.equal(harness().transition.start(0, false), false, "Wait for actual layout measurement");
});

const source = readFileSync(new URL("../components/AmbientalDurationSheet.tsx", import.meta.url), "utf8");
const flattened = (style: any): any => Array.isArray(style)
  ? Object.assign({}, ...style.filter(Boolean).map(flattened)) : style ?? {};
function componentHarness() {
  const h = harness();
  const baselineHeight = { current: 0 };
  const startButtonLayout = { current: { y: 218, height: 54 } };
  const captured = new Map<string, any>();
  const gates: string[] = [];
  const starts: number[] = [];
  let closes = 0;
  let stateIndex = 0;
  let stateOverrides: any[] = [];
  function Native(props: any) {
    if (props.testID) captured.set(props.testID, props);
    return React.createElement("div", null, props.children);
  }
  const mocks: Record<string, any> = {
    react: { ...React, useState: (initial: any) => React.useState(stateOverrides[stateIndex++] ?? initial) },
    "react-native": {
      Animated: { Value, View: Native },
      Modal: Native, Pressable: Native, ScrollView: Native, View: Native, Text: Native,
      StyleSheet: { create: (styles: any) => styles, absoluteFill: {}, absoluteFillObject: {} },
    },
    "@expo/vector-icons": { Feather: Native },
    "expo-linear-gradient": { LinearGradient: Native },
    "react-native-safe-area-context": { useSafeAreaInsets: () => ({ bottom: 34 }) },
    "@/context/SceneThemeContext": { useSceneTheme: () => ({ theme: { id: "cloudy", gradient: ["#2D2F7C", "#2D3981", "#2D4085"] } }) },
    "@/config/scene-themes": { SCENE_THEMES: { tibet: { gradient: ["#371C5F", "#332261", "#2E2468"] } } },
    "@/hooks/useColors": { useColors: () => ({ foreground: "#fff", muted: "#444" }) },
    "@/hooks/useAmbientalDurationTransition": { useAmbientalDurationTransition: () => ({
      phase: h.phase, values: h.values, transition: h.transition, baselineHeight, startButtonLayout, reducedMotion: { current: false },
    }) },
    "@/lib/ambiental-duration-transition": { CIRCLE_DIAMETER, MANUAL_HEIGHT_INCREASE },
    "@/lib/premiumGate": { FREE_TIMER_MAX_MINUTES: 20, showPremiumGate: (message: string) => gates.push(message) },
    "@/constants/colors": { REGISTER_BUTTON_ENABLED_BACKGROUND: "#BE9650" },
    "@/components/PremiumPlansOverlay": { PremiumPlansSurface: Native, usePremiumPlansModalHost: () => ({ visible: false }) },
    "react-native-svg": { __esModule: true, default: Native, Path: Native },
  };
  const exported: any = {};
  new Function("exports", "require", ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true },
  }).outputText)(exported, (name: string) => {
    assert.ok(name in mocks, name);
    return mocks[name];
  });
  const render = (premium = true, overrides: any[] = []) => {
    stateIndex = 0;
    stateOverrides = overrides;
    captured.clear();
    renderToStaticMarkup(React.createElement(exported.AmbientalDurationSheet, {
      visible: true, isPremium: premium, onClose: () => closes++,
      onStart: (minutes: number) => starts.push(minutes),
    }));
  };
  return { h, render, captured, baselineHeight, gates, starts, get closes() { return closes; } };
}

test("actual sheet UI measures its baseline, blocks stale start presses, locks height and reveals manual controls only at completion", () => {
  const c = componentHarness();
  c.render();
  const get = (id: string) => c.captured.get(`ambiental-duration-${id}`);
  get("sheet-height").onLayout({ nativeEvent: { layout: { height: 341 } } });
  get("start").onLayout({ nativeEvent: { layout: { y: 240, height: 50 } } });
  assert.equal(c.baselineHeight.current, 341);
  const staleStart = get("start").onPress;
  get("custom").onPress();
  get("custom").onPress();
  staleStart();
  assert.equal(c.h.jobs.length, 1);
  assert.equal(c.starts.length, 0);
  for (const elapsed of [350, 350, 350, 350, 280, 200]) {
    c.h.advance(elapsed);
    c.render();
    assert.equal(get("start").disabled, true);
    assert.equal(get("custom").disabled, true);
    assert.equal(get("manual").pointerEvents, "none");
    assert.equal(flattened(get("sheet-height").style).height, c.h.values.sheetHeight);
    const startStyle = flattened(get("start").style({ pressed: false }));
    assert.equal(startStyle.position, "absolute");
    assert.equal(startStyle.bottom, 51);
    assert.equal(startStyle.height, 50);
    assert.equal(startStyle.marginTop, 0);
    const viewportHeight = 900;
    const panelHeight = c.h.values.sheetHeight.value;
    const panelTop = viewportHeight - panelHeight;
    const localButtonY = panelHeight - startStyle.bottom - startStyle.height;
    assert.equal(panelTop + localButtonY, viewportHeight - 341 + 240, "Expansion must not move Start on screen");
    get("start").onLayout({ nativeEvent: { layout: { y: localButtonY, height: 50 } } });
  }
  assert.equal(c.h.values.sheetHeight.value, 341 + 95);
  assert.ok(get("cancel"), "Cancel appears inside the locked height, not as an extra height increase");
  assert.equal(flattened(get("cancel").style({ pressed: false })).backgroundColor, "rgba(249,249,249,0.6)");
  c.h.advance(180);
  c.render();
  assert.equal(get("manual").pointerEvents, "auto");
  assert.equal(get("start").disabled, false);
  const finalStartStyle = flattened(get("start").style({ pressed: false }));
  assert.equal(finalStartStyle.bottom, 51, "Growing-layout events must not overwrite the original anchor");
  const cancelAnchor = flattened(get("cancel-anchor").style);
  assert.equal(cancelAnchor.position, "absolute");
  assert.equal(cancelAnchor.bottom, finalStartStyle.bottom + finalStartStyle.height + 12,
    "Cancel sits above the fixed Start button with no overlap");
  get("start").onPress();
  assert.deepEqual(c.starts, [10]);
  get("cancel").onPress();
  assert.equal(c.closes, 1);
});

test("manual validation, eight-hour cap, free Premium gate and preset slot geometry remain intact", () => {
  const c = componentHarness();
  c.baselineHeight.current = 320;
  c.h.transition.start(320, true);
  c.render(false, [true, 10, 8, 0]);
  c.captured.get("ambiental-duration-start").onPress();
  assert.equal(c.gates.length, 1);
  assert.deepEqual(c.starts, []);
  c.render(true, [true, 10, 8, 0]);
  c.captured.get("ambiental-duration-start").onPress();
  assert.deepEqual(c.starts, [480]);
  c.render(true, [true, 10, 0, 0]);
  assert.equal(c.captured.get("ambiental-duration-start").disabled, true);
  assert.match(source, /customHours === MAX_CUSTOM_HOURS \? \[0\] : MINUTES/);
  assert.match(source, /if \(hours === MAX_CUSTOM_HOURS\) setCustomMinutes\(0\)/);
  assert.match(source, /circleSlot:\s*\{\s*width: CIRCLE_DIAMETER,\s*height: CIRCLE_DIAMETER/);
  assert.equal((source.match(/style=\{styles.circleSlot\}/g) ?? []).length, 2, "Preset map and + keep fixed slots");
});