import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { URL } from "node:url";
import ts from "typescript";

const source = readFileSync(new URL("../config/scene-themes.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;
const exports = {} as typeof import("../config/scene-themes");
new Function("exports", compiled)(exports);

test("Índigo 2 uses the seven reference colors vertically, with matching uniform stops", () => {
  const theme = exports.SCENE_THEMES.indigo2;
  assert.deepEqual(theme.gradient, ["#212C6B", "#1E285E", "#1D2158", "#1F1D58", "#251D57", "#2B1C59", "#2D1C59"]);
  assert.deepEqual(theme.gradientLocations, [0, 1 / 6, 2 / 6, 3 / 6, 4 / 6, 5 / 6, 1]);
  assert.equal(theme.gradientLocations?.length, theme.gradient.length);
  assert.equal(theme.solid, theme.gradient[0]);
  assert.deepEqual(theme.gradientStart, { x: 0.5, y: 0 });
  assert.deepEqual(theme.gradientEnd, { x: 0.5, y: 1 });
});

test("the palette update does not change Universo or the default visual theme", () => {
  assert.equal(exports.DEFAULT_THEME_ID, "tibet");
  assert.deepEqual(exports.SCENE_THEMES.tibet.gradient, ["#262355", "#2A2460", "#282565", "#232C60", "#262F6B", "#283175"]);
  assert.equal(exports.SCENE_THEMES.tibet.solid, "#0B1438");
});