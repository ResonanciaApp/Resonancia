import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import React from "react";
import ts from "typescript";
import * as helpers from "../src/lib/cover-preset-order.ts";
import * as categoryHelpers from "../src/lib/profile-avatar-categories.ts";

function compile(path: string) {
  const source = readFileSync(new URL(path, import.meta.url), "utf8")
    .replace(/const builtinModules = import\.meta\.glob\([\s\S]*?\n\);/, "const builtinModules = {};");
  return ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React },
  }).outputText;
}
function load(compiled: string, mocks: Record<string, unknown>) {
  const module = { exports: {} as any };
  new Function("require", "module", "exports", "React", compiled)(
    (name: string) => { assert.ok(name in mocks, `Unexpected dependency ${name}`); return mocks[name]; },
    module, module.exports, React,
  );
  return module.exports;
}
const Controls = load(compile("../src/components/ProfileAvatarOrderControls.tsx"), {
  "@/components/ui/button": { Button: "button" },
  "@/components/ui/input": { Input: "input" },
}).ProfileAvatarOrderControls;
const compiledPage = compile("../src/pages/portadas-avatares.tsx");

function elements(tree: unknown): React.ReactElement<any>[] {
  if (Array.isArray(tree)) return tree.flatMap(elements);
  if (!React.isValidElement(tree)) return [];
  const element = tree as React.ReactElement<any>;
  if (typeof element.type === "function") return elements((element.type as any)(element.props));
  return [element, ...elements(element.props.children)];
}
function find(tree: unknown, predicate: (element: React.ReactElement<any>) => boolean) {
  const result = elements(tree).find(predicate);
  assert.ok(result, "Expected control");
  return result;
}
function button(tree: unknown, label: string) {
  return find(tree, element => element.type === "button" && elements(element.props.children).length === 0 && element.props.children === label
    || element.type === "button" && Array.isArray(element.props.children) && element.props.children.includes(label));
}

function harness(count = 20, scope = "profile") {
  const initial = Array.from({ length: count }, (_, index) => ({
    id: `avatar-${index + 1}`, label: `Avatar ${index + 1}`, scope, sortOrder: index,
    isLocked: index % 2 === 0, objectPath: `/objects/avatar-${index}`, source: "object", updatedAt: "2026-10-07",
  }));
  let server = structuredClone(initial);
  const query = {
    data: { scope, presets: structuredClone(server) }, isLoading: false, error: null,
    refetch: async () => {
      query.data = { scope, categories: [{ id: "c1", name: "Calma" }, { id: "c2", name: "Sueño" }], presets: structuredClone(server) } as any;
      return { data: query.data, error: null };
    },
  };
  const state: any[] = [];
  let cursor = 0;
  let changed = false;
  let effects: (() => void)[] = [];
  const writes: any[] = [];
  const locks: any[] = [];
  const notices: string[] = [];
  const invalidations: any[] = [];
  let saveFailure: any = null;
  let savingGate: (() => Promise<void>) | null = null;
  const mutation = {
    isPending: false,
    mutateAsync: async (payload: any) => {
      writes.push(payload);
      if (savingGate) await savingGate();
      if (saveFailure) throw saveFailure;
      server = payload.data.ids.map((id: string, sortOrder: number) => ({
        ...server.find(item => item.id === id), sortOrder,
      }));
      return { scope, presets: structuredClone(server) };
    },
  };
  const membershipWrites: any[] = [];
  const memberships = {
    isPending: false,
    mutateAsync: async (payload: any) => {
      membershipWrites.push(payload);
      const { presetIds, categoryIds, mode } = payload.data;
      server = server.map(item => presetIds.includes(item.id) ? {
        ...item,
        categoryIds: mode === "add"
          ? [...new Set([...(item.categoryIds ?? []), ...categoryIds])]
          : (item.categoryIds ?? []).filter((id: string) => !categoryIds.includes(id)),
      } : item);
      return { scope, categories: [{ id: "c1", name: "Calma" }], presets: structuredClone(server) };
    },
  };
  const neutral = () => ({ isPending: false, mutateAsync: async () => {} });
  const mocks: Record<string, unknown> = {
    react: {
      useState: (initialState: any) => {
        const index = cursor++;
        if (!(index in state)) state[index] = initialState;
        return [state[index], (next: any) => {
          state[index] = typeof next === "function" ? next(state[index]) : next;
          changed = true;
        }];
      },
      useRef: (value: any) => {
        const index = cursor++;
        if (!(index in state)) state[index] = { current: value };
        return state[index];
      },
      useEffect: (effect: () => void, deps: any[]) => {
        const index = cursor++;
        const previous = state[index];
        if (!previous || deps.some((dep, i) => dep !== previous[i])) effects.push(effect);
        state[index] = deps;
      },
    },
    "@tanstack/react-query": { useQueryClient: () => ({
      setQueryData: (_key: unknown, data: any) => { query.data = data; },
      invalidateQueries: (data: any) => { invalidations.push(data); return Promise.resolve(); },
    }) },
    "@workspace/api-client-react": {
      useListAdminCoverPresets: () => query,
      useCreateAdminCoverPreset: neutral,
      useDeleteAdminCoverPreset: neutral,
      useCleanupAdminCoverPresetUpload: neutral,
      useRequestUploadUrl: neutral,
      useUpdateAdminCoverPreset: () => ({
        isPending: false,
        mutateAsync: async (payload: any) => { locks.push(payload); return initial[0]; },
      }),
      useReorderAdminCoverPresets: () => mutation,
      useUpdateProfileAvatarMemberships: () => memberships,
      getListAdminCoverPresetsQueryKey: (params: unknown) => ["admin", params],
      getListCoverPresetsQueryKey: (params: unknown) => ["public", params],
    },
    "@/lib/uploadFile": { uploadFile: async () => { throw new Error("Unexpected upload"); } },
    "@/lib/cover-preset-order": helpers,
    "@/components/ProfileAvatarOrderControls": { ProfileAvatarOrderControls: Controls },
    "@/components/ProfileAvatarCategoryManager": { ProfileAvatarCategoryManager: "category-manager" },
    "@/components/ProfileAvatarCategoryPicker": { ProfileAvatarCategoryPicker: "category-picker" },
    "@/lib/profile-avatar-categories": categoryHelpers,
    "@/components/ui/button": { Button: "button" },
    sonner: { toast: {
      success: (value: string) => notices.push(`success:${value}`),
      error: (value: string) => notices.push(`error:${value}`),
    } },
    "lucide-react": Object.fromEntries(["GripVertical", "ChevronDown", "ImageIcon", "Loader2", "Trash2", "Upload", "LockKeyhole", "UnlockKeyhole"].map(name => [name, "i"])),
  };
  const { ScopeSection } = load(compiledPage, mocks);
  const render = () => {
    let tree: React.ReactElement;
    let loops = 0;
    do {
      changed = false; cursor = 0; effects = [];
      tree = ScopeSection({ scope: { value: scope, label: "Avatares de Perfil", description: "" } });
      effects.forEach(effect => effect());
      assert.ok(++loops < 10, "No render loop");
    } while (changed);
    return tree!;
  };
  const select = (index: number, checked = true) => {
    const checkbox = find(render(), element => element.type === "input" && element.props.type === "checkbox" && element.props["aria-label"].endsWith(`posición ${index}`));
    checkbox.props.onChange({ target: { checked } });
  };
  const setPosition = (value: string) => find(render(), element => element.props.id === "profile-avatar-position").props.onChange({ target: { value } });
  const move = () => find(render(), element => element.type === "form").props.onSubmit({ preventDefault() {} });
  const ids = () => elements(render()).filter(element => element.type === "img").map(element => element.props.alt);
  find(render(), element => element.type === "button" && element.props["aria-controls"]).props.onClick();
  return {
    render, select, setPosition, move, ids, initial, membershipWrites, query, writes, locks, notices, invalidations, mutation,
    setFailure: (value: any) => { saveFailure = value; },
    setGate: (value: (() => Promise<void>) | null) => { savingGate = value; },
    changeServer: (value: typeof initial) => { server = structuredClone(value); },
    get server() { return server; },
  };
}

test("Profile avatar previews double to 96px without enlarging library covers", () => {
  for (const scope of ["profile", "mix", "playlist"]) {
    const previews = elements(harness(3, scope).render()).filter(element =>
      element.type === "div" && element.props.className?.includes("overflow-hidden border border-border bg-secondary"));
    assert.equal(previews.length, 3);
    for (const preview of previews) {
      assert.match(preview.props.className, scope === "profile" ? /h-24 w-24 rounded-full/ : /h-12 w-12 rounded-md/);
    }
  }
});

test("real cards select independently of locks and move a non-contiguous block in current order", () => {
  const h = harness();
  h.select(9); h.select(2); h.select(7);
  assert.equal(h.locks.length, 0);
  assert.ok(elements(h.render()).filter(element => element.props.draggable !== undefined).every(element => !element.props.draggable));
  h.setPosition("5"); h.move();
  assert.deepEqual(h.ids().slice(4, 7), ["Avatar 2", "Avatar 7", "Avatar 9"]);
  assert.equal(elements(h.render()).filter(element => element.props.checked).length, 0);
  assert.equal(button(h.render(), "Guardar orden").props.disabled, false);
});

test("profile preserves horizontal rows and action layout with larger avatar previews", () => {
  const h = harness();
  const tree = h.render();
  assert.ok(elements(tree).some(element => element.props.className === "space-y-2"));
  const rows = elements(tree).filter(element => element.props.draggable !== undefined);
  assert.equal(rows.length, 20);
  for (const row of rows) {
    assert.match(row.props.className, /^flex items-center gap-4 rounded-lg border bg-card px-4 py-3/);
    assert.doesNotMatch(row.props.className, /flex-col|w-52/);
    const contents = elements(row);
    assert.ok(contents.some(element => element.props.className === "flex-1"));
    assert.ok(contents.some(element => element.props.className === "flex shrink-0 items-center gap-2"));
    assert.ok(contents.some(element => /h-24 w-24.*rounded-full/.test(element.props.className ?? "")));
    assert.equal(contents.filter(element => element.props.type === "checkbox").length, 1);
  }
  assert.ok(!elements(tree).some(element => /overflow-x-auto|Lista horizontal/.test(`${element.props.className ?? ""} ${element.props["aria-label"] ?? ""}`)));
  h.select(1);
  assert.match(elements(h.render()).find(element => element.props.draggable !== undefined)!.props.className, /ring-2/);
});

test("invalid positions retain the selection and show an accessible error; no-op stays clean", () => {
  const h = harness();
  h.select(1); h.setPosition("0"); h.move();
  assert.ok(elements(h.render()).some(element => element.props.role === "alert"));
  assert.equal(elements(h.render()).filter(element => element.props.checked).length, 1);
  h.setPosition("1"); h.move();
  assert.ok(!elements(h.render()).some(element => element.props.children === "Guardar orden"));
  assert.deepEqual(h.ids(), h.initial.map(item => item.label));
});

test("cancel restores the saved list and clears selection and destination", () => {
  const h = harness();
  h.select(20); h.setPosition("1"); h.move();
  h.select(5); h.setPosition("9");
  button(h.render(), "Cancelar").props.onClick();
  assert.deepEqual(h.ids(), h.initial.map(item => item.label));
  assert.equal(elements(h.render()).filter(element => element.props.checked).length, 0);
  assert.ok(!elements(h.render()).some(element => element.props.id === "profile-avatar-position"));
});

test("200-card save sends complete stable IDs and consumes the saved response without clobbering the new order", async () => {
  const h = harness(200);
  for (let i = 200; i > 190; i--) h.select(i);
  h.setPosition("5"); h.move();
  const proposed = h.ids();
  await button(h.render(), "Guardar orden").props.onClick();
  assert.equal(h.writes.length, 1);
  assert.equal(h.writes[0].data.ids.length, 200);
  assert.deepEqual(h.writes[0].data.expectedIds, h.initial.map(item => item.id));
  assert.deepEqual(h.ids(), proposed);
  assert.deepEqual(h.server.slice(4, 14).map(item => item.id), h.initial.slice(190).map(item => item.id));
  assert.ok(h.server.every(item => item.objectPath === h.initial.find(original => original.id === item.id)!.objectPath && item.isLocked === h.initial.find(original => original.id === item.id)!.isLocked));
  assert.equal(h.invalidations.length, 1);
  assert.ok(h.notices.includes("success:Orden guardado"));
});

test("save error retains the proposal and permits retry", async () => {
  const h = harness();
  h.select(20); h.setPosition("1"); h.move();
  const proposed = h.ids();
  h.setFailure(new Error("Network"));
  await button(h.render(), "Guardar orden").props.onClick();
  assert.deepEqual(h.ids(), proposed);
  assert.equal(button(h.render(), "Guardar orden").props.disabled, false);
  assert.ok(!h.notices.some(notice => notice.startsWith("success")));
  h.setFailure(null);
  await button(h.render(), "Guardar orden").props.onClick();
  assert.deepEqual(h.ids(), proposed);
});

test("observed concurrent change prevents writes until explicit cancellation loads the fresh list", async () => {
  const h = harness();
  h.select(20); h.setPosition("1"); h.move();
  h.changeServer([...h.initial].reverse());
  await button(h.render(), "Guardar orden").props.onClick();
  assert.equal(h.writes.length, 0);
  assert.equal(button(h.render(), "Guardar orden").props.disabled, true);
  assert.equal(h.ids()[0], "Avatar 20");
  button(h.render(), "Cancelar").props.onClick();
  assert.deepEqual(h.ids(), h.server.map(item => item.label));
});

test("server's atomic 409 also preserves the proposal and requires explicit reconciliation", async () => {
  const h = harness();
  h.select(2); h.setPosition("1"); h.move();
  h.setFailure({ status: 409 });
  await button(h.render(), "Guardar orden").props.onClick();
  assert.equal(h.ids()[0], "Avatar 2");
  assert.equal(button(h.render(), "Guardar orden").props.disabled, true);
  button(h.render(), "Cancelar").props.onClick();
  assert.deepEqual(h.ids(), h.initial.map(item => item.label));
});

test("saving disables selection, another save and cancellation", async () => {
  const h = harness();
  h.select(20); h.setPosition("1"); h.move();
  let finish!: () => void;
  h.setGate(() => new Promise<void>(resolve => { finish = resolve; }));
  const pending = button(h.render(), "Guardar orden").props.onClick();
  await Promise.resolve();
  assert.equal(button(h.render(), "Guardar orden").props.disabled, true);
  assert.equal(button(h.render(), "Cancelar").props.disabled, true);
  assert.ok(elements(h.render()).filter(element => element.props.type === "checkbox").every(element => element.props.disabled));
  finish();
  await pending;
});

test("other collections retain their vertical rows and have no profile selection controls", () => {
  for (const scope of ["mix", "playlist", "reflection-story"]) {
    const h = harness(5, scope);
    assert.ok(!elements(h.render()).some(element => element.props.type === "checkbox" || element.props.role === "region"));
    assert.ok(elements(h.render()).some(element => element.props.className === "space-y-2"));
  }
});

const flush = () => new Promise(resolve => setTimeout(resolve, 0));
const pickers = (tree: unknown) => elements(tree).filter(element => element.type === "category-picker");
const manager = (tree: unknown) => find(tree, element => element.type === "category-manager");

test("single membership edit preserves unsaved order and other assignments", async () => {
  const h = harness();
  h.changeServer(h.initial.map(item => item.id === "avatar-3" ? { ...item, categoryIds: ["c2"] } as any : item));
  h.select(9); h.setPosition("1"); h.move();
  const proposed = h.ids();
  assert.equal(proposed[0], "Avatar 9");
  const picker = pickers(h.render()).find(element => element.props.label === "Avatar 3")!;
  picker.props.onToggle("c1", true); await flush();
  assert.deepEqual(h.membershipWrites[0].data, { presetIds: ["avatar-3"], categoryIds: ["c1"], mode: "add" });
  assert.deepEqual(h.ids(), proposed, "local order is not replaced by the response or refetch");
  const after = pickers(h.render()).find(element => element.props.label === "Avatar 3")!;
  assert.deepEqual(after.props.categoryIds, ["c2", "c1"]);
  assert.equal(button(h.render(), "Guardar orden").props.disabled, false);
  assert.ok(h.invalidations.some(item => JSON.stringify(item.queryKey).includes("public")));
});

test("bulk add/remove uses current selection and keeps unrelated memberships", async () => {
  const h = harness();
  h.changeServer(h.initial.map(item => ({ ...item, categoryIds: ["c2"] }) as any));
  h.select(2); h.select(4);
  manager(h.render()).props.onBulk("c1", true); await flush();
  assert.deepEqual(h.membershipWrites[0].data.presetIds.sort(), ["avatar-2", "avatar-4"]);
  assert.deepEqual((h.server[1] as any).categoryIds, ["c2", "c1"]);
  manager(h.render()).props.onBulk("c1", false); await flush();
  assert.equal(h.membershipWrites[1].data.mode, "remove");
  assert.deepEqual((h.server[1] as any).categoryIds, ["c2"]);
  assert.deepEqual(h.ids(), h.initial.map(item => item.label));
});

test("order writes are blocked while categories save", async () => {
  const h = harness();
  manager(h.render()).props.onBusyChange(true);
  assert.equal(pickers(h.render())[0].props.disabled, true);
  manager(h.render()).props.onBusyChange(false);
  h.select(1);
  const original = (h as any).membershipWrites;
  assert.equal(original.length, 0);
});
