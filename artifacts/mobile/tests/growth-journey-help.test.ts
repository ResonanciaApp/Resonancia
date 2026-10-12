import assert from "node:assert/strict";
import { INITIAL_JOURNEY_INFO } from "../lib/journey-info-content.ts";
import { GROWTH_WORLD_TEMPLATES, INITIAL_GROWTH_WORLDS } from "../utils/growthWorlds.ts";
import { readFileSync } from "node:fs";
import { URL } from "node:url";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";
import { getThemeStyleId, SCENE_THEMES } from "../config/scene-themes.ts";
import { DURATION_SHEET_OPEN_BACKDROP_MS, DURATION_SHEET_OPEN_SPRING } from "../lib/ambiental-duration-opening.ts";
import { CLOUDY_GROWTH_STAGE_LABEL_COLOR, POSITIONED_DAY_GRADIENT } from "../constants/colors.ts";

function load(path: string, imports: Record<string, unknown>) {
  const compiled = ts.transpileModule(readFileSync(new URL(path, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true },
  }).outputText;
  const module = { exports: {} };
  new Function("require", "module", "exports", compiled)((name: string) => {
    assert.ok(name in imports, `Missing mock: ${name}`);
    return imports[name];
  }, module, module.exports);
  return module.exports as Record<string, any>;
}

function hooks() {
  const states: any[] = [];
  const refs: any[] = [];
  let stateIndex = 0;
  let refIndex = 0;
  return {
    reset: () => { stateIndex = 0; refIndex = 0; },
    react: {
      ...React,
      useState(initial: unknown) {
        const index = stateIndex++;
        if (!(index in states)) states[index] = initial;
        return [states[index], (next: any) => {
          states[index] = typeof next === "function" ? next(states[index]) : next;
        }];
      },
      useRef(initial: unknown) {
        const index = refIndex++;
        refs[index] ??= { current: initial };
        return refs[index];
      },
      useEffect: (effect: () => unknown) => effect(),
      useCallback: (callback: unknown) => callback,
      useMemo: (factory: () => unknown) => factory(),
    },
  };
}

const flatten = (style: any): Record<string, any> =>
  Array.isArray(style) ? Object.assign({}, ...style.map(flatten)) : style ?? {};

function uiHarness(themeId = "indigo") {
  const h = hooks();
  const presses = new Map<string, any>();
  const nodes = new Map<string, any>();
  const layouts: any[] = [];
  const springs: any[] = [];
  let modalClose = () => {};
  let pan: any;
  let motion: any;
  let helpProps: any;
  let detailProps: any;
  let explanationProps: any;
  const Native = (props: any) => {
    if (props.testID) nodes.set(props.testID, props);
    const style = flatten([props.style, props.contentContainerStyle]);
    if (props.onLayout) layouts.push(props.onLayout);
    return React.createElement("div", {
      "data-testid": props.testID,
      "data-height": style.height,
      "data-min-height": style.minHeight,
      "data-justify-content": style.justifyContent,
      "data-text-align": style.textAlign,
      "data-padding-top": style.paddingTop,
      "data-color": style.color,
      "data-background": style.backgroundColor,
      "data-pointer-events": props.pointerEvents,
    }, props.children);
  };
  const native = {
    View: Native, Text: Native, ScrollView: Native, Image: Native,
    Pressable: (props: any) => {
      if (props.testID) presses.set(props.testID, props);
      return React.createElement(Native, props);
    },
    Modal: (props: any) => { modalClose = props.onRequestClose; return React.createElement(Native, props); },
    Animated: {
      View: Native,
      spring: (_: any, options: any) => ({ start: () => springs.push(options) }),
    },
    PanResponder: { create: (handlers: any) => { pan = handlers; return { panHandlers: {} }; } },
    Platform: { OS: "ios" },
    useWindowDimensions: () => ({ width: 400, height: 800 }),
    StyleSheet: { create: (value: any) => value, absoluteFill: {} },
  };
  const imports = {
    react: h.react, "react-native": native,
     "@expo/vector-icons": {
       Feather: (props: any) => {
         if (props.testID) nodes.set(props.testID, props);
         return React.createElement("i", { "data-icon": props.name });
       },
       MaterialCommunityIcons: (props: any) => React.createElement("i", {
         "data-testid": props.testID, "data-icon": props.name, "data-color": props.color,
         "data-size": props.size, "data-shadow-color": props.style?.textShadowColor,
         "data-shadow-radius": props.style?.textShadowRadius,
         "data-opacity": props.style?.opacity,
       }),
     },
     "@react-native-masked-view/masked-view": { __esModule: true, default: Native },
    "expo-linear-gradient": { LinearGradient: Native },
    "react-native-safe-area-context": { useSafeAreaInsets: () => ({ top: 40, bottom: 20 }) },
    "@/context/SceneThemeContext": { useSceneTheme: () => ({ theme: { id: themeId, gradient: ["#060A0F", "#111122"] } }) },
    "@/config/scene-themes": { getThemeStyleId },
    "@/hooks/useColors": { useColors: () => ({ foreground: "#FBFBFB", accent: "#9ADAA9" }) },
    "@/hooks/useJourneyInfoContent": { useJourneyInfoContent: () => INITIAL_JOURNEY_INFO },
    "@/constants/colors": { NAVIGATION_HELP_ICON_COLOR: "#F9F9F9", MEMBERSHIP_AURORA: { premium: { accent: "#BE9650" } }, CLOUDY_GROWTH_STAGE_LABEL_COLOR, POSITIONED_DAY_GRADIENT },
    "@/components/GrowthJourney": { GrowthJourney: (props: any) => React.createElement(
      native.Pressable, { testID: "test-open-intention", onPress: () => props.onStagePress("intencion") }, "PRIMER MUNDO",
    ) },
    "@/components/GrowthStageDetail": { GrowthStageDetail: (props: any) => {
      detailProps = props;
      return React.createElement(Native, { testID: "growth-stage-detail" });
    } },
    "@/components/GrowthJourneyHelpSheet": { GrowthJourneyHelpSheet: (props: any) => {
      helpProps = props;
      return React.createElement("div", { "data-help-visible": String(props.visible) });
    } },
    "@/components/GrowthJourneyExplanationSheet": { GrowthJourneyExplanationSheet: (props: any) => {
      explanationProps = props;
      return React.createElement(Native, { testID: "growth-explanation-mock" });
    } },
    "@/components/GrowthJourneyMap": {
      GROWTH_MAP_HEIGHT: 350,
      GrowthJourneyMap: (props: any) => React.createElement(Native, { ...props, testID: "growth-journey-map" }),
    },
    "@/hooks/useGrowthJourneySheetMotion": {
      GROWTH_SHEET_SPRING: { tension: 55, friction: 8, useNativeDriver: true },
      useGrowthJourneySheetMotion: (visible: boolean) => {
        motion = { rendered: visible, sheetY: { value: 0, stopAnimation() {}, setValue(n: number) { this.value = n; } }, backdropOpacity: 0 };
        return motion;
      },
    },
  };
  return {
    ...h, imports, presses, nodes, layouts, springs,
    get pan() { return pan; }, get motion() { return motion; }, get help() { return helpProps; },
    get detail() { return detailProps; }, get explanation() { return explanationProps; },
    back: () => modalClose(),
  };
}

test("Tu camino centers a 13px two-line intro, lowers the whole journey another 60px, and keeps help accessible through the map icon", () => {
  const h = uiHarness();
  const { GrowthJourneySheet } = load("../components/GrowthJourneySheet.tsx", h.imports);
  let closes = 0;
  const render = (visible = true) => {
    h.reset();
    return renderToStaticMarkup(GrowthJourneySheet({ visible, onClose: () => closes++ }));
  };
  const html = render();
  const modal = h.nodes.get("growth-journey-modal");
  assert.equal(modal.visible, true);
  assert.equal(modal.transparent, false);
  assert.equal(modal.animationType, "slide");
  assert.equal(modal.statusBarTranslucent, true);
  assert.equal(modal.navigationBarTranslucent, true);
  const background = h.nodes.get("growth-journey-background");
  assert.equal(flatten(background.style).flex, 1);
  assert.deepEqual(background.colors, ["#060A0F", "#111122"]);
  const scroll = h.nodes.get("growth-journey-scroll");
  assert.equal(scroll.bounces, true);
  assert.equal(scroll.alwaysBounceVertical, true);
  assert.equal(scroll.overScrollMode, "always");
  assert.equal(scroll.contentInsetAdjustmentBehavior, "never");
  assert.equal(flatten(scroll.contentContainerStyle).paddingBottom, 52);
  assert.ok(html.indexOf('data-testid="growth-journey-close"') < html.indexOf("Tu camino"));
  assert.ok(html.indexOf("Tu camino") < html.indexOf('data-testid="growth-journey-help"'));
  assert.match(html, /data-testid="growth-journey-help-info" data-icon="map-outline" data-color="#F9F9F9"/);
  assert.equal(h.presses.get("growth-journey-help").style.backgroundColor, "rgba(0,0,0,0.16)");
  assert.doesNotMatch(html, /trending-up|Cada día de racha|descriptionDivider/);
  assert.doesNotMatch(html, /No florecemos/);
  const intro = h.nodes.get("growth-journey-intro");
  assert.equal(intro.numberOfLines, 2);
  assert.equal(intro.children, "Tu práctica diaria se transforma en crecimiento.\nAvanza por etapas y desbloquea nuevos avatares.");
  assert.equal(flatten(intro.style).lineHeight, 22);
  assert.equal(flatten(intro.style).fontSize, 13);
  assert.equal(flatten(intro.style).textAlign, "center");
  assert.equal(flatten(h.nodes.get("growth-journey-intro-space").style).paddingHorizontal, 20);
  assert.equal(flatten(h.nodes.get("growth-journey-intro-space").style).justifyContent, "center");
  assert.ok(html.indexOf("Tu camino") < html.indexOf(intro.children));
  assert.ok(html.indexOf(intro.children) < html.indexOf("PRIMER MUNDO"));
  assert.ok(html.indexOf("Tu camino") < html.indexOf("PRIMER MUNDO"));
  const infoIcon = html.match(/<i[^>]*data-testid="growth-journey-help-info"[^>]*>/)?.[0];
  assert.ok(infoIcon);
  assert.match(infoIcon, /data-size="24"/);
  assert.doesNotMatch(infoIcon, /data-opacity|data-shadow/);
  assert.doesNotMatch(html, /growth-journey-help-lotus|data-icon="spa"/);
  assert.equal(h.presses.get("growth-journey-help").style.opacity, undefined);
  assert.equal(h.presses.get("growth-journey-help").accessibilityLabel, "Información de Tu camino");
  assert.equal(h.presses.get("growth-journey-help").style.width, 43);
  assert.doesNotMatch(html, />\?</);
  assert.equal(flatten(h.nodes.get("growth-journey-intro-space").style).height, 183); // previous 123px plus 60px, including the centered intro
  assert.equal(h.help.onDescriptionLayout, undefined);
  render();
  assert.equal(flatten(h.nodes.get("growth-journey-intro-space").style).height, 183); // no coupling to map content
  h.presses.get("growth-journey-help").onPress();
  render();
  assert.equal(h.help.visible, true);
  h.back();
  render();
  assert.equal(h.help.visible, false);
  assert.equal(closes, 0);
  h.presses.get("growth-journey-close").onPress();
  assert.equal(closes, 1);
  h.presses.get("growth-journey-help").onPress();
  assert.equal(render(false), "");
  render();
  assert.equal(h.help.visible, false);
  const source = readFileSync(new URL("../components/GrowthJourneySheet.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(source, /useGrowthJourneySheetMotion|styles\.handle|styles\.sheet|styles\.backdrop/);
  assert.match(source, /start=\{theme\.gradientStart\}/);
  assert.match(source, /end=\{theme\.gradientEnd\}/);
  assert.match(source, /locations=\{theme\.gradientLocations/);
});

test("Intención opens inside the same Modal; close and back preserve Tu camino, with no detail help", () => {
  const h = uiHarness();
  const { GrowthJourneySheet } = load("../components/GrowthJourneySheet.tsx", h.imports);
  let closes = 0;
  const render = (visible = true) => {
    h.reset();
    return renderToStaticMarkup(GrowthJourneySheet({ visible, onClose: () => closes++ }));
  };
  assert.doesNotMatch(render(), /data-testid="growth-stage-detail"/);
  h.presses.get("test-open-intention").onPress();
  let html = render();
  assert.match(html, /data-testid="growth-stage-detail"/);
  assert.equal((html.match(/data-testid="growth-journey-modal"/g) ?? []).length, 1);
  assert.equal(h.nodes.get("growth-journey-scroll").pointerEvents, "none");
  assert.equal(h.nodes.get("growth-journey-scroll").accessibilityElementsHidden, true);
  assert.equal(h.help.visible, false);
  assert.equal(h.detail.onHelp, undefined);
  assert.equal(h.detail.stageId, "intencion");
  h.back();
  assert.doesNotMatch(render(), /data-testid="growth-stage-detail"/);
  assert.equal(closes, 0);
  h.presses.get("test-open-intention").onPress();
  render();
  h.detail.onClose();
  assert.doesNotMatch(render(), /data-testid="growth-stage-detail"/);
  h.back();
  assert.equal(closes, 1);
  h.presses.get("test-open-intention").onPress();
  render();
  render(false);
  assert.doesNotMatch(render(), /data-testid="growth-stage-detail"/);
});

test("Primer universo keeps themed colors, moves down 2px and shrinks 1pt without changing its universe label", () => {
  for (const [id, color] of [
    ["natural", "#E5FFDB"],
    ["cloudy", CLOUDY_GROWTH_STAGE_LABEL_COLOR],
    ["indigo", POSITIONED_DAY_GRADIENT[0]],
    ["pleyades", POSITIONED_DAY_GRADIENT[0]],
  ]) {
    const h = uiHarness(id);
    const { GrowthJourneyHelpSheet } = load("../components/GrowthJourneyHelpSheet.tsx", h.imports);
    renderToStaticMarkup(React.createElement(GrowthJourneyHelpSheet, { visible: true, onClose() {} }));
    const subtitle = h.nodes.get("growth-map-subtitle");
    const style = flatten(subtitle.style);
    assert.equal(subtitle.children, "PRIMER UNIVERSO");
    assert.equal(style.fontFamily, "Manrope");
    assert.equal(style.fontSize, 10);
    assert.equal(style.top, 45);
    assert.equal(style.fontWeight, "700");
    assert.equal(style.letterSpacing, 1.2);
    assert.equal(style.color, color);
    assert.equal(style.textAlign, "center");
  }
});

test("the map replaces the old help icon and paragraph, fits its sheet and dismisses by tap or drag", () => {
  const h = uiHarness();
  const { GrowthJourneyHelpSheet } = load("../components/GrowthJourneyHelpSheet.tsx", h.imports);
  let closes = 0;
  const render = (visible: boolean) => {
    h.reset();
    return renderToStaticMarkup(GrowthJourneyHelpSheet({
      visible, onClose: () => closes++,
    }));
  };
  const html = render(true);
  assert.match(html, /data-testid="growth-help-sheet" data-height="553"/);
  // Header, map, gap and safe-area padding leave exactly 10px of the panel visible.
  assert.equal(553 - 44 - 56 - 45 - 350 - 28 - 20, 10);
  assert.match(html, /data-testid="growth-journey-map"/);
  assert.equal(h.nodes.get("growth-journey-map").width, 388);
  assert.equal(h.nodes.get("growth-map-title").children, "El recorrido");
  assert.equal(h.nodes.get("growth-map-subtitle").children, "PRIMER UNIVERSO");
  // The old black explanation box no longer lives in the map scroll.
  assert.doesNotMatch(html, /data-testid="growth-map-explanation"/);
  assert.equal(h.explanation.title, INITIAL_JOURNEY_INFO.title);
  assert.equal(h.explanation.description, INITIAL_JOURNEY_INFO.description);
  assert.equal(h.explanation.visible, false);
  assert.equal(flatten(h.nodes.get("growth-map-section").style).paddingTop, 45);
  const header = flatten(h.nodes.get("growth-map-header").style);
  const title = flatten(h.nodes.get("growth-map-title").style);
  const close = flatten(h.nodes.get("growth-help-close").style);
  // Same title position (44 + 16); map moves down 10pt from its previous 135pt.
  assert.equal(44 + title.top, 60);
  assert.equal(44 + header.height + 45, 145);
  assert.equal(title.top + title.lineHeight / 2, close.top + close.height / 2);
  assert.equal(close.width, 43);
  assert.equal(close.height, 43);
  assert.equal(close.left, 20);
  assert.equal(close.right, undefined);
  assert.equal(close.backgroundColor, "rgba(0,0,0,0.16)");
  assert.equal(h.nodes.get("growth-help-close-icon").name, "x");
  assert.equal(h.nodes.get("growth-help-close-icon").size, 22);
  assert.equal(flatten(h.nodes.get("growth-map-scroll").contentContainerStyle).justifyContent, "flex-start");
  assert.doesNotMatch(html, /trending-up|Cada día de racha lograda|florecimiento espiritual/);
  assert.equal(h.layouts.length, 0);
  assert.equal(h.pan.onMoveShouldSetPanResponder(null, { dx: 30, dy: 10 }), false);
  assert.equal(h.pan.onMoveShouldSetPanResponder(null, { dx: 0, dy: 20 }), true);
  h.pan.onPanResponderMove(null, { dy: 32 });
  assert.equal(h.motion.sheetY.value, 32);
  h.pan.onPanResponderRelease(null, { dy: 32, vy: 0 });
  assert.equal(closes, 0);
  assert.deepEqual(h.springs[0], { toValue: 0, tension: 55, friction: 8, useNativeDriver: true });
  h.pan.onPanResponderRelease(null, { dy: 90, vy: 0 });
  h.presses.get("growth-help-handle").onPress();
  h.presses.get("growth-help-backdrop").onPress();
  assert.equal(closes, 3);
  h.presses.get("growth-help-close").onPress();
  assert.equal(closes, 4);
  assert.match(render(false), /data-pointer-events="none"/);
  const source = readFileSync(new URL("../components/GrowthJourneyHelpSheet.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(source, /<Modal/);
});

test("the map preserves its circle, overlays and first-only access while using independent world metadata", () => {
  const h = uiHarness();
  const labels = GROWTH_WORLD_TEMPLATES.map(w => w.name);
  const ids = ["floracion", "ascenso", "iluminacion", "llegada", "despertar"];
  const finalPhase = { id: "editorial-final", group: "florecimiento", name: "Final", image: "final.webp" };
  const worlds = GROWTH_WORLD_TEMPLATES.map(w => ({ ...w }));
  worlds[0].coverUrl = "editorial-world-cover.webp";
  let levels = [
    { id: "intencion", group: "florecimiento", image: "start.webp" },
    finalPhase,
    { id: "ascenso-final", group: "ascenso", image: "ascent.webp" },
  ];
  const paths: any[] = [];
  const Node = h.imports["react-native"].View;
  const { GrowthJourneyMap, GROWTH_MAP_HEIGHT } = load("../components/GrowthJourneyMap.tsx", {
    ...h.imports,
    "react-native-svg": { __esModule: true, default: Node, Path: (props: any) => { paths.push(props); return React.createElement(Node, props); } },
    "@/components/GrowthJourney": {
      GrowthLevelImage: (props: any) => React.createElement(Node, { ...props, testID: "map-final-phase-art" }),
      RewardLock: (props: any) => React.createElement(Node, { ...props, testID: `${props.levelId}-reward-lock` }),
    },
    "../assets/images/growth/08-expansion.png": 5,
    "../assets/images/growth/map-ascenso.webp": 1,
    "../assets/images/growth/map-iluminacion.webp": 2,
    "../assets/images/growth/map-llegada.webp": 3,
    "../assets/images/growth/map-despertar.webp": 4,
    "@/context/GrowthContext": { useGrowth: () => ({ worlds, levels }) },
    "@/utils/growthWorlds": { GROWTH_WORLD_TEMPLATES, INITIAL_GROWTH_WORLDS },
    "@/lib/avatar": { resolveAvatarUrl: (url: string) => url },
  });
  assert.equal(GROWTH_MAP_HEIGHT, 350);
  for (const width of [308, 363, 390, 508]) {
    h.nodes.clear();
    paths.length = 0;
    const html = renderToStaticMarkup(React.createElement(GrowthJourneyMap, { width }));
    for (let i = 0; i < ids.length; i++) {
      const node = h.nodes.get(`growth-map-stop-${ids[i]}`);
      assert.equal(node.accessibilityState.disabled, i !== 0);
      assert.equal(node.accessibilityState.selected, i === 0);
      assert.match(node.accessibilityLabel, new RegExp(`${i + 1}\\. ${labels[i]}`));
      const style = flatten(node.style);
      const iconStyle = flatten(h.nodes.get(`growth-map-node-${ids[i]}`).style);
      assert.equal(iconStyle.borderWidth, 0);
      assert.equal(iconStyle.height, i === 0 ? 93 : 52);
      assert.equal(iconStyle.width, i === 0 ? 93 : 52);
      assert.equal(flatten(h.nodes.get(`growth-map-label-${ids[i]}`).style).fontSize, i === 0 ? 16 : 11);
      if (i === 0) {
        assert.equal(style.width, 164, "Florecimiento has enough width without moving the circular route");
        assert.equal(style.left + style.width / 2, width / 2, "active title and artwork remain centered");
        const world = h.nodes.get("growth-map-world-floracion");
        assert.equal(world.children, "PRIMER MUNDO");
        assert.equal(flatten(world.style).textAlign, "center");
        assert.equal(flatten(world.style).fontSize, 10);
        assert.equal(flatten(world.style).fontWeight, "700");
        assert.equal(flatten(world.style).color, POSITIONED_DAY_GRADIENT[0]);
        assert.ok(html.indexOf(labels[0]) < html.indexOf(">PRIMER MUNDO<"));
        assert.equal(flatten(h.nodes.get(`growth-map-label-${ids[i]}`).style).lineHeight, 20);
        assert.match(node.accessibilityLabel, /Primer mundo/);
      }
      if (i) {
        assert.equal(iconStyle.backgroundColor, "transparent");
        assert.equal(h.nodes.get(`growth-map-${ids[i]}-reward-lock`).color, "#F9F9F9");
        assert.equal(h.nodes.get(`growth-map-${ids[i]}-reward-lock`).size, 16);
        const image = h.nodes.get(`growth-map-image-${ids[i]}`);
        const overlay = h.nodes.get(`growth-map-image-overlay-${ids[i]}`);
        assert.equal(image.source, i);
        assert.equal(image.resizeMode, "cover");
        assert.equal(flatten(overlay.style).backgroundColor, "rgba(0,0,0,0.4)");
        assert.equal(overlay.pointerEvents, "none");
        const frame = flatten(h.nodes.get(`growth-map-image-frame-${ids[i]}`).style);
        assert.equal(frame.width, 48);
        assert.equal(frame.height, 48);
        assert.equal(frame.overflow, "hidden");
        assert.ok(readFileSync(new URL(`../assets/images/growth/map-${ids[i]}.webp`, import.meta.url)).byteLength < 100_000);
      }
      assert.ok(style.left >= 0 && style.left + style.width <= width);
      assert.ok(style.top >= 0 && style.top + (i === 0 ? 93 : 52) + 38 <= GROWTH_MAP_HEIGHT);
      if (i) assert.ok(html.indexOf(labels[i - 1]) < html.indexOf(labels[i]));
    }
    assert.equal(h.nodes.get("map-final-phase-art").level.image, worlds[0].coverUrl);
    assert.equal(h.nodes.get("map-final-phase-art").size, 89);
    assert.equal(h.nodes.get("growth-journey-map-route").pointerEvents, "none");
    assert.equal(paths.length, 1);
    assert.equal(paths[0].strokeDasharray, "2 8");
    const circle = { cx: width / 2, cy: GROWTH_MAP_HEIGHT / 2, r: Math.min(width / 2 - 56, 120) + 5 };
    const points = ids.map((id, i) => {
      const style = flatten(h.nodes.get(`growth-map-stop-${id}`).style);
      return { x: style.left + style.width / 2, y: style.top + (i === 0 ? 93 : 52) / 2 };
    });
    for (let i = 0; i < points.length; i++) {
      const point = points[i], next = points[(i + 1) % points.length];
      assert.ok(Math.abs(Math.hypot(point.x - circle.cx, point.y - circle.cy) - circle.r) < 1e-9);
      assert.ok(Math.abs(Math.hypot(next.x - point.x, next.y - point.y) - 2 * circle.r * Math.sin(Math.PI / 5)) < 1e-9);
    }
    const segments = paths[0].d.match(/[MA][^MA]+/g);
    assert.equal(segments.length, 5); // One start and four arcs, never a fifth closing arc.
    assert.doesNotMatch(paths[0].d, /[Zz]/);
    for (let i = 0; i < segments.length; i++) {
      const numbers = segments[i].slice(1).trim().split(/[ ,]+/).map(Number);
      if (i) assert.deepEqual(numbers.slice(0, 5), [circle.r, circle.r, 0, 0, 1]);
      assert.ok(Math.abs(numbers.at(-2) - points[i].x) < 1e-9);
      assert.ok(Math.abs(numbers.at(-1) - points[i].y) < 1e-9);
    }
  }
  levels = [];
  renderToStaticMarkup(React.createElement(GrowthJourneyMap, { width: 343 }));
  assert.equal(h.nodes.get("map-final-phase-art").level.image, worlds[0].coverUrl);
  worlds[0].name = "Un mundo editorial";
  worlds[0].coverUrl = "/objects/independent-cover";
  worlds[1].name = "Ascenso editado";
  worlds[1].coverUrl = "/objects/second-cover";
  renderToStaticMarkup(React.createElement(GrowthJourneyMap, { width: 343 }));
  assert.equal(h.nodes.get("growth-map-label-floracion").children, "Un mundo editorial");
  assert.equal(h.nodes.get("map-final-phase-art").level.image, "/objects/independent-cover");
  assert.equal(h.nodes.get("growth-map-label-ascenso").children, "Ascenso editado");
  assert.deepEqual(h.nodes.get("growth-map-image-ascenso").source, { uri: "/objects/second-cover" });
  worlds.splice(1, 1);
  const partialHtml = renderToStaticMarkup(React.createElement(GrowthJourneyMap, { width: 343 }));
  const stopIds = [...partialHtml.matchAll(/data-testid="growth-map-stop-([^"]+)"/g)].map(match => match[1]);
  assert.equal(stopIds.length, 5);
  assert.equal(new Set(stopIds).size, 5, "a partial catalog must not duplicate fallback stops");
  for (const [id, color] of [
    ["natural", "#E5FFDB"],
    ["cloudy", CLOUDY_GROWTH_STAGE_LABEL_COLOR],
    ["indigo2", POSITIONED_DAY_GRADIENT[0]],
    ["pleyades", POSITIONED_DAY_GRADIENT[0]],
  ]) {
    h.imports["@/context/SceneThemeContext"].useSceneTheme = () => ({
      theme: { id, gradient: ["#060A0F", "#111122"] },
    });
    renderToStaticMarkup(React.createElement(GrowthJourneyMap, { width: 388 }));
    const world = flatten(h.nodes.get("growth-map-world-floracion").style);
    assert.equal(world.color, color, `${id} uses Tu camino's world label color, not the generic accent`);
    assert.equal(world.fontSize, 10);
  }
});

test("the help overlay retains its original spring entrance, backdrop fade and animated exit", () => {
  const h = hooks();
  const animations: any[] = [];
  const animation = (kind: string, value: any, options: any) => {
    animations.push({ kind, options });
    return { start() {}, stop() {} };
  };
  const { useGrowthJourneySheetMotion } = load("../hooks/useGrowthJourneySheetMotion.ts", {
    react: h.react,
    "react-native": { Animated: {
      Value: class { constructor(public value: number) {} stopAnimation() {} setValue(n: number) { this.value = n; } },
      spring: (value: any, options: any) => animation("spring", value, options),
      timing: (value: any, options: any) => animation("timing", value, options),
      parallel: () => ({ start(callback?: any) { callback?.({ finished: true }); }, stop() {} }),
    } },
  });
  const oldFrame = globalThis.requestAnimationFrame;
  const oldCancel = globalThis.cancelAnimationFrame;
  globalThis.requestAnimationFrame = callback => { callback(0); return 1; };
  globalThis.cancelAnimationFrame = () => {};
  try {
    h.reset();
    useGrowthJourneySheetMotion(true, 400);
    h.reset();
    useGrowthJourneySheetMotion(false, 400);
    assert.deepEqual(animations, [
      { kind: "spring", options: { toValue: 0, tension: 55, friction: 8, useNativeDriver: true } },
      { kind: "timing", options: { toValue: 0.62, duration: 500, useNativeDriver: true } },
      { kind: "timing", options: { toValue: 480, duration: 500, useNativeDriver: true } },
      { kind: "timing", options: { toValue: 0, duration: 460, useNativeDriver: true } },
    ]);
  } finally {
    globalThis.requestAnimationFrame = oldFrame;
    globalThis.cancelAnimationFrame = oldCancel;
  }
});

test("El recorrido header has a right-aligned 43px ? button that opens the explanation in-tree", () => {
  const h = uiHarness();
  const { GrowthJourneyHelpSheet } = load("../components/GrowthJourneyHelpSheet.tsx", h.imports);
  let opens = 0; let closes = 0;
  const render = (props: any) => { h.reset(); return renderToStaticMarkup(GrowthJourneyHelpSheet({ onClose() {}, ...props })); };
  render({ visible: true, onOpenExplanation: () => opens++, onCloseExplanation: () => closes++ });
  const info = flatten(h.nodes.get("growth-help-explanation-open").style);
  const close = flatten(h.nodes.get("growth-help-close").style);
  const title = flatten(h.nodes.get("growth-map-title").style);
  assert.deepEqual([info.width, info.height, info.borderRadius, info.right, info.left], [43, 43, 21.5, 20, undefined]);
  assert.equal(info.top, close.top);
  assert.equal(info.backgroundColor, close.backgroundColor);
  assert.equal(title.top + title.lineHeight / 2, info.top + info.height / 2);
  assert.equal(h.nodes.get("growth-help-explanation-open-icon").children, "?");
  h.presses.get("growth-help-explanation-open").onPress();
  assert.equal(opens, 1);
  render({ visible: true, explanationVisible: true, onCloseExplanation: () => closes++ });
  assert.equal(h.explanation.visible, true);
  assert.equal(h.nodes.get("growth-help-sheet").importantForAccessibility, "no-hide-descendants");
  assert.equal(h.pan.onMoveShouldSetPanResponder(null, { dx: 0, dy: 20 }), false, "map drag disabled under explanation");
  h.explanation.onClose();
  assert.equal(closes, 1);
  render({ visible: false, explanationVisible: true });
  assert.equal(h.explanation.visible, false, "explanation never shows without the map");
  const source = readFileSync(new URL("../components/GrowthJourneyExplanationSheet.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(source, /<Modal/);
});

test("Android back closes explanation first, then the map; outer close clears explanation", () => {
  const h = uiHarness();
  const { GrowthJourneySheet } = load("../components/GrowthJourneySheet.tsx", h.imports);
  let outer = 0;
  const render = (visible = true) => { h.reset(); renderToStaticMarkup(GrowthJourneySheet({ visible, onClose: () => outer++ })); };
  render();
  h.presses.get("growth-journey-help").onPress();
  render();
  h.help.onOpenExplanation();
  render();
  assert.equal(h.help.explanationVisible, true);
  h.back(); render();
  assert.equal(h.help.explanationVisible, false);
  assert.equal(h.help.visible, true, "map remains behind");
  h.help.onOpenExplanation(); render();
  h.help.onClose(); render();
  assert.equal(h.help.visible, false);
  h.presses.get("growth-journey-help").onPress(); render();
  assert.equal(h.help.explanationVisible, false, "reopen starts on the map");
  h.help.onOpenExplanation(); render(false); render(true);
  h.presses.get("growth-journey-help").onPress(); render();
  assert.equal(h.help.explanationVisible, false, "outer close clears explanation");
  assert.equal(outer, 0);
});

function explanationHarness(themeId: string, description: string) {
  const h = uiHarness(themeId);
  const theme = (SCENE_THEMES as any)[themeId];
  h.imports["@/context/SceneThemeContext"].useSceneTheme = () => ({ theme });
  Object.assign(h.imports, {
    "@/config/scene-themes": { getThemeStyleId, SCENE_THEMES },
    "@/hooks/useJourneyExplanationSheetMotion": {
      JOURNEY_EXPLANATION_SHEET_HEIGHT: 320,
      useJourneyExplanationSheetMotion: (visible: boolean) => ({ rendered: visible, sheetY: 0, backdropOpacity: 0 }),
    },
  });
  const { GrowthJourneyExplanationSheet } = load("../components/GrowthJourneyExplanationSheet.tsx", h.imports);
  let closes = 0;
  h.reset();
  const html = renderToStaticMarkup(GrowthJourneyExplanationSheet({
    visible: true, onClose: () => closes++, title: "Título editorial", description,
  }));
  return { h, theme, html, closes: () => closes };
}

test("explanation sheet: editorial data, scrollable long text, no black box, 320px, ambiental colors", () => {
  const long = Array.from({ length: 30 }, (_, i) => `Párrafo editorial ${i} con texto largo.`).join("\n\n");
  for (const id of Object.keys(SCENE_THEMES)) {
    const { h, theme, html, closes } = explanationHarness(id, long);
    const style = getThemeStyleId(id as any);
    const expected = style === "cloudy" ? theme.gradient.slice(0, 4)
      : style === "indigo2" ? [SCENE_THEMES.tibet.gradient[1], SCENE_THEMES.tibet.gradient[2]]
      : [theme.gradient[1], theme.gradient[2]];
    assert.deepEqual(h.nodes.get("growth-explanation-gradient").colors, expected, id);
    const sheet = flatten(h.nodes.get("growth-explanation-sheet").style);
    assert.equal(sheet.height, 320);
    assert.equal(sheet.backgroundColor, expected[0]);
    assert.equal(sheet.borderTopLeftRadius, 28);
    assert.equal(h.nodes.get("growth-map-explanation-title").children, "Título editorial");
    assert.match(html, /Párrafo editorial 29/);
    assert.ok(h.nodes.has("growth-map-explanation-paragraph-29"));
    assert.ok(h.nodes.has("growth-explanation-scroll"), "description is scrollable");
    assert.doesNotMatch(html, /rgba\(0,0,0,0\.1[69]\)" data-pointer-events="undefined"><div data-testid="growth-map-explanation-title/);
    assert.equal(h.nodes.has("growth-map-explanation"), false, "no black content box");
    h.presses.get("growth-explanation-close").onPress();
    h.presses.get("growth-explanation-backdrop").onPress();
    assert.equal(closes(), 2);
  }
});

test("explanation motion reuses ambiental opening constants, closes with timing and drops stale completions", () => {
  const h = hooks();
  const animations: any[] = [];
  const pending: any[] = [];
  const frames: any[] = [];
  const { useJourneyExplanationSheetMotion } = load("../hooks/useJourneyExplanationSheetMotion.ts", {
    react: { ...h.react, useEffect: (effect: () => any) => { cleanups.push(effect()); } },
    "@/lib/ambiental-duration-opening": { DURATION_SHEET_OPEN_SPRING, DURATION_SHEET_OPEN_BACKDROP_MS },
    "react-native": { Animated: {
      Value: class { constructor(public value: number) {} stopAnimation() {} setValue(n: number) { this.value = n; } },
      spring: (_: any, options: any) => { animations.push({ kind: "spring", options }); return {}; },
      timing: (_: any, options: any) => { animations.push({ kind: "timing", options }); return {}; },
      parallel: () => ({ start(cb?: any) { if (cb) pending.push(cb); } }),
    } },
  });
  const cleanups: any[] = [];
  const oldFrame = globalThis.requestAnimationFrame; const oldCancel = globalThis.cancelAnimationFrame;
  globalThis.requestAnimationFrame = (cb: any) => { frames.push(cb); return frames.length; };
  globalThis.cancelAnimationFrame = (n: number) => { frames[n - 1] = null; };
  try {
    const run = (v: boolean) => { cleanups.splice(0).forEach(c => c?.()); h.reset(); return useJourneyExplanationSheetMotion(v); };
    run(true);
    frames.splice(0).forEach(f => f?.(0));
    run(false);
    assert.deepEqual(animations, [
      { kind: "spring", options: { toValue: 0, ...DURATION_SHEET_OPEN_SPRING, useNativeDriver: true } },
      { kind: "timing", options: { toValue: 0.62, duration: DURATION_SHEET_OPEN_BACKDROP_MS, useNativeDriver: true } },
      { kind: "timing", options: { toValue: 400, duration: 500, useNativeDriver: true } },
      { kind: "timing", options: { toValue: 0, duration: 460, useNativeDriver: true } },
    ]);
    const staleClose = pending.pop();
    run(true); // reopen interrupts close
    staleClose({ finished: true });
    h.reset();
    assert.equal(useJourneyExplanationSheetMotion(true).rendered, true, "stale close must not unmount");
    // Open frame scheduled before a close must not start the spring.
    const before = animations.length;
    run(false);
    frames.splice(0).forEach(f => f?.(0));
    assert.equal(animations.slice(before).some(a => a.kind === "spring"), false);
    pending.pop()({ finished: true });
    h.reset();
    assert.equal(useJourneyExplanationSheetMotion(false).rendered, false);
  } finally {
    globalThis.requestAnimationFrame = oldFrame; globalThis.cancelAnimationFrame = oldCancel;
  }
});
