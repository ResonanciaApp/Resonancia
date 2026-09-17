import type { Session } from "@/data/sessions";

/**
 * Tags que alimentan las pestañas de las categorías editoriales.
 * Charlas, Historias y el resto de categorías de contenido usan los tags
 * de podcast/sabiduría/tema; Ambientales conserva sus tags de sonidos.
 */
export function getCategorySessionTags(
  session: Session,
  categoryId: string,
): string[] {
  if (categoryId === "musica-sonidos") {
    return session.soundTag ? [session.soundTag] : [];
  }
  if (categoryId === "meditaciones-guiadas") {
    return session.meditationTag ? [session.meditationTag] : [];
  }
  if (categoryId === "sonidos-ancestrales") {
    return session.ancestralTag ? [session.ancestralTag] : [];
  }
  const legacyTags =
    categoryId === "ambientales"
      ? [
          session.sonidosTag,
          ...(session.sonidosTags ?? []),
          session.soundTag,
          ...(session.temaTag ?? []),
        ]
      : [
          session.podcastTag,
          session.sabiduriaTag,
          ...(session.temaTag ?? []),
        ];

  const editorialTags = ["historias", "charlas", "ambientales"].includes(categoryId)
    ? getCategoryEditorialTags(session, categoryId)
    : [];

  return [
    ...new Set([
      ...editorialTags,
      ...legacyTags.filter((tag): tag is string => Boolean(tag)),
    ]),
  ];
}

export function getCategoryEditorialTags(
  session: Session,
  categoryId: string,
): string[] {
  const typeByCategory: Record<string, string> = {
    "meditaciones-guiadas": "category_theme_meditaciones",
    "sonidos-ancestrales": "category_theme_sonoterapia",
    charlas: "category_theme_charlas",
    historias: "category_theme_historias",
    ambientales: "category_theme_ambientales",
  };
  if (categoryId === "musica-sonidos") {
    return [...new Set((session.themeTag ?? []).filter((tag) => !tag.startsWith("__")))];
  }
  const categoryType = typeByCategory[categoryId];
  const prefix = categoryType ? `__${categoryType}__:` : "";
  const categoryThemes = prefix
    ? [...new Set((session.themeTag ?? []).filter((tag) => tag.startsWith(prefix)).map((tag) => tag.slice(prefix.length)))]
    : [];
  if (categoryThemes.length > 0) {
    return categoryThemes;
  }
  return [];
}

export function getCategoryTabs(
  sessions: Session[],
  categoryId: string,
): string[] {
  return [
    ...new Set(
      sessions.flatMap((session) =>
        getCategorySessionTags(session, categoryId),
      ),
    ),
  ];
}