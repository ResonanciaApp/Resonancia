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
function harness() {
  const selected: unknown[] = [];
  const alerts: unknown[] = [];
  const saving: unknown[] = [];
  let refreshed = 0;
  const ref = { current: false };
  const pick = evaluate(picker!, {
    accountSavingRef: ref, accountClosedRef: { current: false },
    setAccountAvatarPresetId: (value: unknown) => selected.push(value),
    setAccountPhotoUri: (value: unknown) => saving.push(value),
    Alert: { alert: (...args: unknown[]) => alerts.push(args) },
    refreshProfileCatalog: async () => { refreshed++; },
  });
  return { pick, selected, alerts, saving, ref, refreshed: () => refreshed };
}

test("locked avatar handler never requests or persists a selection", async () => {
  const h = harness();
  await h.pick({ id: "profile:locked", isLocked: true });
  assert.deepEqual(h.selected, []);
  assert.deepEqual(h.saving, []);
});

test("unlocked avatar choices stage a draft without sending or persisting anything", async () => {
  const h = harness();
  await h.pick({ id: "profile:one", isLocked: false });
  assert.deepEqual(h.selected, ["profile:one"]);
  assert.equal(h.alerts.length, 0);
  assert.equal(h.refreshed(), 0);
  assert.deepEqual(h.saving, [null]);
  assert.equal(h.ref.current, false);
});

test("picker cannot modify the draft while Guardar is committing it", async () => {
  const h = harness();
  h.ref.current = true;
  await h.pick({ id: "profile:one", isLocked: false });
  assert.deepEqual(h.selected, []);
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
      accountAvatarPresetId: null, accountSelectedProfilePreset: undefined, accountSaving: false, pickAccountAvatarPreset() {},
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
