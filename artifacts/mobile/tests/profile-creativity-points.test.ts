import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { URL } from "node:url";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const source = readFileSync(new URL("../components/CreativityPointsSection.tsx", import.meta.url), "utf8");
const captured = new Map<string, any>();
let componentStyles: Record<string, any> = {};
const flatten = (style: any): any => Array.isArray(style)
  ? Object.assign({}, ...style.filter(Boolean).map(flatten))
  : style ?? {};
const Native = (props: any) => {
  if (props.testID) captured.set(props.testID, props);
  return React.createElement("div", { "data-testid": props.testID, "data-role": props.accessibilityRole }, props.children);
};
const mocks: Record<string, any> = {
  react: React,
  "react-native": { StyleSheet: { create: (value: any) => { componentStyles = value; return value; } }, Text: Native, View: Native, Pressable: Native },
  "@/hooks/useColors": { useColors: () => ({ foreground: "#F9F9F9", accent: "#BE9650" }) },
};
const module = { exports: {} as { CreativityPointsSection: React.ComponentType<any> } };
new Function("require", "module", "exports", ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true },
}).outputText)((name: string) => {
  assert.ok(name in mocks, `Unexpected dependency: ${name}`);
  return mocks[name];
}, module, module.exports);

test("creativity points show the exact title and zero-of-100 bar with only the help button interactive", () => {
  let helpRequests = 0;
  const html = renderToStaticMarkup(React.createElement(module.exports.CreativityPointsSection, { style: { marginBottom: 21 }, onInfoPress: () => helpRequests++ }));
  assert.match(html, /Puntos creatividad/);
  assert.doesNotMatch(html, /creatividad expansiva/);
  assert.match(html, />0<\/div>\/100/);
  assert.match(html, />\?<\/div>/);
  const bar = captured.get("creativity-points-bar");
  assert.equal(bar.accessibilityRole, "progressbar");
  assert.deepEqual(bar.accessibilityValue, { min: 0, max: 100, now: 0, text: "0 de 100 puntos" });
  assert.equal(captured.get("creativity-points-info").accessibilityRole, "button");
  captured.get("creativity-points-info").onPress();
  assert.equal(helpRequests, 1);
  assert.equal(flatten(captured.get("creativity-points-info").style).opacity, 0.7);
  assert.equal(flatten(captured.get("creativity-points-value").style).fontSize, 13);
  const profile = readFileSync(new URL("../components/ProfileScreenBase.tsx", import.meta.url), "utf8");
  const intentionTitleSize = Number(profile.match(/GrowthLevelPreviewCard[^>]*titleFontSize=\{(\d+)\}/)?.[1]);
  assert.equal(intentionTitleSize, 15);
  assert.equal(componentStyles.title.fontSize, 16);
  const progress = readFileSync(new URL("../components/ProgressMirrorSections.tsx", import.meta.url), "utf8");
  const weeklyTitleSize = Number(progress.match(/streakTitle:\s*\{[^}]*fontSize:\s*(\d+)/)?.[1]);
  assert.equal(componentStyles.title.fontSize, weeklyTitleSize);
  for (const props of captured.values()) {
    if (props.testID !== "creativity-points-info") assert.equal(props.onPress, undefined);
    assert.equal(props.onValueChange, undefined);
  }
  const card = flatten(captured.get("profile-creativity-points").style);
  assert.equal(card.backgroundColor, "rgba(0,0,0,0.16)");
  assert.equal(card.paddingVertical, 18);
  assert.equal(card.paddingHorizontal, 20);
  assert.equal(card.marginBottom, 21);
  assert.equal(flatten(bar.style).flex, 1);
  assert.doesNotMatch(source, /useState|useEffect|AsyncStorage|usePlayer|useStreak|Slider/);
});