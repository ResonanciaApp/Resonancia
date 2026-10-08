import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import React from "react";
import ts from "typescript";

const source = readFileSync(new URL("../components/InnerSpaceCard.tsx", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true },
}).outputText;

function fixture(quota = 0) {
  const states: any[] = [], refs: any[] = [], effects: any[] = [];
  let stateIndex = 0, refIndex = 0, effectIndex = 0, dirty = false;
  let focused = false, keyboardVisible = false, focusCalls = 0, restored = 0, gates = 0;
  const frames = new Map<number, () => void>();
  let nextFrame = 0;
  const commits: (() => void)[] = [];
  const panelCompletions: ((finished: boolean) => void)[] = [];
  const nodes = new Map<string, any>();
  let props: any = { focusRequest: 0, onComposeRequested: () => { composeRequests++; } };
  let composeRequests = 0;
  const nativeInput = {
    focus: () => {
      // Match RN's native editable/already-focused guard.
      if (nodes.get("reflection-writing-input").editable === false || focused) return;
      focusCalls++;
      focused = true;
      keyboardVisible = nodes.get("reflection-writing-input").showSoftInputOnFocus;
    },
    blur: () => { focused = false; keyboardVisible = false; },
    isFocused: () => focused,
  };
  class Value {
    value: number;
    constructor(value: number) { this.value = value; }
    setValue(value: number) { this.value = value; }
    stopAnimation() {}
    interpolate() { return this; }
  }
  const ref = (initial: any) => {
    const index = refIndex++;
    return refs[index] ?? (refs[index] = { current: initial });
  };
  const effect = (callback: () => any, deps: any[]) => {
    const index = effectIndex++;
    const old = effects[index];
    if (!old || deps.some((dep, i) => !Object.is(dep, old.deps[i]))) {
      old?.cleanup?.();
      const entry = { deps, cleanup: undefined as any };
      effects[index] = entry;
      commits.push(() => { entry.cleanup = callback(); });
    }
  };
  const animation = () => ({ start() {}, stop() {} }); // Decorative animations never complete.
  const mocks: Record<string, any> = {
    "@/config/scene-themes": { getThemeStyleId: (id: string) => id },
    react: {
      ...React, useRef: ref, useEffect: effect, useLayoutEffect: effect,
      useState: (initial: any) => {
        const index = stateIndex++;
        if (!(index in states)) states[index] = initial;
        return [states[index], (update: any) => {
          const next = typeof update === "function" ? update(states[index]) : update;
          if (!Object.is(next, states[index])) { states[index] = next; dirty = true; }
        }];
      },
    },
    "react-native": {
      View: "view", Text: "text", TextInput: "native-input", Pressable: "button", ScrollView: "scroll",
      StyleSheet: { create: (s: any) => s, absoluteFill: {}, absoluteFillObject: {} },
      Animated: { Value, View: "animated-view", Text: "animated-text", timing: animation, parallel: animation, sequence: animation },
      Easing: { out: (e: any) => e, inOut: (e: any) => e, cubic: 0 },
    },
    "react-native-reanimated": {
      __esModule: true, default: { View: "reanimated-view" },
      useSharedValue: (value: any) => ref({ value }).current,
      useAnimatedStyle: (callback: any) => callback(),
      useReducedMotion: () => false,
      runOnJS: (fn: any) => fn,
      withTiming: (value: any, _options: any, complete: any) => { if (complete) panelCompletions.push(complete); return value; },
      Easing: { out: (e: any) => e, inOut: (e: any) => e, cubic: 0, quad: 0 },
    },
    "react-native-keyboard-controller": { KeyboardController: {
      isVisible: () => keyboardVisible,
      setFocusTo: (direction: string) => { assert.equal(direction, "current"); restored++; keyboardVisible = true; },
    } },
    "@react-native-masked-view/masked-view": { default: "mask", __esModule: true },
    "expo-linear-gradient": { LinearGradient: "gradient" },
    "expo-haptics": { selectionAsync: async () => {} },
    "@expo/vector-icons": { Feather: "icon" },
    "expo-router": { router: { push() {} } },
    "@/hooks/useColors": { useColors: () => ({ foreground: "white", accent: "gold" }) },
    "@/context/SceneThemeContext": { useSceneTheme: () => ({ theme: { id: "indigo2", gradient: ["black", "navy"] } }) },
    "@/context/AuthContext": { useAuth: () => ({ authLoading: false, isSignedIn: true, clerkUserId: "fixture" }) },
    "@/context/PremiumContext": { usePremium: () => ({ isPremium: false }) },
    "@/constants/reflectionCategories": { useReflectionCategories: () => ({ options: [] }) },
    "@/lib/premiumGate": { FREE_REFLECTIONS_LIMIT: 3, showPremiumGate: () => gates++ },
    "@tanstack/react-query": { useQueryClient: () => ({}) },
    "@workspace/api-client-react": {
      useCreateMyReflection: () => ({ isPending: false }),
      useListMyReflections: () => ({ data: { items: Array.from({ length: quota }) }, isLoading: false }),
      getListMyReflectionsQueryKey: () => ["reflections"],
    },
    "@/components/DiscoverSearchBorder": { DiscoverSearchBorder: "border" },
    "@/components/ReflectionWallPlusIcon": { ReflectionWallPlusIcon: "plus", WALL_PLUS_HALO_SIZES: [1, 2, 3] },
    "@/components/ReflectionCategoryTabLabel": { ReflectionCategoryTabBorder: "tab-border", ReflectionCategoryTabLabel: "tab-label" },
    "@/constants/reflectionWallBorder": {},
    "@/constants/colors": {},
  };
  const module: any = { exports: {} };
  new Function("require", "module", "exports", "requestAnimationFrame", "cancelAnimationFrame", compiled)(
    (name: string) => { assert.ok(name in mocks, name); return mocks[name]; },
    module, module.exports,
    (callback: () => void) => { frames.set(++nextFrame, callback); return nextFrame; },
    (id: number) => frames.delete(id),
  );
  const capture = (node: any) => {
    if (!React.isValidElement(node)) return;
    const p: any = node.props;
    if (p.testID) nodes.set(p.testID, p);
    if (node.type === "native-input") p.ref.current = nativeInput;
    React.Children.forEach(p.children, capture);
  };
  const render = (nextProps?: any) => {
    if (nextProps) props = { ...props, ...nextProps };
    let attempts = 0;
    do {
      assert.ok(attempts++ < 8);
      dirty = false; stateIndex = 0; refIndex = 0; effectIndex = 0;
      capture(module.exports.InnerSpaceCard(props));
      commits.splice(0).forEach(callback => callback());
    } while (dirty);
  };
  render();
  return {
    nodes, render,
    open: () => { nodes.get("reflection-wall-toggle").onPress(); render(); },
    tap: () => {
      const input = nodes.get("reflection-writing-input");
      assert.notEqual(input.pointerEvents, "none", "the writing field must receive native taps");
      input.onPressIn();
      // Native TextInput receives the touch directly; its caret can focus before the IME opens.
      if (input.editable) {
        nativeInput.focus();
        input.onFocus();
      }
      render();
    },
    finishPanel: () => { panelCompletions.shift()!(true); render(); },
    flushFrames: () => {
      for (let i = 0; i < 2; i++) {
        const pending = [...frames.values()]; frames.clear(); pending.forEach(callback => callback());
      }
    },
    hideKeyboardKeepingFocus: () => { keyboardVisible = false; },
    dispose: () => effects.forEach(entry => entry.cleanup?.()),
    get focusCalls() { return focusCalls; },
    get restored() { return restored; },
    get keyboardVisible() { return keyboardVisible; },
    get gates() { return gates; },
    get composeRequests() { return composeRequests; },
  };
}

test("the native field receives taps and reveals its keyboard only after the parent scroll", () => {
  const f = fixture();
  f.open();
  f.tap();
  f.flushFrames();
  assert.ok(f.composeRequests > 0);
  assert.equal(f.focusCalls, 1, "native caret focuses directly without the software keyboard");
  assert.equal(f.keyboardVisible, false);
  assert.equal(f.nodes.get("reflection-writing-input").showSoftInputOnFocus, false);
  assert.equal(f.nodes.get("reflection-writing-input").editable, true);
  f.render({ focusRequest: 1 });
  f.flushFrames();
  assert.notEqual(f.nodes.get("reflection-writing-input").pointerEvents, "none");
  assert.equal(f.nodes.get("reflection-writing-input").showSoftInputOnFocus, true);
  assert.equal(f.focusCalls, 1);
  assert.equal(f.keyboardVisible, true);
  const priorRestorations = f.restored;
  f.hideKeyboardKeepingFocus();
  f.tap();
  f.flushFrames();
  assert.equal(f.restored, priorRestorations + 1);
  f.dispose();
});

test("a collapsed composer waits for the panel, but never for the plus animation", () => {
  const f = fixture();
  f.render({ focusRequest: 1 });
  f.flushFrames();
  assert.equal(f.focusCalls, 0);
  f.finishPanel();
  f.flushFrames();
  assert.equal(f.focusCalls, 1);
  f.dispose();
});

test("quota restrictions and unmount still prevent focus", () => {
  const limited = fixture(3);
  limited.open();
  limited.tap();
  limited.render({ focusRequest: 1 });
  limited.flushFrames();
  assert.equal(limited.gates, 1);
  assert.equal(limited.composeRequests, 0);
  assert.equal(limited.focusCalls, 0);
  assert.equal(limited.nodes.get("reflection-writing-input").editable, false);
  limited.dispose();
  const f = fixture();
  f.open();
  f.render({ focusRequest: 1 });
  f.dispose();
  f.flushFrames();
  assert.equal(f.focusCalls, 0);
});