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
  name?: string;
  color?: string;
  source?: number;
  stopOpacity?: number;
};
const flattenStyle = (style: unknown): Record<string, unknown> => Array.isArray(style)
  ? Object.assign({}, ...style.map(flattenStyle))
  : style && typeof style === "object" ? style as Record<string, unknown> : {};
let capturedOnPress: (() => void) | undefined;
const Native = ({ accessibilityLabel, accessibilityRole, children, onPress, style, testID, name, color, source, stopOpacity }: NativeProps) => {
  const resolvedStyle = flattenStyle(style);
  if (testID === "growth-level-zero-preview") capturedOnPress = onPress;
  return React.createElement("div", {
    "data-testid": testID,
    "data-icon": name,
    "data-color": color,
    "data-position": resolvedStyle.position,
    "data-filter": resolvedStyle.filter,
    "data-source": source,
    "data-stop-opacity": stopOpacity,
    "data-padding-vertical": resolvedStyle.paddingVertical,
    "data-direction": resolvedStyle.flexDirection,
    "data-align": resolvedStyle.alignItems,
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
  "../assets/images/growth/00-intencion-profile.png": 2,
  react: React,
  "react-native": {
    Image: Native,
    Platform: { OS: "web" },
    Pressable: Native,
    StyleSheet: { create: (styles: unknown) => styles },
    Text: Native,
    View: Native,
  },
  "@expo/vector-icons": { Feather: Native, MaterialCommunityIcons: Native },
  "react-native-svg": { __esModule: true, default: Native, Circle: Native, Defs: Native, RadialGradient: Native, Stop: Native },
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
const GrowthRow = new Function("require", "module", "exports", `${compiled}\nreturn GrowthRow;`)((name: string) => {
  if (!(name in mocks)) throw new Error(`Missing growth preview test mock: ${name}`);
  return mocks[name];
}, componentModule, componentModule.exports);

const render = (props: Record<string, unknown> = {}) => renderToStaticMarkup(
  React.createElement(componentModule.exports.GrowthLevelPreviewCard, { onPress: () => {}, ...props }),
);

test("Profile intention has a small faint background glow and brightened RGB artwork, without a wrapper filter", () => {
  const html = render({ canonicalVerticalInsets: true });
  const glow = html.indexOf('data-testid="profile-intention-glow"');
  const image = html.indexOf('data-testid="profile-intention-image"');
  assert.ok(glow >= 0 && image > glow);
  assert.match(html, /data-source="2"/);
  assert.doesNotMatch(html, /data-filter/);
  const stops = [...html.matchAll(/data-stop-opacity="([^"]+)"/g)].map(match => Number(match[1]));
  assert.deepEqual(stops, [0.065, 0.025, 0.005, 0]);
  assert.match(render(), /data-source="1"/);
  assert.doesNotMatch(render(), /profile-intention-glow|profile-intention-image|brightness/);
});

test("GrowthLevelPreviewCard opts into exact 18px profile insets without changing other callers", () => {
  const profileHtml = render({ embedded: true, canonicalVerticalInsets: true });
  assert.match(profileHtml, /data-testid="growth-level-zero-preview"[^>]*data-padding-top="18" data-padding-bottom="18"/);
  const profileContent = profileHtml.slice(profileHtml.indexOf(">") + 1);
  assert.ok(profileContent.indexOf("0 días") < profileContent.indexOf("Intención"));
  assert.ok(profileContent.indexOf("Intención") < profileContent.indexOf("Una práctica que comienza hoy."));
  assert.match(profileHtml, /data-min-height="100" data-self-align="stretch" data-justify-content="space-between"/);
  assert.doesNotMatch(profileHtml, /data-height="100"[^>]*data-justify-content="space-between"/);
  assert.match(profileHtml, /data-margin-bottom="0"/);

  const defaultHtml = render();
  assert.match(defaultHtml, /data-testid="growth-level-zero-preview"[^>]*data-padding-top="17" data-padding-bottom="15"/);
  const defaultContent = defaultHtml.slice(defaultHtml.indexOf(">") + 1);
  assert.ok(defaultContent.indexOf("0 días") < defaultContent.indexOf("Intención"));
  assert.doesNotMatch(defaultHtml, /data-min-height="100" data-self-align="stretch"/);
});

test("Perfil removes both inner bottom margins for equal gaps and places its single chevron in the title row", () => {
  const html = render({ embedded: true, canonicalVerticalInsets: true });
  assert.match(html, /data-testid="profile-intention-title-row"[^>]*data-direction="row" data-align="center"/);
  assert.equal((html.match(/data-icon="chevron-right"/g) ?? []).length, 1);
  assert.equal((html.match(/data-margin-bottom="0"/g) ?? []).length, 2);
  const rowAt = html.indexOf('data-testid="profile-intention-title-row"');
  const chevronAt = html.indexOf('data-icon="chevron-right"');
  assert.ok(chevronAt > rowAt && chevronAt < html.indexOf("Una práctica que comienza hoy."));
  assert.doesNotMatch(render(), /profile-intention-title-row/);
});

test("Perfil's Intención day pill has a small centered golden lotus, without changing other preview callers", () => {
  const html = render({ embedded: true, canonicalVerticalInsets: true });
  assert.match(html, /data-icon="spa" data-color="#BE9650"/);
  assert.match(html, /data-direction="row" data-align="center"/);
  assert.ok(html.indexOf('data-icon="spa"') < html.lastIndexOf("0 días"));
  assert.doesNotMatch(html, /de racha|data-padding-vertical="5.5"/);
  assert.doesNotMatch(render(), /data-icon="spa"/);
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

test("Florecimiento pills center the golden lotus beside days, omit streak wording and preserve the extra 3px padding", () => {
  for (const status of ["current", "locked"]) {
    for (const [startDay, endDay, label] of [[0, 0, "0 días"], [1, 7, "1–7 días"], [43, 49, "43–49 días"]] as const) {
      const level = { id: "test", name: "Etapa", startDay, endDay, image: 1, story: "Descripción." };
      const html = renderToStaticMarkup(React.createElement(GrowthRow, { level, hasNext: false, status, florecimiento: true }));
      assert.match(html, /data-icon="spa" data-color="#BE9650"/);
      assert.doesNotMatch(html, /de racha/);
      const lotus = html.match(/<div[^>]*data-icon="spa"[^>]*>/)?.[0] ?? "";
      assert.doesNotMatch(lotus, /data-position="absolute"/);
      assert.match(html, /data-direction="row" data-align="center"/);
      assert.match(html, /data-padding-vertical="5.5"/);
      assert.ok(html.indexOf('data-icon="spa"') < html.lastIndexOf(label));
      assert.ok(html.includes(label));
      const ascent = renderToStaticMarkup(React.createElement(GrowthRow, { level, hasNext: false, status }));
      assert.doesNotMatch(ascent, /data-icon="spa"|de racha/);
      assert.match(ascent, /data-padding-vertical="4"/);
    }
  }
  assert.equal((5.5 - 4) * 2, 3);
  assert.doesNotMatch(render(), /data-icon="spa"|de racha|data-padding-vertical="5.5"/);
});