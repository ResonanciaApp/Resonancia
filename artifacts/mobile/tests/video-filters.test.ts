import assert from "node:assert/strict";
import test from "node:test";

import {
  ALL_VIDEOS_FILTER_ID,
  getVideoFilterChips,
  matchesVideoFilter,
} from "../lib/video-filters.ts";

test("builds tabs from assigned video themes without empty or duplicate labels", () => {
  const videos = [
    { theme: "Movimiento" },
    { theme: "  Respiración  " },
    { theme: "movimiento" },
    { theme: null },
    { theme: " " },
  ];

  assert.deepEqual(getVideoFilterChips(videos), [
    { id: ALL_VIDEOS_FILTER_ID, label: "Todos" },
    { id: "theme:movimiento", label: "Movimiento" },
    { id: "theme:respiración", label: "Respiración" },
  ]);
});

test("filters video themes after normalizing whitespace and letter case", () => {
  assert.equal(matchesVideoFilter({ theme: " Movimiento " }, "theme:movimiento"), true);
  assert.equal(matchesVideoFilter({ theme: "Música" }, "theme:naturaleza"), false);
  assert.equal(matchesVideoFilter({ theme: null }, ALL_VIDEOS_FILTER_ID), true);
});

test("keeps the system all-filter distinct and stable across label casing changes", () => {
  const first = getVideoFilterChips([{ theme: "Movimiento" }, { theme: "Todos" }]);
  const renamedCase = getVideoFilterChips([{ theme: "movimiento" }]);

  assert.deepEqual(first, [
    { id: ALL_VIDEOS_FILTER_ID, label: "Todos" },
    { id: "theme:movimiento", label: "Movimiento" },
  ]);
  assert.equal(
    renamedCase.some((filter) => filter.id === "theme:movimiento"),
    true,
  );
});

test("deduplicates visually identical composed and decomposed Unicode labels", () => {
  assert.deepEqual(
    getVideoFilterChips([{ theme: "Música" }, { theme: "Mu\u0301sica" }]),
    [
      { id: ALL_VIDEOS_FILTER_ID, label: "Todos" },
      { id: "theme:música", label: "Música" },
    ],
  );
});