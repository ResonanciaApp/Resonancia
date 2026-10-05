import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { URL } from "node:url";
import test from "node:test";
import ts from "typescript";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");
const source = read("../app/(tabs)/explore.tsx");
const ast = ts.createSourceFile("explore.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

function style(name: string, viewportWidth = 402) {
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
  return new Function("StyleSheet", "H_PAD", "SECTION_EXTRA_GAP", "width", "SECTION_GAP", compiled)(
    { hairlineWidth: 0.333 }, 16, 5, viewportWidth, 53,
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

test("six category blocks lead directly to Explore by time, then Nuevo en Resonancia, without duplicated sections", () => {
  let categories: ts.JsxElement | undefined;
  function visit(node: ts.Node) {
    if (ts.isJsxElement(node) && node.openingElement.attributes.getText(ast).includes("styles.categoryBlocksSection")) categories = node;
    ts.forEachChild(node, visit);
  }
  visit(ast);
  assert.ok(categories);
  assert.ok(ts.isJsxElement(categories.parent));
  const siblings = categories.parent.children.filter(node => ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node));
  const index = siblings.indexOf(categories);
  assert.equal(siblings[index + 1].getText(ast), "<View style={[styles.sectionSpacer, styles.categoryBlocksSpacer]} />");
  assert.ok(siblings[index + 2].getText(ast).startsWith("<View style={styles.durationSection}>"));
  assert.equal(siblings[index + 3].getText(ast), "<View style={styles.sectionSpacer} />");
  assert.ok(siblings[index + 4].getText(ast).startsWith("<View style={styles.newInResonanceSection}>"));
  assert.equal((source.match(/style=\{styles\.durationSection\}/g) ?? []).length, 1);
  assert.equal((source.match(/style=\{styles\.newInResonanceSection\}/g) ?? []).length, 1);
  assert.match(siblings[index + 2].getText(ast), /openCategory\(`\/busqueda\?tiempo=\$\{encodeURIComponent\(slot\.label\)\}`\)/);
  assert.match(siblings[index + 4].getText(ast), /onPress=\{\(\) => handleSessionPress\(session\)\}/);
  assert.equal(style("durationSection").marginBottom, style("newInResonanceSection").marginBottom);
});

test("Para este momento and its separator are hidden together, without changing Inicio", () => {
  assert.match(source, /const SHOW_FEATURED_MOMENT = false;/);
  let hidden: ts.JsxExpression | undefined;
  function visit(node: ts.Node) {
    if (ts.isJsxExpression(node) && node.expression && ts.isBinaryExpression(node.expression)
      && node.expression.left.getText(ast) === "SHOW_FEATURED_MOMENT") hidden = node;
    ts.forEachChild(node, visit);
  }
  visit(ast);
  assert.ok(hidden?.expression && ts.isBinaryExpression(hidden.expression));
  assert.equal(hidden.expression.operatorToken.kind, ts.SyntaxKind.AmpersandAmpersandToken);
  const fragment = ts.isParenthesizedExpression(hidden.expression.right)
    ? hidden.expression.right.expression
    : hidden.expression.right;
  assert.ok(ts.isJsxFragment(fragment));
  const children = fragment.children.filter(child => ts.isJsxElement(child) || ts.isJsxSelfClosingElement(child));
  assert.match(children[0].getText(ast), /Para este momento/);
  assert.equal(children[1].getText(ast), "<View style={styles.sectionSpacer} />");
  assert.match(read("../app/(tabs)/inicio8.tsx"), /Para este momento/);
});

test("all editorial playlist sections precede the Resonadores banner, keeping their standard separators", () => {
  let playlists: ts.JsxExpression | undefined;
  let banner: ts.JsxSelfClosingElement | undefined;
  function visit(node: ts.Node) {
    if (ts.isJsxExpression(node) && node.expression?.getText(ast).startsWith("editorialDiscoverCarousels.map(")) playlists = node;
    if (ts.isJsxSelfClosingElement(node) && node.tagName.getText(ast) === "ResonadoresBanner") banner = node;
    ts.forEachChild(node, visit);
  }
  visit(ast);
  assert.ok(playlists && banner);
  assert.equal(playlists.parent, banner.parent);
  assert.ok(ts.isJsxElement(banner.parent));
  const siblings = banner.parent.children.filter(node => !ts.isJsxText(node));
  const index = siblings.indexOf(banner);
  assert.equal(siblings[index - 1], playlists);
  const preceding = siblings[index - 2];
  assert.equal(preceding.getText(ast), "<View style={styles.sectionSpacer} />");
  assert.match(siblings[index - 3].getText(ast), /styles\.newInResonanceSection/);
  assert.match(playlists.getText(ast), /<View style=\{styles\.sectionSpacer\} \/>/);
  assert.equal((source.match(/editorialDiscoverCarousels\.map\(/g) ?? []).length, 1);
  assert.match(playlists.getText(ast), /openCategory\(`\/editorial-playlist\/\$\{encodeURIComponent\(playlist\.id\)\}`\)/);
});

test("objective cards have exactly 16px between columns and rows, without overflowing", () => {
  const grid = style("themeGrid");
  assert.equal(grid.columnGap, 16);
  assert.equal(grid.rowGap, 16);
  for (const width of [320, 375, 402, 768]) {
    const card = style("themeGridCard", width);
    assert.equal(card.width * 2 + grid.columnGap + 16 * 2, width);
  }
  const label = style("themeGridLabel");
  assert.equal(label.position, undefined);
  assert.equal(label.marginTop, 8);
  assert.equal(label.textAlign, "left");
  assert.equal(style("themeGridImageWrap").aspectRatio, 1.35);
});

test("objective titles sit below the image, inside the same navigable card", () => {
  let label: ts.JsxElement | undefined;
  function visit(node: ts.Node) {
    if (ts.isJsxElement(node) && node.openingElement.tagName.getText(ast) === "Text" &&
      node.openingElement.attributes.getText(ast).includes("styles.themeGridLabel")) label = node;
    ts.forEachChild(node, visit);
  }
  visit(ast);
  assert.ok(label);
  const card = label.parent;
  assert.ok(ts.isJsxElement(card));
  assert.equal(card.openingElement.tagName.getText(ast), "PressScale");
  const elements = card.children.filter(ts.isJsxElement);
  assert.equal(elements.length, 2);
  assert.ok(elements[0].openingElement.attributes.getText(ast).includes("styles.themeGridImageWrap"));
  assert.equal(elements[1], label);
  assert.ok(card.openingElement.attributes.getText(ast).includes("openCategory(`/tag/${encodeURIComponent(card.id)}`)"));
  const parsed = ts.transpileModule(source, {
    reportDiagnostics: true,
    compilerOptions: { jsx: ts.JsxEmit.React },
  });
  assert.deepEqual(parsed.diagnostics?.filter(d => d.category === ts.DiagnosticCategory.Error), []);
});