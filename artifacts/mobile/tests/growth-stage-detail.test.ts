import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { URL } from "node:url";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

function load(path: string, resolve: (name: string) => unknown) {
  const compiled = ts.transpileModule(readFileSync(new URL(path, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true },
  }).outputText;
  const module = { exports: {} as Record<string, any> };
  new Function("require", "module", "exports", compiled)(resolve, module, module.exports);
  return module.exports;
}
const assets: string[] = [];
const { growthLevels } = load("../data/growthLevels.ts", (name) => {
  assets.push(name);
  return assets.length;
});
const constants = load("../constants/colors.ts", (name) => { throw new Error(`Unexpected color import ${name}`); });
const colors = ["#060A0F", "#1B2342", "#242350"];
const locations = [0, 0.5, 1];
const presses = new Map<string, any>();
const nodes = new Map<string, any>();
let width = 375;
let top = 24;
let platform = "ios";
const flat = (value: any): any => Array.isArray(value) ? Object.assign({}, ...value.map(flat)) : value ?? {};
function Native(props: any) {
  if (props.testID) nodes.set(props.testID, props);
  if (props.testID && props.onPress) presses.set(props.testID, props);
  const style = flat([props.style, props.contentContainerStyle]);
  return React.createElement("div", {
    "data-testid": props.testID,
    "data-width": style.width, "data-height": style.height,
    "data-top-padding": style.paddingTop, "data-bottom-padding": style.paddingBottom,
    "data-radius": style.borderRadius, "data-font": style.fontFamily,
    "data-icon": props.name,
    "data-level": props.level?.id, "data-source": props.level?.image,
    "data-hero-size": props.size,
    "data-colors": props.colors ? JSON.stringify(props.colors) : undefined,
    "data-locations": props.locations ? JSON.stringify(props.locations) : undefined,
    "data-pointer-events": props.pointerEvents,
    "data-disabled": props.disabled === undefined ? undefined : String(props.disabled),
  }, props.children);
}
const native = {
  View: Native, Text: Native, Pressable: Native, ScrollView: Native,
  StyleSheet: { create: (value: any) => value, absoluteFillObject: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }, absoluteFill: {} },
  Platform: { get OS() { return platform; } },
  useWindowDimensions: () => ({ width, height: 812 }),
};
const { GrowthStageDetail } = load("../components/GrowthStageDetail.tsx", (name) => {
  const imports: Record<string, unknown> = {
    react: React, "react-native": native,
    "@expo/vector-icons": { Feather: Native, MaterialCommunityIcons: Native },
    "@react-native-masked-view/masked-view": (props: any) => React.createElement(Native, props, props.maskElement, props.children),
    "expo-linear-gradient": { LinearGradient: Native },
    "react-native-safe-area-context": { useSafeAreaInsets: () => ({ top, bottom: 34 }) },
    "@/components/CinematicFadeSlide": { CinematicFadeSlide: Native },
    "@/components/GrowthJourney": { GrowthLevelImage: (props: any) => React.createElement(Native, { ...props, testID: "growth-detail-hero-artwork" }) },
    "@/constants/colors": constants,
    "@/context/SceneThemeContext": { useSceneTheme: () => ({ theme: { gradient: colors, gradientLocations: locations, gradientStart: { x: 0, y: 0 }, gradientEnd: { x: 0, y: 1 } } }) },
    "@/data/growthLevels": { growthLevels },
  };
  assert.ok(name in imports, `Missing detail mock: ${name}`);
  return imports[name];
});
const render = (props: Record<string, unknown> = {}) => {
  nodes.clear(); presses.clear();
  return renderToStaticMarkup(React.createElement(GrowthStageDetail, { onClose() {}, onHelp() {}, ...props }));
};

test("Intención detail uses its actual hero, 0-day label and canonical story, not Semilla content", () => {
  const html = render();
  assert.match(html, /Intención/);
  assert.match(html, />0 días</);
  assert.ok(html.includes(growthLevels[0].story));
  assert.doesNotMatch(html, /Semilla|1.?7 días|avatares|sin sello/);
  assert.equal(nodes.get("growth-detail-hero-artwork").level, growthLevels[0]);
  assert.equal(assets[growthLevels[0].image - 1], "../assets/images/growth/00-intencion.png");
  assert.equal(nodes.get("growth-detail-hero-artwork").size, 375);
  assert.match(html, /data-font="CormorantGaramond"/);
});

test("the detail shares the streak screen's theme, safe-area spacing, circular controls and scroll bounce", () => {
  for (const viewport of [375, 402, 768]) {
    width = viewport;
    for (const inset of [24, 59]) {
      top = inset;
      const html = render();
      assert.equal(nodes.get("growth-stage-detail").colors, colors);
      assert.equal(nodes.get("growth-stage-detail").locations, locations);
      assert.equal(nodes.get("growth-detail-hero-artwork").size, viewport);
      assert.match(html, new RegExp(`data-top-padding="${Math.max(inset, 40) + 8}"`));
      const scroll = nodes.get("growth-stage-detail-scroll");
      assert.equal(scroll.bounces, true);
      assert.equal(scroll.alwaysBounceVertical, true);
      assert.equal(scroll.overScrollMode, "always");
      assert.equal(scroll.contentContainerStyle.paddingBottom, 62);
      for (const button of ["growth-stage-detail-close", "growth-stage-detail-help"]) {
        assert.equal(flat(presses.get(button).style).width, 43);
        assert.equal(flat(presses.get(button).style).height, 43);
      }
    }
  }
  platform = "web";
  assert.match(render(), /data-top-padding="75"/);
  platform = "ios"; width = 375; top = 24;
});

test("X returns to Tu camino, help opens its explanation, and both controls are disabled beneath help", () => {
  let closes = 0, helps = 0;
  render({ onClose: () => closes++, onHelp: () => helps++ });
  presses.get("growth-stage-detail-close").onPress();
  presses.get("growth-stage-detail-help").onPress();
  assert.equal(closes, 1);
  assert.equal(helps, 1);
  render({ helpVisible: true });
  assert.equal(nodes.get("growth-stage-detail").pointerEvents, "none");
  assert.equal(nodes.get("growth-stage-detail").accessibilityElementsHidden, true);
  assert.equal(nodes.get("growth-stage-detail").importantForAccessibility, "no-hide-descendants");
  assert.equal(presses.get("growth-stage-detail-close").disabled, true);
  assert.equal(presses.get("growth-stage-detail-help").disabled, true);
  const source = readFileSync(new URL("../components/GrowthStageDetail.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(source, /<Modal|router\.push/);
});