import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { URL } from "node:url";
import test from "node:test";
import ts from "typescript";

const source = readFileSync(new URL("../../resonancia-admin/src/pages/portadas-avatares.tsx", import.meta.url), "utf8");
const ast = ts.createSourceFile("portadas-avatares.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const scopeFunction = ast.statements.find((node) => ts.isFunctionDeclaration(node) && node.name?.text === "ScopeSection");
assert.ok(scopeFunction);
const code = ts.transpileModule(`${scopeFunction.getText(ast)}; return ScopeSection;`, {
  compilerOptions: { jsx: ts.JsxEmit.React, target: ts.ScriptTarget.ES2022 },
}).outputText;

function render(scope: string, locked: boolean, mutate: (args: any) => Promise<any> = async ({ id, data }) => ({ ...preset, id, ...data })) {
  const currentPreset = { ...preset, scope, isLocked: locked };
  const states: any[] = [[currentPreset], false, false, true, null];
  let index = 0;
  let refreshed = 0;
  const messages: string[] = [];
  const React = { createElement: (type: string, props: any, ...children: any[]) => ({ type, props: { ...props, children } }) };
  const mutation = () => ({ isPending: false, mutateAsync: mutate });
  const deps: Record<string, unknown> = {
    React,
    useState: () => {
      const slot = index++;
      return [states[slot], (next: any) => { states[slot] = typeof next === "function" ? next(states[slot]) : next; }];
    },
    useRef: (current: any) => ({ current }), useEffect() {},
    useListAdminCoverPresets: () => ({ isLoading: false, data: { presets: [currentPreset] }, refetch: async () => { refreshed++; } }),
    useCreateAdminCoverPreset: mutation, useUpdateAdminCoverPreset: mutation,
    useDeleteAdminCoverPreset: mutation, useReorderAdminCoverPresets: mutation,
    useCleanupAdminCoverPresetUpload: mutation, useRequestUploadUrl: mutation,
    previewUrl: () => "/fixture.png", toast: { success: (m: string) => messages.push(m), error: (m: string) => messages.push(m) },
  };
  for (const icon of ["Button", "GripVertical", "ChevronDown", "ImageIcon", "Loader2", "Trash2", "Upload", "LockKeyhole", "UnlockKeyhole"]) deps[icon] = icon;
  const Component = new Function(...Object.keys(deps), code)(...Object.values(deps));
  const tree = Component({ scope: { value: scope, label: scope, description: "Fixture" } });
  const nodes: any[] = [];
  function walk(node: any) {
    if (Array.isArray(node)) return node.forEach(walk);
    if (!node || typeof node !== "object") return;
    nodes.push(node);
    node.props?.children?.forEach(walk);
  }
  walk(tree);
  return { nodes, states, messages, refreshed: () => refreshed };
}
const preset = { id: "profile:one", key: "one", label: "One", source: "builtin", builtinKey: "cosmic-nebula", isLocked: false };

test("actual Admin cards show toggle only for Profile and exact white overlay only when locked", () => {
  for (const scope of ["profile", "mix", "playlist", "reflection-story"]) {
    for (const locked of [true, false]) {
      const h = render(scope, locked);
      const button = h.nodes.find((n) => /^(Bloquear|Desbloquear) One$/.test(n.props?.["aria-label"] ?? ""));
      assert.equal(!!button, scope === "profile");
      if (button) assert.equal(button.props["aria-pressed"], locked);
      const layer = h.nodes.find((n) => n.props?.style?.backgroundColor === "rgba(255,255,255,0.4)");
      assert.equal(!!layer, scope === "profile" && locked);
    }
  }
});

test("Admin toggles persist the inverse state and block duplicate requests before render", async () => {
  for (const locked of [true, false]) {
    const requests: any[] = [];
    let resolve!: (value: any) => void;
    const h = render("profile", locked, (args) => { requests.push(args); return new Promise((done) => { resolve = done; }); });
    const button = h.nodes.find((n) => /^(Bloquear|Desbloquear) One$/.test(n.props?.["aria-label"] ?? ""));
    button.props.onClick();
    button.props.onClick();
    assert.deepEqual(requests, [{ id: preset.id, data: { isLocked: !locked } }]);
    resolve({ ...preset, isLocked: !locked });
    await new Promise((done) => setImmediate(done));
    assert.equal(h.states[0][0].isLocked, !locked);
    assert.equal(h.refreshed(), 1);
    assert.equal(h.states[4], null);
  }
});

test("Admin failed save leaves prior lock state intact and reports the failure", async () => {
  const h = render("profile", true, async () => { throw new Error("offline"); });
  h.nodes.find((n) => n.props?.["aria-label"] === "Desbloquear One").props.onClick();
  await new Promise((done) => setImmediate(done));
  assert.equal(h.states[0][0].isLocked, true);
  assert.equal(h.refreshed(), 0);
  assert.ok(h.messages[0].includes("No se pudo"));
});
