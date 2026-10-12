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

test("Galactic is under Noche in the first column", () => {
  const drawer = source("../components/DrawerSceneCards.tsx");
  assert.match(drawer, /id: "galactic", title: "Galactic"/);
  assert.match(drawer, /\[SCENES\[0\], SCENES\[1\], SCENES\[4\]\]/);
});
