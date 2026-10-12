import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";
import { SCENE_THEMES, getThemeStyleId } from "../config/scene-themes.ts";

const source = readFileSync(new URL("../app/editorial-playlist/[slug].tsx", import.meta.url), "utf8");
const ast = ts.createSourceFile("playlist.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const declarations: string[] = [];
const roots: string[] = [];
function visit(node: ts.Node) {
  if (ts.isVariableDeclaration(node) && ["playlistBackground", "playlistBackgroundColor"].includes(node.name.getText(ast))) {
    declarations.push(`const ${node.getText(ast)};`);
  }
  if (ts.isJsxElement(node) && node.openingElement.attributes.getText(ast).includes("styles.root")) {
    const gradient = node.children.find(child => ts.isJsxSelfClosingElement(child)
      && child.tagName.getText(ast) === "LinearGradient");
    assert.ok(gradient, "root paints its background in both available and unavailable states");
    roots.push(`${node.openingElement.getText(ast)}${gradient.getText(ast)}</View>`);
  }
  ts.forEachChild(node, visit);
}
visit(ast);
assert.equal(declarations.length, 2);
assert.equal(roots.length, 2);
const colorsSource = readFileSync(new URL("../constants/colors.ts", import.meta.url), "utf8");
const legacyDeclaration = colorsSource.match(/export const EDITORIAL_PLAYLIST_GRADIENT = ([^\n]+);/)?.[1];
assert.ok(legacyDeclaration);
const compiled = ts.transpileModule(`
  const EDITORIAL_PLAYLIST_GRADIENT = ${legacyDeclaration};
  ${declarations.join("\n")}
  return { background: playlistBackground, solid: playlistBackgroundColor, rendered: <>${roots.join("\n")}</> };
`, { compilerOptions: { jsx: ts.JsxEmit.React, target: ts.ScriptTarget.ES2022 } }).outputText;
const View = ({ style, children }: any) => React.createElement("div", {
  "data-solid": Object.assign({}, ...style).backgroundColor,
}, children);
const LinearGradient = ({ colors, locations, start, end }: any) => React.createElement("div", {
  "data-colors": colors.join(","),
  "data-locations": locations?.join(","),
  "data-start": start && `${start.x},${start.y}`,
  "data-end": end && `${end.x},${end.y}`,
});
const evaluate = new Function("activeSceneId", "theme", "React", "View", "LinearGradient", "styles", "StyleSheet", "getThemeStyleId", compiled);
function background(id: keyof typeof SCENE_THEMES, theme = SCENE_THEMES[id]) {
  return evaluate(id, theme, React, View, LinearGradient, { root: {} }, { absoluteFill: {} }, getThemeStyleId);
}

test("Cloudy paints the full theme in both music/meditation detail and unavailable states", () => {
  const result = background("cloudy");
  const theme = SCENE_THEMES.cloudy;
  assert.deepEqual(result.background, {
    colors: theme.gradient, locations: theme.gradientLocations, start: theme.gradientStart, end: theme.gradientEnd,
  });
  assert.equal(result.solid, theme.solid);
  const html = renderToStaticMarkup(result.rendered);
  assert.equal(html.split(`data-solid="${theme.solid}"`).length - 1, 2);
  assert.equal(html.split(`data-colors="${theme.gradient.join(",")}"`).length - 1, 2);
  assert.match(html, /data-locations="0,0.167,0.333,0.5,0.667,0.833,1"/);
  assert.match(html, /data-start="0.5,0" data-end="0.5,1"/);
});

test("Galactic and Fuego paint their entire theme gradient", () => {
  for (const id of ["galactic", "fuego"] as const) {
    const result = background(id);
    const theme = SCENE_THEMES[id];
    assert.deepEqual(result.background, { colors: theme.gradient, locations: theme.gradientLocations, start: theme.gradientStart, end: theme.gradientEnd });
    assert.equal(result.solid, theme.solid);
  }
});

test("other themes retain the editorial palette and original default gradient direction", () => {
  for (const id of ["indigo2", "tibet", "cloudy2"] as const) {
    const result = background(id);
    assert.deepEqual(result.background, { colors: ["#363459", "#231E53", "#2B1E53", "#2E1E53"] });
    assert.equal(result.solid, "#363459");
    assert.doesNotMatch(renderToStaticMarkup(result.rendered), /data-locations|data-start|data-end/);
  }
});

test("Cloudy reads the current theme rather than freezing its palette or brightness", () => {
  const theme = { ...SCENE_THEMES.cloudy, solid: "#ABCDEF", gradient: ["#ABCDEF", "#FFFFFF"] as const };
  const result = background("cloudy", theme);
  assert.equal(result.solid, theme.solid);
  assert.deepEqual(result.background.colors, theme.gradient);
});