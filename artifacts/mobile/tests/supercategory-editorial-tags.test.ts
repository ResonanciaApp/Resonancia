import assert from "node:assert/strict";
import test from "node:test";

import {
  collectSupercategoryEditorialTags,
  getSupercategoryEditorialTags,
  matchesSupercategoryFilter,
} from "../data/supercategory-editorial-tags.ts";

const session = {
  durationLabel: "10 min",
  themeTag: [
    "__supercategory_theme_descanso__:Opción A",
    "__supercategory_theme_sonidos__:Opción A",
    "__category_theme_sonoterapia__:Vibración",
  ],
};

test("keeps Dormir and Sonidos editorial tags isolated", () => {
  assert.deepEqual(getSupercategoryEditorialTags(session, "descanso"), ["Opción A"]);
  assert.deepEqual(getSupercategoryEditorialTags(session, "sonidos"), ["Opción A"]);
  assert.equal(
    getSupercategoryEditorialTags(session, "descanso").includes("Vibración"),
    false,
  );
});

test("combines generic duration filters with supercategory editorial filters", () => {
  assert.equal(matchesSupercategoryFilter(session, "descanso", "all"), true);
  assert.equal(matchesSupercategoryFilter(session, "descanso", "duration-5"), false);
  assert.equal(matchesSupercategoryFilter(session, "descanso", "duration-10"), true);
  assert.equal(matchesSupercategoryFilter(session, "descanso", "duration-11"), false);
  assert.equal(matchesSupercategoryFilter(session, "descanso", "editorial:Opción A"), true);
  assert.equal(matchesSupercategoryFilter(session, "descanso", "editorial:Opción B"), false);
});

test("collects each editorial label once in first-seen order", () => {
  assert.deepEqual(collectSupercategoryEditorialTags([
    session,
    { themeTag: ["__supercategory_theme_descanso__:Opción B"] },
    { themeTag: ["__supercategory_theme_descanso__:Opción A"] },
  ], "descanso"), ["Opción A", "Opción B"]);
});