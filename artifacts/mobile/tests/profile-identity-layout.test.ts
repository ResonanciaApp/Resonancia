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
    && /^(profileCard|dedicatedProfileCard|profileIdentityPreviewCard|profileIdentityRow|dedicatedProfileIdentityRow|profileDetails|profileDescription|dedicatedProfileDetails|avatar.*|userName|profileName.*|profileEmail|profileLocationLeft|profileIntention.*|locationRow|locationText)$/.test(property.name.getText(ast)),
);
const compiled = ts.transpileModule(`
  const PROFILE_CARD_BOTTOM_PADDING = ${source.match(/const PROFILE_CARD_BOTTOM_PADDING = (\d+);/)?.[1]};
  const PROFILE_SECTION_GAP = ${source.match(/const PROFILE_SECTION_GAP = (\d+);/)?.[1]};
  const styles = { ${styleProperties.map(property => property.getText(ast)).join(",")} };
  function Identity(props) {
    const { dedicated = true, email = null, location = "", isPremium = false, description = "" } = props;
    const username = "Resonador", lastName = "", photoUri = null, selectedProfilePreset = null;
    const colors = { foreground: "#FFFFFF", mutedForeground: "#AAAAAA", secondary: "#060A0F", primary: "#BE9650" };
    const secondaryAccent = "#BE9650", MEMBERSHIP_AURORA = { premium: { accent: "#E7B95C" } };
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
    "data-width": style.width,
    "data-gap": style.gap,
    "data-height": style.height,
    "data-radius": style.borderRadius,
    "data-overflow": style.overflow,
    "data-margin-bottom": style.marginBottom,
  }, props.children);
};
const Pill = (props: any) => React.createElement(Native, { ...props, testID: "profile-intention-pill" }, "0 Días: Intención");
const Membership = () => React.createElement(Native, { testID: "profile-premium-banner" }, "Prueba Premium");
const Identity = new Function(
  "React", "View", "Pressable", "Text", "Feather", "MaterialCommunityIcons", "Image", "SessionBadgeGlass", "ProfileIntentionPill", "ProfileMembershipBanner",
  `${compiled}\nreturn Identity;`,
)(React, Native, Native, Native, Native, Native, Native, Native, Pill, Membership);
const render = (props: Record<string, unknown> = {}) => {
  presses.clear();
  return renderToStaticMarkup(React.createElement(Identity, props));
};

test("free users see Prueba Premium below their identity, while Premium users retain the compact layout without an avatar star", () => {
  const free = render({ isPremium: false });
  assert.match(free, /profile-premium-banner/);
  assert.match(free, /Prueba Premium/);
  assert.ok(free.indexOf('data-testid="profile-premium-banner"') > free.indexOf('data-testid="profile-identity-details"'));
  assert.doesNotMatch(free, /profile-avatar-premium-badge/);
  assert.match(free, /data-testid="profile-user-section"[^>]*data-margin-bottom="21"/);
  const premium = render({ isPremium: true });
  assert.doesNotMatch(premium, /profile-premium-banner|Prueba Premium/);
  assert.doesNotMatch(premium, /profile-avatar-premium-badge|data-icon="star"/);
  assert.match(premium, /data-testid="profile-user-section"[^>]*data-margin-bottom="5"/);
});

test("Perfil places the saved description below the username without the old pill or email", () => {
  const html = render({ email: "example@example.com", location: "Ubicación", description: "Mi descripción" });
  assert.match(html, /data-testid="profile-identity-row" data-direction="row" data-align="center"/);
  assert.match(html, /data-testid="profile-identity-details" data-align="flex-start"[^>]*data-flex="1" data-min-width="0"/);
  const avatar = html.indexOf('data-testid="profile-identity-avatar"');
  const name = html.indexOf("Resonador");
  const description = html.indexOf('data-testid="profile-identity-description"');
  assert.ok(avatar < name && name < description);
  assert.doesNotMatch(html, /profile-intention-pill/);
  assert.doesNotMatch(html, /profile-identity-email|example@example\.com/);
  assert.doesNotMatch(html, /Ubicación|data-icon="map-pin"/);
  assert.match(html, /data-testid="profile-identity-description"[^>]*data-text-align="left" data-lines="2" data-ellipsis="tail"[^>]*>Mi descripción/);
  assert.doesNotMatch(source.match(/dedicatedProfileCard: \{([^}]*)\}/)?.[1] ?? "", /backgroundColor/);
  assert.match(source, /avatarImage:\s*\{\s*width: 75,\s*height: 75,\s*borderRadius: 37\.5/);
  assert.match(source, /avatarCircle:\s*\{\s*width: 75,\s*height: 75,\s*borderRadius: 37\.5/);
  assert.match(source, /avatarOuterBorder:\s*\{\s*position: "absolute",\s*top: -3,\s*left: -3,\s*width: 81,\s*height: 81,\s*borderRadius: 40\.5,\s*borderWidth: 3/);
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

test("the profile chevron stays aligned with the username, not the description", () => {
  const html = render({ description: "Mi descripción" });
  assert.match(html, /data-testid="profile-identity-title-row" data-direction="row" data-align="center"/);
  const titleRow = source.match(/<View testID="profile-identity-title-row"[\s\S]*?<\/View>/)?.[0] ?? "";
  assert.match(titleRow, /testID="profile-identity-name"/);
  assert.match(titleRow, /testID="profile-identity-chevron"/);
  assert.doesNotMatch(titleRow, /ProfileIntentionPill/);
  assert.match(html, /data-testid="profile-identity-chevron"[^>]*data-align="flex-end"[^>]*data-width="38"/);
  assert.equal((html.match(/data-icon="chevron-right"/g) ?? []).length, 1);
  assert.ok(html.indexOf("Resonador") < html.indexOf('data-testid="profile-identity-chevron"'));
  assert.ok(html.indexOf('data-testid="profile-identity-chevron"') < html.indexOf('data-testid="profile-identity-description"'));
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
  assert.match(source, /avatarWrapper: \{[^}]*marginTop: 3, marginBottom: 3/);
  assert.match(html, /data-testid="profile-identity-row" data-direction="row" data-align="center"/);
  const membership = readFileSync(new URL("../components/ProfileMembershipBanner.tsx", import.meta.url), "utf8");
  assert.match(membership, /chevron: \{\s*width: 32,/);
  assert.match(membership, /row: \{[\s\S]*?paddingHorizontal: 0/);
  assert.match(source, /profileIdentityRow: \{[\s\S]*?paddingLeft: 3,\s*paddingRight: 0/);
  assert.match(source, /<Feather name="chevron-right" size=\{24\}/);
  assert.match(membership, /<Feather name="chevron-right" size=\{24\}/);
});

test("name, avatar and restored chevron open Mi cuenta", () => {
  let route = "";
  render({ onNavigate: (next: string) => route = next });
  assert.ok(presses.has("profile-identity-name"));
  presses.get("profile-identity-name")?.();
  assert.equal(route, "/mi-perfil");
  route = "";
  assert.ok(presses.has("profile-identity-chevron"));
  presses.get("profile-identity-chevron")?.();
  assert.equal(route, "/mi-perfil");
  route = "";
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

test("Premium membership no longer overlays the avatar or changes its navigation", () => {
  let route = "";
  let journey = false;
  const html = render({ isPremium: true, onNavigate: (next: string) => route = next, onJourney: (open: boolean) => journey = open });
  presses.get("profile-identity-avatar")?.();
  presses.get("profile-intention-pill")?.();
  assert.equal(route, "/mi-perfil");
  assert.equal(journey, false);
  assert.doesNotMatch(html, /profile-intention-pill/);
  assert.doesNotMatch(html, /profile-avatar-premium-badge|data-icon="star"/);
  assert.match(source, /<SessionBadgeGlass showBlackTint=\{false\} showWhiteTint \/>/);
  assert.match(source, /<MaterialCommunityIcons name="star" size=\{19\} color=\{MEMBERSHIP_AURORA\.premium\.accent\} \/>/);
  assert.match(source, /titlePremiumBadge:\s*\{\s*width: 26,\s*height: 26,\s*borderRadius: 13,\s*overflow: "hidden"/);
  assert.doesNotMatch(render({ isPremium: false }), /profile-avatar-premium-badge|data-icon="star"/);
});

test("both Perfil titles place Premium star and its glass six pixels to the right, only for Premium users", () => {
  assert.equal(titleRows.length, 2);
  const titleStyleProperties = styles!.properties.filter(property =>
    ts.isPropertyAssignment(property) && /^(dedicatedTitleLeft|dedicatedHeroTitle|profileStickyHeaderTitleGroup|profileStickyHeaderTitle|titlePremiumBadge)$/.test(property.name.getText(ast)));
  const titleCode = ts.transpileModule(`
    const styles = { ${titleStyleProperties.map(property => property.getText(ast)).join(",")} };
    function Titles({ isPremium }) {
      const colors = { foreground: "#FFFFFF" };
      const MEMBERSHIP_AURORA = { premium: { accent: "#E7B95C" } };
      const profileStickyHeaderOpacity = { interpolate: () => 0 };
      return <>${titleRows.map(row => row.getText(ast)).join("")}</>;
    }
  `, { compilerOptions: { jsx: ts.JsxEmit.React, module: ts.ModuleKind.CommonJS } }).outputText;
  const Glass = () => React.createElement("span", { "data-testid": "premium-glass" });
  const Titles = new Function("React", "View", "Text", "Animated", "SessionBadgeGlass", "MaterialCommunityIcons",
    `${titleCode}\nreturn Titles;`)(React, Native, Native, { View: Native }, Glass, Native);
  const premium = renderToStaticMarkup(React.createElement(Titles, { isPremium: true }));
  assert.equal((premium.match(/data-icon="star"/g) ?? []).length, 2);
  assert.equal((premium.match(/data-testid="premium-glass"/g) ?? []).length, 2);
  assert.equal((premium.match(/data-direction="row" data-align="center"[^>]*data-gap="6"/g) ?? []).length, 2);
  for (const id of ["profile-title-premium-badge", "profile-sticky-title-premium-badge"]) {
    assert.match(premium, new RegExp(`Perfil</div><div data-testid="${id}"`));
    assert.match(premium, new RegExp(`data-testid="${id}"[^>]*data-width="26"[^>]*data-height="26"[^>]*data-radius="13"[^>]*data-overflow="hidden"`));
  }
  const free = renderToStaticMarkup(React.createElement(Titles, { isPremium: false }));
  assert.doesNotMatch(free, /premium-badge|premium-glass|data-icon="star"/);
});