import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { URL } from "node:url";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const content = {
  home: { title: "Inicio editorial", description: "Descripción inicial", images: ["builtin:2", "/objects/uploaded"] },
  sleep: { title: "Descanso editorial", description: "Descripción dormir", images: [] },
  sounds: { title: "Sonidos editorial", description: "Descripción sonidos", images: [] },
  profile: { title: "Perfil editorial", description: "Descripción perfil", images: [] },
};
let premium = false;
const Native = (p: any) => React.createElement("div", { "data-source": JSON.stringify(p.source) }, p.children);
const mocks: Record<string, any> = {
  react: React,
  "react-native": { View: Native, Text: Native, Pressable: Native, ScrollView: Native, StyleSheet: { create: (v: any) => v }, useWindowDimensions: () => ({ width: 400 }) },
  "@/components/CardCaptionText": { CardCaptionText: Native },
  "expo-image": { Image: Native },
  "expo-linear-gradient": { LinearGradient: Native },
  "@expo/vector-icons": { Feather: Native, MaterialCommunityIcons: Native },
  "expo-router": { router: { push() {} } },
  "@/context/PremiumContext": { usePremium: () => ({ isPremium: premium }) },
  "@/hooks/usePremiumContent": { usePremiumContent: () => ({ content, revision: 7 }) },
  "@/lib/avatar": { resolveAvatarUrl: (p: string) => `https://example.test${p}` },
  "@/lib/premiumGate": { openPremiumPlans() {} },
  "@/constants/colors": { MEMBERSHIP_AURORA: { premium: { accent: "#fff", glow: "#fff" }, trialButtonBackground: "#000" }, CARD_TEXT_BELOW: "#fff" },
};
function load(file: string) {
  const source = readFileSync(new URL(`../components/${file}.tsx`, import.meta.url), "utf8");
  const code = ts.transpileModule(source, { compilerOptions: { jsx: ts.JsxEmit.React, module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText;
  const module = { exports: {} as any };
  new Function("require", "module", "exports", "React", code)((name: string) => {
    if (/\.(png|jpg)$/.test(name)) return name;
    assert.ok(mocks[name], `unmocked ${name}`);
    return mocks[name];
  }, module, module.exports, React);
  return module.exports;
}
test("Inicio and Dormir use independent saved content, ordered images and empty carousel", () => {
  const Banner = load("PremiumBanner").default;
  const home = renderToStaticMarkup(React.createElement(Banner));
  assert.match(home, /Inicio/);
  assert.match(home, /Descripción inicial/);
  assert.match(home, /ambiental-espacio-profundo/);
  assert.match(home, /premium-content\/image\/home\/1\?revision=7/);
  const sleep = renderToStaticMarkup(React.createElement(Banner, { sleepVariant: true }));
  assert.match(sleep, /Descanso editorial/);
  assert.match(sleep, /Descripción dormir/);
  assert.doesNotMatch(sleep, /ambiental-|premium-content\/image/);
  premium = true;
  assert.equal(renderToStaticMarkup(React.createElement(Banner)), "");
  premium = false;
});
test("Sonidos and Perfil use saved copy without changing the member experience", () => {
  const Sounds = load("SoundPremiumBanner").SoundPremiumBanner;
  assert.match(renderToStaticMarkup(React.createElement(Sounds)), /Descripción sonidos/);
  const Profile = load("ProfileMembershipBanner").ProfileMembershipBanner;
  const free = renderToStaticMarkup(React.createElement(Profile, { isPremium: false, foregroundColor: "#fff" }));
  assert.match(free, /Perfil editorial/);
  assert.match(free, /Descripción perfil/);
  const member = renderToStaticMarkup(React.createElement(Profile, { isPremium: true, foregroundColor: "#fff" }));
  assert.match(member, /Tu Premium/);
  assert.doesNotMatch(member, /Perfil editorial/);
});
