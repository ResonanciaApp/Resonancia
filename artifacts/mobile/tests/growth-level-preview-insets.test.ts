import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { URL } from "node:url";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";
import * as wallBorderConstants from "../constants/reflectionWallBorder.ts";

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
let capturedIntentionPress: (() => void) | undefined;
const Native = ({ accessibilityLabel, accessibilityRole, children, onPress, style, testID, name, color, source, stopOpacity, pointerEvents, accessibilityState, numberOfLines, adjustsFontSizeToFit }: NativeProps) => {
  const resolvedStyle = flattenStyle(style);
  if (testID === "growth-level-zero-preview") capturedOnPress = onPress;
  if (testID === "growth-stage-intencion-open") capturedIntentionPress = onPress;
  return React.createElement("div", {
    "data-testid": testID,
    "data-icon": name,
    "data-color": color ?? resolvedStyle.color,
    "data-background": resolvedStyle.backgroundColor,
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
const mocks: Record<string, unknown> = {
  "@/context/SceneThemeContext": { useSceneTheme: () => ({ theme: { id: "tibet" } }) },
  "../assets/images/growth/00-intencion-profile-bright.png": 2,
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
    StyleSheet: { create: (styles: unknown) => styles },
    Text: Native,
    View: Native,
  },
  "@expo/vector-icons": { Feather: Native, MaterialCommunityIcons: Native },
  "react-native-svg": { __esModule: true, default: Native, Circle: Native, Defs: Native, RadialGradient: Native, Stop: Native },
  "expo-asset": { Asset: { fromModule: () => ({ localUri: null, downloadAsync: async () => {} }) } },
  "@/constants/colors": {
    CLOUDY_GROWTH_STAGE_LABEL_COLOR: "#BDBDBD",
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
const componentModule = { exports: {} as Record<string, React.ComponentType<Record<string, unknown>>> };
const GrowthRow = new Function("require", "module", "exports", `${compiled}\nreturn GrowthRow;`)((name: string) => {
  if (!(name in mocks)) throw new Error(`Missing growth preview test mock: ${name}`);
  return mocks[name];
}, componentModule, componentModule.exports);

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

test("Only Cloudy's Perfil intention day pill uses black at 16% opacity", () => {
  const sceneMock = mocks["@/context/SceneThemeContext"] as { useSceneTheme: () => { theme: { id: string } } };
  try {
    for (const id of ["cloudy", "cloudy2", "indigo2", "tibet"]) {
      sceneMock.useSceneTheme = () => ({ theme: { id } });
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
    sceneMock.useSceneTheme = () => ({ theme: { id: "tibet" } });
  }
});

test("Cloudy's Tu camino day pills use black at 16% in both timelines, preserving other themes", () => {
  const sceneMock = mocks["@/context/SceneThemeContext"] as { useSceneTheme: () => { theme: { id: string } } };
  const levelsModule = { exports: {} as { growthLevels: any[]; ascentLevels: any[] } };
  const levelsSource = readFileSync(new URL("../data/growthLevels.ts", import.meta.url), "utf8");
  new Function("require", "exports", ts.transpileModule(levelsSource, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText)(() => 1, levelsModule.exports);
  try {
    for (const id of ["cloudy", "cloudy2", "indigo2", "tibet"]) {
      sceneMock.useSceneTheme = () => ({ theme: { id } });
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
          const expected = id === "cloudy" ? "rgba(0,0,0,0.16)" : "rgba(151,128,231,0.20)";
          assert.ok(pill.includes(`data-background="${expected}"`), `${id} / ${level.id}`);
          assert.ok(!pill.includes("data-opacity="));
        }
      }
    }
  } finally {
    sceneMock.useSceneTheme = () => ({ theme: { id: "tibet" } });
  }
});

test("Cloudy uses BDBDBD for both stage labels without changing other themes or stage titles", () => {
  const sceneMock = mocks["@/context/SceneThemeContext"] as { useSceneTheme: () => { theme: { id: string } } };
  for (const id of ["cloudy", "cloudy2", "indigo2", "tibet"]) {
    sceneMock.useSceneTheme = () => ({ theme: { id } });
    const html = renderToStaticMarkup(React.createElement(componentModule.exports.GrowthJourney));
    const expected = id === "cloudy" ? "#BDBDBD" : "#C9A6FF";
    for (const label of ["PRIMERA ETAPA", "SEGUNDA ETAPA"]) {
      assert.match(html, new RegExp(`data-color="${expected.replace(/[()]/g, "\\$&")}"[^>]*>${label}`));
    }
    assert.match(html, /Florecimiento/);
    assert.match(html, /El ascenso/);
  }
  sceneMock.useSceneTheme = () => ({ theme: { id: "tibet" } });
});

test("only Intención opens a stage detail, without activating progression or linking other stages", () => {
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
  assert.match(source, /status=\{index === 0 \? "current" : "locked"\}/);
});

test("the detail hero uses full square art while default timeline and profile corners are unchanged", () => {
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
  assert.match(source, /<MaterialCommunityIcons\s+testID=\{`\$\{levelId\}-reward-lock`\}\s+name="lock"\s+size=\{16\}/);
  assert.match(lock, /data-line-height="16"/);
  assert.doesNotMatch(lock, /data-opacity=/);
  assert.match(lock, /data-height="16" data-width="16"/);
  assert.doesNotMatch(lock, /data-position="absolute"/);
  assert.match(html, /data-color="rgba\(196,194,222,0.8\)"[^>]*data-lines="1" data-auto-size="true"[^>]*>Desbloquea 50 avatares nuevos/);
  assert.doesNotMatch(html, /semilla-reward-chest|data-source="3"/);
  assert.match(html, /data-opacity="0.55"/);
  assert.ok(html.indexOf(`>${semilla.story}</div>`) < html.indexOf('data-testid="semilla-reward"'));
  assert.ok(html.indexOf('data-testid="semilla-reward-lock"') < html.indexOf(">Desbloquea 50 avatares nuevos</div>"));
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
    assert.match(html, /data-color="rgba\(196,194,222,0.8\)"[^>]*>Desbloquea 50 avatares nuevos/);
    assert.doesNotMatch(html, /reward-chest|data-source="3"/);
    assert.match(html, /data-opacity="0.55"/);
    assert.ok(html.indexOf(`>${story}</div>`) < html.indexOf(`data-testid="${id}-reward"`));
    assert.doesNotMatch(html, /Regalitos sorpresa|Desbloquea tu cofre de regalos|data-accessibility-role="button"/);
    const banner = html.slice(html.indexOf(`data-testid="${id}-reward"`));
    assert.ok(banner.indexOf(`data-testid="${id}-reward-lock"`) < banner.indexOf(">Desbloquea 50 avatares nuevos"));
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

test("Expansion shows the full avatar phrase and the actual wall plus with three translucent white halos, not photos", () => {
  const source = readFileSync(new URL("../components/GrowthJourney.tsx", import.meta.url), "utf8");
  assert.match(source, /numberOfLines=\{1\}\s+adjustsFontSizeToFit\s+minimumFontScale=\{0\.6\}/);
  for (const id of ["semilla", "crecimiento", "vegetacion", "expansion"]) {
    const html = renderToStaticMarkup(React.createElement(GrowthRow, {
      level: { id, name: id, startDay: 50, endDay: 56, image: 1, story: "Descripción." },
      hasNext: false, status: "locked",
    }));
    if (id !== "expansion") {
      assert.doesNotMatch(html, /expansion-wall-reward|Comparte sin sello/);
      continue;
    }
    assert.match(html, /Desbloquea 50 avatares nuevos/);
    assert.ok(html.indexOf(">Desbloquea 50 avatares nuevos") < html.indexOf('data-testid="expansion-wall-reward"'));
    const wall = html.slice(html.indexOf('data-testid="expansion-wall-reward"'));
    assert.match(wall, /data-opacity="0.55"/);
    assert.match(wall, /data-pointer-events="none" data-disabled="true"/);
    assert.match(wall, /data-testid="expansion-wall-reward-lock" data-icon="lock"/);
    assert.match(wall, /data-icon="plus"/);
    assert.match(wall, />Comparte sin sello de agua en Mi muro expansivo</);
    assert.doesNotMatch(wall, /data-source=|reward-cover/);
    for (const [size, opacity] of [[44, "0.06"], [34, "0.10"], [24, "0.15"]]) {
      const scaled = Number(size) * (35 / 44);
      assert.match(wall, new RegExp(`data-background="rgba\\(255, 255, 255, ${opacity}\\)"[^>]*data-height="${scaled}" data-width="${scaled}"`));
    }
    assert.equal((wall.match(/data-wall-border-width="2"/g) ?? []).length, 1);
    assert.match(wall, /data-wall-border-radius="17.5"/);
    assert.match(wall, /data-testid="expansion-wall-reward-icon"[^>]*data-height="35" data-width="35"/);
    const palette = JSON.stringify(wallBorderConstants.REFLECTION_WALL_BORDER_GRADIENT).replaceAll('"', "&quot;");
    assert.ok(wall.includes(`data-wall-border-colors="${palette}"`));
    assert.match(wall, /data-wall-border-brightness="1"/);
    assert.doesNotMatch(wall, /data-lines=/);
  }
});

test("Profile and the wall achievement reuse the same plus artwork while Profile keeps control of its original rotation", () => {
  const wallSource = readFileSync(new URL("../components/InnerSpaceCard.tsx", import.meta.url), "utf8");
  const journeySource = readFileSync(new URL("../components/GrowthJourney.tsx", import.meta.url), "utf8");
  assert.match(wallSource, /<ReflectionWallPlusIcon spin=\{plusSpin\} haloValues=\{haloValues\} expanded=\{expanded\}/);
  assert.match(wallSource, /Animated.sequence\(PLUS_ROTATION_STOPS.map/);
  assert.match(journeySource, /<ReflectionWallPlusIcon size=\{35\} scale=\{35 \/ 44\}/);
  const html = renderToStaticMarkup(React.createElement(wallPlusModule.exports.ReflectionWallPlusIcon, {
    spin: { interpolate: () => "270deg" },
  }));
  assert.match(html, /data-transform="\[\{&quot;rotate&quot;:&quot;270deg&quot;\}\]"/);
  assert.match(html, /data-icon="plus"/);
});

test("reward pills grow in normal flow and preserve nonreward and profile preview sizing", () => {
  const source = readFileSync(new URL("../components/GrowthJourney.tsx", import.meta.url), "utf8");
  assert.match(source, /rewardRow: \{ height: "auto", minHeight: GROWTH_ROW_HEIGHT/);
  assert.match(source, /rewardLine: \{ height: "100%" \}/);
  const pill = source.match(/reward: \{([\s\S]*?)\n  \},/)?.[1] ?? "";
  assert.doesNotMatch(pill, /position: "absolute"|height:/);
  assert.doesNotMatch(pill, /width:/);
  assert.match(pill, /alignSelf: "stretch"/);
  assert.match(pill, /marginTop: 12/);
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
  assert.match(copy.getText(ast), /testID=\{`\$\{level.id\}-reward`\}/);
  assert.ok(copy.getText(ast).indexOf("{level.story}") < copy.getText(ast).indexOf('testID={`${level.id}-reward`}'));
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

test("Profile intention restores the circular Tu camino artwork with its radial fade and brighter profile variant", () => {
  const html = render({ canonicalVerticalInsets: true });
  const glow = html.indexOf('data-testid="profile-intention-glow"');
  const image = html.indexOf('data-testid="profile-intention-image"');
  assert.equal(glow, -1);
  assert.ok(image >= 0);
  assert.match(html, /data-source="2"/);
  assert.doesNotMatch(html, /data-filter/);
  const stops = [...html.matchAll(/data-stop-opacity="([^"]+)"/g)].map(match => Number(match[1]));
  assert.deepEqual(stops, []);
  assert.match(html, /data-testid="profile-intention-image"[^>]*data-height="100%" data-width="100%" data-border-radius="67"/);
  const source = readFileSync(new URL("../components/GrowthJourney.tsx", import.meta.url), "utf8");
  assert.match(source, /previewArt: \{ width: 100, height: 100 \}/);
  assert.match(render(), /data-border-radius="67"/);
  assert.match(render(), /data-source="1"/);
  assert.doesNotMatch(render(), /profile-intention-glow|profile-intention-image|brightness/);
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