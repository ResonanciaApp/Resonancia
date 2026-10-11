import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { URL } from "node:url";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

import { getWeeklyCompletedSessions } from "../utils/weekly-completed-sessions.ts";

type EventFixture = {
  sessionId: string;
  categoryId: string;
  categoryLabel: string;
  minutes: number;
  completed?: boolean;
  playedAt: string;
};
type SessionFixture = {
  id: string;
  title: string;
  image: string;
  durationLabel: string;
  categoryLabel: string;
  skipMiniPlayer?: boolean;
  skipDetail?: boolean;
};
type NativeProps = {
  children?: React.ReactNode;
  testID?: string;
  accessibilityRole?: string;
  accessibilityLabel?: string;
  onPress?: () => void;
  style?: unknown;
  source?: string;
  contentFit?: string;
};

const flattenStyle = (style: unknown): Record<string, unknown> =>
  Array.isArray(style)
    ? Object.assign({}, ...style.map(flattenStyle))
    : style && typeof style === "object"
      ? style as Record<string, unknown>
      : {};

let statEvents: EventFixture[] = [];
let todayKey = "";
let rolloverCalls = 0;
let catalogVersion = 1;
let memoDeps: readonly unknown[] | undefined;
let memoValue: unknown;
const sessions = new Map<string, SessionFixture>();
const buttons: NativeProps[] = [];
const routes: string[] = [];
const played: string[] = [];

const nativeMarkup = (tag: string) => (props: NativeProps) => {
  const style = flattenStyle(props.style);
  const attributes = {
    "data-testid": props.testID,
    "data-accessibility-role": props.accessibilityRole,
    "data-accessibility-label": props.accessibilityLabel,
    "data-margin-top": style.marginTop,
    "data-margin-bottom": style.marginBottom,
    "data-opacity": style.opacity,
    "data-background-color": style.backgroundColor,
    "data-flex-direction": style.flexDirection,
    "data-gap": style.gap,
    "data-width": style.width,
    "data-height": style.height,
    "data-left": style.left,
    "data-right": style.right,
    "data-border-radius": style.borderRadius,
    "data-font-size": style.fontSize,
    "data-source": props.source,
  };
  return React.createElement(tag, attributes, props.children);
};
const NativeView = nativeMarkup("div");
const NativeText = nativeMarkup("span");
const NativeImage = nativeMarkup("img");
const Pressable = (props: NativeProps) => {
  buttons.push(props);
  const style = typeof props.style === "function"
    ? props.style({ pressed: false })
    : props.style;
  return React.createElement("button", {
    ...flattenProps(props),
    "data-margin-top": flattenStyle(style).marginTop,
    "data-margin-bottom": flattenStyle(style).marginBottom,
    "data-opacity": flattenStyle(style).opacity,
    "data-flex-direction": flattenStyle(style).flexDirection,
    "data-gap": flattenStyle(style).gap,
    type: "button",
  }, props.children);
};
const TestReact = {
  ...React,
  useMemo<T>(factory: () => T, dependencies: readonly unknown[]): T {
    const unchanged = memoDeps
      && memoDeps.length === dependencies.length
      && memoDeps.every((dependency, index) => Object.is(dependency, dependencies[index]));
    if (!unchanged) {
      memoDeps = [...dependencies];
      memoValue = factory();
    }
    return memoValue as T;
  },
};
function flattenProps(props: NativeProps) {
  return {
    "data-testid": props.testID,
    "data-accessibility-role": props.accessibilityRole,
    "data-accessibility-label": props.accessibilityLabel,
  };
}

const source = readFileSync(
  new URL("../components/WeeklyCompletedSessions.tsx", import.meta.url),
  "utf8",
);
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    jsx: ts.JsxEmit.React,
    esModuleInterop: true,
  },
}).outputText;
const mocks: Record<string, unknown> = {
  react: TestReact,
  "@/components/CardCaptionText": { CardCaptionText: NativeText },
  "react-native": {
    View: NativeView,
    Text: NativeText,
    Pressable,
    ScrollView: () => { throw new Error("Weekly completion cards must not have their own ScrollView"); },
    Platform: { OS: "ios" },
    StyleSheet: { create: (styles: unknown) => styles, absoluteFill: {} },
  },
  "expo-blur": { BlurView: NativeView },
  "@expo/vector-icons": {
    MaterialCommunityIcons: ({ name }: { name: string }) => React.createElement("i", { "data-icon": name }),
  },
  "expo-image": { Image: NativeImage },
  "expo-router": { router: { push: (route: string) => routes.push(route) } },
  "@/context/PlayerContext": {
    usePlayer: () => ({ statEvents }),
    usePlayerBrowse: () => ({
      playSession: (session: SessionFixture) => played.push(session.id),
    }),
  },
  "@/context/CatalogContext": {
    useCatalog: () => ({ version: catalogVersion }),
  },
  "@/data/sessions": { getSessionById: (id: string) => sessions.get(id) },
  "@/hooks/useColors": { useColors: () => ({ foreground: "#F8F8F8" }) },
  "@/hooks/useDayRollover": {
    useDayRollover: () => {
      rolloverCalls++;
      return todayKey;
    },
  },
  "@/constants/colors": {
    CARD_TEXT_ABOVE: "#D1D1D1",
    CARD_TEXT_BELOW: "#EBF2FF",
  },
  "@/utils/weekly-completed-sessions": { getWeeklyCompletedSessions },
};
const componentModule = {
  exports: {} as { WeeklyCompletedSessions: React.ComponentType },
};
const badgeSource = readFileSync(new URL("../components/SessionDurationBadge.tsx", import.meta.url), "utf8");
const badgeCompiled = ts.transpileModule(badgeSource, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true },
}).outputText;
const badgeModule = { exports: {} };
new Function("require", "module", "exports", badgeCompiled)((name: string) => {
  assert.ok(name in mocks, `Missing duration badge mock: ${name}`);
  return mocks[name];
}, badgeModule, badgeModule.exports);
mocks["@/components/SessionDurationBadge"] = badgeModule.exports;
new Function("require", "module", "exports", compiled)((name: string) => {
  assert.ok(name in mocks, `Missing UI test mock: ${name}`);
  return mocks[name];
}, componentModule, componentModule.exports);

const render = (preserveMemo = false) => {
  buttons.length = 0;
  routes.length = 0;
  played.length = 0;
  if (!preserveMemo) {
    memoDeps = undefined;
    memoValue = undefined;
  }
  return renderToStaticMarkup(
    React.createElement(componentModule.exports.WeeklyCompletedSessions),
  );
};
const fixture = (
  sessionId: string,
  playedAt: string,
): EventFixture => ({
  sessionId,
  categoryId: "meditaciones-guiadas",
  categoryLabel: "Meditación",
  minutes: 10,
  completed: true,
  playedAt,
});
const sessionFixture = (
  id: string,
  overrides: Partial<SessionFixture> = {},
): SessionFixture => ({
  id,
  title: `Sesión ${id}`,
  image: `cover-${id}.jpg`,
  durationLabel: "12 min",
  categoryLabel: "Meditación guiada",
  ...overrides,
});
const pressCard = (sessionId: string) => {
  buttons.find((button) =>
    button.testID?.startsWith(`weekly-completed-session-${sessionId}-`),
  )?.onPress?.();
};

test("empty and unknown-only results omit the divider and title too", () => {
  sessions.clear();
  statEvents = [];
  assert.equal(render(), "");

  statEvents = [fixture("missing-from-catalog", new Date().toISOString())];
  assert.equal(render(), "");
});

test("renderable completed entries show the divider, title, and vertically stacked horizontal cards", () => {
  sessions.clear();
  sessions.set("new", sessionFixture("new"));
  sessions.set("old", sessionFixture("old"));
  const now = new Date();
  statEvents = [
    fixture("old", now.toISOString()),
    fixture("new", now.toISOString()),
  ];

  const html = render();
  assert.match(html, /weekly-completed-sessions-divider[^>]*data-background-color="rgba\(255,255,255,0\.05\)"/);
  assert.match(html, /Sesiones completadas/);
  assert.match(html, /Sesión old/);
  assert.match(html, /Sesión new/);
  assert.match(html, /weekly-completed-sessions-cards[^>]*data-flex-direction="column"[^>]*data-gap="16"/);
  assert.equal((html.match(/<button[^>]*data-flex-direction="row"/g) ?? []).length, 2);
  assert.equal((html.match(/data-gap="12"/g) ?? []).length, 2);
  assert.match(html, /data-source="cover-new\.jpg"/);
  assert.match(html, /12 min/);
  assert.match(html, /Meditación guiada/);
  assert.match(html, /data-accessibility-role="button"/);
  assert.ok(buttons.some((button) => button.testID?.startsWith("weekly-completed-session-")));
});

test("title header margin supplies the complete 21px gap without another list margin", () => {
  sessions.clear();
  sessions.set("gap", sessionFixture("gap"));
  statEvents = [fixture("gap", new Date().toISOString())];

  const html = render();
  assert.match(html, /weekly-completed-sessions-header[^>]*data-margin-bottom="21"/);
  assert.match(html, /weekly-completed-sessions-cards/);
  const listStart = html.indexOf('data-testid="weekly-completed-sessions-cards"');
  const listElement = html.slice(listStart, html.indexOf(">", listStart));
  assert.doesNotMatch(listElement, /data-margin-top=/);
  assert.match(html, /weekly-completed-sessions-title/);
});

test("title and cards move down 5px while covers grow 10px and use Dormir's left glass duration pill", () => {
  sessions.clear();
  sessions.set("layout", sessionFixture("layout"));
  statEvents = [fixture("layout", new Date().toISOString())];
  const html = render();
  assert.match(html, /weekly-completed-sessions-divider[^>]*data-margin-bottom="21"/);
  assert.match(html, /<img[^>]*data-width="78"[^>]*data-height="78"/);
  assert.match(html, /data-height="23"[^>]*data-left="4"[^>]*data-border-radius="999"/);
  assert.doesNotMatch(html, /data-right=/);
  assert.match(html, /data-background-color="rgba\(0,0,0,0\.20\)"/);
  assert.match(html, /data-icon="clock"/);
  assert.match(html, /data-font-size="10">12 min/);
});

test("a catalog version bump resolves a remote session with unchanged events and day key", () => {
  sessions.clear();
  const eventRef = [fixture("remote-session", new Date().toISOString())];
  statEvents = eventRef;
  todayKey = "unchanged-day-key";
  catalogVersion = 1;
  assert.equal(render(), "");

  sessions.set("remote-session", sessionFixture("remote-session"));
  catalogVersion = 2;
  const html = render(true);

  assert.equal(statEvents, eventRef);
  assert.equal(todayKey, "unchanged-day-key");
  assert.match(html, /Sesión remote-session/);
  assert.match(html, /weekly-completed-sessions-divider/);
});

test("a catalog version bump removes a stale card and hides its divider and title", () => {
  sessions.clear();
  sessions.set("removed-session", sessionFixture("removed-session"));
  const eventRef = [fixture("removed-session", new Date().toISOString())];
  statEvents = eventRef;
  todayKey = "unchanged-day-key";
  catalogVersion = 3;
  const existingHtml = render();
  assert.match(existingHtml, /Sesión removed-session/);

  sessions.delete("removed-session");
  catalogVersion = 4;
  const removedHtml = render(true);

  assert.equal(statEvents, eventRef);
  assert.equal(todayKey, "unchanged-day-key");
  assert.equal(removedHtml, "");
  assert.doesNotMatch(removedHtml, /weekly-completed-sessions-divider|Sesiones completadas/);
});

test("card taps preserve the mini-player, full-player, and detail navigation precedence", () => {
  sessions.clear();
  sessions.set("detail", sessionFixture("detail"));
  sessions.set("skip-detail", sessionFixture("skip-detail", { skipDetail: true }));
  sessions.set("skip-mini", sessionFixture("skip-mini", {
    skipMiniPlayer: true,
    skipDetail: true,
  }));
  const playedAt = new Date().toISOString();
  statEvents = [
    fixture("detail", playedAt),
    fixture("skip-detail", playedAt),
    fixture("skip-mini", playedAt),
  ];

  render();
  pressCard("detail");
  assert.deepEqual(routes, ["/session/detail"]);
  assert.deepEqual(played, []);

  render();
  pressCard("skip-detail");
  assert.deepEqual(routes, ["/player"]);
  assert.deepEqual(played, ["skip-detail"]);

  render();
  pressCard("skip-mini");
  assert.deepEqual(routes, []);
  assert.deepEqual(played, ["skip-mini"]);
});

test("the day-rollover key invalidates a mounted section's cached week across Monday", () => {
  const NativeDate = globalThis.Date;
  let fixedNow = new NativeDate(2026, 0, 4, 23, 59);
  class ControlledDate extends NativeDate {
    constructor(value?: string | number | Date) {
      if (value === undefined) super(fixedNow.getTime());
      else super(value instanceof NativeDate ? value.getTime() : value);
    }
  }

  sessions.clear();
  sessions.set("sunday", sessionFixture("sunday"));
  sessions.set("monday", sessionFixture("monday"));
  statEvents = [
    fixture("sunday", new NativeDate(2026, 0, 4, 12).toISOString()),
    fixture("monday", new NativeDate(2026, 0, 5, 0, 30).toISOString()),
  ];

  try {
    globalThis.Date = ControlledDate as DateConstructor;
    todayKey = "2026-01-04";
    rolloverCalls = 0;
    const sundayHtml = render();
    assert.match(sundayHtml, /Sesión sunday/);
    assert.doesNotMatch(sundayHtml, /Sesión monday/);

    fixedNow = new NativeDate(2026, 0, 5, 1);
    todayKey = "2026-01-05";
    const mondayHtml = render(true);
    assert.match(mondayHtml, /Sesión monday/);
    assert.doesNotMatch(mondayHtml, /Sesión sunday/);
    assert.equal(rolloverCalls, 2);
  } finally {
    globalThis.Date = NativeDate;
  }
});