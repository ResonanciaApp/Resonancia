import type { GrowthWorld, GrowthReward, GrowthStage } from "@workspace/api-client-react";
export type WorldLike = GrowthWorld;
export type RewardLike = GrowthReward;
export type StageLike = GrowthStage;

export const MAX_WORLDS = 5;

export const LEGACY_WORLDS: WorldLike[] = [
  { id: "florecimiento", name: "Florecimiento", description: "Cultiva tu calma cada día.", coverUrl: "/api/storage/public-objects/growth/08-expansion.png" },
  { id: "ascenso", name: "El ascenso", description: "", coverUrl: "/api/growth/world-covers/ascenso" },
];

export const WORLD_TEMPLATES: WorldLike[] = [
  { id: "iluminacion", name: "Iluminación", description: "", coverUrl: "/api/growth/world-covers/iluminacion" },
  { id: "llegada", name: "La llegada", description: "", coverUrl: "/api/growth/world-covers/llegada" },
  { id: "despertar", name: "El Gran Despertar", description: "", coverUrl: "/api/growth/world-covers/despertar" },
];

export function resolveWorlds(data: { worlds?: WorldLike[] | null; stages: StageLike[] }): WorldLike[] {
  if (Array.isArray(data.worlds)) return data.worlds;
  return LEGACY_WORLDS.map(world => ({
    ...world,
    ...(world.id === "florecimiento" && data.stages.some(s => s.group === world.id)
      ? { coverUrl: data.stages.filter(s => s.group === world.id).at(-1)!.imageUrl || world.coverUrl } : {}),
  }));
}

export function addWorld(worlds: WorldLike[]): WorldLike[] {
  if (worlds.length >= MAX_WORLDS) return worlds;
  const tpl = [...LEGACY_WORLDS, ...WORLD_TEMPLATES].find((t) => !worlds.some((w) => w.id === t.id));
  if (!tpl) return worlds;
  return [...worlds, { ...tpl }];
}

export function orderStages(worlds: WorldLike[], stages: StageLike[]): StageLike[] {
  const known = new Set(worlds.map((w) => w.id));
  return [...worlds.flatMap((w) => stages.filter((s) => s.group === w.id)), ...stages.filter((s) => !known.has(s.group))];
}

export function newStage(stages: StageLike[], group: string, id: string, worlds?: WorldLike[]): StageLike[] {
  const last = stages.filter((x) => x.group === group).at(-1);
  const before = worlds ? new Set(worlds.slice(0, worlds.findIndex(w => w.id === group)).map(w => w.id)) : null;
  const previous = stages.filter(s => before === null || before.has(s.group));
  const start = last ? last.endDay + 1 : Math.max(-1, ...previous.map(s => s.endDay)) + 1;
  return [...stages, { id, group, name: "", startDay: start, endDay: start, story: "", detailPhrase: "", detailDescription: "", imageUrl: "", rewards: [] }];
}

export function moveStage(all: StageLike[], id: string, dir: -1 | 1): StageLike[] {
  const s = all.find((x) => x.id === id);
  if (!s) return all;
  const sib = all.filter((x) => x.group === s.group);
  const i = sib.findIndex((x) => x.id === id);
  const j = i + dir;
  if (j < 0 || j >= sib.length) return all;
  const next = [...sib];
  [next[i], next[j]] = [next[j], next[i]];
  let k = 0;
  return all.map((x) => (x.group === s.group ? next[k++] : x));
}

export function validateWorlds(worlds: WorldLike[]): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  const add = (id: string, m: string) => (out[id] ??= []).push(m);
  if (worlds.length > MAX_WORLDS) add("_", `Máximo ${MAX_WORLDS} mundos.`);
  const ids = new Set<string>();
  for (const w of worlds) {
    if (!w.id.trim() || ids.has(w.id)) add(w.id, "Los IDs de mundos deben ser únicos.");
    ids.add(w.id);
    if (!w.name.trim()) add(w.id, "Falta el título del mundo.");
    if (w.name.length > 100) add(w.id, "Título: máximo 100 caracteres.");
    if (w.description.length > 2000) add(w.id, "Descripción: máximo 2.000 caracteres.");
    if (!w.coverUrl) add(w.id, "Falta la portada del mundo.");
  }
  return out;
}

export function validate(worlds: WorldLike[], stages: StageLike[]): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  const add = (id: string, m: string) => (out[id] ??= []).push(m);
  let prevEnd = -1;
  for (const s of orderStages(worlds, stages)) {
    if (!worlds.some(w => w.id === s.group)) add(s.id, "La fase debe pertenecer a un mundo existente.");
    if (!s.name.trim()) add(s.id, "Falta el nombre.");
    if ((s.detailPhrase?.length ?? 0) > 2000) add(s.id, "Frase del detalle: máximo 2.000 caracteres.");
    if ((s.detailDescription?.length ?? 0) > 10000) add(s.id, "Descripción larga del detalle: máximo 10.000 caracteres.");
    if (!s.imageUrl) add(s.id, "Falta la imagen.");
    if (!Number.isInteger(s.startDay) || !Number.isInteger(s.endDay) || s.startDay < 0) add(s.id, "Los días deben ser enteros desde 0.");
    else if (s.endDay < s.startDay) add(s.id, "El día final no puede ser menor al inicial.");
    else if (s.startDay <= prevEnd) add(s.id, `Se superpone o está fuera de orden (la etapa anterior termina el día ${prevEnd}).`);
    if (Number.isInteger(s.endDay)) prevEnd = Math.max(prevEnd, s.endDay);
    s.rewards.forEach((r, i) => {
      if (!Number.isInteger(r.amount) || r.amount < 1 || r.amount > 1000000) add(s.id, `Recompensa ${i + 1}: la cantidad debe ser un entero positivo hasta 1.000.000.`);
      if (r.text.length > 240) add(s.id, `Recompensa ${i + 1}: máximo 240 caracteres.`);
    });
  }
  for (const [k, v] of Object.entries(validateWorlds(worlds))) out[k] = [...(out[k] ?? []), ...v];
  return out;
}
