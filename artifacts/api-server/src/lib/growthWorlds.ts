import type { GrowthStageRecord, GrowthWorldRecord } from "@workspace/db";
import { GrowthError } from "./growthRules";

// Defaults are editorial metadata, not progress or invented stages.
export const growthWorldTemplates: GrowthWorldRecord[] = [
  { id: "florecimiento", name: "Florecimiento", description: "Cultiva tu calma cada día.", coverUrl: "/api/storage/public-objects/growth/08-expansion.png" },
  { id: "ascenso", name: "El ascenso", description: "", coverUrl: "/api/growth/world-covers/ascenso" },
  { id: "iluminacion", name: "Iluminación", description: "", coverUrl: "/api/growth/world-covers/iluminacion" },
  { id: "llegada", name: "La llegada", description: "", coverUrl: "/api/growth/world-covers/llegada" },
  { id: "despertar", name: "El Gran Despertar", description: "", coverUrl: "/api/growth/world-covers/despertar" },
];

export function adoptLegacyGrowthWorlds(stages: GrowthStageRecord[]): GrowthWorldRecord[] {
  return growthWorldTemplates.slice(0, 2).map(template => ({
    ...template,
    // Snapshot the existing first-world art ONCE during migration.
    ...(template.id === "florecimiento" && stages.some(s => s.group === template.id)
      ? { coverUrl: stages.filter(s => s.group === template.id).at(-1)!.imageUrl } : {}),
  }));
}

export function validateGrowthWorlds(worlds: GrowthWorldRecord[], stages: GrowthStageRecord[]) {
  if (worlds.length > 5) throw new GrowthError(400, "El recorrido admite hasta cinco mundos");
  const ids = new Set<string>();
  for (const world of worlds) {
    if (!world.id.trim() || ids.has(world.id)) throw new GrowthError(400, "Los IDs de mundos deben ser únicos");
    if (!world.name.trim() || !world.coverUrl.trim()) throw new GrowthError(400, "Cada mundo necesita título y portada");
    ids.add(world.id);
  }
  let lastIndex = -1;
  for (const stage of stages) {
    const index = worlds.findIndex(world => world.id === stage.group);
    if (index < 0) throw new GrowthError(400, "Cada fase debe pertenecer a un mundo existente");
    if (index < lastIndex) throw new GrowthError(400, "Las fases deben seguir el orden de los mundos");
    lastIndex = index;
  }
}
