import assert from "node:assert/strict";
import test from "node:test";

import { parseCategoryTagOverlayRoute } from "../data/category-route.ts";

test("parses overlay editorial source without leaking query into the tag", () => {
  assert.deepEqual(
    parseCategoryTagOverlayRoute(
      "/category-tag/meditaciones-guiadas/Respiraci%C3%B3n?source=editorial",
    ),
    {
      categoryId: "meditaciones-guiadas",
      tag: "Respiración",
      source: "editorial",
    },
  );
});

test("keeps unmarked overlay category tags legacy", () => {
  assert.deepEqual(
    parseCategoryTagOverlayRoute("/category-tag/musica-sonidos/M%C3%BAsica%20Ambient"),
    {
      categoryId: "musica-sonidos",
      tag: "Música Ambient",
      source: undefined,
    },
  );
});