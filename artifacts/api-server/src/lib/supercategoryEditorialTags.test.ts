import { describe, expect, it } from "vitest";

import {
  DESCANSO_EDITORIAL_PREFIX,
  SONIDOS_EDITORIAL_PREFIX,
  normalizeFeaturedSleep,
  normalizeSupercategoryEditorialTags,
} from "./supercategoryEditorialTags";

const sleepTag = `${DESCANSO_EDITORIAL_PREFIX}Opción A`;
const soundTag = `${SONIDOS_EDITORIAL_PREFIX}Opción A`;
const categoryTag = "__category_theme_sonoterapia__:Vibración";

describe("normalizeSupercategoryEditorialTags", () => {
  it("keeps each editorial family only with matching collection membership", () => {
    expect(normalizeSupercategoryEditorialTags({
      themeTags: [sleepTag, soundTag, categoryTag],
      descansoTags: ["Sonidos para dormir"],
      sonidosTags: [],
      allowEditorialTags: true,
    })).toEqual([sleepTag, categoryTag]);
  });

  it("strips reserved editorial tags from creator submissions", () => {
    expect(normalizeSupercategoryEditorialTags({
      themeTags: [sleepTag, soundTag, categoryTag],
      descansoTags: ["Sonidos para dormir"],
      sonidosTags: ["Todos los sonidos"],
      allowEditorialTags: false,
    })).toEqual([categoryTag]);
  });
});

describe("normalizeFeaturedSleep", () => {
  it.each([
    { featured: false, tags: [], expected: false },
    { featured: true, tags: [], expected: false },
    { featured: false, tags: ["Sonidos para dormir"], expected: false },
    { featured: true, tags: ["Sonidos para dormir"], expected: true },
  ])(
    "returns $expected for featured=$featured and tags=$tags",
    ({ featured, tags, expected }) => {
      expect(normalizeFeaturedSleep(featured, tags)).toBe(expected);
    },
  );

  it("turns the destination off when the last Dormir collection is removed", () => {
    expect(normalizeFeaturedSleep(true, [])).toBe(false);
  });
});