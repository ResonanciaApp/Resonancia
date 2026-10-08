import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { URL } from "node:url";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const source = readFileSync(new URL("../app/progreso.tsx", import.meta.url), "utf8");
const flatten = (style: any): Record<string, any> =>
  Array.isArray(style) ? Object.assign({}, ...style.map(flatten)) : style ?? {};

function renderProgress(days: number, reducedMotion: boolean, entranceComplete = true) {
  let secondaryVisible = reducedMotion || entranceComplete;
  let mirrorProps: any;
  const entrances = new Map<string, any>();
  const Native = (props: any) => {
    const style = flatten(props.style);
    return React.createElement("div", {
      "data-testid": props.testID,
      "data-width": style.width ?? props.width,
      "data-height": style.height ?? props.height,
      "data-font-size": style.fontSize,
      "data-line-height": style.lineHeight,
      "data-margin-top": style.marginTop,
      "data-margin-bottom": style.marginBottom,
      "data-padding-top": style.paddingTop,
      "data-radius": style.borderRadius,
      "data-background": style.backgroundColor,
      "data-opacity": style.opacity,
      "data-circle-radius": props.r,
      "data-stroke": props.strokeWidth,
      "data-stroke-offset": props.strokeDashoffset ?? props.animatedProps?.strokeDashoffset,
    }, props.children);
  };
  const reanimated = {
    View: Native, Text: Native,
    createAnimatedComponent: (component: any) => component,
    useReducedMotion: () => reducedMotion,
    useAnimatedProps: (factory: any) => factory(),
    useAnimatedStyle: (factory: any) => factory(),
    useSharedValue: () => ({ value: days }),
    cancelAnimation() {},
    Easing: { linear: () => {} },
    runOnJS: (callback: any) => callback,
    withDelay: (_: any, value: any) => value,
    withTiming: (value: any) => value,
  };
  const imports: Record<string, any> = {
    react: {
      ...React,
      useState: () => [secondaryVisible, (next: boolean) => { secondaryVisible = next; }],
    },
    "react-native": {
      View: Native, Text: Native, Pressable: Native, ScrollView: Native, StatusBar: () => null,
      Platform: { OS: "ios" }, StyleSheet: { create: (styles: any) => styles },
    },
    "react-native-reanimated": reanimated,
    "react-native-svg": { default: Native, __esModule: true, Circle: Native, Defs: Native, LinearGradient: Native, Stop: Native },
    "expo-router": { router: { back() {} }, useFocusEffect() {} },
    "expo-linear-gradient": { LinearGradient: Native },
    "react-native-safe-area-context": { useSafeAreaInsets: () => ({ top: 59, bottom: 34 }) },
    "@expo/vector-icons": { Feather: Native },
    "@/hooks/useColors": { useColors: () => ({ foreground: "#FBFBFB" }) },
    "@/hooks/useStreak": { useStreak: () => ({ weekFlags: Array.from({ length: 7 }, (_, index) => index < days) }) },
    "@/context/SceneThemeContext": { useSceneTheme: () => ({ theme: { gradient: ["#060A0F", "#111122"] } }) },
    "@/constants/colors": { MEMBERSHIP_AURORA: { premium: { accent: "#BE9650" } } },
    "@/components/StreakWeekRow": { getPositionedDayGradient: (colors: any) => colors },
    "@/components/CinematicFadeSlide": { CinematicFadeSlide: (props: any) => {
      entrances.set(props.replayKey, props);
      return React.createElement(Native, props);
    } },
    "@/components/ProgressMirrorSections": { ProgressMirrorSections: (props: any) => {
      mirrorProps = props;
      return React.createElement("div", { "data-testid": "weekly-circles", "data-padding-top": props.sectionTopPadding }, "seven days");
    } },
    "@/components/GrowthJourney": { GrowthLevelPreviewCard: Native },
    "@/components/GrowthJourneySheet": { GrowthJourneySheet: () => null },
    "@/components/WeeklyCompletedSessions": { WeeklyCompletedSessions: () => null },
  };
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true },
  }).outputText;
  const module = { exports: {} as any };
  new Function("require", "module", "exports", compiled)((name: string) => {
    assert.ok(name in imports, `Missing mock: ${name}`);
    return imports[name];
  }, module, module.exports);
  const rerender = () => {
    entrances.clear();
    mirrorProps = undefined;
    return renderToStaticMarkup(React.createElement(module.exports.default));
  };
  const html = rerender();
  return { html, mirrorProps, entrances, rerender };
}

test("description, final count, ring and weekly row mount immediately without animations", () => {
  for (const days of [0, 4, 7]) {
    const h = renderProgress(days, false, false);
    assert.equal(h.entrances.size, 0);
    assert.match(h.html, /progress-intro-description/);
    assert.match(h.html, /weekly-circles/);
    assert.match(h.html, /progress-days-background/);
    assert.equal(h.mirrorProps.animateEntrance, false);
    assert.equal(h.mirrorProps.animateWeekEntrance, false);
  }
  assert.doesNotMatch(source, /react-native-reanimated|CinematicFadeSlide|withTiming|withDelay|descriptionStarted|StreakCountDigit/);
});

test("reduced motion shows the description and weekly circles immediately", () => {
  const h = renderProgress(7, true, false);
  assert.equal(h.entrances.size, 0);
  assert.match(h.html, /progress-intro-description/);
  assert.match(h.html, /weekly-circles/);
});

test("Tu progreso semanal has an 18px title, no ESTA SEMANA, and preserves description and counter order", () => {
  const { html, mirrorProps } = renderProgress(4, true);
  const description = html.indexOf('data-testid="progress-intro-description"');
  const counter = html.indexOf('data-testid="progress-day-counter"');
  const week = html.indexOf('data-testid="weekly-circles"');
  assert.ok(description >= 0 && description < counter && counter < week);
  assert.doesNotMatch(html, /progress-description-below-week/);
  assert.match(html, /data-font-size="18"[^>]*>Tu progreso semanal</);
  assert.doesNotMatch(html, /ESTA SEMANA|progress-week-title/);
  assert.match(html, /data-margin-top="15"/);
  assert.equal(mirrorProps.sectionTopPadding, 0);
  assert.equal(mirrorProps.weeklySectionHorizontalPadding, 0);
  assert.equal(mirrorProps.sectionHorizontalPadding, 20);
  assert.equal(mirrorProps.separateStreakHistory, true);
  assert.equal(mirrorProps.showStreakHistory, false);
  assert.equal(mirrorProps.streakMarginBottom, 0);
  assert.equal(mirrorProps.sectionBottomPadding, 0);
  assert.equal(mirrorProps.sectionMarginBottom, 0);
  assert.equal(mirrorProps.showPersonalStats, false);
  assert.equal(mirrorProps.showCalendar, false);
  assert.doesNotMatch(source, /heroHeight|heroCopyOffset|heroOverlay|sectionsOffset/);
  assert.doesNotMatch(source, /WeeklyCompletedSessions|introDivider/);
  assert.doesNotMatch(html, /Sesiones completadas|weekly-completed-sessions/);
});

test("counter background and ring shrink another 7px without changing the number size", () => {
  for (const reducedMotion of [true, false]) {
    for (const days of [0, 4, 7]) {
      const { html } = renderProgress(days, reducedMotion);
      assert.match(html, /data-testid="progress-days-background" data-width="100" data-height="100"[^>]*data-radius="50"/);
      assert.match(html, /data-font-size="46" data-line-height="53"/);
      const size = days > 0 ? 118 : 100;
      assert.match(html, new RegExp(`data-testid="progress-day-counter" data-width="${size}" data-height="${size}"`));
      if (days > 0) {
        assert.match(html, /data-circle-radius="54.5" data-stroke="9"/);
        const offset = 2 * Math.PI * 54.5 * (1 - days / 7);
        assert.ok(html.includes(`data-stroke-offset="${offset}"`));
      } else {
        assert.doesNotMatch(html, /data-stroke-offset=/);
      }
    }
  }
});