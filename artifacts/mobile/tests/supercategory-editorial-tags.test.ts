import assert from "node:assert/strict";
import test from "node:test";

import {
  collectSupercategoryEditorialTags,
  getSupercategoryFilterTabs,
  getSupercategoryEditorialTags,
  matchesSupercategoryFilter,
  shouldShowSupercategoryFilterTabs,
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

test("builds Dormir tabs with duration filters", () => {
  assert.deepEqual(
    getSupercategoryFilterTabs(["Opción A"], true).map((tab) => tab.label),
    ["Ver todo", "5 min", "10 min", "11+ min", "Opción A"],
  );
});

test("builds Sonidos tabs without duration filters", () => {
  assert.deepEqual(
    getSupercategoryFilterTabs(["Opción A", "Opción B"], false).map((tab) => tab.label),
    ["Ver todo", "Opción A", "Opción B"],
  );
});

test("hides the Sonidos tab bar until an editorial tag is available", () => {
  assert.equal(shouldShowSupercategoryFilterTabs([], true), false);
  assert.equal(shouldShowSupercategoryFilterTabs(["Opción A"], true), true);
  assert.equal(shouldShowSupercategoryFilterTabs([], false), true);
});