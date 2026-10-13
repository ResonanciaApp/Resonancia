import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

const source = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");
const themes: any = {};
new Function("exports", ts.transpileModule(source("../config/scene-themes.ts"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText)(themes);

test("Galactic inherits Indigo 2 and reverses the exact Premium background", () => {
  const theme = themes.SCENE_THEMES.galactic;
  assert.deepEqual(theme.gradient, [...themes.PREMIUM_BACKGROUND_GRADIENT].reverse());
  assert.equal(theme.solid, theme.gradient[0]);
  assert.equal(theme.accent, themes.SCENE_THEMES.indigo2.accent);
  assert.equal(themes.getThemeStyleId(theme.id), "indigo2");
  assert.equal(themes.isIndigo2ThemeId(theme.id), true);
  assert.equal(themes.isVisualThemeId(theme.id), true);
});

test("Galactic is under Noche in the first column", () => {
  const drawer = source("../components/DrawerSceneCards.tsx");
  assert.match(drawer, /id: "galactic", title: "Galactic"/);
  assert.match(drawer, /\[SCENES\[0\], SCENES\[1\], SCENES\[4\]\]/);
});

test("Fuego uses the six supplied stops and inherits Cloudy", () => {
  const theme = themes.SCENE_THEMES.fuego;
  assert.deepEqual(theme.gradient, ["#7C432B", "#7C432B", "#7B412A", "#7C3F2B", "#7C3B2C", "#7C372C"]);
  assert.deepEqual(theme.gradientLocations, [0, .2, .4, .6, .8, 1]);
  assert.equal(theme.solid, theme.gradient[0]);
  assert.equal(themes.getThemeStyleId(theme.id), "cloudy");
  assert.equal(themes.isVisualThemeId(theme.id), true);
  assert.equal(themes.isIndigo2ThemeId(theme.id), true);
  const drawer = source("../components/DrawerSceneCards.tsx");
  assert.match(drawer, /id: "fuego", title: "Fuego"/);
  assert.match(drawer, /\[SCENES\[2\], SCENES\[3\], SCENES\[5\]\]/);
});

test("Fuego journey pills and world/universe labels use a warm palette", () => {
  const journey = source("../components/GrowthJourney.tsx");
  assert.equal((journey.match(/theme\.id === "fuego" \? "rgba\(255,214,191,0\.20\)"/g) ?? []).length, 3);
  assert.match(journey, /color: theme\.id === "fuego" \? "#FFD6BF"/);
  for (const [file, variable] of [
    ["GrowthJourneyMap.tsx", "worldColor"],
    ["GrowthJourneyHelpSheet.tsx", "universeColor"],
  ]) {
    const content = source(`../components/${file}`);
    const expression = content.match(new RegExp(`const ${variable} = ([\\s\\S]*?);`))?.[1];
    assert.ok(expression);
    const resolve = new Function("theme", "getThemeStyleId", "CLOUDY_GROWTH_STAGE_LABEL_COLOR", "POSITIONED_DAY_GRADIENT", `return (${expression});`);
    assert.equal(resolve({ id: "fuego" }, themes.getThemeStyleId, "#B5EFFF", ["#gold"]), "#FFD6BF");
    assert.equal(resolve({ id: "galactic" }, themes.getThemeStyleId, "#B5EFFF", ["#gold"]), "#BEDFF5");
    assert.equal(resolve({ id: "natural" }, themes.getThemeStyleId, "#B5EFFF", ["#gold"]), "#E5FFDB");
    assert.equal(resolve({ id: "cloudy" }, themes.getThemeStyleId, "#B5EFFF", ["#gold"]), "#B5EFFF");
  }
});

test("Galactic coordinates tab tint, icon/text colors, widget and journey pills", () => {
  const tabColors: any = {};
  new Function("exports", ts.transpileModule(source("../constants/tab-bar.ts"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText)(tabColors);
  assert.equal(tabColors.getTabBarGlassOverlay("galactic"), "rgba(9,18,41,0.744)");
  assert.equal(tabColors.getTabBarInactiveColor("galactic"), "#D5E5F2");
  assert.equal(tabColors.getTabBarInactiveColor("galactic"), tabColors.getTabBarInactiveColor("cloudy"));
  assert.match(source("../app/(tabs)/_layout.tsx"), /activeColor=\{activeSceneId === "fuego" \? "#FFF5EF" : ACTIVE_COLOR\}/);
  assert.match(source("../app/(tabs)/inicio8.tsx"), /activeTheme\.id === "galactic" \? GALACTIC_WIDGET_PLUS_GRADIENT/);
  const palette = themes.SCENE_THEMES.galactic.gradient;
  const brighter = [palette[0], palette[palette.length - 1]].map((hex: string) =>
    "#" + [1, 3, 5].map(offset => Math.round(parseInt(hex.slice(offset, offset + 2), 16) * 1.05).toString(16).padStart(2, "0")).join("").toUpperCase(),
  );
  assert.deepEqual(brighter, ["#0D3A55", "#1A1B47"]);
  assert.match(source("../constants/colors.ts"), /GALACTIC_WIDGET_PLUS_GRADIENT = \["#0D3A55", "#1A1B47"\]/);
  const journey = source("../components/GrowthJourney.tsx");
  assert.equal((journey.match(/theme\.id === "galactic" && \{ backgroundColor: "rgba\(190,223,245,0\.20\)" \}/g) ?? []).length, 3);
  assert.match(journey, /theme\.id === "galactic" && \{ color: "#BEDFF5" \}/);
});
