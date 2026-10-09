import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { URL } from "node:url";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const source = readFileSync(new URL("../components/ProfileScreenBase.tsx", import.meta.url), "utf8");
const ast = ts.createSourceFile("ProfileScreenBase.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let identity: ts.JsxElement | undefined;
let userSection: ts.JsxElement | undefined;
let styles: ts.ObjectLiteralExpression | undefined;
const titleRows: ts.JsxElement[] = [];
function visit(node: ts.Node) {
  if (ts.isJsxElement(node) && /styles\.(dedicatedTitleLeft|profileStickyHeaderTitleGroup)\b/.test(node.openingElement.getText(ast))) {
    titleRows.push(node);
  }
  if (ts.isJsxElement(node) && node.openingElement.attributes.properties.some(
    attribute => ts.isJsxAttribute(attribute) && attribute.name.getText(ast) === "testID"
      && attribute.initializer && ts.isStringLiteral(attribute.initializer)
      && attribute.initializer.text === "profile-identity-row",
  )) identity = node;
  if (ts.isJsxElement(node) && node.openingElement.attributes.properties.some(
    attribute => ts.isJsxAttribute(attribute) && attribute.name.getText(ast) === "testID"
      && attribute.initializer && ts.isStringLiteral(attribute.initializer)
      && attribute.initializer.text === "profile-user-section",
  )) userSection = node;
  if (ts.isVariableDeclaration(node) && node.name.getText(ast) === "styles"
    && node.initializer && ts.isCallExpression(node.initializer)
    && ts.isObjectLiteralExpression(node.initializer.arguments[0])) styles = node.initializer.arguments[0];
  ts.forEachChild(node, visit);
}
visit(ast);
assert.ok(identity && userSection && styles);
const styleProperties = styles.properties.filter(property =>
  ts.isPropertyAssignment(property)
    && /^(profileCard|dedicatedProfileCard|profileIdentityPreviewCard|profileIdentityRow|dedicatedProfileIdentityRow|profileDetails|profileDescription|profileLifeMotto|profileBiography|profileEditDetails.*|dedicatedProfileDetails|avatar.*|userName|profileName.*|profileEmail|profileLocationLeft|profileIntention.*|locationRow|locationText)$/.test(property.name.getText(ast)),
);
const compiled = ts.transpileModule(`
  const PROFILE_CARD_BOTTOM_PADDING = ${source.match(/const PROFILE_CARD_BOTTOM_PADDING = (\d+);/)?.[1]};
  const PROFILE_SECTION_GAP = ${source.match(/const PROFILE_SECTION_GAP = (\d+);/)?.[1]};
  const styles = { ${styleProperties.map(property => property.getText(ast)).join(",")} };
  function Identity(props) {
    const require = (path) => path;
    const { dedicated = true, email = null, location = "", isPremium = false, description = "", lifeMotto = "" } = props;
    const username = "Resonador", lastName = "", photoUri = null, selectedProfilePreset = null;
    const colors = { foreground: "#FFFFFF", mutedForeground: "#AAAAAA", secondary: "#060A0F", primary: "#BE9650" };
    const secondaryAccent = "#BE9650", MEMBERSHIP_AURORA = { trialButtonBackground: "#B9822F", premium: { accent: "#E7B95C" } };
    const router = { push: props.onNavigate || (() => {}) };
    const setGrowthJourneyOpen = props.onJourney || (() => {});
    return ${userSection.getText(ast)};
  }
`, { compilerOptions: { jsx: ts.JsxEmit.React, module: ts.ModuleKind.CommonJS } }).outputText;
const flatten = (style: any): any => Array.isArray(style)
  ? Object.assign({}, ...style.map(flatten)) : style ?? {};
const presses = new Map<string, () => void>();
const Native = (props: any) => {
  const style = flatten(typeof props.style === "function" ? props.style({ pressed: false }) : props.style);
  if (props.testID && props.onPress) presses.set(props.testID, props.onPress);
  return React.createElement("div", {
    "data-testid": props.testID,
    "data-direction": style.flexDirection,
    "data-align": style.alignItems,
    "data-self-align": style.alignSelf,
    "data-flex": style.flex,
    "data-min-width": style.minWidth,
    "data-text-align": style.textAlign,
    "data-lines": props.numberOfLines,
    "data-ellipsis": props.ellipsizeMode,
    "data-icon": props.name,
    "data-icon-size": props.size,
    "data-source": typeof props.source === "string" ? props.source : undefined,
    "data-width": style.width,
    "data-gap": style.gap,
    "data-height": style.height,
    "data-radius": style.borderRadius,
    "data-overflow": style.overflow,
    "data-position": style.position,
    "data-right": style.right,
    "data-bottom": style.bottom,
    "data-pointer-events": props.pointerEvents,
    "data-translate-y": style.transform?.find((item: any) => "translateY" in item)?.translateY,
    "data-margin-bottom": style.marginBottom,
    "data-margin-top": style.marginTop,
    "data-background": style.backgroundColor,
    "data-color": props.color ?? style.color,
    "data-font-size": style.fontSize,
  }, props.children);
};
const Pill = (props: any) => React.createElement(Native, { ...props, testID: "profile-intention-pill" }, "0 Días: Intención");
const Membership = () => React.createElement(Native, { testID: "profile-premium-banner" }, "Prueba Premium");
const StagePill = () => React.createElement(Native, { testID: "profile-growth-stage-pill" }, "Intención");
const Identity = new Function(
  "React", "View", "Pressable", "Text", "Feather", "MaterialCommunityIcons", "Image", "SessionBadgeGlass", "ProfileIntentionPill", "ProfileMembershipBanner", "GrowthCurrentStagePill",
  `${compiled}\nreturn Identity;`,
)(React, Native, Native, Native, Native, Native, Native, Native, Pill, Membership, StagePill);
const render = (props: Record<string, unknown> = {}) => {
  presses.clear();
  return renderToStaticMarkup(React.createElement(Identity, props));
};

test("free users see Prueba Premium below their identity, while Premium users retain the compact layout with an avatar star", () => {
  const free = render({ isPremium: false });
  assert.match(free, /profile-premium-banner/);
  assert.match(free, /Prueba Premium/);
  assert.ok(free.indexOf('data-testid="profile-premium-banner"') > free.indexOf('data-testid="profile-identity-details"'));
  assert.doesNotMatch(free, /profile-avatar-premium-badge/);
  assert.match(free, /data-testid="profile-user-section"[^>]*data-margin-bottom="21"/);
  const premium = render({ isPremium: true });
  assert.doesNotMatch(premium, /profile-premium-banner|Prueba Premium/);
  assert.match(premium, /profile-avatar-premium-badge/);
  assert.equal((premium.match(/data-source="..\/assets\/images\/estrella-premium.png"/g) ?? []).length, 1);
  assert.match(premium, /data-testid="profile-user-section"[^>]*data-margin-bottom="5"/);
});

test("Perfil places the saved description below the username without the old pill or email", () => {
  const html = render({ email: "example@example.com", location: "Ubicación", description: "Mi descripción" });
  assert.match(html, /data-testid="profile-identity-row" data-direction="column" data-align="flex-start"/);
  assert.match(html, /data-testid="profile-identity-details" data-align="flex-start"[^>]*data-min-width="0"/);
  const avatar = html.indexOf('data-testid="profile-identity-avatar"');
  const name = html.indexOf("Resonador");
  const description = html.indexOf('data-testid="profile-identity-description"');
  assert.ok(avatar < name && name < description);
  assert.doesNotMatch(html, /profile-intention-pill/);
  assert.doesNotMatch(html, /profile-identity-email|example@example\.com/);
  assert.doesNotMatch(html, /Ubicación|data-icon="map-pin"/);
  assert.match(html, /data-testid="profile-identity-description"[^>]*data-text-align="left"[^>]*>Mi descripción/);
  assert.doesNotMatch(html, /data-testid="profile-identity-description"[^>]*data-lines|data-testid="profile-identity-description"[^>]*data-ellipsis/);
  assert.doesNotMatch(source.match(/dedicatedProfileCard: \{([^}]*)\}/)?.[1] ?? "", /backgroundColor/);
  assert.match(source, /avatarImage:\s*\{\s*width: 124,\s*height: 124,\s*borderRadius: 62/);
  assert.match(source, /avatarCircle:\s*\{\s*width: 124,\s*height: 124,\s*borderRadius: 62/);
  assert.doesNotMatch(source, /avatarOuterBorder/);
  const rowStyle = source.match(/profileIdentityRow: \{([\s\S]*?)\n  \},/)?.[1] ?? "";
  assert.match(rowStyle, /paddingLeft: 3/);
  assert.match(rowStyle, /paddingRight: 0/);
});

test("Perfil hides the email for both free and Premium accounts, whether present or absent", () => {
  for (const isPremium of [false, true]) {
    assert.doesNotMatch(render({ email: null, isPremium }), /profile-identity-email/);
    assert.doesNotMatch(render({ email: "", isPremium }), /profile-identity-email/);
    assert.doesNotMatch(render({ email: "example@example.com", isPremium }), /profile-identity-email|example@example\.com/);
  }
});

test("current stage sits above the larger bold motto and description, for free and Premium", () => {
  for (const isPremium of [false, true]) {
    const html = render({ isPremium, lifeMotto: "Vivir con intención", description: "Mi descripción" });
    assert.ok(html.indexOf("Resonador") < html.indexOf('data-testid="profile-identity-life-motto"'));
    assert.ok(html.indexOf("Resonador") < html.indexOf('data-testid="profile-growth-stage-pill"'));
    assert.ok(html.indexOf('data-testid="profile-growth-stage-pill"') < html.indexOf('data-testid="profile-identity-life-motto"'));
    assert.ok(html.indexOf('data-testid="profile-identity-life-motto"') < html.indexOf('data-testid="profile-identity-description"'));
    assert.match(html, /data-testid="profile-identity-life-motto"[^>]*data-color="#FFFFFF"[^>]*data-font-size="18"[^>]*>Vivir con intención/);
    assert.match(source, /profileLifeMotto: \{[^}]*fontWeight: "700"/);
    assert.match(html, /data-font-size="29"/);
  }
  assert.doesNotMatch(render({ lifeMotto: "   " }), /profile-identity-life-motto/);
});

test("motto and description move down seven pixels together in normal flow, keeping their internal gap", () => {
  for (const isPremium of [false, true]) {
    for (const fields of [
      { lifeMotto: "Mi lema", description: "Mi descripción" },
      { lifeMotto: "Mi lema" },
      { description: "Mi descripción" },
    ]) {
      const html = render({ isPremium, ...fields });
      assert.match(html, /data-testid="profile-identity-biography"[^>]*data-width="100%"[^>]*data-gap="6"[^>]*data-margin-top="7"/);
      assert.ok(html.indexOf('data-testid="profile-growth-stage-pill"') < html.indexOf('data-testid="profile-identity-biography"'));
    }
    assert.doesNotMatch(render({ isPremium, lifeMotto: " ", description: "" }), /profile-identity-biography/);
  }
  assert.match(source, /profileBiography: \{[^}]*marginTop: 7/);
  assert.doesNotMatch(source.match(/profileBiography: \{([^}]+)\}/)![1], /transform|position|top:/);
});

test("motto gains another seven pixels of normal-flow margin and pushes the description after it", () => {
  const html = render({ lifeMotto: "Mi lema", description: "Mi descripción" });
  assert.match(html, /data-testid="profile-identity-life-motto"[^>]*data-margin-top="7"/);
  assert.ok(html.indexOf("Mi lema") < html.indexOf("Mi descripción"));
  assert.match(source, /profileLifeMotto: \{[^}]*marginTop: 7/);
  assert.doesNotMatch(source.match(/profileLifeMotto: \{([^}]+)\}/)![1], /transform|position/);
  assert.equal(source.match(/profileDescription: \{([^}]+)\}/)![1].includes("marginTop"), false,
    "do not move the description twice; the motto's extra space already pushes it");
});

test("name and description sit below the avatar with the existing seven-pixel gap plus five more pixels and no account chevron", () => {
  const html = render({ description: "Mi descripción" });
  assert.match(html, /data-testid="profile-identity-title-row" data-direction="row" data-align="center"/);
  const titleRow = source.match(/<View testID="profile-identity-title-row"[\s\S]*?<\/View>/)?.[0] ?? "";
  assert.match(titleRow, /testID="profile-identity-name"/);
  assert.doesNotMatch(titleRow, /testID="profile-identity-chevron"/);
  assert.doesNotMatch(titleRow, /ProfileIntentionPill/);
  assert.doesNotMatch(html, /profile-identity-chevron|data-icon="chevron-right"/);
  assert.match(html, /data-testid="profile-identity-row"[^>]*data-gap="7"/);
  assert.match(html, /data-testid="profile-identity-details"[^>]*data-margin-top="5"/);
  assert.ok(html.indexOf('data-testid="profile-identity-avatar"') < html.indexOf("Resonador"));
  assert.ok(html.indexOf("Resonador") < html.indexOf('data-testid="profile-identity-description"'));
  assert.match(source, /profileNameRow: \{ width: "100%", flexDirection: "row", alignItems: "center"/);
  const children = identity!.children.filter(ts.isJsxElement).map(child =>
    child.openingElement.attributes.properties.find(attribute =>
      ts.isJsxAttribute(attribute) && attribute.name.getText(ast) === "testID",
    )?.getText(ast),
  );
  assert.deepEqual(children, [
    'testID="profile-identity-avatar"',
    'testID="profile-identity-details"',
  ]);
  assert.match(source, /avatarWrapper: \{[^}]*marginTop: 3, marginBottom: 0/);
  assert.match(html, /data-testid="profile-identity-row" data-direction="column" data-align="flex-start"/);
  const membership = readFileSync(new URL("../components/ProfileMembershipBanner.tsx", import.meta.url), "utf8");
  assert.match(membership, /chevron: \{\s*width: 32,/);
  assert.match(membership, /row: \{[\s\S]*?paddingHorizontal: 0/);
  assert.match(source, /profileIdentityRow: \{[\s\S]*?paddingLeft: 3,\s*paddingRight: 0/);
  assert.match(membership, /<Feather name="chevron-right" size=\{24\}/);
});

test("name and avatar still open Mi cuenta without a chevron", () => {
  let route = "";
  render({ onNavigate: (next: string) => route = next });
  assert.ok(presses.has("profile-identity-name"));
  presses.get("profile-identity-name")?.();
  assert.equal(route, "/mi-perfil");
  route = "";
  assert.ok(!presses.has("profile-identity-chevron"));
  assert.ok(presses.has("profile-identity-avatar"));
  presses.get("profile-identity-avatar")?.();
  assert.equal(route, "/mi-perfil");
});

test("missing email and an empty description do not get placeholder content", () => {
  assert.doesNotMatch(render(), /profile-identity-email|@/);
  assert.doesNotMatch(render({ description: "   " }), /profile-identity-description/);
  const other = render({ dedicated: false, email: "example@example.com" });
  assert.doesNotMatch(other, /profile-intention-pill/);
});

test("Premium membership overlays the bottom-right avatar corner without changing its navigation", () => {
  let route = "";
  let journey = false;
  const html = render({ isPremium: true, onNavigate: (next: string) => route = next, onJourney: (open: boolean) => journey = open });
  presses.get("profile-identity-avatar")?.();
  presses.get("profile-intention-pill")?.();
  assert.equal(route, "/mi-perfil");
  assert.equal(journey, false);
  assert.doesNotMatch(html, /profile-intention-pill/);
  assert.match(html, /data-testid="profile-avatar-premium-badge"[^>]*data-width="32"[^>]*data-height="32"[^>]*data-radius="16"[^>]*data-position="absolute"[^>]*data-right="0"[^>]*data-bottom="0"[^>]*data-pointer-events="none"/);
  assert.equal((html.match(/data-source="..\/assets\/images\/estrella-premium.png"/g) ?? []).length, 1);
  assert.match(source, /<SessionBadgeGlass showBlackTint=\{false\} showWhiteTint \/>/);
  assert.match(source, /<Image source=\{require\("..\/assets\/images\/estrella-premium.png"\)\} style=\{\{ width: 25, height: 25 \}\} contentFit="contain" \/>/);
  const homeBanner = readFileSync(new URL("../components/PremiumBanner.tsx", import.meta.url), "utf8");
  assert.match(homeBanner, /source=\{require\("..\/assets\/images\/estrella-premium.png"\)\}/);
  const avatarStart = source.indexOf('testID="profile-identity-avatar"');
  const avatarContent = source.slice(avatarStart, source.indexOf("</Pressable>", avatarStart));
  assert.ok(avatarContent.includes('testID="profile-avatar-premium-badge"'));
  assert.doesNotMatch(avatarContent, /avatarOuterBorder/);
  assert.doesNotMatch(render({ isPremium: false }), /profile-avatar-premium-badge|data-icon="star"/);
});

test("Perfil titles are removed from both headers without removing settings", () => {
  assert.equal(titleRows.length, 0);
  assert.doesNotMatch(source, />Perfil<\/Text>/);
  assert.match(source, /"profile-open-settings"/);
  assert.match(source, /"profile-sticky-open-settings"/);
});

test("the old edit pill is removed below the description for free and Premium users", () => {
  for (const isPremium of [false, true]) {
    const html = render({ isPremium, description: "Mi descripción" });
    assert.match(html, /profile-identity-description/);
    assert.doesNotMatch(html, /profile-edit-details|Editar detalles|data-icon="edit-2"/);
    assert.doesNotMatch(userSection!.getText(ast), /profileEditDetailsButton/);
  }
  assert.doesNotMatch(render({ description: "" }), /profile-edit-details/);
});