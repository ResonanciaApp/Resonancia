import { describe, expect, it } from "vitest";
import { normalizeSearchTrendTerm } from "./search-trends";

describe("normalizeSearchTrendTerm", () => {
  it("normaliza acentos, mayúsculas y espacios sin retener la forma original", () => {
    expect(normalizeSearchTrendTerm("  SUEÑO   Profúndo  ")).toBe("sueno profundo");
  });

  it("rechaza texto vacío, puntuación y términos más largos que el límite agregado", () => {
    expect(normalizeSearchTrendTerm("   ")).toBeNull();
    expect(normalizeSearchTrendTerm("lluvia!")).toBeNull();
    expect(normalizeSearchTrendTerm("a".repeat(81))).toBeNull();
  });
});