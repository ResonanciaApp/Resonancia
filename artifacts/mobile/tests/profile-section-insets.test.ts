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

test("user section preserves its padding and avatar placement with the outline over the image", () => {
  const source = readFileSync(new URL("../components/ProfileScreenBase.tsx", import.meta.url), "utf8");
  const bottom = Number(source.match(/const PROFILE_CARD_BOTTOM_PADDING = (\d+);/)?.[1]);
  const card = style("ProfileScreenBase", "profileCard", { PROFILE_CARD_BOTTOM_PADDING: bottom, PROFILE_SECTION_GAP: 21 });
  assert.deepEqual(verticalInsets(card), { top: 20, bottom: 20 });
  assert.equal(style("ProfileScreenBase", "profileIdentityRow").alignItems, "center");
  assert.equal(style("ProfileScreenBase", "userName").marginTop, 0);
  const avatar = style("ProfileScreenBase", "avatarWrapper");
  const border = style("ProfileScreenBase", "avatarOuterBorder");
  assert.equal(card.paddingTop + avatar.marginTop + border.top, 23);
  assert.equal(avatar.marginTop, 3);
  assert.equal(avatar.marginTop, avatar.marginBottom);
  const row = style("ProfileMembershipBanner", "row");
  assert.equal(row.paddingVertical, 0);
  assert.equal(row.minHeight ?? 0, 0);
  assert.equal(row.alignItems, "flex-end");
  assert.equal(style("ProfileMembershipBanner", "copy").transform, undefined);
  assert.deepEqual(style("ProfileMembershipBanner", "chevron").transform, [{ translateY: 3.5 }]);
  assert.match(source, /<ProfileMembershipBanner isPremium=\{isPremium\}/);
});

test("Premium members keep the compact identity layout while free users recover their trial banner", () => {
  const source = readFileSync(new URL("../components/ProfileScreenBase.tsx", import.meta.url), "utf8");
  assert.match(source, /!isPremium && <ProfileMembershipBanner/);
  assert.match(source, /isPremium && styles\.profileIdentityPreviewCard/);
  const bottom = Number(source.match(/const PROFILE_CARD_BOTTOM_PADDING = (\d+);/)?.[1]);
  const card = style("ProfileScreenBase", "profileCard", { PROFILE_CARD_BOTTOM_PADDING: bottom, PROFILE_SECTION_GAP: 21 });
  const preview = style("ProfileScreenBase", "profileIdentityPreviewCard");
  const progress = style("ProfileScreenBase", "profileProgressSection", { PROFILE_SECTION_GAP: 21 });
  assert.equal(progress.marginTop, -4 + 6 - 15);
  assert.equal(progress.transform, undefined);
  assert.equal(progress.marginBottom, 21);
  assert.equal(card.paddingBottom + preview.marginBottom + progress.marginTop, 25 - 4 + 6 - 15);
  const border = style("ProfileScreenBase", "avatarOuterBorder");
  const avatar = style("ProfileScreenBase", "avatarWrapper");
  const image = style("ProfileScreenBase", "avatarImage");
  assert.equal(image.height, border.top + border.height);
  assert.equal(avatar.marginBottom, 3);
});

test("avatar outline matches the image bounds and the chevron reaches the profile right margin at different widths", () => {
  const row = style("ProfileScreenBase", "profileIdentityRow");
  const border = style("ProfileScreenBase", "avatarOuterBorder");
  const chevron = style("ProfileScreenBase", "profileNameChevron");
  const image = style("ProfileScreenBase", "avatarImage");
  assert.equal(row.paddingLeft, 3);
  assert.equal(border.left, 0);
  assert.equal(border.top, 0);
  assert.equal(border.width, image.width);
  assert.equal(border.height, image.height);
  assert.equal(border.borderRadius, image.borderRadius);
  assert.equal(border.borderWidth, 3);
  assert.equal(border.zIndex, 1);
  const source = readFileSync(new URL("../components/ProfileScreenBase.tsx", import.meta.url), "utf8");
  const avatarStart = source.indexOf('testID="profile-identity-avatar"');
  const avatarContent = source.slice(avatarStart, source.indexOf("</Pressable>", avatarStart));
  assert.ok(avatarContent.indexOf("styles.avatarOuterBorder") > avatarContent.indexOf("styles.avatarCircle"));
  assert.match(avatarContent, /<View pointerEvents="none" style=\{styles\.avatarOuterBorder\}/);
  assert.equal(chevron.position, "absolute");
  assert.equal(chevron.alignItems, "flex-end");
  assert.equal(chevron.top, "50%");
  assert.equal(chevron.marginTop + chevron.height / 2, 0);
  for (const width of [320, 375, 402, 768]) {
    const chevronRight = width - 16 - row.paddingRight - chevron.right;
    assert.equal(chevronRight, width - 16);
  }
});

test("Premium streak section stays 15px below the baseline after moving up 15px in normal flow, without changing free users", () => {
  const source = readFileSync(new URL("../components/ProfileScreenBase.tsx", import.meta.url), "utf8");
  const ast = ts.createSourceFile("ProfileScreenBase.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let expression: ts.Expression | undefined;
  function visit(node: ts.Node) {
    if (ts.isJsxAttribute(node) && node.name.getText(ast) === "style"
      && node.initializer && ts.isJsxExpression(node.initializer)
      && node.initializer.expression?.getText(ast).includes("styles.profileProgressSection")) {
      expression = node.initializer.expression;
    }
    ts.forEachChild(node, visit);
  }
  visit(ast);
  assert.ok(expression);
  const base = style("ProfileScreenBase", "profileProgressSection", { PROFILE_SECTION_GAP: 21 });
  const compiled = ts.transpileModule(`return (${expression.getText(ast)});`, {
    compilerOptions: { target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const evaluate = new Function("isPremium", "styles", compiled);
  const resolve = (isPremium: boolean) => Object.assign({}, ...evaluate(isPremium, { profileProgressSection: base }));
  assert.deepEqual(resolve(false), base);
  assert.deepEqual(resolve(true), { ...base, marginTop: base.marginTop + 15 });
  assert.equal(resolve(true).transform, undefined);
  assert.deepEqual(resolve(false), base, "switching to free leaves no residual offset");
  assert.equal(base.marginTop, -13, "the shared baseline must not be mutated");
});

test("username keeps 24 points and the new description leaves avatar and Premium spacing unchanged", () => {
  assert.equal(style("ProfileScreenBase", "userName").fontSize, 24);
  const details = style("ProfileScreenBase", "profileDetails");
  assert.equal(details.gap, 6);
  assert.equal(style("ProfileScreenBase", "profileDescription").lineHeight, 18);
  assert.equal(style("ProfileScreenBase", "profileDescription").alignSelf, "stretch");
  assert.equal(style("ProfileScreenBase", "profileDescription").marginRight, 50);
  assert.equal(style("ProfileScreenBase", "profileDescription").paddingRight, undefined);
  assert.deepEqual(style("ProfileScreenBase", "profileDescription").transform, [{ translateX: 1 }, { translateY: -4 }]);
  assert.equal(style("ProfileScreenBase", "avatarImage").width, 75);
  assert.equal(style("ProfileScreenBase", "profileIdentityPreviewCard").marginBottom, 5);
});

test("the user section moves up 7px in normal flow, carrying subsequent sections without changing their gaps", () => {
  const card = style("ProfileScreenBase", "dedicatedProfileCard");
  assert.equal(card.marginTop, 8 - 7);
  assert.equal(card.transform, undefined);
  const avatar = style("ProfileScreenBase", "avatarImage");
  assert.equal(avatar.width, 83 - 8);
  assert.equal(avatar.height, 83 - 8);
  assert.equal(style("ProfileScreenBase", "profileIdentityPreviewCard").marginBottom, 5);
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
  assert.match(source, /onMomentumScrollEnd=\{\(\) => profileWallRef\.current\?\.finishPendingScroll\(true\)\}/);
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