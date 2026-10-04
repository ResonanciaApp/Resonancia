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
  CANCEL_BUTTON_HEIGHT, DURATION_CONTROL_GAP, MANUAL_START_SHIFT,
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
    startShift: new Value(0, "startShift"),
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

test("four circles shrink sequentially +/20/10/5 at 270 ms, grow 130 px over 460 ms, then wait and fade", () => {
  const h = harness();
  assert.equal(h.transition.start(341, false), true);
  assert.equal(h.transition.start(341, false), false);
  for (const index of [3, 2, 1, 0]) {
    assert.equal(h.jobs.at(-1).value, h.values.scales[index]);
    assert.equal(h.jobs.at(-1).config.duration, 270);
    assert.equal(h.jobs.at(-1).config.useNativeDriver, true);
    assert.equal(h.jobs.at(-1).config.toValue * CIRCLE_DIAMETER, 1);
    h.advance(269);
    assert.equal(h.values.circleOpacities[index].value, 1);
    assert.equal(h.phase, "shrinking");
    h.advance(1);
    assert.equal(h.values.scales[index].value * CIRCLE_DIAMETER, 1);
    assert.equal(h.values.circleOpacities[index].value, 0);
    for (let pending = 0; pending < index; pending++) assert.equal(h.values.scales[pending].value, 1);
  }
  assert.deepEqual(h.jobs.slice(0, 4).map(job => job.start), [0, 270, 540, 810]);
  assert.equal(h.phase, "expanding");
  assert.equal(h.values.manualOpacity.value, 0);
  assert.equal(h.jobs[4].start, 1080);
  assert.equal(SHEET_EXPAND_MS, 460);
  assert.equal(h.jobs[4].config.duration, 460);
  assert.equal(h.jobs[4].config.toValue, 341 + 130);
  assert.equal(h.jobs[4].config.useNativeDriver, false);
  h.advance(SHEET_EXPAND_MS - 1);
  assert.equal(h.phase, "expanding");
  assert.equal(h.jobs.length, 6);
  assert.equal(h.jobs[5].value, h.values.startShift);
  assert.equal(h.jobs[5].config.toValue, -MANUAL_START_SHIFT);
  assert.equal(h.jobs[5].config.duration, SHEET_EXPAND_MS);
  assert.equal(h.jobs[5].config.useNativeDriver, true, "Move with a native transform, not a Fabric layout animation");
  h.advance(1);
  assert.equal(h.phase, "revealing");
  assert.equal(h.values.sheetHeight.value, 471);
  assert.equal(h.jobs[6].start, 1080 + SHEET_EXPAND_MS);
  assert.equal(h.jobs[6].config.duration, MANUAL_FADE_MS);
  assert.equal(h.jobs[6].config.useNativeDriver, true);
  assert.equal(h.jobs[6].config.delay, 200);
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

test("Cancel reverses the exact sequence: fade out, wait, contract, then grow 5/10/20/+ sequentially", () => {
  const h = harness();
  assert.equal(h.transition.reverse(false), false);
  h.transition.start(341, true);
  assert.equal(h.transition.reverse(false), true);
  assert.equal(h.transition.reverse(false), false);
  assert.equal(h.transition.start(341, false), false);
  assert.equal(h.phase, "hiding");
  assert.equal(h.jobs[0].value, h.values.manualOpacity);
  assert.equal(h.jobs[0].config.toValue, 0);
  assert.equal(h.jobs[0].config.duration, MANUAL_FADE_MS);
  assert.equal(h.jobs[0].config.delay, undefined, "The fade-out starts immediately");
  h.advance(MANUAL_FADE_MS - 1);
  assert.equal(h.phase, "hiding");
  assert.equal(h.values.sheetHeight.value, 471);
  h.advance(1);
  assert.equal(h.values.manualOpacity.value, 0);
  assert.equal(h.phase, "contracting");
  for (const job of h.jobs.slice(1)) {
    assert.equal(job.config.duration, SHEET_EXPAND_MS);
    assert.equal(job.config.delay, MANUAL_REVEAL_DELAY_MS);
  }
  assert.equal(h.jobs[1].value, h.values.sheetHeight);
  assert.equal(h.jobs[1].config.toValue, 341);
  assert.equal(h.jobs[1].config.useNativeDriver, false);
  assert.equal(h.jobs[2].value, h.values.startShift);
  assert.equal(h.jobs[2].config.toValue, 0);
  assert.equal(h.jobs[2].config.useNativeDriver, true);
  h.advance(MANUAL_REVEAL_DELAY_MS + SHEET_EXPAND_MS - 1);
  assert.equal(h.phase, "contracting");
  assert.deepEqual(h.values.circleOpacities.map(v => v.value), [0, 0, 0, 0]);
  h.advance(1);
  assert.equal(h.values.sheetHeight.value, 341);
  assert.equal(h.values.startShift.value, 0);
  for (const index of [0, 1, 2, 3]) {
    assert.equal(h.phase, "restoring");
    assert.equal(h.jobs.at(-1).value, h.values.scales[index]);
    assert.equal(h.jobs.at(-1).config.toValue, 1);
    assert.equal(h.jobs.at(-1).config.duration, CIRCLE_SHRINK_MS);
    assert.equal(h.jobs.at(-1).config.useNativeDriver, true);
    assert.equal(h.values.circleOpacities[index].value, 1);
    for (let future = index + 1; future < 4; future++) {
      assert.equal(h.values.circleOpacities[future].value, 0);
    }
    h.advance(CIRCLE_SHRINK_MS - 1);
    assert.equal(h.values.scales[index].value, 1 / CIRCLE_DIAMETER);
    assert.equal(h.transition.isTransitioning(), true);
    h.advance(1);
    assert.equal(h.values.scales[index].value, 1);
  }
  assert.equal(h.phase, "presets");
  assert.equal(h.transition.isTransitioning(), false);
  assert.deepEqual(h.values.circleOpacities.map(v => v.value), [1, 1, 1, 1]);
  assert.equal(h.transition.start(341, false), true, "The + can be used again");
});

test("closing during any reverse stage stops it and ignores stale callbacks after reopening", () => {
  for (const elapsed of [100, 250, 600, 900, 1150, 1450, 1750]) {
    const h = harness();
    h.transition.start(341, true);
    h.transition.reverse(false);
    h.advance(elapsed);
    const oldJob = h.jobs.at(-1);
    h.transition.cancel();
    const count = h.jobs.length;
    oldJob.callback({ finished: true });
    h.advance(10000);
    assert.equal(h.jobs.length, count);
    h.transition.reset();
    h.transition.start(350, true);
    oldJob.callback({ finished: true });
    assert.equal(h.phase, "manual");
    assert.equal(h.values.sheetHeight.value, 480);
  }
});

test("reverse handles reduced motion and interruptions by restoring presets, not reopening the timer", () => {
  for (const elapsed of [undefined, 100, 500, 900, 1500]) {
    const h = harness();
    h.transition.start(341, true);
    h.transition.reverse(elapsed === undefined);
    if (elapsed !== undefined) {
      h.advance(elapsed);
      const oldJob = h.jobs.at(-1);
      h.transition.finishImmediately();
      oldJob.callback({ finished: true });
    } else assert.equal(h.jobs.length, 0);
    assert.equal(h.phase, "presets");
    assert.equal(h.values.sheetHeight.value, 341);
    assert.equal(h.values.manualOpacity.value, 0);
    assert.equal(h.values.startShift.value, 0);
    assert.deepEqual(h.values.scales.map(v => v.value), [1, 1, 1, 1]);
    assert.deepEqual(h.values.circleOpacities.map(v => v.value), [1, 1, 1, 1]);
    assert.equal(h.transition.isTransitioning(), false);
  }
  const interrupted = harness();
  interrupted.transition.start(341, true);
  interrupted.transition.reverse(false);
  interrupted.jobs[0].callback({ finished: false });
  assert.equal(interrupted.phase, "presets");
  assert.equal(interrupted.values.sheetHeight.value, 341);
});

test("close at every stage cancels the sequence, ignores late completions and reopens cleanly", () => {
  for (const elapsed of [100, 300, 550, 850, 1200, 1600, 1800]) {
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
    assert.equal(h.values.startShift.value, 0);
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
    assert.equal(h.values.sheetHeight.value, 480);
    assert.equal(h.values.manualOpacity.value, 1);
    assert.equal(h.values.startShift.value, -MANUAL_START_SHIFT);
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
  const titleLayout = { current: { y: 38, height: 24 } };
  const captured = new Map<string, any>();
  const gates: string[] = [];
  const starts: number[] = [];
  let closes = 0;
  let stateIndex = 0;
  let stateOverrides: any[] = [];
  let componentStyles: any;
  function Native(props: any) {
    if (props.testID) captured.set(props.testID, props);
    return React.createElement("div", null, props.children);
  }
  const mocks: Record<string, any> = {
    react: { ...React, useState: (initial: any) => React.useState(stateOverrides[stateIndex++] ?? initial) },
    "react-native": {
      Animated: { Value, View: Native },
      Modal: Native, Pressable: Native, ScrollView: Native, View: Native, Text: Native,
      StyleSheet: { create: (styles: any) => { componentStyles = styles; return styles; }, absoluteFill: {}, absoluteFillObject: {} },
    },
    "@expo/vector-icons": { Feather: Native },
    "expo-linear-gradient": { LinearGradient: Native },
    "react-native-safe-area-context": { useSafeAreaInsets: () => ({ bottom: 34 }) },
    "@/context/SceneThemeContext": { useSceneTheme: () => ({ theme: { id: "cloudy", gradient: ["#2D2F7C", "#2D3981", "#2D4085"] } }) },
    "@/config/scene-themes": { SCENE_THEMES: { tibet: { gradient: ["#371C5F", "#332261", "#2E2468"] } } },
    "@/hooks/useColors": { useColors: () => ({ foreground: "#fff", muted: "#444" }) },
    "@/hooks/useAmbientalDurationTransition": { useAmbientalDurationTransition: () => ({
      phase: h.phase, values: h.values, transition: h.transition, baselineHeight, startButtonLayout, titleLayout, reducedMotion: { current: false },
    }) },
    "@/lib/ambiental-duration-transition": { CIRCLE_DIAMETER, MANUAL_HEIGHT_INCREASE, CANCEL_BUTTON_HEIGHT, DURATION_CONTROL_GAP },
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
  return { h, render, captured, baselineHeight, gates, starts, styles: componentStyles, get closes() { return closes; } };
}

test("actual sheet UI measures its baseline, blocks stale start presses, locks height and reveals manual controls only at completion", () => {
  const c = componentHarness();
  c.render();
  const get = (id: string) => c.captured.get(`ambiental-duration-${id}`);
  get("sheet-height").onLayout({ nativeEvent: { layout: { height: 341 } } });
  get("start-anchor").onLayout({ nativeEvent: { layout: { y: 240, height: 50 } } });
  get("title").onLayout({ nativeEvent: { layout: { y: 38, height: 24 } } });
  assert.equal(c.baselineHeight.current, 341);
  const staleStart = get("start").onPress;
  get("custom").onPress();
  get("custom").onPress();
  staleStart();
  assert.equal(c.h.jobs.length, 1);
  assert.equal(c.starts.length, 0);
  for (const elapsed of [270, 270, 270, 270, SHEET_EXPAND_MS, 200]) {
    c.h.advance(elapsed);
    c.render();
    assert.equal(get("start").disabled, true);
    assert.equal(flattened(get("start").style({ pressed: false })).opacity, 1,
      "Start remains fully colored while interactions are disabled during the transition");
    assert.equal(get("custom").disabled, true);
    assert.equal(get("manual").pointerEvents, "none");
    assert.equal(flattened(get("sheet-height").style).height, c.h.values.sheetHeight);
    const startStyle = flattened(get("start-anchor").style);
    assert.equal(startStyle.position, "absolute");
    assert.equal(startStyle.bottom, 51);
    assert.equal(startStyle.height, 50);
    assert.equal(startStyle.marginTop, 0);
    const viewportHeight = 900;
    const panelHeight = c.h.values.sheetHeight.value;
    const panelTop = viewportHeight - panelHeight;
    const localButtonY = panelHeight - startStyle.bottom - startStyle.height;
    const translatedY = startStyle.transform[0].translateY.value;
    const shift = c.h.values.sheetHeight.value === 341 ? 0 : 66;
    assert.equal(panelTop + localButtonY + translatedY, viewportHeight - 341 + 240 - shift, "Start moves into the previous Cancel slot");
    get("start-anchor").onLayout({ nativeEvent: { layout: { y: localButtonY, height: 50 } } });
  }
  assert.equal(c.h.values.sheetHeight.value, 341 + 130);
  assert.ok(get("cancel"), "Cancel appears inside the locked height, not as an extra height increase");
  assert.equal(flattened(get("cancel").style({ pressed: false })).backgroundColor, "rgba(249,249,249,0.6)");
  c.h.advance(180);
  c.render();
  assert.equal(get("manual").pointerEvents, "auto");
  assert.equal(get("start").disabled, false);
  const finalStartStyle = flattened(get("start-anchor").style);
  assert.equal(finalStartStyle.bottom, 51, "Growing-layout events must not overwrite the original anchor");
  assert.equal(finalStartStyle.transform[0].translateY.value, -66);
  const cancelAnchor = flattened(get("cancel-anchor").style);
  assert.equal(cancelAnchor.position, "absolute");
  assert.equal(cancelAnchor.bottom, 51);
  const cancelStyle = flattened(get("cancel").style({ pressed: false }));
  assert.equal(cancelStyle.height, finalStartStyle.height, "Cancel matches the measured Start height");
  assert.equal(cancelStyle.borderRadius, c.styles.startButton.borderRadius);
  assert.equal(c.styles.startButtonText.fontWeight, "800");
  assert.equal(900 - cancelAnchor.bottom - cancelStyle.height, 900 - 341 + 240,
    "Cancel occupies the initial Start position");
  const timerStyle = flattened(get("manual").style);
  const titleBottom = 38 + 24 + 20;
  const startTop = 471 - finalStartStyle.bottom - finalStartStyle.height + finalStartStyle.transform[0].translateY.value;
  assert.equal(timerStyle.top + timerStyle.height / 2, (titleBottom + startTop) / 2,
    "The timer is centered exactly between the title and Start");
  assert.equal(timerStyle.top - titleBottom, startTop - timerStyle.top - timerStyle.height);
  assert.equal(c.styles.wheelNumber.fontSize, 17);
  assert.equal(c.styles.wheelSuffix.fontSize, 12);
  get("start").onPress();
  assert.deepEqual(c.starts, [10]);
  get("cancel").onPress();
  assert.equal(c.closes, 0, "Cancel returns to presets without dismissing the sheet");
  c.render();
  assert.equal(get("cancel").disabled, true);
  const reverseJobs = c.h.jobs.length;
  get("cancel").onPress();
  assert.equal(c.h.jobs.length, reverseJobs, "Repeated Cancel presses cannot start overlapping sequences");
  for (const elapsed of [MANUAL_FADE_MS, MANUAL_REVEAL_DELAY_MS, SHEET_EXPAND_MS, 270, 270, 270]) {
    c.h.advance(elapsed);
    c.render();
    assert.equal(get("start").disabled, true);
    assert.equal(flattened(get("start").style({ pressed: false })).opacity, 1);
    assert.equal(get("custom").disabled, true);
    assert.equal(get("manual").pointerEvents, "none");
    get("start").onPress();
  }
  assert.deepEqual(c.starts, [10], "No session starts during the reverse transition");
  c.h.advance(270);
  c.render();
  assert.equal(c.closes, 0);
  assert.equal(c.h.phase, "presets");
  assert.equal(get("cancel"), undefined);
  assert.equal(get("start").disabled, false);
  assert.equal(get("custom").disabled, false);
  assert.equal(flattened(get("sheet-height").style).height, undefined);
  assert.equal(flattened(get("start-anchor").style).position, undefined);
  get("start").onPress();
  assert.deepEqual(c.starts, [10, 10]);
  get("custom").onPress();
  assert.equal(c.h.phase, "shrinking");
});

test("Start moves smoothly only during expansion and stays separate from the lower Cancel slot", () => {
  const c = componentHarness();
  c.render();
  const get = (id: string) => c.captured.get(`ambiental-duration-${id}`);
  get("sheet-height").onLayout({ nativeEvent: { layout: { height: 341 } } });
  get("start-anchor").onLayout({ nativeEvent: { layout: { y: 240, height: 50 } } });
  get("custom").onPress();
  c.h.advance(4 * CIRCLE_SHRINK_MS);
  c.render();
  assert.equal(flattened(get("start-anchor").style).transform[0].translateY.value, 0);
  c.h.values.sheetHeight.setValue(341 + 65);
  c.h.values.startShift.setValue(-33);
  c.render();
  assert.equal(flattened(get("start-anchor").style).transform[0].translateY.value, -33);
  c.h.advance(SHEET_EXPAND_MS + 200 + 180);
  c.render();
  const startStyle = flattened(get("start-anchor").style);
  const cancelStyle = flattened(get("cancel-anchor").style);
  assert.equal(startStyle.transform[0].translateY.value, -66);
  const startBottomOnScreen = 900 - startStyle.bottom + startStyle.transform[0].translateY.value;
  const cancelButtonStyle = flattened(get("cancel").style({ pressed: false }));
  const cancelTopOnScreen = 900 - cancelStyle.bottom - cancelButtonStyle.height;
  assert.ok(cancelTopOnScreen > startBottomOnScreen, "Cancel is below Start without overlap");
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
  assert.equal(flattened(c.captured.get("ambiental-duration-start").style({ pressed: false })).opacity, 0.45,
    "A zero-duration selection still keeps its validation feedback");
  assert.match(source, /customHours === MAX_CUSTOM_HOURS \? \[0\] : MINUTES/);
  assert.match(source, /if \(hours === MAX_CUSTOM_HOURS\) setCustomMinutes\(0\)/);
  assert.match(source, /circleSlot:\s*\{\s*width: CIRCLE_DIAMETER,\s*height: CIRCLE_DIAMETER/);
  assert.equal((source.match(/style=\{styles.circleSlot\}/g) ?? []).length, 2, "Preset map and + keep fixed slots");
});