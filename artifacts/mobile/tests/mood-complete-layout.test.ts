import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";
import { MOODS } from "../data/moods.ts";

const source = readFileSync("components/MoodPickerSheet.tsx", "utf8");
const ast = ts.createSourceFile("MoodPickerSheet.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let finalBranch = "";
let styleObject: ts.ObjectLiteralExpression | undefined;
function walk(node: ts.Node) {
  if (ts.isBinaryExpression(node) && node.left.getText(ast) === 'step === "complete"') {
    finalBranch = node.right.getText(ast);
  }
  if (ts.isVariableDeclaration(node) && node.name.getText(ast) === "styles"
    && node.initializer && ts.isCallExpression(node.initializer)
    && ts.isObjectLiteralExpression(node.initializer.arguments[0])) {
    styleObject = node.initializer.arguments[0];
  }
  ts.forEachChild(node, walk);
}
walk(ast);
assert.ok(finalBranch);
assert.ok(styleObject);
const styles: Record<string, Record<string, unknown>> = {};
const needed = new Set([...finalBranch.matchAll(/styles\.(\w+)/g)].map(match => match[1]));
for (const property of styleObject.properties.filter(ts.isPropertyAssignment)) {
  const key = property.name.getText(ast);
  if (needed.has(key)) styles[key] = runInNewContext(`(${property.initializer.getText(ast)})`, {
    GOLD: "#BE9650",
    StyleSheet: { hairlineWidth: 0.5, absoluteFillObject: { position: "absolute", top: 0, bottom: 0, left: 0, right: 0 } },
  });
}
const compiled = ts.transpileModule(`export function Result() { return ${finalBranch}; }`, {
  compilerOptions: { jsx: ts.JsxEmit.React, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

function render(mood = MOODS[0], withQuote = true) {
  const nodes: { kind: string; props: any }[] = [];
  const presses: (() => void)[] = [];
  let closed = 0;
  const flat = (style: any): any => Array.isArray(style) ? Object.assign({}, ...style.map(flat)) : style ?? {};
  const native = (kind: string) => (props: any) => {
    nodes.push({ kind, props: { ...props, style: flat(props.style) } });
    if (props.onPress) presses.push(props.onPress);
    return React.createElement("div", { "data-kind": kind }, props.children);
  };
  const module = { exports: {} as { Result: React.ComponentType } };
  runInNewContext(compiled, {
    exports: module.exports, React, styles, viewportWidth: 402, emotionHeaderHeight: 394,
    topPad: 40, bottomPad: 34, GOLD: "#BE9650", visible: true,
    completionCycle: 1, CINEMATIC_BASE_DELAY: 150, CINEMATIC_DURATION: 1400,
    firstMood: mood, firstMoodAnswer: { id: "other", label: "Respuesta" },
    moodQuote: withQuote ? { text: "Frase emocional" } : null,
    recommendations: [{ id: "recommendation" }], isPremium: false,
    recommendationCardWidth: 220, recommendationCardHeight: 320,
    currentMonth: new Date("2026-10-09T12:00:00Z"), history: [{ createdAt: "2026-10-09" }],
    formatShortDate: () => "9 oct", handleClose: () => { closed++; },
    onClose: () => { closed++; }, router: { push: () => {} }, handleSessionPress: () => {},
    View: native("View"), Text: native("Text"), ScrollView: native("ScrollView"),
    Pressable: native("Pressable"), Feather: native("Icon"), Image: native("Image"),
    LinearGradient: native("LinearGradient"), CinematicFadeSlide: native("Animated"),
    MoodCalendar: native("Calendar"), SessionCarousel: native("Carousel"),
    EmotionalQuoteCard: native("Quote"),
  });
  const html = renderToStaticMarkup(React.createElement(module.exports.Result));
  return { html, nodes, presses, closed: () => closed };
}

test("all 18 emotions finish without hero images or extra background gradients", () => {
  assert.equal(MOODS.length, 18);
  for (const mood of MOODS) {
    const { html, nodes } = render(mood);
    assert.ok(html.includes(mood.label), mood.id);
    assert.equal(nodes.filter(node => node.kind === "Image" || node.kind === "LinearGradient").length, 0, mood.id);
    assert.equal(nodes.filter(node => node.kind === "Carousel").length, 1);
    assert.equal(nodes.filter(node => node.kind === "Calendar").length, 1);
    assert.equal(nodes.filter(node => node.kind === "Quote").length, 1);
  }
  assert.doesNotMatch(source, /MOOD_HEROES|getMoodHeroGradient|hero-background:/);
  assert.match(source, /<LinearGradient colors=\{bgColors\} style=\{styles\.root\}>/);
});

test("completion scroll bounces at both ends even with short content, without a fixed footer", () => {
  const { nodes } = render();
  const scroll = nodes.find(node => node.props.testID === "mood-complete-scroll")!.props;
  assert.equal(scroll.bounces, true);
  assert.equal(scroll.alwaysBounceVertical, true);
  assert.equal(scroll.overScrollMode, "always");
  assert.equal(scroll.contentInsetAdjustmentBehavior, "never");
  assert.equal(scroll.automaticallyAdjustContentInsets, false);
  assert.equal(scroll.contentContainerStyle.paddingBottom, 62);
  assert.doesNotMatch(finalBranch, /styles\.footer|styles\.surveyFooter/);
  const header = nodes.find(node => node.props.style?.zIndex === 10)!.props;
  assert.equal(header.pointerEvents, "box-none");
  assert.equal(header.style.backgroundColor, "transparent");
});

test("section lines disappear while spacing is preserved with and without a quote", () => {
  assert.deepEqual(Object.keys(styles.completeSectionGap), ["height"]);
  assert.equal(styles.completeSectionGap.height, 62.5);
  assert.doesNotMatch(finalBranch, /completeSectionDivider/);
  for (const withQuote of [true, false]) {
    const { html, nodes, presses, closed } = render(MOODS[0], withQuote);
    assert.ok(html.indexOf("Resonancia te recomienda:") < html.indexOf("Este mes"));
    assert.equal(nodes.filter(node => node.props.style?.height === 62.5).length, withQuote ? 3 : 2);
    assert.equal(nodes.filter(node => node.kind === "Quote").length, withQuote ? 1 : 0);
    presses[0]();
    assert.equal(closed(), 1);
  }
});
