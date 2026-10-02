import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");
const source = read("../app/(tabs)/explore.tsx");
const ast = ts.createSourceFile("explore.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

function style(name: string) {
  let expression: string | undefined;
  function visit(node: ts.Node) {
    if (ts.isPropertyAssignment(node) && node.name.getText(ast) === name) {
      expression = node.initializer.getText(ast);
    }
    ts.forEachChild(node, visit);
  }
  visit(ast);
  assert.ok(expression, `Missing ${name}`);
  const compiled = ts.transpileModule(`return (${expression});`, {
    compilerOptions: { target: ts.ScriptTarget.ES2022 },
  }).outputText;
  return new Function("StyleSheet", "H_PAD", "SECTION_EXTRA_GAP", compiled)(
    { hairlineWidth: 0.333 }, 16, 5,
  );
}

test("the active Descubrir route uses 19-point section titles, including editorial carousels", () => {
  const route = read("../app/(tabs)/explore-copia.tsx");
  assert.match(route, /<ExploreScreen/);
  assert.equal(style("sectionTitle").fontSize, 19);
  assert.equal(style("pageTitle").fontSize, 30);
  assert.equal(style("stickyTitle").fontSize, 18);
  assert.equal(style("newInResonanceTitle").fontSize, 14);
  assert.match(source, /<EditorialPlaylistCarousel\s+title=\{carousel\.title\}\s+titleSize=\{19\}/);
  const editorial = read("../components/EditorialPlaylistCarousel.tsx");
  assert.match(editorial, /titleSize = 17/);
  assert.match(editorial, /styles\.title, \{ fontSize: titleSize \}/);
});

test("all section separators become transparent spacers with exactly five extra pixels", () => {
  const spacer = style("sectionSpacer");
  assert.equal(spacer.backgroundColor, undefined);
  assert.equal(spacer.borderWidth, undefined);
  assert.equal(spacer.marginTop, -27);
  assert.equal(spacer.marginBottom, 31);
  const previousGap = -27 + 26 + 0.333;
  const newGap = spacer.marginTop + spacer.marginBottom + spacer.height;
  assert.equal(Math.round((newGap - previousGap) * 1000) / 1000, 5);
  assert.equal((source.match(/styles\.sectionSpacer/g) ?? []).length, 6);
  assert.doesNotMatch(source, /styles\.(sectionDivider|categoryBlocksDivider)/);
  assert.equal(style("stickyDivider").backgroundColor, "rgba(255,255,255,0.07)");
});

test("spacing begins after the six category blocks without changing the grid's internal gaps", () => {
  const spacer = style("sectionSpacer");
  const categorySpacer = style("categoryBlocksSpacer");
  assert.equal(categorySpacer.marginTop, -24);
  const newGap = categorySpacer.marginTop + spacer.marginBottom + spacer.height;
  const previousGap = -24 + 26 + 0.333;
  assert.equal(Math.round((newGap - previousGap) * 1000) / 1000, 5);
  assert.match(source, /<ContentCategoryGrid\s+marginTop=\{0\}\s+marginBottom=\{0\}/);
  assert.match(source, /styles\.sectionSpacer, styles\.categoryBlocksSpacer/);
});