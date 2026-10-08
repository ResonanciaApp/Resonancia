import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { URL } from "node:url";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";
import * as wallBorderConstants from "../constants/reflectionWallBorder.ts";

const TEST_GRADIENT = ["#060A0F", "#111122"] as const;

test("the complete journey moves down 15px without changing timeline and row geometry", () => {
  const source = readFileSync(new URL("../components/GrowthJourney.tsx", import.meta.url), "utf8");
  assert.match(source, /section: \{\s*marginHorizontal: 16,\s*marginTop: 15,\s*paddingBottom: 12/);
  assert.match(source, /<View style=\{styles\.section\}>[\s\S]*?<GrowthStageHeading[\s\S]*?<GrowthTimeline>/);
  assert.match(source, /timeline: \{ position: "relative" \}/);
  assert.match(source, /row: \{ height: GROWTH_ROW_HEIGHT, position: "relative", justifyContent: "center" \}/);
});

test("Tu camino restores the original nine growth illustrations and eight ascent landscapes", () => {
  const source = readFileSync(new URL("../data/growthLevels.ts", import.meta.url), "utf8");
  const firstStage = source.split("export const ascentLevels")[0];
  const secondStage = source.split("export const ascentLevels")[1].split("export const allGrowthLevels")[0];
  assert.equal([...firstStage.matchAll(/growth\/\d\d-[^"]+\.png/g)].length, 9);
  assert.equal([...secondStage.matchAll(/growth\/ascenso-/g)].length, 8);
  assert.doesNotMatch(source, /growth\/icons\//);
});

test("all stages reference 512px PNGs with alpha for faded backgrounds or transparent icons", () => {
  const source = readFileSync(new URL("../data/growthLevels.ts", import.meta.url), "utf8");
  const paths = [...source.matchAll(/require\("(\.\.\/assets\/images\/growth\/[^"]+\.png)"\)/g)].map(match => match[1]);
  assert.equal(paths.length, 17);
  assert.equal(new Set(paths).size, 17);
  for (const path of paths) {
    const png = readFileSync(new URL(path, new URL("../data/growthLevels.ts", import.meta.url)));
    assert.equal(png.subarray(1, 4).toString(), "PNG", path);
    assert.equal(png.readUInt32BE(16), 512, `${path} width`);
    assert.equal(png.readUInt32BE(20), 512, `${path} height`);
    assert.ok([4, 6].includes(png[25]), `${path} must have an alpha channel`);
  }
});

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
  numberOfLines?: number;
  adjustsFontSizeToFit?: boolean;
};
const flattenStyle = (style: unknown): Record<string, unknown> => Array.isArray(style)
  ? Object.assign({}, ...style.map(flattenStyle))
  : style && typeof style === "object" ? style as Record<string, unknown> : {};
let capturedOnPress: (() => void) | undefined;
let capturedViewAllPress: (() => void) | undefined;
let capturedIntentionPress: (() => void) | undefined;
const Native = ({ accessibilityLabel, accessibilityRole, children, onPress, style, testID, name, color, source, stopOpacity, pointerEvents, accessibilityState, numberOfLines, adjustsFontSizeToFit }: NativeProps) => {
  const resolvedStyle = flattenStyle(style);
  if (testID === "growth-level-zero-preview") capturedOnPress = onPress;
  if (testID === "profile-growth-view-all") capturedViewAllPress = onPress;
  if (testID === "growth-stage-intencion-open") capturedIntentionPress = onPress;
  return React.createElement("div", {
    "data-testid": testID,
    "data-icon": name,
    "data-color": color ?? resolvedStyle.color,
    "data-background": resolvedStyle.backgroundColor,
    "data-position": resolvedStyle.position,
    "data-left": resolvedStyle.left,
    "data-top": resolvedStyle.top,
    "data-bottom": resolvedStyle.bottom,
    "data-shadow-color": resolvedStyle.shadowColor,
    "data-shadow-opacity": resolvedStyle.shadowOpacity,
    "data-font-size": resolvedStyle.fontSize,
    "data-line-height": resolvedStyle.lineHeight,
    "data-margin-vertical": resolvedStyle.marginVertical,
    "data-margin-left": resolvedStyle.marginLeft,
    "data-margin-top": resolvedStyle.marginTop,
    "data-transform": resolvedStyle.transform ? JSON.stringify(resolvedStyle.transform) : undefined,
    "data-filter": resolvedStyle.filter,
    "data-source": source,
    "data-opacity": resolvedStyle.opacity,
    "data-pointer-events": pointerEvents,
    "data-disabled": accessibilityState?.disabled,
    "data-lines": numberOfLines,
    "data-auto-size": adjustsFontSizeToFit,
    "data-stop-opacity": stopOpacity,
    "data-padding-vertical": resolvedStyle.paddingVertical,
    "data-direction": resolvedStyle.flexDirection,
    "data-align": resolvedStyle.alignItems,
    "data-gap": resolvedStyle.gap,
    "data-wrap": resolvedStyle.flexWrap,
    "data-accessibility-role": accessibilityRole,
    "data-accessibility-label": accessibilityLabel,
    "data-height": resolvedStyle.height,
    "data-width": resolvedStyle.width,
    "data-border-radius": resolvedStyle.borderRadius,
    "data-border-width": resolvedStyle.borderWidth,
    "data-border-color": resolvedStyle.borderColor,
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
const mocks: Record<string, any> = {
  "@/context/SceneThemeContext": { useSceneTheme: () => ({ theme: { id: "tibet", gradient: TEST_GRADIENT } }) },
  "@/lib/avatar": { resolveAvatarUrl: (url: string) => url },
  "@/context/GrowthContext": { useGrowth: () => {
    const data = mocks["@/data/growthLevels"] as { growthLevels: any[]; ascentLevels: any[] };
    return {
      levels: [...data.growthLevels.map(level => ({ ...level, group: "florecimiento" })), ...data.ascentLevels.map(level => ({ ...level, group: "ascenso" }))],
      currentStage: data.growthLevels[0],
      reachedStageIds: ["intencion"], progress: null, loading: false, error: false,
    };
  } },
  "../assets/images/growth/semilla-reward-chest.png": 3,
  "../assets/images/growth/reward-avatar-moon.png": 4,
  "../assets/images/growth/reward-avatar-lotus.png": 5,
  "../assets/images/growth/reward-avatar-temple.png": 6,
  react: React,
  "react-native": {
    Animated: { View: Native },
    Image: Native,
    Platform: { OS: "web" },
    Pressable: Native,
    StyleSheet: { create: (styles: unknown) => styles, flatten: (values: unknown[]) => Object.assign({}, ...values.filter(Boolean)) },
    Text: Native,
    View: Native,
  },
  "@expo/vector-icons": { Feather: Native, MaterialCommunityIcons: Native },
  "react-native-svg": { __esModule: true, default: Native, Circle: Native, Defs: Native, RadialGradient: Native, Stop: Native },
  "expo-asset": { Asset: { fromModule: () => ({ localUri: null, downloadAsync: async () => {} }) } },
  "@/constants/colors": {
    CLOUDY_GROWTH_DAY_PILL_BACKGROUND: "rgba(128,171,231,0.20)",
    CLOUDY_GROWTH_STAGE_LABEL_COLOR: "#B5EFFF",
    CLOUDY_GROWTH_ASCENT_TOGGLE_COLOR: "#F9F9F9",
    MEMBERSHIP_AURORA: { premium: { accent: "#BE9650" } },
    POSITIONED_DAY_GRADIENT: ["#C9A6FF"],
  },
  "@/components/CinematicFadeSlide": {
    CinematicFadeSlide: ({ children }: { children?: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
  },
  "@/constants/reflectionWallBorder": wallBorderConstants,
  "@/components/DiscoverSearchBorder": {
    DiscoverSearchBorder: ({ borderWidth, borderRadius, colors, brightness, start, end }: {
      borderWidth: number; borderRadius: number; colors: string[]; brightness: number; start: unknown; end: unknown;
    }) => React.createElement("div", {
      "data-wall-border-width": borderWidth,
      "data-wall-border-radius": borderRadius,
      "data-wall-border-colors": JSON.stringify(colors),
      "data-wall-border-brightness": brightness,
      "data-wall-border-start": JSON.stringify(start),
      "data-wall-border-end": JSON.stringify(end),
    }),
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
const wallPlusModule = { exports: {} as { ReflectionWallPlusIcon: React.ComponentType<Record<string, unknown>> } };
new Function("require", "module", "exports", ts.transpileModule(
  readFileSync(new URL("../components/ReflectionWallPlusIcon.tsx", import.meta.url), "utf8"),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true } },
).outputText)((name: string) => {
  if (!(name in mocks)) throw new Error(`Missing wall plus test mock: ${name}`);
  return mocks[name];
}, wallPlusModule, wallPlusModule.exports);
mocks["@/components/ReflectionWallPlusIcon"] = wallPlusModule.exports;
const streakModule = { exports: {} as { getPositionedDayGradient: (gradient: readonly [string, string, ...string[]]) => string[] } };
new Function("require", "module", "exports", ts.transpileModule(
  readFileSync(new URL("../components/StreakWeekRow.tsx", import.meta.url), "utf8"),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true } },
).outputText)((name: string) => {
  if (name === "@react-native-masked-view/masked-view") return { __esModule: true, default: Native };
  if (name === "expo-linear-gradient") return { LinearGradient: Native };
  if (name === "@/hooks/useStreak") return { useStreak: () => ({ weekFlags: [], todayIndex: 0 }) };
  if (!(name in mocks)) throw new Error(`Missing positioned day test mock: ${name}`);
  return mocks[name];
}, streakModule, streakModule.exports);
mocks["@/components/StreakWeekRow"] = streakModule.exports;
const componentModule = { exports: {} as Record<string, React.ComponentType<Record<string, unknown>>> };
const { GrowthRow: RenderGrowthRow, GrowthTimeline } = new Function("require", "module", "exports", `${compiled}\nreturn { GrowthRow, GrowthTimeline };`)((name: string) => {
  if (!(name in mocks)) throw new Error(`Missing growth preview test mock: ${name}`);
  return mocks[name];
}, componentModule, componentModule.exports);
const GrowthRow = (props: any) => RenderGrowthRow({
  ...props,
  level: { ...props.level, rewards: props.level.rewards ?? (
    ["semilla", "crecimiento", "vegetacion", "expansion"].includes(props.level.id)
      ? [{ id: `${props.level.id}-avatars`, enabled: true, amount: 5, text: "Desbloquea {cantidad} avatares a elección" }] : []
  ) },
});

const render = (props: Record<string, unknown> = {}) => renderToStaticMarkup(
  React.createElement(componentModule.exports.GrowthLevelPreviewCard, { onPress: () => {}, ...props }),
);

test("Perfil adds Tu camino above Intención with the creativity-points heading style, preserving navigation and other callers", () => {
  let opened = false;
  const html = render({ embedded: true, canonicalVerticalInsets: true, sectionTitle: "Tu camino", titleFontSize: 15, onPress: () => { opened = true; } });
  assert.match(html, /data-testid="profile-growth-section-title"[^>]*data-color="#FFF"[^>]*data-font-size="16"[^>]*data-accessibility-role="header"[^>]*>Tu camino/);
  assert.ok(html.indexOf(">Tu camino<") < html.indexOf(">Intención<"));
  assert.match(html, /data-direction="row" data-align="center" data-gap="12"/);
  assert.ok(capturedOnPress);
  capturedOnPress();
  assert.equal(opened, true);
  const literalStyle = (file: string, name: string) => {
    const source = readFileSync(new URL(`../components/${file}.tsx`, import.meta.url), "utf8");
    const literal = source.match(new RegExp(`${name}: (\\{[^\\n]+\\})`))?.[1];
    assert.ok(literal);
    return new Function(`return (${literal});`)();
  };
  const title = literalStyle("GrowthJourney", "previewSectionTitle");
  const pointsTitle = literalStyle("CreativityPointsSection", "title");
  for (const property of ["fontFamily", "fontSize", "fontWeight"]) assert.equal(title[property], pointsTitle[property]);
  assert.doesNotMatch(render(), /profile-growth-section-title|>Tu camino</);
});

test("Perfil Tu camino shows accumulated days above the stage without a lotus beside its title", () => {
  let opened = false;
  const html = render({ embedded: true, canonicalVerticalInsets: true, sectionTitle: "Tu camino", onPress: () => { opened = true; } });
  assert.match(html, /data-testid="profile-growth-view-all"[^>]*data-accessibility-role="button"[^>]*>[\s\S]*?Ver todo/);
  assert.match(html, /data-justify-content="space-between"/);
  assert.match(html, /intention-preview-day-pill/);
  assert.match(html, />0 días</);
  assert.doesNotMatch(html, /profile-intention-name-with-lotus|profile-intention-lotus-background/);
  assert.match(html, /data-icon="spa" data-color="#BE9650"/);
  assert.ok(html.indexOf('data-icon="spa"') < html.indexOf(">Intención"));
  assert.match(html, />Intención</);
  assert.match(html, /Una práctica que comienza hoy\./);
  assert.doesNotMatch(html, /data-testid="profile-intention-description"[^>]*data-transform=/);
  assert.doesNotMatch(html, /profile-intention-chevron|data-icon="chevron-right"/);
  assert.match(html, /data-testid="growth-level-zero-preview"[^>]*data-padding-top="18" data-padding-bottom="11"/);
  assert.ok(capturedViewAllPress);
  capturedViewAllPress();
  assert.equal(opened, true);
  const original = render({ embedded: true, canonicalVerticalInsets: true });
  assert.match(original, /intention-preview-day-pill/);
  assert.match(original, />0 días</);
  assert.match(original, /profile-intention-chevron/);
  assert.match(original, /data-padding-top="20" data-padding-bottom="20"/);
  assert.doesNotMatch(original, /profile-growth-view-all|profile-intention-description|translateY&quot;:3|translateY&quot;:-3/);
});

test("Perfil uses actual accumulated days and the timeline pill's sizing for every current stage", () => {
  const growthMock = mocks["@/context/GrowthContext"];
  const original = growthMock.useGrowth;
  try {
    for (const [id, name, startDay, endDay, days] of [
      ["crecimiento", "Crecimiento", 15, 21, 16],
      ["expansion", "Expansión", 50, 56, 54],
    ] as const) {
      const stage = { id, name, startDay, endDay, story: "Descripción.", image: 1, group: "florecimiento" };
      growthMock.useGrowth = () => ({ ...original(), currentStage: stage, levels: [stage], progress: { totalActiveDays: days } });
      const html = render({ canonicalVerticalInsets: true, sectionTitle: "Tu camino" });
      const pill = html.match(/<div[^>]*data-testid="intention-preview-day-pill"[^>]*>/)?.[0] ?? "";
      assert.match(pill, /data-padding-vertical="0"/);
      assert.match(pill, /data-background="transparent"/);
      assert.match(pill, /data-border-width="0"/);
      assert.match(pill, /data-direction="row" data-align="center"/);
      assert.match(pill, /data-margin-bottom="0"/);
      const titleRow = html.match(/<div[^>]*data-testid="profile-intention-title-row"[^>]*>/)?.[0] ?? "";
      assert.match(titleRow, /data-gap="5"/);
      assert.equal((html.match(/data-gap="5"/g) ?? []).length, 2, "5px between pill and title, and title group and description");
      assert.ok(html.includes(`>${days} días<`));
      assert.ok(html.indexOf(`>${days} días<`) < html.indexOf(`>${name}<`));
      assert.doesNotMatch(html, new RegExp(`${startDay}–${endDay} días`));
      assert.equal((html.match(/data-icon="spa"/g) ?? []).length, 1);
      assert.doesNotMatch(html, /profile-intention-lotus-background/);
    }
  } finally {
    growthMock.useGrowth = original;
  }
});

test("Only Cloudy's Perfil intention day pill uses black at 16% opacity", () => {
  const sceneMock = mocks["@/context/SceneThemeContext"] as { useSceneTheme: () => { theme: { id: string } } };
  try {
    for (const id of ["cloudy", "cloudy2", "indigo2", "tibet"]) {
      sceneMock.useSceneTheme = () => ({ theme: { id, gradient: TEST_GRADIENT } });
      for (const canonicalVerticalInsets of [true, false]) {
        const html = render({ canonicalVerticalInsets });
        const pill = html.match(/<div[^>]*data-testid="intention-preview-day-pill"[^>]*>/)?.[0];
        assert.ok(pill);
        const expected = id === "cloudy" && canonicalVerticalInsets
          ? "rgba(0,0,0,0.16)" : "rgba(151,128,231,0.20)";
        assert.ok(pill.includes(`data-background="${expected}"`));
        assert.ok(!pill.includes("data-opacity="), "Only background alpha should change, not the whole pill");
      }
    }
  } finally {
    sceneMock.useSceneTheme = () => ({ theme: { id: "tibet", gradient: TEST_GRADIENT } });
  }
});

test("Cloudy's Tu camino day pills use a more sky-blue Indigo tint in both timelines, preserving other themes", () => {
  const sceneMock = mocks["@/context/SceneThemeContext"] as { useSceneTheme: () => { theme: { id: string } } };
  const levelsModule = { exports: {} as { growthLevels: any[]; ascentLevels: any[] } };
  const levelsSource = readFileSync(new URL("../data/growthLevels.ts", import.meta.url), "utf8");
  new Function("require", "exports", ts.transpileModule(levelsSource, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText)(() => 1, levelsModule.exports);
  try {
    for (const id of ["cloudy", "cloudy2", "indigo2", "tibet"]) {
      sceneMock.useSceneTheme = () => ({ theme: { id, gradient: TEST_GRADIENT } });
      for (const [florecimiento, levels] of [
        [true, levelsModule.exports.growthLevels],
        [false, levelsModule.exports.ascentLevels],
      ] as const) {
        for (const level of levels) {
          const html = renderToStaticMarkup(React.createElement(GrowthRow, {
            level, florecimiento, hasNext: true,
            status: level.id === "intencion" ? "current" : "locked",
          }));
          const pill = html.match(new RegExp(`<div[^>]*data-testid="${level.id}-day-pill"[^>]*>`))?.[0];
          assert.ok(pill);
          const expected = id === "cloudy" ? "rgba(128,171,231,0.20)" : "rgba(151,128,231,0.20)";
          assert.ok(pill.includes(`data-background="${expected}"`), `${id} / ${level.id}`);
          assert.ok(!pill.includes("data-opacity="));
        }
      }
    }
  } finally {
    sceneMock.useSceneTheme = () => ({ theme: { id: "tibet", gradient: TEST_GRADIENT } });
  }
});

test("Cloudy matches both stage labels in sky blue and uses F9F9F9 for the ascent toggle, preserving other themes", () => {
  const sceneMock = mocks["@/context/SceneThemeContext"] as { useSceneTheme: () => { theme: { id: string } } };
  for (const id of ["cloudy", "cloudy2", "indigo2", "tibet"]) {
    sceneMock.useSceneTheme = () => ({ theme: { id, gradient: TEST_GRADIENT } });
    const html = renderToStaticMarkup(React.createElement(componentModule.exports.GrowthJourney));
    const expected = id === "cloudy" ? "#B5EFFF" : "#C9A6FF";
    for (const label of ["PRIMERA ETAPA", "SEGUNDA ETAPA"]) {
      assert.match(html, new RegExp(`data-color="${expected.replace(/[()]/g, "\\$&")}"[^>]*>${label}`));
    }
    const toggleColor = id === "cloudy" ? "#F9F9F9" : "#C9A6FF";
    assert.match(html, new RegExp(`data-color="${toggleColor}"[^>]*>Ver niveles`));
    assert.match(html, new RegExp(`data-icon="chevron-down" data-color="${toggleColor}"`));
    assert.match(html, /Florecimiento/);
    assert.match(html, /El ascenso/);
  }
  sceneMock.useSceneTheme = () => ({ theme: { id: "tibet", gradient: TEST_GRADIENT } });
});

test("current and locked stage icons have identical dimensions in Tu camino", () => {
  const levels = mocks["@/data/growthLevels"].growthLevels;
  levels.push({ ...levels[0], id: "semilla", name: "Semilla", startDay: 1, endDay: 7 });
  try {
    const html = renderToStaticMarkup(React.createElement(componentModule.exports.GrowthJourney));
    for (const id of ["intencion", "semilla"]) {
      assert.match(html, new RegExp(`data-testid="${id}-stage-art"[^>]*data-height="137" data-width="137"`));
    }
  } finally {
    levels.pop();
  }
});

test("Florecimiento has no hard frame; El ascenso preserves its 7% circle independently of symbol opacity", () => {
  const image = (props: Record<string, unknown> = {}) => renderToStaticMarkup(React.createElement(componentModule.exports.GrowthLevelImage, {
    level: { id: "intencion", name: "Intención", image: 1 }, ...props,
  }));
  for (const props of [{}, { dimmed: true }, { profilePreview: true }]) {
    const html = image(props);
    const wrapper = html.slice(0, html.indexOf(">") + 1);
    assert.doesNotMatch(wrapper, /data-background/);
    assert.match(wrapper, /data-border-radius="67"/);
    assert.doesNotMatch(wrapper, /data-opacity|data-border-width|data-border-color/);
  }
  for (const id of ["intencion", "semilla", "brote", "crecimiento", "desarrollo", "enraizamiento", "vegetacion", "floracion", "expansion"]) {
    assert.doesNotMatch(image({ level: { id, name: id, image: 1 } }), /data-background/);
  }
  for (const dimmed of [false, true]) {
    const html = image({ level: { id: "ascenso-inicio", name: "Inicio", image: 1 }, dimmed });
    const wrapper = html.slice(0, html.indexOf(">") + 1);
    assert.match(wrapper, /data-background="rgba\(255,255,255,0.07\)"/);
    assert.doesNotMatch(wrapper, /data-opacity/);
  }
  assert.match(image({ dimmed: true }), /data-source="1" data-opacity="0.44"/);
  assert.doesNotMatch(image(), /data-opacity/);
  assert.doesNotMatch(image({ size: 402, height: 874, sourceModule: 2 }), /data-background|data-opacity/);
});

test("only Intención opens a detail while stage status follows real progression", () => {
  let opened = 0;
  const html = renderToStaticMarkup(React.createElement(componentModule.exports.GrowthJourney, {
    onIntentionPress: () => opened++,
  }));
  assert.match(html, /data-testid="growth-stage-intencion-open"/);
  assert.match(html, /Ver detalle de Intención/);
  capturedIntentionPress?.();
  assert.equal(opened, 1);
  for (const id of ["semilla", "brote", "crecimiento", "desarrollo", "enraizamiento", "vegetacion", "floracion", "expansion"]) {
    const row = renderToStaticMarkup(React.createElement(GrowthRow, {
      level: { id, name: id, startDay: 1, endDay: 7, image: 1, story: "Descripción." },
      hasNext: true, status: "locked", florecimiento: true,
    }));
    assert.doesNotMatch(row, /growth-stage-.+-open/);
  }
  const source = readFileSync(new URL("../components/GrowthJourney.tsx", import.meta.url), "utf8");
  assert.match(source, /onPress=\{level.id === "intencion" \? onIntentionPress : undefined\}/);
  assert.match(source, /status=\{status\(level\)\}/);
  assert.match(source, /reachedStageIds\.includes\(level.id\)/);
});

test("the detail hero stays unscaled while timeline and profile use smaller faded circles", () => {
  const image = (props: Record<string, unknown> = {}) => renderToStaticMarkup(React.createElement(componentModule.exports.GrowthLevelImage, {
    level: { id: "intencion", name: "Intención", image: 1 }, ...props,
  }));
  const detail = image({ size: 375 });
  assert.match(detail, /data-height="375" data-width="375" data-border-radius="0"/);
  assert.match(detail, /data-source="1"/);
  assert.match(image(), /data-height="100%" data-width="100%" data-border-radius="67"/);
  assert.match(image({ profilePreview: true }), /data-border-radius="67"/);
  const fullHero = image({ size: 402, height: 874, sourceModule: 2 });
  assert.match(fullHero, /data-height="874" data-width="402" data-border-radius="0"/);
  assert.match(fullHero, /data-source="2"/);
  assert.doesNotMatch(fullHero, /data-border-width|data-border-color|data-transform/);
});

test("all nine pastel stages shrink 10% without a hard frame or changes to ascent", () => {
  for (const id of ["intencion", "semilla", "brote", "crecimiento", "desarrollo", "enraizamiento", "vegetacion", "floracion", "expansion"]) {
    for (const profilePreview of [false, true]) {
      const html = renderToStaticMarkup(React.createElement(componentModule.exports.GrowthLevelImage, {
        level: { id, name: id, image: 1 }, profilePreview, dimmed: id !== "intencion",
      }));
      assert.match(html, /data-border-radius="67"/);
      assert.match(html, /data-transform="\[\{&quot;scale&quot;:0.9\}\]"/);
      assert.doesNotMatch(html, /data-border-width|data-border-color/);
      if (id !== "intencion") assert.match(html, /data-opacity="0.44"/);
    }
  }
  const ascent = renderToStaticMarkup(React.createElement(componentModule.exports.GrowthLevelImage, {
    level: { id: "ascenso-inicio", name: "Inicio", image: 1 },
  }));
  assert.match(ascent, /data-background="rgba\(255,255,255,0.07\)"/);
  assert.match(ascent, /data-border-radius="67"/);
  assert.doesNotMatch(ascent, /data-border-width|data-transform/);
});

test("Semilla displays only a larger inline filled lock and a one-line avatar reward", () => {
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
  assert.doesNotMatch(reward, /data-border-radius|data-border-width|data-border-color/);
  assert.doesNotMatch(reward, /data-background/);
  const lock = html.match(/<div[^>]*data-testid="semilla-reward-lock"[^>]*>/)?.[0];
  assert.ok(lock);
  assert.match(lock, /data-icon="lock"/);
  const source = readFileSync(new URL("../components/GrowthJourney.tsx", import.meta.url), "utf8");
  assert.match(source, /name=\{unlocked \? "lock-open-variant" : "lock"\}/);
  assert.match(lock, /data-line-height="16"/);
  assert.doesNotMatch(lock, /data-opacity=/);
  assert.match(lock, /data-height="16" data-width="16"/);
  assert.doesNotMatch(lock, /data-position="absolute"/);
  assert.match(html, /data-color="rgba\(196,194,222,0.8\)"[^>]*data-lines="1" data-auto-size="true"[^>]*>Desbloquea 5 avatares a elección/);
  assert.doesNotMatch(html, /semilla-reward-chest|data-source="3"/);
  assert.match(html, /data-opacity="0.55"/);
  assert.ok(html.indexOf(`>${semilla.story}</div>`) < html.indexOf('data-testid="semilla-reward"'));
  assert.ok(html.indexOf('data-testid="semilla-reward-lock"') < html.indexOf(">Desbloquea 5 avatares a elección</div>"));
  assert.doesNotMatch(html, /semilla-reward-avatar|semilla-reward-overlay|data-source="5"/);
  assert.doesNotMatch(html, /Regalitos sorpresa|Desbloquea tu cofre de regalos/);
  assert.doesNotMatch(html, /data-accessibility-role="button"/);
  for (const id of ["intencion", "brote", "desarrollo", "enraizamiento", "floracion", "ascenso-inicio"]) {
    const other = renderToStaticMarkup(React.createElement(GrowthRow, {
      level: { ...semilla, id }, hasNext: false, status: id === "intencion" ? "current" : "locked",
    }));
    assert.doesNotMatch(other, /data-testid="[^"]*-reward|Regalitos sorpresa/);
  }
});

test("all reward stages share the 16-point inline lock and single-line text without avatar artwork", () => {
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
    assert.doesNotMatch(reward, /data-border-radius|data-border-width|data-border-color/);
    assert.doesNotMatch(reward, /data-background/);
    const lock = html.match(new RegExp(`<div[^>]*data-testid="${id}-reward-lock"[^>]*>`))?.[0];
    assert.ok(lock, id);
    assert.match(lock, /data-icon="lock"/);
    assert.doesNotMatch(lock, /data-opacity=/);
    assert.match(lock, /data-height="16" data-width="16"/);
    assert.doesNotMatch(lock, /data-position="absolute"/);
    assert.match(html, /data-color="rgba\(196,194,222,0.8\)"[^>]*>Desbloquea 5 avatares a elección/);
    assert.doesNotMatch(html, /reward-chest|data-source="3"/);
    assert.match(html, /data-opacity="0.55"/);
    assert.ok(html.indexOf(`>${story}</div>`) < html.indexOf(`data-testid="${id}-reward"`));
    assert.doesNotMatch(html, /Regalitos sorpresa|Desbloquea tu cofre de regalos|data-accessibility-role="button"/);
    const banner = html.slice(html.indexOf(`data-testid="${id}-reward"`));
    assert.ok(banner.indexOf(`data-testid="${id}-reward-lock"`) < banner.indexOf(">Desbloquea 5 avatares a elección"));
    assert.match(banner, /data-lines="1" data-auto-size="true"/);
    assert.match(banner, new RegExp(`data-testid="${id}-reward-content"[^>]*data-direction="row" data-align="center" data-gap="6" data-wrap="nowrap"`));
    assert.match(banner, /data-opacity="0.55"/);
    assert.doesNotMatch(banner, /reward-avatar|reward-overlay|data-source="[456]"/);
    assert.match(reward, /data-opacity="0.55"/);
    assert.equal((banner.match(/data-height="35" data-width="35" data-border-radius="17.5" data-border-width="1.5" data-border-color="rgba\(255,255,255,0.2\)"/g) ?? []).length, 0);
  }
});

test("all reward locks and text are dimmed together only outside the current stage", () => {
  for (const id of ["semilla", "crecimiento", "vegetacion", "expansion"]) {
    for (const status of ["current", "locked"]) {
      const html = renderToStaticMarkup(React.createElement(GrowthRow, {
        level: { id, name: id, startDay: 1, endDay: 7, image: 1, story: "Descripción." },
        hasNext: false, status, florecimiento: true,
      }));
      const banner = html.slice(html.indexOf(`data-testid="${id}-reward"`)).split('data-testid="expansion-wall-reward"')[0];
      assert.equal((banner.match(/data-opacity="0.55"/g) ?? []).length, status === "locked" ? 1 : 0);
       assert.doesNotMatch(banner, /reward-avatar|reward-overlay/);
    }
  }
});

test("Expansion keeps its avatar reward but removes the entire watermark achievement, including accessible text and artwork", () => {
  const source = readFileSync(new URL("../components/GrowthJourney.tsx", import.meta.url), "utf8");
  assert.match(source, /numberOfLines=\{1\}\s+adjustsFontSizeToFit\s+minimumFontScale=\{0\.6\}/);
  for (const id of ["semilla", "crecimiento", "vegetacion", "expansion"]) {
    const html = renderToStaticMarkup(React.createElement(GrowthRow, {
      level: { id, name: id, startDay: 50, endDay: 56, image: 1, story: "Descripción." },
      hasNext: false, status: "locked",
    }));
    assert.doesNotMatch(html, /expansion-wall-reward|Comparte sin sello/);
    assert.match(html, /Desbloquea 5 avatares a elección/);
    assert.match(html, new RegExp(`data-testid="${id}-reward-lock"`));
  }
  assert.doesNotMatch(source, /WALL_REWARD_TEXT|WallRewardIcon|expansion-wall-reward|wallReward:|wallRewardIcon:|rewardLock:/);
});

test("Profile keeps the original wall plus artwork and rotation independently of the removed timeline achievement", () => {
  const wallSource = readFileSync(new URL("../components/InnerSpaceCard.tsx", import.meta.url), "utf8");
  const journeySource = readFileSync(new URL("../components/GrowthJourney.tsx", import.meta.url), "utf8");
  assert.match(wallSource, /<ReflectionWallPlusIcon spin=\{plusSpin\} haloValues=\{haloValues\} expanded=\{expanded\}/);
  assert.match(wallSource, /Animated.sequence\(PLUS_ROTATION_STOPS.map/);
  assert.doesNotMatch(journeySource, /ReflectionWallPlusIcon/);
  const html = renderToStaticMarkup(React.createElement(wallPlusModule.exports.ReflectionWallPlusIcon, {
    spin: { interpolate: () => "270deg" },
  }));
  assert.match(html, /data-transform="\[\{&quot;rotate&quot;:&quot;270deg&quot;\}\]"/);
  assert.match(html, /data-icon="plus"/);
});

test("all avatar reward rows move up 10px together and use the positioned day's theme-derived border hue", () => {
  const sceneMock = mocks["@/context/SceneThemeContext"] as { useSceneTheme: () => { theme: { id: string; gradient: readonly [string, string] } } };
  const originalTheme = sceneMock.useSceneTheme;
  try {
    for (const gradient of [TEST_GRADIENT, ["#211247", "#38254C"] as const]) {
      sceneMock.useSceneTheme = () => ({ theme: { id: "indigo2", gradient } });
      for (const id of ["semilla", "crecimiento", "vegetacion", "expansion"]) {
        for (const status of ["locked", "current"]) {
          const html = renderToStaticMarkup(React.createElement(GrowthRow, {
            level: { id, name: id, startDay: 1, endDay: 7, image: 1, story: "Descripción." }, status, florecimiento: true,
          }));
          const reward = html.match(new RegExp(`<div[^>]*data-testid="${id}-reward"[^>]*>`))?.[0];
          const lock = html.match(new RegExp(`<div[^>]*data-testid="${id}-reward-lock"[^>]*>`))?.[0];
          assert.ok(reward);
          assert.ok(lock);
          assert.ok(reward.includes(`data-margin-top="${12 - 10}"`));
          assert.ok(reward.includes('data-transform="[{&quot;translateY&quot;:-4}]"'));
          assert.ok(lock.includes(`data-color="${streakModule.exports.getPositionedDayGradient(gradient)[0]}"`));
          assert.match(html, /Desbloquea 5 avatares a elección/);
        }
      }
    }
  } finally {
    sceneMock.useSceneTheme = originalTheme;
  }
});

test("the current stage node uses opaque luminous violet while locked nodes keep the same translucent hue", () => {
  for (const status of ["current", "locked"]) {
    const html = renderToStaticMarkup(React.createElement(GrowthRow, {
      level: { id: "intencion", name: "Intención", startDay: 0, endDay: 0, image: 1, story: "Inicio" },
      status,
    }));
    const node = html.match(/<div[^>]*data-testid="intencion-stage-node"[^>]*>/)?.[0];
    assert.ok(node);
    assert.ok(node.includes(`data-background="${status === "current" ? "rgb(174,161,237)" : "rgba(174,161,237,0.28)"}"`));
    assert.match(node, /data-shadow-color="rgb\(174,161,237\)"/);
    assert.ok(node.includes(`data-shadow-opacity="${status === "current" ? 0.8 : 0}"`));
    assert.doesNotMatch(node, /data-opacity=|#BE9650/);
  }
});

test("Cloudy timeline circles and line use B5EFFF while preserving active and locked opacities", () => {
  const sceneMock = mocks["@/context/SceneThemeContext"];
  try {
    for (const id of ["cloudy", "cloudy2", "indigo2", "tibet"]) {
      sceneMock.useSceneTheme = () => ({ theme: { id, gradient: TEST_GRADIENT } });
      for (const status of ["current", "locked"]) {
        const html = renderToStaticMarkup(React.createElement(GrowthRow, {
          level: mocks["@/data/growthLevels"].growthLevels[0], status, florecimiento: true,
        }));
        const node = html.match(/<div[^>]*data-testid="intencion-stage-node"[^>]*>/)?.[0];
        assert.ok(node);
        const active = id === "cloudy" ? "#B5EFFF" : "rgb(174,161,237)";
        const inactive = id === "cloudy" ? "rgba(181,239,255,0.28)" : "rgba(174,161,237,0.28)";
        assert.ok(node.includes(`data-background="${status === "current" ? active : inactive}"`));
        assert.ok(node.includes(`data-shadow-color="${active}"`));
        assert.ok(node.includes(`data-shadow-opacity="${status === "current" ? 0.8 : 0}"`));
      }
      const timeline = GrowthTimeline({ children: [React.createElement(Native, { key: 1 }), React.createElement(Native, { key: 2 })] });
      const html = renderToStaticMarkup(timeline);
      const line = html.match(/<div[^>]*data-testid="growth-timeline-line"[^>]*>/)?.[0];
      assert.ok(line);
      assert.ok(line.includes(`data-background="${id === "cloudy" ? "rgba(181,239,255,0.28)" : "rgba(174,161,237,0.28)"}"`));
    }
  } finally {
    sceneMock.useSceneTheme = () => ({ theme: { id: "tibet", gradient: TEST_GRADIENT } });
  }
});

test("a single timeline line connects node centers even when reward rows have different heights", () => {
  for (const heights of [[205, 205, 205], [205, 271, 205, 301, 205, 340]]) {
    const rows = heights.map((height, index) => React.createElement(Native, {
      key: index, testID: `sample-stage-${index}`, style: { height },
    }));
    const timeline = GrowthTimeline({ children: rows });
    const [track, lastRow] = timeline.props.children;
    const [line, prefixRows] = track.props.children;
    assert.equal(line.props.testID, "growth-timeline-line");
    assert.equal(prefixRows.length, heights.length - 1);
    assert.equal(lastRow.props.testID, `sample-stage-${heights.length - 1}`);
    const trackHeight = heights.slice(0, -1).reduce((total, height) => total + height, 0);
    const lineStyle = flattenStyle(line.props.style);
    assert.equal(lineStyle.top, 103.5);
    assert.equal(trackHeight - Number(lineStyle.bottom), trackHeight + 103.5);
    assert.equal(Number(lineStyle.left) + Number(lineStyle.width) / 2, 10);
    assert.equal(lineStyle.height, undefined, "line length comes from the shared track, not a fixed row height");
    const html = renderToStaticMarkup(timeline);
    assert.equal((html.match(/data-testid="growth-timeline-line"/g) ?? []).length, 1);
  }
});

test("every timeline stage keeps its copy position and moves its artwork 30px right from the previous offset while preserving nodes", () => {
  const levelsModule = { exports: {} as { growthLevels: any[]; ascentLevels: any[] } };
  const levelsSource = readFileSync(new URL("../data/growthLevels.ts", import.meta.url), "utf8");
  new Function("require", "exports", ts.transpileModule(levelsSource, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText)(() => 1, levelsModule.exports);
  for (const [florecimiento, levels] of [
    [true, levelsModule.exports.growthLevels],
    [false, levelsModule.exports.ascentLevels],
  ] as const) {
    for (const level of levels) {
      const html = renderToStaticMarkup(React.createElement(GrowthRow, {
        level, florecimiento, status: level.id === "intencion" ? "current" : "locked",
      }));
      const copy = html.match(new RegExp(`<div[^>]*data-testid="${level.id}-copy"[^>]*>`))?.[0];
      assert.ok(copy);
      assert.ok(copy.includes(`data-margin-left="${166 + 30}"`), level.id);
      const copyContent = html.slice(html.indexOf(copy));
      assert.ok(copyContent.includes(`data-testid="${level.id}-day-pill"`));
      assert.ok(copyContent.includes(`>${level.name}</div>`));
      assert.ok(copyContent.includes(`>${level.story}</div>`));
      if (["semilla", "crecimiento", "vegetacion", "expansion"].includes(level.id)) {
        assert.ok(copyContent.includes(`data-testid="${level.id}-reward"`));
        assert.ok(copyContent.includes(`data-testid="${level.id}-reward-lock"`));
      }
      if (level.id === "expansion") {
        assert.ok(!copyContent.includes('data-testid="expansion-wall-reward"'));
      }
      const node = html.match(new RegExp(`<div[^>]*data-testid="${level.id}-stage-node"[^>]*>`))?.[0];
      assert.ok(node);
      assert.match(node, /data-left="1"/);
      assert.ok(html.includes(`data-left="${florecimiento ? 38 : 40}" data-top="${florecimiento ? 32 : 34}"`));
      const art = html.match(new RegExp(`<div[^>]*data-testid="${level.id}-stage-art"[^>]*>`))?.[0];
      assert.ok(art);
      assert.match(art, new RegExp(`data-height="${florecimiento ? 137 : 133}" data-width="${florecimiento ? 137 : 133}"`));
    }
  }
  const source = readFileSync(new URL("../components/GrowthJourney.tsx", import.meta.url), "utf8");
  assert.match(source, /copy: \{\s+marginLeft: 196,\s+flex: 1,/);
  assert.match(source, /lineBase: \{\s+position: "absolute",\s+left: 9,/);
  assert.match(source, /rewardCopy: \{ flex: 0, paddingTop: 34 \}/);
});

test("reward pills grow in normal flow and preserve nonreward and profile preview sizing", () => {
  const source = readFileSync(new URL("../components/GrowthJourney.tsx", import.meta.url), "utf8");
  assert.match(source, /rewardRow: \{ height: "auto", minHeight: GROWTH_ROW_HEIGHT/);
  assert.doesNotMatch(source, /rewardLine/);
  const pill = source.match(/reward: \{([\s\S]*?)\n  \},/)?.[1] ?? "";
  assert.doesNotMatch(pill, /position: "absolute"|height:/);
  assert.doesNotMatch(pill, /width:/);
  assert.match(pill, /alignSelf: "stretch"/);
  assert.match(pill, /marginTop: 2/);
  assert.doesNotMatch(pill, /marginLeft|marginRight|paddingHorizontal/);
  assert.match(source, /rewardCopy: \{ flex: 0, paddingTop: 34 \}/);
  const ast = ts.createSourceFile("GrowthJourney.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let copy: ts.JsxElement | undefined;
  function visit(node: ts.Node) {
    if (ts.isJsxElement(node) && node.openingElement.attributes.properties.some(
      attr => ts.isJsxAttribute(attr) && attr.name.getText(ast) === "testID"
        && attr.initializer?.getText(ast) === '{`${level.id}-copy`}',
    )) copy = node;
    ts.forEachChild(node, visit);
  }
  visit(ast);
  assert.ok(copy);
  assert.match(copy.getText(ast), /testID=\{index === 0 \? `\$\{level.id\}-reward`/);
  assert.ok(copy.getText(ast).indexOf("{level.story}") < copy.getText(ast).indexOf('testID={index === 0'));
  assert.doesNotMatch(pill, /backgroundColor|borderWidth|borderColor|borderRadius/);
  assert.match(pill, /justifyContent: "flex-start"/);
  assert.match(source, /rewardContent: \{ flexDirection: "row", alignItems: "center", maxWidth: "100%", flexShrink: 1, paddingLeft: 3, gap: 6 \}/);
  // The avatar lock now stays in normal flow, with no inset from the description.
  assert.match(source, /avatarRewardContent: \{ paddingLeft: 0, flexWrap: "nowrap" \}/);
  assert.match(copy.getText(ast), /testID=\{`\$\{level.id\}-reward-content`\} style=\{\[styles.rewardContent, styles.avatarRewardContent\]\}/);
  assert.doesNotMatch(source, /rewardAvatarOverlay|RewardArtwork|RewardAvatar|REWARD_AVATAR/);
  assert.match(source, /avatarRewardLock: \{ width: 16, height: 16, lineHeight: 16, includeFontPadding: false, flexShrink: 0 \}/);
  assert.match(pill, /minHeight: 50/);
  // Previous rendered height was 36px artwork + 16px padding + 2px border = 54px.
  assert.equal(36 + 8 * 2 + 2 - 50, 4);
  assert.match(source, /rewardText: \{ flexShrink: 1/);
  assert.match(source, /row: \{ height: GROWTH_ROW_HEIGHT/);
  assert.match(source, /previewArt: \{ width: 100, height: 100 \}/);
});

test("Profile intention uses the same smaller circular image as Tu camino without extra glow or filters", () => {
  const html = render({ canonicalVerticalInsets: true });
  const glow = html.indexOf('data-testid="profile-intention-glow"');
  const image = html.indexOf('data-testid="profile-intention-image"');
  assert.equal(glow, -1);
  assert.ok(image >= 0);
  assert.match(html, /data-source="1"/);
  assert.doesNotMatch(html, /data-filter/);
  const stops = [...html.matchAll(/data-stop-opacity="([^"]+)"/g)].map(match => Number(match[1]));
  assert.deepEqual(stops, []);
  assert.match(html, /data-testid="profile-intention-image"[^>]*data-height="100%" data-width="100%" data-border-radius="67"/);
  assert.match(html, /data-transform="\[\{&quot;scale&quot;:0.9\}\]"/);
  const source = readFileSync(new URL("../components/GrowthJourney.tsx", import.meta.url), "utf8");
  assert.match(source, /previewArt: \{ width: 100, height: 100 \}/);
  assert.match(render(), /data-border-radius="67"/);
  assert.match(render(), /data-source="1"/);
  assert.doesNotMatch(render(), /profile-intention-glow|profile-intention-image|brightness/);
});

test("only Perfil's Tu camino shrinks the intention icon by four points", () => {
  const profile = render({ embedded: true, canonicalVerticalInsets: true, sectionTitle: "Tu camino", titleFontSize: 19 });
  assert.match(profile, /data-font-size="19"[^>]*>Intención/);
  // The entrance mock omits its animated wrapper; check its sizing contract.
  const source = readFileSync(new URL("../components/GrowthJourney.tsx", import.meta.url), "utf8");
  assert.match(source, /style=\{StyleSheet\.flatten\(\[styles\.previewArt, !!sectionTitle && styles\.profilePreviewArt\]\)\}/);
  assert.match(source, /profilePreviewArt: \{ width: 96, height: 96 \}/);
  assert.match(source, /previewArt: \{ width: 100, height: 100 \}/);
});

test("GrowthLevelPreviewCard adds 4px above and below Perfil only, preserving the other callers", () => {
  const profileHtml = render({ embedded: true, canonicalVerticalInsets: true });
  assert.match(profileHtml, /data-testid="growth-level-zero-preview"[^>]*data-padding-top="20" data-padding-bottom="20"/);
  assert.match(profileHtml, /data-margin-vertical="2"/);
  const profileContent = profileHtml.slice(profileHtml.indexOf(">") + 1);
  assert.ok(profileContent.indexOf("0 días") < profileContent.indexOf("Intención"));
  assert.ok(profileContent.indexOf("Intención") < profileContent.indexOf("Una práctica que comienza hoy."));
  assert.match(profileHtml, /data-min-height="100"[^>]*data-justify-content="center"/);
  assert.doesNotMatch(profileHtml, /data-justify-content="space-between"|data-self-align="stretch"/);
  assert.match(profileHtml, /data-margin-bottom="0"/);
  assert.match(profileHtml, /data-gap="10"[^>]*data-min-height="100"/);
  assert.equal((20 - 16) * 2, 8);

  const defaultHtml = render();
  assert.match(defaultHtml, /data-testid="growth-level-zero-preview"[^>]*data-padding-top="17" data-padding-bottom="15"/);
  const defaultContent = defaultHtml.slice(defaultHtml.indexOf(">") + 1);
  assert.ok(defaultContent.indexOf("0 días") < defaultContent.indexOf("Intención"));
  assert.doesNotMatch(defaultHtml, /data-min-height="100" data-self-align="stretch"/);
});

test("Intención supports a 3-point smaller title in Perfil without changing default sizes or spacing", () => {
  const compact = render({ embedded: true, canonicalVerticalInsets: true, titleFontSize: 15 });
  assert.match(compact, /<div[^>]*data-font-size="15"[^>]*data-line-height="23"[^>]*>Intención<\/div>/);
  assert.match(render(), /<div[^>]*data-font-size="15"[^>]*data-line-height="20"[^>]*>Intención<\/div>/);
  const html = render({ embedded: true, canonicalVerticalInsets: true });
  assert.match(html, /<div[^>]*data-font-size="18"[^>]*data-line-height="23"[^>]*>Intención<\/div>/);
  assert.doesNotMatch(html, /<div[^>]*data-transform=[^>]*>Intención<\/div>/);
  const defaultHtml = render();
  assert.match(defaultHtml, /data-font-size="15"[^>]*data-line-height="20"/);
  assert.doesNotMatch(defaultHtml, /<div[^>]*data-transform=[^>]*>Intención<\/div>/);
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
  assert.match(titleRow, /data-gap="10"/);
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

test("Perfil can use a 16% black section background without changing other Intención cards", () => {
  assert.match(render({ canonicalVerticalInsets: true, backgroundColor: "rgba(0,0,0,0.16)" }), /data-background="rgba\(0,0,0,0.16\)"/);
  assert.match(render(), /data-background="rgba\(0,0,0,0.16\)"/);
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
      assert.match(html, /data-padding-vertical="4"/);
      assert.match(html, /data-testid="test-day-pill"[^>]*data-margin-bottom="10"/);
      for (const field of ["title", "description"]) {
        assert.match(html, new RegExp(`data-testid="test-stage-${field}"[^>]*data-transform="\\[\\{&quot;translateY&quot;:2\\}\\]"`));
      }
      assert.ok(html.indexOf('data-icon="spa"') < html.lastIndexOf(label));
      assert.ok(html.includes(label));
      const ascent = renderToStaticMarkup(React.createElement(GrowthRow, { level, hasNext: false, status }));
      assert.doesNotMatch(ascent, /data-icon="spa"|de racha/);
      assert.match(ascent, /data-padding-vertical="2.5"/);
    }
  }
  assert.equal((5.5 - 4) * 2, 3);
  assert.equal((4 - 2.5) * 2, 3);
  assert.doesNotMatch(render(), /data-icon="spa"|de racha|data-padding-vertical="5.5"/);
});