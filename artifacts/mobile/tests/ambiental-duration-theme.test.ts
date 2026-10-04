import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { URL } from "node:url";
import test from "node:test";
import ts from "typescript";
import { SCENE_THEMES } from "../config/scene-themes.ts";
import { CLOUDY_REFLECTION_WALL_BORDER_GRADIENT, REFLECTION_WALL_BORDER_GRADIENT } from "../constants/reflectionWallBorder.ts";
import { MOOD_HISTORY_GRADIENT } from "../constants/moodHistoryGradient.ts";

const source = readFileSync(new URL("../components/AmbientalDurationSheet.tsx", import.meta.url), "utf8");
const ast = ts.createSourceFile("AmbientalDurationSheet.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let gradientExpression: ts.Expression | undefined;
let sheetGradientExpression: ts.Expression | undefined;
function visit(node: ts.Node) {
  if (ts.isVariableDeclaration(node) && node.name.getText(ast) === "sheetGradient") {
    sheetGradientExpression = node.initializer;
  }
  if (ts.isJsxSelfClosingElement(node) && node.tagName.getText(ast) === "LinearGradient") {
    const attribute = node.attributes.properties.find(property =>
      ts.isJsxAttribute(property) && property.name.getText(ast) === "colors",
    );
    if (attribute && ts.isJsxAttribute(attribute) && attribute.initializer
      && ts.isJsxExpression(attribute.initializer)) {
      gradientExpression = attribute.initializer.expression;
    }
  }
  ts.forEachChild(node, visit);
}
visit(ast);
assert.ok(gradientExpression, "Duration sheet defines its gradient colors");
assert.equal(gradientExpression.getText(ast), "sheetGradient");
assert.ok(sheetGradientExpression);
const resolveColors = new Function("theme", "SCENE_THEMES", ts.transpileModule(`return ${sheetGradientExpression.getText(ast)};`, {
  compilerOptions: { target: ts.ScriptTarget.ES2022 },
}).outputText);
type ThemePalette = { id: string; gradient: readonly string[] };
const colorsFor = (theme: ThemePalette) => resolveColors(theme, SCENE_THEMES);
const backgroundExpression = source.match(/backgroundColor:\s*(sheetGradient\[\d+\])/)?.[1];
assert.ok(backgroundExpression);
const resolveBackground = new Function("sheetGradient", `return ${backgroundExpression};`);
const backgroundFor = (theme: ThemePalette) => resolveBackground(colorsFor(theme));

test("Ambiental duration sheet preserves the active theme stops outside Indigo 2", () => {
  for (const theme of Object.values(SCENE_THEMES)) {
    if (theme.id === "indigo2") continue;
    assert.deepEqual(colorsFor(theme), [theme.gradient[1], theme.gradient[2]]);
    assert.equal(backgroundFor(theme), theme.gradient[1]);
    const changedTheme = { ...theme, gradient: theme.gradient.map(color => `${color}-changed`) };
    assert.deepEqual(colorsFor(changedTheme), [changedTheme.gradient[1], changedTheme.gradient[2]]);
    assert.equal(backgroundFor(changedTheme), changedTheme.gradient[1]);
  }
});

test("Indigo 2 duration sheet uses the Universo violet gradient without altering global theme colors", () => {
  assert.deepEqual(colorsFor(SCENE_THEMES.indigo2), ["#332261", "#2E2468"]);
  assert.equal(backgroundFor(SCENE_THEMES.indigo2), "#332261");
  assert.deepEqual(colorsFor(SCENE_THEMES.indigo2), colorsFor(SCENE_THEMES.tibet));
  assert.equal(SCENE_THEMES.indigo2.gradient[1], "#242C60");
  assert.equal(SCENE_THEMES.indigo2.gradient[2], "#252960");
});

test("selected duration circles use 30% black in Cloudy and Indigo 2 without changing the + or other themes", () => {
  const expression = source.match(/const selectedPresetBackground = (.*);/)?.[1];
  assert.ok(expression);
  const resolve = new Function("theme", `return ${expression};`);
  for (const theme of Object.values(SCENE_THEMES)) {
    assert.equal(resolve(theme), theme.id === "cloudy" || theme.id === "indigo2" ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.16)");
  }
  assert.match(source, /backgroundColor: selected\s*\? selectedPresetBackground/);
  const customExpression = source.match(/const selectedCustomBackground = (.*);/)?.[1];
  assert.ok(customExpression);
  const resolveCustom = new Function("theme", `return ${customExpression};`);
  for (const theme of Object.values(SCENE_THEMES)) {
    assert.equal(resolveCustom(theme), theme.id === "cloudy" ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.16)");
  }
  assert.match(source, /backgroundColor: customMode\s*\? selectedCustomBackground/);
});

test("Cloudy and Indigo wall borders share mood-history colors with 20% brighter RGB channels", () => {
  assert.equal(CLOUDY_REFLECTION_WALL_BORDER_GRADIENT, REFLECTION_WALL_BORDER_GRADIENT);
  assert.notEqual(REFLECTION_WALL_BORDER_GRADIENT, MOOD_HISTORY_GRADIENT);
  for (let i = 0; i < MOOD_HISTORY_GRADIENT.length; i++) {
    for (const channel of [1, 3, 5]) {
      assert.equal(
        parseInt(REFLECTION_WALL_BORDER_GRADIENT[i].slice(channel, channel + 2), 16),
        Math.min(255, Math.round(parseInt(MOOD_HISTORY_GRADIENT[i].slice(channel, channel + 2), 16) * 1.2)),
      );
    }
  }
  const wall = readFileSync(new URL("../components/InnerSpaceCard.tsx", import.meta.url), "utf8");
  assert.match(wall, /colors=\{theme\.id === "cloudy" \? CLOUDY_REFLECTION_WALL_BORDER_GRADIENT : REFLECTION_WALL_BORDER_GRADIENT\}/);
});