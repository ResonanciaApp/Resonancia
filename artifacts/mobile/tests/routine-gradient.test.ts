import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { URL } from "node:url";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";
import { getThemeStyleId } from "../config/scene-themes.ts";
import { CLOUDY_WIDGET_PLUS_GRADIENT, NATURAL_WIDGET_PLUS_GRADIENT } from "../constants/colors.ts";

const source = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");
const compiled = ts.transpileModule(source("../components/RoutineGradientFill.tsx"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true },
}).outputText;
const module = { exports: {} as { RoutineGradientFill: React.ComponentType<{ style?: object }> } };
let themeId = "indigo2";
const mocks: Record<string, unknown> = {
  react: React,
  "@/config/scene-themes": { getThemeStyleId },
  "@/context/SceneThemeContext": { useSceneTheme: () => ({ theme: { id: themeId } }) },
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

test("routine gradient renders only the two updated reference colors horizontally without intercepting taps", () => {
  const html = renderToStaticMarkup(React.createElement(module.exports.RoutineGradientFill));
  assert.match(html, /data-colors="#477FBD,#4A99BC"/);
  assert.doesNotMatch(html, /#4265B5|#50AFB0/);
  assert.match(html, /data-start="0,0.5" data-end="1,0.5"/);
  assert.match(html, /data-pointer-events="none" data-position="absolute"/);
});

test("the floating add button gradient preserves its 18px rounded corners", () => {
  const html = renderToStaticMarkup(React.createElement(module.exports.RoutineGradientFill, {
    style: { borderRadius: 18 },
  }));
  assert.match(html, /data-radius="18"/);
});

test("only Cloudy uses the purple gradient, preserving direction, opacity and other themes", () => {
  try {
    for (const id of ["cloudy", "cloudy2", "indigo2", "tibet", "profundo"]) {
      themeId = id;
      const html = renderToStaticMarkup(React.createElement(module.exports.RoutineGradientFill));
      assert.ok(html.includes(`data-colors="${id === "cloudy" ? "#8247BD,#6C4ABC" : "#477FBD,#4A99BC"}"`));
      assert.match(html, /data-start="0,0.5" data-end="1,0.5"/);
      assert.match(html, /data-pointer-events="none" data-position="absolute"/);
      assert.doesNotMatch(html, /rgba|#4265B5|#50AFB0/);
    }
  } finally {
    themeId = "indigo2";
  }
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

test("Natural uses the exact gold gradient across routine fills without changing other themes", () => {
  try {
    for (const [id, expected] of [
      ["natural", "#E0A44A,#C99444"],
      ["cloudy", "#8247BD,#6C4ABC"],
      ["pleyades", "#477FBD,#4A99BC"],
      ["indigo2", "#477FBD,#4A99BC"],
    ]) {
      themeId = id;
      const html = renderToStaticMarkup(React.createElement(module.exports.RoutineGradientFill));
      assert.ok(html.includes(`data-colors="${expected}"`), id);
      assert.match(html, /data-start="0,0.5" data-end="1,0.5"/);
      assert.match(html, /data-pointer-events="none" data-position="absolute"/);
    }
  } finally {
    themeId = "indigo2";
  }
});

test("the Inicio widget plus has a solid green background only in Natural", () => {
  const home = source("../app/(tabs)/inicio8.tsx");
  const binding = home.match(/plusBackgroundGradient=\{([^\n}]+)\}/);
  assert.ok(binding);
  const resolve = new Function("activeTheme", "NATURAL_WIDGET_PLUS_GRADIENT", "CLOUDY_WIDGET_PLUS_GRADIENT", `return ${binding[1]};`);
  for (const id of ["natural", "cloudy", "indigo2", "pleyades", "cloudy2", "tibet"]) {
    const actual = resolve({ id }, NATURAL_WIDGET_PLUS_GRADIENT, CLOUDY_WIDGET_PLUS_GRADIENT);
    assert.deepEqual(actual, id === "natural" ? ["#52A855", "#52A855"] : id === "cloudy" ? ["#2D2F7C", "#2D3981"] : undefined);
  }
  assert.match(home, /colors=\{plusBackgroundGradient \?\? \["#532FA8", "#372FA8"\]\}/);
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