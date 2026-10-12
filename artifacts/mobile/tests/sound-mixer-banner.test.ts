import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { URL } from "node:url";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const source = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const screen = source("app/(tabs)/sonidos.tsx");
const bannerSource = source("components/SoundMixerBanner.tsx");

test("Sonidos hides the mixer banner without leaving its spacer or removing the premium banner", () => {
  assert.doesNotMatch(screen, /SoundMixerBanner|index === 2 \?/);
  const loopStart = screen.indexOf("{orderedCollections.map");
  const loop = screen.slice(loopStart, screen.indexOf("</ScrollView>", loopStart));
  assert.match(loop, /<SessionCarousel/);
  assert.match(screen, /\.filter\(\(tag\) => tag\.sessions\.length > 0\)/);
  assert.match(loop, /index === 1 && !isPremium[\s\S]*?<SoundPremiumBanner/);
  assert.doesNotMatch(source("app/(tabs)/descanzo.tsx"), /<SoundMixerBanner|sleepMixerBanner/);
});

test("the restored banner keeps its visual details and opens the real mixer panel", () => {
  let opens = 0;
  let pressProps: Record<string, any> = {};
  const flatten = (value: any): Record<string, any> => Array.isArray(value)
    ? Object.assign({}, ...value.filter(Boolean).map(flatten)) : value ?? {};
  const module = { exports: {} as { SoundMixerBanner: React.ComponentType } };
  const mocks: Record<string, unknown> = {
    "react/jsx-runtime": { jsx: React.createElement, jsxs: React.createElement },
    react: React,
    "react-native": {
      StyleSheet: { create: (value: unknown) => value },
      Pressable: (props: any) => {
        pressProps = props;
        return React.createElement("button", { "aria-label": props.accessibilityLabel }, props.children);
      },
      View: (props: any) => React.createElement("div", null, props.children),
      Text: (props: any) => React.createElement("span", null, props.children),
    },
    "@expo/vector-icons": {
      Feather: (props: any) => React.createElement("i", { "data-icon": props.name }),
      MaterialCommunityIcons: (props: any) => React.createElement("i", { "data-icon": props.name }),
    },
    "@/components/MoonCrescentIcon": { MoonCrescentIcon: () => React.createElement("i", { "data-icon": "moon" }) },
    "@/constants/colors": { MEMBERSHIP_AURORA: { plus: { accent: "#E2E2E2" } } },
    "@/context/MixerPanelContext": { useMixerPanel: () => ({ openMixer: () => opens++ }) },
    "@/hooks/useColors": { useColors: () => ({ accent: "#BE9650" }) },
  };
  // A classic JSX transform supplies React explicitly, as in the Expo runtime.
  new Function("require", "module", "exports", "React", ts.transpileModule(bannerSource, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React },
  }).outputText)((name: string) => {
    assert.ok(name in mocks, `Unexpected dependency ${name}`);
    return mocks[name];
  }, module, module.exports, React);
  const html = renderToStaticMarkup(React.createElement(module.exports.SoundMixerBanner));
  assert.match(html, /Mezclador de sonidos/);
  assert.match(html, /Crea tu propio universo sonoro con más de 400 sonidos ambientales/);
  assert.match(html, /data-icon="moon"/);
  assert.match(html, /data-icon="diamond-stone"/);
  assert.match(html, /data-icon="chevron-right"/);
  assert.equal(pressProps.accessibilityRole, "button");
  const idle = flatten(pressProps.style({ pressed: false }));
   assert.equal(idle.backgroundColor, "rgba(0,0,0,0.28)");
   const resonadoresSource = source("components/ResonadoresBanner.tsx");
   assert.ok(resonadoresSource.includes(`backgroundColor: "${idle.backgroundColor}"`));
  assert.equal(idle.minHeight, 110);
  assert.equal(idle.borderColor, "rgba(227,247,255,0.27)");
  assert.equal(idle.borderRadius, 16);
  assert.equal(flatten(pressProps.style({ pressed: true })).opacity, 0.82);
  pressProps.onPress();
  assert.equal(opens, 1);
});