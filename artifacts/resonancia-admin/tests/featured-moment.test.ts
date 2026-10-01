import test from "node:test";
import assert from "node:assert/strict";
import {
  resolveImageUrl,
  filterCandidates,
  resolveDeepLink,
  buildSaveInput,
  isStaleDayError,
} from "../src/lib/featured-moment.ts";

const cs = [
  { id: "a", title: "Respiración Lunar", categoryId: "c1" },
  { id: "b", title: "Sueño profundo", categoryId: "c2" },
  { id: "c", title: "Lunes en calma", categoryId: "c2" },
];

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
