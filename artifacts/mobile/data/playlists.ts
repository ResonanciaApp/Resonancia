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
      cover: FALLBACK_COVER,
      coverUrl: snap.coverUrl ?? null,
      durationLabel: snap.durationLabel,
      savedCount: snap.savedCount,
      sessionIds: snap.sessionIds,
      playlistType: snap.playlistType as "sessions" | "music",
    });
  }
}
