import type { CatalogSession, NotificationPreferences } from "@workspace/db";

const INTERNAL_EDITORIAL_TAG_PATTERN = /^__other_theme_internal:[a-z0-9-]+__:(.+)$/;

export function getInternalEditorialTagOption(value: string) {
  const match = INTERNAL_EDITORIAL_TAG_PATTERN.exec(value.trim());
  if (!match?.[1]) return null;
  return { id: value.trim(), label: match[1] };
}

export function getPublicationNotificationMatch(
  session: Pick<CatalogSession, "categoryId" | "categoryLabel" | "title" | "themeTag" | "temaTag" | "sonidosTags" | "descansoTags">,
  preference: Pick<NotificationPreferences, "selectedCategoryIds" | "selectedEditorialTags">,
) {
  const tags = new Set([
    ...(session.themeTag ?? []),
    ...(session.temaTag ?? []),
    ...session.sonidosTags,
    ...session.descansoTags,
  ]);
  const matchingEditorial = preference.selectedEditorialTags.find(
    (tag) => tags.has(tag) && getInternalEditorialTagOption(tag),
  );
  const matchesCategory =
    session.categoryId !== "reflexiones" &&
    preference.selectedCategoryIds.includes(session.categoryId);
  if (!matchingEditorial && !matchesCategory) return null;
  const label = matchingEditorial
    ? matchingEditorial.includes(":")
      ? getInternalEditorialTagOption(matchingEditorial)!.label
      : matchingEditorial
    : session.categoryLabel;
  return { label, message: `Nueva sesión de ${label}: ${session.title}` };
}