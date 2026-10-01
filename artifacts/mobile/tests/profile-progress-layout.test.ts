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
    streakHistoryTopPadding: 17,
    sectionBottomPadding: 15,
    longestStreakLabel: "RACHA ACUMULADA",
    longestStreakIconColor: "#BE9650",
  });
  assert.match(html, /seven-week-days/);
  assert.match(html, /data-background="transparent"/);
  assert.doesNotMatch(html, /RACHA|Historial de rachas|profile-streak-history|Mis estadísticas|data-testid="calendar"/);
  assert.doesNotMatch(progressSource, /GrowthLevelPreviewCard|GrowthJourneySheet/);
  assert.match(progressSource, /<WeeklyCompletedSessions \/>/);
});

test("Intención has the same content insets as the streak history, without the old forced height", () => {
  const growthSource = readFileSync(new URL("../components/GrowthJourney.tsx", import.meta.url), "utf8");
  const previewStyle = growthSource.match(/previewCard:\s*\{([\s\S]*?)\n  \},/)?.[1] ?? "";
  assert.match(previewStyle, /paddingHorizontal: 20/);
  assert.match(previewStyle, /paddingTop: 17/);
  assert.match(previewStyle, /paddingBottom: 15/);
  assert.match(growthSource, /embeddedPreviewCard: \{ marginHorizontal: 0 \}/);
  assert.match(growthSource, /style=\{\[styles\.previewCard, embedded && styles\.embeddedPreviewCard\]\}/);
  assert.doesNotMatch(previewStyle, /minHeight|height:|paddingVertical/);
  assert.match(growthSource, /previewArt: \{ width: 100, height: 100 \}/);
});

test("Perfil reduces Esta semana height by 5px from the top while retaining other section insets", () => {
  const source = readFileSync(new URL("../components/ProfileScreenBase.tsx", import.meta.url), "utf8");
  assert.match(source, /sectionTopPadding=\{PROFILE_WEEK_TOP_PADDING - 5\}/);
  const basePadding = Number(source.match(/const PROFILE_WEEK_TOP_PADDING = (\d+);/)?.[1]);
  const html = render({
    separateStreakHistory: true,
    sectionBackgroundColor: "rgba(0,0,0,0.22)",
    sectionTopPadding: basePadding - 5,
    sectionBottomPadding: 15,
    sectionHorizontalPadding: 20,
    streakHistoryTopPadding: 17,
    weeklySectionBackgroundColor: "rgba(0,0,0,0.22)",
  });
  const weekly = html.match(/<div[^>]*data-testid="profile-weekly-progress"[^>]*>/)?.[0] ?? "";
  const history = html.match(/<div[^>]*data-testid="profile-streak-history"[^>]*>/)?.[0] ?? "";
  assert.match(weekly, /data-background="rgba\(0,0,0,0.22\)"/);
  assert.match(weekly, /data-padding-top="16"/);
  assert.match(weekly, /data-padding-bottom="15"/);
  assert.match(weekly, /data-padding-horizontal="20"/);
  assert.match(history, /data-background="rgba\(0,0,0,0.22\)"/);
  assert.match(history, /data-padding-top="17"/);
});

test("Perfil aligns weekly circles with the section inset while Tu progreso keeps its full-width row", () => {
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

test("Perfil uses the standard section gap after the user card without legacy offsets", () => {
  const profileSource = readFileSync(new URL("../components/ProfileScreenBase.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(profileSource, /profileIntentionDescription|Todo gran cambio comienza con el primer paso|Bienvenido a Resonancia/);
  assert.match(profileSource, /profileProgressSection:\s*\{\s*marginTop: 0,/);
  assert.match(profileSource, /const PROFILE_SECTION_GAP = 21;/);
  const cardStyle = profileSource.match(/  profileCard: \{([\s\S]*?)\n  \},/)?.[1] ?? "";
  assert.match(cardStyle, /marginBottom: PROFILE_SECTION_GAP/);
  assert.doesNotMatch(cardStyle, /transform/);
  assert.doesNotMatch(profileSource, /PROFILE_PILL_WEEK_GAP|PROFILE_CARD_Y_OFFSET|PROFILE_PROGRESS_TOP_MARGIN/);
  const detailsStart = profileSource.indexOf('testID="profile-identity-details"');
  const emailIndex = profileSource.indexOf('testID="profile-identity-email"', detailsStart);
  const pillIndex = profileSource.indexOf("<ProfileIntentionPill", detailsStart);
  assert.ok(emailIndex > detailsStart && pillIndex > emailIndex, "email stays above the pill");
});

test("Perfil gives Esta semana its own background and matches weekly/history and history/calendar gaps", () => {
  const source = readFileSync(new URL("../components/ProfileScreenBase.tsx", import.meta.url), "utf8");
  assert.match(source, /weeklySectionTitle="Esta semana"/);
  assert.match(source, /weeklySectionBackgroundColor="rgba\(0,0,0,0.22\)"/);
  assert.doesNotMatch(source, /streakMarginBottom=\{PROFILE_SECTION_GAP - 12\}/);
  assert.match(source, /sectionMarginBottom=\{PROFILE_SECTION_GAP\}/);
  const html = render({
    separateStreakHistory: true,
    weeklySectionTitle: "Esta semana",
    weeklySectionBackgroundColor: "rgba(0,0,0,0.22)",
    sectionBackgroundColor: "rgba(0,0,0,0.22)",
    sectionMarginBottom: 21,
    showPersonalStats: false,
    showCalendar: true,
  });
  const weekly = html.match(/<div[^>]*data-testid="profile-weekly-progress"[^>]*>/)?.[0] ?? "";
  const history = html.match(/<div[^>]*data-testid="profile-streak-history"[^>]*>/)?.[0] ?? "";
  assert.match(weekly, /data-background="rgba\(0,0,0,0.22\)"/);
  assert.match(weekly, /data-margin-bottom="21"/);
  assert.match(history, /data-margin-bottom="21"/);
  const title = html.indexOf("Esta semana");
  const days = html.indexOf('data-testid="seven-week-days"');
  const historyIndex = html.indexOf('data-testid="profile-streak-history"');
  assert.ok(title >= 0 && title < days && days < historyIndex);
  assert.ok(html.indexOf('data-testid="calendar"') > historyIndex);
  assert.doesNotMatch(html.slice(0, historyIndex), /RACHA ACTUAL|RACHAS COMPLETADAS/);
});

test("Perfil puts the same Intención preview after streak history and before calendar, opening Tu camino", () => {
  const profileSource = readFileSync(new URL("../components/ProfileScreenBase.tsx", import.meta.url), "utf8");
  assert.match(profileSource, /import \{ GrowthLevelPreviewCard \} from "@\/components\/GrowthJourney"/);
  const ast = ts.createSourceFile("ProfileScreenBase.tsx", profileSource, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let slot: ts.Expression | undefined;
  let journeySheet: ts.JsxSelfClosingElement | undefined;
  function visit(node: ts.Node) {
    if (ts.isJsxAttribute(node) && node.name.getText(ast) === "afterStreakHistory"
      && node.initializer && ts.isJsxExpression(node.initializer)) slot = node.initializer.expression;
    if (ts.isJsxSelfClosingElement(node) && node.tagName.getText(ast) === "GrowthJourneySheet") journeySheet = node;
    ts.forEachChild(node, visit);
  }
  visit(ast);
  assert.ok(slot, "Profile passes its real preview JSX to the post-history slot");
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
  const Preview = ({ onPress, embedded }: { onPress: () => void; embedded?: boolean }) => {
    pressPreview = onPress;
    return React.createElement("div", { "data-testid": "growth-level-zero-preview", "data-embedded": embedded }, "Intención");
  };
  const buildSlot = new Function("React", "View", "GrowthLevelPreviewCard", `${compiled}\nreturn buildSlot;`)(React, NativeView, Preview);
  const html = render({
    separateStreakHistory: true,
    showPersonalStats: false,
    showCalendar: true,
    sectionMarginBottom: gap,
    afterStreakHistory: buildSlot((open: boolean) => { journeyOpen = open; }),
  });
  const history = html.indexOf('data-testid="profile-streak-history"');
  const intention = html.indexOf('data-testid="profile-growth-intention"');
  const calendar = html.indexOf('data-testid="calendar"');
  assert.ok(history >= 0 && history < intention && intention < calendar);
  assert.match(html, /data-testid="profile-growth-intention" data-margin-bottom="21"/);
  assert.match(html, /growth-level-zero-preview" data-embedded="true">Intención/);
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

test("Perfil keeps settings accessible in its sticky header and uses the compact 96-point avatar", () => {
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
  assert.match(source, /avatarCircle:\s*\{\s*width: 96,\s*height: 96,\s*borderRadius: 48/);
  assert.match(source, /avatarImage:\s*\{\s*width: 96,\s*height: 96,\s*borderRadius: 48/);
  assert.match(source, /avatarOuterBorder:\s*\{[\s\S]*?width: 102,\s*height: 102,\s*borderRadius: 51/);
});