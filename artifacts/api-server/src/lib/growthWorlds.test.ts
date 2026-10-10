import { describe, expect, it } from "vitest";
import { growthSeed } from "./growthSeed";
import { adoptLegacyGrowthWorlds, growthWorldTemplates, validateGrowthWorlds } from "./growthWorlds";
import { reconcileReached, validateGrowthOrder, growthIdentity } from "./growthRules";
import { SaveGrowthCatalogBody } from "@workspace/api-zod";

describe("Mundos del recorrido", () => {
  it("adopta dos mundos sin cambiar IDs, rangos ni derechos; la portada es un snapshot independiente", () => {
    const before = structuredClone(growthSeed);
    const stages = structuredClone(growthSeed);
    stages[8].imageUrl = "/objects/editorial-cover";
    const worlds = adoptLegacyGrowthWorlds(stages);
    expect(worlds.map(w => w.id)).toEqual(["florecimiento", "ascenso"]);
    expect(worlds[0].coverUrl).toBe("/objects/editorial-cover");
    stages[8].imageUrl = "/objects/new-stage-art";
    expect(worlds[0].coverUrl).toBe("/objects/editorial-cover");
    expect(growthSeed).toEqual(before);
    expect(growthIdentity(growthSeed, reconcileReached(growthSeed, [], 16))?.id).toBe("crecimiento");
  });
  it("valida hasta cinco mundos, referencias y orden global, sin activar mundos sin fases", () => {
    const worlds = structuredClone(growthWorldTemplates);
    const next = { ...growthSeed[0], id: "iluminacion-inicio", group: "iluminacion", startDay: 113, endDay: 119, rewards: [] };
    expect(() => validateGrowthWorlds(worlds, [...growthSeed, next])).not.toThrow();
    expect(() => validateGrowthOrder([...growthSeed, next])).not.toThrow();
    expect(reconcileReached([...growthSeed, next], [], 112).some(s => s.id === next.id)).toBe(false);
    expect(reconcileReached([...growthSeed, next], [], 113).some(s => s.id === next.id)).toBe(true);
    expect(() => validateGrowthWorlds([...worlds, { ...worlds[0], id: "extra" }], growthSeed)).toThrow();
    expect(() => validateGrowthWorlds([worlds[0], worlds[0]], [])).toThrow();
    expect(() => validateGrowthWorlds(worlds, [{ ...next, group: "missing" }])).toThrow();
    expect(() => validateGrowthWorlds(worlds, [next, growthSeed[0]])).toThrow();
    expect(() => validateGrowthWorlds(worlds, [])).not.toThrow();
  });
  it("el contrato admite nuevas fases, limita los mundos y conserva clientes antiguos", () => {
    expect(SaveGrowthCatalogBody.safeParse({ revision: 1, stages: growthSeed }).success).toBe(true);
    expect(SaveGrowthCatalogBody.safeParse({ revision: 1, worlds: growthWorldTemplates, stages: [
      ...growthSeed, { ...growthSeed[0], id: "new", group: "despertar", startDay: 120, endDay: 120 },
    ] }).success).toBe(true);
    expect(SaveGrowthCatalogBody.safeParse({ revision: 1, worlds: [...growthWorldTemplates, growthWorldTemplates[0]], stages: [] }).success).toBe(false);
    expect(SaveGrowthCatalogBody.safeParse({ revision: 1, worlds: [{ ...growthWorldTemplates[0], coverUrl: "" }], stages: [] }).success).toBe(false);
  });
});
