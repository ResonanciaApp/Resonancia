import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { URL } from "node:url";
import test from "node:test";
import ts from "typescript";
import { SCENE_THEMES } from "../config/scene-themes.ts";
import { CLOUDY_REFLECTION_WALL_BORDER_GRADIENT, REFLECTION_WALL_BORDER_GRADIENT } from "../constants/reflectionWallBorder.ts";

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

test("Cloudy selected preset and custom duration use 30% black; other themes keep 16%", () => {
  const expression = source.match(/const selectedPresetBackground = (.*);/)?.[1];
  assert.ok(expression);
  const resolve = new Function("theme", `return ${expression};`);
  for (const theme of Object.values(SCENE_THEMES)) {
    assert.equal(resolve(theme), theme.id === "cloudy" ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.16)");
  }
  assert.match(source, /backgroundColor: selected\s*\? selectedPresetBackground/);
  assert.match(source, /backgroundColor: customMode\s*\? selectedPresetBackground/);
});

test("Cloudy wall adds 3% brightness to the prior blue-purple stops and keeps warm stops unchanged", () => {
  assert.deepEqual(CLOUDY_REFLECTION_WALL_BORDER_GRADIENT.slice(4), REFLECTION_WALL_BORDER_GRADIENT.slice(4));
  for (let i = 0; i < 4; i++) {
    const priorStops = ["#5175B0", "#627FCA", "#7B74CB", "#9870BE"];
    const expected = "#" + priorStops[i].slice(1).match(/../g)!.map(channel =>
      Math.round(parseInt(channel, 16) * 1.03).toString(16).padStart(2, "0"),
    ).join("").toUpperCase();
    assert.equal(CLOUDY_REFLECTION_WALL_BORDER_GRADIENT[i], expected);
  }
  const wall = readFileSync(new URL("../components/InnerSpaceCard.tsx", import.meta.url), "utf8");
  assert.match(wall, /colors=\{theme\.id === "cloudy" \? CLOUDY_REFLECTION_WALL_BORDER_GRADIENT : REFLECTION_WALL_BORDER_GRADIENT\}/);
});