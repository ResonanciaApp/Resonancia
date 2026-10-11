import test from "node:test";
import assert from "node:assert/strict";

import {
  ALL_AVATARS,
  UNCATEGORIZED_AVATARS,
  avatarFilterLabel,
  avatarFilterOptions,
  filterAvatarsByCategory,
  padAvatarGrid,
  parseCatalogEnvelope,
  reconcileAvatarFilter,
} from "../lib/profile-avatar-categories.ts";

const preset = (id: string, sortOrder: number, categoryIds?: string[]) => ({
  id: `profile:${id}`,
  scope: "profile",
  key: id,
  label: id,
  isLocked: false,
  sortOrder,
  source: "object",
  builtinKey: null,
  objectPath: `/objects/${id}`,
  ...(categoryIds ? { categoryIds } : {}),
});
const cats = [{ id: "c1", name: "Calma" }, { id: "c2", name: "Sueño" }];

test("legacy array cache migrates to an envelope with empty categories", () => {
  const legacy = [preset("a", 0), preset("b", 1)];
  const parsed = parseCatalogEnvelope(JSON.parse(JSON.stringify(legacy)), "profile");
  assert.deepEqual(parsed, { categories: [], presets: legacy });
});

test("new envelope round-trips categories and memberships", () => {
  const envelope = { categories: cats, presets: [preset("a", 0, ["c1", "c2"]), preset("b", 1)] };
  assert.deepEqual(parseCatalogEnvelope(JSON.parse(JSON.stringify(envelope)), "profile"), envelope);
});

test("old servers without categories are accepted only without memberships", () => {
  assert.ok(parseCatalogEnvelope({ scope: "profile", presets: [preset("a", 0)] }, "profile"));
  assert.equal(parseCatalogEnvelope({ scope: "profile", presets: [preset("a", 0, ["c1"])] }, "profile"), null);
});

test("corrupt metadata never yields a replacement snapshot", () => {
  const bad: unknown[] = [
    null,
    "x",
    { categories: null, presets: [preset("a", 0)] },
    { categories: "nope", presets: [preset("a", 0)] },
    { categories: [{ id: 1, name: "x" }], presets: [preset("a", 0)] },
    { categories: [cats[0], cats[0]], presets: [preset("a", 0)] },
    { categories: cats, presets: [preset("a", 0), preset("a", 1)] },
    { categories: cats, presets: [preset("a", 0, ["c9"])] },
    { categories: cats, presets: [preset("a", 0, ["c1", "c1"])] },
    { categories: cats, presets: [{ ...preset("a", 0), categoryIds: "c1" }] },
    { categories: cats, presets: [{ ...preset("a", 0), sortOrder: "1" }] },
    { categories: cats, presets: [{ ...preset("a", 0), source: "weird" }] },
    { categories: cats, presets: [{ ...preset("a", 0), scope: "mix" }] },
    { categories: cats, presets: [{ id: "x" }] },
    [{ id: "only-id" }],
  ];
  for (const raw of bad) assert.equal(parseCatalogEnvelope(raw, "profile"), null, JSON.stringify(raw));
});

test("filter keeps editorial order, unique items, and handles Sin categoría", () => {
  const items = [
    { id: "a", categoryIds: ["c1"] },
    { id: "b", categoryIds: [] },
    { id: "c", categoryIds: ["c1", "c2"] },
    { id: "a", categoryIds: ["c1"] },
    { id: "d" },
  ];
  assert.deepEqual(filterAvatarsByCategory(items, ALL_AVATARS).map((i) => i.id), ["a", "b", "c", "d"]);
  assert.deepEqual(filterAvatarsByCategory(items, "c1").map((i) => i.id), ["a", "c"]);
  assert.deepEqual(filterAvatarsByCategory(items, "c2").map((i) => i.id), ["c"]);
  assert.deepEqual(filterAvatarsByCategory(items, UNCATEGORIZED_AVATARS).map((i) => i.id), ["b", "d"]);
  assert.deepEqual(filterAvatarsByCategory(items, "empty"), []);
});

test("filtering is pure: it never mutates items or selection data", () => {
  const items = Object.freeze([Object.freeze({ id: "a", categoryIds: Object.freeze(["c1"]) as string[] })]);
  assert.doesNotThrow(() => filterAvatarsByCategory(items, "c1"));
});

test("deleted category resets to Todos only with an authoritative catalog", () => {
  assert.equal(reconcileAvatarFilter("c9", cats, false), "c9");
  assert.equal(reconcileAvatarFilter("c9", cats, true), ALL_AVATARS);
  assert.equal(reconcileAvatarFilter("c1", cats, true), "c1");
  assert.equal(reconcileAvatarFilter(UNCATEGORIZED_AVATARS, [], true), UNCATEGORIZED_AVATARS);
});

test("labels and options list Todos, Sin categoría and named categories", () => {
  assert.deepEqual(avatarFilterOptions(cats).map((o) => o.label), ["Todos", "Sin categoría", "Calma", "Sueño"]);
  assert.equal(avatarFilterLabel("c2", cats), "Sueño");
  assert.equal(avatarFilterLabel("gone", cats), "Todos");
});

test("grid padding keeps five-column rows without fake selectable items", () => {
  const padded = padAvatarGrid([{ id: "a" }, { id: "b" }], 5);
  assert.equal(padded.length, 5);
  assert.equal(padded.filter((i) => i.placeholder).length, 3);
  assert.equal(padAvatarGrid([1, 2, 3, 4, 5].map((n) => ({ id: String(n) })), 5).length, 5);
});
