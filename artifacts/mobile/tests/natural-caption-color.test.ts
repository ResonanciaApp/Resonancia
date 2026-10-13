import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";
import { CARD_TEXT_BELOW, getCardTextBelowColor } from "../constants/colors.ts";

const root = path.resolve(import.meta.dirname, "..");
const source = readFileSync(path.join(root, "components/CardCaptionText.tsx"), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true },
}).outputText;
let color = CARD_TEXT_BELOW;
const contextModule = { exports: {} as {
  CardCaptionColorContext?: React.Context<string>; useCardCaptionColor?: () => string;
} };
new Function("require", "module", "exports", ts.transpileModule(
  readFileSync(path.join(root, "context/CardCaptionColorContext.ts"), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  },
).outputText)(
  (name: string) => {
    if (name === "react") return React;
    if (name === "@/constants/colors") return { CARD_TEXT_BELOW };
    throw new Error(`Unexpected context import ${name}`);
  }, contextModule, contextModule.exports,
);
const captionModule = { exports: {} as { CardCaptionText?: React.ElementType } };
const flatten = (style: any): any => Array.isArray(style)
  ? Object.assign({}, ...style.filter(Boolean).map(flatten))
  : style || {};
const NativeText = React.forwardRef<any, any>((props, ref) =>
  React.createElement("span", { ref, "data-style": JSON.stringify(flatten(props.style)) }, props.children));
new Function("require", "module", "exports", compiled)(
  (name: string) => {
    if (name === "react") return React;
    if (name === "react-native") return { Text: NativeText, StyleSheet: { flatten } };
    if (name === "@/constants/colors") return { CARD_TEXT_BELOW };
    if (name === "@/context/CardCaptionColorContext") return contextModule.exports;
    throw new Error(`Unexpected import ${name}`);
  }, captionModule, captionModule.exports,
);
const Caption = captionModule.exports.CardCaptionText!;
function renderedStyle(style: any, withProvider = true) {
  const caption = React.createElement(Caption, { style }, "autor");
  const html = renderToStaticMarkup(withProvider ? React.createElement(
    contextModule.exports.CardCaptionColorContext!.Provider, { value: color }, caption,
  ) : caption);
  const encoded = html.match(/data-style="([^"]+)"/)![1];
  return JSON.parse(encoded.replace(/&quot;/g, '"').replace(/&amp;/g, "&"));
}

test("Natural remaps only EBF2FF, preserving font, opacity, shadows and layout", () => {
  color = getCardTextBelowColor("natural");
  const original = {
    color: CARD_TEXT_BELOW, fontSize: 11, fontFamily: "Manrope", fontWeight: "500",
    marginTop: 4, opacity: 0.8, textShadowRadius: 4,
  };
  assert.deepEqual(renderedStyle([null, original]), { ...original, color: "#F5FFF5" });
  assert.equal(original.color, CARD_TEXT_BELOW);
  assert.equal(renderedStyle([{ color: CARD_TEXT_BELOW }, { color: "#D1D1D1" }]).color, "#D1D1D1");
  assert.equal(renderedStyle({ color: "#F4F4F4" }).color, "#F4F4F4");
  assert.equal(renderedStyle({ color: "#ebf2ff" }).color, "#F5FFF5");
});

test("Cloudy, Indigo, Pleyades, Galactic and the no-provider fallback retain the original color", () => {
  for (const theme of ["cloudy", "indigo2", "pleyades", "galactic", undefined]) {
    color = getCardTextBelowColor(theme);
    assert.equal(color, "#EBF2FF");
    assert.equal(renderedStyle({ color: CARD_TEXT_BELOW }).color, "#EBF2FF");
  }
  color = "#F5FFF5";
  assert.equal(renderedStyle({ color: CARD_TEXT_BELOW }, false).color, "#EBF2FF");
});

test("Fuego replaces the shared caption color without changing other styling or colors", () => {
  color = getCardTextBelowColor("fuego");
  assert.equal(color, "#FFECEB");
  const style = { color: CARD_TEXT_BELOW, fontSize: 12, opacity: 0.8, marginTop: 4 };
  assert.deepEqual(renderedStyle(style), { ...style, color: "#FFECEB" });
  assert.equal(renderedStyle({ color: "#ebf2ff" }).color, "#FFECEB");
  assert.equal(renderedStyle({ color: "#F9F9F9" }).color, "#F9F9F9");
  assert.equal(style.color, CARD_TEXT_BELOW);
});

test("subsequent renders follow theme changes into and out of Natural", () => {
  for (const theme of ["cloudy", "natural", "fuego", "pleyades", "natural", "fuego", "galactic", "indigo2"]) {
    color = getCardTextBelowColor(theme);
    assert.equal(renderedStyle({ color: CARD_TEXT_BELOW }).color,
      theme === "fuego" ? "#FFECEB" : theme === "natural" ? "#F5FFF5" : "#EBF2FF");
  }
});

test("every app and shared-card consumer of the old color uses the theme-aware Text", () => {
  const files = (dir: string): string[] => readdirSync(dir, { withFileTypes: true })
    .flatMap(entry => entry.isDirectory() ? files(path.join(dir, entry.name))
      : entry.name.endsWith(".tsx") ? [path.join(dir, entry.name)] : []);
  let consumers = 0;
  for (const filename of [...files(path.join(root, "app")), ...files(path.join(root, "components"))]) {
    if (filename.endsWith("/CardCaptionText.tsx")) continue;
    const text = readFileSync(filename, "utf8");
    if (!text.includes("CARD_TEXT_BELOW") && !/#ebf2ff/i.test(text)) continue;
    consumers++;
    assert.match(text, /import \{ CardCaptionText as Text \} from "@\/components\/CardCaptionText"/, filename);
    const ast = ts.createSourceFile(filename, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    for (const statement of ast.statements) {
      if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)
        || statement.moduleSpecifier.text !== "react-native") continue;
      const bindings = statement.importClause?.namedBindings;
      if (bindings && ts.isNamedImports(bindings)) {
        assert.ok(!bindings.elements.some(binding => binding.name.text === "Text"), filename);
      }
    }
  }
  assert.ok(consumers >= 27);
  const recommendations = readFileSync(path.join(root, "components/DailyRecommendationsSection.tsx"), "utf8");
  assert.match(recommendations, /getCardTextBelowColor\(activeSceneId\)/);
  assert.match(recommendations, /metaTextColor=\{cardTextBelow\}/);
  assert.match(recommendations, /authorColor=\{cardTextBelow\}/);
  const provider = readFileSync(path.join(root, "context/SceneThemeContext.tsx"), "utf8");
  assert.match(provider, /CardCaptionColorContext\.Provider value=\{getCardTextBelowColor\(activeSceneId\)\}/);
});
