import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";
import { DAILY_QUOTE_PALETTE_COLORS } from "../constants/daily-quote-palettes.ts";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");
const compile = (source: string) => ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true },
}).outputText;
const flatten = (style: any): Record<string, any> => Array.isArray(style)
  ? Object.assign({}, ...style.map(flatten)) : style && typeof style === "object" ? style : {};
const View = ({ children, style, colors }: any) => React.createElement("div", {
  "data-background": flatten(style).backgroundColor,
  "data-gradient": colors?.join("|"),
}, children);
let paletteId = "black16";
const mocks: Record<string, any> = {
  react: React,
  "react-native": {
    View, Text: View, Pressable: View, Modal: () => null, Share: {},
    StyleSheet: { create: (styles: any) => styles, absoluteFill: {} },
  },
  "@expo/vector-icons": { Feather: () => null },
  "expo-linear-gradient": { LinearGradient: View },
  "@/constants/daily-quote-palettes": { DAILY_QUOTE_PALETTE_COLORS },
  "@/components/DailyQuoteDecoration": { DailyQuoteDecorationLayer: () => null },
  "@/hooks/useQuoteOfTheDay": { useQuoteOfTheDay: () => ({ quote: { paletteId, text: "Frase", author: "Autor", decorationsEnabled: false } }) },
  "@/hooks/useRoutineTheme": { useRoutineTheme: () => ({ accent: "#FFF", surface: "#123456" }) },
  "@/hooks/useDailyQuoteShare": { useDailyQuoteShare: () => ({ open: () => {}, sheetProps: { visible: false } }) },
  "@/components/DailyQuoteShareSheet": { DailyQuoteShareSheet: () => null },
};
function load(path: string) {
  const module = { exports: {} as Record<string, React.ComponentType<any>> };
  new Function("React", "require", "module", "exports", compile(read(path)))(React, (name: string) => {
    assert.ok(name in mocks, `Missing mock ${name}`);
    return mocks[name];
  }, module, module.exports);
  return module.exports;
}

test("Admin offers Negro 16% and both mobile cards render the exact translucent black without a second background", () => {
  assert.deepEqual(DAILY_QUOTE_PALETTE_COLORS.black16, ["rgba(0,0,0,0.16)", "rgba(0,0,0,0.16)"]);
  const admin = read("../../resonancia-admin/src/pages/frase-del-dia.tsx");
  assert.match(admin, /id: "black16", name: "Negro 16 %"/);
  assert.match(admin, /onClick=\{\(\) => handlePaletteChange\(palette.id\)\}/);
  assert.match(admin, /data: \{ paletteId \}/);
  const cards = [
    load("../components/DailyWisdomCard.tsx").DailyWisdomCard,
    load("../components/QuoteOfTheDay.tsx").default,
  ];
  for (const Card of cards) {
    paletteId = "black16";
    const html = renderToStaticMarkup(React.createElement(Card, {
      backgroundColor: "#FFFFFF", style: { backgroundColor: "#FFFFFF" },
    }));
    assert.match(html, /data-background="transparent"/);
    assert.match(html, /data-gradient="rgba\(0,0,0,0.16\)\|rgba\(0,0,0,0.16\)"/);
    assert.doesNotMatch(html, /data-background="#FFFFFF"/);
    assert.match(html, /Frase/);
    assert.match(html, /Autor/);
    paletteId = "jade";
    assert.match(renderToStaticMarkup(React.createElement(Card)), /#073C3B\|#987044/);
  }
});

test("Fresh and cached daily quote assignments preserve the black16 palette", () => {
  const source = read("../hooks/useQuoteOfTheDay.ts");
  const ast = ts.createSourceFile("hook.ts", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const parser = ast.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === "parseAssignment");
  assert.ok(parser);
  const parse = new Function(`${compile(parser.getText(ast))}; return parseAssignment;`)();
  const assignment = { date: "2026-10-03", text: "Frase", author: "Autor", paletteId: "black16", decorationsEnabled: false };
  assert.equal(parse(assignment, assignment.date).paletteId, "black16");
  assert.equal(parse(JSON.parse(JSON.stringify(assignment)), assignment.date).paletteId, "black16");
  assert.equal(parse({ ...assignment, paletteId: "jade" }, assignment.date).paletteId, "jade");
});