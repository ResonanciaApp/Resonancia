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
const Native = ({ children, testID, style }: Props) =>
  React.createElement("div", { "data-testid": testID, "data-color": flattenStyle(style).color }, children);
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
  "@/data/sessions": { getSessionById: (id: string) => ({
    id, title: `Card ${id}`, image: {}, durationLabel: "3 min", categoryLabel: "Meditación",
  }) },
  "@/context/SceneThemeContext": { useSceneTheme: () => ({ activeSceneId: "indigo2" }) },
  "@/config/scene-themes": { isIndigoThemeId: () => false },
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
const render = (enabled = true) => renderToStaticMarkup(
  React.createElement(componentModule.exports.HistorialCalendar, { embedded: true, showCompletedSessionCount: enabled }),
);
const completed = (sessionId: string) => ({ sessionId, playedAt: new Date().toISOString(), completed: true });

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