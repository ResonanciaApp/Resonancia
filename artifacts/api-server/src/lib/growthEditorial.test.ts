import { describe, it, expect } from "vitest";
import { SaveGrowthCatalogBody } from "@workspace/api-zod";
import { adoptGrowthEditorial } from "./growthEditorial";
import { growthSeed } from "./growthSeed";

describe("growth detail editorial compatibility", () => {
  it("adopts legacy phrases and only the existing Intención explanation", () => {
    const adopted = growthSeed.map(stage => adoptGrowthEditorial(stage));
    expect(adopted.every((stage, i) => stage.detailPhrase === growthSeed[i].story)).toBe(true);
    expect(adopted.find(s => s.id === "intencion")?.detailDescription).toContain("Antes del primer día");
    expect(adopted.filter(s => s.id !== "intencion").every(s => s.detailDescription === "")).toBe(true);
    expect(adopted.map(stage => adoptGrowthEditorial(stage))).toEqual(adopted);
  });
  it("explicit deletions survive adoption, while old-client omissions retain saved detail", () => {
    const original = growthSeed[0];
    const saved = { ...original, detailPhrase: "Mi frase", detailDescription: "Descripción larga" };
    expect(adoptGrowthEditorial({ ...original, story: "Cambio de recorrido" }, saved)).toMatchObject({
      detailPhrase: "Mi frase", detailDescription: "Descripción larga", story: "Cambio de recorrido",
    });
    expect(adoptGrowthEditorial({ ...original, detailPhrase: "", detailDescription: "" }, saved)).toMatchObject({
      detailPhrase: "", detailDescription: "",
    });
    expect(saved.detailPhrase).toBe("Mi frase");
  });
  it("accepts old catalogs, new multiline detail, and explicit empty strings", () => {
    for (const extra of [{}, { detailPhrase: "", detailDescription: "" }, {
      detailPhrase: "Frase\nsegunda línea", detailDescription: "Párrafo uno.\n\nPárrafo dos.",
    }]) {
      const parsed = SaveGrowthCatalogBody.safeParse({ revision: 1, stages: [{ ...growthSeed[0], ...extra }] });
      expect(parsed.success).toBe(true);
      if (parsed.success) expect(parsed.data.stages[0]).toMatchObject(extra);
    }
  });
  it("enforces the same phrase and long-description limits as Admin", () => {
    expect(SaveGrowthCatalogBody.safeParse({ revision: 1, stages: [{
      ...growthSeed[0], detailPhrase: "a".repeat(2000), detailDescription: "b".repeat(10000),
    }] }).success).toBe(true);
    for (const extra of [{ detailPhrase: "a".repeat(2001) }, { detailDescription: "b".repeat(10001) }]) {
      expect(SaveGrowthCatalogBody.safeParse({ revision: 1, stages: [{ ...growthSeed[0], ...extra }] }).success).toBe(false);
    }
  });
  it("editorial edits leave the stage identity, ranges, rewards and order intact", () => {
    const input = growthSeed.map(stage => ({
      ...stage, detailPhrase: "Editada", detailDescription: "Texto largo",
    }));
    const adopted = input.map(stage => adoptGrowthEditorial(stage));
    expect(adopted.map(({ detailPhrase, detailDescription, ...stage }) => stage)).toEqual(growthSeed);
  });
});
