import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import test from "node:test";
import React from "react";
import ts from "typescript";
import * as tabConstants from "../constants/tab-bar.ts";
import * as selectionConstants from "../constants/tab-selection.ts";

const source = readFileSync(new URL("../app/(tabs)/_layout.tsx", import.meta.url), "utf8");
const compiled = ts.transpileModule(`${source}\nexport { CustomTabBar, TabItem, styles };`, {
  compilerOptions: { jsx: ts.JsxEmit.React, module: ts.ModuleKind.CommonJS, esModuleInterop: true },
}).outputText;

function harness(platform = "ios") {
  const calls: string[] = [];
  const animations: any[] = [];
  const refs: any[] = [];
  let refIndex = 0;
  let prevented = false;
  let libOpen = false;
  let pathname = "/";
  const theme = { gradient: ["#371C5F", "#192E70"] };
  class Value {
    constructor(public value: number) {}
    interpolate(config: unknown) { return { value: this.value, config }; }
    stopAnimation() {}
    setValue(value: number) { this.value = value; }
  }
  const imports: Record<string, any> = {
    react: {
      ...React,
      useRef: (initial: unknown) => refs[refIndex++] ??= { current: initial },
      useCallback: (fn: unknown) => fn,
      useMemo: (fn: () => unknown) => fn(),
      useState: (initial: unknown) => [initial, () => {}],
      useEffect: (fn: () => unknown) => fn(),
      useLayoutEffect: () => {},
    },
    "react-native": {
      View: "view", Pressable: "pressable", Image: "image", Text: "text",
      Platform: { OS: platform },
      Dimensions: { get: () => ({ width: 402, height: 874 }) },
      StyleSheet: { create: (styles: unknown) => styles, absoluteFill: {}, hairlineWidth: 0.5 },
      Animated: {
        View: "animated-view", Value,
        timing: (value: Value, config: any) => ({
          start: () => { animations.push(config); value.value = config.toValue; },
        }),
      },
    },
    "expo-router": { Tabs: "tabs", usePathname: () => pathname },
    "expo-symbols": { SymbolView: "symbol" },
    "expo-blur": { BlurView: "blur" },
    "expo-linear-gradient": { LinearGradient: "gradient" },
    "expo-haptics": {
      ImpactFeedbackStyle: { Soft: "soft" },
      impactAsync: async (style: string) => { calls.push(`haptic:${style}`); },
    },
    "@expo/vector-icons": { Feather: "feather", MaterialCommunityIcons: "mci" },
    "react-native-safe-area-context": { useSafeAreaInsets: () => ({ bottom: 34 }) },
    "@/constants/tab-bar": tabConstants,
    "@/constants/tab-selection": selectionConstants,
    "@/components/TabSelectionIndicator": { TabSelectionIndicator: "selection-indicator" },
    "@/constants/motion": { DURATION: { SHEET_CLOSE: 250 }, easeOutCubic: () => {} },
    "@/config/scene-themes": { isIndigo2ThemeId: () => false },
    "@/context/SceneThemeContext": { useSceneTheme: () => ({ activeSceneId: "pleyades", theme }) },
    "@/context/MixerPanelContext": { useMixerPanel: () => ({ isMixerOpen: false, openMixer: () => calls.push("mixer") }) },
    "@/context/GeometrixPanelContext": { useGeometrixPanel: () => ({ isGeometrixOpen: false }) },
    "@/context/DrawerContext": {
      useDrawer: () => ({
        libOpen, closeLib: () => calls.push("close-library"), libraryParallax: new Value(0),
      }),
    },
    "@/context/CategoryOverlayContext": {
      useCategoryOverlay: () => ({ stack: [], closeAllCategories: () => calls.push("close-categories") }),
    },
    "@/context/TabBarVisibilityContext": {
      useTabBarVisibility: () => ({ hidden: false, revealHandleHidden: false, showMenu: () => {} }),
    },
  };
  const module = { exports: {} as any };
  vm.runInNewContext(compiled, {
    module, exports: module.exports,
    require: (name: string) => imports[name] ?? {},
  });
  const routes = ["inicio3", "explore-copia", "descanzo", "sonidos", "profile", "biblioteca"]
    .map((name) => ({ key: name, name }));
  const props = {
    state: { index: 0, routes }, descriptors: {},
    navigation: {
      emit: () => ({ defaultPrevented: prevented }),
      navigate: (name: string) => calls.push(`navigate:${name}`),
    },
  };
  const render = () => { refIndex = 0; return module.exports.CustomTabBar(props); };
  return {
    calls, animations, props, render, ...module.exports,
    prevent: () => { prevented = true; },
    library: () => { libOpen = true; },
    session: () => { pathname = "/session/example"; },
  };
}

function find(node: any, predicate: (node: any) => boolean): any[] {
  if (Array.isArray(node)) return node.flatMap((child) => find(child, predicate));
  if (!node || typeof node !== "object" || !node.props) return [];
  return [...(predicate(node) ? [node] : []), ...find(node.props.children, predicate)];
}

test("icon-only tabs retain accessible names, selected state, and a single smaller icon", () => {
  for (const platform of ["ios", "android", "web"]) {
    const h = harness(platform);
    const items = find(h.render(), (node) => node.type === h.TabItem);
    assert.equal(items.length, 5);
    for (const item of items) {
      const rendered = h.TabItem(item.props);
      assert.ok(rendered.props.accessibilityLabel);
      assert.equal(rendered.props.accessibilityRole, "tab");
      assert.equal(rendered.props.accessibilityState.selected, item.props.isFocused);
      assert.equal(find(rendered, (node) => node.type === "text").length, 0);
      const icon = find(rendered, (node) => ["symbol", "mci", "feather"].includes(node.type))[0];
      assert.equal(icon.props.size, item.props.route.name === "sonidos" ? 27 : 24);
      assert.equal(find(rendered, (node) => node.type === "blur").length, 0);
    }
  }
});

test("changing tabs preserves soft haptics, overlay cleanup and navigation", () => {
  const h = harness();
  h.library();
  const item = find(h.render(), (node) => node.type === h.TabItem && node.props.route.name === "profile")[0];
  item.props.onPress();
  assert.deepEqual(h.calls, ["haptic:soft", "close-library", "close-categories", "navigate:profile"]);
});

test("prevented or already-selected tabs never navigate", () => {
  const h = harness();
  h.prevent();
  const items = find(h.render(), (node) => node.type === h.TabItem);
  items[1].props.onPress();
  items[0].props.onPress();
  assert.equal(h.calls.filter((call) => call.startsWith("navigate:")).length, 0);
});

test("the last real tab stays selected under a hidden library route", () => {
  const h = harness();
  h.props.state.index = 4;
  h.render();
  h.props.state.index = 5;
  const selected = find(h.render(), (node) => node.type === h.TabItem && node.props.isFocused);
  assert.equal(selected.length, 1);
  assert.equal(selected[0].props.route.name, "profile");
});

test("pill geometry preserves the existing safe-area footprint and native visibility animation", () => {
  const h = harness();
  const bar = find(h.render(), (node) => node.type === "animated-view")[0];
  assert.equal(bar.props.style[1].height, 58 + 34);
  assert.equal(h.styles.pill.borderRadius, h.styles.pill.height / 2);
  assert.equal(h.styles.pill.height, 59);
  assert.equal(h.styles.pill.top, -1);
  assert.equal(h.styles.pill.top + h.styles.pill.height, 58);
  assert.equal(h.styles.pill.top + h.styles.row.marginTop, 0);
  assert.equal(h.styles.row.height, 58);
  assert.equal(selectionConstants.TAB_SELECTION_HEIGHT, 50);
  assert.equal(selectionConstants.TAB_SELECTION_INSET, -1);
  assert.ok(h.animations.every((animation) => animation.useNativeDriver === true));
  h.session();
  const hiddenBar = find(h.render(), (node) => node.type === "animated-view")[0];
  assert.equal(hiddenBar.props.style[1].transform[1].translateY, 58 + 34 + 40);
});

test("the bar keeps Home's blur with one persistent selection indicator behind the icons", () => {
  const h = harness();
  const tree = h.render();
  const blur = find(tree, (node) => node.type === "blur")[0];
  assert.equal(blur.props.intensity, 38);
  assert.equal(blur.props.tint, "light");
  assert.equal(blur.props.experimentalBlurMethod, "dimezisBlurView");
  const indicators = find(tree, (node) => node.type === "selection-indicator");
  assert.equal(indicators.length, 1);
  assert.equal(indicators[0].props.count, 5);
  assert.equal(indicators[0].props.index, 0);
});

test("selected capsule uses exactly ten percent white and greater rebound for longer travel", () => {
  assert.equal(selectionConstants.TAB_SELECTION_BACKGROUND, "rgba(255,255,255,0.1)");
  const near = selectionConstants.tabSelectionSpring(1);
  const far = selectionConstants.tabSelectionSpring(4);
  assert.ok(far.damping < near.damping);
  assert.equal(near.stiffness, far.stiffness);
  assert.equal(far.overshootClamping, false);
  assert.deepEqual(selectionConstants.tabSelectionSpring(10), far);
  assert.deepEqual(selectionConstants.tabSelectionSpring(-4), far);
});
