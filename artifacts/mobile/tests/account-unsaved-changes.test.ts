import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { URL } from "node:url";
import test from "node:test";
import ts from "typescript";
import { limitProfileDescription } from "../lib/profileDescription.ts";

const source = readFileSync(new URL("../components/ProfileScreenBase.tsx", import.meta.url), "utf8");
const ast = ts.createSourceFile("profile.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const expressions = new Map<string, string>();
function visit(node: ts.Node) {
  if (ts.isVariableDeclaration(node) && node.initializer) expressions.set(node.name.getText(ast), node.initializer.getText(ast));
  ts.forEachChild(node, visit);
}
visit(ast);
function evaluate(name: string, deps: Record<string, unknown>) {
  assert.ok(expressions.has(name), name);
  const code = ts.transpileModule(`return (${expressions.get(name)});`, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
  return new Function(...Object.keys(deps), code)(...Object.values(deps));
}
function changes(overrides: Record<string, unknown> = {}) {
  const deps = {
    username: "Nombre", accountName: "Nombre", description: "Descripción", accountDescription: "Descripción",
    lifeMotto: "Lema", accountLifeMotto: "Lema", photoUri: null, accountPhotoUri: null,
    avatarPresetId: "old-avatar", accountAvatarPresetId: "old-avatar",
    selectedProfilePreset: { id: "old-avatar" }, accountSelectedProfilePreset: { id: "old-avatar" },
    ...overrides,
  };
  const accountAvatarChanged = evaluate("accountAvatarChanged", deps);
  const accountHasChanges = evaluate("accountHasChanges", { ...deps, accountAvatarChanged });
  return {
    accountAvatarChanged, accountHasChanges,
    disabled: evaluate("accountSaveDisabled", { accountSaving: false, accountAction: null, accountHasChanges }),
  };
}

test("Guardar activates for any edited field, new preset or phone photo; reverting everything disables it", () => {
  assert.equal(changes().disabled, true);
  for (const draft of [
    { accountName: "Nuevo nombre" }, { accountDescription: "Nueva descripción" }, { accountLifeMotto: "Otro lema" },
    { accountAvatarPresetId: "new-avatar", accountSelectedProfilePreset: { id: "new-avatar" } },
    { accountPhotoUri: "file:///new-photo.png", accountAvatarPresetId: null, accountSelectedProfilePreset: undefined },
  ]) assert.equal(changes(draft).disabled, false);
  assert.equal(changes({ accountName: " Nombre ", accountDescription: "Descripción ", accountLifeMotto: " Lema " }).disabled, true);
  assert.equal(changes({ avatarPresetId: "profile:legacy", accountAvatarPresetId: "profile:legacy" }).disabled, true,
    "resolving legacy avatar aliases must not enable Guardar without an edit");
  assert.equal(changes({ avatarPresetId: "profile:legacy", accountAvatarPresetId: "old-avatar" }).disabled, true);
});

test("X closes clean forms immediately, but dirty forms use the exact native cancel/destructive confirmation", () => {
  for (const dirty of [false, true]) {
    let backs = 0;
    const alerts: any[][] = [];
    const closedRef = { current: false };
    const close = evaluate("closeAccount", { accountClosedRef: closedRef, onBack: () => { backs++; }, router: { back() { assert.fail(); } } });
    const request = evaluate("requestCloseAccount", {
      accountClosedRef: closedRef, accountSavingRef: { current: false }, accountHasChanges: dirty,
      closeAccount: close, Alert: { alert: (...args: any[]) => alerts.push(args) },
    });
    request();
    assert.equal(backs, dirty ? 0 : 1);
    assert.equal(alerts.length, dirty ? 1 : 0);
    if (dirty) {
      const [title, , buttons, options] = alerts[0];
      assert.equal(title, "¿Estás seguro/a de que quieres descargar los cambios?");
      assert.equal(buttons[0].text, "Continuar editando");
      assert.equal(buttons[0].style, "cancel"); // Native iOS blue action.
      assert.equal(buttons[1].text, "Descartar");
      assert.equal(buttons[1].style, "destructive"); // Native iOS red action.
      assert.equal(options.cancelable, false);
      buttons[0].onPress?.();
      assert.equal(backs, 0);
      buttons[1].onPress();
      assert.equal(backs, 1);
      assert.equal(closedRef.current, true);
      assert.doesNotMatch(expressions.get("requestCloseAccount")!, /saveProfile|updateMe|setPhotoUri|setAvatarPresetId/);
    }
  }
});

test("photo changes stay in the editor draft until Guardar, while other photo paths retain their original behavior", () => {
  for (const accountMode of [true, false]) {
    const draftPhotos: unknown[] = [], draftPresets: unknown[] = [], persisted: unknown[] = [];
    const apply = evaluate("applySelectedPhoto", {
      accountMode, accountClosedRef: { current: false }, accountSavingRef: { current: false },
      setAccountPhotoUri: (v: unknown) => draftPhotos.push(v),
      setAccountAvatarPresetId: (v: unknown) => draftPresets.push(v),
      setPhotoUri: (v: unknown) => persisted.push(v),
    });
    apply("file:///new-photo.png");
    assert.deepEqual(draftPhotos, accountMode ? ["file:///new-photo.png"] : []);
    assert.deepEqual(draftPresets, accountMode ? [null] : []);
    assert.deepEqual(persisted, accountMode ? [] : ["file:///new-photo.png"]);
  }
  const form = source.slice(source.indexOf('testID="account-header-actions"'), source.indexOf('visible={accountPhotoPickerVisible}'));
  assert.match(form, /source=\{\{ uri: accountPhotoUri \}\}/);
  assert.match(form, /source=\{accountSelectedProfilePreset.source\}/);
});

function savingHarness(kind: "preset" | "photo", updateMe: (data: unknown) => Promise<unknown>) {
  const writes: any[] = [], errors: any[] = [], cache: any[] = [];
  let closes = 0, refreshes = 0;
  const save = evaluate("saveAccount", {
    accountSaveDisabled: false, accountSavingRef: { current: false }, accountClosedRef: { current: false },
    setAccountSaving() {}, accountName: "Nombre", accountDescription: "Descripción", accountLifeMotto: "Lema",
    accountAvatarChanged: true, accountAvatarPresetId: kind === "preset" ? "new-avatar" : null,
    accountPhotoUri: kind === "photo" ? "file:///new-photo.png" : null,
    updateMe, saveProfile: async (value: unknown) => { writes.push(value); },
    qc: { setQueryData: (...args: unknown[]) => cache.push(args), invalidateQueries: async () => {} },
    getGetMeQueryKey: () => ["me"], limitProfileDescription,
    refreshProfileCatalog: async () => { refreshes++; },
    Haptics: { notificationAsync() {}, NotificationFeedbackType: { Success: "success" } },
    Alert: { alert: (...args: unknown[]) => errors.push(args) }, closeAccount: () => { closes++; },
  });
  return { save, writes, errors, cache, closes: () => closes, refreshes: () => refreshes };
}

test("new avatars are confirmed by the server only at Guardar, before persistence or closing", async () => {
  let confirm!: (value: unknown) => void;
  const h = savingHarness("preset", async data => {
    assert.deepEqual(data, { avatarPresetId: "new-avatar" });
    return new Promise(resolve => { confirm = resolve; });
  });
  const saving = h.save();
  assert.equal(h.writes.length, 0);
  assert.equal(h.closes(), 0);
  confirm({ avatarPresetId: "new-avatar" });
  await saving;
  assert.deepEqual(h.writes[0], { username: "Nombre", description: "Descripción", lifeMotto: "Lema", avatarPresetId: "new-avatar", photoUri: null });
  assert.equal(h.closes(), 1);
  assert.equal(h.cache.length, 1);
});

test("server lock or network rejection leaves the draft open without changing the saved profile", async () => {
  for (const error of [Error("offline"), { data: { code: "AVATAR_LOCKED" } }]) {
    const h = savingHarness("preset", async () => { throw error; });
    await h.save();
    assert.equal(h.writes.length, 0);
    assert.equal(h.closes(), 0);
    assert.equal(h.errors.length, 1);
    assert.equal(h.refreshes(), 1);
  }
});

test("Guardar commits a phone photo and clears its preset; it does not send the preset-selection request", async () => {
  const h = savingHarness("photo", async () => { assert.fail("photos use the existing upload sync after local save"); });
  await h.save();
  assert.equal(h.writes[0].photoUri, "file:///new-photo.png");
  assert.equal(h.writes[0].avatarPresetId, null);
  assert.equal(h.closes(), 1);
});
