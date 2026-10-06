import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { URL } from "node:url";
import test from "node:test";
import ts from "typescript";

const source = readFileSync(new URL("../components/ContentCategoryGrid.tsx", import.meta.url), "utf8");
const ast = ts.createSourceFile("grid.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
function style(name: string) {
  let value: ts.Expression | undefined;
  function visit(node: ts.Node) {
    if (ts.isPropertyAssignment(node) && node.name.getText(ast) === name) value = node.initializer;
    ts.forEachChild(node, visit);
  }
  visit(ast);
  assert.ok(value);
  const js = ts.transpileModule(`return (${value.getText(ast)});`, {}).outputText;
  return new Function("StyleSheet", js)({ absoluteFillObject: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0 } });
}

test("Discover blocks are eight pixels shorter, with the icon/text group centered", () => {
  assert.match(source, /cardHeight = Math\.round\(cardWidth \* 0\.66\) \+ 2 - 8/);
  const content = style("discoverCardContent");
  assert.equal(content.alignItems, "center");
  assert.equal(content.justifyContent, "center");
  assert.equal(content.top, 0);
  assert.equal(content.bottom, 0);
  const icon = style("discoverCardIcon");
  assert.equal(icon.marginBottom, 0); // Previously 5.
  assert.equal(icon.height, 29); // Shrinks with the icons to preserve surrounding space.
  const label = style("discoverCardTitle");
  assert.equal(label.fontSize, 11);
  assert.equal(label.lineHeight, 16);
  assert.equal(label.textAlign, "center");
  assert.equal(label.includeFontPadding, false);
});

test("all six Discover icons are exactly three points smaller, including the Sounds shortcut", () => {
  const fn = ast.statements.find((node) => ts.isFunctionDeclaration(node) && node.name?.text === "renderCategoryIcon");
  assert.ok(fn);
  const js = ts.transpileModule(`${fn.getText(ast)};return renderCategoryIcon;`, {
    compilerOptions: { jsx: ts.JsxEmit.React, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const React = { createElement: (_type: string, props: any) => ({ props }) };
  const render = new Function("React", "ExpoImage", "MaterialCommunityIcons", "require", "CATEGORY_ICON_COLOR", js)(
    React, "Image", "Icon", (path: string) => path, "#F9F9F9",
  );
  assert.match(source, /renderCategoryIcon\(category, false, true, -5, isSoundsShortcut\)/);
  for (const id of ["meditaciones-guiadas", "sonidos-ancestrales", "musica-sonidos", "ambientales", "historias", "charlas"]) {
    const category = { id, color: "#fff" };
    const oldIcon = render(category, false, true, -2, id === "ambientales");
    const newIcon = render(category, false, true, -5, id === "ambientales");
    const size = (icon: any) => icon.props.size ?? icon.props.style.width;
    assert.equal(size(oldIcon) - size(newIcon), 3, id);
  }
});

test("the title uses a real static Manrope 550 font rather than rounding native weights", () => {
  assert.equal(style("discoverCardTitle").fontFamily, "Manrope550");
  const font = readFileSync(new URL("../assets/fonts/Manrope550.ttf", import.meta.url));
  const tables = new Map<string, number>();
  for (let i = 0; i < font.readUInt16BE(4); i++) {
    const record = 12 + i * 16;
    tables.set(font.toString("ascii", record, record + 4), font.readUInt32BE(record + 8));
  }
  assert.equal(font.readUInt16BE(tables.get("OS/2")! + 4), 550);
  assert.equal(tables.has("fvar"), false);
  const layout = readFileSync(new URL("../app/_layout.tsx", import.meta.url), "utf8");
  assert.match(layout, /Manrope550: require\("\.\.\/assets\/fonts\/Manrope550\.ttf"\)/);
});
