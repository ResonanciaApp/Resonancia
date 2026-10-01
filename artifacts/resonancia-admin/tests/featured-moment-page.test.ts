import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import React from "react";
import ts from "typescript";
import * as helpers from "../src/lib/featured-moment.ts";

const compiled = ts.transpileModule(
  readFileSync(new URL("../src/pages/para-este-momento.tsx", import.meta.url), "utf8"),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React } },
).outputText;

function fixture() {
  const candidates = [
    { id: "a", title: "Calma", categoryId: "meditaciones-guiadas", categoryLabel: "Meditaciones", durationLabel: "10 min", imageUrl: "/objects/calma.jpg" },
    { id: "b", title: "Bosque", categoryId: "ambientales", categoryLabel: "Ambientales", durationLabel: "20 min", imageUrl: null },
  ];
  return {
    date: "2026-10-01", timezone: "America/Santiago",
    nextChangeAt: "2026-10-02T03:00:00.000Z", source: "automatic",
    session: candidates[0], automaticSessionId: "a", eligibleCount: 2,
    revision: "1", manualMigrated: false, candidates,
  };
}

function harness() {
  const query = { data: fixture() as any, isLoading: false, isError: false, isFetching: false };
  const inventory = {
    data: fixture().candidates.map(c => ({ ...c, status: "published", isPlaceholder: false })) as any[],
    isLoading: false, isError: false, isFetching: false,
    refetch: () => Promise.resolve(),
  };
  const taxonomy = {
    data: { categories: [
      { id: "meditaciones-guiadas", label: "Meditaciones" }, { id: "ambientales", label: "Ambientales" },
      { id: "historias", label: "Historias" }, { id: "charlas", label: "Reflexiones" },
    ] },
    isLoading: false, isError: false, isFetching: false, refetch: () => Promise.resolve(),
  };
  const state: unknown[] = [];
  const effects: (() => unknown)[] = [];
  const saves: { variables: any; callbacks: any }[] = [];
  const invalidations: unknown[] = [];
  const notices: string[] = [];
  let cursor = 0;
  let refreshes = 0;
  const queryClient = {
    setQueryData: (_key: unknown, response: unknown) => { query.data = response; },
    invalidateQueries: (options: unknown) => { invalidations.push(options); },
  };
  const mocks: Record<string, unknown> = {
    react: {
      useState: (initial: unknown) => {
        const index = cursor++;
        if (!(index in state)) state[index] = initial;
        return [state[index], (next: unknown) => { state[index] = next; }];
      },
      useMemo: (compute: () => unknown) => compute(),
      useEffect: (effect: () => unknown) => { effects.push(effect); },
    },
    "@tanstack/react-query": { useQueryClient: () => queryClient, useQuery: () => inventory },
    "@workspace/api-client-react": {
      useGetAdminFeaturedMoment: () => ({
        ...query, refetch: () => { refreshes++; return Promise.resolve(); },
      }),
      useSetAdminFeaturedMoment: () => ({
        isPending: false,
        mutate: (variables: unknown, callbacks: unknown) => { saves.push({ variables, callbacks }); },
      }),
      getGetAdminFeaturedMomentQueryKey: () => ["/admin/featured-moment"],
      getGetFeaturedMomentQueryKey: () => ["/catalog/featured-moment"],
      useGetSubmissionFilterOptions: () => taxonomy,
      getGetSubmissionFilterOptionsQueryKey: () => ["/catalog/submissions/filter-options"],
    },
    "@/components/ui/button": { Button: "button" },
    "@/components/ui/input": { Input: "input" },
    "@/components/ui/skeleton": { Skeleton: "div" },
    "@/lib/featured-moment": helpers,
    sonner: { toast: { success: (message: string) => { notices.push(message); } } },
    "lucide-react": Object.fromEntries(
      ["Search", "RotateCcw", "Check", "AlertTriangle", "Sun"].map((icon) => [icon, "i"]),
    ),
  };
  const module = { exports: {} as { default: () => React.ReactElement } };
  new Function("require", "module", "exports", "React", compiled)(
    (name: string) => {
      assert.ok(name in mocks, `Unexpected dependency ${name}`);
      return mocks[name];
    }, module, module.exports, React,
  );
  const render = () => {
    cursor = 0;
    effects.length = 0;
    return module.exports.default();
  };
  return { query, inventory, taxonomy, render, saves, effects, invalidations, notices, get refreshes() { return refreshes; } };
}

function elements(tree: unknown): React.ReactElement<any>[] {
  if (Array.isArray(tree)) return tree.flatMap(elements);
  if (!React.isValidElement(tree)) return [];
  const element = tree as React.ReactElement<any>;
  return [element, ...elements(element.props.children)];
}
function byId(tree: unknown, id: string): React.ReactElement<any> {
  const element = elements(tree).find((entry) => entry.props["data-testid"] === id);
  assert.ok(element, `Expected ${id}`);
  return element;
}

test("the real selector filters candidates and requires an explicit save with the displayed date", () => {
  const h = harness();
  let tree = h.render();
  assert.equal(byId(tree, "button-choose").props.disabled, true);
  byId(tree, "input-search").props.onChange({ target: { value: "bosque" } });
  tree = h.render();
  assert.equal(elements(tree).filter((e) => e.props["data-testid"]?.startsWith("option-session-")).length, 1);
  byId(tree, "option-session-b").props.onClick();
  assert.equal(h.saves.length, 0, "selecting a candidate is not itself a mutation");
  tree = h.render();
  byId(tree, "button-choose").props.onClick();
  assert.deepEqual(h.saves[0].variables, { data: { sessionId: "b", date: "2026-10-01" } });
});

test("a successful save replaces the displayed state, invalidates the public selection and clears the picker", () => {
  const h = harness();
  byId(h.render(), "option-session-b").props.onClick();
  byId(h.render(), "button-choose").props.onClick();
  const response = { ...fixture(), source: "manual", session: fixture().candidates[1], revision: "2" };
  h.saves[0].callbacks.onSuccess(response);
  const tree = h.render();
  assert.equal(byId(tree, "text-current-title").props.children, "Bosque");
  assert.equal(byId(tree, "button-choose").props.disabled, true);
  assert.ok(byId(tree, "button-auto"));
  assert.deepEqual(h.invalidations, [{ queryKey: ["/catalog/featured-moment"] }]);
  assert.deepEqual(h.notices, ["Sesión elegida para hoy"]);
});

test("category changes use the rendered filter and an eligible deep link preselects without saving", () => {
  const h = harness();
  byId(h.render(), "select-category").props.onChange({ target: { value: "ambientales" } });
  let tree = h.render();
  assert.equal(elements(tree).filter((e) => e.props["data-testid"]?.startsWith("option-session-")).length, 1);
  const original = Object.getOwnPropertyDescriptor(globalThis, "window");
  Object.defineProperty(globalThis, "window", {
    configurable: true, value: { location: { search: "?sessionId=b" } },
  });
  try {
    h.effects[1]();
    tree = h.render();
    assert.equal(byId(tree, "option-session-b").props["aria-selected"], true);
    assert.equal(byId(tree, "button-choose").props.disabled, false);
    assert.equal(h.saves.length, 0);
  } finally {
    if (original) Object.defineProperty(globalThis, "window", original);
    else delete (globalThis as any).window;
  }
});

test("a stale-day response refreshes and shows an error without silently retrying the save", () => {
  const h = harness();
  byId(h.render(), "option-session-b").props.onClick();
  byId(h.render(), "button-choose").props.onClick();
  h.saves[0].callbacks.onError({ status: 409 });
  assert.equal(h.refreshes, 1);
  assert.equal(h.saves.length, 1);
  assert.match(byId(h.render(), "text-action-error").props.children, /El día cambió/);
  assert.equal(h.notices.length, 0);
});

test("returning to automatic sends null and the same displayed editorial date", () => {
  const h = harness();
  h.query.data.source = "manual";
  byId(h.render(), "button-auto").props.onClick();
  assert.deepEqual(h.saves[0].variables, { data: { sessionId: null, date: "2026-10-01" } });
});

test("load, server-error, and zero-candidate states are distinct and inventory stays visible", () => {
  const h = harness();
  h.query.isLoading = true;
  assert.ok(byId(h.render(), "loading-para-este-momento"));
  h.query.isLoading = false;
  h.query.isError = true;
  byId(h.render(), "button-retry").props.onClick();
  assert.equal(h.refreshes, 1);
  h.query.isError = false;
  h.query.data = { ...fixture(), source: "empty", session: null, candidates: [], eligibleCount: 0 };
  assert.ok(byId(h.render(), "empty-candidates"));
  assert.equal(byId(h.render(), "option-session-a").props.disabled, true);
  assert.equal(byId(h.render(), "button-choose").props.disabled, true);
  h.inventory.data = [];
  assert.ok(byId(h.render(), "empty-inventory"));
});

test("all inventory rows appear, while incomplete sessions cannot be selected for today", () => {
  const h = harness();
  h.inventory.data.push(
    { ...fixture().candidates[0], id: "story", title: "Historia", categoryId: "historias", categoryLabel: "Historias", status: "draft", isPlaceholder: false },
    { ...fixture().candidates[0], id: "reflection", title: "Reflexión", categoryId: "charlas", categoryLabel: "Reflexiones", status: "published", isPlaceholder: true },
  );
  let tree = h.render();
  assert.equal(elements(tree).filter(e => e.props["data-testid"]?.startsWith("option-session-")).length, 4);
  assert.equal(byId(tree, "option-session-story").props.disabled, true);
  assert.equal(byId(tree, "option-session-reflection").props.disabled, true);
  assert.equal(byId(tree, "option-session-b").props.disabled, false);
  byId(tree, "select-category").props.onChange({ target: { value: "charlas" } });
  tree = h.render();
  assert.equal(elements(tree).filter(e => e.props["data-testid"]?.startsWith("option-session-")).length, 1);
  assert.ok(byId(tree, "option-session-reflection"));
  assert.equal(byId(tree, "button-choose").props.disabled, true);
  assert.equal(h.saves.length, 0);
});

test("empty Historias and Reflexiones are category options, not silently missing filters", () => {
  const h = harness();
  const options = elements(byId(h.render(), "select-category")).filter(e => e.type === "option");
  assert.deepEqual(options.find(e => e.props.value === "historias")?.props.children, ["Historias", " (", 0, ")"]);
  assert.deepEqual(options.find(e => e.props.value === "charlas")?.props.children, ["Reflexiones", " (", 0, ")"]);
  byId(h.render(), "select-category").props.onChange({ target: { value: "historias" } });
  assert.match(byId(h.render(), "empty-inventory").props.children, /todavía no tiene sesiones registradas/);
});

test("eligible Historias and active Reflexiones can be selected and saved", () => {
  for (const categoryId of ["historias", "charlas"]) {
    const h = harness();
    const candidate = { ...fixture().candidates[0], id: categoryId, categoryId };
    h.query.data.candidates.push(candidate);
    h.inventory.data.push({ ...candidate, status: "published", isPlaceholder: false });
    byId(h.render(), `option-session-${categoryId}`).props.onClick();
    byId(h.render(), "button-choose").props.onClick();
    assert.equal(h.saves[0].variables.data.sessionId, categoryId);
  }
});

test("a failed inventory or taxonomy request is explicit and cannot masquerade as an empty category", () => {
  const h = harness();
  h.inventory.isError = true;
  assert.ok(byId(h.render(), "button-retry"));
  assert.equal(elements(h.render()).some(e => e.props["data-testid"] === "select-category"), false);
  h.inventory.isError = false;
  h.taxonomy.isError = true;
  assert.ok(byId(h.render(), "button-retry"));
});

test("legacy controls are removed and quick links open the one dedicated management surface", () => {
  for (const path of ["SessionForm.tsx", "../pages/moderacion.tsx"]) {
    const source = readFileSync(new URL(`../src/components/${path}`, import.meta.url), "utf8");
    assert.doesNotMatch(source, /useSetPinnedFeatured|DestacadaDeHoy|id="isPinnedFeatured"|id="edit-featured"/);
    assert.match(source, /\/para-este-momento\?sessionId=\$\{encodeURIComponent\(/);
  }
  const app = readFileSync(new URL("../src/App.tsx", import.meta.url), "utf8");
  assert.equal((app.match(/path="\/para-este-momento"/g) ?? []).length, 2, "admin and moderator routes");
});