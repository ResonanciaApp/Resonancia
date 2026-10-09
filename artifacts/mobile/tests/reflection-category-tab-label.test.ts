import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { URL } from "node:url";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";
import {
  REFLECTION_WALL_BORDER_GRADIENT,
  REFLECTION_WALL_BORDER_START,
  REFLECTION_WALL_BORDER_END,
  REFLECTION_WALL_BORDER_BRIGHTNESS,
} from "../constants/reflectionWallBorder.ts";

const source = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");
const compiled = ts.transpileModule(source("../components/ReflectionCategoryTabLabel.tsx"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true },
}).outputText;
const flatten = (style: any) => Object.assign({}, ...(Array.isArray(style) ? style : [style]));
const mocks: Record<string, unknown> = {
  react: React,
  "react-native": {
    StyleSheet: {
      create: (styles: unknown) => styles,
      absoluteFillObject: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0 },
    },
    View: ({ children, style, pointerEvents }: any) => {
      const resolved = flatten(style);
      return React.createElement("div", {
        "data-position": resolved.position,
        "data-border-color": resolved.borderColor,
        "data-border-width": resolved.borderWidth,
        "data-border-radius": resolved.borderRadius,
        "data-pointer": pointerEvents,
      }, children);
    },
    Text: ({ children, style, accessible, importantForAccessibility }: any) => {
      const resolved = flatten(style);
      return React.createElement("span", {
        "data-size": resolved.fontSize,
        "data-color": resolved.color,
        "data-weight": resolved.fontWeight,
        "data-accessible": accessible,
        "data-importance": importantForAccessibility,
      }, children);
    },
  },
  "@/constants/reflectionWallBorder": {
    REFLECTION_WALL_BORDER_GRADIENT,
    REFLECTION_WALL_BORDER_START,
    REFLECTION_WALL_BORDER_END,
    REFLECTION_WALL_BORDER_BRIGHTNESS,
  },
  "@/components/DiscoverSearchBorder": {
    DiscoverSearchBorder: ({ colors, start, end, borderRadius, borderWidth, brightness }: any) =>
      React.createElement("div", {
        "data-gradient": colors.join(","),
        "data-start": `${start.x},${start.y}`,
        "data-end": `${end.x},${end.y}`,
        "data-radius": borderRadius,
        "data-width": borderWidth,
        "data-brightness": brightness,
      }),
  },
};
const module = { exports: {} as {
  ReflectionCategoryTabLabel: React.ComponentType<any>;
  ReflectionCategoryTabBorder: React.ComponentType<{ color?: string }>;
} };
new Function("require", "module", "exports", compiled)((name: string) => {
  assert.ok(name in mocks, `Unexpected dependency ${name}`);
  return mocks[name];
}, module, module.exports);
const { ReflectionCategoryTabLabel, ReflectionCategoryTabBorder } = module.exports;
const render = (selected: boolean) => renderToStaticMarkup(
  React.createElement(ReflectionCategoryTabLabel, {
    label: "Gratitud", selected, textStyle: { fontSize: 12, fontWeight: "500" },
  }),
);

test("selected labels are fully white and bold while inactive labels retain their neutral style", () => {
  assert.match(render(true), /data-color="#FFFFFF" data-weight="700"/);
  assert.match(render(false), /data-color="#E0E0E0" data-weight="500"/);
});

test("Pleyades uniform labels keep the same 10px size and 500 weight in both states", () => {
  for (const selected of [false, true]) {
    const html = renderToStaticMarkup(React.createElement(ReflectionCategoryTabLabel, {
      label: "Gratitud", selected, uniformWeight: true, textStyle: { fontSize: 10, fontWeight: "500" },
    }));
    assert.match(html, new RegExp(`data-size="10" data-color="${selected ? "#FFFFFF" : "#E0E0E0"}" data-weight="500"`));
    assert.match(html, /data-color="transparent" data-weight="700"/, "reserved width remains unchanged");
  }
});

test("both selection states reserve the same bold text width with an inaccessible transparent copy", () => {
  for (const selected of [false, true]) {
    const html = render(selected);
    assert.match(html, /data-color="transparent" data-weight="700" data-accessible="false" data-importance="no-hide-descendants">Gratitud/);
    assert.match(html, /data-position="absolute"/);
    assert.doesNotMatch(html, /data-weight="500"[^>]*data-color="transparent"/);
  }
});

test("Todos shares the same selected white/bold label as the category filters", () => {
  const html = renderToStaticMarkup(React.createElement(ReflectionCategoryTabLabel, {
    label: "Todos", selected: true, textStyle: { fontSize: 13 },
  }));
  assert.match(html, /data-color="#FFFFFF" data-weight="700">Todos/);
});

test("Todos keeps its existing wall gradient and brightness with a 1px stroke", () => {
  const html = renderToStaticMarkup(React.createElement(ReflectionCategoryTabBorder));
  assert.ok(html.includes(`data-gradient="${REFLECTION_WALL_BORDER_GRADIENT.join(",")}"`));
  assert.ok(html.includes(`data-start="${REFLECTION_WALL_BORDER_START.x},${REFLECTION_WALL_BORDER_START.y}"`));
  assert.ok(html.includes(`data-end="${REFLECTION_WALL_BORDER_END.x},${REFLECTION_WALL_BORDER_END.y}"`));
  assert.match(html, /data-radius="999" data-width="1"/);
  assert.ok(html.includes(`data-brightness="${REFLECTION_WALL_BORDER_BRIGHTNESS}"`));
});

test("category borders use their exact editorial color without affecting layout or blocking taps", () => {
  for (const color of ["#F075B3", "#5FCA81", "#5FA1CA", "#B875F0", "#F2C94C", "#123456"]) {
    const html = renderToStaticMarkup(React.createElement(ReflectionCategoryTabBorder, { color }));
    assert.ok(html.includes(`data-border-color="${color}"`));
    assert.match(html, /data-position="absolute"/);
    assert.match(html, /data-border-width="1" data-border-radius="999" data-pointer="none"/);
    assert.doesNotMatch(html, /data-gradient/);
  }
});

test("composer and message filters share the category label and keep filtering handlers", () => {
  const composer = source("../components/InnerSpaceCard.tsx");
  const wall = source("../app/mi-espacio-interior.tsx");
  assert.match(composer, /category === cat\.id && theme\.id !== "pleyades" && <ReflectionCategoryTabBorder color=\{cat\.color\}/);
  assert.match(composer, /<ReflectionCategoryTabLabel[\s\S]*?selected=\{category === cat\.id\}/);
  assert.match(wall, /isActive && <ReflectionCategoryTabBorder color=\{cat\.color\}/);
  assert.match(wall, /filter === "all" && <ReflectionCategoryTabBorder/);
  assert.match(wall, /<ReflectionCategoryTabLabel[\s\S]*?selected=\{isActive\}/);
  assert.match(wall, /setFilter\(cat\.id as ReflectionCategory\)/);
  assert.match(wall, /setFilter\("all"\)/);
  assert.match(wall, /filterPillSelected: \{\s*backgroundColor: "rgba\(0,0,0,0\.16\)"/);
});