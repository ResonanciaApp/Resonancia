import type { GrowthStage, GrowthWorld } from "@workspace/api-client-react";

export const GROWTH_WORLD_TEMPLATES: GrowthWorld[] = [
  { id: "florecimiento", name: "Florecimiento", description: "Cultiva tu calma cada día.", coverUrl: "/api/storage/public-objects/growth/08-expansion.png" },
  { id: "ascenso", name: "El ascenso", description: "", coverUrl: "/api/growth/world-covers/ascenso" },
  { id: "iluminacion", name: "Iluminación", description: "", coverUrl: "/api/growth/world-covers/iluminacion" },
  { id: "llegada", name: "La llegada", description: "", coverUrl: "/api/growth/world-covers/llegada" },
  { id: "despertar", name: "El Gran Despertar", description: "", coverUrl: "/api/growth/world-covers/despertar" },
];

export const INITIAL_GROWTH_WORLDS = GROWTH_WORLD_TEMPLATES.slice(0, 2);
export const GROWTH_WORLD_LABELS = ["PRIMER MUNDO", "SEGUNDO MUNDO", "TERCER MUNDO", "CUARTO MUNDO", "QUINTO MUNDO"];

// v1 caches predate world metadata. Explicit [] must never resurrect old worlds.
export function normalizeGrowthWorlds(catalog: { worlds?: GrowthWorld[]; stages: GrowthStage[] }): GrowthWorld[] {
  if (Array.isArray(catalog.worlds)) return catalog.worlds;
  return INITIAL_GROWTH_WORLDS.map(world => ({
    ...world,
    ...(world.id === "florecimiento" && catalog.stages.some(s => s.group === world.id)
      ? { coverUrl: catalog.stages.filter(s => s.group === world.id).at(-1)!.imageUrl || world.coverUrl } : {}),
  }));
}

export function visibleGrowthWorlds(
  worlds: GrowthWorld[], stages: { group?: string; startDay: number }[], totalActiveDays: number,
) {
  const configured = worlds.filter(world => stages.some(stage => stage.group === world.id));
  if (!configured.length) return [];
  const days = Number.isFinite(totalActiveDays) ? Math.max(0, totalActiveDays) : 0;
  let current = 0;
  configured.forEach((world, index) => {
    if (stages.some(stage => stage.group === world.id && stage.startDay <= days)) current = index;
  });
  return configured.slice(0, current + 2).map((world, index) => ({
    world, index: worlds.findIndex(w => w.id === world.id), upcoming: index > current,
  }));
}
