import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { URL } from "node:url";
import ts from "typescript";

function style(file: string, name: string, values: Record<string, unknown> = {}): Record<string, any> {
  const source = readFileSync(new URL(`../components/${file}.tsx`, import.meta.url), "utf8");
  const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let initializer: ts.Expression | undefined;
  function visit(node: ts.Node) {
    if (ts.isVariableDeclaration(node) && node.name.getText(ast) === "styles"
      && node.initializer && ts.isCallExpression(node.initializer)
      && ts.isObjectLiteralExpression(node.initializer.arguments[0])) {
      const property = node.initializer.arguments[0].properties.find(prop =>
        ts.isPropertyAssignment(prop) && prop.name.getText(ast) === name);
      if (property && ts.isPropertyAssignment(property)) initializer = property.initializer;
    }
    ts.forEachChild(node, visit);
  }
  visit(ast);
  assert.ok(initializer, `${file} defines ${name}`);
  const compiled = ts.transpileModule(`return (${initializer.getText(ast)});`, {
    compilerOptions: { target: ts.ScriptTarget.ES2022 },
  }).outputText;
  return new Function(...Object.keys(values), compiled)(...Object.values(values));
}

function verticalInsets(styles: Record<string, any>) {
  return {
    top: styles.paddingTop ?? styles.paddingVertical ?? styles.padding ?? 0,
    bottom: styles.paddingBottom ?? styles.paddingVertical ?? styles.padding ?? 0,
  };
}

test("user section has 15px above the name and avatar outline, with no extra banner bottom padding", () => {
  const source = readFileSync(new URL("../components/ProfileScreenBase.tsx", import.meta.url), "utf8");
  const bottom = Number(source.match(/const PROFILE_CARD_BOTTOM_PADDING = (\d+);/)?.[1]);
  const card = style("ProfileScreenBase", "profileCard", { PROFILE_CARD_BOTTOM_PADDING: bottom, PROFILE_SECTION_GAP: 21 });
  assert.deepEqual(verticalInsets(card), { top: 15, bottom: 15 });
  assert.equal(style("ProfileScreenBase", "profileIdentityRow").alignItems, "flex-start");
  assert.equal(style("ProfileScreenBase", "userName").marginTop, 0);
  const avatar = style("ProfileScreenBase", "avatarWrapper");
  const border = style("ProfileScreenBase", "avatarOuterBorder");
  assert.equal(card.paddingTop + avatar.marginTop + border.top, 15);
  const row = style("ProfileMembershipBanner", "row");
  assert.equal(row.paddingVertical, 0);
  assert.equal(row.minHeight ?? 0, 0);
  assert.equal(row.alignItems, "flex-end");
  assert.equal(style("ProfileMembershipBanner", "copy").transform, undefined);
  assert.equal(style("ProfileMembershipBanner", "chevron").transform, undefined);
  assert.match(source, /<ProfileMembershipBanner isPremium=\{isPremium\}/);
});

test("history uses exactly 15px above its header and below empty text or the last card", () => {
  const resolved = {
    ...style("ProfileScreenBase", "outlinedProfileSection"),
    ...style("ProfileScreenBase", "profileHistorySection"),
  };
  assert.deepEqual(verticalInsets(resolved), { top: 15, bottom: 15 });
  for (const name of ["profileHistoryCards", "profileHistoryCard"]) {
    const child = style("ProfileScreenBase", name);
    assert.equal((child.paddingBottom ?? child.paddingVertical ?? child.padding ?? 0) + (child.marginBottom ?? 0), 0);
  }
});

test("downloads uses exactly 15px above its header and below loading, empty, unsupported or populated content", () => {
  assert.deepEqual(verticalInsets(style("ProfileDownloadsSection", "section")), { top: 15, bottom: 15 });
  for (const name of ["description", "cards", "card"]) {
    const child = style("ProfileDownloadsSection", name);
    assert.equal((child.paddingBottom ?? child.paddingVertical ?? child.padding ?? 0) + (child.marginBottom ?? 0), 0);
  }
});