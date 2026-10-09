import type { GrowthStageRecord } from "@workspace/db";

const INTENTION_DESCRIPTION =
  "Antes del primer día hay un momento de decisión. No necesitas hacer nada todavía: solo reconocer que quieres darte un espacio de calma y volver a él, a tu ritmo.";

// Missing fields adopt the legacy content once; explicit empty strings are deletions.
// Old clients must not erase an editor's existing detail when saving the catalog.
export function adoptGrowthEditorial(stage: GrowthStageRecord, previous?: GrowthStageRecord): GrowthStageRecord {
  return {
    ...stage,
    detailPhrase: stage.detailPhrase ?? previous?.detailPhrase ?? previous?.story ?? stage.story,
    detailDescription: stage.detailDescription ?? previous?.detailDescription
      ?? (stage.id === "intencion" ? INTENTION_DESCRIPTION : ""),
  };
}
