export const DESCANSO_EDITORIAL_PREFIX = "__supercategory_theme_descanso__:";
export const SONIDOS_EDITORIAL_PREFIX = "__supercategory_theme_sonidos__:";

export function normalizeFeaturedSleep(
  isFeaturedSleep: boolean | null | undefined,
  descansoTags: readonly string[] | null | undefined,
): boolean {
  return isFeaturedSleep === true && (descansoTags?.length ?? 0) > 0;
}

export function normalizeSupercategoryEditorialTags({
  themeTags,
  descansoTags,
  sonidosTags,
  allowEditorialTags,
}: {
  themeTags: readonly string[] | null | undefined;
  descansoTags: readonly string[] | null | undefined;
  sonidosTags: readonly string[] | null | undefined;
  allowEditorialTags: boolean;
}): string[] {
  const hasDescansoMembership = (descansoTags?.length ?? 0) > 0;
  const hasSonidosMembership = (sonidosTags?.length ?? 0) > 0;

  return (themeTags ?? []).filter((tag) => {
    if (tag.startsWith(DESCANSO_EDITORIAL_PREFIX)) {
      return allowEditorialTags && hasDescansoMembership;
    }
    if (tag.startsWith(SONIDOS_EDITORIAL_PREFIX)) {
      return allowEditorialTags && hasSonidosMembership;
    }
    return true;
  });
}