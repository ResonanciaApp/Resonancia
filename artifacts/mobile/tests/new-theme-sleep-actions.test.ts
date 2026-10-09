import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { URL } from "node:url";
import ts from "typescript";
import { getSleepActionColors } from "../config/scene-themes.ts";
import { getTabBarGlassOverlay, getTabBarInactiveColor, TAB_BAR_GLASS_OVERLAY } from "../constants/tab-bar.ts";
import {
  SLEEP_REMINDER_CONTINUE_BACKGROUND,
  SLEEP_REMINDER_CONTINUE_FOREGROUND,
} from "../constants/colors.ts";
const REGISTER_BUTTON_ENABLED_BACKGROUND = "#BE9650";

const read = (file: string) => readFileSync(new URL(file, import.meta.url), "utf8");
const compile = (source: string) => ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022 },
}).outputText;
const reminder = ts.createSourceFile("reminder.tsx", read("../components/SleepReminderSheet.tsx"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const duration = ts.createSourceFile("duration.tsx", read("../components/AmbientalDurationSheet.tsx"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
function find(ast: ts.Node, match: (node: ts.Node) => boolean): ts.Node {
  let result: ts.Node | undefined;
  const visit = (node: ts.Node) => {
    if (!result && match(node)) result = node;
    ts.forEachChild(node, visit);
  };
  visit(ast);
  assert.ok(result);
  return result;
}
function attribute(node: ts.Node, name: string): ts.JsxAttribute {
  assert.ok(ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node));
  const attr = node.attributes.properties.find(item => ts.isJsxAttribute(item) && item.name.getText() === name);
  assert.ok(attr && ts.isJsxAttribute(attr));
  return attr;
}
function expression(attr: ts.JsxAttribute, env: Record<string, unknown>): any {
  assert.ok(attr.initializer && ts.isJsxExpression(attr.initializer) && attr.initializer.expression);
  return new Function(...Object.keys(env), compile(`return (${attr.initializer.expression.getText()});`))(...Object.values(env));
}
const flatten = (styles: any[]) => Object.assign({}, ...styles.filter(Boolean));

test("sleep CTAs opt in only for Natural and Pleyades", () => {
  assert.deepEqual(getSleepActionColors("natural"), { background: "#F9F9F9", foreground: "#073B32" });
  assert.deepEqual(getSleepActionColors("pleyades"), { background: "#F9F9F9", foreground: "#0B1438" });
  for (const id of ["cloudy", "cloudy2", "indigo2", "tibet"]) assert.equal(getSleepActionColors(id), null);
});

test("Continuar renders the new background and foreground only at night, including its saving spinner", () => {
  const palette = find(reminder, node => ts.isVariableDeclaration(node) && node.name.getText() === "sleepActionColors") as ts.VariableDeclaration;
  const resolve = new Function("theme", "isMorning", "getSleepActionColors", compile(`return (${palette.initializer!.getText()});`));
  const button = find(reminder, node => ts.isJsxOpeningElement(node) && node.tagName.getText() === "Pressable"
    && node.attributes.getText().includes('accessibilityLabel="Guardar recordatorio"'));
  const text = find(reminder, node => ts.isJsxElement(node) && node.getText().endsWith(">Continuar</Text>")) as ts.JsxElement;
  const spinner = find(reminder, node => ts.isJsxSelfClosingElement(node) && node.tagName.getText() === "ActivityIndicator");
  const styles = {
    continueButton: { backgroundColor: SLEEP_REMINDER_CONTINUE_BACKGROUND },
    morningContinueButton: { backgroundColor: "#C96D68" },
    continueText: { color: "#FFFFFF" },
    nightContinueText: { color: SLEEP_REMINDER_CONTINUE_FOREGROUND },
    pressed: { opacity: 0.8 }, disabled: { opacity: 0.5 },
  };
  for (const id of ["natural", "pleyades", "cloudy", "indigo2"]) {
    for (const isMorning of [false, true]) {
      const sleepActionColors = resolve({ id }, isMorning, getSleepActionColors);
      const env = { sleepActionColors, isMorning, saving: false, styles, SLEEP_REMINDER_CONTINUE_FOREGROUND };
      const buttonStyle = expression(attribute(button, "style"), env);
      const expectedBackground = isMorning ? "#C96D68" : getSleepActionColors(id)?.background ?? SLEEP_REMINDER_CONTINUE_BACKGROUND;
      const expectedForeground = isMorning ? "#FFFFFF" : getSleepActionColors(id)?.foreground ?? SLEEP_REMINDER_CONTINUE_FOREGROUND;
      assert.equal(flatten(buttonStyle({ pressed: false })).backgroundColor, expectedBackground);
      assert.equal(flatten(expression(attribute(text.openingElement, "style"), env)).color, expectedForeground);
      assert.equal(expression(attribute(spinner, "color"), env), expectedForeground);
      assert.equal(flatten(buttonStyle({ pressed: true })).opacity, 0.8);
    }
  }
});

test("Empezar sesión has a white surface in Cloudy and Indigo 2 and preserves other themes", () => {
  const button = find(duration, node => ts.isJsxElement(node) && node.openingElement.tagName.getText() === "Pressable"
    && node.openingElement.attributes.getText().includes('testID="ambiental-duration-start"'));
  const fill = find(button, node => (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) && node.tagName.getText() === "View"
    && node.attributes.getText().includes("styles.startButtonFill"));
  const icon = find(button, node => ts.isJsxSelfClosingElement(node) && node.tagName.getText() === "Path");
  const text = find(button, node => ts.isJsxElement(node) && node.getText().endsWith(">Empezar sesión</Text>")) as ts.JsxElement;
  const palette = find(duration, node => ts.isVariableDeclaration(node) && node.name.getText() === "sleepActionColors") as ts.VariableDeclaration;
  for (const id of ["natural", "pleyades", "cloudy", "indigo2", "tibet"]) {
    const sleepActionColors = new Function("theme", "getSleepActionColors",
      compile(`return (${palette.initializer!.getText()});`))({ id }, getSleepActionColors);
    const env = { sleepActionColors, styles: { startButton: {}, startButtonFill: {}, startButtonText: { color: "#F9F9F9" } }, REGISTER_BUTTON_ENABLED_BACKGROUND, phase: "presets", selectedMinutes: 10, canStart: true };
    if (id === "cloudy" || id === "indigo2") {
      assert.deepEqual(sleepActionColors, { background: "#F9F9F9", foreground: "#0B1438" });
    } else {
      assert.deepEqual(sleepActionColors, getSleepActionColors(id));
    }
    const buttonStyle = expression(attribute(button.openingElement, "style"), env);
    assert.equal(flatten(buttonStyle({ pressed: false })).backgroundColor, sleepActionColors?.background);
    assert.equal(flatten(expression(attribute(fill, "style"), env)).backgroundColor, sleepActionColors?.background ?? REGISTER_BUTTON_ENABLED_BACKGROUND);
    assert.equal(expression(attribute(icon, "fill"), env), sleepActionColors?.foreground ?? "#F9F9F9");
    assert.equal(flatten(expression(attribute(text.openingElement, "style"), env)).color, sleepActionColors?.foreground ?? "#F9F9F9");
  }
});

test("Cancelar uses a ten-percent white background without dimming its text or changing press feedback", () => {
  const button = find(duration, node => ts.isJsxOpeningElement(node)
    && node.tagName.getText() === "Pressable"
    && node.attributes.getText().includes('testID="ambiental-duration-cancel"'));
  const buttonStyle = expression(attribute(button, "style"), {
    styles: { cancelButton: {} }, cancelHeight: 58,
  });
  assert.equal(flatten(buttonStyle({ pressed: false })).backgroundColor, "rgba(249,249,249,0.1)");
  assert.equal(flatten(buttonStyle({ pressed: false })).opacity, 1);
  assert.equal(flatten(buttonStyle({ pressed: true })).opacity, 0.78);
});

test("Natural changes the tab bar tint to green without changing the other backgrounds or glass overlay", () => {
  const source = read("../app/(tabs)/_layout.tsx");
  assert.equal(getTabBarGlassOverlay("natural"), "rgba(8,33,28,0.62)");
  assert.equal(getTabBarInactiveColor("natural"), "#D5EBDD");
  for (const id of ["pleyades", "cloudy", "cloudy2", "indigo2", "tibet"]) assert.equal(getTabBarGlassOverlay(id), TAB_BAR_GLASS_OVERLAY);
  assert.match(source, /const tabBarGlassOverlay = getTabBarGlassOverlay\(activeSceneId\)/);
  assert.match(source, /backgroundColor: tabBarGlassOverlay/);
});
