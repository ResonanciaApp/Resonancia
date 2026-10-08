import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

const source = readFileSync(new URL("../app/crear-rutina.tsx", import.meta.url), "utf8");
const ast = ts.createSourceFile("crear-rutina.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let close: ts.JsxOpeningElement | undefined;
let styleObject: ts.ObjectLiteralExpression | undefined;
function visit(node: ts.Node) {
  if (ts.isJsxOpeningElement(node) && node.attributes.properties.some(
    attr => ts.isJsxAttribute(attr) && attr.name.getText(ast) === "testID"
      && attr.initializer?.getText(ast) === '"crear-rutina-close"',
  )) close = node;
  if (ts.isVariableDeclaration(node) && node.name.getText(ast) === "styles"
    && node.initializer && ts.isCallExpression(node.initializer)) {
    styleObject = node.initializer.arguments[0] as ts.ObjectLiteralExpression;
  }
  ts.forEachChild(node, visit);
}
visit(ast);
assert.ok(close && styleObject);
const definitions: Record<string, unknown> = {};
for (const name of ["headerSide", "closeButton"]) {
  const prop = styleObject.properties.find(p => ts.isPropertyAssignment(p) && p.name.getText(ast) === name);
  assert.ok(prop && ts.isPropertyAssignment(prop));
  definitions[name] = new Function(`return (${prop.initializer.getText(ast)});`)();
}
const style = close.attributes.properties.find(p => ts.isJsxAttribute(p) && p.name.getText(ast) === "style");
assert.ok(style && ts.isJsxAttribute(style) && style.initializer && ts.isJsxExpression(style.initializer) && style.initializer.expression);
const compiled = ts.transpileModule(`return (${style.initializer.expression.getText(ast)});`, {
  compilerOptions: { target: ts.ScriptTarget.ES2022 },
}).outputText;

test("Crear actividad X is a centered 43px circle with the requested theme opacity", () => {
  for (const id of ["natural", "cloudy", "indigo2", "pleyades", "cloudy2", "tibet"]) {
    const resolve = new Function("styles", "activeTheme", compiled)(definitions, { id });
    for (const pressed of [false, true]) {
      const actual = Object.assign({}, ...resolve({ pressed }));
      assert.equal(actual.width, 43);
      assert.equal(actual.height, 43);
      assert.equal(actual.borderRadius, 21.5);
      assert.equal(actual.alignItems, "center");
      assert.equal(actual.justifyContent, "center");
      assert.equal(actual.backgroundColor, ["natural", "cloudy"].includes(id) ? "rgba(0,0,0,0.19)" : "rgba(0,0,0,0.16)");
      assert.equal(actual.opacity, pressed ? 0.6 : 1);
    }
  }
  assert.match(close!.getText(ast), /onPress=\{\(\) => router\.back\(\)\}/);
});
