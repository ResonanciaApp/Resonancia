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

test("Natural uses Respiración's exact green stops and inherits Cloudy styles without changing its identity", () => {
  const natural = themes.SCENE_THEMES.natural;
  assert.equal(natural.id, "natural");
  assert.equal(natural.label, "Natural");
  assert.deepEqual(natural.gradient, ["#4A7D48", "#3B6D3C", "#326740", "#285E3E", "#175543", "#0B4B3D", "#073B32"]);
  assert.equal(natural.solid, natural.gradient[0]);
  assert.equal(natural.gradient, themes.NATURAL_GRADIENT);
  assert.deepEqual(natural.gradientLocations, [0, 0.16, 0.33, 0.5, 0.68, 0.84, 1]);
  assert.match(read("../app/respiracion.tsx"), /colors=\{NATURAL_GRADIENT\}/);
  assert.match(read("../app/respiracion.tsx"), /locations=\{NATURAL_GRADIENT_LOCATIONS\}/);
  for (const key of ["gradientStart", "gradientEnd", "accent"]) {
    assert.deepEqual(natural[key], themes.SCENE_THEMES.cloudy[key]);
  }
  assert.equal(themes.getThemeStyleId("natural"), "cloudy");
  assert.equal(themes.isIndigo2ThemeId("natural"), true);
});

test("Pleyades uses all seven supplied Andrómeda colors and inherits only Indigo 2's styles", () => {
  const pleyades = themes.SCENE_THEMES.pleyades;
  assert.equal(pleyades.id, "pleyades");
  assert.equal(pleyades.label, "Pleyades");
  assert.deepEqual(pleyades.gradient, ["#371C5F", "#332261", "#2D2468", "#242A6B", "#212B6D", "#1E2D6E", "#192E70"]);
  assert.equal(pleyades.solid, "#371C5F");
  for (const key of ["gradientLocations", "gradientStart", "gradientEnd", "accent"]) {
    assert.deepEqual(pleyades[key], themes.SCENE_THEMES.indigo2[key]);
  }
  assert.equal(themes.getThemeStyleId("pleyades"), "indigo2");
  assert.equal(themes.isIndigo2ThemeId("pleyades"), true);
  for (const id of ["tibet", "indigo2", "cloudy", "cloudy2", null, undefined]) {
    assert.equal(themes.getThemeStyleId(id), id);
  }
});

test("The provider keeps both new IDs, exact palettes and brightness support, independently of audio scenes", () => {
  for (const id of ["natural", "pleyades"]) {
    const ctx = providerHarness(id).render(id);
    assert.equal(ctx.activeSceneId, id);
    assert.equal(ctx.theme.id, id);
    assert.deepEqual(ctx.theme.gradient, themes.SCENE_THEMES[id].gradient);
    assert.deepEqual(providerHarness(id, true).render(id).theme.gradient, themes.SCENE_THEMES[id].gradient.map(brighten));
    assert.equal(themes.isVisualThemeId(id), true);
  }
});

test("Índigo 2 keeps its latest saturation, brightness and contrast adjustment, evenly spaced vertically", () => {
  const { indigo2 } = themes.SCENE_THEMES;
  assert.deepEqual(indigo2.gradient, ["#243462", "#242C60", "#252960", "#2A2462", "#2A255F", "#342462", "#372568"]);
  assert.equal(indigo2.solid, "#243462");
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
  assert.deepEqual(themes.VISUAL_THEME_IDS, ["tibet", "indigo2", "cloudy", "cloudy2", "natural", "pleyades"]);
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

test("All six visual IDs are accepted; old audio IDs never become visual themes", () => {
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

test("Legacy swatches remain valid but settings no longer expose a visual scene picker", () => {
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
  assert.deepEqual(selected, Array.from({ length: themes.VISUAL_THEME_IDS.length }, () => available).flat());
  const settings = read("../components/ProfileSettingsSections.tsx");
  assert.doesNotMatch(settings, /label: "Escenas"|themePicker|VisualThemeSwatches/);
  assert.doesNotMatch(settings, /Luz \/ Noche|setBrightMode/);
  for (const path of ["../app/configuraciones.tsx", "../components/ProfileScreenBase.tsx"]) {
    assert.match(read(path), /<ProfileSettingsSections/);
  }
});