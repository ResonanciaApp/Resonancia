import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const profile = readFileSync(new URL("../components/ProfileScreenBase.tsx", import.meta.url), "utf8");
const ast = ts.createSourceFile("ProfileScreenBase.tsx", profile, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

test("Perfil mounts the existing functional routine immediately below Mi muro, only in the dedicated profile", () => {
  assert.match(profile, /import \{ MiRutinaSection \} from "@\/components\/MiRutinaSection"/);
  assert.equal((profile.match(/<MiRutinaSection /g) ?? []).length, 1);
  let wall: ts.JsxSelfClosingElement | undefined;
  let routine: ts.JsxSelfClosingElement | undefined;
  function visit(node: ts.Node) {
    if (ts.isJsxSelfClosingElement(node)) {
      if (node.tagName.getText(ast) === "ProfileReflectionWallSection") wall = node;
      if (node.tagName.getText(ast) === "MiRutinaSection") routine = node;
    }
    ts.forEachChild(node, visit);
  }
  visit(ast);
  assert.ok(wall && routine);
  assert.equal(routine.parent, wall.parent);
  assert.ok(ts.isJsxFragment(routine.parent));
  const siblings = routine.parent.children.filter(node => !ts.isJsxText(node));
  assert.equal(siblings[siblings.indexOf(wall) + 1], routine);
  assert.match(wall.getText(ast), /style=\{\{ marginTop: 30 \}\}/);
  assert.doesNotMatch(routine.getText(ast), /marginTop|translateY/, "the routine follows the wall's 30px shift without an additional 30px offset");
  const gate = routine.parent.parent;
  assert.ok(ts.isParenthesizedExpression(gate));
  assert.ok(ts.isBinaryExpression(gate.parent));
  assert.equal(gate.parent.left.getText(ast), "dedicated");

  let receivedStyle: unknown;
  const Routine = ({ style }: { style: unknown }) => {
    receivedStyle = style;
    return React.createElement("div", { "data-testid": "mi-rutina-section" }, "Mi rutina expansiva");
  };
  const gap = Number(profile.match(/const PROFILE_SECTION_GAP = (\d+);/)?.[1]);
  const compiled = ts.transpileModule(`return dedicated ? (${routine.getText(ast)}) : null;`, {
    compilerOptions: { jsx: ts.JsxEmit.React },
  }).outputText;
  const render = new Function("React", "MiRutinaSection", "PROFILE_SECTION_GAP", "dedicated", compiled);
  assert.match(renderToStaticMarkup(render(React, Routine, gap, true)), /Mi rutina expansiva/);
  assert.deepEqual(receivedStyle, { marginHorizontal: 0, marginBottom: gap });
  assert.equal(render(React, Routine, gap, false), null);

  const tabs = readFileSync(new URL("../app/(tabs)/_layout.tsx", import.meta.url), "utf8");
  assert.match(tabs, /<RoutineCompletionBannerProvider>[\s\S]*?<TabLayoutInner \/>[\s\S]*?<\/RoutineCompletionBannerProvider>/);
  const home = readFileSync(new URL("../app/(tabs)/inicio8.tsx", import.meta.url), "utf8");
  assert.equal((home.match(/<MiRutinaSection /g) ?? []).length, 1, "inserting it in Perfil must not remove it from Inicio");
});
