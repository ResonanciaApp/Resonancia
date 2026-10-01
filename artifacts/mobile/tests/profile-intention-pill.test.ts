import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { URL } from "node:url";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

type PressProps = {
  children?: React.ReactNode;
  onPress?: (event: { stopPropagation: () => void }) => void;
  onPressIn?: () => void;
  onPressOut?: () => void;
  style?: (state: { pressed: boolean }) => unknown[];
};
let pressProps: PressProps = {};
const animations: Array<{ kind: string; options: Record<string, unknown> }> = [];
const Native = ({ children }: { children?: React.ReactNode }) => React.createElement("div", null, children);
const native = {
  Animated: {
    View: Native,
    Value: class {
      constructor(_value: number) {}
      stopAnimation() {}
    },
    timing: (_value: unknown, options: Record<string, unknown>) => ({
      start: () => animations.push({ kind: "timing", options }),
    }),
    spring: (_value: unknown, options: Record<string, unknown>) => ({
      start: () => animations.push({ kind: "spring", options }),
    }),
  },
  Text: Native,
  Pressable: (props: PressProps) => {
    pressProps = props;
    return React.createElement("button", null, props.children);
  },
};
const load = (path: string, imports: Record<string, unknown>) => {
  const compiled = ts.transpileModule(readFileSync(new URL(path, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true },
  }).outputText;
  const module = { exports: {} };
  new Function("require", "module", "exports", compiled)((name: string) => {
    if (!(name in imports)) throw new Error(`Missing intention test mock: ${name}`);
    return imports[name];
  }, module, module.exports);
  return module.exports;
};
const sharedImports = { react: React, "react-native": native };
const pressHook = load("../hooks/usePressScaleAnimation.ts", sharedImports);
const { ProfileIntentionPill } = load("../components/ProfileIntentionPill.tsx", {
  ...sharedImports, "@/hooks/usePressScaleAnimation": pressHook,
}) as { ProfileIntentionPill: React.ComponentType<{ onPress: () => void }> };
const render = (onPress = () => {}) => renderToStaticMarkup(React.createElement(ProfileIntentionPill, { onPress }));

test("the Intención pill opens Tu camino and stops the Mi cuenta parent action", () => {
  let opens = 0;
  let stopped = false;
  assert.match(render(() => opens++), /0 Días: Intención/);
  pressProps.onPress?.({ stopPropagation: () => { stopped = true; } });
  assert.equal(opens, 1);
  assert.equal(stopped, true);
  const profile = readFileSync(new URL("../components/ProfileScreenBase.tsx", import.meta.url), "utf8");
  assert.match(profile, /testID="profile-identity-details"/);
  assert.match(profile, /onPress=\{\(\) => setGrowthJourneyOpen\(true\)\}/);
  assert.match(profile, /GrowthJourneySheet visible=\{growthJourneyOpen\} onClose=\{\(\) => setGrowthJourneyOpen\(false\)\}/);
});

test("press and release reuse exactly the recommendation button scale and spring feedback", () => {
  animations.length = 0;
  render();
  pressProps.onPressIn?.();
  pressProps.onPressOut?.();
  assert.deepEqual(animations, [
    { kind: "timing", options: { toValue: 0.97, duration: 90, useNativeDriver: true } },
    { kind: "spring", options: { toValue: 1, tension: 180, friction: 14, useNativeDriver: true } },
  ]);
  assert.deepEqual(pressProps.style?.({ pressed: true }).at(-1), { opacity: 0.78 });
  const recommendations = readFileSync(new URL("../components/DailyRecommendationsSection.tsx", import.meta.url), "utf8");
  assert.match(recommendations, /animatePress: animateButtonPress \} = usePressScaleAnimation\(\)/);
});