import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { URL } from "node:url";
import ts from "typescript";

const source = readFileSync(new URL("../app/(tabs)/inicio8.tsx", import.meta.url), "utf8");
const ast = ts.createSourceFile("inicio8.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

test("Inicio's gratitude wall is visible for free and Premium users without changing the home variant scope", () => {
  let gate: ts.Expression | undefined;
  const visit = (node: ts.Node) => {
    if (ts.isJsxExpression(node) && node.expression && ts.isBinaryExpression(node.expression)
      && node.expression.right.getText(ast).includes("<AlmaCommunitySection")) {
      gate = node.expression.left;
    }
    ts.forEachChild(node, visit);
  };
  visit(ast);
  assert.ok(gate);
  const visible = new Function("isInicio2", "isPremium", `return (${gate.getText(ast)});`);
  assert.equal(visible(true, false), true);
  assert.equal(visible(true, true), true);
  assert.equal(visible(false, false), false);
  assert.equal(visible(false, true), false);
  const wall = readFileSync(new URL("../components/AlmaCommunitySection.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(wall, /showPremiumGate|requirePremium|usePremium/);
  assert.match(wall, /router\.push\("\/mensajes-del-alma"/);
});
