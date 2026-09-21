import assert from "node:assert/strict";
import test from "node:test";
import {
  normalizeCatalogSnapshot,
  parseSoundCatalogResponse,
} from "../lib/sound-catalog-snapshot.ts";

const legacySounds = [
  { id: "rain", categoryId: "bosque" },
  { id: "waves", categoryId: "mar" },
  { id: "more-rain", categoryId: "bosque" },
];

test("derives unique text tabs from a legacy array cache", () => {
  const snapshot = normalizeCatalogSnapshot({ sounds: legacySounds });
  assert.deepEqual(
    snapshot.categories.map(({ id, label, sortOrder }) => ({ id, label, sortOrder })),
    [
      { id: "bosque", label: "Bosque", sortOrder: 0 },
      { id: "mar", label: "Mar", sortOrder: 1 },
    ],
  );
});

test("derives categories from an old API response without category metadata", () => {
  const snapshot = parseSoundCatalogResponse<{ id: string; categoryId: string }>({
    sounds: legacySounds,
  });
  assert.deepEqual(snapshot?.categories.map((category) => category.id), ["bosque", "mar"]);
});

test("preserves an explicitly empty canonical category list", () => {
  const snapshot = parseSoundCatalogResponse<{ id: string; categoryId: string }>({
    sounds: legacySounds,
    categories: [],
  });
  assert.deepEqual(snapshot?.categories, []);
});

test("rejects malformed responses without a sounds array", () => {
  assert.equal(parseSoundCatalogResponse({ categories: [] }), null);
  assert.equal(parseSoundCatalogResponse({ sounds: "invalid" }), null);
  assert.equal(parseSoundCatalogResponse(null), null);
});