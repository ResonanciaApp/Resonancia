import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import React from "react";
import ts from "typescript";

function load(path: string, mocks: Record<string, any>) {
  const source = readFileSync(new URL(`../components/${path}.tsx`, import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true },
  }).outputText;
  const module = { exports: {} as any };
  new Function("require", "module", "exports", "__DEV__", compiled)((name: string) => {
    assert.ok(name in mocks, `Missing mock ${name}`);
    return mocks[name];
  }, module, module.exports, false);
  return module.exports;
}
function elements(node: any): React.ReactElement<any>[] {
  if (Array.isArray(node)) return node.flatMap(elements);
  if (!React.isValidElement<any>(node)) return [];
  return [node, ...elements(node.props.children)];
}
const flatten = (style: any): any => Array.isArray(style)
  ? Object.assign({}, ...style.map(flatten)) : style || {};

test("Mis estadísticas is above notifications and opens/closes its own window without navigation", () => {
  const state: any[] = [];
  let index = 0;
  let navigations = 0;
  const hookReact = { ...React, useState: (initial: any) => {
    const slot = index++;
    if (!(slot in state)) state[slot] = initial;
    return [state[slot], (value: any) => { state[slot] = value; }];
  } };
  const settings = load("ProfileSettingsSections", {
    react: hookReact,
    "react-native": {
      View: "view", Text: "text", Pressable: "pressable", Switch: "switch",
      StyleSheet: { create: (styles: any) => styles }, Alert: {}, LayoutAnimation: {},
    },
    "@expo/vector-icons": { Feather: "icon" },
    "expo-application": {},
    "expo-router": { router: { push: () => navigations++ } },
    "@/components/MilestoneCards": { MilestoneCards: "milestones" },
    "@/components/SettingsStatisticsPanel": { SettingsStatisticsPanel: "statistics-panel" },
    "@/components/VisualThemeSwatches": { VisualThemeSwatches: "swatches" },
    "@/config/scene-themes": { isIndigoThemeId: () => false, isIndigo2ThemeId: () => true },
    "@/constants/colors": { MEMBERSHIP_AURORA: { premium: { accent: "#FFF" } } },
    "@/context/BrightnessContext": { useBrightness: () => ({ brightMode: false }) },
    "@/context/GeometrixPanelContext": { useGeometrixPanel: () => ({ openGeometrix: () => {} }) },
    "@/context/PremiumContext": { usePremium: () => ({ isPremium: false, setPremium: () => {} }) },
    "@/context/EmojiWidgetContext": { useEmojiWidget: () => ({ enabled: true, loaded: true, saving: false, setEnabled: async () => {} }) },
    "@/context/TabBarLabelsContext": { useTabBarLabels: () => ({ enabled: false, loaded: true, saving: false, setEnabled: async () => {} }) },
    "@/context/SceneThemeContext": { useSceneTheme: () => ({ activeSceneId: "cloudy", setActiveScene: () => {} }) },
    "@/hooks/useColors": { useColors: () => ({ primary: "#FFF" }) },
  });
  const props = {
    placement: "settings", sceneId: "cloudy", foreground: "#FFF", mutedForeground: "#AAA",
    accent: "#FFF", cardBackground: "rgba(0,0,0,0.16)", onLogout: () => {},
  };
  const render = () => {
    index = 0;
    return elements(settings.ProfileSettingsSections(props));
  };
  let nodes = render();
  const labels = nodes.filter(node => node.type === "pressable").map(node => node.props.accessibilityLabel);
  assert.ok(labels.indexOf("Mis estadísticas") >= 0);
  assert.ok(labels.indexOf("Mis estadísticas") < labels.indexOf("Personalizar notificaciones"));
  assert.equal(nodes.filter(node => node.type === "statistics-panel").length, 0);
  nodes.find(node => node.props.accessibilityLabel === "Mis estadísticas")!.props.onPress();
  nodes = render();
  const panel = nodes.find(node => node.type === "statistics-panel");
  assert.ok(panel);
  assert.equal(navigations, 0, "Keep settings and its scroll in place underneath");
  panel.props.onClose();
  assert.equal(render().filter(node => node.type === "statistics-panel").length, 0);
});

test("Statistics window enters right-to-left and exits right, including native back handling", () => {
  for (const width of [402, 800]) {
    const animations: any[] = [];
    let closed = 0;
    const theme = { solid: "#21315F", gradient: ["#21315F", "#342265"] };
    class Value {
      constructor(public value: number) {}
      stopAnimation() {}
    }
    const panel = load("SettingsStatisticsPanel", {
      react: { ...React, useRef: (value: any) => ({ current: value }), useEffect: () => {}, useCallback: (fn: any) => fn },
      "react-native": {
        Modal: "modal", View: "view", Text: "text", Pressable: "pressable", ScrollView: "scroll",
        Animated: { View: "animated", Value, timing: (value: Value, config: any) => ({
          start: (callback: any) => animations.push({ value, ...config, callback }),
        }) },
        useWindowDimensions: () => ({ width }), StyleSheet: { create: (s: any) => s },
      },
      "@expo/vector-icons": { Feather: "icon" },
      "expo-linear-gradient": { LinearGradient: "gradient" },
      "react-native-safe-area-context": { useSafeAreaInsets: () => ({ top: 24, bottom: 20 }) },
      "@/components/ProgressMirrorSections": { ProgressMirrorSections: "statistics" },
      "@/constants/motion": { DURATION: { DRAWER: 300 }, easeOutCubic: () => {} },
      "@/context/SceneThemeContext": { useSceneTheme: () => ({ theme }) },
    });
    const root = panel.SettingsStatisticsPanel({ onClose: () => closed++ });
    const nodes = elements(root);
    const window = nodes.find(node => node.props.testID === "settings-statistics-panel")!;
    assert.equal(flatten(window.props.style).transform[0].translateX.value, width);
    assert.equal(root.props.animationType, "none", "Do not use the bottom-to-top native slide");
    root.props.onShow();
    assert.equal(animations[0].toValue, 0);
    assert.equal(animations[0].useNativeDriver, true);
    const header = nodes.find(node => node.props.accessibilityRole === "header");
    assert.equal(header?.props.children, "Mis estadísticas");
    const stats = nodes.find(node => node.type === "statistics")!;
    assert.equal(stats.props.showPersonalStats, true);
    assert.equal(stats.props.showPersonalStatsTitle, false);
    assert.equal(stats.props.personalStatsFilterBelowTitle, true);
    assert.equal(stats.props.showStreakSection, false);
    assert.equal(stats.props.showCalendar, false);
    assert.deepEqual(nodes.find(node => node.type === "gradient")?.props.colors, theme.gradient);
    nodes.find(node => node.props.accessibilityLabel === "Volver a Configuración y ajustes")!.props.onPress();
    assert.equal(animations[1].toValue, width);
    assert.equal(animations[1].useNativeDriver, true);
    assert.equal(closed, 0, "Keep the native window mounted throughout its exit");
    root.props.onRequestClose();
    assert.equal(animations.length, 2, "Ignore repeated native back/close taps while exiting");
    animations[1].callback({ finished: true });
    assert.equal(closed, 1);
  }
});