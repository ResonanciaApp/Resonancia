import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { URL } from "node:url";
import React from "react";
import * as JSXRuntime from "react/jsx-runtime";
import ts from "typescript";
import {
  MOOD_HISTORY_GRADIENT,
  MOOD_HISTORY_GRADIENT_START,
  MOOD_HISTORY_GRADIENT_END,
} from "../constants/moodHistoryGradient.ts";
import {
  REFLECTION_WALL_BORDER_GRADIENT,
  REFLECTION_WALL_BORDER_START,
  REFLECTION_WALL_BORDER_END,
  REFLECTION_WALL_BORDER_BRIGHTNESS,
} from "../constants/reflectionWallBorder.ts";

function source(path: string) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

function style(file: string, name: string, values: Record<string, unknown> = {}): Record<string, unknown> {
  const contents = source(`../components/${file}.tsx`);
  const ast = ts.createSourceFile(file, contents, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let initializer: ts.Expression | undefined;
  function visit(node: ts.Node) {
    if (ts.isVariableDeclaration(node) && node.name.getText(ast) === "styles"
      && node.initializer && ts.isCallExpression(node.initializer)
      && ts.isObjectLiteralExpression(node.initializer.arguments[0])) {
      const property = node.initializer.arguments[0].properties.find((entry) =>
        ts.isPropertyAssignment(entry) && entry.name.getText(ast) === name);
      if (property && ts.isPropertyAssignment(property)) initializer = property.initializer;
    }
    ts.forEachChild(node, visit);
  }
  visit(ast);
  assert.ok(initializer, `${file} defines ${name}`);
  const compiled = ts.transpileModule(`return (${initializer.getText(ast)});`, {
    compilerOptions: { target: ts.ScriptTarget.ES2022 },
  }).outputText;
  return new Function(...Object.keys(values), compiled)(...Object.values(values)) as Record<string, unknown>;
}

test("InnerSpaceCard keeps Home defaults and opts profile into a single 18px-inset card title", () => {
  const defaults = style("InnerSpaceCard", "container", { INNER_SPACE_CARD_BOTTOM_MARGIN: 32 });
  assert.equal(defaults.paddingHorizontal, 20);
  assert.equal(defaults.paddingTop, 12);
  assert.equal(defaults.paddingBottom, 16);
  assert.equal(defaults.marginBottom, 32);

  const profileInsets = style("InnerSpaceCard", "canonicalVerticalInsets");
  assert.deepEqual(profileInsets, { paddingTop: 18, paddingBottom: 18, marginBottom: 0, borderColor: "transparent" });

  const card = source("../components/InnerSpaceCard.tsx");
  const titleAt = card.indexOf("{sectionTitle ? (");
  const headerAt = card.indexOf("<View style={styles.header}>");
  assert.ok(titleAt > headerAt && titleAt < card.indexOf('style={styles.infoButton}'), "heading and description share the same header row with the plus");
  assert.match(card, /style=\{\[styles\.container,\s*canonicalVerticalInsets && styles\.canonicalVerticalInsets\]\}/);
  assert.match(card, /styles\.sectionTitle,\s*\{ color: colors\.foreground \}/);
});

test("only the profile wall uses the reference Aurora gradient with 5% more brightness", () => {
  const card = source("../components/InnerSpaceCard.tsx");
  const border = source("../components/DiscoverSearchBorder.tsx");
  assert.match(card, /canonicalVerticalInsets && \(\s*<DiscoverSearchBorder[\s\S]*?borderRadius=\{24\}[\s\S]*?brightness=\{REFLECTION_WALL_BORDER_BRIGHTNESS\}[\s\S]*?colors=\{REFLECTION_WALL_BORDER_GRADIENT\}[\s\S]*?start=\{REFLECTION_WALL_BORDER_START\}[\s\S]*?end=\{REFLECTION_WALL_BORDER_END\}/);
  assert.match(border, /borderWidth = 2/);
  assert.match(border, /brightness = 1/);
  assert.match(border, /opacity: 0\.99 \* brightness/);
  assert.match(border, /colors = SEARCH_BORDER_GRADIENT/);
  assert.match(border, /pointerEvents="none"/);
  assert.equal(style("InnerSpaceCard", "container", { INNER_SPACE_CARD_BOTTOM_MARGIN: 32 }).borderColor, "rgba(255,255,255,0.1)");
  const history = source("../app/historial-emociones.tsx");
  assert.match(history, /colors=\{MOOD_HISTORY_GRADIENT\}/);
  assert.match(history, /start=\{MOOD_HISTORY_GRADIENT_START\}/);
  assert.match(history, /end=\{MOOD_HISTORY_GRADIENT_END\}/);
  assert.deepEqual(MOOD_HISTORY_GRADIENT, ["#074B4C", "#24414F", "#2E3955", "#363459", "#493453", "#57334F", "#5B3D25"]);
  assert.deepEqual(MOOD_HISTORY_GRADIENT_START, { x: 0.35, y: 0 });
  assert.deepEqual(MOOD_HISTORY_GRADIENT_END, { x: 0.65, y: 1 });
  assert.deepEqual(REFLECTION_WALL_BORDER_GRADIENT, ["#4D6FA8", "#5D79C0", "#756EC1", "#916BB5", "#AE719E", "#C18A82", "#D0A66F"]);
  assert.deepEqual(REFLECTION_WALL_BORDER_START, { x: 0, y: 0.5 });
  assert.deepEqual(REFLECTION_WALL_BORDER_END, { x: 1, y: 0.5 });
  assert.equal(REFLECTION_WALL_BORDER_BRIGHTNESS, 0.9603 * 1.05);
});

test("the wall renders all seven reference stops horizontally, with 5% more brightness, without changing Discover", () => {
  const compiled = ts.transpileModule(source("../components/DiscoverSearchBorder.tsx"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  const mocks: Record<string, unknown> = {
    "react/jsx-runtime": JSXRuntime,
    "@react-native-masked-view/masked-view": () => null,
    "expo-linear-gradient": { LinearGradient: () => null },
    "react-native": {
      View: () => null,
      StyleSheet: { create: (styles: unknown) => styles, absoluteFill: {}, absoluteFillObject: {} },
    },
    "@/constants/colors": { POSITIONED_DAY_GRADIENT: ["#123456", "#654321"] },
  };
  const module = { exports: {} as { DiscoverSearchBorder: (props: Record<string, unknown>) => React.ReactElement<any> } };
  new Function("require", "module", "exports", compiled)((name: string) => {
    assert.ok(name in mocks, `missing border mock: ${name}`);
    return mocks[name];
  }, module, module.exports);
  const original = module.exports.DiscoverSearchBorder({});
  const previous = module.exports.DiscoverSearchBorder({ borderRadius: 24, brightness: 0.9603 });
  const wall = module.exports.DiscoverSearchBorder({
    borderRadius: 24,
    brightness: REFLECTION_WALL_BORDER_BRIGHTNESS,
    colors: REFLECTION_WALL_BORDER_GRADIENT,
    start: REFLECTION_WALL_BORDER_START,
    end: REFLECTION_WALL_BORDER_END,
  });
  const resolve = (styles: Record<string, unknown>[]) => Object.assign({}, ...styles);
  assert.equal(resolve(original.props.style).opacity, 0.99);
  assert.ok(Math.abs(
    (resolve(wall.props.style).opacity as number) - (resolve(previous.props.style).opacity as number) * 1.05,
  ) < 1e-12);
  assert.equal(wall.props.pointerEvents, "none");
  assert.ok((resolve(wall.props.style).opacity as number) <= 1);
  assert.deepEqual(wall.props.children.props.colors, REFLECTION_WALL_BORDER_GRADIENT);
  assert.deepEqual(wall.props.children.props.start, REFLECTION_WALL_BORDER_START);
  assert.deepEqual(wall.props.children.props.end, REFLECTION_WALL_BORDER_END);
  assert.equal(original.props.children.props.colors.length, 2);
  assert.deepEqual(original.props.children.props.start, { x: 0, y: 0 });
  assert.deepEqual(original.props.children.props.end, { x: 1, y: 1 });
  assert.equal(resolve(wall.props.maskElement.props.style).borderWidth, 2);
  assert.equal(resolve(wall.props.maskElement.props.style).borderRadius, 24);
});

test("Perfil wall description matches Intención typography and centers the plus with both header lines", () => {
  const description = style("InnerSpaceCard", "canonicalHeaderDescription");
  const intention = style("GrowthJourney", "previewStory");
  assert.equal(description.fontSize, intention.fontSize);
  assert.equal(description.lineHeight, intention.lineHeight);
  assert.equal(description.fontWeight, "400");
  assert.equal(style("InnerSpaceCard", "header").alignItems, "center");
  assert.equal(style("InnerSpaceCard", "canonicalHeaderCopy").minHeight, 44);
  const card = source("../components/InnerSpaceCard.tsx");
  assert.match(card, /styles\.headerCopy, canonicalVerticalInsets && styles\.canonicalHeaderCopy/);
  assert.match(card, /styles\.headerTitle,\s+canonicalVerticalInsets && styles\.canonicalHeaderDescription/);
  assert.equal(style("InnerSpaceCard", "headerTitle").fontSize, 16, "Home keeps its existing text size");
});

test("Home forwards the opt-in title/insets and subtracts the selected card margin for both measurements", () => {
  const home = source("../components/HomeReflectionWallSection.tsx");
  assert.match(home, /sectionTitle\?: string/);
  assert.match(home, /canonicalVerticalInsets\?: boolean/);
  assert.match(home, /const bottomMargin = canonicalVerticalInsets \? 0 : INNER_SPACE_CARD_BOTTOM_MARGIN/);
  assert.equal((home.match(/- bottomMargin/g) ?? []).length, 2);
  assert.match(home, /sectionTitle=\{sectionTitle\}/);
  assert.match(home, /canonicalVerticalInsets=\{canonicalVerticalInsets\}/);
});

test("Perfil replays the existing saved banner after every successful save and Ver opens the wall above the tab bar", () => {
  const profile = source("../components/ProfileScreenBase.tsx");
  const ast = ts.createSourceFile("ProfileScreenBase.tsx", profile, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let trigger: ts.VariableDeclaration | undefined;
  let handler: ts.VariableDeclaration | undefined;
  let bottom: ts.VariableDeclaration | undefined;
  let wall: ts.JsxSelfClosingElement | undefined;
  let banner: ts.JsxExpression | undefined;
  function visit(node: ts.Node) {
    if (ts.isVariableDeclaration(node)) {
      if (node.name.getText(ast) === "[profileReflectionSavedTrigger, setProfileReflectionSavedTrigger]") trigger = node;
      if (node.name.getText(ast) === "handleProfileReflectionSaved") handler = node;
      if (node.name.getText(ast) === "profileReflectionBannerBottom") bottom = node;
    }
    if (ts.isJsxSelfClosingElement(node) && node.tagName.getText(ast) === "ProfileReflectionWallSection") wall = node;
    if (ts.isJsxExpression(node) && node.expression?.getText(ast).startsWith("dedicated &&")
      && node.expression.getText(ast).includes("<ReflectionSavedBanner")) banner = node;
    ts.forEachChild(node, visit);
  }
  visit(ast);
  assert.ok(trigger && handler && bottom && wall && banner);
  assert.ok(profile.indexOf(banner.getText(ast)) > profile.lastIndexOf("</KeyboardAwareScrollViewCompat>"));
  const compiled = ts.transpileModule(`
    function Surface(dedicated) {
      const ${trigger.getText(ast)};
      const ${handler.getText(ast)};
      const ${bottom.getText(ast)};
      const profileWallRef = { current: null }, profileScrollRef = { current: null };
      const getProfileScrollY = () => 0, setProfileWallComposing = () => {};
      return <>${wall.getText(ast)}${banner.getText(ast)}</>;
    }
  `, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React } }).outputText;
  let count = 0;
  let route = "";
  const Surface = new Function("React", "useState", "useCallback", "Platform", "insets", "router",
    "ProfileReflectionWallSection", "ReflectionSavedBanner", `${compiled}; return Surface;`)(
      React,
      () => [count, (update: (current: number) => number) => { count = update(count); }],
      (callback: () => void) => callback,
      { OS: "ios" }, { bottom: 34 },
      { push: (next: string) => { route = next; } },
      () => null, () => null,
    );
  const first = Surface(true).props.children;
  assert.equal(first[1].props.trigger, 0);
  first[0].props.onMessageSaved();
  const second = Surface(true).props.children;
  assert.equal(second[1].props.trigger, 1);
  assert.equal(second[1].props.bottom, 58 + 34 + 15);
  second[0].props.onMessageSaved();
  assert.equal(Surface(true).props.children[1].props.trigger, 2);
  second[1].props.onPress();
  assert.equal(route, "/mi-espacio-interior");
  assert.equal(Surface(false).props.children[1], false);
});

test("saving failures cannot trigger the registered-message banner", () => {
  const card = source("../components/InnerSpaceCard.tsx");
  const ast = ts.createSourceFile("InnerSpaceCard.tsx", card, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let success = "", error = "";
  function visit(node: ts.Node) {
    if (ts.isPropertyAssignment(node) && node.name.getText(ast) === "onSuccess") success = node.initializer.getText(ast);
    if (ts.isPropertyAssignment(node) && node.name.getText(ast) === "onError") error = node.initializer.getText(ast);
    ts.forEachChild(node, visit);
  }
  visit(ast);
  assert.match(success, /onMessageSaved\?\.\(\)/);
  assert.match(error, /setSaveError/);
  assert.doesNotMatch(error, /onMessageSaved/);
  assert.match(source("../components/HomeReflectionWallSection.tsx"), /onMessageSaved=\{onMessageSaved\}/);
});

test("Profile wrapper forwards composer inputs/ref, uses the profile heading and keeps its 21px outer gap", () => {
  const wrapperSource = source("../components/ProfileReflectionWallSection.tsx");
  const compiled = ts.transpileModule(wrapperSource, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.React,
      esModuleInterop: true,
    },
  }).outputText;
  const mocks = {
    react: React,
    "react-native": { StyleSheet: { create: (styles: unknown) => styles }, View: "view" },
    "@/components/HomeReflectionWallSection": { HomeReflectionWallSection: () => null },
  };
  const module = { exports: {} as Record<string, any> };
  new Function("require", "module", "exports", compiled)(
    (name: string) => {
      if (!(name in mocks)) throw new Error(`Missing test mock: ${name}`);
      return mocks[name as keyof typeof mocks];
    },
    module,
    module.exports,
  );

  const scrollRef = { current: null };
  const getScrollY = () => 47;
  const onComposingChange = (_composing: boolean) => {};
  let savedCount = 0;
  const onMessageSaved = () => { savedCount++; };
  const forwardedHandle = { current: null };
  const suppliedStyle = { marginTop: 9 };
  const wrapper = module.exports.ProfileReflectionWallSection.render({
    scrollRef,
    getScrollY,
    onComposingChange,
    onMessageSaved,
    style: suppliedStyle,
  }, forwardedHandle) as React.ReactElement<Record<string, any>>;
  const element = wrapper.props.children as React.ReactElement<Record<string, any>>;

  assert.deepEqual(wrapper.props.style, [{ marginBottom: 21 }, suppliedStyle]);
  assert.equal(element.props.scrollRef, scrollRef);
  assert.equal(element.props.getScrollY, getScrollY);
  assert.equal(element.props.onComposingChange, onComposingChange);
  assert.equal(element.props.sectionTitle, "Mi muro expansivo");
  assert.equal(element.props.canonicalVerticalInsets, true);
  assert.equal(element.props.ref, forwardedHandle);
  assert.equal(element.props.style, undefined, "the gap sits outside the measured Home section");
  assert.equal(typeof element.props.onMessageSaved, "function");
  assert.equal(element.props.onMessageSaved, onMessageSaved);
  element.props.onMessageSaved();
  assert.equal(savedCount, 1);
});