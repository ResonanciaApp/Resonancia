import { describe, it, expect } from "vitest";
import { growthSeed } from "./growthSeed";
import { validateGrowthOrder, reconcileReached, growthIdentity } from "./growthRules";
describe("Tu camino editorial y progreso", () => {
  it("precarga 17 etapas originales y cuatro candados de 5", () => {
    expect(growthSeed).toHaveLength(17);
    expect(growthSeed.filter(s => s.group === "ascenso")).toHaveLength(8);
    expect(growthSeed.flatMap(s => s.rewards).map(r => r.amount)).toEqual([5, 5, 5, 5]);
    expect(() => validateGrowthOrder(growthSeed)).not.toThrow();
  });
  it("acepta catálogos vacíos y una etapa, rechaza rangos cruzados e IDs repetidos", () => {
    expect(() => validateGrowthOrder([])).not.toThrow();
    expect(() => validateGrowthOrder(growthSeed.slice(0, 1))).not.toThrow();
    expect(() => validateGrowthOrder([growthSeed[0], growthSeed[0]])).toThrow();
    expect(() => validateGrowthOrder([{ ...growthSeed[0], endDay: 4 }, growthSeed[1]])).toThrow();
    expect(() => validateGrowthOrder([growthSeed[9], { ...growthSeed[0], startDay: 100, endDay: 101 }])).toThrow();
  });
  it("usa el día inicial, conserva avances al cortar la racha y soporta el último nivel", () => {
    const reached = reconcileReached(growthSeed, [], 15);
    expect(growthIdentity(growthSeed, reached)?.id).toBe("crecimiento");
    expect(growthIdentity(growthSeed, reconcileReached(growthSeed, reached, 0))?.id).toBe("crecimiento");
    expect(growthIdentity(growthSeed, reconcileReached(growthSeed, [], 500))?.id).toBe("ascenso-trascendencia");
  });
  it("retirar una etapa conserva el snapshot ganado sin inventar otra", () => {
    const reached = reconcileReached(growthSeed, [], 1);
    expect(growthIdentity([], reached)?.id).toBe("semilla");
    expect(growthIdentity([], [])).toBeNull();
  });
});
