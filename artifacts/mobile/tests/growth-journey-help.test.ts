import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { URL } from "node:url";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

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

function uiHarness() {
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
    View: Native, Text: Native, ScrollView: Native,
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
       Feather: (props: any) => React.createElement("i", { "data-icon": props.name }),
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
    "@/context/SceneThemeContext": { useSceneTheme: () => ({ theme: { gradient: ["#060A0F", "#111122"] } }) },
    "@/hooks/useColors": { useColors: () => ({ foreground: "#FBFBFB" }) },
    "@/constants/colors": { NAVIGATION_HELP_ICON_COLOR: "#F9F9F9", MEMBERSHIP_AURORA: { premium: { accent: "#BE9650" } } },
    "@/components/GrowthJourney": { GrowthJourney: (props: any) => React.createElement(
      native.Pressable, { testID: "test-open-intention", onPress: () => props.onStagePress("intencion") }, "PRIMERA ETAPA",
    ) },
    "@/components/GrowthStageDetail": { GrowthStageDetail: (props: any) => {
      detailProps = props;
      return React.createElement(Native, { testID: "growth-stage-detail" });
    } },
    "@/components/GrowthJourneyHelpSheet": { GrowthJourneyHelpSheet: (props: any) => {
      helpProps = props;
      return React.createElement("div", { "data-help-visible": String(props.visible) });
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
    get detail() { return detailProps; },
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
  assert.ok(html.indexOf(intro.children) < html.indexOf("PRIMERA ETAPA"));
  assert.ok(html.indexOf("Tu camino") < html.indexOf("PRIMERA ETAPA"));
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
  assert.match(html, /data-testid="growth-help-sheet" data-height="471"/);
  assert.match(html, /data-testid="growth-journey-map"/);
  assert.equal(h.nodes.get("growth-journey-map").width, 388);
  assert.equal(h.nodes.get("growth-map-title").children, "El recorrido");
  assert.equal(flatten(h.nodes.get("growth-map-section").style).paddingTop, 25);
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
  assert.match(render(false), /data-pointer-events="none"/);
  const source = readFileSync(new URL("../components/GrowthJourneyHelpSheet.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(source, /<Modal/);
});

test("the treasure map has five ordered stops in an irregular loop, only Floración active, and uses the editorial final phase image", () => {
  const h = uiHarness();
  const labels = ["Floración", "El ascenso", "Iluminación", "La llegada", "El Gran Despertar"];
  const ids = ["floracion", "ascenso", "iluminacion", "llegada", "despertar"];
  const finalPhase = { id: "editorial-final", group: "florecimiento", name: "Final", image: "final.webp" };
  const bundledFinal = { id: "expansion", name: "Expansión", image: "bundled-final.png" };
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
    "@/components/StreakWeekRow": { getPositionedDayGradient: () => ["theme-lock-color"] },
    "@/context/GrowthContext": { useGrowth: () => ({ levels }) },
    "@/data/growthLevels": { allGrowthLevels: [bundledFinal] },
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
      assert.equal(iconStyle.height, i === 0 ? 76 : 46);
      assert.equal(flatten(h.nodes.get(`growth-map-label-${ids[i]}`).style).fontSize, 11);
      if (i) {
        assert.equal(h.nodes.get(`growth-map-${ids[i]}-reward-lock`).color, "theme-lock-color");
      }
      assert.ok(style.left >= 0 && style.left + style.width <= width);
      assert.ok(style.top >= 0 && style.top + (i === 0 ? 76 : 46) + 38 <= GROWTH_MAP_HEIGHT);
      if (i) assert.ok(html.indexOf(labels[i - 1]) < html.indexOf(labels[i]));
    }
    assert.equal(h.nodes.get("map-final-phase-art").level, finalPhase);
    assert.equal(h.nodes.get("growth-journey-map-route").pointerEvents, "none");
    assert.equal(paths[0].strokeDasharray, "2 8");
    const segments = paths[0].d.match(/[MC][^MC]+/g);
    assert.equal(segments.length, 5);
    const positions = [[0.27, 0.2], [0.75, 0.13], [0.79, 0.5], [0.5, 0.72], [0.22, 0.52]];
    for (let i = 0; i < segments.length; i++) {
      const numbers = segments[i].slice(1).trim().split(/[ ,]+/).map(Number);
      assert.deepEqual(numbers.slice(-2), [positions[i][0] * width, positions[i][1] * GROWTH_MAP_HEIGHT]);
    }
  }
  levels = [];
  renderToStaticMarkup(React.createElement(GrowthJourneyMap, { width: 343 }));
  assert.equal(h.nodes.get("map-final-phase-art").level, bundledFinal);
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