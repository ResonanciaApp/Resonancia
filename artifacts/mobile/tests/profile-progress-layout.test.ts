import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { URL } from "node:url";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

type NativeProps = { children?: React.ReactNode; testID?: string; style?: unknown; disabled?: boolean; accessibilityLabel?: string; accessibilityRole?: string; onPress?: () => void };
const capturedPresses = new Map<string, (() => void) | undefined>();
const flattenStyle = (style: unknown): Record<string, unknown> => Array.isArray(style)
  ? Object.assign({}, ...style.map(flattenStyle))
  : style && typeof style === "object" ? style as Record<string, unknown> : {};
const NativeView = ({ children, testID, style, disabled, accessibilityLabel, accessibilityRole, onPress }: NativeProps) => {
  if (testID) capturedPresses.set(testID, onPress);
  const resolved = flattenStyle(style);
  return React.createElement("div", {
    "data-testid": testID,
    "data-role": accessibilityRole,
    "data-action-label": accessibilityLabel,
    "data-background": resolved.backgroundColor,
    "data-disabled": disabled,
    "data-label": testID === "profile-streak-history-info" ? accessibilityLabel : undefined,
    "data-align-items": resolved.alignItems,
    "data-justify-content": resolved.justifyContent,
    "data-padding-top": resolved.paddingTop,
    "data-padding-bottom": resolved.paddingBottom,
    "data-padding-horizontal": resolved.paddingHorizontal,
    "data-self-align": resolved.alignSelf,
    "data-min-height": resolved.minHeight,
    "data-margin-bottom": resolved.marginBottom,
    "data-margin-top": resolved.marginTop,
    "data-transform": resolved.transform ? JSON.stringify(resolved.transform) : undefined,
  }, children);
};
const Passthrough = ({ children }: NativeProps) => React.createElement(React.Fragment, null, children);
const Mask = ({ children, maskElement, testID }: NativeProps & { maskElement?: React.ReactNode }) =>
  React.createElement("div", { "data-testid": testID }, maskElement, children);
const Gradient = ({ children, colors, start, end }: NativeProps & {
  colors?: string[]; start?: { x: number; y: number }; end?: { x: number; y: number };
}) => React.createElement("div", {
  "data-gradient": colors?.join(","),
  "data-start": start ? `${start.x},${start.y}` : undefined,
  "data-end": end ? `${end.x},${end.y}` : undefined,
}, children);
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
  "@react-native-masked-view/masked-view": Mask,
  "expo-linear-gradient": { LinearGradient: Gradient },
  "@/components/HistorialCalendar": {
    HistorialCalendar: ({ showCompletedSessionCount, canonicalVerticalInsets }: { showCompletedSessionCount?: boolean; canonicalVerticalInsets?: boolean }) =>
      React.createElement("div", { "data-testid": "calendar", "data-completed-count": !!showCompletedSessionCount, "data-canonical-insets": !!canonicalVerticalInsets }),
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
  "@/constants/colors": { PREMIUM_STAR_GRADIENT: ["#FFF", "#BE9650"], STREAK_HISTORY_INFO_ICON_COLOR: "#B3B3B3" },
};
const componentModule = { exports: {} as { ProgressMirrorSections: React.ComponentType<Record<string, unknown>> } };
new Function("require", "module", "exports", compiled)((name: string) => {
  if (!(name in mocks)) throw new Error(`Missing test mock: ${name}`);
  return mocks[name];
}, componentModule, componentModule.exports);

const render = (props: Record<string, unknown>) =>
  renderToStaticMarkup(React.createElement(componentModule.exports.ProgressMirrorSections, props));

test("Profile history reserves right-aligned gray dots for future streak information", () => {
  const html = render({ separateStreakHistory: true, showCalendar: false });
  const title = html.indexOf("Historial de rachas");
  const info = html.indexOf('data-testid="profile-streak-history-info"');
  const weekly = html.indexOf('data-testid="profile-streak-history-weekly"');
  assert.ok(title >= 0 && title < info && info < weekly);
  assert.match(html, /data-align-items="center" data-justify-content="space-between"/);
  assert.match(html.slice(info, weekly), /data-disabled="true"/);
  assert.match(html.slice(info, weekly), /data-align-items="flex-end"/);
  assert.match(html.slice(info, weekly), /data-icon="more-horizontal" data-color="#B3B3B3"/);
  assert.doesNotMatch(html.slice(info, weekly), /chevron-right/);
  assert.match(html.slice(info, weekly), /Información de rachas, próximamente/);
  assert.doesNotMatch(render({ separateStreakHistory: false }), /profile-streak-history-info/);
});

test("History title can be hidden independently of its information control", () => {
  const profileSource = readFileSync(new URL("../components/ProfileScreenBase.tsx", import.meta.url), "utf8");
  assert.match(profileSource, /showStreakHistoryTitle=\{false\}/);
  const html = render({ separateStreakHistory: true, showStreakHistoryTitle: false, showCalendar: false });
  assert.doesNotMatch(html, /Historial de rachas/);
  assert.match(html, /profile-streak-history-info/);
  assert.match(html, /data-justify-content="flex-end"/);
  assert.match(html, /RACHA ACTUAL/);
  assert.match(html, /RACHAS COMPLETADAS/);
  assert.match(render({ separateStreakHistory: true, showCalendar: false }), /Historial de rachas/);
});

test("Perfil retains streak figures without a heading or information dots", () => {
  const profileSource = readFileSync(new URL("../components/ProfileScreenBase.tsx", import.meta.url), "utf8");
  assert.match(profileSource, /showStreakHistoryTitle=\{false\}/);
  assert.match(profileSource, /showStreakHistoryInfo=\{false\}/);
  const html = render({
    separateStreakHistory: true, showStreakHistoryTitle: false, showStreakHistoryInfo: false, showCalendar: false,
  });
  assert.doesNotMatch(html, /Historial de rachas|profile-streak-history-info|more-horizontal/);
  assert.match(html, /profile-streak-history-weekly/);
  assert.match(html, /RACHA ACTUAL/);
  assert.match(html, /RACHAS COMPLETADAS/);
});

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
  assert.doesNotMatch(weeklyContent, />RACHA|>Tu progreso semanal|>Historial de rachas/);
  assert.match(html.slice(historyIndex), /Historial de rachas/);
  assert.match(html.slice(historyIndex), /RACHA MÁS LARGA/);
  assert.match(html.slice(historyIndex), /RACHA ACUMULADA/);
  const actualIndex = html.indexOf("RACHA ACTUAL");
  const accumulatedIndex = html.indexOf("RACHA ACUMULADA");
  const longestIndex = html.indexOf("RACHA MÁS LARGA");
  const completedIndex = html.indexOf("RACHAS COMPLETADAS");
  assert.ok(actualIndex > historyIndex);
  assert.ok(accumulatedIndex > actualIndex);
  assert.ok(longestIndex > accumulatedIndex);
  assert.ok(completedIndex > longestIndex);
  assert.match(html.slice(historyIndex, actualIndex), /<div>4<\/div>/);
  assert.match(html.slice(longestIndex, completedIndex), /<div>2<\/div>/);
  assert.ok(html.indexOf("Mis estadísticas") > historyIndex);
  assert.ok(html.indexOf('data-testid="calendar"') > html.indexOf("Mis estadísticas"));
});

test("Perfil shows titled seven-day progress on black, preserving history, Intención and calendar", () => {
  const profile = readFileSync(new URL("../components/ProfileScreenBase.tsx", import.meta.url), "utf8");
  const usage = profile.match(/<ProgressMirrorSections[\s\S]*?canonicalVerticalInsets/)?.[0] ?? "";
  assert.match(usage, /showStreakWeek\s/);
  assert.match(usage, /weeklySectionTitle="Tu progreso semanal"/);
  assert.match(usage, /weeklySectionHorizontalPadding=\{20\}/);
  assert.match(usage, /weeklySectionTitleHorizontalPadding=\{0\}/);
  assert.match(usage, /weeklySectionBackgroundColor="rgba\(0,0,0,0.16\)"/);
  assert.match(usage, /separateStreakHistory/);
  const html = render({
    separateStreakHistory: true,
    showStreakWeek: true,
    showPersonalStats: false,
    showCalendar: true,
    weeklySectionTitle: "Tu progreso semanal",
    weeklySectionHorizontalPadding: 20,
    weeklySectionTitleHorizontalPadding: 0,
    weeklySectionBackgroundColor: "rgba(0,0,0,0.16)",
    longestStreakLabel: "RACHA ACUMULADA",
    afterStreakHistory: React.createElement("div", { "data-testid": "profile-growth-intention" }, "Intención"),
  });
  assert.match(html, /seven-week-days/);
  const weekly = html.match(/<div[^>]*data-testid="profile-weekly-progress"[^>]*>/)?.[0] ?? "";
  assert.match(weekly, /data-background="rgba\(0,0,0,0.16\)"/);
  assert.ok(html.indexOf("Tu progreso semanal") < html.indexOf('data-testid="seven-week-days"'));
  assert.doesNotMatch(html, /Tu progreso esta semana/);
  assert.match(weekly, /data-padding-horizontal="20"/);
  const title = html.match(/<div[^>]*data-testid="profile-weekly-title"[^>]*>/)?.[0] ?? "";
  assert.match(title, /data-padding-horizontal="0"/);
  for (const content of ["profile-streak-history", "RACHA ACTUAL", "RACHA ACUMULADA", "RACHA MÁS LARGA", "RACHAS COMPLETADAS", "profile-growth-intention", 'data-testid="calendar"']) {
    assert.ok(html.includes(content), `Missing preserved content: ${content}`);
  }
  assert.doesNotMatch(html, /Mis estadísticas/);
});

test("Perfil aligns its weekly title with the lateral margin without changing history or other callers", () => {
  const profile = readFileSync(new URL("../components/ProfileScreenBase.tsx", import.meta.url), "utf8");
  assert.match(profile, /weeklySectionTitleHorizontalPadding=\{0\}/);
  for (const padding of [undefined, 0]) {
    const html = render({
      separateStreakHistory: true,
      showPersonalStats: false,
      showCalendar: false,
      weeklySectionTitle: "Tu progreso semanal",
      weeklySectionHorizontalPadding: 0,
      weeklySectionTitleHorizontalPadding: padding,
      sectionHorizontalPadding: 20,
    });
    const title = html.match(/<div[^>]*data-testid="profile-weekly-title"[^>]*>/)?.[0] ?? "";
    const history = html.match(/<div[^>]*data-testid="profile-streak-history"[^>]*>/)?.[0] ?? "";
    assert.match(title, new RegExp(`data-padding-horizontal="${padding ?? 20}"`));
    assert.match(history, /data-padding-horizontal="20"/);
    assert.match(html, /seven-week-days/);
  }
});

test("longest streak uses two white mountains while accumulated streak keeps its gold lotus", () => {
  const html = render({
    separateStreakHistory: true,
    showPersonalStats: false,
    showCalendar: false,
    longestStreakLabel: "RACHA ACUMULADA",
    longestStreakIconColor: "#E7B95C",
  });
  const longestLabel = html.indexOf("RACHA MÁS LARGA");
  const accumulatedLabel = html.indexOf("RACHA ACUMULADA");
  const gold = html.slice(0, accumulatedLabel + "RACHA ACUMULADA".length);
  const longestSection = html.slice(accumulatedLabel, longestLabel);
  assert.match(longestSection, /data-icon="image-filter-hdr" data-color="#F9F9F9" data-size="18"/);
  assert.match(longestSection, /<div>9<\/div>/);
  assert.doesNotMatch(longestSection, /data-icon="spa"|data-glow-color/);
  assert.match(gold, /data-icon="spa" data-color="#E7B95C" data-size="18" data-glow-color="#E7B95CCC" data-glow-radius="8" data-glow-offset="0,0"/);
  assert.match(gold, /RACHA ACUMULADA/);
});

test("completed streaks restore the white circle checkmark, preserving the count", () => {
  const html = render({
    separateStreakHistory: true,
    showPersonalStats: false,
    showCalendar: false,
  });
  const section = html.slice(html.indexOf("RACHA MÁS LARGA"), html.indexOf("RACHAS COMPLETADAS"));
  assert.match(section, /data-icon="check-circle" data-color="#F9F9F9" data-size="18"/);
  assert.doesNotMatch(section, /data-gradient|data-color="transparent"/);
  assert.match(section, /<div>2<\/div>/);
  assert.doesNotMatch(section, /data-icon="spa"|data-glow-color/);
});

test("compact callers keep their existing stats unless they opt into the full history", () => {
  const html = render({ showPersonalStats: false, showCalendar: false, longestStreakLabel: "RACHA ACUMULADA" });
  assert.match(html, /RACHA ACTUAL/);
  assert.match(html, /RACHA ACUMULADA/);
  assert.doesNotMatch(html, /Historial de rachas|profile-streak-history/);
  assert.doesNotMatch(html, /RACHAS COMPLETADAS/);
});

test("Tu progreso keeps weekly circles without streak history, calendar or Intención", () => {
  const progressSource = readFileSync(new URL("../app/progreso.tsx", import.meta.url), "utf8");
  const usage = progressSource.match(/<ProgressMirrorSections[\s\S]*?\/>/)?.[0] ?? "";
  assert.match(usage, /separateStreakHistory/);
  assert.match(usage, /weeklySectionBackgroundColor="transparent"/);
  assert.match(usage, /showStreakHistory=\{false\}/);
  assert.match(usage, /showPersonalStats=\{false\}/);
  assert.match(usage, /showCalendar=\{false\}/);
  const html = render({
    separateStreakHistory: true,
    showStreakHistory: false,
    showPersonalStats: false,
    showCalendar: false,
    weeklySectionBackgroundColor: "transparent",
    sectionHorizontalPadding: 20,
    streakHistoryTopPadding: 15,
    sectionBottomPadding: 15,
    longestStreakLabel: "RACHA ACUMULADA",
    longestStreakIconColor: "#BE9650",
  });
  assert.match(html, /seven-week-days/);
  assert.match(html, /data-background="transparent"/);
  assert.doesNotMatch(html, /RACHA|Historial de rachas|profile-streak-history|Mis estadísticas|data-testid="calendar"/);
  assert.doesNotMatch(progressSource, /GrowthLevelPreviewCard|GrowthJourneySheet/);
  assert.doesNotMatch(progressSource, /WeeklyCompletedSessions|introDivider/);
});

test("Intención has the same content insets as the streak history, without the old forced height", () => {
  const growthSource = readFileSync(new URL("../components/GrowthJourney.tsx", import.meta.url), "utf8");
  const previewStyle = growthSource.match(/previewCard:\s*\{([\s\S]*?)\n  \},/)?.[1] ?? "";
  assert.match(previewStyle, /paddingHorizontal: 20/);
  assert.match(previewStyle, /paddingTop: 17/);
  assert.match(previewStyle, /paddingBottom: 15/);
  assert.match(growthSource, /embeddedPreviewCard: \{ marginHorizontal: 0 \}/);
  assert.match(growthSource, /styles\.previewCard,\s+embedded && styles\.embeddedPreviewCard,\s+canonicalVerticalInsets && styles\.canonicalPreviewVerticalInsets/);
  assert.doesNotMatch(previewStyle, /minHeight|height:|paddingVertical/);
  assert.match(growthSource, /previewArt: \{ width: 100, height: 100 \}/);
});

test("Perfil uses 18px above Esta semana and below the day labels, matching history insets", () => {
  const source = readFileSync(new URL("../components/ProfileScreenBase.tsx", import.meta.url), "utf8");
  assert.match(source, /sectionTopPadding=\{PROFILE_WEEK_TOP_PADDING\}/);
  assert.match(source, /sectionBottomPadding=\{18\}/);
  const basePadding = Number(source.match(/const PROFILE_WEEK_TOP_PADDING = (\d+);/)?.[1]);
  const html = render({
    separateStreakHistory: true,
    sectionBackgroundColor: "rgba(0,0,0,0.22)",
    sectionTopPadding: basePadding,
    sectionBottomPadding: 18,
    sectionHorizontalPadding: 20,
    streakHistoryTopPadding: 18,
    weeklySectionBackgroundColor: "rgba(0,0,0,0.22)",
  });
  const weekly = html.match(/<div[^>]*data-testid="profile-weekly-progress"[^>]*>/)?.[0] ?? "";
  const history = html.match(/<div[^>]*data-testid="profile-streak-history"[^>]*>/)?.[0] ?? "";
  assert.match(weekly, /data-background="rgba\(0,0,0,0.22\)"/);
  assert.match(weekly, /data-padding-top="18"/);
  assert.match(weekly, /data-padding-bottom="18"/);
  assert.match(weekly, /data-padding-horizontal="20"/);
  assert.match(history, /data-background="rgba\(0,0,0,0.22\)"/);
  assert.match(history, /data-padding-top="18"/);
  assert.match(history, /data-padding-bottom="18"/);
});

test("Perfil centers number-and-label groups on their icons in all four history cells, without changing other surfaces or calendar insets", () => {
  const source = readFileSync(new URL("../components/ProfileScreenBase.tsx", import.meta.url), "utf8");
  assert.match(source, /streakHistoryTopPadding=\{18\}/);
  assert.match(source, /sectionMarginBottom=\{PROFILE_SECTION_GAP\}\s+canonicalVerticalInsets/);
  assert.match(source, /separateStreakHistory\s+centerStreakHistoryCopy/);
  const props = {
    showPersonalStats: false,
    separateStreakHistory: true,
    weeklySectionTitle: "Esta semana",
    sectionTopPadding: 18,
    sectionBottomPadding: 18,
    streakHistoryTopPadding: 18,
    canonicalVerticalInsets: true,
    showCalendar: true,
  };
  const html = render({ ...props, centerStreakHistoryCopy: true });
  assert.equal((html.match(/data-self-align="flex-end"/g) ?? []).length, 0);
  assert.equal((html.match(/data-align-items="center"[^>]*data-min-height="46"/g) ?? []).length, 4);
  assert.equal((render(props).match(/data-self-align="flex-end"/g) ?? []).length, 4);
  assert.match(html, /data-testid="calendar"[^>]*data-canonical-insets="true"/);
});

test("Perfil aligns its seven days with the section's lateral insets while Tu progreso stays full-width", () => {
  for (const [path, padding] of [
    ["../components/ProfileScreenBase.tsx", 20],
    ["../app/progreso.tsx", 0],
  ] as const) {
    const source = readFileSync(new URL(path, import.meta.url), "utf8");
    assert.match(source, new RegExp(`weeklySectionHorizontalPadding=\\{${padding}\\}`));
    assert.match(source, /sectionHorizontalPadding=\{20\}/);
    const html = render({
      separateStreakHistory: true,
      showSectionBorders: false,
      sectionHorizontalPadding: 20,
      weeklySectionHorizontalPadding: padding,
      showPersonalStats: false,
      showCalendar: false,
    });
    const weekly = html.match(/<div[^>]*data-testid="profile-weekly-progress"[^>]*>/)?.[0] ?? "";
    const history = html.match(/<div[^>]*data-testid="profile-streak-history"[^>]*>/)?.[0] ?? "";
    assert.match(weekly, new RegExp(`data-padding-horizontal="${padding}"`));
    assert.match(history, /data-padding-horizontal="20"/);
  }
});

test("Perfil moves streak history and all following content down 6px in normal flow, preserving section gaps", () => {
  const profileSource = readFileSync(new URL("../components/ProfileScreenBase.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(profileSource, /profileIntentionDescription|Todo gran cambio comienza con el primer paso|Bienvenido a Resonancia/);
  assert.match(profileSource, /profileProgressSection:\s*\{\s*marginTop: 2,/);
  assert.match(profileSource, /const PROFILE_SECTION_GAP = 21;/);
  const cardStyle = profileSource.match(/  profileCard: \{([\s\S]*?)\n  \},/)?.[1] ?? "";
  assert.match(cardStyle, /marginBottom: PROFILE_SECTION_GAP/);
  assert.doesNotMatch(cardStyle, /transform/);
  assert.doesNotMatch(profileSource, /PROFILE_PILL_WEEK_GAP|PROFILE_CARD_Y_OFFSET|PROFILE_PROGRESS_TOP_MARGIN/);
  const detailsStart = profileSource.indexOf('testID="profile-identity-details"');
  const nameIndex = profileSource.indexOf('testID="profile-identity-name"', detailsStart);
  const descriptionIndex = profileSource.indexOf('testID="profile-identity-description"', detailsStart);
  assert.ok(nameIndex > detailsStart && descriptionIndex > nameIndex, "the name stays above the saved account description");
  assert.doesNotMatch(profileSource, /<ProfileIntentionPill/);
  assert.doesNotMatch(profileSource, /testID="profile-identity-email"/);
});

test("Perfil titles its black weekly block and preserves weekly/history/calendar gaps", () => {
  const source = readFileSync(new URL("../components/ProfileScreenBase.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(source, /weeklySectionTitle="Esta semana"/);
  assert.match(source, /weeklySectionTitle="Tu progreso semanal"/);
  assert.match(source, /weeklySectionBackgroundColor="rgba\(0,0,0,0.16\)"/);
  assert.doesNotMatch(source, /streakMarginBottom=\{PROFILE_SECTION_GAP - 12\}/);
  assert.match(source, /sectionMarginBottom=\{PROFILE_SECTION_GAP\}/);
  const html = render({
    separateStreakHistory: true,
    weeklySectionTitle: "Tu progreso semanal",
    weeklySectionBackgroundColor: "rgba(0,0,0,0.16)",
    sectionBackgroundColor: "rgba(0,0,0,0.22)",
    sectionMarginBottom: 21,
    showPersonalStats: false,
    showCalendar: true,
  });
  const weekly = html.match(/<div[^>]*data-testid="profile-weekly-progress"[^>]*>/)?.[0] ?? "";
  const history = html.match(/<div[^>]*data-testid="profile-streak-history"[^>]*>/)?.[0] ?? "";
  assert.match(weekly, /data-background="rgba\(0,0,0,0.16\)"/);
  assert.match(history, /data-background="rgba\(0,0,0,0.22\)"/);
  assert.match(weekly, /data-margin-bottom="21"/);
  assert.match(history, /data-margin-bottom="21"/);
  assert.doesNotMatch(html, /Esta semana/);
  assert.match(html, /Tu progreso semanal/);
  const days = html.indexOf('data-testid="seven-week-days"');
  const historyIndex = html.indexOf('data-testid="profile-streak-history"');
  assert.ok(days >= 0 && days < historyIndex);
  assert.ok(html.indexOf('data-testid="calendar"') > historyIndex);
  assert.doesNotMatch(html.slice(0, historyIndex), /RACHA ACTUAL|RACHAS COMPLETADAS/);
});

test("the full history opens its information once, leaves stat values unchanged, and has no nested progress buttons", () => {
  let infoOpens = 0, progressOpens = 0;
  const props = {
    separateStreakHistory: true,
    showStreakHistoryTitle: false,
    showStreakHistoryInfo: false,
    onStreakTitlePress: () => progressOpens++,
    showPersonalStats: false,
    longestStreakLabel: "RACHA ACUMULADA",
  };
  const previousHtml = render(props);
  const html = render({ ...props, onStreakHistoryPress: () => infoOpens++ });
  const history = html.slice(html.indexOf('data-testid="profile-streak-history"'));
  assert.match(history, /data-role="button" data-action-label="Explicar los tipos de rachas"/);
  assert.doesNotMatch(history, /Abrir Tu progreso/);
  for (const label of ["RACHA ACTUAL", "RACHA ACUMULADA", "RACHA MÁS LARGA", "RACHAS COMPLETADAS"]) {
    assert.ok(history.includes(label));
    assert.ok(previousHtml.includes(label));
  }
  assert.ok(capturedPresses.get("profile-streak-history"));
  capturedPresses.get("profile-streak-history")!();
  assert.equal(infoOpens, 1);
  assert.equal(progressOpens, 0);
  render(props);
  assert.equal(capturedPresses.get("profile-streak-history"), undefined);
  assert.match(previousHtml, /Abrir Tu progreso/);
});

test("Perfil lowers the streak divider by 3px to its centered position without changing layout spacing", () => {
  const profileSource = readFileSync(new URL("../components/ProfileScreenBase.tsx", import.meta.url), "utf8");
  assert.match(profileSource, /streakHistoryDividerOffsetY=\{0\}/);
  const props = { separateStreakHistory: true, showPersonalStats: false };
  const divider = (html: string) => html.match(/<div[^>]*data-testid="profile-streak-history-divider"[^>]*>/)?.[0] ?? "";
  assert.match(divider(render({ ...props, streakHistoryDividerOffsetY: -3 })), /translateY&quot;:-3/);
  assert.match(divider(render(props)), /translateY&quot;:0/);
  assert.match(divider(render({ ...props, streakHistoryDividerOffsetY: 0 })), /translateY&quot;:0/);
  assert.match(source, /sectionDivider:\s*\{\s*height: 1,\s*width: "100%",\s*marginVertical: 16,/);
});

test("Perfil keeps creativity points in place while Intención moves before calendar", () => {
  const profile = readFileSync(new URL("../components/ProfileScreenBase.tsx", import.meta.url), "utf8");
  assert.match(profile, /beforeCalendar=\{\s*<>\s*<CreativityPointsSection style=\{\{ marginBottom: PROFILE_SECTION_GAP \}\} \/>/);
  assert.equal((profile.match(/<CreativityPointsSection /g) ?? []).length, 1);
  const html = render({
    separateStreakHistory: true,
    showStreakWeek: false,
    showPersonalStats: false,
    showCalendar: true,
    beforeCalendar: React.createElement(React.Fragment, null,
      React.createElement("div", { "data-testid": "profile-creativity-points" }),
      React.createElement("div", { "data-testid": "profile-growth-intention" })),
  });
  const positions = ["profile-streak-history", "profile-creativity-points", "profile-growth-intention", "calendar"]
    .map(id => html.indexOf(`data-testid="${id}"`));
  assert.ok(positions.every((position, index) => position >= 0 && (index === 0 || position > positions[index - 1])));
  assert.doesNotMatch(render({ showCalendar: false, beforeCalendar: React.createElement("div", { "data-testid": "profile-creativity-points" }) }), /profile-creativity-points/);
});

test("Perfil swaps calendar and Intención, preserving section gaps and the Tu camino action", () => {
  const profileSource = readFileSync(new URL("../components/ProfileScreenBase.tsx", import.meta.url), "utf8");
  assert.match(profileSource, /import \{ GrowthLevelPreviewCard \} from "@\/components\/GrowthJourney"/);
  const ast = ts.createSourceFile("ProfileScreenBase.tsx", profileSource, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let slot: ts.Expression | undefined;
  let journeySheet: ts.JsxSelfClosingElement | undefined;
  function visit(node: ts.Node) {
    if (ts.isJsxAttribute(node) && node.name.getText(ast) === "beforeCalendar"
      && node.initializer && ts.isJsxExpression(node.initializer)) slot = node.initializer.expression;
    if (ts.isJsxSelfClosingElement(node) && node.tagName.getText(ast) === "GrowthJourneySheet") journeySheet = node;
    ts.forEachChild(node, visit);
  }
  visit(ast);
  assert.ok(slot, "Profile passes its real preview JSX to the pre-calendar slot");
  assert.ok(journeySheet, "Profile mounts the Tu camino window");
  let sheetExpression: ts.Expression | undefined;
  for (let parent: ts.Node | undefined = journeySheet.parent; parent; parent = parent.parent) {
    if (ts.isJsxExpression(parent) && parent.expression) {
      sheetExpression ??= parent.expression;
      if (ts.isBinaryExpression(parent.expression)
        && parent.expression.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken) {
        assert.notEqual(parent.expression.left.getText(ast), "SHOW_PROFILE_PRACTICE_CARDS",
          "Tu camino must not be hidden with disabled practice cards");
      }
    }
  }
  assert.ok(sheetExpression);
  const gap = Number(profileSource.match(/const PROFILE_SECTION_GAP = (\d+);/)?.[1]);
  assert.equal(gap, 21);
  const compiled = ts.transpileModule(`
    function buildSlot(setGrowthJourneyOpen) {
      const PROFILE_SECTION_GAP = ${gap};
      return (${slot.getText(ast)});
    }
  `, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React } }).outputText;
  let pressPreview: (() => void) | undefined;
  let journeyOpen = false;
  const Preview = ({ onPress, embedded, titleFontSize }: { onPress: () => void; embedded?: boolean; titleFontSize?: number }) => {
    pressPreview = onPress;
    return React.createElement("div", { "data-testid": "growth-level-zero-preview", "data-embedded": embedded, "data-title-size": titleFontSize }, "Intención");
  };
  const Points = () => React.createElement("div", { "data-testid": "profile-creativity-points" });
  const buildSlot = new Function("React", "View", "GrowthLevelPreviewCard", "CreativityPointsSection", `${compiled}\nreturn buildSlot;`)(React, NativeView, Preview, Points);
  const html = render({
    separateStreakHistory: true,
    showPersonalStats: false,
    showCalendar: true,
    sectionMarginBottom: gap,
    beforeCalendar: buildSlot((open: boolean) => { journeyOpen = open; }),
  });
  const history = html.indexOf('data-testid="profile-streak-history"');
  const intention = html.indexOf('data-testid="profile-growth-intention"');
  const calendar = html.indexOf('data-testid="calendar"');
  const points = html.indexOf('data-testid="profile-creativity-points"');
  assert.ok(history >= 0 && history < points && points < intention && intention < calendar);
  assert.match(html, /data-testid="profile-growth-intention" data-margin-bottom="21"/);
  assert.match(html, /growth-level-zero-preview" data-embedded="true" data-title-size="15">Intención/);
  assert.ok(pressPreview);
  pressPreview();
  assert.equal(journeyOpen, true);
  const sheetCompiled = ts.transpileModule(`
    function buildSheet(dedicated, growthJourneyOpen, setGrowthJourneyOpen) {
      const SHOW_PROFILE_PRACTICE_CARDS = false;
      return (${sheetExpression.getText(ast)});
    }
  `, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React } }).outputText;
  let closeSheet: (() => void) | undefined;
  const Sheet = ({ visible, onClose }: { visible: boolean; onClose: () => void }) => {
    closeSheet = onClose;
    return visible ? React.createElement("div", { "data-testid": "tu-camino-window" }, "Tu camino") : null;
  };
  const buildSheet = new Function("React", "GrowthJourneySheet", `${sheetCompiled}\nreturn buildSheet;`)(React, Sheet);
  const setJourneyOpen = (open: boolean) => { journeyOpen = open; };
  assert.match(renderToStaticMarkup(buildSheet(true, journeyOpen, setJourneyOpen)), /tu-camino-window">Tu camino/);
  assert.equal(renderToStaticMarkup(buildSheet(false, true, setJourneyOpen)), "");
  assert.ok(closeSheet);
  closeSheet();
  assert.equal(journeyOpen, false);
  assert.equal(renderToStaticMarkup(buildSheet(true, journeyOpen, setJourneyOpen)), "");
  assert.match(profileSource, /GrowthJourneySheet visible=\{growthJourneyOpen\}/);
  assert.doesNotMatch(render({ separateStreakHistory: true, showCalendar: false }), /profile-growth-intention/);
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
  assert.doesNotMatch(html, /RACHA SEMANAL ACTUAL/);
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

test("Perfil keeps settings accessible in its sticky header and uses the 75-point avatar", () => {
  const source = readFileSync(new URL("../components/ProfileScreenBase.tsx", import.meta.url), "utf8");
  const headerStart = source.indexOf("<View style={styles.profileStickyHeaderRow}>");
  const header = source.slice(headerStart, source.indexOf("</View>", headerStart));
  assert.match(header, /testID="profile-sticky-open-settings"/);
  assert.match(header, /onPress=\{\(\) => router.push\("\/configuracion-ajustes"\)\}/);
  assert.match(header, /<Feather name="settings" size=\{21\}/);
  assert.match(header, /accessibilityLabel="Abrir ajustes"/);
  assert.match(header, /pointerEvents="none"/);
  const titleStyle = source.match(/profileStickyHeaderTitle:\s*\{([\s\S]*?)\n  \},/)?.[1] ?? "";
  const discover = readFileSync(new URL("../app/(tabs)/explore.tsx", import.meta.url), "utf8");
  const discoverTitleStyle = discover.match(/stickyTitle:\s*\{([\s\S]*?)\n  \},/)?.[1] ?? "";
  for (const property of ["position", "left", "right", "top", "fontFamily", "fontSize", "lineHeight", "fontWeight", "letterSpacing", "textAlign"]) {
    const pattern = new RegExp(`${property}:\\s*([^,\\n]+)`);
    const reference = discoverTitleStyle.match(pattern)?.[1];
    assert.ok(reference, `Descubrir defines ${property}`);
    assert.equal(titleStyle.match(pattern)?.[1], reference, `sticky title matches Descubrir: ${property}`);
  }
  assert.match(source, /avatarCircle:\s*\{\s*width: 75,\s*height: 75,\s*borderRadius: 37\.5/);
  assert.match(source, /avatarImage:\s*\{\s*width: 75,\s*height: 75,\s*borderRadius: 37\.5/);
  assert.match(source, /avatarOuterBorder:\s*\{[\s\S]*?width: 81,\s*height: 81,\s*borderRadius: 40\.5/);
});