import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const BLACK16 = "rgba(0,0,0,0.16)";
const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
function styleBackground(path: string, name: string) {
  const ast = ts.createSourceFile(path, read(path), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let result: string | undefined;
  function visit(node: ts.Node) {
    if (ts.isPropertyAssignment(node) && node.name.getText(ast) === name &&
        ts.isObjectLiteralExpression(node.initializer)) {
      const background = node.initializer.properties.find(property =>
        ts.isPropertyAssignment(property) && property.name.getText(ast) === "backgroundColor");
      if (background && ts.isPropertyAssignment(background)) {
        assert.ok(ts.isStringLiteral(background.initializer));
        result = background.initializer.text;
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(ast);
  assert.ok(result, `${path} / ${name}: missing background`);
  return result;
}

test("Category, internal, library and playlist filter tabs use black16 for every theme variant", () => {
  const screens: [string, string[], string, string][] = [
    ...["meditaciones-guiadas", "musica-sonidos", "sonidos-ancestrales", "noches"].map(name =>
      [`app/category/${name}.tsx`, ["chip", "chipTibet", "chipIndigo", "chipIndigo2Inactive"], "chipSel", "#F9F9F9"] as [string, string[], string, string]),
    ["app/category/[id].tsx", ["chip", "chipTibet", "chipIndigo", "chipIndigo2Inactive"], "chipSelected", "#F9F9F9"],
    ["app/category-tag/[category]/[tag].tsx", ["chip"], "chipSelected", "#F9F9F9"],
    ["app/music-tag/[id].tsx", ["chip"], "chipSelected", "#F9F9F9"],
    ["components/CategoryEditorialFilterTabs.tsx", ["chip"], "chipSelected", "#F9F9F9"],
    ["components/SupercategoryFilterTabs.tsx", ["chip"], "chipSelected", "#F9F9F9"],
    ["components/VideoScreen.tsx", ["chip", "chipTibet", "chipIndigo"], "chipSel", "#F9F9F9"],
    ["app/favoritos-todos.tsx", ["pill", "pillTibet", "pillIndigo", "pillIndigo2Inactive"], "pillSel", "#FFFFFF"],
    ["components/PlaylistAddSessionsSheet.tsx", ["tab"], "tabSelected", "#FFFFFF"],
    ["app/(tabs)/musica.tsx", ["pillTab"], "pillTabSel", "rgba(0,0,0,0.31)"],
    ["components/ExpandConsciousnessSection.tsx", ["tab"], "tabSelected", "#78221E"],
    ["app/mezclas/index.tsx", ["tabBlock"], "tabBlockSel", "rgba(74,12,12,0.08)"],
  ];
  for (const [path, inactive, active, selectedColor] of screens) {
    for (const name of inactive) assert.equal(styleBackground(path, name), BLACK16, `${path} / ${name}`);
    assert.equal(styleBackground(path, active), selectedColor, `${path}: selected appearance preserved`);
  }
  for (const name of ["chip", "chipTibet", "chipIndigo", "chipIndigo2Inactive"]) {
    assert.equal(styleBackground("components/BibliotecaScreen.tsx", name), BLACK16);
  }
  for (const name of ["discoverPill", "discoverPillTibet", "discoverPillIndigo", "discoverPillIndigo2"]) {
    assert.equal(styleBackground("app/(tabs)/explore.tsx", name), BLACK16);
  }
  for (const [path, name] of [
    ["app/(tabs)/descanzo.tsx", "sleepPill"],
    ["app/(tabs)/sonidos.tsx", "pill"],
  ]) assert.equal(styleBackground(path, name), BLACK16);
});

test("Dynamic tab styling cannot reintroduce colored backgrounds or change selected colors", () => {
  const recommended = read("components/RecommendedForYouSection.tsx");
  assert.match(recommended, /const tabBackground = "rgba\(0,0,0,0.16\)"/);
  assert.match(recommended, /backgroundColor: selected \? "#F9F9F9" : tabBackground/);
  assert.match(read("app/mezclas-comunidad.tsx"), /sel \? \["#F9F9F9", "#F9F9F9"\] : \["rgba\(0,0,0,0.16\)", "rgba\(0,0,0,0.16\)"\]/);
  assert.match(read("app/(tabs)/geometrix.tsx"), /on \? styles.catChipOn : \{ backgroundColor: "rgba\(0,0,0,0.16\)" \}/);
  assert.match(read("app/category/mananas.tsx"), /tab !== activeTab && \{ backgroundColor: "rgba\(0,0,0,0.16\)" \}/);
  assert.match(read("app/category/noches.tsx"), /outputRange: \["rgba\(0,0,0,0.16\)", "rgba\(0,0,0,0.16\)"\]/);
});

test("Editorial filters render opaque selected tabs and black16 inactive tabs, retaining selection behavior", () => {
  const flatten = (style: any): any => Array.isArray(style)
    ? Object.assign({}, ...style.map(flatten)) : style && typeof style === "object" ? style : {};
  const presses: (() => void)[] = [];
  const Native = ({ children, style, onPress, accessibilityState }: any) => {
    if (onPress) presses.push(onPress);
    return React.createElement("div", {
      "data-background": flatten(style).backgroundColor,
      "data-selected": accessibilityState?.selected,
    }, children);
  };
  const module = { exports: {} as any };
  const mocks: any = {
    react: React,
    "react-native": { View: Native, Text: Native, Pressable: Native, ScrollView: Native, StyleSheet: { create: (s: any) => s } },
  };
  const compiled = ts.transpileModule(read("components/CategoryEditorialFilterTabs.tsx"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true },
  }).outputText;
  new Function("require", "module", "exports", compiled)((name: string) => {
    assert.ok(name in mocks);
    return mocks[name];
  }, module, module.exports);
  let selected: string | undefined;
  for (const active of ["all", "editorial:Calma"]) {
    presses.length = 0;
    const html = renderToStaticMarkup(React.createElement(module.exports.CategoryEditorialFilterTabs, {
      editorialTags: ["Calma", "Enfoque"], active, onSelect: (id: string) => { selected = id; },
    }));
    assert.equal((html.match(/data-background="rgba\(0,0,0,0.16\)"/g) ?? []).length, 2);
    assert.equal((html.match(/data-background="#F9F9F9"/g) ?? []).length, 1);
    assert.equal((html.match(/data-selected="true"/g) ?? []).length, 1);
    assert.match(html, /Ver todo/);
    presses[2]();
    assert.equal(selected, "editorial:Enfoque");
  }
});