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
  assert.match(source("../constants/premiumOfferBackground.ts"), /PREMIUM_OFFER_BACKGROUND = PREMIUM_BACKGROUND_GRADIENT/);
});

test("The scene selector uses two rows of three", () => {
  const drawer = source("../components/DrawerSceneCards.tsx");
  assert.match(drawer, /id: "galactic", title: "Galactic"/);
  assert.match(drawer, /SCENES\.slice\(0, 3\), SCENES\.slice\(3, 6\)/);
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
  assert.doesNotMatch(drawer, /numberOfLines/);
});
