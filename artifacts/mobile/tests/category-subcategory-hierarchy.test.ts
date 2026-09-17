import assert from "node:assert/strict";
import test from "node:test";

import {
  getCategoryEditorialTags,
  getCategorySessionTags,
  getCategoryTabs,
} from "../data/category-tabs.ts";

const baseSession = {
  id: "test",
  themeTag: [] as string[],
};

test("keeps Charlas subcategories separate from collection labels", () => {
  const session = {
    ...baseSession,
    podcastTag: "Subcategoría 1",
    themeTag: ["__category_theme_charlas__:Colección A"],
  };

  assert.deepEqual(getCategorySessionTags(session as never, "charlas"), ["Subcategoría 1"]);
  assert.deepEqual(getCategoryEditorialTags(session as never, "charlas"), ["Colección A"]);
  assert.deepEqual(getCategoryTabs([session as never], "charlas"), ["Subcategoría 1"]);
});

test("uses the dedicated subcategory field for Historias and Ambientales", () => {
  const story = {
    ...baseSession,
    sabiduriaTag: "Subcategoría 2",
    themeTag: ["__category_theme_historias__:Colección B"],
  };
  const ambiental = {
    ...baseSession,
    sonidosTag: "Subcategoría 3",
    themeTag: ["__category_theme_ambientales__:Colección C"],
  };

  assert.deepEqual(getCategorySessionTags(story as never, "historias"), ["Subcategoría 2"]);
  assert.deepEqual(getCategoryTabs([story as never], "historias"), ["Subcategoría 2"]);
  assert.deepEqual(getCategorySessionTags(ambiental as never, "ambientales"), ["Subcategoría 3"]);
  assert.deepEqual(getCategoryTabs([ambiental as never], "ambientales"), ["Subcategoría 3"]);
});