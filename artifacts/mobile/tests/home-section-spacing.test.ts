import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { URL } from "node:url";
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
  SECTION_DIVIDER_COLOR: "rgba(255,255,255,0.12)",
};
function style(name: string) {
  const property = find(node => ts.isPropertyAssignment(node)
    && node.name.getText(ast) === name) as ts.PropertyAssignment;
  return evaluate(property.initializer.getText(ast), bindings);
}

test("Inicio section title sizing remains scoped to the active home variant", () => {
  const declaration = find(node => ts.isVariableDeclaration(node)
    && node.name.getText(ast) === "sectionTitleSize") as ts.VariableDeclaration;
  assert.equal(evaluate(declaration.initializer!.getText(ast), { variant: "inicio3" }), 19);
  assert.equal(evaluate(declaration.initializer!.getText(ast), { variant: "copy" }), 17);
  assert.equal(evaluate(declaration.initializer!.getText(ast), { variant: "original" }), 17);
  assert.match(home, /Para este momento/);
  assert.doesNotMatch(home, /MiRutinaSection/, "Mi rutina expansiva is shown in Perfil, not Inicio");
  for (const name of ["Sesiones recientes", "Mis favoritos"]) {
    const carousel = find(node => ts.isJsxSelfClosingElement(node)
      && node.tagName.getText(ast) === "SessionCarousel"
      && node.getText(ast).includes(`title="${name}"`)
      && node.getText(ast).includes("squareTitle")) as ts.JsxSelfClosingElement;
    assert.match(carousel.getText(ast), /titleSize=\{sectionTitleSize\}/);
  }
  assert.match(home, /titleSize=\{variant === "inicio3" \? 20 : 18\}/);
  assert.match(read("../components/AlmaCommunitySection.tsx"), /fontSize: titleSize/);
});

test("daily recommendations independently increase from 17 to 19 points", () => {
  const recommendations = read("../components/DailyRecommendationsSection.tsx");
  assert.match(recommendations, /title: \{[\s\S]*?fontSize: 19,/);
  assert.match(home, /<DailyRecommendationsSection[\s\S]*?inicio3Compact/);
});

test("Inicio 3 shows centered dividers in existing section gaps without changing their height", () => {
  const divider = style("inicio3SectionSpacer");
  assert.equal(divider.backgroundColor, bindings.SECTION_DIVIDER_COLOR);
  assert.equal(divider.borderWidth, undefined);
  const previousGap = 53 - 27 + 26 + bindings.INICIO3_SECTION_EXTRA_GAP + bindings.StyleSheet.hairlineWidth;
  const currentGap = 53 + divider.marginTop + divider.marginBottom + divider.height;
  assert.equal(currentGap, previousGap);
  assert.equal(53 + divider.marginTop, divider.marginBottom, "the line sits halfway between the two sections");
  assert.equal((home.match(/style=\{styles\.inicio3SectionSpacer\}/g) ?? []).length, 5);
  assert.doesNotMatch(home, /style=\{styles\.inicio3(?:Section|LowerStandalone)Divider\}/);
  assert.doesNotMatch(home, /inicio3LowerStandaloneSpacer/, "Frase del día must not keep a second gap after removing Mi rutina from Inicio");
  assert.match(home, /videos\.length > 0 && \(\s*<View style=\{styles\.inicio3SectionSpacer\} \/>/);
  for (const name of ["inicio3QuoteDivider"]) {
    const line = style(name);
    assert.equal(line.position, "absolute");
    assert.equal(line.backgroundColor, divider.backgroundColor);
    assert.equal(line.height, divider.height);
    assert.equal(line.left, bindings.GRID_PAD);
    assert.equal(line.right, bindings.GRID_PAD);
  }
  assert.doesNotMatch(home, /inicio3FeaturedDivider|inicio3PremiumDivider/, "No lines above Para este momento or below Muro de agradecimiento");
  assert.match(home, /bottom: isPremium \? 29 : 39/);
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