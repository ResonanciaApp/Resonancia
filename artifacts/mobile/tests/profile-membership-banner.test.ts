import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { URL } from "node:url";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const source = readFileSync(new URL("../components/ProfileMembershipBanner.tsx", import.meta.url), "utf8");
test("the trial card has no divider or extra top margin and centers its contents", () => {
  assert.doesNotMatch(source, /profile-premium-divider|styles\.divider/);
  assert.match(source, /!isPremium && styles\.trialCard/);
  const card = source.match(/trialCard:\s*\{([\s\S]*?)\n  \},/)?.[1] ?? "";
  assert.match(card, /backgroundColor: "rgba\(0,0,0,0\.16\)"/);
  assert.match(card, /borderRadius: 20/);
  assert.match(card, /paddingVertical: 18/);
  assert.match(card, /paddingHorizontal: 16/);
  assert.doesNotMatch(card, /marginTop/);
  assert.match(card, /alignItems: "center"/);
});
test("the Premium star artwork and legacy offsets remain unchanged outside the trial card", () => {
  const icon = source.match(/icon:\s*\{([\s\S]*?)\n  \},/)?.[1] ?? "";
  assert.match(icon, /transform: \[\{ translateY: -3 \}\]/);
  assert.equal((source.match(/translateY/g) ?? []).length, 2);
  assert.match(source, /source=\{require\("..\/assets\/images\/estrella-premium.png"\)\}/);
  assert.match(source, /style=\{\{ width: 31, height: 31 \}\} contentFit="contain"/);
});
let press: (() => void) | undefined;
let offers = 0;
let route = "";
const Native = (props: any) => {
  if (props.onPress) press = props.onPress;
  const rawStyle = typeof props.style === "function" ? props.style({ pressed: false }) : props.style;
  const style = Object.assign({}, ...[rawStyle].flat(Infinity).filter(Boolean));
  return React.createElement("div", {
    "data-testid": props.testID,
    "data-icon": props.name,
    "aria-label": props.accessibilityLabel,
    "data-height": style.height,
    "data-background": style.backgroundColor,
    "data-padding-horizontal": style.paddingHorizontal,
    "data-padding-vertical": style.paddingVertical,
    "data-radius": style.borderRadius,
    "data-translate-y": style.transform?.find((item: any) => "translateY" in item)?.translateY,
  }, props.children);
};
let bannerStyles: Record<string, any>;
const mocks: Record<string, unknown> = {
  "@/components/CardCaptionText": { CardCaptionText: Native },
  react: React,
  "react-native": { Pressable: Native, View: Native, Text: Native, StyleSheet: { create: (styles: Record<string, any>) => {
    bannerStyles = styles;
    return styles;
  } } },
  "@expo/vector-icons": { Feather: Native, MaterialCommunityIcons: Native },
  "expo-image": { Image: Native },
  "../assets/images/estrella-premium.png": 1,
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

test("legacy Premium alignment is retained while trial contents are centered without translations", () => {
  for (const isPremium of [true, false]) {
    const html = renderToStaticMarkup(React.createElement(ProfileMembershipBanner, { isPremium, foregroundColor: "#FFF" }));
    if (isPremium) {
      assert.match(html, /data-height="31"[^>]* data-translate-y="-3"/);
      assert.match(html, /data-height="44" data-translate-y="3.5"/);
    } else {
      assert.doesNotMatch(html, /data-translate-y/);
      assert.equal(bannerStyles.trialCard.alignItems, "center");
      assert.deepEqual(bannerStyles.centeredAdornment.transform, []);
      assert.match(source, /styles\.icon, !isPremium && styles\.centeredAdornment/);
      assert.match(source, /styles\.chevron, !isPremium && styles\.centeredAdornment/);
    }
    assert.equal(bannerStyles.row.alignItems, "flex-end");
    const centerFromBottom = (style: Record<string, any>) =>
      -style.height / 2 + style.transform.reduce((sum: number, item: any) => sum + (item.translateY ?? 0), 0);
    assert.equal(centerFromBottom(bannerStyles.icon), centerFromBottom(bannerStyles.chevron));
    assert.equal(bannerStyles.chevron.height, 44);
    assert.equal(bannerStyles.copy.transform, undefined);
    assert.equal(bannerStyles.row.transform, undefined);
  }
});

test("free users see Prueba Premium and open the existing plans offer directly", () => {
  offers = 0;
  route = "";
  const html = renderToStaticMarkup(React.createElement(ProfileMembershipBanner, { isPremium: false, foregroundColor: "#FFF" }));
  assert.match(html, /Prueba Premium/);
  assert.match(html, /Tu transformación comienza acá/);
  assert.doesNotMatch(html, /profile-premium-divider/);
  assert.match(html, /data-background="rgba\(0,0,0,0\.16\)"/);
  assert.match(html, /data-padding-horizontal="16" data-padding-vertical="18" data-radius="20"/);
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

test("trial is its own section with the standard gap and no inherited progress offset", () => {
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
  assert.doesNotMatch(section, /ProfileMembershipBanner/);
  assert.match(profile, /const PROFILE_CARD_BOTTOM_PADDING = 20;/);
  assert.match(profile, /paddingBottom: PROFILE_CARD_BOTTOM_PADDING/);
  assert.match(profile, /marginBottom: PROFILE_SECTION_GAP/);
  assert.match(profile, /!isPremium && \(\s*<View testID="profile-premium-section" style=\{\{ marginBottom: PROFILE_SECTION_GAP \}\}>/);
  assert.match(profile, /<ProfileMembershipBanner isPremium=\{isPremium\} foregroundColor=\{colors.foreground\}/);
  assert.match(profile, /marginTop: isPremium \? styles\.profileProgressSection\.marginTop \+ 15 : 0/);
  assert.match(profile, /const PROFILE_SECTION_GAP = 21;/);
});

test("trial card uses screen margins with the same inner inset as other profile sections", () => {
  const rowStyle = source.match(/  row: \{([\s\S]*?)\n  \},/)?.[1] ?? "";
  const iconStyle = source.match(/  icon: \{([\s\S]*?)\n  \},/)?.[1] ?? "";
  assert.match(rowStyle, /paddingHorizontal: 0/);
  assert.match(iconStyle, /width: 31/);
  assert.match(source, /source=\{require\("..\/assets\/images\/estrella-premium.png"\)\} style=\{\{ width: 31, height: 31 \}\}/);
  assert.doesNotMatch(source, /translateX/);
  assert.equal(bannerStyles.chevron.alignItems, "flex-end");
  for (const screenWidth of [320, 375, 402, 768]) {
    const screenMargin = 16;
    const starLeft = screenMargin + bannerStyles.trialCard.paddingHorizontal;
    const chevronRight = screenWidth - screenMargin - bannerStyles.trialCard.paddingHorizontal;
    assert.equal(starLeft, screenMargin + 16);
    assert.equal(chevronRight, screenWidth - screenMargin - 16);
    assert.equal(starLeft + bannerStyles.icon.width + bannerStyles.row.gap, 76);
  }
});