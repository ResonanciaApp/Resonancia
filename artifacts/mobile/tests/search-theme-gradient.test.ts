import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { URL } from "node:url";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const source = readFileSync(new URL("../components/ContextSearchModal.tsx", import.meta.url), "utf8");
const ast = ts.createSourceFile("ContextSearchModal.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let background: ts.JsxElement | undefined;
let gradientCondition: ts.Expression | undefined;
let headerColor: ts.Expression | undefined;
function visit(node: ts.Node) {
  if (ts.isVariableDeclaration(node) && node.name.getText(ast) === "showThemeGradient") {
    gradientCondition = node.initializer;
  }
  if (ts.isJsxElement(node) && node.openingElement.tagName.getText(ast) === "View"
    && node.children.some(child => ts.isJsxExpression(child) && child.expression
      && ts.isBinaryExpression(child.expression) && child.expression.left.getText(ast) === "showThemeGradient")) {
    background = node;
  }
  if (ts.isPropertyAssignment(node) && node.name.getText(ast) === "backgroundColor"
    && ts.isConditionalExpression(node.initializer)
    && node.initializer.condition.getText(ast) === "showThemeGradient") {
    headerColor = node.initializer;
  }
  ts.forEachChild(node, visit);
}
visit(ast);
assert.ok(background && gradientCondition && headerColor);
const compiled = ts.transpileModule(`
  function renderBackground(theme, fullThemeBackground, thirdStopBackground) {
    const backgroundColor = thirdStopBackground ? theme.gradient[2] : theme.gradient[0];
    const showThemeGradient = ${gradientCondition.getText(ast)};
    return ${background.getText(ast)};
  }
`, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React } }).outputText;
let gradientProps: Record<string, unknown> | undefined;
const Gradient = (props: Record<string, unknown>) => {
  gradientProps = props;
  return React.createElement("div", { "data-testid": "full-theme-gradient" });
};
const renderBackground = new Function("React", "View", "LinearGradient", "StyleSheet", "styles",
  `${compiled}; return renderBackground;`)(React, ({ children }: { children: React.ReactNode }) =>
    React.createElement("div", null, children), Gradient, { absoluteFill: {}, absoluteFillObject: {} }, {});
const theme = {
  id: "indigo2",
  gradient: ["#1C2B59", "#1C2458", "#1D2158", "#221D57", "#221C59", "#2B1C59", "#2E1D60"],
  gradientLocations: [0, 0.167, 0.333, 0.5, 0.667, 0.833, 1],
  gradientStart: { x: 0, y: 0 },
  gradientEnd: { x: 0, y: 1 },
};

test("search background renders all theme stops, locations and direction without an opaque header", () => {
  gradientProps = undefined;
  const html = renderToStaticMarkup(renderBackground(theme, true, false));
  assert.match(html, /full-theme-gradient/);
  const props = gradientProps as Record<string, unknown> | undefined;
  assert.ok(props);
  assert.deepEqual(props.colors, theme.gradient);
  assert.deepEqual(props.locations, theme.gradientLocations);
  assert.deepEqual(props.start, theme.gradientStart);
  assert.deepEqual(props.end, theme.gradientEnd);
  const color = new Function("showThemeGradient", "backgroundColor", `return (${headerColor!.getText(ast)});`);
  assert.equal(color(true, "#flat"), "transparent");
});

test("other search callers retain their existing solid or Tibet treatment", () => {
  gradientProps = undefined;
  assert.doesNotMatch(renderToStaticMarkup(renderBackground(theme, false, true)), /full-theme-gradient/);
  assert.equal(gradientProps, undefined);
  assert.match(renderToStaticMarkup(renderBackground({ ...theme, id: "tibet" }, false, false)), /full-theme-gradient/);
});

test("Descubrir, Sonidos and Dormir all opt into the complete theme gradient", () => {
  for (const filename of ["explore", "sonidos", "descanzo"]) {
    const caller = readFileSync(new URL(`../app/(tabs)/${filename}.tsx`, import.meta.url), "utf8");
    const usage = caller.match(/<ContextSearchModal[\s\S]*?\/>/)?.[0];
    assert.ok(usage, filename);
    assert.match(usage, /\bfullThemeBackground\b/, filename);
    assert.doesNotMatch(usage, /\bthirdStopBackground\b/, filename);
  }
});

test("all category magnifying-glass searches, including collection/tag screens, use the complete theme gradient", () => {
  const screens = [
    "category/[id]",
    "category/meditaciones-guiadas",
    "category/musica-sonidos",
    "category/mananas",
    "category/noches",
    "category/sonidos-ancestrales",
    "category-tag/[category]/[tag]",
    "sleep-tag/[id]",
    "sound-tag/[id]",
  ];
  for (const screen of screens) {
    const caller = readFileSync(new URL(`../app/${screen}.tsx`, import.meta.url), "utf8");
    const usage = caller.match(/<ContextSearchModal[\s\S]*?\/>/)?.[0];
    assert.ok(usage, screen);
    assert.match(usage, /\bfullThemeBackground\b/, screen);
    assert.doesNotMatch(usage, /\bthirdStopBackground\b/, screen);
  }
});