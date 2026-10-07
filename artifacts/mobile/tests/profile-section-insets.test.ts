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

test("both settings buttons retain their placement without a Perfil title", () => {
  const source = readFileSync(new URL("../components/ProfileScreenBase.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(source, />Perfil<\/Text>/);
  const gear = style("ProfileScreenBase", "gearBtn");
  const gearYOffset = gear.transform.reduce((sum: number, item: any) => sum + (item.translateY ?? 0), 0);
  const row = style("ProfileScreenBase", "dedicatedTitleRow");
  const stickyGear = style("ProfileScreenBase", "profileStickyHeaderActions");
  assert.equal(gear.height, 43);
  assert.equal(gearYOffset, 0);
  assert.equal(row.paddingTop, stickyGear.top);
  assert.equal(stickyGear.right, 16);
  assert.equal(style("ProfileScreenBase", "profileHeaderActions").marginLeft, "auto");
});

test("the edit and settings backgrounds use the same eight-pixel gap as Dormir", () => {
  const sleep = readFileSync(new URL("../app/(tabs)/descanzo.tsx", import.meta.url), "utf8");
  const gap = Number(sleep.match(/headerActions: \{[\s\S]*?gap: (\d+)/)?.[1]);
  const buttons = style("ProfileScreenBase", "profileHeaderActions");
  assert.equal(buttons.gap, gap);
  assert.equal(buttons.gap, 8);
  assert.equal(buttons.flexDirection, "row");
});

test("user section preserves its padding and avatar placement without an outline", () => {
  const source = readFileSync(new URL("../components/ProfileScreenBase.tsx", import.meta.url), "utf8");
  const bottom = Number(source.match(/const PROFILE_CARD_BOTTOM_PADDING = (\d+);/)?.[1]);
  const card = style("ProfileScreenBase", "profileCard", { PROFILE_CARD_BOTTOM_PADDING: bottom, PROFILE_SECTION_GAP: 21 });
  assert.deepEqual(verticalInsets(card), { top: 20, bottom: 20 });
  assert.equal(style("ProfileScreenBase", "profileIdentityRow").alignItems, "flex-start");
  assert.equal(style("ProfileScreenBase", "userName").marginTop, 0);
  const avatar = style("ProfileScreenBase", "avatarWrapper");
  assert.equal(card.paddingTop + avatar.marginTop, 23);
  assert.equal(avatar.marginTop, 3);
  assert.equal(avatar.marginBottom, 0);
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
  assert.equal(progress.marginTop, -4 + 6 - 15 + 10);
  assert.equal(progress.transform, undefined);
  assert.equal(progress.marginBottom, 21);
  assert.equal(card.paddingBottom + preview.marginBottom + progress.marginTop, 25 - 4 + 6 - 15 + 10);
  const avatar = style("ProfileScreenBase", "avatarWrapper");
  const image = style("ProfileScreenBase", "avatarImage");
  assert.equal(image.height, 124);
  assert.equal(avatar.marginBottom, 0);
});

test("avatar remains borderless and its details use the full available width without a chevron", () => {
  const row = style("ProfileScreenBase", "profileIdentityRow");
  const image = style("ProfileScreenBase", "avatarImage");
  assert.equal(row.paddingLeft, 3);
  assert.equal(image.borderWidth, undefined);
  assert.equal(style("ProfileScreenBase", "avatarCircle").borderWidth, undefined);
  assert.equal(style("ProfileScreenBase", "avatarWrapper").borderWidth, undefined);
  assert.equal(image.width, 124);
  assert.equal(image.height, 124);
  const source = readFileSync(new URL("../components/ProfileScreenBase.tsx", import.meta.url), "utf8");
  const avatarStart = source.indexOf('testID="profile-identity-avatar"');
  const avatarContent = source.slice(avatarStart, source.indexOf("</Pressable>", avatarStart));
  assert.doesNotMatch(avatarContent, /avatarOuterBorder/);
  assert.match(avatarContent, /testID="profile-avatar-premium-badge" pointerEvents="none"/);
  assert.equal(row.flexDirection, "column");
  assert.equal(row.gap, 7);
  assert.equal(style("ProfileScreenBase", "profileDetails").width, "100%");
  assert.doesNotMatch(source, /profile-identity-chevron/);
});

test("streak section gains 10px spacing for both free and Premium while preserving their 15px difference", () => {
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
  assert.equal(base.marginTop, -13 + 10, "the shared baseline gains ten pixels without being mutated by Premium");
  assert.equal(resolve(false).marginTop - (-13), 10);
  assert.equal(resolve(true).marginTop - (-13 + 15), 10);
});

test("username keeps 24 points and the new description leaves avatar and Premium spacing unchanged", () => {
  assert.equal(style("ProfileScreenBase", "userName").fontSize, 24);
  const details = style("ProfileScreenBase", "profileDetails");
  assert.equal(details.gap, 6);
  assert.equal(style("ProfileScreenBase", "profileDescription").fontSize, 14);
  assert.equal(style("ProfileScreenBase", "profileDescription").lineHeight, 20);
  assert.equal(style("ProfileScreenBase", "profileDescription").color, "#C4C4C4");
  assert.equal(style("ProfileScreenBase", "profileDescription").alignSelf, "stretch");
  assert.equal(style("ProfileScreenBase", "profileDescription").marginRight, undefined);
  assert.equal(style("ProfileScreenBase", "profileDescription").paddingRight, undefined);
  assert.equal(style("ProfileScreenBase", "profileDescription").transform, undefined);
  assert.equal(style("ProfileScreenBase", "avatarImage").width, 124);
  assert.equal(style("ProfileScreenBase", "profileIdentityPreviewCard").marginBottom, 5);
});

test("the larger avatar retains the prior upward placement and five-pixel details offset in normal flow", () => {
  const card = style("ProfileScreenBase", "dedicatedProfileCard");
  assert.equal(card.marginTop, 8 - 7 - 35 - 8);
  assert.equal(card.transform, undefined);
  const avatar = style("ProfileScreenBase", "avatarImage");
  assert.equal(avatar.width, 109 + 15);
  assert.equal(avatar.height, 109 + 15);
  assert.equal(avatar.borderRadius, 62);
  const details = style("ProfileScreenBase", "profileDetails");
  assert.equal(details.marginTop, 5);
  assert.equal(details.transform, undefined);
  assert.equal(style("ProfileScreenBase", "profileIdentityRow").gap + details.marginTop, 12);
  assert.equal((card.marginTop - (1 - 35)) + (avatar.height - 99) + details.marginTop, 7 + 15,
    "content below the avatar accounts for the upward shift, larger avatar and downward details in normal flow");
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