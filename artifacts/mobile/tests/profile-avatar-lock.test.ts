import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { URL } from "node:url";
import test from "node:test";
import ts from "typescript";

const source = readFileSync(new URL("../components/ProfileScreenBase.tsx", import.meta.url), "utf8");
const ast = ts.createSourceFile("ProfileScreenBase.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let picker: ts.Expression | undefined;
let renderItem: ts.Expression | undefined;
let overlay: ts.Expression | undefined;
function visit(node: ts.Node) {
  if (ts.isVariableDeclaration(node) && node.name.getText(ast) === "pickAccountAvatarPreset") picker = node.initializer;
  if (ts.isPropertyAssignment(node) && node.name.getText(ast) === "accountAvatarLockedOverlay") overlay = node.initializer;
  if (ts.isJsxAttribute(node) && node.name.getText(ast) === "renderItem" && node.initializer && ts.isJsxExpression(node.initializer)) {
    const expression = node.initializer.expression;
    if (expression?.getText(ast).includes("pickAccountAvatarPreset")) renderItem = expression;
  }
  ts.forEachChild(node, visit);
}
visit(ast);
assert.ok(picker);
assert.ok(renderItem);
assert.ok(overlay);
function evaluate(expression: ts.Expression, deps: Record<string, unknown>) {
  const code = ts.transpileModule(`return (${expression.getText(ast)});`, {
    compilerOptions: { jsx: ts.JsxEmit.React, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  return new Function(...Object.keys(deps), code)(...Object.values(deps));
}
function harness(updateMe: (body: unknown) => Promise<unknown>) {
  const selected: unknown[] = [];
  const alerts: unknown[] = [];
  const saving: unknown[] = [];
  let refreshed = 0;
  const ref = { current: false };
  const pick = evaluate(picker!, {
    savingAvatarRef: ref, updateMe,
    setSavingAvatar: (value: unknown) => saving.push(value),
    qc: { setQueryData() {}, invalidateQueries() {} },
    getGetMeQueryKey: () => ["me"],
    setAvatarPresetId: (value: unknown) => selected.push(value),
    Alert: { alert: (...args: unknown[]) => alerts.push(args) },
    refreshProfileCatalog: async () => { refreshed++; },
  });
  return { pick, selected, alerts, saving, ref, refreshed: () => refreshed };
}

test("locked avatar handler never requests or persists a selection", async () => {
  const h = harness(async () => { throw new Error("must not call"); });
  await h.pick({ id: "profile:locked", isLocked: true });
  assert.deepEqual(h.selected, []);
  assert.deepEqual(h.saving, []);
});

test("server rejects a lock added after opening: selection stays unchanged and catalog refreshes", async () => {
  const h = harness(async () => { throw { data: { code: "AVATAR_LOCKED" } }; });
  await h.pick({ id: "profile:one", isLocked: false });
  assert.deepEqual(h.selected, []);
  assert.equal(h.alerts.length, 1);
  assert.equal(h.refreshed(), 1);
  assert.deepEqual(h.saving, [true, false]);
  assert.equal(h.ref.current, false);
});

test("network failure does not leave a pending avatar; unlocked success persists only after server confirmation", async () => {
  const failed = harness(async () => { throw new Error("offline"); });
  await failed.pick({ id: "profile:one" });
  assert.deepEqual(failed.selected, []);
  let resolve!: (value: unknown) => void;
  const success = harness(() => new Promise((done) => { resolve = done; }));
  const task = success.pick({ id: "profile:one", isLocked: false });
  assert.deepEqual(success.selected, []);
  await success.pick({ id: "profile:two" }); // Duplicate taps are ignored.
  resolve({ avatarPresetId: "profile:one" });
  await task;
  assert.deepEqual(success.selected, ["profile:one"]);
});

test("actual avatar grid disables locked cards and overlays exact white 40% plus Tu camino's lock", () => {
  const overlayStyle = evaluate(overlay!, {});
  assert.equal(overlayStyle.backgroundColor, "rgba(255,255,255,0.4)");
  assert.equal(overlayStyle.borderRadius, 27.5);
  assert.equal(overlayStyle.top, 4);
  assert.equal(overlayStyle.bottom, 4);
  const React = { createElement: (type: string, props: any, ...children: any[]) => ({ type, props: { ...props, children } }) };
  for (const locked of [true, false]) {
    const render = evaluate(renderItem!, {
      React, Pressable: "Pressable", Image: "Image", View: "View", MaterialCommunityIcons: "MaterialCommunityIcons",
      styles: { accountAvatarLockedOverlay: overlayStyle },
      StyleSheet: { absoluteFill: { position: "absolute" } },
      avatarPresetId: null, savingAvatar: false, pickAccountAvatarPreset() {},
    });
    const card = render({ item: { id: "profile:one", key: "one", label: "One", isLocked: locked, source: 1 } });
    assert.equal(card.props.disabled, locked);
    assert.equal(card.props.accessibilityState.disabled, locked);
    const layer = card.props.children.find((child: any) => child?.type === "View");
    assert.equal(!!layer, locked);
    if (layer) {
      assert.equal(layer.props.pointerEvents, "none");
      assert.equal(layer.props.children[0].props.name, "lock");
      assert.equal(layer.props.children[0].props.size, 16);
      assert.equal(layer.props.children[0].props.color, "#F9F9F9");
    }
  }
});

test("catalog refresh on opening and legacy sync rollback protect other selection paths", () => {
  assert.match(source, /if \(accountPhotoPickerVisible\) void refreshProfileCatalog\(\)/);
  const sync = readFileSync(new URL("../components/ProfileSync.tsx", import.meta.url), "utf8");
  assert.match(sync, /AVATAR_LOCKED[\s\S]*?latestAvatarPresetId\.current === avatarPresetId[\s\S]*?updateProfile/);
});
