import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { URL } from "node:url";
import test from "node:test";
import React from "react";
import ts from "typescript";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");
const shared = read("../components/CategoryLandingSections.tsx");
const music = read("../app/category/musica-sonidos.tsx");
const internal = read("../app/tag/[id].tsx");
const night = read("../app/category/noches.tsx");
const morning = read("../app/category/mananas.tsx");
function expression(source: string, predicate: (node: ts.Node) => boolean) {
  const ast = ts.createSourceFile("screen.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let result: ts.Node | undefined;
  const visit = (node: ts.Node) => {
    if (!result && predicate(node)) result = node;
    if (!result) ts.forEachChild(node, visit);
  };
  visit(ast);
  assert.ok(result);
  return { node: result, ast };
}
function evaluate(code: string, bindings: Record<string, unknown>) {
  const compiled = ts.transpileModule(code, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.React },
  }).outputText;
  return new Function(...Object.keys(bindings), compiled)(...Object.values(bindings));
}
function style(source: string, name: string) {
  const { node, ast } = expression(source, node => ts.isPropertyAssignment(node) && node.name.getText() === name);
  const value = (node as ts.PropertyAssignment).initializer.getText(ast);
  return evaluate(`return (${value});`, { StyleSheet: { hairlineWidth: 0.333 }, H_PAD: 16, TEXT: "text" });
}
function renderLanding(sessions: unknown[], tabs: string[], categoryId = "meditaciones-guiadas") {
  const { node, ast } = expression(shared, node =>
    ts.isFunctionDeclaration(node) && node.name?.text === "CategoryLandingSections");
  const declaration = node.getText(ast).replace(/^export\s+/, "");
  const render = evaluate(`${declaration}; return CategoryLandingSections;`, {
    React, View: "view", SessionCarousel: "carousel", H_PAD: 16, CONTENT_CAROUSEL_GAP: 14,
    useWindowDimensions: () => ({ width: 402 }),
    getCategorySessionTags: (session: { tags: string[] }) => session.tags,
    styles: { sectionSpacer: style(shared, "sectionSpacer") },
  });
  const selected: string[] = [];
  const result = render({
    categoryId, sessions, tabs, isPremium: true, onPress: () => {},
    onOpenSubcategory: (tag: string) => selected.push(tag),
  });
  return { result, selected };
}
const sessions = [
  { id: "a", tags: ["Calma"] },
  { id: "b", tags: ["Respiración"] },
];

test("Shared category sections preserve the first offset and grow only subsequent gaps by five pixels", () => {
  for (const category of ["meditaciones-guiadas", "sonidos-ancestrales", "ambientales", "binaurales"]) {
    const { result, selected } = renderLanding(sessions, ["Calma", "Respiración"], category);
    assert.equal(result.props.children[0], null);
    const [first, second] = result.props.children[1];
    assert.equal(first.props.children[0], null);
    assert.equal(first.props.children[1].props.style.marginTop, 33);
    assert.equal(first.props.children[1].props.titleSize, 19);
    const spacer = second.props.children[0].props.style;
    assert.equal(spacer.backgroundColor, undefined);
    assert.equal(spacer.marginTop, 31);
    assert.equal(spacer.height, 0.333);
    assert.equal(second.props.children[1].props.style.marginTop, 26);
    assert.equal(second.props.children[1].props.titleSize, 19);
    assert.equal(Math.round((spacer.marginTop + spacer.height + 26 - (26 + 0.333 + 26)) * 1000) / 1000, 5);
    first.props.children[1].props.onViewAll();
    assert.deepEqual(selected, ["Calma"]);
    assert.equal(first.props.children[1].props.ambientalTitleOnly, category === "ambientales");
  }
});

test("Featured-to-first-collection spacing also grows by exactly five pixels, not twice", () => {
  const featured = { id: "featured", tags: [], isFeaturedCategory: true };
  const { result } = renderLanding([featured, ...sessions], ["Calma", "Respiración"]);
  const featuredFragment = result.props.children[0];
  assert.equal(featuredFragment.props.children[0].props.titleSize, 19);
  assert.equal(featuredFragment.props.children[0].props.style.marginTop, 33);
  assert.equal(featuredFragment.props.children[1].props.style.marginTop, 31);
  assert.equal(result.props.children[1][0].props.children[1].props.style.marginTop, 33);
  assert.equal(renderLanding([], []).result, null);
  const featuredOnly = renderLanding([featured], []).result;
  assert.equal(featuredOnly.props.children[0].props.children[1], null);
});

test("Music uses 19-point carousel headings and transparent spacers while keeping its first placement", () => {
  assert.equal((music.match(/titleSize=\{19\}/g) ?? []).length, 2);
  assert.doesNotMatch(music, /styles\.sectionDivider/);
  assert.equal(style(music, "sectionSpacer").marginTop, 31);
  assert.equal(style(music, "sectionSpacer").backgroundColor, undefined);
  assert.match(music, /marginTop: index === 0 && featuredSessions\.length === 0 \? 33 : 26/);
});

test("Internal theme sections increase headings and add five pixels only after the first carousel", () => {
  assert.match(internal, /title=\{label\}\s+titleSize=\{19\}/);
  assert.match(internal, /index > 0 && styles\.followingInternalCarousel/);
  assert.equal(style(internal, "followingInternalCarousel").paddingTop, 5);
  assert.deepEqual(style(internal, "firstInternalCarousel"), {
    transform: [{ translateY: -6 }], marginTop: 23,
  });
  assert.match(internal, /internalLabel && mainSessions\.length > 0[\s\S]*?showHeader=\{false\}[\s\S]*?gridLayout/);
});

test("Manual category sections grow by two points and keep their separators transparent with five extra pixels", () => {
  assert.equal(style(night, "featuredTitle").fontSize, 21);
  assert.equal(style(night, "featuredTitle").marginTop, 10);
  assert.equal(style(morning, "sectionTitle").fontSize, 22);
  for (const source of [night, morning]) {
    const spacer = style(source, "featuredSpacer");
    assert.equal(spacer.marginTop, 25);
    assert.equal(spacer.height, 1);
    assert.equal(spacer.backgroundColor, undefined);
  }
  assert.match(morning, /marginTop: 5, marginBottom: 10[\s\S]*?Recientes/);
});

test("Single-grid internal category destinations stay grids, with their headers hidden", () => {
  for (const path of [
    "../app/category-tag/[category]/[tag].tsx",
    "../app/music-tag/[id].tsx",
    "../app/sleep-tag/[id].tsx",
    "../app/sound-tag/[id].tsx",
  ]) {
    const source = read(path);
    assert.match(source, /showHeader=\{false\}/);
    assert.match(source, /gridLayout/);
  }
});