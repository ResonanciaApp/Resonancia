import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { URL } from "node:url";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const source = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");
const flatten = (style: any) => Object.assign({}, ...(Array.isArray(style) ? style : [style]));
const compiled = ts.transpileModule(source("../components/SessionDurationBadge.tsx"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true },
}).outputText;
const mocks: Record<string, unknown> = {
  react: React,
  "expo-blur": { BlurView: () => React.createElement("div", { "data-blur": true }) },
  "@expo/vector-icons": {
    MaterialCommunityIcons: ({ name }: any) => React.createElement("span", { "data-icon": name }),
  },
  "react-native": {
    Platform: { OS: "ios" },
    StyleSheet: { create: (styles: unknown) => styles, absoluteFill: { position: "absolute" } },
    View: ({ style, children }: any) => React.createElement("div", {
      "data-background": flatten(style).backgroundColor,
    }, children),
    Text: ({ style, children }: any) => React.createElement("span", {
      "data-color": flatten(style).color,
    }, children),
  },
};
const module = { exports: {} as { SessionDurationBadge: React.ComponentType<any> } };
new Function("require", "module", "exports", compiled)((name: string) => {
  assert.ok(name in mocks, `Unexpected dependency ${name}`);
  return mocks[name];
}, module, module.exports);
const render = (props = {}) => renderToStaticMarkup(React.createElement(
  module.exports.SessionDurationBadge, { label: "12 MIN", showClock: true, ...props },
));

test("sleep duration tint replaces white or black glass tint, preserving blur, clock and white text", () => {
  for (const whiteGlass of [false, true]) {
    const html = render({ whiteGlass, tintColor: "rgba(55,59,65,0.28)" });
    assert.match(html, /data-background="rgba\(55,59,65,0\.28\)"/);
    assert.doesNotMatch(html, /data-background="rgba\(0,0,0,0\.20\)"|data-background="rgba\(255,255,255,0\.15\)"/);
    assert.match(html, /data-blur="true"/);
    assert.match(html, /data-icon="clock"/);
    assert.match(html, /data-color="#FFFFFF">12 min/);
  }
});

test("other surfaces keep their existing white and black glass treatments", () => {
  assert.match(render(), /data-background="rgba\(0,0,0,0\.20\)"/);
  assert.match(render({ whiteGlass: true }), /data-background="rgba\(255,255,255,0\.15\)"/);
});

test("Dormir opts every session and playlist carousel into the same dark lead-grey tint", () => {
  const sleep = source("../app/(tabs)/descanzo.tsx");
  const carousels = sleep.match(/<(?:SessionCarousel|EditorialPlaylistCarousel)\b[\s\S]*?\/>/g) ?? [];
  assert.equal(carousels.length, 3);
  for (const carousel of carousels) assert.match(carousel, /durationBadgeTint=\{SLEEP_DURATION_TINT\}/);
  assert.match(sleep, /const SLEEP_DURATION_TINT = "rgba\(55,59,65,0\.28\)"/);
  for (const path of ["../components/SessionCarousel.tsx", "../components/EditorialPlaylistCarousel.tsx"]) {
    const badges = source(path).match(/<SessionDurationBadge\b[\s\S]*?\/>/g) ?? [];
    assert.ok(badges.length);
    for (const badge of badges) assert.match(badge, /tintColor=\{durationBadgeTint\}/);
  }
});