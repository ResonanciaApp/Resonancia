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

test("user section preserves 20px above the centered avatar outline, with no extra banner bottom padding", () => {
  const source = readFileSync(new URL("../components/ProfileScreenBase.tsx", import.meta.url), "utf8");
  const bottom = Number(source.match(/const PROFILE_CARD_BOTTOM_PADDING = (\d+);/)?.[1]);
  const card = style("ProfileScreenBase", "profileCard", { PROFILE_CARD_BOTTOM_PADDING: bottom, PROFILE_SECTION_GAP: 21 });
  assert.deepEqual(verticalInsets(card), { top: 20, bottom: 20 });
  assert.equal(style("ProfileScreenBase", "profileIdentityRow").alignItems, "center");
  assert.equal(style("ProfileScreenBase", "userName").marginTop, 0);
  const avatar = style("ProfileScreenBase", "avatarWrapper");
  const border = style("ProfileScreenBase", "avatarOuterBorder");
  assert.equal(card.paddingTop + avatar.marginTop + border.top, 20);
  assert.equal(avatar.marginTop, avatar.marginBottom);
  const row = style("ProfileMembershipBanner", "row");
  assert.equal(row.paddingVertical, 0);
  assert.equal(row.minHeight ?? 0, 0);
  assert.equal(row.alignItems, "flex-end");
  assert.equal(style("ProfileMembershipBanner", "copy").transform, undefined);
  assert.deepEqual(style("ProfileMembershipBanner", "chevron").transform, [{ translateY: 3.5 }]);
  assert.match(source, /<ProfileMembershipBanner isPremium=\{isPremium\}/);
});

test("Perfil hides membership and places the seven-day circles exactly 35px below the avatar outline", () => {
  const source = readFileSync(new URL("../components/ProfileScreenBase.tsx", import.meta.url), "utf8");
  assert.match(source, /const SHOW_PROFILE_MEMBERSHIP_BANNER = false;/);
  assert.match(source, /\{SHOW_PROFILE_MEMBERSHIP_BANNER && \(\s*<ProfileMembershipBanner/);
  const value = (name: string) => Number(source.match(new RegExp(`const ${name} = (\\d+);`))?.[1]);
  const values = {
    PROFILE_AVATAR_WEEK_GAP: value("PROFILE_AVATAR_WEEK_GAP"),
    PROFILE_CARD_BOTTOM_PADDING: value("PROFILE_CARD_BOTTOM_PADDING"),
    PROFILE_WEEK_TOP_PADDING: value("PROFILE_WEEK_TOP_PADDING"),
    PROFILE_SECTION_GAP: value("PROFILE_SECTION_GAP"),
  };
  const card = style("ProfileScreenBase", "profileCard", values);
  const dedicated = style("ProfileScreenBase", "dedicatedProfileCard", values);
  const avatar = style("ProfileScreenBase", "avatarWrapper");
  const border = style("ProfileScreenBase", "avatarOuterBorder");
  const image = style("ProfileScreenBase", "avatarImage");
  const outerExtension = border.top + border.height - image.height;
  const avatarToRowBottom = avatar.marginBottom - outerExtension;
  assert.equal(avatarToRowBottom + card.paddingBottom + dedicated.marginBottom + values.PROFILE_WEEK_TOP_PADDING, 35);
  assert.equal(style("ProfileScreenBase", "profileProgressSection", values).marginTop, 0);
});

test("Perfil replaces history and downloads with the expandable wall after its progress/calendar section", () => {
  const source = readFileSync(new URL("../components/ProfileScreenBase.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(source, /ProfileDownloadsSection|profileHistorySection|>Historial<\/Text>/);
  assert.ok(source.indexOf("<ProfileReflectionWallSection") > source.indexOf("<ProgressMirrorSections"));
  assert.match(source, /<ProfileReflectionWallSection\s+ref=\{profileWallRef\}\s+scrollRef=\{profileScrollRef\}\s+getScrollY=\{getProfileScrollY\}\s+onComposingChange=\{setProfileWallComposing\}/);
});

test("Perfil connects wall composition to scroll completion, drag cancellation and keyboard space", () => {
  const source = readFileSync(new URL("../components/ProfileScreenBase.tsx", import.meta.url), "utf8");
  assert.match(source, /profileScrollYRef\.current = event\.nativeEvent\.contentOffset\.y;/);
  assert.match(source, /handleHeaderScroll\(event\);/);
  assert.match(source, /onScrollBeginDrag=\{\(\) => profileWallRef\.current\?\.cancelPendingScroll\(\)\}/);
  assert.match(source, /onMomentumScrollEnd=\{\(\) => profileWallRef\.current\?\.finishPendingScroll\(\)\}/);
  assert.match(source, /paddingBottom: 160 \+ bottomPad \+ \(profileWallComposing \? 440 : 0\)/);
  assert.match(source, /enabled=\{!profileWallComposing\}/);
});

test("downloads uses exactly 18px above its header and below loading, empty, unsupported or populated content", () => {
  assert.deepEqual(verticalInsets(style("ProfileDownloadsSection", "section")), { top: 18, bottom: 18 });
  for (const name of ["description", "cards", "card"]) {
    const child = style("ProfileDownloadsSection", name);
    assert.equal((child.paddingBottom ?? child.paddingVertical ?? child.padding ?? 0) + (child.marginBottom ?? 0), 0);
  }
});