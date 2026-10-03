import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath, URL } from "node:url";
import test from "node:test";
import React from "react";
import ts from "typescript";

const root = fileURLToPath(new URL("../", import.meta.url));
const background = "rgba(0,0,0,0.16)";
function files(dir: string): string[] {
  return readdirSync(join(root, dir), { withFileTypes: true }).flatMap(entry => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? files(path) : /\.tsx$/.test(path) ? [path] : [];
  });
}
const source = (file: string) => readFileSync(join(root, file), "utf8");
function properties(node: ts.ObjectLiteralExpression, ast: ts.SourceFile) {
  return Object.fromEntries(node.properties.filter(ts.isPropertyAssignment)
    .map(prop => [prop.name.getText(ast), prop.initializer.getText(ast)]));
}
function isControl(name: string, props: Record<string, string>) {
  const standard = props.borderRadius === "21.5" && props.width !== "62"
    && !/Glass|Placeholder|Spacer/.test(name);
  const legacy = props.width === props.height && +props.width >= 36 && +props.width <= 48
    && +props.borderRadius >= 18
    && /(back|close|search|more|menu|header.*(button|btn|control)|top.*(button|btn)|iconBtn|circleButton|actionBtn)/i.test(name)
    && !/avatar|photo|fallback/i.test(name);
  return standard || legacy;
}

test("all generic circular control styles across app screens and sheets are 16% black without borders", () => {
  let checked = 0;
  const failures: string[] = [];
  for (const file of [...files("app"), ...files("components")]) {
    if (file === "components/BackPill.tsx") continue; // Surface is applied by the shared wrapper, tested below.
    const ast = ts.createSourceFile(file, source(file), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const names: string[] = [];
    function visit(node: ts.Node) {
      if (ts.isObjectLiteralExpression(node) && ts.isPropertyAssignment(node.parent)) {
        const name = node.parent.name.getText(ast), props = properties(node, ast);
        if (isControl(name, props)) {
          checked++;
          names.push(name);
          if (![JSON.stringify(background), "STREAK_INFO_COLORS.navigationBackground"].includes(props.backgroundColor)) {
            failures.push(`${file}:${name}: background ${props.backgroundColor}`);
          }
          for (const [key, value] of Object.entries(props)) {
            if (/^border.*Width$/.test(key) && value !== "0") failures.push(`${file}:${name}: ${key} ${value}`);
          }
        }
      }
      ts.forEachChild(node, visit);
    }
    visit(ast);
    // Also check theme-dependent inline overrides; validating only base styles would miss these.
    function overrides(node: ts.Node) {
      if (ts.isJsxAttribute(node) && node.name.getText(ast) === "style" && node.initializer) {
        const text = node.initializer.getText(ast);
        if (names.some(name => new RegExp(`\\b(?:styles|s)\\.${name}\\b`).test(text))) {
          function check(prop: ts.Node) {
            if (ts.isPropertyAssignment(prop)) {
              const key = prop.name.getText(ast), value = prop.initializer.getText(ast);
              if (key === "backgroundColor" && value !== JSON.stringify(background)) failures.push(`${file}: inline background ${value}`);
              if (/^border.*Width$/.test(key) && value !== "0") failures.push(`${file}: inline ${key} ${value}`);
            }
            ts.forEachChild(prop, check);
          }
          check(node.initializer);
        }
      }
      ts.forEachChild(node, overrides);
    }
    overrides(ast);
  }
  assert.ok(checked >= 130, `Expected broad screen coverage, checked ${checked} controls`);
  assert.deepEqual(failures, []);
});

test("BackPill overrides legacy theme and border props without double-stacking its background", () => {
  const module = { exports: {} as { BackPill: (props: Record<string, unknown>) => React.ReactElement<any> } };
  const mocks: Record<string, unknown> = {
    react: React,
    "@expo/vector-icons": { Feather: () => null },
    "react-native": { View: () => null, StyleSheet: { create: (styles: unknown) => styles } },
    "@/components/PressableScale": { PressableScale: () => null },
  };
  new Function("require", "module", "exports", ts.transpileModule(source("components/BackPill.tsx"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true },
  }).outputText)((name: string) => {
    assert.ok(name in mocks, `Missing mock: ${name}`);
    return mocks[name];
  }, module, module.exports);
  const flatten = (styles: any[]) => Object.assign({}, ...styles.filter(Boolean));
  let presses = 0;
  for (const standardSurface of [false, true]) {
    const element = module.exports.BackPill({
      onPress: () => presses++, standardSurface, bgColor: "#FFFFFF",
      borderWidth: 2, borderColor: "#FFFFFF", size: 28, hitSlop: 12,
      style: { borderWidth: 3, backgroundColor: "#123456", marginLeft: 5 },
    });
    const outer = flatten(element.props.containerStyle);
    assert.equal(outer.backgroundColor, background);
    assert.equal(outer.borderWidth, 0);
    assert.equal(outer.borderColor, "transparent");
    assert.equal(outer.marginLeft, 5);
    assert.equal(element.props.hitSlop, 12);
    element.props.onPress();
    const inner = flatten(element.props.children.props.style);
    assert.equal(inner.width, standardSurface ? 43 : 38);
    assert.equal(inner.height, standardSurface ? 43 : 38);
    assert.equal(inner.backgroundColor, undefined, "Only the outer wrapper owns the translucent surface");
  }
  assert.equal(presses, 2);
});

test("circular controls do not retain glass overlays, while decorative and tab borders stay intact", () => {
  const preferences = source("app/personalizar-notificaciones.tsx");
  assert.doesNotMatch(preferences, /notificationCountGlass|SessionBadgeGlass/);
  const player = source("app/player.tsx");
  const close = player.slice(player.indexOf("onPress={closePlayer}"), player.indexOf("</Pressable>", player.indexOf("onPress={closePlayer}")));
  assert.doesNotMatch(close, /BlurView|rgba\(0,0,0,0\.38\)/);
  assert.match(source("components/MoodCalendar.tsx"), /borderColor: "rgba\(0,0,0,0\.28\)"/);
  const nights = source("app/category/noches.tsx");
  assert.match(nights, /heroIconCircle: \{[^\n]*borderWidth: 2/);
  assert.match(nights, /chip: \{[^\n]*backgroundColor: "rgba\(0,0,0,0\.21\)"[^\n]*borderWidth: 1\.2/);
});