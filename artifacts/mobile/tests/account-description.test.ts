import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { URL } from "node:url";
import test from "node:test";
import ts from "typescript";
import { limitProfileDescription, MAX_PROFILE_DESCRIPTION_LENGTH } from "../lib/profileDescription.ts";

const source = readFileSync(new URL("../components/ProfileScreenBase.tsx", import.meta.url), "utf8");
const ast = ts.createSourceFile("ProfileScreenBase.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
test("Editar detalles starts with Nombre, then Lema de vida and Descripción without email", () => {
  assert.doesNotMatch(source, /<Text style=\{styles.stickyTitleLibraryTab\}>Editar detalles<\/Text>/);
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
  ["Nombre", "Lema de vida", "Descripción"]);
  assert.match(fields[0], /value=\{accountName\}/);
  assert.match(fields[0], /onChangeText=\{setAccountName\}/);
  assert.match(fields[1], /value=\{accountLifeMotto\}/);
  assert.match(fields[1], /onChangeText=\{setAccountLifeMotto\}/);
  assert.doesNotMatch(fields.join(""), /Correo electrónico|\{email/);
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
const evaluateDisabled = new Function("accountAction", "accountName", "username", "accountDescription", "description", "accountLifeMotto", "lifeMotto",
  `return (${initializer("accountSaveDisabled")});`);
const disabled = (action: string | null, name: string, savedName: string, description: string, savedDescription: string, motto = "", savedMotto = "") =>
  evaluateDisabled(action, name, savedName, description, savedDescription, motto, savedMotto);

test("description input edits only its draft, caps at 300 characters and has no old two-line hint", () => {
  const field = source.slice(source.indexOf('<View testID="account-description-section"'), source.indexOf("onPress={handleDeleteAccount}"));
  assert.match(field, /value=\{accountDescription\}/);
  assert.match(field, /onChangeText=\{\(text\) => setAccountDescription\(limitProfileDescription\(text\)\)\}/);
  assert.match(field, /multiline\s+maxLength=\{MAX_PROFILE_DESCRIPTION_LENGTH\}/);
  assert.doesNotMatch(field, /numberOfLines=\{2\}|accountDescriptionHint|Se mostrará/);
  assert.doesNotMatch(field, /updateProfile/);
  assert.ok(source.indexOf('value={accountName}') < source.indexOf('testID="account-description-section"'));
  assert.match(source, /setAccountDescription\(limitProfileDescription\(description\)\)/);
});

test("changing only the description enables Guardar, including removing an existing description", () => {
  assert.equal(disabled(null, "Nombre", "Nombre", "Nueva", ""), false);
  assert.equal(disabled(null, "Nombre", "Nombre", "", "Anterior"), false);
  assert.equal(disabled(null, "Nombre", "Nombre", "  Igual  ", "Igual"), true);
  assert.equal(disabled("delete", "Nombre", "Nombre", "Nueva", ""), true);
  assert.equal(disabled(null, "Nombre", "Nombre", "", "", "Solo cambió el lema", ""), false);
  assert.equal(disabled(null, "Nombre", "Nombre", "", "", "", "Lema anterior"), false);
  assert.equal(disabled(null, "Nombre", "Nombre", "", "", " Igual ", "Igual"), true);
});

test("description accepts up to 300 characters and multiple lines without splitting emoji at the boundary", () => {
  assert.equal(MAX_PROFILE_DESCRIPTION_LENGTH, 300);
  assert.equal(limitProfileDescription("Primera\r\nSegunda\r\nTercera"), "Primera\nSegunda\nTercera");
  assert.equal(limitProfileDescription(""), "");
  assert.equal(limitProfileDescription("x".repeat(301)), "x".repeat(300));
  assert.equal(limitProfileDescription("x".repeat(299) + "😀"), "x".repeat(299));
  assert.equal(limitProfileDescription("x".repeat(298) + "😀").length, 300);
});

test("Guardar persists name, description and motto together, including clearing", () => {
  const calls: unknown[] = [];
  const animation = () => ({ start() {} });
  const toast = { stopAnimation() {}, setValue() {} };
  const compiled = ts.transpileModule(`return (${initializer("saveAccount")});`, {
    compilerOptions: { target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const factory = new Function(
    "accountSaveDisabled", "accountName", "accountDescription", "accountLifeMotto", "updateProfile", "limitProfileDescription",
    "Haptics", "accountToastOpacity", "accountToastY", "Animated", "Easing", compiled,
  );
  for (const [description, motto] of [[" Mi descripción\nSegunda línea ", "Mi lema"], ["", ""]]) {
    const save = factory(
      false, "Nombre", description, motto, (profile: unknown) => calls.push(profile), limitProfileDescription,
      { notificationAsync() {}, NotificationFeedbackType: { Success: "success" } }, toast, toast,
      { sequence: animation, parallel: animation, timing: animation, delay: animation },
      { out: () => null, in: () => null, quad: null },
    );
    save();
  }
  assert.deepEqual(calls, [
    { username: "Nombre", description: "Mi descripción\nSegunda línea", lifeMotto: "Mi lema" },
    { username: "Nombre", description: "", lifeMotto: "" },
  ]);
  const context = readFileSync(new URL("../context/UserProfileContext.tsx", import.meta.url), "utf8");
  assert.match(context, /description: limitProfileDescription\(fields.description.trim\(\)\)/);
  assert.match(context, /fields.lifeMotto !== undefined/);
  assert.match(context, /AsyncStorage.setItem\(STORAGE_KEY, JSON.stringify\(next\)\)/);
});

test("account avatar matches Perfil, description grows fifty pixels and labels use exact 630 weight", () => {
  const selected: string[] = [];
  function visit(node: ts.Node) {
    if (ts.isPropertyAssignment(node) && ["accountAvatar", "avatarImage", "accountFieldLabel", "accountDescriptionInput"].includes(node.name.getText(ast))) selected.push(node.getText(ast));
    ts.forEachChild(node, visit);
  }
  visit(ast);
  const styles = new Function(`return ({${selected.join(",")}});`)();
  assert.deepEqual(styles.accountAvatar, styles.avatarImage);
  assert.equal(styles.accountAvatar.width, 124);
  assert.equal(styles.accountDescriptionInput.height, 72 + 50);
  assert.equal(styles.accountFieldLabel.fontSize, 13 + 2);
  assert.equal(styles.accountFieldLabel.fontFamily, "Manrope630");
  assert.equal(styles.accountFieldLabel.fontWeight, undefined);
  const layout = readFileSync(new URL("../app/_layout.tsx", import.meta.url), "utf8");
  assert.match(layout, /Manrope630: require\("\.\.\/assets\/fonts\/Manrope630.ttf"\)/);
  const font = readFileSync(new URL("../assets/fonts/Manrope630.ttf", import.meta.url));
  const tables = new Map<string, number>();
  for (let i = 0; i < font.readUInt16BE(4); i++) {
    const record = 12 + i * 16;
    tables.set(font.toString("ascii", record, record + 4), font.readUInt32BE(record + 8));
  }
  assert.ok(tables.has("OS/2"));
  assert.equal(font.readUInt16BE(tables.get("OS/2")! + 4), 700 - 70);
  assert.ok(!tables.has("fvar"), "the registered font is static, not an unsupported arbitrary fontWeight");
});

test("profile storage preserves the motto across hydration, supports clearing it and caps every description update", async () => {
  const contextSource = readFileSync(new URL("../context/UserProfileContext.tsx", import.meta.url), "utf8");
  const contextAst = ts.createSourceFile("context.tsx", contextSource, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let update = "";
  let load = "";
  let defaults = "";
  function visit(node: ts.Node) {
    if (ts.isVariableDeclaration(node) && node.name.getText(contextAst) === "updateProfile"
      && node.initializer && ts.isCallExpression(node.initializer)) update = node.initializer.arguments[0].getText(contextAst);
    if (ts.isVariableDeclaration(node) && node.name.getText(contextAst) === "DEFAULT_PROFILE") defaults = node.initializer!.getText(contextAst);
    if (ts.isCallExpression(node) && node.expression.getText(contextAst) === "useEffect"
      && node.arguments[0].getText(contextAst).includes("AsyncStorage.getItem")) load = node.arguments[0].getText(contextAst);
    ts.forEachChild(node, visit);
  }
  visit(contextAst);
  assert.ok(update && load && defaults);
  const defaultProfile = new Function("DEFAULT_USERNAME", `return (${defaults});`)("Nombre");
  const compile = (callback: string) => ts.transpileModule(`return (${callback});`, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
  const saved: any[] = [];
  const persist = (value: unknown) => saved.push(JSON.parse(JSON.stringify(value)));
  const setter = new Function("profile", "persist", "DEFAULT_PROFILE", "limitProfileDescription", compile(update))(
    { ...defaultProfile, photoUri: "file:///avatar.png" }, persist, defaultProfile, limitProfileDescription,
  );
  setter({ lifeMotto: "  Vivir\ncon intención  ", description: "x".repeat(350) });
  assert.equal(saved[0].lifeMotto, "Vivir con intención");
  assert.equal(saved[0].description.length, 300);
  assert.equal(saved[0].photoUri, "file:///avatar.png");
  setter({ lifeMotto: "" });
  assert.equal(saved[1].lifeMotto, "");
  for (const persisted of [saved[0], { username: "Anterior", description: "Antes del lema" }]) {
    let hydrated = { ...defaultProfile };
    const completed = new Promise<void>(resolve => {
      const loader = new Function("AsyncStorage", "STORAGE_KEY", "setProfile", "setLoaded", "limitProfileDescription", compile(load))(
        { getItem: () => Promise.resolve(JSON.stringify(persisted)) }, "test-profile",
        (update: (previous: any) => any) => { hydrated = update(hydrated); },
        () => resolve(), limitProfileDescription,
      );
      loader();
    });
    await completed;
    assert.equal(hydrated.lifeMotto, persisted.lifeMotto ?? "");
    assert.equal(hydrated.username, persisted.username);
    assert.ok(hydrated.description.length <= 300);
  }
});