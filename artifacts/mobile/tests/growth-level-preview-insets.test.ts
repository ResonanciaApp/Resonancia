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
  pointerEvents?: string;
  accessibilityState?: { disabled?: boolean };
};
const flattenStyle = (style: unknown): Record<string, unknown> => Array.isArray(style)
  ? Object.assign({}, ...style.map(flattenStyle))
  : style && typeof style === "object" ? style as Record<string, unknown> : {};
let capturedOnPress: (() => void) | undefined;
const Native = ({ accessibilityLabel, accessibilityRole, children, onPress, style, testID, name, color, source, stopOpacity, pointerEvents, accessibilityState }: NativeProps) => {
  const resolvedStyle = flattenStyle(style);
  if (testID === "growth-level-zero-preview") capturedOnPress = onPress;
  return React.createElement("div", {
    "data-testid": testID,
    "data-icon": name,
    "data-color": color,
    "data-position": resolvedStyle.position,
    "data-font-size": resolvedStyle.fontSize,
    "data-line-height": resolvedStyle.lineHeight,
    "data-margin-vertical": resolvedStyle.marginVertical,
    "data-transform": resolvedStyle.transform ? JSON.stringify(resolvedStyle.transform) : undefined,
    "data-filter": resolvedStyle.filter,
    "data-source": source,
    "data-opacity": resolvedStyle.opacity,
    "data-pointer-events": pointerEvents,
    "data-disabled": accessibilityState?.disabled,
    "data-stop-opacity": stopOpacity,
    "data-padding-vertical": resolvedStyle.paddingVertical,
    "data-direction": resolvedStyle.flexDirection,
    "data-align": resolvedStyle.alignItems,
    "data-gap": resolvedStyle.gap,
    "data-wrap": resolvedStyle.flexWrap,
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
  "../assets/images/growth/semilla-reward-chest.png": 3,
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

test("Semilla replaces its chest with a same-size dimmed closed lock and disabled avatar-unlock copy", () => {
  const semilla = {
    id: "semilla", name: "Semilla", startDay: 1, endDay: 7,
    image: 1, story: "Tu primer paso abre un espacio para crecer.",
  };
  const html = renderToStaticMarkup(React.createElement(GrowthRow, {
    level: semilla, hasNext: true, status: "locked", florecimiento: true,
  }));
  const reward = html.match(/<div[^>]*data-testid="semilla-reward"[^>]*>/)?.[0];
  assert.ok(reward);
  assert.match(reward, /data-direction="row"/);
  assert.match(reward, /data-pointer-events="none"/);
  assert.match(reward, /data-disabled="true"/);
  const lock = html.match(/<div[^>]*data-testid="semilla-reward-lock"[^>]*>/)?.[0];
  assert.ok(lock);
  assert.match(lock, /data-icon="lock"/);
  assert.match(lock, /data-opacity="0.8"/);
  assert.match(lock, /data-height="22"/);
  assert.doesNotMatch(html, /semilla-reward-chest|data-source="3"/);
  assert.match(html, /data-opacity="0.55"/);
  assert.ok(html.indexOf(`>${semilla.story}</div>`) < html.indexOf('data-testid="semilla-reward"'));
  assert.ok(html.indexOf('data-testid="semilla-reward-lock"') < html.indexOf(">Desbloquea 50 avatares nuevos</div>"));
  assert.doesNotMatch(html, /Regalitos sorpresa|Desbloquea tu cofre de regalos/);
  assert.doesNotMatch(html, /data-accessibility-role="button"/);
  for (const id of ["intencion", "brote", "desarrollo", "enraizamiento", "floracion", "ascenso-inicio"]) {
    const other = renderToStaticMarkup(React.createElement(GrowthRow, {
      level: { ...semilla, id }, hasNext: false, status: id === "intencion" ? "current" : "locked",
    }));
    assert.doesNotMatch(other, /data-testid="[^"]*-reward|Regalitos sorpresa/);
  }
});

test("Crecimiento, Vegetación and Expansión display the same small disabled chest without a title", () => {
  for (const [id, name] of [["crecimiento", "Crecimiento"], ["vegetacion", "Vegetación"], ["expansion", "Expansión"]]) {
    const story = `Descripción de ${name}.`;
    const html = renderToStaticMarkup(React.createElement(GrowthRow, {
      level: { id, name, startDay: 15, endDay: 21, image: 1, story },
      hasNext: id !== "expansion", status: "locked", florecimiento: true,
    }));
    const reward = html.match(new RegExp(`<div[^>]*data-testid="${id}-reward"[^>]*>`))?.[0];
    assert.ok(reward, id);
    assert.match(reward, /data-pointer-events="none"/);
    assert.match(reward, /data-disabled="true"/);
    const chest = html.match(new RegExp(`<div[^>]*data-testid="${id}-reward-chest"[^>]*>`))?.[0];
    assert.ok(chest, id);
    assert.match(chest, /data-source="3"/);
    assert.match(chest, /data-opacity="0.8"/);
    assert.match(chest, /data-height="22"/);
    assert.match(html, /data-opacity="0.55"/);
    assert.ok(html.indexOf(`>${story}</div>`) < html.indexOf(`data-testid="${id}-reward"`));
    assert.doesNotMatch(html, /Regalitos sorpresa|Desbloquea tu cofre de regalos|data-accessibility-role="button"/);
  }
});

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

test("GrowthLevelPreviewCard reduces the profile background by 2px at each edge without changing other callers", () => {
  const profileHtml = render({ embedded: true, canonicalVerticalInsets: true });
  assert.match(profileHtml, /data-testid="growth-level-zero-preview"[^>]*data-padding-top="16" data-padding-bottom="16"/);
  assert.match(profileHtml, /data-margin-vertical="2"/);
  const profileContent = profileHtml.slice(profileHtml.indexOf(">") + 1);
  assert.ok(profileContent.indexOf("0 días") < profileContent.indexOf("Intención"));
  assert.ok(profileContent.indexOf("Intención") < profileContent.indexOf("Una práctica que comienza hoy."));
  assert.match(profileHtml, /data-min-height="100"[^>]*data-justify-content="center"/);
  assert.doesNotMatch(profileHtml, /data-justify-content="space-between"|data-self-align="stretch"/);
  assert.match(profileHtml, /data-margin-bottom="0"/);

  const defaultHtml = render();
  assert.match(defaultHtml, /data-testid="growth-level-zero-preview"[^>]*data-padding-top="17" data-padding-bottom="15"/);
  const defaultContent = defaultHtml.slice(defaultHtml.indexOf(">") + 1);
  assert.ok(defaultContent.indexOf("0 días") < defaultContent.indexOf("Intención"));
  assert.doesNotMatch(defaultHtml, /data-min-height="100" data-self-align="stretch"/);
});

test("Perfil retains its larger Intención title and aligns the pill and description without vertical offsets", () => {
  const html = render({ embedded: true, canonicalVerticalInsets: true });
  assert.match(html, /<div[^>]*data-font-size="18"[^>]*data-line-height="23"[^>]*>Intención<\/div>/);
  assert.doesNotMatch(html, /data-transform=/);
  const defaultHtml = render();
  assert.match(defaultHtml, /data-font-size="15"[^>]*data-line-height="20"/);
  assert.doesNotMatch(defaultHtml, /data-transform=/);
});

test("Perfil stacks the pill above Intención, centers the text beside its image, and aligns a single trailing chevron", () => {
  const html = render({ embedded: true, canonicalVerticalInsets: true });
  assert.match(html, /data-testid="profile-intention-title-row"[^>]*data-direction="column" data-align="flex-start"/);
  assert.equal((html.match(/data-icon="chevron-right"/g) ?? []).length, 1);
  assert.equal((html.match(/data-margin-bottom="0"/g) ?? []).length, 2);
  const rowAt = html.indexOf('data-testid="profile-intention-title-row"');
  const chevronAt = html.indexOf('data-icon="chevron-right"');
  const pillAt = html.lastIndexOf("0 días");
  const nameAt = html.indexOf(">Intención</div>", rowAt);
  const storyAt = html.indexOf(">Una práctica que comienza hoy.</div>");
  assert.ok(rowAt < pillAt && pillAt < nameAt && nameAt < storyAt && storyAt < chevronAt);
  const card = html.match(/<div[^>]*data-testid="growth-level-zero-preview"[^>]*>/)?.[0];
  assert.ok(card);
  assert.match(card, /data-direction="row" data-align="center"/);
  const titleRow = html.match(/<div[^>]*data-testid="profile-intention-title-row"[^>]*>/)?.[0];
  assert.ok(titleRow);
  assert.match(titleRow, /data-gap="6"/);
  assert.doesNotMatch(titleRow, /data-wrap=/);
  assert.match(html, /data-testid="profile-intention-chevron"/);
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