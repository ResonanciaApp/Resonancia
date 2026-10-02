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

test("Índigo 2 keeps its seven vertical stops and applies 4% HSL desaturation to each color", () => {
  const theme = exports.SCENE_THEMES.indigo2;
  const original = ["#1C2B59", "#1C2458", "#1D2158", "#221D57", "#221C59", "#2B1C59", "#2E1D60"];
  const desaturated = original.map((hex) => {
    const rgb = hex.slice(1).match(/../g)!.map(channel => parseInt(channel, 16));
    const lightness = (Math.min(...rgb) + Math.max(...rgb)) / 2;
    // HSL saturation × 0.96 at the same hue/lightness, rounded to 8-bit RGB.
    return "#" + rgb.map(channel =>
      Math.round(lightness + (channel - lightness) * 0.96).toString(16).padStart(2, "0"),
    ).join("").toUpperCase();
  });
  assert.deepEqual(theme.gradient, desaturated);
  assert.deepEqual(theme.gradient, ["#1D2C58", "#1D2557", "#1E2257", "#231E56", "#231D58", "#2C1D58", "#2F1E5F"]);
  assert.deepEqual(theme.gradientLocations, [0, 0.167, 0.333, 0.5, 0.667, 0.833, 1]);
  assert.equal(theme.gradientLocations?.length, theme.gradient.length);
  assert.equal(theme.solid, theme.gradient[0]);
  assert.deepEqual(theme.gradientStart, { x: 0.5, y: 0 });
  assert.deepEqual(theme.gradientEnd, { x: 0.5, y: 1 });
  assert.equal(theme.accent, "#E8E8E8");
});

test("Universo uses the supplied seven-color vertical gradient and retains its dark solid fallback", () => {
  assert.equal(exports.DEFAULT_THEME_ID, "tibet");
  assert.deepEqual(exports.SCENE_THEMES.tibet.gradient, ["#0F2E72", "#1A2D70", "#202A6E", "#23286C", "#2D226A", "#322063", "#371A61"]);
  assert.deepEqual(exports.SCENE_THEMES.tibet.gradientLocations, [0, 0.167, 0.333, 0.5, 0.667, 0.833, 1]);
  assert.equal(exports.SCENE_THEMES.tibet.gradientLocations?.length, exports.SCENE_THEMES.tibet.gradient.length);
  assert.deepEqual(exports.SCENE_THEMES.tibet.gradientStart, { x: 0.5, y: 0 });
  assert.deepEqual(exports.SCENE_THEMES.tibet.gradientEnd, { x: 0.5, y: 1 });
  assert.equal(exports.SCENE_THEMES.tibet.solid, "#0B1438");
});