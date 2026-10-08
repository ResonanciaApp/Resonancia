import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { URL } from "node:url";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";
import { getThemeStyleId, SCENE_THEMES } from "../config/scene-themes.ts";
import { DURATION_SHEET_OPEN_BACKDROP_MS, DURATION_SHEET_OPEN_SPRING } from "../lib/ambiental-duration-opening.ts";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");
const source = read("../components/CreativityPointsInfoSheet.tsx");
const compile = (text: string) => ts.transpileModule(text, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.React, esModuleInterop: true },
}).outputText;
const flatten = (style: any): any => Array.isArray(style)
  ? Object.assign({}, ...style.map(flatten)) : style ?? {};

function harness(theme = SCENE_THEMES.indigo2, measuredHeight = 480) {
  const states: any[] = [], refs: any[] = [], effects: any[] = [];
  let stateIndex = 0, refIndex = 0, effectIndex = 0, dirty = false, closes = 0;
  const nodes = new Map<string, any>();
  const frames = new Map<number, () => void>();
  let frameId = 0;
  const batches: { animations: any[]; finish?: (result: { finished: boolean }) => void }[] = [];
  const Native = (props: any) => {
    if (props.testID) nodes.set(props.testID, props);
    if (props.testID === "creativity-info-sheet") {
      props.onLayout?.({ nativeEvent: { layout: { height: measuredHeight } } });
    }
    return React.createElement("div", { "data-testid": props.testID }, props.children);
  };
  class Value {
    value: number;
    constructor(value: number) { this.value = value; }
    setValue(value: number) { this.value = value; }
    stopAnimation() {}
  }
  const fakeReact = {
    ...React,
    useState: (initial: any) => {
      const index = stateIndex++;
      if (!(index in states)) states[index] = initial;
      return [states[index], (value: any) => {
        if (states[index] !== value) { states[index] = value; dirty = true; }
      }];
    },
    useRef: (initial: any) => {
      const index = refIndex++;
      return refs[index] ?? (refs[index] = { current: initial });
    },
    useEffect: (callback: () => any, deps: any[]) => {
      const index = effectIndex++;
      const old = effects[index];
      if (!old || deps.some((dep, i) => !Object.is(dep, old.deps[i]))) {
        old?.cleanup?.();
        effects[index] = { deps, cleanup: callback() };
      }
    },
  };
  const mocks: Record<string, any> = {
    react: fakeReact,
    "react-native": {
      Modal: Native, View: Native, Text: Native, Pressable: Native, ScrollView: Native,
      StyleSheet: { create: (styles: any) => styles, absoluteFill: { position: "absolute", top: 0, bottom: 0, left: 0, right: 0 } },
      useWindowDimensions: () => ({ width: 402, height: 874 }),
      Animated: {
        Value, View: Native,
        spring: (value: any, options: any) => ({ kind: "spring", value, options }),
        timing: (value: any, options: any) => ({ kind: "timing", value, options }),
        parallel: (animations: any[]) => ({ start: (finish?: any) => batches.push({ animations, finish }) }),
      },
    },
    "react-native-safe-area-context": { useSafeAreaInsets: () => ({ bottom: 34 }) },
    "expo-linear-gradient": { LinearGradient: Native },
    "@expo/vector-icons": { Feather: Native },
    "@/context/SceneThemeContext": { useSceneTheme: () => ({ theme }) },
    "@/config/scene-themes": { getThemeStyleId, SCENE_THEMES },
    "@/lib/ambiental-duration-opening": { DURATION_SHEET_OPEN_BACKDROP_MS, DURATION_SHEET_OPEN_SPRING },
  };
  const module: any = { exports: {} };
  new Function("require", "module", "exports", "requestAnimationFrame", "cancelAnimationFrame", compile(source))(
    (name: string) => { assert.ok(name in mocks, name); return mocks[name]; }, module, module.exports,
    (callback: () => void) => { frames.set(++frameId, callback); return frameId; },
    (id: number) => frames.delete(id),
  );
  return {
    nodes, batches,
    closes: () => closes,
    render(visible: boolean) {
      let html = "", iterations = 0;
      do {
        dirty = false; stateIndex = 0; refIndex = 0; effectIndex = 0;
        const tree = module.exports.CreativityPointsInfoSheet({ visible, onClose: () => closes++ });
        html = tree ? renderToStaticMarkup(tree) : "";
        assert.ok(++iterations < 5);
      } while (dirty);
      const pending = [...frames.values()];
      frames.clear();
      pending.forEach(callback => callback());
      return html;
    },
  };
}

test("the information window copies the supplied text and preserves its two-stop background independently of the Cloudy timer", () => {
  const timerColors = (theme: typeof SCENE_THEMES[keyof typeof SCENE_THEMES], palettes: typeof SCENE_THEMES) =>
    getThemeStyleId(theme.id) === "indigo2"
      ? [palettes.tibet.gradient[1], palettes.tibet.gradient[2]]
      : [theme.gradient[1], theme.gradient[2]];
  for (const theme of Object.values(SCENE_THEMES)) {
    const h = harness(theme);
    assert.equal(h.render(false), "");
    const html = h.render(true);
    assert.ok(html.includes("¿Qué es la puntuación de atención plena?"));
    assert.ok(html.includes("Un monitor de atención plena es una herramienta inteligente"));
    assert.ok(html.includes("más consciente de ti mismo/a"));
    assert.ok(html.includes("meditación constante en tu vida diaria."));
    assert.deepEqual(h.nodes.get("creativity-info-background").colors, timerColors(theme, SCENE_THEMES));
    assert.equal(flatten(h.nodes.get("creativity-info-sheet").style).backgroundColor, timerColors(theme, SCENE_THEMES)[0]);
    assert.equal(flatten(h.nodes.get("creativity-info-backdrop").style).position, "absolute");
    assert.equal(flatten(h.nodes.get("creativity-info-scroll").contentContainerStyle).paddingBottom, 54);
  }
});

test("opening uses the timer spring and backdrop fade; closing waits for the animation and ignores stale completion", () => {
  const h = harness();
  h.render(true);
  const opening = h.batches.at(-1)!;
  assert.equal(opening.animations[0].value.value, 480 + 80);
  assert.deepEqual(opening.animations[0].options, { toValue: 0, ...DURATION_SHEET_OPEN_SPRING, useNativeDriver: true });
  assert.deepEqual(opening.animations[1].options, { toValue: 0.62, duration: DURATION_SHEET_OPEN_BACKDROP_MS, useNativeDriver: true });
  assert.notEqual(h.render(false), "");
  const firstClosing = h.batches.at(-1)!;
  assert.equal(firstClosing.animations[0].options.duration, 500);
  assert.equal(firstClosing.animations[1].options.duration, 460);
  h.render(true);
  firstClosing.finish!({ finished: true });
  assert.notEqual(h.render(true), "");
  h.render(false);
  h.batches.at(-1)!.finish!({ finished: true });
  assert.equal(h.render(false), "");
});

test("opening starts below the actual panel on different heights and waits for layout", () => {
  for (const height of [320, 480, 700]) {
    const h = harness(SCENE_THEMES.indigo2, height);
    h.render(true);
    assert.equal(h.batches.at(-1)!.animations[0].value.value, height + 80);
  }
  const h = harness(SCENE_THEMES.indigo2, 0);
  h.render(true);
  assert.equal(h.batches.length, 0);
  h.render(false);
  h.nodes.get("creativity-info-sheet").onLayout({ nativeEvent: { layout: { height: 480 } } });
  h.render(false);
  assert.ok(h.batches.every(batch => batch.animations.every(animation => animation.kind !== "spring")));
});

test("close button, outside tap and Android back all invoke close", () => {
  const h = harness();
  h.render(true);
  h.nodes.get("creativity-info-close").onPress();
  h.nodes.get("creativity-info-backdrop").onPress();
  h.nodes.get("creativity-info-modal").onRequestClose();
  assert.equal(h.closes(), 3);
  assert.equal(h.nodes.get("creativity-info-modal").animationType, "none");
});

test("Perfil opens the same help window from any part of the card without a question mark or scoring", () => {
  const exports: any = {};
  const SectionNative = "view";
  new Function("exports", "require", compile(read("../components/CreativityPointsSection.tsx")))(
    exports, (name: string) => {
      if (name === "react") return React;
      if (name === "react-native") return { View: SectionNative, Text: "text", Pressable: "button", StyleSheet: { create: (s: any) => s } };
      if (name === "@/hooks/useColors") return { useColors: () => ({ foreground: "#F9F9F9", accent: "#BE9650" }) };
      throw new Error(name);
    },
  );
  let calls = 0;
  const tree = exports.CreativityPointsSection({ onInfoPress: () => calls++ });
  function all(node: any): any[] {
    if (!React.isValidElement(node)) return [];
    return [node, ...React.Children.toArray((node.props as any).children).flatMap(all)];
  }
  const nodes = all(tree);
  const help = nodes.find(node => node.props.testID === "profile-creativity-points");
  assert.equal(help.type, "button");
  assert.equal(nodes.some(node => node.props.testID === "creativity-points-info" || node.props.children === "?"), false);
  assert.ok(React.Children.toArray(help.props.children).every((node: any) => node.props.pointerEvents === "none"),
    "title, bar and counter must let all taps reach the card");
  assert.equal(help.props.accessibilityRole, "button");
  help.props.onPress();
  assert.equal(calls, 1);
  assert.deepEqual(nodes.find(node => node.props.testID === "creativity-points-bar").props.accessibilityValue,
    { min: 0, max: 100, now: 0, text: "0 de 100 puntos" });
  const profile = read("../components/ProfileScreenBase.tsx");
  const parsed = ts.transpileModule(profile, {
    reportDiagnostics: true,
    compilerOptions: { jsx: ts.JsxEmit.React, target: ts.ScriptTarget.ES2022 },
  });
  assert.deepEqual(parsed.diagnostics?.filter(d => d.category === ts.DiagnosticCategory.Error), []);
  assert.match(profile, /onInfoPress=\{\(\) => setCreativityInfoOpen\(true\)\}/);
  assert.match(profile, /CreativityPointsInfoSheet visible=\{creativityInfoOpen\} onClose=\{\(\) => setCreativityInfoOpen\(false\)\}/);
  assert.match(profile, /useFocusEffect\(useCallback\(\(\) => \(\) => setCreativityInfoOpen\(false\), \[\]\)\)/);
});