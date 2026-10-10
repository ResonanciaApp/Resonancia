import type { GrowthStageRecord } from "@workspace/db";

export class GrowthError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export function validateGrowthOrder(stages: GrowthStageRecord[]) {
  const ids = new Set<string>();
  const rewards = new Set<string>();
  let previousEnd = -1;
  const completedGroups = new Set<string>();
  let lastGroup: string | undefined;
  for (const stage of stages) {
    if (ids.has(stage.id)) throw new GrowthError(400, "Los IDs de etapas deben ser únicos");
    ids.add(stage.id);
    if (!stage.name.trim()) throw new GrowthError(400, "Cada etapa necesita un título");
    if (stage.startDay > stage.endDay || stage.startDay <= previousEnd) {
      throw new GrowthError(400, `Revisa los días de ${stage.name}: los rangos deben estar ordenados y no superponerse`);
    }
    if (stage.group !== lastGroup) {
      if (completedGroups.has(stage.group)) throw new GrowthError(400, "Las fases de cada mundo deben quedar juntas");
      if (lastGroup) completedGroups.add(lastGroup);
      lastGroup = stage.group;
    }
    previousEnd = stage.endDay;
    for (const reward of stage.rewards) {
      if (rewards.has(reward.id)) throw new GrowthError(400, "Los IDs de candados deben ser únicos");
      if (!Number.isSafeInteger(reward.amount) || reward.amount < 1 || reward.amount > 1_000_000) {
        throw new GrowthError(400, "La cantidad debe ser un entero positivo");
      }
      rewards.add(reward.id);
    }
  }
}

export function reconcileReached(
  stages: GrowthStageRecord[],
  reached: GrowthStageRecord[],
  days: number,
): GrowthStageRecord[] {
  const result = [...reached];
  const ids = new Set(reached.map(s => s.id));
  for (const stage of stages) {
    if (stage.startDay <= days && !ids.has(stage.id)) {
      result.push(stage);
      ids.add(stage.id);
    }
  }
  return result;
}

export function growthIdentity(stages: GrowthStageRecord[], reached: GrowthStageRecord[]) {
  const best = [...reached].sort((a, b) => b.startDay - a.startDay)[0];
  // A retired stage remains an earned identity snapshot, never an invented gain.
  return best ? stages.find(s => s.id === best.id) ?? best : null;
}
