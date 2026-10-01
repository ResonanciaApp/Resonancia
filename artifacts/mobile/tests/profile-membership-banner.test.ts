import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { URL } from "node:url";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const source = readFileSync(new URL("../components/ProfileMembershipBanner.tsx", import.meta.url), "utf8");
let press: (() => void) | undefined;
let offers = 0;
let route = "";
const Native = (props: any) => {
  if (props.onPress) press = props.onPress;
  return React.createElement("div", {
    "data-testid": props.testID,
    "data-icon": props.name,
    "aria-label": props.accessibilityLabel,
  }, props.children);
};
const mocks: Record<string, unknown> = {
  react: React,
  "react-native": { Pressable: Native, View: Native, Text: Native, StyleSheet: { create: (styles: unknown) => styles } },
  "@expo/vector-icons": { Feather: Native, MaterialCommunityIcons: Native },
  "@/constants/colors": { CARD_TEXT_BELOW: "#AAA", MEMBERSHIP_AURORA: { premium: { accent: "#E7B95C", glow: "#E7B95C" } } },
  "@/lib/premiumGate": { openPremiumPlans: () => { offers++; } },
  "expo-router": { router: { push: (next: string) => { route = next; } } },
};
const compiled = ts.transpileModule(source, {
  compilerOptions: { jsx: ts.JsxEmit.React, module: ts.ModuleKind.CommonJS, esModuleInterop: true },
}).outputText;
const module = { exports: {} };
new Function("require", "module", "exports", compiled)((name: string) => {
  assert.ok(name in mocks, `mock exists for ${name}`);
  return mocks[name];
}, module, module.exports);
const { ProfileMembershipBanner } = module.exports as {
  ProfileMembershipBanner: React.ComponentType<{ isPremium: boolean; foregroundColor: string }>;
};

test("free users see Prueba Premium and open the existing plans offer directly", () => {
  offers = 0;
  route = "";
  const html = renderToStaticMarkup(React.createElement(ProfileMembershipBanner, { isPremium: false, foregroundColor: "#FFF" }));
  assert.match(html, /Prueba Premium/);
  assert.match(html, /Tu transformación comienza acá/);
  assert.ok(html.indexOf("profile-premium-divider") < html.indexOf("profile-premium-banner"));
  assert.ok(html.indexOf('data-icon="star"') < html.indexOf(">Prueba Premium<"));
  press?.();
  assert.equal(offers, 1);
  assert.equal(route, "");
});

test("Premium users see Tu Premium and open subscription management", () => {
  offers = 0;
  const html = renderToStaticMarkup(React.createElement(ProfileMembershipBanner, { isPremium: true, foregroundColor: "#FFF" }));
  assert.match(html, /Tu Premium/);
  assert.match(html, /Gestiona tu suscripción y beneficios/);
  assert.doesNotMatch(html, /Prueba Premium/);
  press?.();
  assert.equal(route, "/membresia");
  assert.equal(offers, 0);
});

test("banner and identity share the same user-section background", () => {
  const profile = readFileSync(new URL("../components/ProfileScreenBase.tsx", import.meta.url), "utf8");
  const ast = ts.createSourceFile("profile.tsx", profile, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let section = "";
  function visit(node: ts.Node) {
    if (ts.isJsxElement(node) && node.openingElement.attributes.properties.some(
      attr => ts.isJsxAttribute(attr) && attr.name.getText(ast) === "testID"
        && attr.initializer && ts.isStringLiteral(attr.initializer) && attr.initializer.text === "profile-user-section",
    )) section = node.getText(ast);
    ts.forEachChild(node, visit);
  }
  visit(ast);
  assert.match(section, /testID="profile-identity-row"/);
  assert.match(section, /<ProfileMembershipBanner isPremium=\{isPremium\} foregroundColor=\{colors.foreground\}/);
  assert.match(profile, /const PROFILE_CARD_BOTTOM_PADDING = 8;/);
  assert.match(profile, /paddingBottom: PROFILE_CARD_BOTTOM_PADDING/);
  assert.match(profile, /marginBottom: PROFILE_SECTION_GAP/);
  assert.doesNotMatch(source, /backgroundColor:.*0,0,0/);
});

test("Premium star and copy align with the standard section margin without horizontal offsets", () => {
  const rowStyle = source.match(/  row: \{([\s\S]*?)\n  \},/)?.[1] ?? "";
  const iconStyle = source.match(/  icon: \{([\s\S]*?)\n  \},/)?.[1] ?? "";
  assert.match(rowStyle, /paddingHorizontal: 20/);
  assert.match(iconStyle, /width: 31/);
  assert.match(source, /name="star" size=\{31\}/);
  assert.doesNotMatch(source, /translateX/);
});