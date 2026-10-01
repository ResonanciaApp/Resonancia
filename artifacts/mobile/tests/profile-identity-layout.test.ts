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

test("Perfil centers avatar above name while retaining email between name and intention", () => {
  const html = render({ email: "example@example.com", location: "Ubicación" });
  assert.match(html, /data-testid="profile-identity-row" data-direction="column" data-align="center"/);
  assert.match(html, /data-testid="profile-identity-details" data-align="center"/);
  const avatar = html.indexOf('data-testid="profile-identity-avatar"');
  const name = html.indexOf("Resonador");
  const email = html.indexOf('data-testid="profile-identity-email"');
  const pill = html.indexOf('data-testid="profile-intention-pill"');
  assert.ok(avatar < name && name < email && email < pill);
  assert.match(html, /data-testid="profile-identity-email"[^>]*data-text-align="center" data-lines="1" data-ellipsis="middle">example@example.com/);
  assert.match(html, /data-testid="profile-intention-pill"[^>]*data-self-align="center"/);
});

test("missing email is not replaced with a fake address, and other profile variants stay centered", () => {
  assert.doesNotMatch(render(), /profile-identity-email|@/);
  const other = render({ dedicated: false, email: "example@example.com" });
  assert.match(other, /data-testid="profile-identity-details" data-align="center"/);
  assert.doesNotMatch(other, /profile-identity-email|profile-intention-pill|data-direction="row"/);
});

test("avatar still opens Mi cuenta, intention opens Tu camino, and Premium badge stays visible", () => {
  let route = "";
  let journey = false;
  const html = render({ isPremium: true, onNavigate: (next: string) => route = next, onJourney: (open: boolean) => journey = open });
  presses.get("profile-identity-avatar")?.();
  presses.get("profile-intention-pill")?.();
  assert.equal(route, "/mi-perfil");
  assert.equal(journey, true);
  assert.match(html, /data-icon="star"/);
});