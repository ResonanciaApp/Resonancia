import assert from "node:assert/strict";
import test from "node:test";
import { movePresetBlock, samePresetOrder, presetCatalogSignature, shufflePresets, interleavePresets } from "../src/lib/cover-preset-order.ts";

test("random order is a permutation of the same records without modifying the source", () => {
  const original = [{ id: "a", isLocked: true }, { id: "b" }, { id: "c" }];
  const shuffled = shufflePresets(original, () => 0);
  assert.deepEqual(shuffled.map(item => item.id), ["b", "c", "a"]);
  assert.deepEqual(original.map(item => item.id), ["a", "b", "c"]);
  for (const item of shuffled) assert.equal(item, original.find(row => row.id === item.id));
  assert.deepEqual(shufflePresets([]), []);
  assert.deepEqual(shufflePresets(original.slice(0, 1)), original.slice(0, 1));
});

test("interleaving rotates categories and uncategorized, then exhausts longer groups", () => {
  const records = [
    { id: "a1", categoryIds: ["a"] }, { id: "a2", categoryIds: ["a"] },
    { id: "a3", categoryIds: ["a"] }, { id: "b1", categoryIds: ["b"] },
    { id: "b2", categoryIds: ["b"] }, { id: "none", categoryIds: [] },
  ];
  const sorted = interleavePresets(records, [{ id: "a" }, { id: "b" }, { id: "empty" }]);
  assert.deepEqual(sorted.map(item => item.id), ["a1", "b1", "none", "a2", "b2", "a3"]);
  sorted.forEach(item => assert.equal(item, records.find(row => row.id === item.id)));
});

test("multiple memberships never duplicate an avatar; missing categories never lose it", () => {
  const records = [
    { id: "both", categoryIds: ["a", "b"] }, { id: "a", categoryIds: ["a"] },
    { id: "b", categoryIds: ["b"] }, { id: "orphan", categoryIds: ["deleted"] },
    { id: "none" },
  ];
  assert.deepEqual(interleavePresets(records, [{ id: "a" }, { id: "b" }]).map(item => item.id), ["both", "b", "orphan", "a", "none"]);
  assert.deepEqual(interleavePresets(records, []), records);
  assert.deepEqual(interleavePresets([], [{ id: "a" }]), []);
});

const cards = Array.from({ length: 20 }, (_, index) => ({
  id: String(index + 1), label: `Avatar ${index + 1}`, sortOrder: index,
  isLocked: index % 2 === 0, objectPath: `/objects/${index}`, updatedAt: "2026-10-07",
}));

test("non-contiguous selection moves in catalog order, not click order", () => {
  const result = movePresetBlock(cards, new Set(["9", "2", "7"]), "5");
  assert.equal(result.error, null);
  assert.deepEqual(result.presets.slice(4, 7).map(item => item.id), ["2", "7", "9"]);
  assert.deepEqual(result.presets.filter(item => !["2", "7", "9"].includes(item.id)), cards.filter(item => !["2", "7", "9"].includes(item.id)));
  assert.equal(cards[1].id, "2");
  for (const card of cards) assert.equal(result.presets.find(item => item.id === card.id), card);
});

test("ten cards moved to five occupy five to fourteen", () => {
  const result = movePresetBlock(cards, new Set(cards.slice(10).map(item => item.id)), "5");
  assert.deepEqual(result.presets.slice(4, 14), cards.slice(10));
  assert.equal(result.presets.length, cards.length);
  assert.equal(new Set(result.presets.map(item => item.id)).size, cards.length);
});

test("first and last destinations, whole catalog selection and unchanged movements", () => {
  assert.equal(movePresetBlock(cards, new Set(["20"]), "1").presets[0].id, "20");
  assert.equal(movePresetBlock(cards, new Set(["1"]), "20").presets[19].id, "1");
  assert.equal(movePresetBlock(cards, new Set(cards.map(item => item.id)), "1").changed, false);
  assert.ok(movePresetBlock(cards, new Set(cards.map(item => item.id)), "2").error);
  assert.equal(movePresetBlock(cards, new Set(["1", "2"]), "1").changed, false);
  assert.ok(samePresetOrder(cards, [...cards]));
});

test("empty selection and invalid destinations never change the input", () => {
  for (const position of ["", " ", "0", "-1", "1.5", "2e1", "Infinity", "22", "NaN"]) {
    const result = movePresetBlock(cards, new Set(["2"]), position);
    assert.ok(result.error, position);
    assert.deepEqual(result.presets, cards);
    assert.equal(result.changed, false);
  }
  assert.ok(movePresetBlock(cards, new Set(), "1").error);
  assert.ok(movePresetBlock(cards, new Set(["unknown"]), "1").error);
});

test("200 avatars retain all identities, images and locks at the last valid block destination", () => {
  const many = Array.from({ length: 200 }, (_, index) => ({ ...cards[index % 20], id: String(index), sortOrder: index }));
  const selected = new Set(many.filter((_, index) => index % 20 === 0).map(item => item.id));
  const result = movePresetBlock(many, selected, "191");
  assert.equal(result.presets.length, 200);
  assert.deepEqual(result.presets.slice(190), many.filter(item => selected.has(item.id)));
  assert.equal(new Set(result.presets.map(item => item.id)).size, 200);
  assert.ok(movePresetBlock(many, selected, "192").error);
});

test("catalog changes in order or editorial fields invalidate the saved baseline", () => {
  const original = presetCatalogSignature(cards);
  assert.equal(presetCatalogSignature(cards.map(item => ({ ...item }))), original);
  assert.notEqual(presetCatalogSignature([...cards].reverse()), original);
  assert.notEqual(presetCatalogSignature(cards.map((item, index) => index ? item : { ...item, isLocked: !item.isLocked })), original);
});
