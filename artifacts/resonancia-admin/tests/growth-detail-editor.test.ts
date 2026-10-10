import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import React from "react";
import ts from "typescript";

const lib = await import("../src/lib/growth-worlds.ts");
const compiled = ts.transpileModule(
  readFileSync(new URL("../src/pages/tu-camino.tsx", import.meta.url), "utf8"),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React } },
).outputText;

function harness() {
  const query = { data: {
    revision: 1, updatedAt: new Date().toISOString(),
    stages: [{ id: "intencion", group: "florecimiento", name: "Intención", startDay: 0, endDay: 0,
      story: "Descripción del recorrido", imageUrl: "/api/image", rewards: [],
      detailPhrase: "Frase del detalle", detailDescription: "Descripción del detalle" }],
  }, isLoading: false, error: null };
  const state: any[] = [];
  const effects: (() => void)[] = [];
  const saves: any[] = [];
  let cursor = 0;
  const ui = (props: any) => React.createElement("div", props, props.children);
  const mocks: Record<string, any> = {
    react: {
      useState: (initial: any) => {
        const i = cursor++;
        if (!(i in state)) state[i] = typeof initial === "function" ? initial() : initial;
        return [state[i], (next: any) => { state[i] = typeof next === "function" ? next(state[i]) : next; }];
      },
      useRef: (initial: any) => {
        const i = cursor++;
        if (!(i in state)) state[i] = { current: initial };
        return state[i];
      },
      useMemo: (fn: any) => fn(),
      useEffect: (fn: any) => effects.push(fn),
    },
    "@tanstack/react-query": { useQueryClient: () => ({
      setQueryData: (_key: any, data: any) => { query.data = data; },
      invalidateQueries: async () => {},
    }) },
    "@workspace/api-client-react": {
      useGetGrowthCatalog: () => query,
      getGetGrowthCatalogQueryKey: () => ["growth"],
      useSaveGrowthCatalog: () => ({
        isPending: false,
        mutateAsync: async ({ data }: any) => {
          saves.push(structuredClone(data));
          return { ...query.data, ...data, revision: data.revision + 1 };
        },
      }),
      useRequestUploadUrl: () => ({}),
    },
    "@/lib/growth-worlds": lib,
    "@/lib/uploadFile": { uploadFile: async () => {} },
    "sonner": { toast: { error: () => {}, success: () => {} } },
    "lucide-react": Object.fromEntries(["ArrowDown", "ArrowUp", "ImageIcon", "Loader2", "Plus", "Trash2", "Upload", "X", "AlertTriangle"].map(name => [name, ui])),
    "@/components/ui/button": { Button: ui },
    "@/components/ui/input": { Input: ui },
    "@/components/ui/textarea": { Textarea: ui },
    "@/components/ui/switch": { Switch: ui },
    "@/components/ui/alert-dialog": Object.fromEntries(["AlertDialog", "AlertDialogAction", "AlertDialogCancel", "AlertDialogContent", "AlertDialogDescription", "AlertDialogFooter", "AlertDialogHeader", "AlertDialogTitle"].map(name => [name, ui])),
  };
  const module = { exports: {} as any };
  new Function("require", "module", "exports", "React", compiled)(
    (name: string) => { assert.ok(name in mocks, `Missing mock ${name}`); return mocks[name]; }, module, module.exports, React,
  );
  function render() {
    cursor = 0; effects.length = 0;
    const tree = module.exports.default();
    effects.splice(0).forEach(fn => fn());
    return tree;
  }
  function find(tree: any, id: string): any {
    if (!tree || typeof tree !== "object") return;
    if (Array.isArray(tree)) { for (const node of tree) { const result = find(node, id); if (result) return result; } }
    if (tree.props?.["data-testid"] === id) return tree.props;
    return find(tree.props?.children, id);
  }
  render();
  return { render, find, query, saves };
}

test("Admin detail fields activate saving and survive save, reload and explicit deletion", async () => {
  const h = harness();
  let tree = h.render();
  const phrase = h.find(tree, "input-detail-phrase-intencion");
  const description = h.find(tree, "input-detail-description-intencion");
  assert.equal(phrase.value, "Frase del detalle");
  assert.equal(phrase.maxLength, 2000);
  assert.equal(description.maxLength, 10000);
  const actualSaveId = "button-save-catalog";
  phrase.onChange({ target: { value: "Frase nueva" } });
  tree = h.render();
  h.find(tree, "input-detail-description-intencion").onChange({ target: { value: "Larga\nDos párrafos" } });
  tree = h.render();
  const save = h.find(tree, actualSaveId);
  assert.ok(save, "Save button must be present");
  assert.equal(save.disabled, false);
  await save.onClick();
  tree = h.render();
  assert.equal(h.query.data.stages[0].detailPhrase, "Frase nueva");
  assert.equal(h.query.data.stages[0].detailDescription, "Larga\nDos párrafos");
  assert.equal(h.query.data.stages[0].story, "Descripción del recorrido");
  assert.equal(h.find(tree, "input-detail-phrase-intencion").value, "Frase nueva");
  h.find(tree, "input-detail-phrase-intencion").onChange({ target: { value: "" } });
  tree = h.render();
  await h.find(tree, actualSaveId).onClick();
  h.render(); tree = h.render();
  assert.equal(h.find(tree, "input-detail-phrase-intencion").value, "");
  assert.equal(h.saves.at(-1).revision, 2);
  assert.deepEqual(h.saves.at(-1).stages[0].rewards, []);
});
