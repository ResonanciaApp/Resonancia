import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";
import { SCENE_THEMES, type VisualThemeId } from "../config/scene-themes.ts";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");
const source = read("../app/busqueda.tsx");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true },
}).outputText;
let themeId: VisualThemeId = "cloudy";
let time = "10 min";
let stateIndex = 0;
const state = new Map<number, unknown>();
const presses = new Map<string, { onPress: () => void; style: Record<string, any> }>();
let lists: any[] = [];
let gradients: any[] = [];
const sessions = [
  { id: "five", title: "Cinco", categoryId: "meditaciones-guiadas", duration: 5 },
  { id: "ten", title: "Diez", categoryId: "meditaciones-guiadas", duration: 10 },
  { id: "music-ten", title: "Música", categoryId: "musica-sonidos", duration: 10 },
  { id: "twenty", title: "Veinte", categoryId: "meditaciones-guiadas", duration: 20 },
].map(session => ({ ...session, categoryLabel: session.categoryId, image: 1 }));
const flatten = (style: any): Record<string, any> => Array.isArray(style)
  ? Object.assign({}, ...style.map(flatten)) : style ?? {};
function text(children: any): string {
  if (Array.isArray(children)) return children.map(text).join("");
  if (React.isValidElement(children)) return text((children.props as any).children);
  return typeof children === "string" ? children : "";
}
function Native(props: any) {
  const style = flatten(typeof props.style === "function" ? props.style({ pressed: false }) : props.style);
  if (props.onPress) presses.set(props.testID ?? text(props.children), { onPress: props.onPress, style });
  return React.createElement("div", {
    "data-testid": props.testID,
    "data-icon": props.name,
    "data-color": props.color,
    "data-transform": style.transform ? JSON.stringify(style.transform) : undefined,
  }, props.children);
}
const mockedReact = {
  ...React,
  useState(initial: unknown) {
    const index = stateIndex++;
    if (!state.has(index)) state.set(index, typeof initial === "function" ? (initial as Function)() : initial);
    return [state.get(index), (next: unknown) => state.set(index, typeof next === "function" ? (next as Function)(state.get(index)) : next)];
  },
};
const mocks: Record<string, any> = {
  react: mockedReact,
  "react-native": {
    Dimensions: { get: () => ({ width: 402 }) },
    Platform: { OS: "ios" },
    useWindowDimensions: () => ({ width: 402 }),
    View: Native, Text: Native, Pressable: Native, StatusBar: () => null,
    Modal: (props: any) => props.visible ? React.createElement(Native, props) : null,
    FlatList: (props: any) => {
      lists.push(props);
      return React.createElement(Native, null, props.data.length
        ? props.data.map((item: any) => React.createElement(React.Fragment, { key: item.id }, props.renderItem({ item })))
        : props.ListEmptyComponent);
    },
    StyleSheet: { create: (styles: unknown) => styles, absoluteFill: {}, absoluteFillObject: {} },
  },
  "@expo/vector-icons": { Feather: Native },
  "expo-image": { Image: Native },
  "expo-linear-gradient": { LinearGradient: (props: any) => { gradients.push(props); return React.createElement(Native, props); } },
  "expo-router": { router: { back() {}, push() {} }, useLocalSearchParams: () => ({ tiempo: time }) },
  "react-native-safe-area-context": { useSafeAreaInsets: () => ({ top: 59, bottom: 34 }) },
  "@/components/BackPill": { BackPill: Native },
  "@/lib/premiumGate": { openPremiumPlans() {} },
  "@/context/BackOverrideContext": { useBackOverride: () => null },
  "@/data/sessions": { SESSIONS: sessions },
  "@/data/artists": { getArtist: () => ({ name: "Artista" }) },
  "@/data/guides": { getGuide: () => ({ name: "Guía" }) },
  "@/context/PremiumContext": { usePremium: () => ({ isPremium: true }) },
  "@/context/PlayerContext": { usePlayer: () => ({ playSession() {} }) },
  "@/context/SceneThemeContext": { useSceneTheme: () => ({ theme: SCENE_THEMES[themeId] }) },
  "@/context/CategoryOverlayContext": { useCategoryOverlayOptional: () => null },
  "@/config/scene-themes": { SCENE_THEMES },
};
const loaded = { exports: {} as { default: React.ComponentType<{ tiempo?: string }> } };
new Function("require", "module", "exports", compiled)((name: string) => {
  assert.ok(name in mocks, `Missing mock: ${name}`);
  return mocks[name];
}, loaded, loaded.exports);
function render() {
  stateIndex = 0;
  presses.clear();
  lists = [];
  gradients = [];
  return renderToStaticMarkup(React.createElement(loaded.exports.default));
}
function reset(id: VisualThemeId = "cloudy", duration = "10 min") {
  themeId = id;
  time = duration;
  state.clear();
  return render();
}
function press(id: string) {
  assert.ok(presses.has(id), `Missing action ${id}`);
  presses.get(id)!.onPress();
  return render();
}
function evaluateExpression(source: string, name: string, values: Record<string, unknown>) {
  const ast = ts.createSourceFile("fixture.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let expression: ts.Expression | undefined;
  function visit(node: ts.Node) {
    if ((ts.isVariableDeclaration(node) || ts.isPropertyAssignment(node)) && node.name.getText(ast) === name) expression = node.initializer;
    ts.forEachChild(node, visit);
  }
  visit(ast);
  assert.ok(expression);
  const code = ts.transpileModule(`return (${expression.getText(ast)});`, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
  return new Function(...Object.keys(values), code)(...Object.values(values));
}

test("duration entry keeps its selected range, removes text search and hides the scroll cursor", () => {
  const html = reset();
  assert.doesNotMatch(source, /TextInput|searchWrap|searchBox|searchInput|setQ/);
  assert.doesNotMatch(html, /Buscar sesiones|Busca por texto/);
  assert.deepEqual(lists[0].data.map((item: any) => item.id), ["ten", "music-ten"]);
  assert.equal(lists[0].showsVerticalScrollIndicator, false);
  assert.equal(presses.get("search-duration-filter")!.style.borderWidth, 0);
});

test("category and time pills match Dormir tab height, horizontal padding, gap and radius", () => {
  reset();
  const sleep = evaluateExpression(read("../app/(tabs)/descanzo.tsx"), "sleepPill", {});
  for (const id of ["search-category-filter", "search-duration-filter"]) {
    const actual = presses.get(id)!.style;
    for (const key of ["height", "paddingHorizontal", "gap", "borderRadius"]) assert.equal(actual[key], sleep[key], `${id}: ${key}`);
  }
});

test("both filter sheets preserve their two-stop backgrounds independently of the Cloudy timer and retain option opacity", () => {
  for (const id of ["cloudy", "indigo2", "cloudy2", "tibet"] as const) {
    for (const filter of ["search-category-filter", "search-duration-filter"]) {
      reset(id);
      press(filter);
      const expected = id === "indigo2"
        ? [SCENE_THEMES.tibet.gradient[1], SCENE_THEMES.tibet.gradient[2]]
        : [SCENE_THEMES[id].gradient[1], SCENE_THEMES[id].gradient[2]];
      assert.deepEqual(gradients.at(-1).colors, expected);
      const options = filter === "search-category-filter"
        ? ["Meditaciones", "Sonoterapia", "Música", "Dormir", "Historias", "Reflexiones"]
        : ["5 min", "10 min", "20 min", "30 min", "60 min"];
      for (const label of options) assert.equal(presses.get(label)!.style.backgroundColor, id === "cloudy" ? "rgba(0,0,0,0.19)" : "rgba(0,0,0,0.16)");
    }
  }
});

test("category and duration selections still combine, dismiss their sheet, and clear independently or together", () => {
  reset();
  press("search-category-filter");
  press("Meditaciones");
  assert.deepEqual(lists[0].data.map((item: any) => item.id), ["ten"]);
  assert.equal(gradients.length, 1);
  press("search-duration-filter");
  press("20 min");
  assert.deepEqual(lists[0].data.map((item: any) => item.id), ["twenty"]);
  assert.equal(presses.get("search-duration-filter")!.style.borderWidth, 0);
  press("search-category-filter");
  press("Limpiar");
  assert.deepEqual(lists[0].data.map((item: any) => item.id), ["twenty"]);
  const html = press("Limpiar todo");
  assert.equal(lists.length, 0);
  assert.match(html, /Filtra por categoría y tiempo/);
});

test("an open sheet follows a live theme change without losing the selected duration", () => {
  reset("cloudy");
  press("search-duration-filter");
  themeId = "indigo2";
  render();
  assert.deepEqual(gradients.at(-1).colors, [SCENE_THEMES.tibet.gradient[1], SCENE_THEMES.tibet.gradient[2]]);
  assert.equal(presses.get("10 min")!.style.backgroundColor, "rgba(0,0,0,0.16)");
  assert.deepEqual(lists[0].data.map((item: any) => item.id), ["ten", "music-ten"]);
});

test("the initial placeholder moves up exactly 80px and its headphones remain F9F9F9 in every theme", () => {
  for (const id of ["cloudy", "indigo2", "cloudy2", "tibet"] as const) {
    const html = reset(id, "");
    assert.match(html, /data-testid="search-initial-placeholder"[^>]*data-transform="\[\{&quot;translateY&quot;:-80\}\]"/);
    assert.match(html, /data-icon="headphones" data-color="#F9F9F9"/);
    assert.match(html, /Encuentra tus sesiones favoritas/);
    assert.match(html, /Filtra por categoría y tiempo/);
    assert.equal(evaluateExpression(source, "empty", {}).paddingBottom, 80);
    assert.equal(evaluateExpression(source, "empty", {}).transform, undefined);
  }
  const noResults = reset("cloudy", "60 min");
  assert.match(noResults, /Sin resultados/);
  assert.doesNotMatch(noResults, /search-initial-placeholder|translateY|headphones/);
});