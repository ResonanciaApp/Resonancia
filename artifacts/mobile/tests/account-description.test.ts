import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { URL } from "node:url";
import test from "node:test";
import ts from "typescript";
import { limitProfileDescriptionLines } from "../lib/profileDescription.ts";

const source = readFileSync(new URL("../components/ProfileScreenBase.tsx", import.meta.url), "utf8");
const ast = ts.createSourceFile("ProfileScreenBase.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
test("account screen is titled Editar detalles and starts with Nombre before the read-only email", () => {
  assert.match(source, /<Text style=\{styles.stickyTitleLibraryTab\}>Editar detalles<\/Text>/);
  assert.doesNotMatch(source, /<Text style=\{styles.stickyTitleLibraryTab\}>Mi cuenta<\/Text>/);
  const fields: string[] = [];
  function visit(node: ts.Node) {
    if (ts.isJsxElement(node) && node.openingElement.tagName.getText(ast) === "View"
      && /style=\{styles\.accountField\}/.test(node.openingElement.getText(ast))) fields.push(node.getText(ast));
    ts.forEachChild(node, visit);
  }
  visit(ast);
  assert.deepEqual(fields.map(field =>
    field.match(/<Text style=\{styles.accountFieldLabel\}>\s*([^<]*)<\/Text>/)?.[1].trim()),
  ["Nombre", "Correo electrónico", "Descripción"]);
  assert.match(fields[0], /value=\{accountName\}/);
  assert.match(fields[0], /onChangeText=\{setAccountName\}/);
  assert.match(fields[1], /\{email \|\| "No disponible"\}/);
  assert.doesNotMatch(fields[1], /<TextInput/);
});

function initializer(name: string): string {
  let value: string | undefined;
  function visit(node: ts.Node) {
    if (ts.isVariableDeclaration(node) && node.name.getText(ast) === name) value = node.initializer?.getText(ast);
    ts.forEachChild(node, visit);
  }
  visit(ast);
  assert.ok(value, name);
  return value;
}
const disabled = new Function("accountAction", "accountName", "username", "accountDescription", "description",
  `return (${initializer("accountSaveDisabled")});`);

test("the description input lives in Mi cuenta after email/name and edits only the draft", () => {
  const field = source.slice(source.indexOf('<View testID="account-description-section"'), source.indexOf("onPress={saveAccount}"));
  assert.match(field, /value=\{accountDescription\}/);
  assert.match(field, /onChangeText=\{\(text\) => setAccountDescription\(limitProfileDescriptionLines\(text\)\)\}/);
  assert.match(field, /multiline\s+numberOfLines=\{2\}/);
  assert.doesNotMatch(field, /updateProfile/);
  assert.ok(source.indexOf('value={accountName}') < source.indexOf('testID="account-description-section"'));
  assert.match(source, /setAccountDescription\(limitProfileDescriptionLines\(description\)\)/);
});

test("changing only the description enables Guardar, including removing an existing description", () => {
  assert.equal(disabled(null, "Nombre", "Nombre", "Nueva", ""), false);
  assert.equal(disabled(null, "Nombre", "Nombre", "", "Anterior"), false);
  assert.equal(disabled(null, "Nombre", "Nombre", "  Igual  ", "Igual"), true);
  assert.equal(disabled("delete", "Nombre", "Nombre", "Nueva", ""), true);
});

test("description input accepts two explicit lines and normalizes pasted line endings", () => {
  assert.equal(limitProfileDescriptionLines("Primera\r\nSegunda\r\nTercera"), "Primera\nSegunda");
  assert.equal(limitProfileDescriptionLines(""), "");
  assert.equal(limitProfileDescriptionLines("Texto sin salto"), "Texto sin salto");
});

test("Guardar persists both the name and description through the existing profile storage, including clearing", () => {
  const calls: unknown[] = [];
  const animation = () => ({ start() {} });
  const toast = { stopAnimation() {}, setValue() {} };
  const compiled = ts.transpileModule(`return (${initializer("saveAccount")});`, {
    compilerOptions: { target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const factory = new Function(
    "accountSaveDisabled", "accountName", "accountDescription", "updateProfile", "limitProfileDescriptionLines",
    "Haptics", "accountToastOpacity", "accountToastY", "Animated", "Easing", compiled,
  );
  for (const description of [" Mi descripción\nSegunda línea ", ""]) {
    const save = factory(
      false, "Nombre", description, (profile: unknown) => calls.push(profile), limitProfileDescriptionLines,
      { notificationAsync() {}, NotificationFeedbackType: { Success: "success" } }, toast, toast,
      { sequence: animation, parallel: animation, timing: animation, delay: animation },
      { out: () => null, in: () => null, quad: null },
    );
    save();
  }
  assert.deepEqual(calls, [
    { username: "Nombre", description: "Mi descripción\nSegunda línea" },
    { username: "Nombre", description: "" },
  ]);
  const context = readFileSync(new URL("../context/UserProfileContext.tsx", import.meta.url), "utf8");
  assert.match(context, /description: fields.description.trim\(\)/);
  assert.match(context, /AsyncStorage.setItem\(STORAGE_KEY, JSON.stringify\(next\)\)/);
});