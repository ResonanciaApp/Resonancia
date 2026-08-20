import type { CatalogAudioFile, CatalogSession } from "@workspace/db";

// Debe mantenerse en sincronía con mobile/config/bundled-audio-manifest.ts.
// El servidor no puede importar fuentes de un artifact fuera de su rootDir.
const SERVER_BUNDLED_AUDIO_SESSION_IDS = new Set([
  "1",
  "20",
  "21",
  "22",
  "27",
  "28",
  "29",
  "30",
]);

export type CatalogReadiness =
  | { ready: true; kind: "final" | "placeholder" }
  | { ready: false; kind: "invalid"; reason: string };

/**
 * Decide si una sesión puede exponerse al público.
 *
 * Un placeholder es una decisión editorial explícita y se permite sin audio;
 * una sesión final debe incluir al menos una pista principal o base resoluble.
 * Esta función no comprueba los bytes: storage valida el upload y la ruta de
 * publicación comprueba su propiedad antes de hacerla pública.
 */
export function getCatalogReadiness(
  session: Pick<
    CatalogSession,
    "id" | "title" | "subtitle" | "categoryId" | "categoryLabel" | "duration" | "description" | "isPlaceholder"
  >,
  audioFiles: Pick<CatalogAudioFile, "role" | "url" | "assetKey">[],
): CatalogReadiness {
  if (
    !session.title.trim() ||
    !session.subtitle.trim() ||
    !session.categoryId.trim() ||
    !session.categoryLabel.trim() ||
    !session.description.trim() ||
    session.duration < 1
  ) {
    return {
      ready: false,
      kind: "invalid",
      reason: "Faltan datos esenciales de la sesión",
    };
  }

  if (session.isPlaceholder) {
    return { ready: true, kind: "placeholder" };
  }

  const hasMainAudio = audioFiles.some((audio) => {
    if (audio.role !== "main" && audio.role !== "base") return false;
    const remoteUrl = audio.url?.trim() ?? "";
    const isRemote =
      remoteUrl.startsWith("/objects/") || /^https?:\/\//i.test(remoteUrl);
    // El cliente resuelve bundles por session.id mediante AUDIO_MAP. El marker
    // evita que cualquier assetKey arbitrario se confunda con un archivo real.
    const isKnownBundle =
      audio.assetKey === `bundle:${session.id}` &&
      SERVER_BUNDLED_AUDIO_SESSION_IDS.has(session.id);
    return isRemote || isKnownBundle;
  });
  if (!hasMainAudio) {
    return {
      ready: false,
      kind: "invalid",
      reason:
        "Una sesión final necesita un audio principal o base con ruta válida. Marcala como “próximamente” si todavía no está lista.",
    };
  }

  return { ready: true, kind: "final" };
}