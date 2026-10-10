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
const editorial = load("../lib/growth-editorial.ts", (name) => { throw new Error(`Unexpected editorial import ${name}`); });
let levels = growthLevels;
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
    "@/components/GrowthJourney": { GROWTH_BLOOM_ART_SIZE: 137, GROWTH_STAGE_ICON_SIZE: 133, GrowthLevelImage: (props: any) => React.createElement(Native, { ...props, testID: "growth-detail-hero-artwork" }) },
    "@/lib/growth-editorial": editorial,
    "@/constants/colors": constants,
    "@/utils/moodHeroGradient": gradientHelpers,
    "../assets/images/growth/00-intencion-profile-square.png": (() => {
      assets.push("../assets/images/growth/00-intencion-profile-square.png");
      return assets.length;
    })(),
    "@/context/SceneThemeContext": { useSceneTheme: () => ({ theme: { gradient: colors, gradientLocations: locations, gradientStart: { x: 0, y: 0 }, gradientEnd: { x: 0, y: 1 } } }) },
    "@/data/growthLevels": { growthLevels },
    "@/context/GrowthContext": { useGrowth: () => ({ levels }) },
  };
  assert.ok(name in imports, `Missing detail mock: ${name}`);
  return imports[name];
});
const render = (props: Record<string, unknown> = {}) => {
  nodes.clear(); presses.clear();
  return renderToStaticMarkup(React.createElement(GrowthStageDetail, { stageId: "intencion", onClose() {}, ...props }));
};

test("every stage uses its own editorial detail, current title and range, including new ascenso stages", () => {
  const newStage = {
    id: "custom-stage", group: "ascenso", name: "Claridad", startDay: 450, endDay: 480,
    story: "Solo en recorrido", image: "https://example.test/stage.png",
    detailPhrase: "Frase editorial", detailDescription: "Descripción editorial\ncon más líneas.",
  };
  levels = [...growthLevels, newStage];
  try {
    const html = render({ stageId: newStage.id });
    assert.match(html, /Claridad/);
    assert.doesNotMatch(html, /450–480 días|data-icon="spa"/);
    assert.match(html, /Frase editorial/);
    assert.match(html, /Descripción editorial/);
    assert.doesNotMatch(html, /Solo en recorrido|Antes del primer día|Intención/);
    assert.equal(nodes.get("growth-detail-hero-artwork").size, 266);
    assert.equal(nodes.get("growth-detail-hero-artwork").level.image, newStage.image);
    newStage.name = "Presencia";
    newStage.endDay = 490;
    newStage.detailPhrase = "Nueva frase";
    assert.match(render({ stageId: newStage.id }), /Presencia[\s\S]*Nueva frase/);
  } finally { levels = growthLevels; }
});

test("deleted editorial text stays deleted, without a divider or legacy fallback", () => {
  levels = [{ ...growthLevels[0], detailPhrase: "", detailDescription: "" }];
  try {
    const html = render();
    assert.doesNotMatch(html, /Antes del primer día/);
    assert.equal(editorial.growthDetailCopy(levels[0]).phrase, "");
    const copy = nodes.get("growth-stage-detail-scroll").children.props.children.props.children;
    assert.deepEqual(copy, [false, false]);
    levels = [{ ...growthLevels[0], detailPhrase: "Solo frase", detailDescription: "" }];
    const phraseOnly = render();
    assert.match(phraseOnly, /Solo frase/);
    const copyWithPhrase = nodes.get("growth-stage-detail-scroll").children.props.children.props.children;
    assert.equal(copyWithPhrase[0].props.testID, "growth-stage-detail-phrase");
    assert.equal(copyWithPhrase[1], false);
  } finally { levels = growthLevels; }
});

test("a removed stage is never replaced with another stage", () => {
  assert.equal(render({ stageId: "removed-stage" }), "");
});

test("offline legacy detail adopts once and never invents a long description for other stages", () => {
  assert.equal(editorial.growthDetailCopy(growthLevels[0]).phrase, growthLevels[0].story);
  assert.match(editorial.growthDetailCopy(growthLevels[0]).description, /Antes del primer día/);
  for (const level of growthLevels.slice(1)) {
    const copy = editorial.growthDetailCopy(level);
    assert.equal(copy.phrase, level.story);
    assert.equal(copy.description, "");
  }
});

test("Intención detail uses its actual hero and canonical story, without the day pill", () => {
  const html = render();
  assert.match(html, /Intención/);
  assert.doesNotMatch(html, />0 días</);
  assert.ok(html.includes(growthLevels[0].story));
  assert.doesNotMatch(html, /Semilla|1.?7 días|avatares|sin sello/);
  assert.equal(nodes.get("growth-detail-hero-artwork").level, growthLevels[0]);
  assert.equal(nodes.get("growth-detail-hero-artwork").sourceModule, undefined, "uses the same stage image as Tu camino");
  assert.equal(nodes.get("growth-detail-hero-artwork").size, 137 * 2);
  assert.match(html, /data-font="CormorantGaramond"/);
  assert.doesNotMatch(html, /PRIMERA ETAPA|Elegir comenzar|growth-stage-detail-help/);
  assert.equal((html.match(/data-icon="spa"/g) ?? []).length, 0, "the removed day pill includes its lotus");
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
        assert.equal(flat(nodes.get("growth-stage-detail-fixed-art").style).top, Math.max(inset, 40) + 83);
        assert.equal(nodes.get("growth-stage-detail-scroll").contentContainerStyle.paddingTop, Math.max(inset, 40) + 83 + 274 + 16);
      assert.match(html, new RegExp(`data-top-padding="${Math.max(inset, 40) + 21}"`));
      const titleCenter = flat(nodes.get("growth-stage-detail-fixed-art").style).top - 20 - 41 / 2;
      const closeCenter = flat(nodes.get("growth-stage-detail-fixed-header").style).paddingTop + 43 / 2;
      assert.equal(closeCenter, titleCenter, "X and its background align with the title");
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
  assert.match(render(), /data-top-padding="88"/);
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
  assert.equal((html.match(/data-colors=/g) ?? []).length, 2, "one theme gradient plus the alpha mask, not a second background");
  assert.equal(nodes.get("growth-stage-detail").colors, colors);
  assert.equal(nodes.get("growth-stage-detail").locations, locations);
  assert.equal(flat(nodes.get("growth-stage-detail-fixed-art").style).backgroundColor, undefined);
  assert.ok(html.indexOf('data-testid="growth-detail-hero-artwork"') < html.indexOf('data-testid="growth-stage-detail-scroll"'));
  const source = readFileSync(new URL("../components/GrowthStageDetail.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(source, /FULL_HERO_IMAGE|getMoodHeroGradient|heroBackground|heroLayer|heroImageOffset/);
  const journey = readFileSync(new URL("../components/GrowthJourney.tsx", import.meta.url), "utf8");
  assert.match(journey, /bloomArt: \{ width: GROWTH_BLOOM_ART_SIZE, height: GROWTH_BLOOM_ART_SIZE/);
});

test("title and artwork are lowered another seven pixels with a twenty-pixel gap", () => {
  render();
  assert.equal(nodes.get("growth-stage-detail-scroll").contentContainerStyle.paddingTop, 413);
  const block = flat(nodes.get("growth-stage-detail-title-block").style);
  assert.equal(block.gap, 8);
  assert.equal(block.transform, undefined);
  const art = nodes.get("growth-stage-detail-fixed-art");
  const anchor = flat((React.Children.toArray(art.children)[0] as React.ReactElement<{ style: unknown }>).props.style);
  assert.equal(anchor.position, "absolute");
  assert.equal(anchor.bottom, 274 + 20);
  assert.equal(flat(art.style).top, 123);
  assert.ok(!JSON.stringify(nodes.get("growth-stage-detail-scroll").children).includes("growth-stage-detail-title-block"));
  const source = readFileSync(new URL("../components/GrowthStageDetail.tsx", import.meta.url), "utf8");
  assert.match(source, /copy: \{[^}]*marginTop: 0/);
  assert.match(source, /stageName: \{[^}]*fontSize: 28,\s*lineHeight: 41/);
  assert.doesNotMatch(source, /styles\.rule|\brule:|MEMBERSHIP_AURORA/);
});

test("golden line is removed while editorial phrase and long description remain", () => {
  for (const detailDescription of ["", "Descripción larga"]) {
    levels = [{ ...growthLevels[0], detailPhrase: "Frase editorial", detailDescription }];
    try {
      const html = render();
      assert.equal(nodes.has("growth-stage-detail-rule"), false);
      assert.ok(html.indexOf('data-testid="growth-stage-detail-title-block"') < html.indexOf('data-testid="growth-detail-hero-artwork"'));
      assert.ok(html.indexOf('data-testid="growth-detail-hero-artwork"') < html.indexOf('data-testid="growth-stage-detail-phrase"'));
      assert.match(html, /Frase editorial/);
      if (detailDescription) assert.ok(html.includes(detailDescription));
    } finally { levels = growthLevels; }
  }
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
   assert.match(source, /stageName: \{\s*fontFamily: "Manrope",\s*fontWeight: "700"/);
});

test("artwork is static outside scrolling content and no day pill remains", () => {
  render();
  const art = nodes.get("growth-stage-detail-fixed-art");
  assert.equal(flat(art.style).position, "absolute");
  assert.equal(art.pointerEvents, "none");
  assert.equal(nodes.has("growth-stage-detail-hero-image"), false, "no entrance or scroll animation on artwork");
  const scrollChildren = React.Children.toArray(nodes.get("growth-stage-detail-scroll").children) as React.ReactElement<any>[];
  assert.ok(scrollChildren.every(child => child.props.replayKey !== "hero"));
  const source = readFileSync(new URL("../components/GrowthStageDetail.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(source, /dayPill|dayLabel|styles\.days|MaterialCommunityIcons/);
});

test("a fixed alpha mask progressively hides content as it scrolls into the image, without tinting the background", () => {
  for (const viewportHeight of [812, 874, 1024]) {
    height = viewportHeight;
    render();
    const fade = nodes.get("growth-stage-detail-scroll-fade");
    assert.equal(nodes.get("growth-stage-detail-scroll").contentContainerStyle.minHeight, height + 274, "even short descriptions can scroll up towards the image");
    assert.deepEqual(fade.colors, ["transparent", "transparent", "#000000", "#000000"]);
    assert.deepEqual(fade.locations, [0, (397 - 48) / height, (397 + 8) / height, 1]);
    assert.equal(fade.pointerEvents, "none");
    assert.equal(flat(fade.style).position, "absolute");
    const mask = nodes.get("growth-stage-detail-content-mask");
    assert.equal(mask.maskElement.props.testID, "growth-stage-detail-scroll-fade");
    const children = React.Children.toArray(mask.children) as React.ReactElement<any>[];
    assert.ok(children.some(child => child.props.testID === "growth-stage-detail-scroll"));
    assert.ok(children.every(child => child.props.testID !== "growth-stage-detail-fixed-art"));
  }
  height = 812;
});

test("the shared gradient preserves the original emotional screen overlay and handles short viewports", () => {
  assert.deepEqual(gradientHelpers.getMoodHeroGradient("#1B2342", 394), {
    colors: ["#1B234200", "#1B23424d", "#1B2342", "#1B2342"],
    locations: [0.3, 0.7, 1 - 55 / 394, 1],
  });
  const small = gradientHelpers.getMoodHeroGradient("#060A0F", 150).locations;
  assert.ok(small.every((value: number, index: number) => index === 0 || value >= small[index - 1]));
});