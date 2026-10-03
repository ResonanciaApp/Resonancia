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
  numberOfLines?: number;
  adjustsFontSizeToFit?: boolean;
};
const flattenStyle = (style: unknown): Record<string, unknown> => Array.isArray(style)
  ? Object.assign({}, ...style.map(flattenStyle))
  : style && typeof style === "object" ? style as Record<string, unknown> : {};
let capturedOnPress: (() => void) | undefined;
const Native = ({ accessibilityLabel, accessibilityRole, children, onPress, style, testID, name, color, source, stopOpacity, pointerEvents, accessibilityState, numberOfLines, adjustsFontSizeToFit }: NativeProps) => {
  const resolvedStyle = flattenStyle(style);
  if (testID === "growth-level-zero-preview") capturedOnPress = onPress;
  return React.createElement("div", {
    "data-testid": testID,
    "data-icon": name,
    "data-color": color ?? resolvedStyle.color,
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
    "data-background": resolvedStyle.backgroundColor,
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
  "../assets/images/growth/00-intencion-profile-square.png": 2,
  "../assets/images/growth/semilla-reward-chest.png": 3,
  "../assets/images/growth/reward-avatar-moon.png": 4,
  "../assets/images/growth/reward-avatar-lotus.png": 5,
  "../assets/images/growth/reward-avatar-temple.png": 6,
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

test("Semilla displays a filled lock and one lotus avatar in a disabled horizontal pill", () => {
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
  assert.match(source, /<MaterialCommunityIcons\s+testID=\{`\$\{levelId\}-reward-lock`\}\s+name="lock"\s+size=\{13\}/);
  assert.match(source, /rewardLock: \{ position: "absolute", left: -3, top: -3, width: 13, height: 13 \}/);
  assert.doesNotMatch(lock, /data-opacity=/);
  assert.match(lock, /data-height="13"/);
  assert.match(html, /data-color="rgba\(196,194,222,0.8\)"[^>]*>Desbloquea 50\navatares nuevos/);
  assert.doesNotMatch(html, /semilla-reward-chest|data-source="3"/);
  assert.match(html, /data-opacity="0.55"/);
  assert.ok(html.indexOf(`>${semilla.story}</div>`) < html.indexOf('data-testid="semilla-reward"'));
  assert.ok(html.indexOf('data-testid="semilla-reward-lock"') < html.indexOf(">Desbloquea 50\navatares nuevos</div>"));
  assert.doesNotMatch(html, /Regalitos sorpresa|Desbloquea tu cofre de regalos/);
  assert.doesNotMatch(html, /data-accessibility-role="button"/);
  for (const id of ["intencion", "brote", "desarrollo", "enraizamiento", "floracion", "ascenso-inicio"]) {
    const other = renderToStaticMarkup(React.createElement(GrowthRow, {
      level: { ...semilla, id }, hasNext: false, status: id === "intencion" ? "current" : "locked",
    }));
    assert.doesNotMatch(other, /data-testid="[^"]*-reward|Regalitos sorpresa/);
  }
});

test("Crecimiento, Vegetación and Expansión share Semilla's small filled lock and gray avatar-unlock text, without chests", () => {
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
    assert.match(lock, /data-height="13"/);
    assert.match(html, /data-color="rgba\(196,194,222,0.8\)"[^>]*>Desbloquea 50\navatares nuevos/);
    assert.doesNotMatch(html, /reward-chest|data-source="3"/);
    assert.match(html, /data-opacity="0.55"/);
    assert.ok(html.indexOf(`>${story}</div>`) < html.indexOf(`data-testid="${id}-reward"`));
    assert.doesNotMatch(html, /Regalitos sorpresa|Desbloquea tu cofre de regalos|data-accessibility-role="button"/);
    const banner = html.slice(html.indexOf(`data-testid="${id}-reward"`));
    assert.ok(banner.indexOf(`data-testid="${id}-reward-avatar"`) < banner.indexOf(`data-testid="${id}-reward-lock"`));
    assert.ok(banner.indexOf(`data-testid="${id}-reward-lock"`) < banner.indexOf(">Desbloquea 50\navatares nuevos"));
    assert.match(banner, /data-lines="2" data-auto-size="true"/);
    assert.match(banner, /data-background="rgba\(0,0,0,0.22\)"/);
    assert.match(banner, /data-opacity="0.55"/);
    assert.match(banner, /data-source="5"/);
    assert.doesNotMatch(banner, /data-source="[46]"/);
    assert.match(reward, /data-opacity="0.55"/);
    assert.equal((banner.match(/data-height="35" data-width="35" data-border-radius="17.5" data-border-width="1.5" data-border-color="rgba\(255,255,255,0.2\)"/g) ?? []).length, 1);
  }
});

test("all reward visuals are dimmed together only outside the current stage, without double-dimming the image", () => {
  for (const id of ["semilla", "crecimiento", "vegetacion", "expansion"]) {
    for (const status of ["current", "locked"]) {
      const html = renderToStaticMarkup(React.createElement(GrowthRow, {
        level: { id, name: id, startDay: 1, endDay: 7, image: 1, story: "Descripción." },
        hasNext: false, status, florecimiento: true,
      }));
      const banner = html.slice(html.indexOf(`data-testid="${id}-reward"`));
      assert.equal((banner.match(/data-opacity="0.55"/g) ?? []).length, status === "locked" ? 1 : 0);
      const avatar = banner.slice(banner.indexOf(`data-testid="${id}-reward-avatar"`));
      assert.doesNotMatch(avatar, /data-opacity=/);
    }
  }
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
  // Content inset cancels the lock's outward offset: its left edge matches the description.
  assert.match(source, /rewardLock: \{ position: "absolute", left: -3,/);
  assert.match(copy.getText(ast), /testID=\{`\$\{level.id\}-reward-content`\} style=\{styles.rewardContent\}/);
  assert.match(source, /rewardAvatarOverlay: \{[\s\S]*?position: "absolute"[\s\S]*?backgroundColor: "rgba\(0,0,0,0.22\)"/);
  assert.match(pill, /minHeight: 50/);
  // Previous rendered height was 36px artwork + 16px padding + 2px border = 54px.
  assert.equal(36 + 8 * 2 + 2 - 50, 4);
  assert.match(source, /rewardText: \{ flexShrink: 1/);
  assert.match(source, /row: \{ height: GROWTH_ROW_HEIGHT/);
  assert.match(source, /previewArt: \{ width: 100, height: 100 \}/);
});

test("Profile intention uses square artwork with 18px corners and no glow or gradient", () => {
  const html = render({ canonicalVerticalInsets: true });
  const glow = html.indexOf('data-testid="profile-intention-glow"');
  const image = html.indexOf('data-testid="profile-intention-image"');
  assert.equal(glow, -1);
  assert.ok(image >= 0);
  assert.match(html, /data-source="2"/);
  assert.doesNotMatch(html, /data-filter/);
  const stops = [...html.matchAll(/data-stop-opacity="([^"]+)"/g)].map(match => Number(match[1]));
  assert.deepEqual(stops, []);
  assert.match(html, /data-testid="profile-intention-image"[^>]*data-height="100%" data-width="100%" data-border-radius="18"/);
  const source = readFileSync(new URL("../components/GrowthJourney.tsx", import.meta.url), "utf8");
  assert.match(source, /previewArt: \{ width: 100, height: 100 \}/);
  assert.match(render(), /data-border-radius="67"/);
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