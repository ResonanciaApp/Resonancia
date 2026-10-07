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

test("Descubrir restores centered visible separators without changing existing gaps", () => {
  const spacer = style("sectionSpacer");
  assert.equal(spacer.backgroundColor, "rgba(255,255,255,0.12)");
  assert.equal(spacer.borderWidth, undefined);
  assert.equal(53 + spacer.marginTop, spacer.marginBottom);
  const previousGap = -27 + 26 + 0.333;
  const newGap = spacer.marginTop + spacer.marginBottom + spacer.height;
  assert.equal(Math.round((newGap - previousGap) * 1000) / 1000, 5);
  assert.equal((source.match(/styles\.sectionSpacer/g) ?? []).length, 7);
  assert.doesNotMatch(source, /styles\.(sectionDivider|categoryBlocksDivider)/);
  assert.equal(style("stickyDivider").backgroundColor, "rgba(255,255,255,0.07)");
});

test("spacing begins after the six category blocks without changing the grid's internal gaps", () => {
  const spacer = style("sectionSpacer");
  const categorySpacer = style("categoryBlocksSpacer");
  assert.equal(53 + categorySpacer.marginTop, categorySpacer.marginBottom);
  const newGap = categorySpacer.marginTop + categorySpacer.marginBottom + spacer.height;
  const previousGap = -24 + 26 + 0.333;
  assert.equal(Math.round((newGap - previousGap) * 1000) / 1000, 5);
  assert.match(source, /<ContentCategoryGrid\s+marginTop=\{0\}\s+marginBottom=\{0\}/);
  assert.match(source, /styles\.sectionSpacer, styles\.categoryBlocksSpacer/);
});

test("Explore by time follows Para este momento with standard spacing and appears only once", () => {
  let banner: ts.JsxSelfClosingElement | undefined;
  let duration: ts.JsxElement | undefined;
  function visit(node: ts.Node) {
    if (ts.isJsxSelfClosingElement(node) && node.tagName.getText(ast) === "ResonadoresBanner") banner = node;
    if (ts.isJsxElement(node) && node.openingElement.attributes.getText(ast) === "style={styles.durationSection}") duration = node;
    ts.forEachChild(node, visit);
  }
  visit(ast);
  assert.ok(duration);
  assert.ok(ts.isJsxFragment(duration.parent));
  const sectionSiblings = duration.parent.children.filter(node => ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node));
  const durationIndex = sectionSiblings.indexOf(duration);
  assert.ok(sectionSiblings[durationIndex - 2].getText(ast).startsWith("<View style={styles.featuredMomentSection}>"));
  assert.equal(sectionSiblings[durationIndex - 1].getText(ast), "<View style={styles.sectionSpacer} />");
  assert.equal(sectionSiblings.at(-1), duration);
  assert.match(duration.getText(ast), /openCategory\(`\/busqueda\?tiempo=\$\{encodeURIComponent\(slot\.label\)\}`\)/);
  assert.ok(banner);
  assert.ok(ts.isJsxElement(banner.parent));
  const siblings = banner.parent.children.filter(node => ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node));
  const index = siblings.indexOf(banner);
  assert.ok(siblings[index - 2].getText(ast).startsWith("<View style={styles.otherThemesSection}>"));
  assert.equal(siblings[index - 1].getText(ast), "<View style={[styles.sectionSpacer, styles.resonadoresSpacer]} />");
  const bannerSpacer = style("resonadoresSpacer");
  assert.equal(53 + bannerSpacer.marginTop, bannerSpacer.marginBottom + 3);
  const standardSpacer = style("sectionSpacer");
  assert.equal(bannerSpacer.marginTop, standardSpacer.marginTop);
  assert.equal(bannerSpacer.marginBottom + 3, standardSpacer.marginBottom);
  const communitySpacer = style("communityDivider");
  assert.equal(communitySpacer.marginTop, standardSpacer.marginTop);
  assert.equal(communitySpacer.marginBottom + 18, standardSpacer.marginBottom);
  assert.equal(siblings[index + 1].getText(ast), "<View style={[styles.sectionSpacer, styles.communityDivider]} />");
  assert.ok(siblings[index + 2].getText(ast).startsWith("<CommunityMixesCarousel"));
  assert.match(banner.getText(ast), /router\.push\("\/equipo" as never\)/);
  assert.equal((source.match(/style=\{styles\.durationSection\}/g) ?? []).length, 1);
  assert.equal(style("durationSection").marginBottom, style("newInResonanceSection").marginBottom);
});

test("editorial playlists precede Nuevo en Resonancia without duplicate separators", () => {
  let playlists: ts.JsxExpression | undefined;
  let banner: ts.JsxSelfClosingElement | undefined;
  let newSessions: ts.JsxElement | undefined;
  function visit(node: ts.Node) {
    if (ts.isJsxExpression(node) && node.expression?.getText(ast).startsWith("editorialDiscoverCarousels.map(")) playlists = node;
    if (ts.isJsxSelfClosingElement(node) && node.tagName.getText(ast) === "ResonadoresBanner") banner = node;
    if (ts.isJsxElement(node) && node.openingElement.attributes.getText(ast) === "style={styles.newInResonanceSection}") newSessions = node;
    ts.forEachChild(node, visit);
  }
  visit(ast);
  assert.ok(playlists && banner && newSessions);
  assert.equal(playlists.parent, banner.parent);
  assert.equal(newSessions.parent, banner.parent);
  assert.ok(ts.isJsxElement(banner.parent));
  const siblings = banner.parent.children.filter(node => !ts.isJsxText(node)
    && (!ts.isJsxExpression(node) || node.expression !== undefined));
  const index = siblings.indexOf(newSessions);
  assert.ok(playlists.getStart(ast) < newSessions.getStart(ast));
  assert.ok(playlists.getStart(ast) < banner.getStart(ast));
  const bannerIndex = siblings.indexOf(banner);
  assert.equal(siblings[bannerIndex - 1].getText(ast), "<View style={[styles.sectionSpacer, styles.resonadoresSpacer]} />");
  assert.equal((source.match(/<ResonadoresBanner /g) ?? []).length, 1);
  assert.equal((source.match(/style=\{styles\.newInResonanceSection\}/g) ?? []).length, 1);
  assert.match(newSessions.getText(ast), /onPress=\{\(\) => handleSessionPress\(session\)\}/);
  const preceding = siblings[index - 1];
  assert.equal(preceding.getText(ast), "<View style={styles.sectionSpacer} />");
  assert.equal(siblings[index - 2], playlists);
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