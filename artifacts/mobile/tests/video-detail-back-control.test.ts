import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

test("every video detail keeps the back control compact instead of stretching across the header", () => {
  const screen = readFileSync("app/video/[id].tsx", "utf8");
  const ast = ts.createSourceFile("video.tsx", screen, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let control: ts.JsxSelfClosingElement | undefined;
  function walk(node: ts.Node) {
    if (ts.isJsxSelfClosingElement(node) && node.tagName.getText(ast) === "BackPill") control = node;
    ts.forEachChild(node, walk);
  }
  walk(ast);
  assert.ok(control);
  const source = readFileSync("components/BackPill.tsx", "utf8");
  const nodes: { kind: string; props: any }[] = [];
  const flat = (value: any): any => Array.isArray(value) ? Object.assign({}, ...value.map(flat)) : value ?? {};
  const native = (kind: string) => (props: any) => {
    nodes.push({ kind, props });
    return React.createElement("div", { "data-kind": kind }, props.children);
  };
  const module = { exports: {} as { BackPill: React.ComponentType<any> } };
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true },
  }).outputText;
  const mocks: Record<string, unknown> = {
    react: React,
    "react-native": { View: native("View"), StyleSheet: { create: (value: unknown) => value } },
    "@expo/vector-icons": { Feather: native("Icon") },
    "@/components/PressableScale": { PressableScale: native("PressableScale") },
  };
  new Function("require", "module", "exports", compiled)((id: string) => {
    assert.ok(id in mocks, id);
    return mocks[id];
  }, module, module.exports);
  const caller = ts.transpileModule(`function make(router) { return (${control.getText(ast)}); }`, {
    compilerOptions: { jsx: ts.JsxEmit.React, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const make = new Function("React", "BackPill", `${caller}\nreturn make;`)(React, module.exports.BackPill);
  let backs = 0;
  renderToStaticMarkup(make({ back: () => { backs++; } }));
  const press = nodes.find(node => node.kind === "PressableScale")!.props;
  const container = flat(press.containerStyle);
  assert.equal(container.alignSelf, "flex-start");
  assert.notEqual(container.width, "100%");
  assert.notEqual(container.flex, 1);
  assert.equal(container.backgroundColor, "rgba(0,0,0,0.16)");
  const inner = nodes.find(node => node.kind === "View")!.props;
  assert.equal(flat(inner.style).width, 38);
  assert.equal(flat(inner.style).height, 38);
  assert.equal(nodes.find(node => node.kind === "Icon")!.props.name, "chevron-left");
  assert.equal(nodes.find(node => node.kind === "Icon")!.props.size, 28);
  press.onPress();
  assert.equal(backs, 1);
});
