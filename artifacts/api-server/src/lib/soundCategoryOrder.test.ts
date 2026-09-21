import { describe, expect, it } from "vitest";
import { reorderSoundCategories } from "./soundCategoryOrder";

const categories = [
  { id: "bosque", sortOrder: 8 },
  { id: "mar", sortOrder: 8 },
  { id: "fuego", sortOrder: 30 },
];

describe("mixer sound category ordering", () => {
  it("reorders by position even when stored orders are duplicate or gapped", () => {
    const reordered = reorderSoundCategories(categories, "fuego", 1);
    expect(reordered?.map((category) => category.id)).toEqual(["bosque", "fuego", "mar"]);
    expect(reordered?.map((_, index) => index)).toEqual([0, 1, 2]);
  });

  it("clamps positions and leaves unknown IDs untouched", () => {
    expect(reorderSoundCategories(categories, "bosque", 99)?.map((category) => category.id))
      .toEqual(["mar", "fuego", "bosque"]);
    expect(reorderSoundCategories(categories, "missing", 0)).toBeNull();
  });
});