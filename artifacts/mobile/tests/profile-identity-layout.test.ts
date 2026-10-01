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
let styles: ts.ObjectLiteralExpression | undefined;
function visit(node: ts.Node) {
  if (ts.isJsxElement(node) && node.openingElement.attributes.properties.some(
    attribute => ts.isJsxAttribute(attribute) && attribute.name.getText(ast) === "testID"
      && attribute.initializer && ts.isStringLiteral(attribute.initializer)
      && attribute.initializer.text === "profile-identity-row",
  )) identity = node;
  if (ts.isVariableDeclaration(node) && node.name.getText(ast) === "styles"
    && node.initializer && ts.isCallExpression(node.initializer)
    && ts.isObjectLiteralExpression(node.initializer.arguments[0])) styles = node.initializer.arguments[0];
  ts.forEachChild(node, visit);
}
visit(ast);
assert.ok(identity && styles);
const styleProperties = styles.properties.filter(property =>
  ts.isPropertyAssignment(property)
    && /^(profileIdentityRow|dedicatedProfileIdentityRow|profileDetails|dedicatedProfileDetails|avatar.*|userName|profileName.*|profileEmail|profileLocationLeft|profileIntention.*|locationRow|locationText)$/.test(property.name.getText(ast)),
);
const compiled = ts.transpileModule(`
  const styles = { ${styleProperties.map(property => property.getText(ast)).join(",")} };
  function Identity(props) {
    const { dedicated = true, email = null, location = "", isPremium = false } = props;
    const username = "Resonador", lastName = "", photoUri = null, selectedProfilePreset = null;
    const colors = { foreground: "#FFFFFF", mutedForeground: "#AAAAAA", secondary: "#060A0F", primary: "#BE9650" };
    const secondaryAccent = "#BE9650", MEMBERSHIP_AURORA = { premium: { accent: "#E7B95C" } };
    const router = { push: props.onNavigate || (() => {}) };
    const setGrowthJourneyOpen = props.onJourney || (() => {});
    return ${identity.getText(ast)};
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
  }, props.children);
};
const Pill = (props: any) => React.createElement(Native, { ...props, testID: "profile-intention-pill" }, "0 Días: Intención");
const Identity = new Function(
  "React", "View", "Pressable", "Text", "Feather", "MaterialCommunityIcons", "Image", "SessionBadgeGlass", "ProfileIntentionPill",
  `${compiled}\nreturn Identity;`,
)(React, Native, Native, Native, Native, Native, Native, Native, Pill);
const render = (props: Record<string, unknown> = {}) => {
  presses.clear();
  return renderToStaticMarkup(React.createElement(Identity, props));
};

test("Perfil places avatar left with name and intention on its right, without the email", () => {
  const html = render({ email: "example@example.com", location: "Ubicación" });
  assert.match(html, /data-testid="profile-identity-row" data-direction="row" data-align="flex-start"/);
  assert.match(html, /data-testid="profile-identity-details" data-align="flex-start"[^>]*data-flex="1" data-min-width="0"/);
  const avatar = html.indexOf('data-testid="profile-identity-avatar"');
  const name = html.indexOf("Resonador");
  const pill = html.indexOf('data-testid="profile-intention-pill"');
  assert.ok(avatar < name && name < pill);
  assert.doesNotMatch(html, /profile-identity-email|example@example\.com/);
  assert.doesNotMatch(html, /Ubicación|data-icon="map-pin"/);
  assert.match(html, /data-testid="profile-intention-pill"[^>]*data-self-align="flex-start"/);
  assert.match(source, /dedicatedProfileCard: \{[^}]*backgroundColor: "rgba\(0,0,0,0.22\)"/);
  assert.match(source, /avatarImage:\s*\{\s*width: 81,\s*height: 81,\s*borderRadius: 40\.5/);
  assert.match(source, /avatarCircle:\s*\{\s*width: 81,\s*height: 81,\s*borderRadius: 40\.5/);
  assert.match(source, /avatarOuterBorder:\s*\{\s*position: "absolute",\s*top: -3,\s*left: -3,\s*width: 87,\s*height: 87,\s*borderRadius: 43\.5,\s*borderWidth: 3/);
  const rowStyle = source.match(/profileIdentityRow: \{([\s\S]*?)\n  \},/)?.[1] ?? "";
  assert.match(rowStyle, /paddingHorizontal: 20/);
});

test("the name chevron is centered in the title row and shares the Premium chevron's right column", () => {
  const html = render();
  assert.match(html, /data-testid="profile-identity-name" data-direction="row" data-align="center"/);
  assert.match(html, /data-testid="profile-identity-chevron"[^>]*data-align="center"[^>]*data-width="32"/);
  assert.equal((html.match(/data-icon="chevron-right"/g) ?? []).length, 1);
  assert.match(source, /profileNameRow: \{ width: "100%", flexDirection: "row", alignItems: "center"/);
  const membership = readFileSync(new URL("../components/ProfileMembershipBanner.tsx", import.meta.url), "utf8");
  assert.match(membership, /chevron: \{ width: 32,/);
  assert.match(membership, /row: \{[\s\S]*?paddingHorizontal: 20/);
  assert.match(source, /profileIdentityRow: \{[\s\S]*?paddingHorizontal: 20/);
  assert.match(source, /<Feather name="chevron-right" size=\{24\}/);
  assert.match(membership, /<Feather name="chevron-right" size=\{24\}/);
});

test("the name and chevron row opens the same Mi cuenta screen as the avatar", () => {
  let route = "";
  render({ onNavigate: (next: string) => route = next });
  assert.ok(presses.has("profile-identity-name"));
  presses.get("profile-identity-name")?.();
  assert.equal(route, "/mi-perfil");
});

test("missing email is not replaced with a fake address and intention remains dedicated to Perfil", () => {
  assert.doesNotMatch(render(), /profile-identity-email|@/);
  const other = render({ dedicated: false, email: "example@example.com" });
  assert.doesNotMatch(other, /profile-intention-pill/);
});

test("avatar opens Mi cuenta and intention opens Tu camino without an avatar star", () => {
  let route = "";
  let journey = false;
  const html = render({ isPremium: true, onNavigate: (next: string) => route = next, onJourney: (open: boolean) => journey = open });
  presses.get("profile-identity-avatar")?.();
  presses.get("profile-intention-pill")?.();
  assert.equal(route, "/mi-perfil");
  assert.equal(journey, true);
  assert.doesNotMatch(html, /data-icon="star"/);
  assert.doesNotMatch(source, /avatarPremiumBadge/);
});