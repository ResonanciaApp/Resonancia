import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

const source = readFileSync(new URL("../app/crear-rutina.tsx", import.meta.url), "utf8");
const ast = ts.createSourceFile("crear-rutina.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let close: ts.JsxOpeningElement | undefined;
let styleObject: ts.ObjectLiteralExpression | undefined;
function visit(node: ts.Node) {
  if (ts.isJsxOpeningElement(node) && node.attributes.properties.some(
    attr => ts.isJsxAttribute(attr) && attr.name.getText(ast) === "testID"
      && attr.initializer?.getText(ast) === '"crear-rutina-close"',
  )) close = node;
  if (ts.isVariableDeclaration(node) && node.name.getText(ast) === "styles"
    && node.initializer && ts.isCallExpression(node.initializer)) {
    styleObject = node.initializer.arguments[0] as ts.ObjectLiteralExpression;
  }
  ts.forEachChild(node, visit);
}
visit(ast);
test("repeat dropdown selects either draft option, marks the current value and dismisses outside", () => {
  const menuSource = readFileSync(new URL("../components/RoutineRepeatMenu.tsx", import.meta.url), "utf8");
  const result: { exports: any } = { exports: {} };
  const mocks: Record<string, any> = {
    react: { createElement: (type: unknown, props: any, ...children: any[]) => ({ type, props, children: children.flat() }) },
    "@expo/vector-icons": { Feather: "Feather" },
    "expo-blur": { BlurView: "BlurView" },
    "react-native": {
      Pressable: "Pressable", Text: "Text", View: "View",
      StyleSheet: { create: (s: unknown) => s, absoluteFill: {}, absoluteFillObject: {}, hairlineWidth: 0.5 },
    },
    "@/constants/tab-bar": { getTabBarGlassOverlay: () => "#123456", TAB_PILL_BLUR_INTENSITY: 40, TAB_PILL_BLUR_TINT: "dark" },
  };
  new Function("require", "module", "exports", ts.transpileModule(menuSource, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true },
  }).outputText)((id: string) => mocks[id], result, result.exports);
  for (const value of [true, false]) {
    const selected: boolean[] = [];
    let dismissed = 0;
    const props = { visible: true, top: 150, sceneId: "natural", value,
      onSelect: (v: boolean) => selected.push(v), onDismiss: () => dismissed++ };
    const nodes: any[] = [];
    function walk(node: any) {
      if (!node || typeof node !== "object") return;
      nodes.push(node);
      node.children?.forEach(walk);
    }
    walk(result.exports.RoutineRepeatMenu(props));
    for (const [id, enabled] of [["daily", true], ["off", false]] as const) {
      const option = nodes.find(n => n.props?.testID === `crear-rutina-repeat-${id}`);
      assert.equal(option.props.accessibilityState.selected, value === enabled);
      option.props.onPress();
    }
    assert.deepEqual(selected, [true, false]);
    nodes.find(n => n.props?.testID === "routine-repeat-menu-backdrop").props.onPress();
    assert.equal(dismissed, 1);
    assert.equal(result.exports.RoutineRepeatMenu({ ...props, visible: false }), null);
  }
  assert.match(source, /setDraftRepeatEnabled\(enabled\);\s*setRepeatMenuOpen\(false\)/);
});

test("Cada día uses the theme gradient, dark settings rows and translucent white steppers", () => {
  let surface: ts.Expression | undefined;
  function find(node: ts.Node) {
    if (ts.isVariableDeclaration(node) && node.name.getText(ast) === "repeatSurface") surface = node.initializer;
    ts.forEachChild(node, find);
  }
  find(ast);
  assert.ok(surface);
  for (const id of ["natural", "cloudy", "indigo2", "pleyades"]) {
    const actual = new Function("activeTheme", `return (${surface.getText(ast)});`)({ id });
    assert.equal(actual, ["natural", "cloudy"].includes(id) ? "rgba(0,0,0,0.19)" : "rgba(0,0,0,0.16)");
  }
  const sheet = source.slice(source.indexOf("<Modal"));
  assert.match(sheet, /colors=\{activeTheme.gradient\}/);
  assert.match(sheet, /locations=\{activeTheme.gradientLocations\}/);
  assert.equal((sheet.match(/backgroundColor: repeatSurface/g) ?? []).length, 3);
  assert.equal((sheet.match(/backgroundColor: "rgba\(255,255,255,0\.1\)"/g) ?? []).length, 2);
  assert.match(sheet, /styles.closeButton,\s*\{ backgroundColor: repeatSurface/);
  assert.match(sheet, /onPress=\{saveRepeatSettings\}/);
});
assert.ok(close && styleObject);
const definitions: Record<string, unknown> = {};
for (const name of ["headerSide", "closeButton"]) {
  const prop = styleObject.properties.find(p => ts.isPropertyAssignment(p) && p.name.getText(ast) === name);
  assert.ok(prop && ts.isPropertyAssignment(prop));
  definitions[name] = new Function(`return (${prop.initializer.getText(ast)});`)();
}
const style = close.attributes.properties.find(p => ts.isJsxAttribute(p) && p.name.getText(ast) === "style");
assert.ok(style && ts.isJsxAttribute(style) && style.initializer && ts.isJsxExpression(style.initializer) && style.initializer.expression);
const compiled = ts.transpileModule(`return (${style.initializer.expression.getText(ast)});`, {
  compilerOptions: { target: ts.ScriptTarget.ES2022 },
}).outputText;

test("Crear actividad X is a centered 43px circle with the requested theme opacity", () => {
  for (const id of ["natural", "cloudy", "indigo2", "pleyades", "cloudy2", "tibet"]) {
    const resolve = new Function("styles", "activeTheme", compiled)(definitions, { id });
    for (const pressed of [false, true]) {
      const actual = Object.assign({}, ...resolve({ pressed }));
      assert.equal(actual.width, 43);
      assert.equal(actual.height, 43);
      assert.equal(actual.borderRadius, 21.5);
      assert.equal(actual.alignItems, "center");
      assert.equal(actual.justifyContent, "center");
      assert.equal(actual.backgroundColor, ["natural", "cloudy"].includes(id) ? "rgba(0,0,0,0.19)" : "rgba(0,0,0,0.16)");
      assert.equal(actual.opacity, pressed ? 0.6 : 1);
    }
  }
  assert.match(close!.getText(ast), /onPress=\{\(\) => router\.back\(\)\}/);
});
