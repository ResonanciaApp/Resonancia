import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { URL } from "node:url";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

type NativeProps = { children?: React.ReactNode; testID?: string; style?: unknown };
const flattenStyle = (style: unknown): Record<string, unknown> => Array.isArray(style)
  ? Object.assign({}, ...style.map(flattenStyle))
  : style && typeof style === "object" ? style as Record<string, unknown> : {};
const NativeView = ({ children, testID, style }: NativeProps) => {
  const resolved = flattenStyle(style);
  return React.createElement("div", {
    "data-testid": testID,
    "data-background": resolved.backgroundColor,
    "data-padding-top": resolved.paddingTop,
    "data-padding-bottom": resolved.paddingBottom,
    "data-padding-horizontal": resolved.paddingHorizontal,
    "data-min-height": resolved.minHeight,
    "data-margin-bottom": resolved.marginBottom,
  }, children);
};
const Passthrough = ({ children }: NativeProps) => React.createElement(React.Fragment, null, children);
const Icon = ({ name, color, style, size }: { name?: string; color?: string; style?: unknown; size?: number }) => {
  const resolved = flattenStyle(style);
  const offset = resolved.textShadowOffset as { width: number; height: number } | undefined;
  return React.createElement("i", {
    "data-icon": name,
    "data-color": color,
    "data-size": size,
    "data-glow-color": resolved.textShadowColor,
    "data-glow-radius": resolved.textShadowRadius,
    "data-glow-offset": offset ? `${offset.width},${offset.height}` : undefined,
  });
};
const source = readFileSync(new URL("../components/ProgressMirrorSections.tsx", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true },
}).outputText;
const mocks: Record<string, unknown> = {
  react: React,
  "react-native": {
    View: NativeView, Text: NativeView, Pressable: NativeView,
    StyleSheet: { create: (styles: unknown) => styles },
    Animated: { View: NativeView, Value: class { constructor(_value: number) {} } },
  },
  "@expo/vector-icons": { Feather: Icon, MaterialCommunityIcons: Icon },
  "@react-native-masked-view/masked-view": Passthrough,
  "expo-linear-gradient": { LinearGradient: Passthrough },
  "@/components/HistorialCalendar": {
    HistorialCalendar: ({ showCompletedSessionCount }: { showCompletedSessionCount?: boolean }) =>
      React.createElement("div", { "data-testid": "calendar", "data-completed-count": !!showCompletedSessionCount }),
  },
  "@/components/CinematicFadeSlide": { CinematicFadeSlide: Passthrough },
  "@/components/StreakWeekRow": {
    StreakWeekRow: () => React.createElement("div", { "data-testid": "seven-week-days" }, "L M M J V S D"),
  },
  "@/context/PlayerContext": { usePlayer: () => ({ statEvents: [] }) },
  "@/context/SceneThemeContext": { useSceneTheme: () => ({ theme: { accent: "#BE9650", gradient: ["#060A0F"] } }) },
  "@/hooks/useDayRollover": { useDayRollover: () => "2026-09-30" },
  "@/hooks/useStreak": { useStreak: () => ({ currentStreak: 3, weekCount: 4, completedWeeks: 2 }) },
  "@/hooks/useColors": { useColors: () => ({ foreground: "#FFF", accent: "#BE9650" }) },
  "@/utils/stats": { computeActiveDays: () => 0, computeMaxStreak: () => 9 },
  "@/constants/colors": { PREMIUM_STAR_GRADIENT: ["#FFF", "#BE9650"] },
};
const componentModule = { exports: {} as { ProgressMirrorSections: React.ComponentType<Record<string, unknown>> } };
new Function("require", "module", "exports", compiled)((name: string) => {
  if (!(name in mocks)) throw new Error(`Missing test mock: ${name}`);
  return mocks[name];
}, componentModule, componentModule.exports);

const render = (props: Record<string, unknown>) =>
  renderToStaticMarkup(React.createElement(componentModule.exports.ProgressMirrorSections, props));

test("Perfil separates week-only progress from the titled streak history", () => {
  const html = render({
    separateStreakHistory: true,
    streakTitle: "Tu progreso semanal",
    longestStreakLabel: "RACHA ACUMULADA",
    longestStreakIconColor: "#BE9650",
  });
  const historyIndex = html.indexOf('data-testid="profile-streak-history"');
  assert.ok(historyIndex > html.indexOf('data-testid="profile-weekly-progress"'));
  const weeklyContent = html.slice(0, historyIndex);
  assert.match(weeklyContent, /seven-week-days/);
  assert.doesNotMatch(weeklyContent, /RACHA|Tu progreso semanal|Historial de rachas/);
  assert.match(html.slice(historyIndex), /Historial de rachas/);
  assert.match(html.slice(historyIndex), /RACHA MÁS LARGA/);
  assert.match(html.slice(historyIndex), /RACHA ACUMULADA/);
  const actualIndex = html.indexOf("RACHA ACTUAL");
  const completedIndex = html.indexOf("RACHAS COMPLETADAS");
  assert.ok(actualIndex > historyIndex);
  assert.ok(completedIndex > actualIndex);
  assert.ok(html.indexOf("RACHA MÁS LARGA") > completedIndex);
  assert.ok(html.indexOf("RACHA ACUMULADA") > html.indexOf("RACHA MÁS LARGA"));
  assert.match(html.slice(historyIndex, actualIndex), /<div>4<\/div>/);
  assert.match(html.slice(actualIndex, completedIndex), /<div>2<\/div>/);
  assert.ok(html.indexOf("Mis estadísticas") > historyIndex);
  assert.ok(html.indexOf('data-testid="calendar"') > html.indexOf("Mis estadísticas"));
});

test("longest streak has a violet lotus with the same glow as the accumulated streak gold lotus", () => {
  const html = render({
    separateStreakHistory: true,
    showPersonalStats: false,
    showCalendar: false,
    longestStreakLabel: "RACHA ACUMULADA",
    longestStreakIconColor: "#E7B95C",
  });
  const longestLabel = html.indexOf("RACHA MÁS LARGA");
  const gold = html.slice(longestLabel);
  assert.match(html.slice(0, longestLabel), /data-icon="spa" data-color="#C9A6FF" data-size="18" data-glow-color="#C9A6FFCC" data-glow-radius="8" data-glow-offset="0,0"/);
  assert.match(gold, /data-icon="spa" data-color="#E7B95C" data-size="18" data-glow-color="#E7B95CCC" data-glow-radius="8" data-glow-offset="0,0"/);
  assert.match(gold, /RACHA ACUMULADA/);
});

test("compact callers keep their existing stats unless they opt into the full history", () => {
  const html = render({ showPersonalStats: false, showCalendar: false, longestStreakLabel: "RACHA ACUMULADA" });
  assert.match(html, /RACHA ACTUAL/);
  assert.match(html, /RACHA ACUMULADA/);
  assert.doesNotMatch(html, /Historial de rachas|profile-streak-history/);
  assert.doesNotMatch(html, /RACHAS COMPLETADAS/);
});

test("Tu progreso separates the weekly circles and mirrors the full Perfil streak history", () => {
  const progressSource = readFileSync(new URL("../app/progreso.tsx", import.meta.url), "utf8");
  const usage = progressSource.match(/<ProgressMirrorSections[\s\S]*?\/>/)?.[0] ?? "";
  assert.match(usage, /separateStreakHistory/);
  assert.match(usage, /weeklySectionBackgroundColor="transparent"/);
  assert.match(usage, /streakHistoryTopPadding=\{17\}/);
  assert.match(usage, /showPersonalStats=\{false\}/);
  assert.match(usage, /showCalendar=\{false\}/);
  const html = render({
    separateStreakHistory: true,
    showPersonalStats: false,
    showCalendar: false,
    weeklySectionBackgroundColor: "transparent",
    sectionHorizontalPadding: 20,
    streakHistoryTopPadding: 17,
    sectionBottomPadding: 15,
    longestStreakLabel: "RACHA ACUMULADA",
    longestStreakIconColor: "#BE9650",
  });
  const historyIndex = html.indexOf('data-testid="profile-streak-history"');
  const week = html.slice(0, historyIndex);
  const history = html.slice(historyIndex);
  assert.match(week, /seven-week-days/);
  assert.match(week, /data-background="transparent"/);
  assert.doesNotMatch(week, /RACHA|Historial de rachas/);
  assert.match(history, /Historial de rachas/);
  for (const label of ["RACHA ACTUAL", "RACHAS COMPLETADAS", "RACHA MÁS LARGA", "RACHA ACUMULADA"]) {
    assert.match(history, new RegExp(label));
  }
  assert.doesNotMatch(history, /seven-week-days|Mis estadísticas|data-testid="calendar"/);
  assert.match(history, /data-padding-top="17"/);
  assert.match(history, /data-padding-bottom="15"/);
  assert.match(history, /data-padding-horizontal="20"/);
});

test("Intención has the same content insets as the streak history, without the old forced height", () => {
  const growthSource = readFileSync(new URL("../components/GrowthJourney.tsx", import.meta.url), "utf8");
  const previewStyle = growthSource.match(/previewCard:\s*\{([\s\S]*?)\n  \},/)?.[1] ?? "";
  assert.match(previewStyle, /paddingHorizontal: 20/);
  assert.match(previewStyle, /paddingTop: 17/);
  assert.match(previewStyle, /paddingBottom: 15/);
  assert.doesNotMatch(previewStyle, /minHeight|height:|paddingVertical/);
  assert.match(growthSource, /previewArt: \{ width: 100, height: 100 \}/);
});

test("Perfil removes only the weekly background and reduces history top padding by four", () => {
  const html = render({
    separateStreakHistory: true,
    sectionBackgroundColor: "rgba(0,0,0,0.22)",
    sectionTopPadding: 21,
    streakHistoryTopPadding: 17,
    weeklySectionBackgroundColor: "transparent",
  });
  const weekly = html.match(/<div[^>]*data-testid="profile-weekly-progress"[^>]*>/)?.[0] ?? "";
  const history = html.match(/<div[^>]*data-testid="profile-streak-history"[^>]*>/)?.[0] ?? "";
  assert.match(weekly, /data-background="transparent"/);
  assert.match(weekly, /data-padding-top="21"/);
  assert.match(history, /data-background="rgba\(0,0,0,0.22\)"/);
  assert.match(history, /data-padding-top="17"/);
});

test("Perfil and Tu progreso extend weekly circles to the outer margins without widening history contents", () => {
  for (const path of ["../components/ProfileScreenBase.tsx", "../app/progreso.tsx"]) {
    const source = readFileSync(new URL(path, import.meta.url), "utf8");
    assert.match(source, /weeklySectionHorizontalPadding=\{0\}/);
    assert.match(source, /sectionHorizontalPadding=\{20\}/);
  }
  const html = render({
    separateStreakHistory: true,
    showSectionBorders: false,
    sectionHorizontalPadding: 20,
    weeklySectionHorizontalPadding: 0,
    showPersonalStats: false,
    showCalendar: false,
  });
  const weekly = html.match(/<div[^>]*data-testid="profile-weekly-progress"[^>]*>/)?.[0] ?? "";
  const history = html.match(/<div[^>]*data-testid="profile-streak-history"[^>]*>/)?.[0] ?? "";
  assert.match(weekly, /data-padding-horizontal="0"/);
  assert.match(history, /data-padding-horizontal="20"/);
});

test("Perfil hides the intention description and leaves exactly 20px from the pill to the weekly circles", () => {
  const profileSource = readFileSync(new URL("../components/ProfileScreenBase.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(profileSource, /profileIntentionDescription|Todo gran cambio comienza con el primer paso|Bienvenido a Resonancia/);
  assert.match(profileSource, /profileProgressSection:\s*\{\s*marginTop: PROFILE_PROGRESS_TOP_MARGIN,/);
  assert.match(profileSource, /const PROFILE_SECTION_GAP = 21;/);
  const constants = [
    "PROFILE_PILL_WEEK_GAP",
    "PROFILE_CARD_BOTTOM_PADDING",
    "PROFILE_CARD_BOTTOM_MARGIN",
    "PROFILE_WEEK_TOP_PADDING",
    "PROFILE_CARD_Y_OFFSET",
  ];
  const values = constants.map((name) => Number(profileSource.match(new RegExp(`const ${name} = (-?\\d+);`))?.[1]));
  assert.ok(values.every(Number.isFinite));
  const marginExpression = profileSource.match(/const PROFILE_PROGRESS_TOP_MARGIN\s*=\s*([\s\S]*?);/)?.[1];
  assert.ok(marginExpression);
  const margin = new Function(...constants, `return (${marginExpression});`)(...values);
  const [gap, padding, cardMargin, weekPadding, cardOffset] = values;
  assert.equal(gap, 20);
  assert.equal(padding + cardMargin + margin + weekPadding - cardOffset, 20);
  const detailsStart = profileSource.indexOf("<View style={styles.profileDetails}>");
  const locationIndex = profileSource.indexOf("{location ? (", detailsStart);
  const pillIndex = profileSource.indexOf("<ProfileIntentionPill", detailsStart);
  assert.ok(locationIndex > detailsStart && pillIndex > locationIndex, "optional location stays above the pill");
});

test("Perfil raises streak history and the following sections 12px without moving the weekly circles", () => {
  const source = readFileSync(new URL("../components/ProfileScreenBase.tsx", import.meta.url), "utf8");
  assert.match(source, /streakMarginBottom=\{PROFILE_SECTION_GAP - 12\}/);
  assert.match(source, /sectionMarginBottom=\{PROFILE_SECTION_GAP\}/);
  const html = render({
    separateStreakHistory: true,
    sectionMarginBottom: 21,
    streakMarginBottom: 9,
    showPersonalStats: false,
    showCalendar: true,
  });
  const weekly = html.match(/<div[^>]*data-testid="profile-weekly-progress"[^>]*>/)?.[0] ?? "";
  const history = html.match(/<div[^>]*data-testid="profile-streak-history"[^>]*>/)?.[0] ?? "";
  assert.match(weekly, /data-margin-bottom="9"/);
  assert.match(history, /data-margin-bottom="21"/);
});

test("Perfil hides personal stats and the divider above the week while retaining history and calendar", () => {
  const profileSource = readFileSync(new URL("../components/ProfileScreenBase.tsx", import.meta.url), "utf8");
  assert.match(profileSource, /showPersonalStats=\{false\}/);
  assert.doesNotMatch(profileSource, /profile-description-week-divider|profileProgressDivider/);
  const html = render({
    separateStreakHistory: true, showPersonalStats: false, showCalendar: true, showCalendarCompletedCount: true,
  });
  assert.doesNotMatch(html, /Mis estadísticas|MINUTOS TOTALES|DÍAS ACTIVOS/);
  assert.match(html, /Historial de rachas/);
  assert.match(html, /RACHA ACTUAL/);
  assert.match(html, /RACHAS COMPLETADAS/);
  assert.match(html, /RACHA MÁS LARGA/);
  assert.match(html, /seven-week-days/);
  assert.match(html, /data-testid="calendar"/);
  assert.match(html, /data-completed-count="true"/);
  assert.match(profileSource, /showCalendarCompletedCount/);
});

test("settings statistics contain the existing stats and range filter without streaks or calendar", () => {
  const html = render({ showPersonalStats: true, showStreakSection: false, showCalendar: false });
  assert.match(html, /Mis estadísticas/);
  assert.match(html, /MINUTOS TOTALES/);
  assert.match(html, /DÍAS ACTIVOS/);
  assert.match(html, /Últimos 30 días/);
  assert.doesNotMatch(html, /RACHA|Historial de rachas|seven-week-days|data-testid="calendar"/);
  const settingsSource = readFileSync(new URL("../components/ProfileSettingsSections.tsx", import.meta.url), "utf8");
  const statisticsIndex = settingsSource.indexOf('testID="settings-personal-statistics"');
  assert.ok(statisticsIndex > 0);
  assert.match(settingsSource.slice(statisticsIndex), /Estadísticas personales/);
  assert.ok(statisticsIndex < settingsSource.indexOf("{visibleSections.map"));
  assert.match(settingsSource.slice(statisticsIndex), /showStreakSection=\{false\}/);
  assert.match(settingsSource, /label: "Personalizar notificaciones"/);
});

test("Perfil keeps settings accessible in its sticky header and reduces the avatar by 20px", () => {
  const source = readFileSync(new URL("../components/ProfileScreenBase.tsx", import.meta.url), "utf8");
  const headerStart = source.indexOf("<View style={styles.profileStickyHeaderRow}>");
  const header = source.slice(headerStart, source.indexOf("</View>", headerStart));
  assert.match(header, /testID="profile-sticky-open-settings"/);
  assert.match(header, /onPress=\{\(\) => router.push\("\/configuracion-ajustes"\)\}/);
  assert.match(header, /<Feather name="settings" size=\{21\}/);
  assert.match(header, /accessibilityLabel="Abrir ajustes"/);
  assert.match(source, /avatarCircle:\s*\{\s*width: 106,\s*height: 106,\s*borderRadius: 53/);
  assert.match(source, /avatarImage:\s*\{\s*width: 106,\s*height: 106,\s*borderRadius: 53/);
  assert.match(source, /avatarOuterBorder:\s*\{[\s\S]*?width: 112,\s*height: 112,\s*borderRadius: 56/);
});