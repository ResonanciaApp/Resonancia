import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { URL } from "node:url";
import test from "node:test";
import ts from "typescript";
import { getThemeStyleId, SCENE_THEMES } from "../config/scene-themes.ts";
import { CLOUDY_REFLECTION_WALL_BORDER_GRADIENT, REFLECTION_WALL_BORDER_BASE_GRADIENT, REFLECTION_WALL_BORDER_GRADIENT } from "../constants/reflectionWallBorder.ts";

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
const resolveColors = new Function("theme", "SCENE_THEMES", "getThemeStyleId", ts.transpileModule(`return ${sheetGradientExpression.getText(ast)};`, {
  compilerOptions: { target: ts.ScriptTarget.ES2022 },
}).outputText);
type ThemePalette = { id: string; gradient: readonly string[] };
const colorsFor = (theme: ThemePalette) => resolveColors(theme, SCENE_THEMES, getThemeStyleId);
const backgroundExpression = source.match(/backgroundColor:\s*(sheetGradient\[\d+\])/)?.[1];
assert.ok(backgroundExpression);
const resolveBackground = new Function("sheetGradient", `return ${backgroundExpression};`);
const backgroundFor = (theme: ThemePalette) => resolveBackground(colorsFor(theme));

test("Galactic timer and evening reminder use the first four theme stops", () => {
  const theme = SCENE_THEMES.galactic;
  assert.deepEqual(colorsFor(theme), theme.gradient.slice(0, 4));
  const reminder = readFileSync(new URL("../components/SleepReminderSheet.tsx", import.meta.url), "utf8");
  const expression = reminder.match(/const gradient = ([\s\S]*?);/)?.[1];
  assert.ok(expression);
  const resolve = new Function("theme", "isMorning", "getThemeStyleId", "SCENE_THEMES", ts.transpileModule(`return ${expression};`, {
    compilerOptions: { target: ts.ScriptTarget.ES2022 },
  }).outputText);
  assert.deepEqual(resolve(theme, false, getThemeStyleId, SCENE_THEMES), theme.gradient.slice(0, 4));
  assert.deepEqual(resolve(theme, true, getThemeStyleId, SCENE_THEMES), ["#C96D68", "#855269", "#443044"]);
});

test("Ambiental duration sheet preserves the active theme stops outside Indigo 2 and Cloudy", () => {
  for (const theme of Object.values(SCENE_THEMES)) {
    if (getThemeStyleId(theme.id) === "indigo2" || getThemeStyleId(theme.id) === "cloudy") continue;
    assert.deepEqual(colorsFor(theme), [theme.gradient[1], theme.gradient[2]]);
    assert.equal(backgroundFor(theme), theme.gradient[1]);
    const changedTheme = { ...theme, gradient: theme.gradient.map(color => `${color}-changed`) };
    assert.deepEqual(colorsFor(changedTheme), [changedTheme.gradient[1], changedTheme.gradient[2]]);
    assert.equal(backgroundFor(changedTheme), changedTheme.gradient[1]);
  }
});

test("Cloudy duration selector uses the first four stops across its whole background", () => {
  assert.deepEqual(colorsFor(SCENE_THEMES.cloudy), SCENE_THEMES.cloudy.gradient.slice(0, 4));
  assert.equal(backgroundFor(SCENE_THEMES.cloudy), SCENE_THEMES.cloudy.gradient[0]);
  assert.match(source, /locations=\{getThemeStyleId\(theme\.id\) === "cloudy" \? \[0, 1 \/ 3, 2 \/ 3, 1\] : undefined\}/);
  assert.match(source, /start=\{getThemeStyleId\(theme\.id\) === "cloudy" \? theme\.gradientStart : undefined\}/);
  assert.match(source, /end=\{getThemeStyleId\(theme\.id\) === "cloudy" \? theme\.gradientEnd : undefined\}/);
});

test("Indigo 2 duration sheet uses its complete gradient", () => {
  assert.deepEqual(colorsFor(SCENE_THEMES.indigo2), SCENE_THEMES.indigo2.gradient);
  assert.equal(backgroundFor(SCENE_THEMES.indigo2), SCENE_THEMES.indigo2.gradient[0]);
});

test("selected duration circles use 30% black in Cloudy and Indigo 2 without changing the + or other themes", () => {
  const expression = source.match(/const selectedPresetBackground = (.*);/)?.[1];
  assert.ok(expression);
  const resolve = new Function("theme", "getThemeStyleId", `return ${expression};`);
  for (const theme of Object.values(SCENE_THEMES)) {
    assert.equal(resolve(theme, getThemeStyleId), getThemeStyleId(theme.id) === "cloudy" || getThemeStyleId(theme.id) === "indigo2" ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.16)");
  }
  assert.match(source, /backgroundColor: selected\s*\? selectedPresetBackground/);
  const customExpression = source.match(/const selectedCustomBackground = (.*);/)?.[1];
  assert.ok(customExpression);
  const resolveCustom = new Function("theme", "getThemeStyleId", `return ${customExpression};`);
  for (const theme of Object.values(SCENE_THEMES)) {
    assert.equal(resolveCustom(theme, getThemeStyleId), getThemeStyleId(theme.id) === "cloudy" ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.16)");
  }
  assert.match(source, /backgroundColor: customMode\s*\? selectedCustomBackground/);
});

test("Cloudy and Indigo wall borders share the supplied palette with 25% brighter RGB channels", () => {
  assert.equal(CLOUDY_REFLECTION_WALL_BORDER_GRADIENT, REFLECTION_WALL_BORDER_GRADIENT);
  assert.notEqual(REFLECTION_WALL_BORDER_GRADIENT, REFLECTION_WALL_BORDER_BASE_GRADIENT);
  assert.equal(REFLECTION_WALL_BORDER_GRADIENT.length, 8);
  for (let i = 0; i < REFLECTION_WALL_BORDER_BASE_GRADIENT.length; i++) {
    for (const channel of [1, 3, 5]) {
      assert.equal(
        parseInt(REFLECTION_WALL_BORDER_GRADIENT[i].slice(channel, channel + 2), 16),
        Math.min(255, Math.round(parseInt(REFLECTION_WALL_BORDER_BASE_GRADIENT[i].slice(channel, channel + 2), 16) * 1.25)),
      );
    }
  }
  const wall = readFileSync(new URL("../components/InnerSpaceCard.tsx", import.meta.url), "utf8");
  assert.match(wall, /colors=\{getThemeStyleId\(theme\.id\) === "cloudy" \? CLOUDY_REFLECTION_WALL_BORDER_GRADIENT : REFLECTION_WALL_BORDER_GRADIENT\}/);
});