import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { URL } from "node:url";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const source = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");
const compiled = ts.transpileModule(source("../components/RoutineGradientFill.tsx"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true },
}).outputText;
const module = { exports: {} as { RoutineGradientFill: React.ComponentType<{ style?: object }> } };
const mocks: Record<string, unknown> = {
  react: React,
  "react-native": { StyleSheet: { absoluteFillObject: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0 } } },
  "expo-linear-gradient": {
    LinearGradient: ({ colors, start, end, pointerEvents, style }: {
      colors: string[]; start: { x: number; y: number }; end: { x: number; y: number };
      pointerEvents: string; style: object[];
    }) => {
      const resolved = Object.assign({}, ...style);
      return React.createElement("div", {
        "data-colors": colors.join(","),
        "data-start": `${start.x},${start.y}`,
        "data-end": `${end.x},${end.y}`,
        "data-pointer-events": pointerEvents,
        "data-position": resolved.position,
        "data-radius": resolved.borderRadius,
      });
    },
  },
};
new Function("require", "module", "exports", compiled)((name: string) => {
  assert.ok(name in mocks, `Unexpected dependency: ${name}`);
  return mocks[name];
}, module, module.exports);

test("routine gradient renders all four reference colors horizontally without intercepting taps", () => {
  const html = renderToStaticMarkup(React.createElement(module.exports.RoutineGradientFill));
  assert.match(html, /data-colors="#4265B5,#477FBD,#4A99BC,#50AFB0"/);
  assert.match(html, /data-start="0,0.5" data-end="1,0.5"/);
  assert.match(html, /data-pointer-events="none" data-position="absolute"/);
});

test("the floating add button gradient preserves its 18px rounded corners", () => {
  const html = renderToStaticMarkup(React.createElement(module.exports.RoutineGradientFill, {
    style: { borderRadius: 18 },
  }));
  assert.match(html, /data-radius="18"/);
});

test("calendar completion and add button use the same fill while preserving animation and navigation", () => {
  const calendar = source("../app/rutina-calendario.tsx");
  assert.equal((calendar.match(/<RoutineGradientFill\b/g) ?? []).length, 2);
  assert.match(calendar, /styles\.completionOverlay, completionOverlayStyle[\s\S]*?<RoutineGradientFill \/>[\s\S]*?<\/Reanimated\.View>/);
  assert.match(calendar, /opacity: completionProgress\.value/);
  assert.match(calendar, /withTiming\(1, \{ duration: 500 \}\)/);
  assert.match(calendar, /router\.push\("\/crear-rutina\?from=calendar" as never\)/);
  assert.match(calendar, /opacity: pressed \? 0\.78 : 1/);
  assert.match(calendar, /<RoutineGradientFill style=\{\{ borderRadius: 18 \}\} \/>/);
  assert.doesNotMatch(calendar, /#276FC2/);
});

test("calendar empty-state message uses a black background at 16% opacity", () => {
  const calendar = source("../app/rutina-calendario.tsx");
  const emptyState = calendar.slice(calendar.indexOf("styles.emptyState,"), calendar.indexOf("No hay tareas programadas"));
  assert.match(emptyState, /backgroundColor: "rgba\(0,0,0,0\.16\)"/);
  assert.match(emptyState, /borderColor: routineTheme\.divider/);
  assert.match(emptyState, /styles\.emptyTitle, \{ color: routineTheme\.text \}/);
});

test("Inicio routine cards also use the shared gradient when completed, preserving the check animation", () => {
  const routine = source("../components/MiRutinaSection.tsx");
  assert.match(routine, /styles\.completionOverlay,\s*completionOverlayStyle,[\s\S]*?<RoutineGradientFill \/>[\s\S]*?<\/Reanimated\.View>/);
  assert.match(routine, /opacity: completionProgress\.value/);
  assert.match(routine, /withTiming\(completing \? 1 : 0, \{ duration: 500 \}\)/);
  assert.match(routine, /onPress=\{completeFromTicket\}/);
  assert.doesNotMatch(routine, /#276FC2/);
});

test("completion counter uses the gradient inside its clipped circle without changing its numbers", () => {
  const banner = source("../components/RoutineCompletionBanner.tsx");
  assert.equal((banner.match(/<RoutineGradientFill\b/g) ?? []).length, 1);
  assert.match(banner, /<View style=\{styles\.counter\}>\s*<RoutineGradientFill \/>/);
  assert.match(banner, /activeEvent\.previousCount/);
  assert.match(banner, /activeEvent\.nextCount/);
  assert.match(banner, /counter: \{[\s\S]*?borderRadius: COUNTER_SIZE \/ 2,[\s\S]*?overflow: "hidden"/);
  assert.doesNotMatch(banner, /COUNTER_SURFACE|#276FC2/);
});