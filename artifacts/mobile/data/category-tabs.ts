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
  const tags =
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

  return [...new Set(tags.filter((tag): tag is string => Boolean(tag)))];
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