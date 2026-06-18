import { resolveAvatarUrl } from "@/lib/avatar";

export type Playlist = {
  id: string;
  title: string;
  description: string;
  cover: ReturnType<typeof require>;
  /** URL de portada remota (admin-uploaded). Si está presente, tiene prioridad sobre `cover`. */
  coverUrl?: string | null;
  savedCount: number;
  durationLabel: string;
  sessionIds: string[];
  playlistType?: "sessions" | "music";
};

export const PLAYLISTS: Playlist[] = [];

export function getPlaylistById(id: string): Playlist | undefined {
  return PLAYLISTS.find((p) => p.id === id);
}

// ── Snapshot remoto ────────────────────────────────────────────────────────

export type PlaylistSnapshot = {
  id: number;
  slug: string;
  title: string;
  description: string;
  coverUrl?: string | null;
  durationLabel: string;
  savedCount: number;
  sessionIds: string[];
  playlistType: string;
  sortOrder: number;
  isActive: boolean;
};

/** Fallback cover para playlists sin imagen bundleada y sin coverUrl remota. */
const FALLBACK_COVER = require("../assets/images/sessions/session-2.jpg");

/** Imágenes bundleadas indexadas por ID de sesión para usar como portada. */
const SESSION_COVER_MAP: Record<string, ReturnType<typeof require>> = {
  "1":  require("../assets/images/sessions/session-1.jpg"),
  "2":  require("../assets/images/sessions/session-2.jpg"),
  "3":  require("../assets/images/sessions/session-3-musica-dark.jpg"),
  "5":  require("../assets/images/sessions/session-5.jpg"),
  "6":  require("../assets/images/sessions/session-5-musica-dark.jpg"),
  "7":  require("../assets/images/sessions/session-7.jpg"),
  "9":  require("../assets/images/sessions/session-9.jpg"),
  "10": require("../assets/images/sessions/session-10.jpg"),
  "20": require("../assets/images/sessions/session-20.jpg"),
  "27": require("../assets/images/sessions/session-27.jpg"),
  "28": require("../assets/images/sessions/session-28.jpg"),
  "29": require("../assets/images/sessions/session-29.jpg"),
};

function resolveCover(sessionIds: string[]): ReturnType<typeof require> {
  for (const sid of sessionIds) {
    if (SESSION_COVER_MAP[sid]) return SESSION_COVER_MAP[sid];
  }
  return FALLBACK_COVER;
}

/**
 * Reemplaza PLAYLISTS con los datos del servidor.
 * El servidor solo envía las playlists marcadas showOnHome=true, ordenadas
 * por homePosition, máx 4. El array queda en ese mismo orden.
 */
export function applyPlaylistsSnapshot(snapshots: PlaylistSnapshot[]): void {
  // Reemplazar contenido in-place (conserva la referencia del array)
  PLAYLISTS.length = 0;
  for (const snap of snapshots) {
    PLAYLISTS.push({
      id: snap.slug,
      title: snap.title,
      description: snap.description,
      cover: resolveCover(snap.sessionIds),
      coverUrl: resolveAvatarUrl(snap.coverUrl ?? null),
      durationLabel: snap.durationLabel,
      savedCount: snap.savedCount,
      sessionIds: snap.sessionIds,
      playlistType: snap.playlistType as "sessions" | "music",
    });
  }
}
