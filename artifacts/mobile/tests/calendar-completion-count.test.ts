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
    "data-padding-bottom": resolvedStyle.paddingBottom,
    "data-padding-vertical": resolvedStyle.paddingVertical,
  }, children);
};
const Icon = () => React.createElement("i");
const Passthrough = ({ children }: Props) => React.createElement(React.Fragment, null, children);
let events: Array<{ sessionId: string; playedAt: string; completed: boolean }> = [];
const colorsSource = readFileSync(new URL("../constants/colors.ts", import.meta.url), "utf8");
const belowColor = colorsSource.match(/export const CARD_TEXT_BELOW = "([^"]+)"/)?.[1];
assert.ok(belowColor);
const mocks: Record<string, unknown> = {
  react: React,
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

test("Profile shrinks calendar weekday initials and month dates by 2px without changing other calendars", () => {
  events = [];
  const profile = render(false, { calendarTextSizeAdjustment: -2 });
  const embedded = render(false);
  const standalone = render(false, { embedded: false });
  const weekdays = (html: string, size: number) =>
    [...html.matchAll(new RegExp(`data-font-size="${size}"[^>]*>[A-ZÁÉÍÓÚ]{1,4}</div>`, "g"))].length;
  const dates = (html: string, size: number) =>
    [...html.matchAll(new RegExp(`data-font-size="${size}"[^>]*>\\d{1,2}</div>`, "g"))].length;
  assert.equal(weekdays(profile, 10), 7);
  assert.equal(weekdays(embedded, 12), 7);
  assert.equal(weekdays(standalone, 12), 7);
  assert.ok(dates(profile, 15) >= 28);
  assert.equal(dates(profile, 15), dates(embedded, 17));
  assert.equal(dates(embedded, 17), dates(standalone, 15));
  const profileSource = readFileSync(new URL("../components/ProfileScreenBase.tsx", import.meta.url), "utf8");
  const progressSource = readFileSync(new URL("../components/ProgressMirrorSections.tsx", import.meta.url), "utf8");
  assert.match(profileSource, /<ProgressMirrorSections[\s\S]*?calendarTextSizeAdjustment=\{-2\}/);
  assert.match(progressSource, /<HistorialCalendar[\s\S]*?calendarTextSizeAdjustment=\{calendarTextSizeAdjustment\}/);
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
  assert.match(profileHtml, /data-background="rgba\(191,207,255,0\.096\)" data-padding-top="18" data-padding-bottom="18"/);
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