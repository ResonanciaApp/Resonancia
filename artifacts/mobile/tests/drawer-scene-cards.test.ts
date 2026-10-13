import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { URL } from "node:url";
import React from "react";
import ts from "typescript";
import { blendThemePalette, scheduleSceneThemeHaptics, SCENE_THEME_FADE_MS } from "../lib/scene-theme-transition.ts";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");
const compile = (source: string) => ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.React },
}).outputText;
const exports: any = {};
new Function("exports", "require", compile(read("../components/DrawerSceneCards.tsx")))(
  exports, (name: string) => {
    if (name === "react") return { ...React, default: React };
    if (name === "react-native") return {
      View: "view", Pressable: "pressable", Text: "text",
      StyleSheet: { create: (styles: unknown) => styles, absoluteFill: {}, hairlineWidth: 1 },
    };
    if (name === "@expo/vector-icons") return { Feather: "icon", MaterialCommunityIcons: "icon" };
    if (name === "@/components/MoonCrescentIcon") return { MoonCrescentIcon: "moon-crescent" };
    if (name === "@/hooks/useDrawerScenes") return { useDrawerScenes: () => [] };
    if (name === "@/lib/avatar") return { resolveAvatarUrl: (value: string) => value };
    if (name === "expo-image") return { Image: "image" };
    if (name === "expo-linear-gradient") return { LinearGradient: "gradient" };
    if (name.endsWith(".jpg")) return name;
    throw new Error(name);
  },
);
function all(node: any): any[] {
  if (!React.isValidElement(node)) return [];
  return [node, ...React.Children.toArray((node.props as any).children).flatMap(all)];
}

test("minimal Día/Noche rows retain menu sizes and dim the inactive icon and title to #A8A8A8", () => {
  for (const active of ["cloudy", "indigo2", "natural", "pleyades", "tibet"]) {
    const calls: string[] = [];
    const nodes = all(exports.DrawerSceneCards({ activeId: active, onSelect: (id: string) => calls.push(id) }));
    const radios = nodes.filter(node => node.props.accessibilityRole === "radio");
    assert.equal(radios.length, 4);
    assert.deepEqual(radios.map(radio => radio.props.accessibilityState.selected),
      ["cloudy", "indigo2", "natural", "pleyades"].map(id => active === id));
    assert.equal(nodes.filter(node => node.props.name === "check" || node.type === "image" || node.type === "gradient").length, 0);
    assert.equal(radios[0].props.accessibilityLabel, "Día");
    assert.equal(radios[1].props.accessibilityLabel, "Noche");
    assert.equal(radios[2].props.accessibilityLabel, "Natural");
    assert.equal(radios[3].props.accessibilityLabel, "Pleyades");
    assert.equal(all(radios[2]).find(node => node.type === "icon").props.name, "pine-tree");
    assert.equal(all(radios[3]).find(node => node.type === "icon").props.name, "diamond-stone");
    const sun = nodes.find(node => node.props.name === "white-balance-sunny");
    const moon = nodes.find(node => node.type === "moon-crescent");
    assert.equal(sun.props.color, active === "cloudy" ? "#BE9650" : "#A8A8A8");
    assert.equal(moon.props.color, active === "indigo2" ? "#B6A1E5" : "#A8A8A8");
    assert.equal(sun.props.size, 24);
    assert.equal(moon.props.size, 24);
    assert.equal(nodes.find(node => node.props.accessibilityRole === "radiogroup").props.style.marginTop, 10);
    const list = nodes.find(node => node.props.accessibilityRole === "radiogroup");
    assert.equal(list.props.style.gap, 12);
    assert.equal(list.props.style.flexDirection, "row");
    assert.equal(list.props.children.length, 2);
    assert.deepEqual(all(list.props.children[0]).filter(node => node.props.accessibilityRole === "radio").map(node => node.props.accessibilityLabel), ["Día", "Noche"]);
    assert.deepEqual(all(list.props.children[1]).filter(node => node.props.accessibilityRole === "radio").map(node => node.props.accessibilityLabel), ["Natural", "Pleyades"]);
    const sectionHeader = nodes.find(node => node.props.style?.borderTopWidth === 1);
    assert.equal(sectionHeader.props.style.marginTop, 150 + 15, "Divider, Escena heading and all following options move down another 15px in layout flow");
    const heading = all(sectionHeader).find(node => node.type === "text");
    assert.equal(heading.props.style.fontSize, 10);
    assert.equal(heading.props.style.fontFamily, "Manrope650");
    for (const radio of radios) {
      const iconBox = all(radio).find(node => node.props.style?.width === 26);
      assert.equal(iconBox.props.style.height, 26);
      assert.equal(iconBox.props.style.justifyContent, "center");
      assert.equal(iconBox.props.pointerEvents, "none");
    }
    for (const radio of radios) {
      const text = all(radio).filter(node => node.type === "text");
      assert.equal(text.length, 1);
      const textStyle = Object.assign({}, ...text[0].props.style);
      assert.equal(textStyle.fontSize, 13);
      assert.equal(textStyle.fontFamily, "Manrope650");
      assert.equal(textStyle.fontWeight, "400", "Use the registered static 650-weight face rather than unsupported iOS weight strings");
      assert.equal(textStyle.color, radio.props.accessibilityState.selected ? "#FFFFFF" : "#A8A8A8");
      assert.equal(radio.props.style({ pressed: false })[0].backgroundColor, undefined);
    }
    radios.forEach(radio => radio.props.onPress());
    assert.deepEqual(calls, ["cloudy", "indigo2", "natural", "pleyades"].filter(id => id !== active));
    assert.equal(nodes.some(node => node.props.testID === "drawer-scene-info" || node.props.name === "info"), false);
  }
});

test("Noche reuses the exact crescent from the Sonidos mixer banner", () => {
  for (const path of ["../components/DrawerSceneCards.tsx", "../components/SoundMixerBanner.tsx"]) {
    assert.match(read(path), /import \{ MoonCrescentIcon \} from "@\/components\/MoonCrescentIcon"/);
    assert.match(read(path), /<MoonCrescentIcon/);
  }
});

test("crossfade snapshots the visible color on interruption and retains exact final palettes", () => {
  assert.equal(SCENE_THEME_FADE_MS, 600);
  const start = ["#000000", "#204060"];
  const end = ["#ffffff", "#6080a0"];
  const halfway = blendThemePalette(start, end, 0.5);
  assert.deepEqual(halfway, ["#808080", "#406080"]);
  const newTarget = ["#112233", "#8899aa"];
  assert.deepEqual(blendThemePalette(halfway, newTarget, 0), halfway);
  assert.deepEqual(blendThemePalette(halfway, newTarget, 1), newTarget);
  assert.deepEqual(blendThemePalette(start, end, 5), end);
});

test("extended soft pattern has three spaced impacts and cancellation blocks queued callbacks", () => {
  const queued = new Map<number, () => void>();
  let id = 0;
  let hits = 0;
  const delays: number[] = [];
  const stop = scheduleSceneThemeHaptics(() => hits++,
    ((fn: () => void, delay: number) => { delays.push(delay); queued.set(++id, fn); return id; }) as any,
    ((timer: number) => queued.delete(timer)) as any);
  assert.deepEqual(delays, [0, 200, 400]);
  const stale = [...queued.values()];
  stale[0]();
  assert.equal(hits, 1);
  stop();
  assert.equal(queued.size, 0);
  stale.slice(1).forEach(fn => fn());
  assert.equal(hits, 1);
  let completeHits = 0;
  const complete: (() => void)[] = [];
  scheduleSceneThemeHaptics(() => completeHits++, ((fn: () => void) => complete.push(fn)) as any);
  complete.forEach(fn => fn());
  assert.equal(completeHits, 3);
});

test("drawer and every screen that opens it crossfade backgrounds without changing audio or tab haptics", () => {
  const drawer = read("../components/DrawerMenu.tsx");
  assert.match(drawer, /<DrawerSceneCards activeId=\{activeSceneId\} onSelect=\{selectVisualTheme\}/);
  assert.match(drawer, /if \(id === activeSceneId\) return/);
  assert.match(drawer, /if \(!visible\) cancelThemeHaptics.current\?\.\(\)/);
  assert.match(drawer, /ImpactFeedbackStyle.Soft/);
  assert.match(drawer, /if \(ND\)/);
  assert.doesNotMatch(read("../components/ProfileSettingsSections.tsx"), /themePicker|label: "Escenas"/);
  for (const path of ["../components/DrawerMenu.tsx", "../app/(tabs)/inicio8.tsx", "../app/(tabs)/explore.tsx", "../app/(tabs)/musica.tsx"]) {
    assert.match(read(path), /<SceneThemeBackground/);
  }
  const background = read("../components/SceneThemeBackground.tsx");
  assert.match(background, /useNativeDriver: true/);
  assert.match(background, /key=\{layer.id\}/);
  assert.doesNotMatch(background, /blendThemePalette/);
  assert.match(background, /generation.current !== token/);
  assert.match(background, /reduceMotionChanged/);
  assert.doesNotMatch(background, /setInterval|children/);
});

test("background preserves native layers on interruption, ignores stale completion and settles reduced motion", () => {
  const states: any[] = [], refs: any[] = [], effects: any[] = [];
  let stateIndex = 0, refIndex = 0, effectIndex = 0, dirty = false;
  let target = ["#000000", "#204060"];
  let reduceListener: (value: boolean) => void = () => {};
  const pending: any[] = [];
  const animationOptions: any[] = [];
  const completions: ((result: { finished: boolean }) => void)[] = [];
  const register = (fn: () => any, deps: any[]) => {
    const index = effectIndex++;
    const previous = effects[index];
    if (!previous || deps.some((value, i) => !Object.is(value, previous.deps[i]))) {
      pending.push(() => {
        previous?.cleanup?.();
        effects[index] = { deps, cleanup: fn() };
      });
    }
  };
  const fakeReact = {
    ...React,
    useState: (initial: any) => {
      const index = stateIndex++;
      if (!(index in states)) states[index] = typeof initial === "function" ? initial() : initial;
      return [states[index], (value: any) => {
        if (!Object.is(value, states[index])) { states[index] = value; dirty = true; }
      }];
    },
    useRef: (initial: any) => {
      const index = refIndex++;
      return refs[index] ?? (refs[index] = { current: initial });
    },
    useEffect: register,
    useLayoutEffect: register,
  };
  class Value {
    value: number;
    constructor(value: number) { this.value = value; }
    setValue(value: number) { this.value = value; }
    stopAnimation(callback?: (value: number) => void) { callback?.(this.value); }
  }
  const background: any = {};
  new Function("exports", "require", compile(read("../components/SceneThemeBackground.tsx")))(
    background, (name: string) => {
      if (name === "react") return { ...fakeReact, default: fakeReact };
      if (name === "@/context/SceneThemeContext") return { useSceneTheme: () => ({ theme: { gradient: target } }) };
      if (name === "@/lib/scene-theme-transition") return { blendThemePalette, SCENE_THEME_FADE_MS };
      if (name === "expo-linear-gradient") return { LinearGradient: "gradient" };
      if (name === "react-native") return {
        View: "view", StyleSheet: { absoluteFill: {} }, Easing: { ease: "ease", inOut: () => "ease" },
        AccessibilityInfo: {
          isReduceMotionEnabled: () => Promise.resolve(false),
          addEventListener: (_name: string, fn: any) => { reduceListener = fn; return { remove() {} }; },
        },
        Animated: { Value, View: "animated",
          timing: (_value: any, options: any) => {
            animationOptions.push(options);
            return { start(callback: any) { completions.push(callback); }, stop() {} };
          },
        },
      };
      throw new Error(name);
    },
  );
  function render() {
    let cycles = 0;
    do {
      dirty = false;
      stateIndex = refIndex = effectIndex = 0;
      background.SceneThemeBackground();
      pending.splice(0).forEach(fn => fn());
      assert.ok(++cycles < 10);
    } while (dirty);
  }
  render();
  target = ["#ffffff", "#6080a0"];
  render();
  assert.equal(animationOptions.at(-1).duration, 600);
  assert.equal(animationOptions.at(-1).useNativeDriver, true);
  const baseLayer = refs[0].current[0];
  const interruptedLayer = refs[0].current[1];
  interruptedLayer.opacity.value = 0.5;
  const staleCompletion = completions.at(-1)!;
  // Different stop count must not recolor or reshape an existing layer.
  target = ["#112233", "#8899aa", "#abcdef"];
  render();
  assert.equal(refs[0].current[0], baseLayer);
  assert.equal(refs[0].current[1], interruptedLayer);
  assert.deepEqual(interruptedLayer.colors, ["#ffffff", "#6080a0"]);
  assert.equal(interruptedLayer.opacity.value, 0.5);
  assert.deepEqual(refs[0].current[2].colors, target);
  assert.equal(refs[0].current[2].opacity.value, 0);
  staleCompletion({ finished: true });
  assert.equal(refs[0].current.length, 3);
  const finalLayer = refs[0].current[2];
  reduceListener(true);
  render();
  assert.deepEqual(refs[0].current, [finalLayer]);
  assert.equal(finalLayer.opacity.value, 1);
  assert.deepEqual(finalLayer.colors, target);
  effects.forEach(effect => effect.cleanup?.());
});

test("rapid selections serialize native storage writes so the last choice survives reload", async () => {
  let scene = "indigo2", stored = scene;
  const writes: { id: string; finish: () => void }[] = [];
  const provider: any = {};
  const themes: any = {};
  new Function("exports", compile(read("../config/scene-themes.ts")))(themes);
  const fakeReact = {
    ...React, createContext: () => ({ Provider: "provider" }),
    useState: () => [scene, (next: string) => { scene = next; }],
    useCallback: (fn: any) => fn, useMemo: (fn: any) => fn(),
  };
  new Function("exports", "require", compile(read("../context/SceneThemeContext.tsx")))(
    provider, (name: string) => {
      if (name === "react") return { ...fakeReact, default: fakeReact };
      if (name === "@/config/scene-themes") return themes;
      if (name === "@/context/BrightnessContext") return { useBrightness: () => ({ brightMode: false }) };
      if (name === "@react-native-async-storage/async-storage") return { default: {
        getItem: async () => stored,
        setItem: (_key: string, id: string) => new Promise<void>(resolve => {
          writes.push({ id, finish: () => { stored = id; resolve(); } });
        }),
      } };
      throw new Error(name);
    },
  );
  const value = provider.SceneThemeProvider({ children: null }).props.value;
  value.setActiveScene("cloudy");
  value.setActiveScene("indigo2");
  value.setActiveScene("cloudy");
  const flush = () => new Promise(resolve => setTimeout(resolve, 0));
  await flush();
  assert.deepEqual(writes.map(write => write.id), ["cloudy"]);
  writes[0].finish();
  await flush();
  assert.deepEqual(writes.map(write => write.id), ["cloudy", "indigo2"]);
  writes[1].finish();
  await flush();
  writes[2].finish();
  assert.equal(await provider.loadPersistedSceneId(), "cloudy");
  assert.equal(scene, "cloudy");
});