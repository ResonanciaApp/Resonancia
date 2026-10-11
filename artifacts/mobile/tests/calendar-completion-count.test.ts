import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { URL } from "node:url";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";
import { dedupeCompletedHistoryByDay, formatCompletedSessionCount } from "../lib/history-calendar.ts";
import { dayKey } from "../utils/stats.ts";

type Props = { children?: React.ReactNode; testID?: string; style?: unknown };
const flattenStyle = (style: unknown): Record<string, unknown> => Array.isArray(style)
  ? Object.assign({}, ...style.map(flattenStyle))
  : style && typeof style === "object" ? style as Record<string, unknown> : {};
const Native = ({ children, testID, style }: Props) => {
  const resolvedStyle = flattenStyle(
    typeof style === "function"
      ? (style as (state: { pressed: boolean }) => unknown)({ pressed: false })
      : style,
  );
  return React.createElement("div", {
    "data-testid": testID,
    "data-color": resolvedStyle.color,
    "data-background": resolvedStyle.backgroundColor,
    "data-height": resolvedStyle.height,
    "data-line-height": resolvedStyle.lineHeight,
    "data-font-size": resolvedStyle.fontSize,
    "data-padding-top": resolvedStyle.paddingTop,
    "data-margin-top": resolvedStyle.marginTop,
    "data-margin-bottom": resolvedStyle.marginBottom,
    "data-padding-bottom": resolvedStyle.paddingBottom,
    "data-padding-vertical": resolvedStyle.paddingVertical,
    "data-width": resolvedStyle.width,
    "data-left": resolvedStyle.left,
    "data-top": resolvedStyle.top,
    "data-border-radius": resolvedStyle.borderRadius,
    "data-border-width": resolvedStyle.borderWidth,
    "data-border-color": resolvedStyle.borderColor,
    "data-position": resolvedStyle.position,
    "data-margin-horizontal": resolvedStyle.marginHorizontal,
  }, children);
};
const Icon = ({ name, size, style }: { name: string; size?: number; style?: unknown }) => React.createElement("i", {
  "data-icon": name, "data-size": size,
  "data-translate-x": (flattenStyle(style).transform as Array<{ translateX?: number }> | undefined)?.[0]?.translateX,
});
const Passthrough = ({ children }: Props) => React.createElement(React.Fragment, null, children);
let events: Array<{ sessionId: string; playedAt: string; completed: boolean }> = [];
const colorsSource = readFileSync(new URL("../constants/colors.ts", import.meta.url), "utf8");
const belowColor = colorsSource.match(/export const CARD_TEXT_BELOW = "([^"]+)"/)?.[1];
assert.ok(belowColor);
const mocks: Record<string, unknown> = {
  react: React,
  "@/components/CardCaptionText": { CardCaptionText: Native },
  "react-native": {
    View: Native, Text: Native, Pressable: Native,
    StyleSheet: { create: (value: unknown) => value, absoluteFill: {}, hairlineWidth: 1 },
    Animated: { View: Native, Value: class { constructor(_value: number) {} } },
  },
  "@expo/vector-icons": { Feather: Icon, Ionicons: Icon },
  "expo-image": { Image: Native },
  "expo-router": { router: { push: () => {} } },
  "@/context/PlayerContext": { usePlayer: () => ({
    history: [], statEvents: events, isFavorite: () => false, toggleFavorite: () => {}, playSession: () => {},
  }) },
  "@/data/artists": { getArtist: () => ({ name: "Autor" }) },
  "@/data/guides": { getGuide: () => ({ name: "Guía" }) },
  "@/data/sessions": { getSessionById: (id: string) => id === "missing" ? undefined : ({
    id, title: `Card ${id}`, image: {}, durationLabel: "3 min", categoryLabel: "Meditación",
  }) },
  "@/context/SceneThemeContext": { useSceneTheme: () => ({ activeSceneId: "indigo2" }) },
  "@/config/scene-themes": {
    isIndigoThemeId: () => false,
    isIndigo2ThemeId: (id: string) => id === "indigo2" || id === "cloudy",
  },
  "@/hooks/useColors": { useColors: () => ({ foreground: "#FFF", mutedForeground: "#AAA", accent: "#BE9650" }) },
  "@/utils/stats": { dayKey },
  "@/constants/colors": { CARD_TEXT_BELOW: belowColor, WIDGET_GREEN_SOLID: "#008877" },
  "@/lib/history-calendar": { dedupeCompletedHistoryByDay, formatCompletedSessionCount },
  "@/components/SessionDurationBadge": { SessionDurationBadge: Native },
  "@/components/CinematicFadeSlide": { CinematicFadeSlide: Passthrough },
};
const compiled = ts.transpileModule(
  readFileSync(new URL("../components/HistorialCalendar.tsx", import.meta.url), "utf8"),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true } },
).outputText;
const componentModule = { exports: {} as { HistorialCalendar: React.ComponentType<Record<string, unknown>> } };
new Function("require", "module", "exports", compiled)((name: string) => {
  if (!(name in mocks)) throw new Error(`Missing calendar test mock: ${name}`);
  return mocks[name];
}, componentModule, componentModule.exports);
const render = (enabled = true, props: Record<string, unknown> = {}) => renderToStaticMarkup(
  React.createElement(componentModule.exports.HistorialCalendar, {
    embedded: true,
    showCompletedSessionCount: enabled,
    ...props,
  }),
);
const completed = (sessionId: string) => ({ sessionId, playedAt: new Date().toISOString(), completed: true });

test("only Profile's previous-month button has a transparent fill, 18% white outline and a 21px chevron shifted 1px left", () => {
  const html = render(true, { profileCalendarLayout: true });
  const button = html.match(/<div[^>]*><i data-icon="chevron-left" data-size="21"[^>]*><\/i><\/div>/)?.[0];
  assert.ok(button);
  assert.match(button, /data-background="transparent"/);
  assert.match(button, /data-border-width="1"/);
  assert.match(button, /data-border-color="rgba\(255,255,255,0.18\)"/);
  assert.match(button, /data-translate-x="-1"/);
  assert.match(button, /data-width="37"/);
  assert.match(button, /data-height="37"/);
  assert.match(render(), /data-icon="chevron-left" data-size="18"/);
  assert.doesNotMatch(render(), /data-border-color="rgba\(255,255,255,0.18\)"/);
  assert.doesNotMatch(render(), /data-translate-x="-1"/);
});

test("Profile keeps 10px weekdays and shrinks month dates another point to 14px, without changing other calendars", () => {
  events = [];
  const profile = render(false, { calendarTextSizeAdjustment: -2, calendarDayTextSizeAdjustment: -3 });
  const embedded = render(false);
  const standalone = render(false, { embedded: false });
  const weekdays = (html: string, size: number) =>
    [...html.matchAll(new RegExp(`data-font-size="${size}"[^>]*>[A-ZÁÉÍÓÚ]{1,4}</div>`, "g"))].length;
  const dates = (html: string, size: number) =>
    [...html.matchAll(new RegExp(`data-font-size="${size}"[^>]*>\\d{1,2}</div>`, "g"))].length;
  assert.equal(weekdays(profile, 10), 7);
  assert.equal(weekdays(embedded, 12), 7);
  assert.equal(weekdays(standalone, 12), 7);
  assert.ok(dates(profile, 14) >= 28);
  assert.equal(dates(profile, 14), dates(embedded, 17));
  assert.equal(dates(embedded, 17), dates(standalone, 15));
  const profileSource = readFileSync(new URL("../components/ProfileScreenBase.tsx", import.meta.url), "utf8");
  const progressSource = readFileSync(new URL("../components/ProgressMirrorSections.tsx", import.meta.url), "utf8");
  assert.match(profileSource, /<ProgressMirrorSections[\s\S]*?calendarTextSizeAdjustment=\{-2\}/);
  assert.match(profileSource, /<ProgressMirrorSections[\s\S]*?calendarDayTextSizeAdjustment=\{-3\}/);
  assert.match(progressSource, /<HistorialCalendar[\s\S]*?calendarTextSizeAdjustment=\{calendarTextSizeAdjustment\}/);
  assert.match(progressSource, /<HistorialCalendar[\s\S]*?calendarDayTextSizeAdjustment=\{calendarDayTextSizeAdjustment\}/);
});

test("one completed session appears beside the date, above its card, in the favorites-description color", () => {
  events = [completed("Prueba 33")];
  const html = render();
  assert.match(html, /1 sesión completada/);
  assert.ok(html.indexOf("1 sesión completada") < html.indexOf("Card Prueba 33"));
  assert.match(html, new RegExp(`data-testid="profile-calendar-completed-count" data-color="${belowColor}"`));
});

test("count is plural and matches distinct completed sessions for the selected day", () => {
  const earlier = new Date();
  earlier.setDate(earlier.getDate() - 1);
  events = [
    completed("Prueba 33"), completed("Prueba 33"), completed("Prueba 34"),
    { ...completed("incompleta"), completed: false },
    { ...completed("ayer"), playedAt: earlier.toISOString() },
  ];
  const html = render();
  assert.match(html, /2 sesiones completadas/);
  assert.equal(html.match(/Card Prueba 33/g)?.length, 1);
  assert.doesNotMatch(html, /Card incompleta|Card ayer/);
});

test("empty days and other calendar consumers keep their existing presentation", () => {
  events = [];
  assert.doesNotMatch(render(), /profile-calendar-completed-count|0 sesiones completadas/);
  events = [completed("Prueba 33")];
  assert.doesNotMatch(render(false), /profile-calendar-completed-count|1 sesión completada/);
  assert.match(render(false), /Card Prueba 33/);
});

test("canonical embedded calendar insets are 18px and replace supplied vertical padding", () => {
  events = [completed("Prueba 33")];
  const profileHtml = render(true, { canonicalVerticalInsets: true, cardVerticalPadding: 29 });
  assert.match(profileHtml, /data-background="rgba\(191,207,255,0\.096\)"[^>]*data-padding-top="18" data-padding-bottom="18"/);
  assert.match(profileHtml, /data-padding-bottom="0"/);
  assert.match(profileHtml, /data-height="18"/);
  assert.match(profileHtml, /data-line-height="18"/);

  const defaultHtml = render(true);
  assert.match(defaultHtml, /data-background="rgba\(191,207,255,0\.096\)" data-padding-vertical="16"/);
  assert.match(defaultHtml, /data-height="30"/);
  assert.doesNotMatch(defaultHtml, /data-line-height="18"/);

  const nonEmbeddedHtml = render(true, { embedded: false, canonicalVerticalInsets: true });
  assert.match(nonEmbeddedHtml, /data-padding-vertical="16"/);
  assert.match(nonEmbeddedHtml, /data-height="30"/);
});

test("Profile calendar keeps its geometry with a 37px arrow aligned to the inner margin", () => {
  events = [];
  const html = render(true, { canonicalVerticalInsets: true, profileCalendarLayout: true, cardHorizontalPadding: 20 });
  assert.match(html, /data-padding-top="17"/);
  assert.match(html, /data-padding-bottom="16"/);
  assert.match(html, /data-margin-bottom="-3"/);
  assert.match(html, /data-margin-horizontal="-20"/);
  assert.match(html, /data-margin-top="20"/);
  assert.match(html, /data-line-height="18"/);
  assert.match(html, /data-font-size="14"/);
  const priorWeekTop = 26 + 18 + 6 + 20;
  const profileWeekTop = 17 + 42 - 3 + 20;
  assert.equal(profileWeekTop - priorWeekTop, 6);
  assert.equal((profileWeekTop + 16) - (priorWeekTop + 16), 6);
  assert.equal(17 + 42 / 2, profileWeekTop / 2);
  const arrow = html.match(/<div[^>]*data-background="rgba\(255,255,255,0\.1\)"[^>]*>/)?.[0] ?? "";
  assert.match(arrow, /data-height="37"/);
  assert.match(arrow, /data-width="37"/);
  assert.match(arrow, /data-left="20"/);
  assert.match(arrow, /data-top="2.5"/);
  assert.match(arrow, /data-border-radius="18.5"/);
  assert.match(arrow, /data-position="absolute"/);
  assert.match(html, /data-icon="chevron-left"/);
  assert.doesNotMatch(html, /data-icon="chevron-right"/);
  assert.match(render(true), /data-icon="chevron-right"/);
  assert.match(readFileSync(new URL("../components/ProfileScreenBase.tsx", import.meta.url), "utf8"),
    /canonicalVerticalInsets\s+profileCalendarLayout/);
  assert.match(readFileSync(new URL("../components/ProgressMirrorSections.tsx", import.meta.url), "utf8"),
    /profileCalendarLayout=\{profileCalendarLayout\}/);
});

test("Profile cannot navigate into future months but can return from history, including across a year boundary", () => {
  const source = readFileSync(new URL("../components/HistorialCalendar.tsx", import.meta.url), "utf8");
  const tree = ts.createSourceFile("calendar.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const expressions: Record<string, string> = {};
  function visit(node: ts.Node) {
    if (ts.isVariableDeclaration(node) && node.initializer &&
      ["atCurrentMonth", "goNextMonth", "goPrevMonth"].includes(node.name.getText(tree))) {
      expressions[node.name.getText(tree)] = node.initializer.getText(tree);
    }
    ts.forEachChild(node, visit);
  }
  visit(tree);
  const text = `const atCurrentMonth = ${expressions.atCurrentMonth};
    return { next: ${expressions.goNextMonth}, previous: ${expressions.goPrevMonth} };`;
  const output = ts.transpileModule(text, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
  const factory = new Function("viewMonth", "today", "profileCalendarLayout", "embedded",
    "startOfMonth", "setViewMonth", "setSelectedDate", output);
  const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);
  for (const today of [new Date(2026, 9, 9), new Date(2027, 0, 9)]) {
    let changed: Date | undefined;
    const record = (date: Date) => { changed = date; };
    const current = factory(startOfMonth(today), today, true, true, startOfMonth, record, () => {});
    current.next();
    assert.equal(changed, undefined);
    current.previous();
    assert.equal(changed!.getTime(), new Date(today.getFullYear(), today.getMonth() - 1, 1).getTime());
    changed = undefined;
    const older = factory(new Date(today.getFullYear(), today.getMonth() - 1, 1),
      today, true, true, startOfMonth, record, () => {});
    older.next();
    assert.equal(changed!.getTime(), startOfMonth(today).getTime());
    changed = undefined;
    factory(startOfMonth(today), today, false, true, startOfMonth, record, () => {}).next();
    assert.equal(changed!.getTime(), new Date(today.getFullYear(), today.getMonth() + 1, 1).getTime());
  }
});

test("canonical calendar bottom inset aligns to the last rendered event, not an unavailable event", () => {
  const midday = new Date();
  midday.setHours(12, 0, 0, 0);
  events = [
    { ...completed("Prueba 33"), playedAt: new Date(midday.getTime() + 60_000).toISOString() },
    { ...completed("missing"), playedAt: midday.toISOString() },
  ];

  const html = render(true, { canonicalVerticalInsets: true });
  assert.match(html, /Card Prueba 33/);
  assert.doesNotMatch(html, /Card missing/);
  assert.match(html, /data-padding-bottom="0"/);
});