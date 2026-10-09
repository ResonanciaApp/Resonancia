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
const gradientHelpers = load("../utils/moodHeroGradient.ts", (name) => { throw new Error(`Unexpected gradient import ${name}`); });
const colors = ["#060A0F", "#1B2342", "#242350"];
const locations = [0, 0.5, 1];
const presses = new Map<string, any>();
const nodes = new Map<string, any>();
let width = 375;
let height = 812;
let top = 24;
let platform = "ios";
const flat = (value: any): any => Array.isArray(value) ? Object.assign({}, ...value.map(flat)) : value ?? {};
function Native(props: any) {
  if (props.replayKey === "hero") nodes.set("growth-stage-detail-hero-image", props);
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
   useWindowDimensions: () => ({ width, height }),
};
const { GrowthStageDetail } = load("../components/GrowthStageDetail.tsx", (name) => {
  const imports: Record<string, unknown> = {
    react: React, "react-native": native,
    "@expo/vector-icons": { Feather: Native, MaterialCommunityIcons: Native },
    "@react-native-masked-view/masked-view": (props: any) => React.createElement(Native, props, props.maskElement, props.children),
    "expo-linear-gradient": { LinearGradient: Native },
    "react-native-safe-area-context": { useSafeAreaInsets: () => ({ top, bottom: 34 }) },
    "@/components/CinematicFadeSlide": { CinematicFadeSlide: Native },
    "@/components/GrowthJourney": { GROWTH_BLOOM_ART_SIZE: 137, GrowthLevelImage: (props: any) => React.createElement(Native, { ...props, testID: "growth-detail-hero-artwork" }) },
    "@/constants/colors": constants,
    "@/utils/moodHeroGradient": gradientHelpers,
    "../assets/images/growth/00-intencion-profile-square.png": (() => {
      assets.push("../assets/images/growth/00-intencion-profile-square.png");
      return assets.length;
    })(),
    "@/context/SceneThemeContext": { useSceneTheme: () => ({ theme: { gradient: colors, gradientLocations: locations, gradientStart: { x: 0, y: 0 }, gradientEnd: { x: 0, y: 1 } } }) },
    "@/data/growthLevels": { growthLevels },
    "@/context/GrowthContext": { useGrowth: () => ({ levels: growthLevels }) },
  };
  assert.ok(name in imports, `Missing detail mock: ${name}`);
  return imports[name];
});
const render = (props: Record<string, unknown> = {}) => {
  nodes.clear(); presses.clear();
  return renderToStaticMarkup(React.createElement(GrowthStageDetail, { onClose() {}, ...props }));
};

test("Intención detail uses its actual hero, 0-day label and canonical story, not Semilla content", () => {
  const html = render();
  assert.match(html, /Intención/);
  assert.match(html, />0 días</);
  assert.ok(html.includes(growthLevels[0].story));
  assert.doesNotMatch(html, /Semilla|1.?7 días|avatares|sin sello/);
  assert.equal(nodes.get("growth-detail-hero-artwork").level, growthLevels[0]);
  assert.equal(nodes.get("growth-detail-hero-artwork").sourceModule, undefined, "uses the same stage image as Tu camino");
  assert.equal(nodes.get("growth-detail-hero-artwork").size, 137 * 2);
  assert.match(html, /data-font="CormorantGaramond"/);
  assert.doesNotMatch(html, /PRIMERA ETAPA|Elegir comenzar|growth-stage-detail-help/);
  assert.equal((html.match(/data-icon="spa"/g) ?? []).length, 1, "only the day pill retains its lotus");
});

test("the detail shares the streak screen's theme, safe-area spacing, circular controls and scroll bounce", () => {
  for (const [viewport, viewportHeight] of [[375, 812], [402, 874], [768, 1024]]) {
    width = viewport;
    height = viewportHeight;
    for (const inset of [24, 59]) {
      top = inset;
      const html = render();
      assert.equal(nodes.get("growth-stage-detail").colors, colors);
      assert.equal(nodes.get("growth-stage-detail").locations, locations);
       assert.equal(nodes.get("growth-detail-hero-artwork").size, 274);
       assert.equal(nodes.get("growth-detail-hero-artwork").height, undefined, "square image, no viewport stretch");
       assert.equal(nodes.get("growth-stage-detail-scroll").contentContainerStyle.paddingTop, Math.max(inset, 40) + 40);
      assert.match(html, new RegExp(`data-top-padding="${Math.max(inset, 40) + 8}"`));
      const scroll = nodes.get("growth-stage-detail-scroll");
      assert.equal(scroll.bounces, true);
      assert.equal(scroll.alwaysBounceVertical, true);
      assert.equal(scroll.overScrollMode, "always");
      assert.equal(scroll.contentContainerStyle.paddingBottom, 62);
      for (const button of ["growth-stage-detail-close"]) {
        assert.equal(flat(presses.get(button).style).width, 43);
        assert.equal(flat(presses.get(button).style).height, 43);
      }
    }
  }
  platform = "web";
  assert.match(render(), /data-top-padding="75"/);
  platform = "ios"; width = 375; height = 812; top = 24;
});

test("X returns to Tu camino; the detail has no help button or its background", () => {
  let closes = 0;
  render({ onClose: () => closes++ });
  presses.get("growth-stage-detail-close").onPress();
  assert.equal(closes, 1);
  assert.equal(presses.has("growth-stage-detail-help"), false);
  assert.equal(presses.size, 1);
  const source = readFileSync(new URL("../components/GrowthStageDetail.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(source, /<Modal|router\.push/);
});

test("the detail has only one continuous theme background, without opaque hero strips", () => {
  const html = render();
  assert.equal((html.match(/data-colors=/g) ?? []).length, 1);
  assert.equal(nodes.get("growth-stage-detail").colors, colors);
  assert.equal(nodes.get("growth-stage-detail").locations, locations);
  assert.equal(flat(nodes.get("growth-stage-detail-hero-image").style).backgroundColor, undefined);
  assert.ok(html.indexOf('data-testid="growth-stage-detail-scroll"') < html.indexOf('data-testid="growth-detail-hero-artwork"'));
  const source = readFileSync(new URL("../components/GrowthStageDetail.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(source, /FULL_HERO_IMAGE|getMoodHeroGradient|heroBackground|heroLayer|heroImageOffset/);
  const journey = readFileSync(new URL("../components/GrowthJourney.tsx", import.meta.url), "utf8");
  assert.match(journey, /bloomArt: \{ width: GROWTH_BLOOM_ART_SIZE, height: GROWTH_BLOOM_ART_SIZE/);
});

test("Intención and its pill sit below the artwork, with description 15px away", () => {
  render();
  assert.equal(nodes.get("growth-stage-detail-scroll").contentContainerStyle.paddingTop, 80);
  const block = flat(nodes.get("growth-stage-detail-title-block").style);
  assert.equal(block.gap, 8);
  assert.equal(block.transform, undefined);
  const source = readFileSync(new URL("../components/GrowthStageDetail.tsx", import.meta.url), "utf8");
  assert.match(source, /copy: \{[^}]*marginTop: 15/);
});

test("the X stays fixed, stage labels are removed and Intención uses the app's Manrope font", () => {
  const html = render();
  const header = nodes.get("growth-stage-detail-fixed-header");
  assert.equal(flat(header.style).position, "absolute");
  assert.equal(flat(header.style).top, 0);
  assert.equal(flat(header.style).zIndex, 10);
  assert.equal(flat(header.style).alignItems, "center");
  const ids = (tree: any): string[] => React.Children.toArray(tree).flatMap(child => {
    if (!React.isValidElement(child)) return [];
    const props = (child as React.ReactElement<any>).props;
    return [...(props.testID ? [props.testID] : []), ...ids(props.children)];
  });
  assert.ok(ids(header.children).includes("growth-stage-detail-close"));
   assert.ok(!ids(header.children).includes("growth-stage-detail-header-label"));
  assert.ok(!ids(nodes.get("growth-stage-detail-scroll").children).includes("growth-stage-detail-close"));
  assert.ok(!ids(nodes.get("growth-stage-detail-scroll").children).includes("growth-stage-detail-header-label"));
   assert.doesNotMatch(html, /Primera etapa|Florecimiento/);
   const source = readFileSync(new URL("../components/GrowthStageDetail.tsx", import.meta.url), "utf8");
   assert.match(source, /stageName: \{\s*fontFamily: "Manrope"/);
});

test("the shared gradient preserves the original emotional screen overlay and handles short viewports", () => {
  assert.deepEqual(gradientHelpers.getMoodHeroGradient("#1B2342", 394), {
    colors: ["#1B234200", "#1B23424d", "#1B2342", "#1B2342"],
    locations: [0.3, 0.7, 1 - 55 / 394, 1],
  });
  const small = gradientHelpers.getMoodHeroGradient("#060A0F", 150).locations;
  assert.ok(small.every((value: number, index: number) => index === 0 || value >= small[index - 1]));
});