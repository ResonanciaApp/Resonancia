import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { URL } from "node:url";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

type NativeProps = {
  accessibilityLabel?: string;
  accessibilityRole?: string;
  children?: React.ReactNode;
  onPress?: () => void;
  style?: unknown;
  testID?: string;
};
const flattenStyle = (style: unknown): Record<string, unknown> => Array.isArray(style)
  ? Object.assign({}, ...style.map(flattenStyle))
  : style && typeof style === "object" ? style as Record<string, unknown> : {};
let capturedOnPress: (() => void) | undefined;
const Native = ({ accessibilityLabel, accessibilityRole, children, onPress, style, testID }: NativeProps) => {
  const resolvedStyle = flattenStyle(style);
  if (testID === "growth-level-zero-preview") capturedOnPress = onPress;
  return React.createElement("div", {
    "data-testid": testID,
    "data-accessibility-role": accessibilityRole,
    "data-accessibility-label": accessibilityLabel,
    "data-height": resolvedStyle.height,
    "data-min-height": resolvedStyle.minHeight,
    "data-self-align": resolvedStyle.alignSelf,
    "data-justify-content": resolvedStyle.justifyContent,
    "data-margin-bottom": resolvedStyle.marginBottom,
    "data-padding-top": resolvedStyle.paddingTop,
    "data-padding-bottom": resolvedStyle.paddingBottom,
  }, children);
};
const compiled = ts.transpileModule(
  readFileSync(new URL("../components/GrowthJourney.tsx", import.meta.url), "utf8"),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true } },
).outputText;
const mocks: Record<string, unknown> = {
  react: React,
  "react-native": {
    Image: Native,
    Platform: { OS: "web" },
    Pressable: Native,
    StyleSheet: { create: (styles: unknown) => styles },
    Text: Native,
    View: Native,
  },
  "@expo/vector-icons": { Feather: Native },
  "expo-asset": { Asset: { fromModule: () => ({ localUri: null, downloadAsync: async () => {} }) } },
  "@/constants/colors": {
    MEMBERSHIP_AURORA: { premium: { accent: "#BE9650" } },
    POSITIONED_DAY_GRADIENT: ["#C9A6FF"],
  },
  "@/components/CinematicFadeSlide": {
    CinematicFadeSlide: ({ children }: { children?: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
  },
  "@/data/growthLevels": {
    ascentLevels: [],
    growthLevels: [{
      id: "intencion",
      name: "Intención",
      startDay: 0,
      endDay: 0,
      image: 1,
      story: "Una práctica que comienza hoy.",
    }],
  },
  "@/hooks/useColors": {
    useColors: () => ({ foreground: "#FFF", mutedForeground: "#AAA" }),
  },
};
const componentModule = { exports: {} as { GrowthLevelPreviewCard: React.ComponentType<Record<string, unknown>> } };
new Function("require", "module", "exports", compiled)((name: string) => {
  if (!(name in mocks)) throw new Error(`Missing growth preview test mock: ${name}`);
  return mocks[name];
}, componentModule, componentModule.exports);

const render = (props: Record<string, unknown> = {}) => renderToStaticMarkup(
  React.createElement(componentModule.exports.GrowthLevelPreviewCard, { onPress: () => {}, ...props }),
);

test("GrowthLevelPreviewCard opts into exact 18px profile insets without changing other callers", () => {
  const profileHtml = render({ embedded: true, canonicalVerticalInsets: true });
  assert.match(profileHtml, /data-testid="growth-level-zero-preview"[^>]*data-padding-top="18" data-padding-bottom="18"/);
  const profileContent = profileHtml.slice(profileHtml.indexOf(">") + 1);
  assert.ok(profileContent.indexOf("Intención") < profileContent.indexOf("0 días"));
  assert.ok(profileContent.indexOf("0 días") < profileContent.indexOf("Una práctica que comienza hoy."));
  assert.match(profileHtml, /data-min-height="100" data-self-align="stretch" data-justify-content="space-between"/);
  assert.doesNotMatch(profileHtml, /data-height="100"[^>]*data-justify-content="space-between"/);
  assert.match(profileHtml, /data-margin-bottom="0"/);

  const defaultHtml = render();
  assert.match(defaultHtml, /data-testid="growth-level-zero-preview"[^>]*data-padding-top="17" data-padding-bottom="15"/);
  const defaultContent = defaultHtml.slice(defaultHtml.indexOf(">") + 1);
  assert.ok(defaultContent.indexOf("0 días") < defaultContent.indexOf("Intención"));
  assert.doesNotMatch(defaultHtml, /data-min-height="100" data-self-align="stretch"/);
});

test("the preview remains an accessible actionable button with the same day label", () => {
  let presses = 0;
  render({ onPress: () => presses++ });
  assert.ok(capturedOnPress);
  capturedOnPress();
  assert.equal(presses, 1);
  assert.match(render(), /data-accessibility-role="button"/);
  assert.match(render(), /Intención, 0 días\. Abrir camino de crecimiento/);
});