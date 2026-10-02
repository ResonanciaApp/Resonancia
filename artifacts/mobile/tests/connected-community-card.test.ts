import assert from "node:assert/strict";
import test from "node:test";
import { changedDigitSlots, reconcileVisible, rotateOne } from "../components/connectedCommunityModel.ts";

const mk = (n: number) => Array.from({ length: n }, (_, i) => ({ id: `u${i}`, avatarUrl: `https://x/${i}.jpg` }));

test("caps at six, no duplicates, no phantoms", () => {
  const dup = [...mk(8), { id: "u1", avatarUrl: "https://x/dup.jpg" }, { id: "z", avatarUrl: "" }];
  const v = reconcileVisible(dup, []);
  assert.equal(v.length, 6);
  assert.equal(new Set(v.map((a) => a.id)).size, 6);
  assert.deepEqual(reconcileVisible([], v), []);
});

test("departed users disappear", () => {
  const v = reconcileVisible(mk(6), []);
  const next = reconcileVisible(mk(6).slice(2), v);
  assert.ok(next.every((a) => !["u0", "u1"].includes(a.id)));
});

test("rotateOne swaps exactly one with a non-visible user", () => {
  const v = reconcileVisible(mk(8), []);
  const r = rotateOne(mk(8), v);
  assert.equal(r.filter((a, i) => a.id !== v[i].id).length, 1);
  assert.equal(new Set(r.map((a) => a.id)).size, 6);
  assert.equal(rotateOne(mk(3), reconcileVisible(mk(3), [])).length, 3);
});

test("only changed digits flagged", () => {
  assert.deepEqual(changedDigitSlots("129", "130"), [false, true, true]);
  assert.deepEqual(changedDigitSlots("99", "100"), [true, true, true]);
});
