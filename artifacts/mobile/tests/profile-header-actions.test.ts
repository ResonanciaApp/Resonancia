import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { URL } from "node:url";
import React from "react";
import ts from "typescript";

const source = readFileSync(new URL("../components/ProfileScreenBase.tsx", import.meta.url), "utf8");
const ast = ts.createSourceFile("profile.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let component = "";
let stylesObject: ts.ObjectLiteralExpression | undefined;
let headers = 0;
function visit(node: ts.Node) {
  if (ts.isFunctionDeclaration(node) && node.name?.text === "ProfileHeaderActions") component = node.getText(ast);
  if (ts.isVariableDeclaration(node) && node.name.getText(ast) === "styles"
    && node.initializer && ts.isCallExpression(node.initializer)
    && ts.isObjectLiteralExpression(node.initializer.arguments[0])) stylesObject = node.initializer.arguments[0];
  if (ts.isJsxSelfClosingElement(node) && node.tagName.getText(ast) === "ProfileHeaderActions") {
    headers++;
    assert.match(node.getText(ast), /onEdit=\{\(\) => router.push\("\/mi-perfil"\)\}/);
    assert.match(node.getText(ast), /onSettings=\{\(\) => router.push\("\/configuracion-ajustes"\)\}/);
    assert.match(node.getText(ast), /activeSceneId=\{activeSceneId\}/);
  }
  ts.forEachChild(node, visit);
}
visit(ast);
assert.ok(component && stylesObject);
const selected = stylesObject.properties.filter(property =>
  ts.isPropertyAssignment(property) && /^(gearBtn|profileHeaderActions|profileStickyHeaderActions)$/.test(property.name.getText(ast)));
const compiled = ts.transpileModule(`const styles = {${selected.map(property => property.getText(ast)).join(",")}};\n${component}`, {
  compilerOptions: { jsx: ts.JsxEmit.React, module: ts.ModuleKind.CommonJS },
}).outputText;
const Header = new Function("React", "View", "Pressable", "Feather", `${compiled}; return ProfileHeaderActions;`)(
  React, "View", "Pressable", "Feather",
);
const flatten = (value: any): any => Array.isArray(value) ? Object.assign({}, ...value.map(flatten)) : value || {};

test("both header actions and their backgrounds rise 3px without changing their gap", () => {
  for (const sticky of [false, true]) {
    const tree = Header({ sticky, foreground: "#FFFFFF", activeSceneId: "cloudy", onEdit() {}, onSettings() {} });
    const style = flatten(tree.props.style);
    assert.deepEqual(style.transform, [{ translateY: -3 }]);
    assert.equal(style.gap, 8);
  }
});

test("normal and sticky headers share the edit/settings actions and navigation", () => {
  assert.equal(headers, 2);
  for (const sticky of [false, true]) {
    const clicks: string[] = [];
    const tree = Header({ sticky, foreground: "#FFFFFF", activeSceneId: "indigo2",
      onEdit: () => clicks.push("account"), onSettings: () => clicks.push("settings") });
    const [edit, settings] = tree.props.children;
    assert.equal(edit.props.children.props.name, "edit-2");
    assert.equal(settings.props.children.props.name, "settings");
    assert.equal(edit.props.testID, sticky ? "profile-sticky-edit-details" : "profile-edit-details");
    assert.equal(edit.props.accessibilityRole, "button");
    edit.props.onPress();
    settings.props.onPress();
    assert.deepEqual(clicks, ["account", "settings"]);
    assert.equal(flatten(tree.props.style).gap, 8);
  }
});

test("both 43px controls follow Cloudy and Indigo 2 opacity on every render", () => {
  for (const sticky of [false, true]) {
    for (const scene of ["indigo2", "cloudy", "cloudy2", "indigo2"]) {
      const tree = Header({ sticky, foreground: "#FFFFFF", activeSceneId: scene, onEdit() {}, onSettings() {} });
      for (const button of tree.props.children) {
        const style = flatten(button.props.style({ pressed: false }));
        assert.equal(style.width, 43);
        assert.equal(style.height, 43);
        assert.equal(style.borderRadius, 21.5);
        assert.equal(style.backgroundColor, scene === "cloudy" ? "rgba(0,0,0,0.19)" : "rgba(0,0,0,0.16)");
        assert.equal(style.borderWidth, 0);
        assert.equal(style.opacity, 1);
        assert.ok(flatten(button.props.style({ pressed: true })).opacity < 1);
        assert.equal(button.props.hitSlop * 2, 8, "touch targets do not overlap across the gap");
      }
    }
  }
});
