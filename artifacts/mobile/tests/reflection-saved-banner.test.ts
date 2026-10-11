import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { URL } from "node:url";
import test from "node:test";
import React from "react";
import ts from "typescript";
import { CONFIRMATION_ENTRY_DELAY_MS } from "../constants/confirmation-banner.ts";
import { getTabBarGlassOverlay, TAB_PILL_BLUR_INTENSITY, TAB_PILL_BLUR_TINT } from "../constants/tab-bar.ts";

function harness(platform = "ios", themeId = "cloudy") {
  class Value {
    constructor(public value: number) {}
    setValue(value: number) { this.value = value; }
    stopAnimation() {}
  }
  const refs: any[] = [];
  const states: any[] = [];
  const animations: any[] = [];
  const haptics: string[] = [];
  const timers = new Map<number, { at: number; callback: () => void }>();
  let refIndex = 0, stateIndex = 0, clock = 0, timerId = 0, presses = 0;
  let focused = true;
  let previousDeps: unknown[] | undefined;
  let memoizedCallback: any;
  let previousFocusCallback: any;
  let previousFocused = false;
  let cleanup: (() => void) | undefined;
  let pendingEffect: (() => void | (() => void)) | undefined;
  const animation = (children: any[]) => {
    const result: any = { children, start(callback: unknown) { result.callback = callback; animations.push(result); } };
    return result;
  };
  const imports: any = {
    react: {
      ...React,
      useRef(initial: unknown) { return refs[refIndex++] ??= { current: initial }; },
      useState(initial: unknown) {
        const index = stateIndex++;
        if (!(index in states)) states[index] = initial;
        return [states[index], (next: unknown) => { states[index] = next; }];
      },
      useCallback(effect: typeof pendingEffect, deps: unknown[]) {
        if (!previousDeps || deps.some((value, index) => !Object.is(value, previousDeps![index]))) {
          previousDeps = deps;
          memoizedCallback = effect;
        }
        return memoizedCallback;
      },
    },
    "react-native": {
      Animated: {
        Value, View: "animated-view",
        timing: (target: Value, config: unknown) => ({ target, config }),
        parallel: animation,
      },
      Easing: { cubic: "cubic", quad: "quad", inOut: (v: unknown) => `inOut(${v})`, in: (v: unknown) => `in(${v})`, out: (v: unknown) => `out(${v})` },
      Platform: { OS: platform },
      Pressable: "pressable", View: "view", Text: "text",
      StyleSheet: { create: (v: unknown) => v, absoluteFillObject: {}, absoluteFill: {}, hairlineWidth: 1 },
    },
    "@expo/vector-icons": { Feather: "icon" },
    "expo-router": {
      useFocusEffect(effect: typeof pendingEffect) {
        if (focused && (!previousFocused || effect !== previousFocusCallback)) {
          cleanup?.();
          pendingEffect = effect;
        } else if (!focused && previousFocused) {
          cleanup?.();
          cleanup = undefined;
          pendingEffect = undefined;
        }
        previousFocused = focused;
        previousFocusCallback = effect;
      },
    },
    "expo-blur": { BlurView: "blur" },
    "expo-haptics": {
      ImpactFeedbackStyle: { Medium: "medium" },
      impactAsync: (style: string) => { haptics.push(style); return Promise.resolve(); },
    },
    "@/constants/confirmation-banner": { CONFIRMATION_ENTRY_DELAY_MS },
    "@/constants/tab-bar": { getTabBarGlassOverlay, TAB_PILL_BLUR_INTENSITY, TAB_PILL_BLUR_TINT },
    "@/context/SceneThemeContext": { useSceneTheme: () => ({ activeSceneId: themeId }) },
  };
  const module: any = { exports: {} };
  const compiled = ts.transpileModule(readFileSync(new URL("../components/ReflectionSavedBanner.tsx", import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true },
  }).outputText;
  new Function("require", "module", "exports", "setTimeout", "clearTimeout", compiled)(
    (name: string) => { assert.ok(name in imports, `Missing mock ${name}`); return imports[name]; },
    module, module.exports,
    (callback: () => void, delay: number) => { timers.set(++timerId, { at: clock + delay, callback }); return timerId; },
    (id: number) => timers.delete(id),
  );
  return {
    haptics, animations,
    setFocused(value: boolean) { focused = value; },
    render(trigger = 1) {
      refIndex = 0; stateIndex = 0;
      const tree = module.exports.ReflectionSavedBanner({ trigger, bottom: 80, onPress: () => presses++ });
      if (pendingEffect) { const effect = pendingEffect; pendingEffect = undefined; cleanup = effect() || undefined; }
      return tree;
    },
    advance(ms: number) {
      const end = clock + ms;
      while (true) {
        const next = [...timers].sort((a, b) => a[1].at - b[1].at)[0];
        if (!next || next[1].at > end) break;
        clock = next[1].at; timers.delete(next[0]); next[1].callback();
      }
      clock = end;
    },
    finish(index: number) { animations[index].callback({ finished: true }); },
    unmount() { cleanup?.(); },
    get presses() { return presses; },
  };
}

test("Wall confirmation waits the same 900ms as activity added, then fades/slides in with one medium haptic", () => {
  const h = harness();
  assert.equal(h.render(), null);
  h.advance(899);
  assert.equal(h.render(), null);
  assert.deepEqual(h.haptics, []);
  h.advance(1);
  assert.ok(h.render());
  assert.deepEqual(h.haptics, ["medium"]);
  assert.equal(h.animations.length, 1);
  for (const child of h.animations[0].children) {
    assert.equal(child.config.duration, 380);
    assert.equal(child.config.easing, "inOut(cubic)");
    assert.equal(child.config.useNativeDriver, true);
  }
  h.advance(380); h.finish(0);
  h.advance(1799);
  assert.equal(h.animations.length, 1);
  h.advance(1);
  assert.equal(h.animations.length, 2);
  h.advance(320); h.finish(1);
  assert.equal(h.render(), null);
  assert.deepEqual(h.haptics, ["medium"]);
});

test("Wall confirmation uses the tab pill blur and exact shared overlay color", () => {
  const h = harness();
  h.render(); h.advance(900);
  const glass = h.render().props.children.props.children[0];
  const [blur, overlay] = glass.props.children;
  assert.equal(blur.props.tint, TAB_PILL_BLUR_TINT);
  assert.equal(blur.props.intensity, TAB_PILL_BLUR_INTENSITY);
  assert.equal(blur.props.experimentalBlurMethod, "dimezisBlurView");
  assert.equal(overlay.props.style[1].backgroundColor, getTabBarGlassOverlay("cloudy"));
});

test("Wall confirmation is a full pill using the live tab color in every theme", () => {
  for (const theme of ["natural", "cloudy", "indigo2", "pleyades"]) {
    const h = harness("ios", theme);
    h.render();
    h.advance(900);
    const banner = h.render();
    const base = banner.props.style[0];
    const pressable = banner.props.children;
    const pressableStyle = pressable.props.style({ pressed: false })[0];
    const glass = pressable.props.children[0];
    const [blur, overlay] = glass.props.children;
    assert.equal(base.height, 56);
    assert.equal(base.borderRadius, base.height / 2);
    assert.equal(pressableStyle.borderRadius, base.height / 2);
    assert.equal(glass.props.style.borderRadius, base.height / 2);
    assert.equal(glass.props.style.overflow, "hidden");
    assert.equal(overlay.props.style[1].backgroundColor, getTabBarGlassOverlay(theme));
    assert.equal(blur.props.tint, TAB_PILL_BLUR_TINT);
    assert.equal(blur.props.intensity, TAB_PILL_BLUR_INTENSITY);
  }
});

test("Wall confirmation is 45px narrower and centered, with the shorter message and unchanged check and Ver", () => {
  const h = harness();
  h.render(); h.advance(900);
  const root = h.render();
  const frame = root.props.style[0];
  assert.equal(frame.left, frame.right);
  assert.equal(frame.left + frame.right - 28, 45);
  const [, titleRow, action] = root.props.children.props.children;
  const [checkSurface, title] = titleRow.props.children;
  assert.equal(title.props.children, "Mensaje registrado");
  assert.equal(checkSurface.props.style.width, 28);
  assert.equal(checkSurface.props.style.height, 28);
  assert.equal(checkSurface.props.children.props.name, "check");
  assert.equal(checkSurface.props.children.props.size, 17);
  assert.equal(checkSurface.props.children.props.color, "#F9F9F9");
  assert.equal(action.props.children, "Ver");
  assert.equal(action.props.style.fontSize, 13);
});

test("Closing before entry cancels both the pending banner and vibration", () => {
  const h = harness();
  h.render(); h.advance(400); h.unmount(); h.advance(5000);
  assert.deepEqual(h.haptics, []);
  assert.equal(h.animations.length, 0);
});

test("A newer saved message replaces the pending entry rather than triggering duplicate vibrations", () => {
  const h = harness();
  h.render(1); h.advance(200); h.render(2); h.advance(899);
  assert.deepEqual(h.haptics, []);
  h.advance(1);
  assert.deepEqual(h.haptics, ["medium"]);
  assert.ok(h.render(2));
});

test("Tapping Ver dismisses the banner, navigates once, and cancels its hold timer", () => {
  const h = harness();
  h.render(); h.advance(900); h.finish(0);
  h.render().props.children.props.onPress();
  assert.equal(h.render(), null);
  h.advance(5000);
  assert.equal(h.presses, 1);
  assert.equal(h.animations.length, 1);
});

test("Losing focus cancels pending haptics; returning can show an unseen confirmation without replaying one already shown", () => {
  const h = harness();
  h.render(); h.advance(400);
  h.setFocused(false); h.render(); h.advance(5000);
  assert.deepEqual(h.haptics, []);
  h.setFocused(true); h.render(); h.advance(900);
  assert.ok(h.render());
  assert.deepEqual(h.haptics, ["medium"]);
  h.setFocused(false); h.render();
  h.setFocused(true); h.render(); h.advance(5000);
  assert.equal(h.render(), null);
  assert.deepEqual(h.haptics, ["medium"]);
});

test("Web preview does not attempt native haptics, and an initial zero trigger shows no banner", () => {
  const h = harness("web");
  assert.equal(h.render(0), null);
  h.advance(2000);
  assert.equal(h.animations.length, 0);
  h.render(1); h.advance(900);
  assert.ok(h.render(1));
  assert.deepEqual(h.haptics, []);
});