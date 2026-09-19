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
  if (categoryId === "charlas") {
    return session.podcastTag ? [session.podcastTag] : [];
  }
  if (categoryId === "historias") {
    return session.sabiduriaTag ? [session.sabiduriaTag] : [];
  }
  if (categoryId === "ambientales") {
    return session.sonidosTag ? [session.sonidosTag] : [];
  }
  return [];
}

export function getCategoryEditorialTags(
  session: Session,
  categoryId: string,
): string[] {
  const typeByCategory: Record<string, string> = {
    "musica-sonidos": "theme",
    noches: "theme",
    "meditaciones-guiadas": "category_theme_meditaciones",
    "sonidos-ancestrales": "category_theme_sonoterapia",
    charlas: "category_theme_charlas",
    historias: "category_theme_historias",
    ambientales: "category_theme_ambientales",
  };
  const categoryType = typeByCategory[categoryId];
  const prefix = categoryType === "theme" ? "" : categoryType ? `__${categoryType}__:` : "";
  const categoryThemes = categoryType === "theme"
    ? [...new Set((session.themeTag ?? []).filter((tag) => !tag.startsWith("__")))]
    : prefix
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

export type CategoryTagRouteNamespace = "legacy" | "editorial";

/**
 * Legacy category tags keep their old direct URLs even when an editorial
 * option happens to use the same visible label.
 */
export function getCategoryTagRouteNamespace(
  sessions: Session[],
  categoryId: string,
  tag: string,
  source?: "editorial",
): CategoryTagRouteNamespace {
  if (source === "editorial") return "editorial";
  return sessions.some((session) =>
    getCategorySessionTags(session, categoryId).includes(tag),
  )
    ? "legacy"
    : "legacy";
}