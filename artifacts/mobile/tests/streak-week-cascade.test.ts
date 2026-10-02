import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { URL } from "node:url";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const source = readFileSync(new URL("../components/StreakWeekRow.tsx", import.meta.url), "utf8");
function renderWeek(animated: boolean) {
  const entrances: any[] = [];
  const Native = ({ children }: any) => React.createElement("div", null, children);
  const imports: Record<string, any> = {
    react: React,
    "react-native": { View: Native, Text: Native, StyleSheet: { create: (styles: any) => styles } },
    "@react-native-masked-view/masked-view": { default: Native, __esModule: true },
    "expo-linear-gradient": { LinearGradient: Native },
    "react-native-svg": { default: Native, __esModule: true, Path: Native },
    "@/hooks/useStreak": { useStreak: () => ({ weekFlags: Array(7).fill(false), todayIndex: -1 }) },
    "@/context/SceneThemeContext": { useSceneTheme: () => ({ theme: { gradient: ["#060A0F", "#111122"] } }) },
    "@/components/CinematicFadeSlide": { CinematicFadeSlide: (props: any) => {
      entrances.push(props);
      return React.createElement(Native, null, props.children);
    } },
  };
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true },
  }).outputText;
  const module = { exports: {} as any };
  new Function("require", "module", "exports", compiled)((name: string) => {
    assert.ok(name in imports, `Missing mock: ${name}`);
    return imports[name];
  }, module, module.exports);
  renderToStaticMarkup(React.createElement(module.exports.StreakWeekRow, {
    animateEntrance: animated, entranceReplayKey: "progress-week", entranceBaseDelay: 650,
  }));
  return entrances;
}

test("seven days enter left to right at distinct staggered delays with the original timing", () => {
  const entrances = renderWeek(true);
  assert.equal(entrances.length, 7);
  assert.deepEqual(entrances.map((entry) => entry.delay), [650, 790, 930, 1070, 1210, 1350, 1490]);
  assert.deepEqual(entrances.map((entry) => entry.replayKey),
    Array.from({ length: 7 }, (_, index) => `progress-week:${index}`));
  assert.ok(entrances.every((entry) => entry.duration === 1200 && entry.translateYFrom === 14));
});

test("other surfaces can still render the week without entrance animation", () => {
  assert.equal(renderWeek(false).length, 0);
});