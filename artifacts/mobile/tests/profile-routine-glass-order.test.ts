import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import React from "react";
import ts from "typescript";
import { getTabBarGlassOverlay, TAB_PILL_BLUR_INTENSITY, TAB_PILL_BLUR_TINT } from "../constants/tab-bar.ts";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");
const calendar = read("../app/rutina-calendario.tsx");
const profile = read("../components/ProfileScreenBase.tsx");
const card = read("../components/InnerSpaceCard.tsx");
const parse = (text: string) => ts.createSourceFile("source.tsx", text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const compile = (text: string) => ts.transpileModule(text, {
  compilerOptions: { jsx: ts.JsxEmit.React, module: ts.ModuleKind.CommonJS },
}).outputText;
function walk(node: ts.Node, visit: (node: ts.Node) => void) {
  visit(node);
  node.forEachChild(child => walk(child, visit));
}
function style(text: string, name: string) {
  const ast = parse(text);
  let value = "";
  walk(ast, node => {
    if (ts.isPropertyAssignment(node) && node.name.getText(ast) === name && ts.isObjectLiteralExpression(node.initializer)) {
      value = node.initializer.getText(ast);
    }
  });
  assert.ok(value, `Missing style ${name}`);
  return new Function("StyleSheet", `return (${value});`)({ absoluteFillObject: { top: 0, left: 0, right: 0, bottom: 0 }, hairlineWidth: 0.5 });
}

test("routine history add button uses the actual tab glass in all four themes and keeps navigation", () => {
  const ast = parse(calendar);
  let button = "";
  walk(ast, node => {
    if (ts.isJsxElement(node) && node.openingElement.tagName.getText(ast) === "Pressable"
      && node.openingElement.attributes.properties.some(attribute => ts.isJsxAttribute(attribute)
        && attribute.name.getText(ast) === "accessibilityLabel" && attribute.initializer?.getText(ast) === '"Añadir una actividad a Mi Rutina"')) {
      button = node.getText(ast);
    }
  });
  assert.ok(button);
  assert.match(calendar, /const tabBarGlassOverlay = getTabBarGlassOverlay\(activeSceneId\)/);
  const styles = Object.fromEntries(["addActivity", "addActivityGlass", "addActivityText"].map(name => [name, style(calendar, name)]));
  const render = new Function("React", "Pressable", "View", "BlurView", "Feather", "Text", "router", "styles", "StyleSheet", "bottomPad", "tabBarGlassOverlay", "TAB_PILL_BLUR_TINT", "TAB_PILL_BLUR_INTENSITY",
    `${compile(`function Render(){ return (${button}); }`)}\nreturn Render();`);
  const nodes = (element: any): any[] => !React.isValidElement(element) ? []
    : [element, ...React.Children.toArray((element.props as any).children).flatMap(nodes)];
  for (const theme of ["cloudy", "indigo2", "natural", "pleyades"]) {
    const pushed: string[] = [];
    const element = render(React, "pressable", "view", "blur", "icon", "text",
      { push: (route: string) => pushed.push(route) }, styles, { absoluteFill: {} }, 34,
      getTabBarGlassOverlay(theme), TAB_PILL_BLUR_TINT, TAB_PILL_BLUR_INTENSITY);
    const all = nodes(element);
    const blur = all.find(node => node.type === "blur");
    assert.equal(blur.props.intensity, 38);
    assert.equal(blur.props.tint, "light");
    assert.equal(blur.props.experimentalBlurMethod, "dimezisBlurView");
    const tint = all.find(node => Array.isArray(node.props.style) && node.props.style[1]?.backgroundColor);
    assert.equal(tint.props.style[1].backgroundColor, theme === "natural" ? "rgba(8,33,28,0.744)" : "rgba(14,8,33,0.744)");
    assert.equal(all.find(node => node.props.style === styles.addActivityGlass).props.pointerEvents, "none");
    assert.equal(styles.addActivityGlass.overflow, "hidden");
    assert.equal(styles.addActivity.overflow, undefined);
    assert.equal(element.props.style({ pressed: false })[1].bottom, 72);
    assert.equal(element.props.style({ pressed: true })[1].opacity, 0.78);
    element.props.onPress();
    assert.deepEqual(pushed, ["/crear-rutina?from=calendar"]);
  }
  const shadow = style(read("../app/(tabs)/_layout.tsx"), "pillShadow");
  for (const key of ["shadowColor", "shadowOpacity", "shadowRadius", "elevation", "shadowOffset"]) {
    assert.deepEqual(styles.addActivity[key], shadow[key]);
  }
  assert.equal(styles.addActivity.height, 47);
});

test("Profile places routine before reflection wall, preserving both section margins and wall callbacks", () => {
  const ast = parse(profile);
  const sections: ts.JsxSelfClosingElement[] = [];
  walk(ast, node => {
    if (ts.isJsxSelfClosingElement(node) && ["MiRutinaSection", "ProfileReflectionWallSection"].includes(node.tagName.getText(ast))) sections.push(node);
  });
  assert.deepEqual(sections.map(node => node.tagName.getText(ast)), ["MiRutinaSection", "ProfileReflectionWallSection"]);
  for (const section of sections) {
    assert.match(section.getText(ast), /marginTop: 40/);
    assert.match(section.getText(ast), /marginBottom: PROFILE_SECTION_GAP/);
  }
  assert.match(sections[1].getText(ast), /ref=\{profileWallRef\}/);
  assert.match(sections[1].getText(ast), /onCollapsedHeightChange=\{setProfileWallCardHeight\}/);
});

test("Profile wall starts and closes at 0.9, opens at 0.4, and preserves fade and reduced motion", () => {
  const closed = card.match(/const closedBorderOpacity = ([^;]+);/)?.[1];
  const transition = card.match(/sectionBorderOpacity\.value = (reduceMotion[\s\S]*?);\n/)?.[1];
  assert.ok(closed && transition);
  assert.match(card, /borderWidth=\{profileVariant \? \(expanded \? 1 : 2\) : 2\}/);
  assert.match(card, /useSharedValue\(closedBorderOpacity\)/);
  assert.match(card, /if \(!expandedRef\.current && !animatingRef\.current\) \{\s*sectionBorderOpacity\.value = closedBorderOpacity/);
  const resolveClosed = new Function("profileVariant", `return (${closed});`);
  const resolveTransition = new Function("opening", "reduceMotion", "closedBorderOpacity", "withTiming", "PANEL_DURATION", "ReanimatedEasing", `return (${transition});`);
  for (const profileVariant of [true, false]) {
    const closedOpacity = resolveClosed(profileVariant);
    assert.equal(closedOpacity, profileVariant ? 0.9 : 0.4);
    for (const opening of [true, false]) {
      for (const reducedMotion of [true, false]) {
        const calls: any[] = [];
        const opacity = resolveTransition(opening, reducedMotion, closedOpacity,
          (target: number, options: unknown) => { calls.push({ target, options }); return target; },
          300, { inOut: (easing: unknown) => easing, quad: "quad" });
        assert.equal(opacity, opening ? 0.4 : closedOpacity);
        assert.equal(calls.length, reducedMotion ? 0 : 1);
        if (!reducedMotion) assert.deepEqual(calls[0].options, { duration: 300, easing: "quad" });
      }
    }
  }
});
