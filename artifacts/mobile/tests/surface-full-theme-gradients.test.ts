import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { URL } from "node:url";
import test from "node:test";
import ts from "typescript";

const theme = {
  gradient: ["#1C2B59", "#1C2458", "#1D2158", "#221D57", "#221C59", "#2B1C59", "#2E1D60"],
  gradientLocations: [0, 0.167, 0.333, 0.5, 0.667, 0.833, 1],
  gradientStart: { x: 0, y: 0 },
  gradientEnd: { x: 0, y: 1 },
};

for (const screen of ["historial", "descargas", "diario", "notificaciones"]) {
  test(`${screen} uses every theme stop, its complete locations and its direction`, () => {
    const source = readFileSync(new URL(`../app/${screen}.tsx`, import.meta.url), "utf8");
    const ast = ts.createSourceFile(`${screen}.tsx`, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    let gradient: ts.JsxOpeningElement | undefined;
    function visit(node: ts.Node) {
      if (!gradient && ts.isJsxOpeningElement(node) && node.tagName.getText(ast) === "LinearGradient") gradient = node;
      ts.forEachChild(node, visit);
    }
    visit(ast);
    assert.ok(gradient);
    for (const name of ["colors", "locations", "start", "end"]) {
      assert.equal(gradient.attributes.properties.filter(prop => ts.isJsxAttribute(prop) && prop.name.getText(ast) === name).length, 1,
        `${name} must not be overridden by a duplicate gradient attribute`);
    }
    const fields = ["colors", "locations", "start", "end"].map(name => {
      const attr = gradient!.attributes.properties.find(prop => ts.isJsxAttribute(prop) && prop.name.getText(ast) === name);
      assert.ok(attr && ts.isJsxAttribute(attr) && attr.initializer && ts.isJsxExpression(attr.initializer) && attr.initializer.expression, name);
      return `${name}: ${attr.initializer.expression.getText(ast)}`;
    });
    const compiled = ts.transpileModule(`function build(theme, sceneTheme) { return { ${fields.join(",")} }; }`,
      { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
    const build = new Function(`${compiled}; return build;`)();
    for (const fixture of [theme, { ...theme, gradient: ["#060A0F", "#121629"], gradientLocations: undefined }]) {
      const props = build(fixture, fixture);
      assert.deepEqual(props.colors, fixture.gradient);
      assert.deepEqual(props.locations, fixture.gradientLocations);
      assert.deepEqual(props.start, fixture.gradientStart);
      assert.deepEqual(props.end, fixture.gradientEnd);
      assert.equal(props.colors.length, fixture.gradient.length);
    }
  });
}