import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");
const home = read("../app/(tabs)/inicio8.tsx");
const ast = ts.createSourceFile("inicio8.tsx", home, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
function find(predicate: (node: ts.Node) => boolean) {
  let result: ts.Node | undefined;
  function visit(node: ts.Node) {
    if (!result && predicate(node)) result = node;
    if (!result) ts.forEachChild(node, visit);
  }
  visit(ast);
  assert.ok(result);
  return result;
}
function evaluate(expression: string, values: Record<string, unknown>) {
  const js = ts.transpileModule(`return (${expression});`, {
    compilerOptions: { target: ts.ScriptTarget.ES2022 },
  }).outputText;
  return new Function(...Object.keys(values), js)(...Object.values(values));
}
const bindings = {
  GRID_PAD: 18, StyleSheet: { hairlineWidth: 0.333 },
  INICIO3_SECTION_EXTRA_GAP: 5,
};
function style(name: string) {
  const property = find(node => ts.isPropertyAssignment(node)
    && node.name.getText(ast) === name) as ts.PropertyAssignment;
  return evaluate(property.initializer.getText(ast), bindings);
}

test("Inicio section titles grow by three points without changing other home variants", () => {
  const declaration = find(node => ts.isVariableDeclaration(node)
    && node.name.getText(ast) === "sectionTitleSize") as ts.VariableDeclaration;
  assert.equal(evaluate(declaration.initializer!.getText(ast), { variant: "inicio3" }), 20);
  assert.equal(evaluate(declaration.initializer!.getText(ast), { variant: "copy" }), 17);
  assert.equal(evaluate(declaration.initializer!.getText(ast), { variant: "original" }), 17);
  assert.match(home, /Para este momento/);
  assert.match(home, /<MiRutinaSection titleSize=\{sectionTitleSize\}/);
  for (const name of ["Sesiones recientes", "Mis favoritos"]) {
    const carousel = find(node => ts.isJsxSelfClosingElement(node)
      && node.tagName.getText(ast) === "SessionCarousel"
      && node.getText(ast).includes(`title="${name}"`)
      && node.getText(ast).includes("squareTitle")) as ts.JsxSelfClosingElement;
    assert.match(carousel.getText(ast), /titleSize=\{sectionTitleSize\}/);
  }
  assert.match(home, /titleSize=\{variant === "inicio3" \? 21 : 18\}/);
  assert.match(read("../components/MiRutinaSection.tsx"), /fontSize: titleSize/);
  assert.match(read("../components/AlmaCommunitySection.tsx"), /fontSize: titleSize/);
});

test("section spacers remove visible dividers and add exactly five pixels to the existing gaps", () => {
  for (const [name, previousTop, previousBottom] of [
    ["inicio3SectionSpacer", -27, 26],
    ["inicio3LowerStandaloneSpacer", 4, 36],
  ] as const) {
    const spacer = style(name);
    assert.equal(spacer.backgroundColor, undefined);
    assert.equal(spacer.borderWidth, undefined);
    const before = previousTop + previousBottom + bindings.StyleSheet.hairlineWidth;
    const after = spacer.marginTop + spacer.marginBottom + spacer.height;
    assert.equal(Math.round((after - before) * 1000) / 1000, 5);
  }
  assert.doesNotMatch(home, /style=\{styles\.inicio3(?:Section|LowerStandalone)Divider\}/);
  assert.match(home, /marginTop: variant === "inicio3" \? -8 : 0/);
});

test("quote and community gaps increase by five pixels, with component defaults preserved", () => {
  for (const [tagName, previousGap] of [["DailyWisdomCard", 53], ["AlmaCommunitySection", 28]] as const) {
    const element = find(node => ts.isJsxSelfClosingElement(node)
      && node.tagName.getText(ast) === tagName) as ts.JsxSelfClosingElement;
    const attribute = element.attributes.properties.find(node => ts.isJsxAttribute(node)
      && node.name.getText(ast) === "style") as ts.JsxAttribute;
    const expression = (attribute.initializer as ts.JsxExpression).expression!.getText(ast);
    assert.deepEqual(evaluate(expression, { ...bindings, variant: "inicio3" }), { marginBottom: previousGap + 5 });
    assert.equal(evaluate(expression, { ...bindings, variant: "copy" }), undefined);
  }
  assert.match(read("../components/DailyWisdomCard.tsx"), /styles\.card,[\s\S]*?style,/);
  assert.match(read("../components/AlmaCommunitySection.tsx"), /style=\{\[styles\.section, style\]\}/);
});