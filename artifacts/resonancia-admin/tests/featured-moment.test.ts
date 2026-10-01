import test from "node:test";
import assert from "node:assert/strict";
import {
  resolveImageUrl,
  filterCandidates,
  resolveDeepLink,
  buildSaveInput,
  isStaleDayError,
  loadSessionInventory,
  inventoryCategories,
  ineligibleReason,
} from "../src/lib/featured-moment.ts";

const cs = [
  { id: "a", title: "Respiración Lunar", categoryId: "c1" },
  { id: "b", title: "Sueño profundo", categoryId: "c2" },
  { id: "c", title: "Lunes en calma", categoryId: "c2" },
];

test("inventory loads every page, including sessions after the first hundred", async () => {
  const records = Array.from({ length: 205 }, (_, index) => ({
    id: String(index), title: `Sesión ${index}`, categoryId: index > 199 ? "historias" : "charlas",
  }));
  const calls: number[] = [];
  const result = await loadSessionInventory(async ({ page, pageSize }) => {
    calls.push(page);
    assert.equal(pageSize, 100);
    return { total: records.length, sessions: records.slice((page - 1) * pageSize, page * pageSize) };
  });
  assert.deepEqual(result, records);
  assert.deepEqual(calls, [1, 2, 3]);
});

test("inventory failures and partial or shifting pagination do not become an empty success", async () => {
  await assert.rejects(loadSessionInventory(async () => { throw new Error("API caída"); }), /API caída/);
  await assert.rejects(loadSessionInventory(async () => ({ total: 2, sessions: [cs[0]] })), /catálogo cambió/);
  await assert.rejects(loadSessionInventory(async () => ({ total: 2, sessions: [cs[0], cs[0]] })), /catálogo cambió/);
  await assert.rejects(loadSessionInventory(async ({ page }) => ({
    total: page === 1 ? 101 : 102,
    sessions: page === 1
      ? Array.from({ length: 100 }, (_, i) => ({ ...cs[0], id: String(i) }))
      : [{ ...cs[0], id: "100" }],
  })), /catálogo cambió/);
});

test("taxonomy retains empty Historias and active Reflexiones, separate from legacy records", () => {
  const categories = inventoryCategories([
    { ...cs[0], categoryId: "reflexiones", categoryLabel: "Reflexiones" },
    { ...cs[1], categoryId: "descanso", categoryLabel: "Dormir" },
  ], [{ id: "historias", label: "Historias" }, { id: "charlas", label: "Reflexiones" }]);
  assert.deepEqual(categories, [
    { id: "historias", label: "Historias", count: 0 },
    { id: "charlas", label: "Reflexiones", count: 0 },
    { id: "reflexiones", label: "Reflexiones (categoría anterior)", count: 1 },
    { id: "descanso", label: "Dormir", count: 1 },
  ]);
});

test("ineligible records stay visible with reasons; ready Historias and Reflexiones remain selectable", () => {
  const session = { ...cs[0], status: "published", isPlaceholder: false };
  assert.equal(ineligibleReason({ ...session, categoryId: "historias" }, new Set(["a"])), null);
  assert.equal(ineligibleReason({ ...session, categoryId: "charlas" }, new Set(["a"])), null);
  assert.match(ineligibleReason({ ...session, status: "draft" }, new Set())!, /publicación/);
  assert.match(ineligibleReason({ ...session, isPlaceholder: true }, new Set())!, /Próximamente/);
  assert.match(ineligibleReason(session, new Set())!, /audio/);
  assert.match(ineligibleReason({ ...session, categoryId: "musica-sonidos" }, new Set())!, /Música/);
  assert.match(ineligibleReason({ ...session, categoryId: "reflexiones" }, new Set())!, /anterior/);
});

test("resolveImageUrl proxies object paths", () => {
  assert.equal(resolveImageUrl("/objects/x.png"), "/api/storage/objects/x.png");
  assert.equal(resolveImageUrl("https://a/b.png"), "https://a/b.png");
  assert.equal(resolveImageUrl(null), null);
  assert.equal(resolveImageUrl(""), null);
});

test("filter by search and category", () => {
  assert.deepEqual(filterCandidates(cs, "lun", "all").map((c) => c.id), ["a", "c"]);
  assert.deepEqual(filterCandidates(cs, "lun", "c2").map((c) => c.id), ["c"]);
  assert.deepEqual(filterCandidates(cs, "  ", "c1").map((c) => c.id), ["a"]);
  assert.equal(filterCandidates(cs, "zzz", "all").length, 0);
});

test("deep link preselects only eligible", () => {
  assert.deepEqual(resolveDeepLink("?sessionId=b", cs), { kind: "selected", id: "b" });
  assert.deepEqual(resolveDeepLink("?sessionId=nope", cs), { kind: "ineligible" });
  assert.deepEqual(resolveDeepLink("", cs), { kind: "none" });
});

test("save input carries seen date and id or null", () => {
  assert.deepEqual(buildSaveInput("2025-01-02", "a"), { sessionId: "a", date: "2025-01-02" });
  assert.deepEqual(buildSaveInput("2025-01-02", null), { sessionId: null, date: "2025-01-02" });
});

test("409 detection", () => {
  assert.equal(isStaleDayError({ status: 409 }), true);
  assert.equal(isStaleDayError({ status: 500 }), false);
  assert.equal(isStaleDayError(null), false);
});
