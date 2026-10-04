import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { URL } from "node:url";
import ts from "typescript";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");
function style(path: string, name: string): Record<string, unknown> {
  const source = read(path);
  const ast = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let expression: ts.Expression | undefined;
  function visit(node: ts.Node) {
    if (ts.isPropertyAssignment(node) && node.name.getText(ast) === name) expression = node.initializer;
    ts.forEachChild(node, visit);
  }
  visit(ast);
  assert.ok(expression, `Missing ${name} in ${path}`);
  return new Function(`return (${expression.getText(ast)});`)();
}
const sleepTitle = style("../components/SessionCarousel.tsx", "editorialTitle");

test("objective, new-session and playlist card titles match Dormir without changing section headings", () => {
  assert.equal(sleepTitle.fontSize, 14);
  assert.equal(sleepTitle.fontWeight, "600");
  for (const [path, name] of [
    ["../app/(tabs)/explore.tsx", "themeGridLabel"],
    ["../app/(tabs)/explore.tsx", "newInResonanceTitle"],
    ["../components/EditorialPlaylistCarousel.tsx", "cardTitle"],
    ["../components/SessionCard.tsx", "editorialTitle"],
  ]) {
    const target = style(path, name);
    for (const key of ["fontSize", "fontWeight", "lineHeight"]) {
      assert.equal(target[key], sleepTitle[key], `${name}.${key}`);
    }
  }
  const section = style("../app/(tabs)/explore.tsx", "sectionTitle");
  assert.equal(section.fontSize, 19);
  assert.equal(section.fontWeight, "700");
  assert.equal(style("../app/(tabs)/explore.tsx", "themeGridLabel").textAlign, "left");
});

test("Para este momento titles are one point larger and authors match subtitles on Inicio and Descubrir", () => {
  for (const path of ["../app/(tabs)/inicio8.tsx", "../app/(tabs)/explore.tsx"]) {
    const title = style(path, "heroTitle");
    const author = style(path, "heroAuthor");
    const subtitle = style(path, "heroMetaText");
    assert.equal(title.fontSize, 15);
    assert.equal(title.fontWeight, "600");
    assert.equal(title.lineHeight, 18);
    assert.equal(subtitle.fontSize, 11);
    assert.equal(author.fontSize, subtitle.fontSize);
  }
});

test("featured videos match Dormir while other video cards retain their existing default typography", () => {
  const home = read("../app/(tabs)/inicio8.tsx");
  const video = read("../components/VideoCard.tsx");
  const card = home.match(/<VideoCard[\s\S]*?\/>/)?.[0];
  assert.ok(card);
  assert.match(card, /titleFontSize=\{14\}/);
  assert.match(video, /titleFontSize = 13/);
  assert.match(video, /styles\.cardTitle, \{ color: colors\.foreground, fontSize: titleFontSize \}/);
  assert.equal(style("../components/VideoCard.tsx", "cardTitle").fontWeight, sleepTitle.fontWeight);
  assert.equal(style("../components/VideoCard.tsx", "cardTitle").lineHeight, sleepTitle.lineHeight);
  assert.equal(style("../components/VideoCard.tsx", "cardTitle").fontSize, 13);
  for (const source of [home, video, read("../app/(tabs)/explore.tsx")]) {
    const parsed = ts.transpileModule(source, {
      reportDiagnostics: true,
      compilerOptions: { jsx: ts.JsxEmit.React },
    });
    assert.deepEqual(parsed.diagnostics?.filter(d => d.category === ts.DiagnosticCategory.Error), []);
  }
});