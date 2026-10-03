import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import { URL } from "node:url";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const require = createRequire(import.meta.url);
const babel = require("@babel/core");
const plugin = require("../plugins/cloudy-surfaces.cjs");
const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");
const flatten = (style: any): any => {
  if (Array.isArray(style)) return Object.assign({}, ...style.filter(Boolean).map(flatten));
  if (style === 1) return { backgroundColor: "rgba(0,0,0,0.16)", borderColor: "rgba(0,0,0,0.16)" };
  return style;
};
function load(path: string, mocks: Record<string, any> = {}): any {
  const output = ts.transpileModule(read(path), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true },
  }).outputText;
  const exported: any = {};
  new Function("exports", "require", output)(exported, (name: string) => {
    assert.ok(name in mocks, `Unexpected import: ${name}`);
    return mocks[name];
  });
  return exported;
}
const resolver = load("../lib/cloudy-surface-style.ts");
const themeContext = React.createContext<{ activeSceneId: string } | null>(null);
const { CloudySurface } = load("../components/CloudySurface.tsx", {
  react: React,
  "react-native": { StyleSheet: { flatten } },
  "@/context/SceneThemeContext": { useSceneThemeOptional: () => React.useContext(themeContext) },
  "@/lib/cloudy-surface-style": resolver,
});
let captured: any;
function NativeControl(props: any) {
  captured = props;
  return React.createElement("div", null, props.children);
}
function render(theme: string | null, props: any = {}) {
  return renderToStaticMarkup(React.createElement(themeContext.Provider, {
    value: theme ? { activeSceneId: theme } : null,
  }, React.createElement(CloudySurface, {
    __surfaceComponent: NativeControl, ...props,
  })));
}

test("only Cloudy changes black 16 to black 19 and reversing the theme restores the original style", () => {
  const style = { backgroundColor: "rgba(0,0,0,0.16)", borderColor: "rgba(0,0,0,0.16)", opacity: 0.82 };
  for (const theme of ["indigo2", "cloudy", "cloudy2", "universo", "cloudy", "indigo2", null]) {
    render(theme, { style });
    const actual = flatten(captured.style);
    assert.equal(actual.backgroundColor, theme === "cloudy" ? "rgba(0,0,0,0.19)" : style.backgroundColor);
    assert.equal(actual.borderColor, style.borderColor);
    assert.equal(actual.opacity, style.opacity);
    if (theme !== "cloudy") assert.equal(captured.style, style);
  }
  assert.equal(style.backgroundColor, "rgba(0,0,0,0.16)", "Never mutate a shared style definition");
});

test("Cloudy leaves black 28 banners, other alpha values, gradients and non-black backgrounds intact", () => {
  for (const color of ["rgba(0,0,0,0.28)", "rgba(0,0,0,0.19)", "rgba(0,0,0,0.10)", "rgba(255,255,255,0.16)", "#060A0F"]) {
    const style = { backgroundColor: color };
    const colors = ["#21315F", "#342265"];
    render("cloudy", { style, colors });
    assert.equal(captured.style, style);
    assert.equal(captured.colors, colors);
  }
});

test("tabs, circular controls, card styles and registered/array styles resolve their final background", () => {
  for (const style of [
    { width: 43, height: 43, borderRadius: 21.5, backgroundColor: "rgba(0, 0, 0, 0.16)" },
    [{ backgroundColor: "white" }, null, { backgroundColor: "rgba(0,0,0,0.16)" }],
    1,
  ]) {
    render("cloudy", { style });
    assert.equal(flatten(captured.style).backgroundColor, "rgba(0,0,0,0.19)");
  }
  const overridden = [{ backgroundColor: "rgba(0,0,0,0.16)" }, { backgroundColor: "transparent" }];
  render("cloudy", { style: overridden });
  assert.equal(captured.style, overridden, "Respect the last style override");
});

test("Pressable styles preserve pressed state, callbacks, refs, accessibility and children", () => {
  const style = ({ pressed }: any) => ({
    backgroundColor: pressed ? "rgba(0,0,0,0.28)" : "rgba(0,0,0,0.16)",
    opacity: pressed ? 0.82 : 1,
  });
  const onPress = () => {};
  const ref = { current: null };
  const html = render("cloudy", { style, onPress, ref, accessibilityRole: "button", children: "same content" });
  assert.equal(flatten(captured.style({ pressed: false })).backgroundColor, "rgba(0,0,0,0.19)");
  assert.equal(flatten(captured.style({ pressed: true })).backgroundColor, "rgba(0,0,0,0.28)");
  assert.equal(flatten(captured.style({ pressed: true })).opacity, 0.82);
  assert.equal(captured.onPress, onPress);
  assert.equal(captured.ref, ref);
  assert.equal(captured.accessibilityRole, "button");
  assert.match(html, /same content/);
  render("indigo2", { style });
  assert.equal(captured.style, style);
});

test("scroll/list/image style props and constant animated header backgrounds are covered", () => {
  const style = { backgroundColor: "rgba(0,0,0,0.16)" };
  render("cloudy", {
    contentContainerStyle: style, ListHeaderComponentStyle: style,
    ListFooterComponentStyle: style, columnWrapperStyle: style, imageStyle: style,
  });
  for (const key of ["contentContainerStyle", "ListHeaderComponentStyle", "ListFooterComponentStyle", "columnWrapperStyle", "imageStyle"]) {
    assert.equal(flatten(captured[key]).backgroundColor, "rgba(0,0,0,0.19)");
  }
  const constant = { _config: { outputRange: [style.backgroundColor, style.backgroundColor] } };
  render("cloudy", { style: { backgroundColor: constant } });
  assert.equal(flatten(captured.style).backgroundColor, "rgba(0,0,0,0.19)");
  const changing = { _config: { outputRange: [style.backgroundColor, "#BE9650"] } };
  render("cloudy", { style: { backgroundColor: changing } });
  assert.equal(flatten(captured.style).backgroundColor, changing);
});

function transform(code: string, filename = new URL("../components/CloudyFixture.tsx", import.meta.url).pathname) {
  return babel.transformSync(code, {
    filename, babelrc: false, configFile: false,
    parserOpts: { plugins: ["jsx", "typescript"] },
    plugins: [plugin],
  });
}

test("compiler covers styled JSX, spreads, scroll containers and animation members without changing children", () => {
  const output = transform(`
    import "@/lib/fix-http-assets";
    import {View, ScrollView, Animated} from "react-native";
    const content = <View style={styles.card}>
      <Animated.View style={styles.circle} ref={ref} />
      <ScrollView contentContainerStyle={styles.list}><Card {...props} /></ScrollView>
      <div style={{backgroundColor:"rgba(0,0,0,0.16)"}} />
    </View>;
  `).code;
  assert.equal((output.match(/import.*CloudySurface.*from/g) || []).length, 1);
  assert.equal((output.match(/__surfaceComponent=/g) || []).length, 4);
  assert.match(output, /__surfaceComponent=\{Animated.View\}/);
  assert.match(output, /ref=\{ref\}/);
  assert.match(output, /contentContainerStyle=\{styles.list\}/);
  assert.match(output, /<div style=/);
  assert.ok(output.indexOf('import "@/lib/fix-http-assets"') < output.indexOf('from "@/components/CloudySurface"'));
});

test("compiler does not instrument dependencies or its own surface adapter", () => {
  for (const filename of [
    "/tmp/foreign/fixture.tsx",
    new URL("../node_modules/fixture.tsx", import.meta.url).pathname,
    new URL("../components/CloudySurface.tsx", import.meta.url).pathname,
  ]) {
    assert.doesNotMatch(transform("<View style={styles.card} />", filename).code, /CloudySurface/);
  }
});

test("every styled JSX boundary in all app screens/components is instrumented, not just a few sample screens", () => {
  let filesCovered = 0;
  let surfacesCovered = 0;
  function scan(dir: string) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const filename = `${dir}/${entry.name}`;
      if (entry.isDirectory()) scan(filename);
      else if (entry.name.endsWith(".tsx") && entry.name !== "CloudySurface.tsx") {
        const output = transform(readFileSync(filename, "utf8"), filename).code;
        const count = (output.match(/__surfaceComponent=/g) || []).length;
        if (count) filesCovered++;
        surfacesCovered += count;
        const ast = ts.createSourceFile(filename, output, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
        function visit(node: ts.Node) {
          if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
            const name = node.tagName.getText(ast);
            const styled = node.attributes.properties.some((attribute) =>
              ts.isJsxSpreadAttribute(attribute) ||
              ["style", "contentContainerStyle", "ListHeaderComponentStyle", "ListFooterComponentStyle", "columnWrapperStyle", "imageStyle"].includes(attribute.name.getText(ast)),
            );
            if (styled && !/^[a-z]/.test(name)) assert.match(name, /^_CloudySurface/, filename);
          }
          ts.forEachChild(node, visit);
        }
        visit(ast);
      }
    }
  }
  scan(new URL("../app", import.meta.url).pathname);
  scan(new URL("../components", import.meta.url).pathname);
  assert.ok(filesCovered > 100, `${filesCovered} files covered`);
  assert.ok(surfacesCovered > 1000, `${surfacesCovered} surfaces covered`);
});