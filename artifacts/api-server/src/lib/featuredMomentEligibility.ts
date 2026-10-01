import type { CatalogAudioFile, CatalogSession } from "@workspace/db";
import { getCatalogReadiness } from "./catalogReadiness";
import { RETIRED_REFLEXIONES_ID } from "./retiredEditorialContent";

export const FEATURED_MOMENT_EXCLUDED_CATEGORY_IDS = [
  "musica-sonidos",
  RETIRED_REFLEXIONES_ID,
] as const;

export function isFeaturedMomentEligible(
  session: CatalogSession,
  audioFiles: Pick<CatalogAudioFile, "role" | "url" | "assetKey">[],
): boolean {
  if (
    session.status !== "published" ||
    session.isPlaceholder ||
    FEATURED_MOMENT_EXCLUDED_CATEGORY_IDS.includes(
      session.categoryId as (typeof FEATURED_MOMENT_EXCLUDED_CATEGORY_IDS)[number],
    )
  ) {
    return false;
  }
  const readiness = getCatalogReadiness(session, audioFiles);
  return readiness.ready && readiness.kind === "final";
}