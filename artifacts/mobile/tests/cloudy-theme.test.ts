import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { URL } from "node:url";
import test from "node:test";
import React from "react";
import ts from "typescript";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");
const compile = (source: string) => ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.React },
}).outputText;
const themes: any = {};
new Function("exports", compile(read("../config/scene-themes.ts")))(themes);
const colors = ["#2D2F7C", "#2D3981", "#2D4085", "#2A4687", "#25528C", "#1F5D92", "#166494"];
const colors2 = ["#165794", "#1E5492", "#254B8D", "#2A4687", "#2D4085", "#2D3981", "#2D2F7C"];
const brighten = (hex: string) => "#" + hex.slice(1).match(/../g)!.map(channel =>
  Math.round(parseInt(channel, 16) * 0.965 + 255 * 0.035).toString(16).padStart(2, "0"),
).join("").toUpperCase();

test("Índigo 2 keeps its adjusted palette with 2.5% additional brightness, evenly spaced vertically", () => {
  const { indigo2 } = themes.SCENE_THEMES;
  assert.deepEqual(indigo2.gradient, ["#273663", "#272E61", "#282B61", "#2C2763", "#2C2860", "#362763", "#392869"]);
  assert.equal(indigo2.solid, "#273663");
  assert.equal(indigo2.accent, "#E8E8E8");
  assert.deepEqual(indigo2.gradientLocations, [0, 0.167, 0.333, 0.5, 0.667, 0.833, 1]);
  assert.deepEqual(indigo2.gradientStart, { x: 0.5, y: 0 });
  assert.deepEqual(indigo2.gradientEnd, { x: 0.5, y: 1 });
});

test("Cloudy has all seven exact reference stops in order and inherits Indigo 2 metadata", () => {
  const { cloudy, indigo2 } = themes.SCENE_THEMES;
  assert.deepEqual(cloudy.gradient, colors);
  assert.equal(cloudy.id, "cloudy");
  assert.equal(cloudy.label, "Cloudy");
  assert.equal(cloudy.solid, colors[0]);
  assert.deepEqual(cloudy.gradientLocations, [0, 0.167, 0.333, 0.5, 0.667, 0.833, 1]);
  assert.equal(cloudy.gradientLocations.length, cloudy.gradient.length);
  for (const key of ["gradientStart", "gradientEnd", "accent"]) {
    assert.deepEqual(cloudy[key], indigo2[key]);
  }
  assert.equal(themes.isIndigo2ThemeId("cloudy"), true);
  assert.equal(themes.isIndigo2ThemeId("indigo2"), true);
  assert.equal(themes.isIndigo2ThemeId("tibet"), false);
  assert.equal(themes.isIndigoThemeId("cloudy"), false);
  assert.deepEqual(themes.VISUAL_THEME_IDS, ["tibet", "indigo2", "cloudy", "cloudy2"]);
});

test("Cloudy 2 copies Indigo 2 styles with its exact reference colors, not just a reversed Cloudy palette", () => {
  const { cloudy2, indigo2 } = themes.SCENE_THEMES;
  assert.deepEqual(cloudy2.gradient, colors2);
  assert.notDeepEqual(cloudy2.gradient, colors.slice().reverse());
  assert.equal(cloudy2.id, "cloudy2");
  assert.equal(cloudy2.label, "Cloudy 2");
  assert.equal(cloudy2.solid, colors2[0]);
  assert.deepEqual(cloudy2.gradientLocations, [0, 0.167, 0.333, 0.5, 0.667, 0.833, 1]);
  assert.equal(cloudy2.gradientLocations.length, cloudy2.gradient.length);
  for (const key of ["gradientStart", "gradientEnd", "accent"]) {
    assert.deepEqual(cloudy2[key], indigo2[key]);
  }
  assert.equal(themes.isIndigo2ThemeId("cloudy2"), true);
  assert.equal(themes.isIndigoThemeId("cloudy2"), false);
});

test("Only the four visual IDs are accepted; old audio IDs never become visual themes", () => {
  for (const id of themes.VISUAL_THEME_IDS) assert.equal(themes.isVisualThemeId(id), true);
  for (const id of [null, "indigo", "resonancia", "none", "__proto__", "unknown"]) {
    assert.equal(themes.isVisualThemeId(id), false);
  }
  assert.doesNotMatch(read("../context/AmbientPlayerContext.tsx"), /\bcloudy2?\b/);
});

function providerHarness(saved: string | null, brightMode = false) {
  let state: string | undefined;
  const storage = {
    getItem: async () => saved,
    setItem: async (_key: string, id: string) => { saved = id; },
  };
  const fakeReact = {
    ...React,
    createContext: () => ({ Provider: "provider" }),
    useState: (initial: string) => {
      state ??= initial;
      return [state, (id: string) => { state = id; }];
    },
    useCallback: (fn: unknown) => fn,
    useMemo: (fn: () => unknown) => fn(),
  };
  const exported: any = {};
  new Function("exports", "require", compile(read("../context/SceneThemeContext.tsx")))(
    exported,
    (name: string) => {
      if (name === "react") return { ...fakeReact, default: fakeReact };
      if (name === "@react-native-async-storage/async-storage") return { default: storage };
      if (name === "@/config/scene-themes") return themes;
      if (name === "@/context/BrightnessContext") return {
        useBrightness: () => ({ brightMode }), brightenThemeColor: brighten,
      };
      throw new Error(`Unexpected dependency: ${name}`);
    },
  );
  return { exported, render: (initial: string) => exported.SceneThemeProvider({ initialSceneId: initial, children: null }).props.value };
}

test("Cloudy selection saves and restores across reloads while defaults and other choices keep working", async () => {
  const harness = providerHarness(null);
  assert.equal(await harness.exported.loadPersistedSceneId(), "tibet");
  for (const id of ["cloudy", "cloudy2", "indigo2", "tibet", "cloudy2"]) {
    harness.render("tibet").setActiveScene(id);
    assert.equal(harness.render("tibet").activeSceneId, id);
    assert.equal(await harness.exported.loadPersistedSceneId(), id);
  }
  assert.equal(await providerHarness("cloudy").exported.loadPersistedSceneId(), "cloudy");
  assert.equal(await providerHarness("cloudy2").exported.loadPersistedSceneId(), "cloudy2");
  assert.equal(await providerHarness("indigo").exported.loadPersistedSceneId(), "tibet");
});

test("Cloudy themes retain exact base stops in Noche and the existing single 3.5% mix in Luz", () => {
  for (const [id, palette] of [["cloudy", colors], ["cloudy2", colors2]] as const) {
    assert.deepEqual(providerHarness(id).render(id).theme.gradient, palette);
    const bright = providerHarness(id, true).render(id).theme;
    assert.deepEqual(bright.gradient, palette.map(brighten));
    assert.equal(bright.solid, brighten(palette[0]));
    assert.equal(bright.accent, themes.SCENE_THEMES.indigo2.accent);
  }
});

test("Settings offers only Indigo 2 and Cloudy as accessible 38px circles inline on the right, with border-only selection", () => {
  const exported: any = {};
  new Function("exports", "require", compile(read("../components/VisualThemeSwatches.tsx")))(
    exported,
    (name: string) => {
      if (name === "react") return { ...React, default: React };
      if (name === "react-native") return { Pressable: "pressable", Text: "text", View: "view", StyleSheet: { create: (v: unknown) => v } };
      if (name === "expo-linear-gradient") return { LinearGradient: "gradient" };
      if (name === "@expo/vector-icons") return { Feather: "icon" };
      if (name === "@/config/scene-themes") return themes;
      if (name === "@/context/BrightnessContext") return { brightenThemeColor: brighten };
      throw new Error(`Unexpected dependency: ${name}`);
    },
  );
  const selected: string[] = [];
  const available = ["indigo2", "cloudy"];
  for (const activeId of themes.VISUAL_THEME_IDS) {
    const root = exported.VisualThemeSwatches({
      activeId, onSelect: (id: string) => selected.push(id), foreground: "#fff", accent: "#eee", brightMode: false,
    });
    assert.equal(root.props.accessibilityRole, "radiogroup");
    const buttons = root.props.children;
    assert.equal(buttons.length, 2);
    assert.equal(root.props.style.flexDirection, "row");
    assert.equal(root.props.style.alignItems, "center");
    assert.equal(root.props.style.paddingHorizontal, undefined);
    assert.equal(root.props.style.paddingBottom, undefined);
    assert.equal(buttons.filter((button: any) => button.props.accessibilityState.checked).length, available.includes(activeId) ? 1 : 0);
    buttons.forEach((button: any, index: number) => {
      assert.equal(button.props.accessibilityRole, "radio");
      assert.equal(button.props.accessibilityState.checked, available[index] === activeId);
      const style = Object.assign({}, ...button.props.style({ pressed: false }));
      assert.equal(style.width, 38);
      assert.equal(style.height, 38);
      assert.equal(style.borderRadius, 19);
      assert.equal(style.borderColor, available[index] === activeId ? "#eee" : "rgba(255,255,255,0.16)");
      assert.equal(style.backgroundColor, undefined);
      assert.equal(button.props.hitSlop, 5);
      assert.equal(button.props.accessibilityLabel, index === 0 ? "Índigo 2" : "Cloudy");
      const swatch = React.Children.toArray(button.props.children)[0] as React.ReactElement<any>;
      assert.deepEqual(swatch.props.colors, themes.SCENE_THEMES[available[index]].gradient);
      assert.equal(React.Children.count(swatch.props.children), 0, "Selection has no checkmark or additional background");
      assert.equal(React.Children.count(button.props.children), 1, "No label or other element outside the circle");
      button.props.onPress();
    });
  }
  assert.deepEqual(selected, Array.from({ length: 4 }, () => available).flat());
  const settings = read("../components/ProfileSettingsSections.tsx");
  assert.match(settings, /label: "Escenas",\s+themePicker: true/);
  assert.match(settings, /onSelect=\{setActiveScene\}/);
  assert.match(settings, /<Text style=\{\[styles.rowLabel, styles.rowCopy, \{ color: foreground \}\]\}>\{row.label\}<\/Text>\s+<VisualThemeSwatches[\s\S]*?\/>\s+<\/View>/);
  assert.doesNotMatch(settings, /Luz \/ Noche|setBrightMode/);
  assert.ok(settings.indexOf('label: "Escenas"') > settings.indexOf('label: "Registro diario estado de ánimo"'));
  assert.ok(settings.indexOf('label: "Escenas"') < settings.indexOf('label: "Hitos"'));
  for (const path of ["../app/configuraciones.tsx", "../components/ProfileScreenBase.tsx"]) {
    assert.match(read(path), /<ProfileSettingsSections/);
  }
});