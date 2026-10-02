import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { URL } from "node:url";
import test from "node:test";
import ts from "typescript";
import { SCENE_THEMES } from "../config/scene-themes.ts";

const source = readFileSync(new URL("../components/AmbientalDurationSheet.tsx", import.meta.url), "utf8");
const ast = ts.createSourceFile("AmbientalDurationSheet.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let gradientExpression: ts.Expression | undefined;
function visit(node: ts.Node) {
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
const colorsFor = new Function("theme", ts.transpileModule(`return ${gradientExpression.getText(ast)};`, {
  compilerOptions: { target: ts.ScriptTarget.ES2022 },
}).outputText);
const backgroundExpression = source.match(/backgroundColor:\s*(theme\.gradient\[\d+\])/)?.[1];
assert.ok(backgroundExpression);
const backgroundFor = new Function("theme", `return ${backgroundExpression};`);

test("Ambiental duration sheet uses only the second and third active theme stops", () => {
  for (const theme of Object.values(SCENE_THEMES)) {
    assert.deepEqual(colorsFor(theme), [theme.gradient[1], theme.gradient[2]]);
    assert.equal(backgroundFor(theme), theme.gradient[1]);
    const changedTheme = { ...theme, gradient: theme.gradient.map(color => `${color}-changed`) };
    assert.deepEqual(colorsFor(changedTheme), [changedTheme.gradient[1], changedTheme.gradient[2]]);
    assert.equal(backgroundFor(changedTheme), changedTheme.gradient[1]);
  }
});