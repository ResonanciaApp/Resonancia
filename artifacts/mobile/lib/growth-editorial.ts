import type { GrowthLevel } from "@/data/growthLevels";

const INTENTION_DESCRIPTION =
  "Antes del primer día hay un momento de decisión. No necesitas hacer nada todavía: solo reconocer que quieres darte un espacio de calma y volver a él, a tu ritmo.";

// Supports offline snapshots created before the detail fields were introduced.
export function growthDetailCopy(level: Pick<GrowthLevel, "id" | "story" | "detailPhrase" | "detailDescription">) {
  return {
    phrase: level.detailPhrase ?? level.story,
    description: level.detailDescription ?? (level.id === "intencion" ? INTENTION_DESCRIPTION : ""),
  };
}
