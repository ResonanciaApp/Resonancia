/**
 * Mapa de sonidos remotos del mixer (cargados desde la API).
 * Se popula en SoundsContext al init; MixerContext lo lee como fallback
 * cuando SOUND_MAP no tiene el archivo bundleado.
 *
 * Claves: sound id (ej. "viento")
 * Valores: URL de serving resuelta (ej. "/api/storage/objects/uploads/uuid.mp3")
 */
export const REMOTE_SOUND_MAP: Record<string, string> = {};

/** Convierte un objectPath del servidor a URL de serving. */
function resolveObjectUrl(objectPath: string): string {
  const base = (process.env.EXPO_PUBLIC_API_URL ?? "").replace(/\/+$/, "");
  const servingPath = objectPath.startsWith("/objects/")
    ? objectPath.replace(/^\/objects\//, "/api/storage/objects/")
    : objectPath.startsWith("/")
      ? objectPath
      : `/${objectPath}`;
  return `${base}${servingPath}`;
}

/** Popula el mapa desde la respuesta de GET /api/sounds. */
export function applyRemoteSounds(
  sounds: { id: string; objectPath: string | null }[]
) {
  for (const s of sounds) {
    if (s.objectPath) {
      REMOTE_SOUND_MAP[s.id] = resolveObjectUrl(s.objectPath);
    }
  }
}
