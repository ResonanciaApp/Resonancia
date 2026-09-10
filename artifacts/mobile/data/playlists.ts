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
  /** Publicaciones independientes del contenido de la playlist. */
  placements?: EditorialPlacement[];
  isActive?: boolean;
  sortOrder?: number;
  showOnHome?: boolean;
};

export type EditorialPlacement = {
  surface: "discover" | "sleep";
  sortOrder: number;
  isActive: boolean;
};

export type EditorialPlaylist = Playlist & {
  placements: EditorialPlacement[];
  isActive: boolean;
};

export const PLAYLISTS: EditorialPlaylist[] = [];
/** Compatibilidad para las superficies antiguas de Inicio. */
export const HOME_PLAYLISTS: EditorialPlaylist[] = [];

export function getPlaylistById(id: string): Playlist | undefined {
  return PLAYLISTS.find((p) => p.id === id);
}

// ── Snapshot remoto ────────────────────────────────────────────────────────

export type PlaylistSnapshot = {
  id: number | string;
  slug: string;
  title: string;
  description?: string | null;
  coverUrl?: string | null;
  durationLabel?: string | null;
  savedCount?: number;
  sessionIds?: string[];
  playlistType?: string;
  sortOrder?: number;
  isActive?: boolean;
  showOnHome?: boolean;
  homePosition?: number | null;
  placements?: EditorialPlacement[];
};

export type EditorialPlaylistDetailResponse = PlaylistSnapshot & {
  playlist?: PlaylistSnapshot;
  sessions?: unknown[];
};

export class EditorialPlaylistFetchError extends Error {
  readonly status: number;

  constructor(status: number) {
    super(`No se pudo cargar la playlist editorial (${status})`);
    this.name = "EditorialPlaylistFetchError";
    this.status = status;
  }
}

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
 * El catálogo público contiene todas las playlists activas. HOME_PLAYLISTS
 * mantiene aparte el alias legado de Inicio, limitado a cuatro entradas.
 */
export function applyPlaylistsSnapshot(
  snapshots: PlaylistSnapshot[],
  homeSnapshots?: PlaylistSnapshot[],
): void {
  // Reemplazar contenido in-place (conserva la referencia del array)
  PLAYLISTS.length = 0;
  for (const snap of snapshots) {
    if (snap.isActive === false || !snap.slug) continue;
    const placements = Array.isArray(snap.placements)
      ? snap.placements.filter(
          (placement): placement is EditorialPlacement =>
            (placement?.surface === "discover" || placement?.surface === "sleep") &&
            typeof placement.sortOrder === "number" &&
            placement.isActive !== false,
        )
      : [];
    PLAYLISTS.push({
      id: snap.slug,
      title: snap.title,
      description: snap.description ?? "",
      cover: resolveCover(snap.sessionIds ?? []),
      coverUrl: resolveAvatarUrl(snap.coverUrl ?? null),
      durationLabel: snap.durationLabel ?? "",
      savedCount: snap.savedCount ?? 0,
      sessionIds: snap.sessionIds ?? [],
      playlistType: snap.playlistType === "music" ? "music" : "sessions",
      placements,
      isActive: snap.isActive ?? true,
      sortOrder: snap.sortOrder ?? 0,
      showOnHome: snap.showOnHome,
    });
  }
  HOME_PLAYLISTS.length = 0;
  const homeSource = homeSnapshots ?? snapshots
    .filter((snapshot) => snapshot.isActive !== false && snapshot.showOnHome === true)
    .sort((a, b) => (a.homePosition ?? a.sortOrder ?? 0) - (b.homePosition ?? b.sortOrder ?? 0))
    .slice(0, 4);
  for (const home of homeSource) {
    const playlist = PLAYLISTS.find((candidate) => candidate.id === home.slug);
    if (playlist) HOME_PLAYLISTS.push(playlist);
  }
}

/**
 * Selecciones publicadas por superficie. Las posiciones pertenecen a la
 * publicación, no a las sesiones, para que una misma playlist pueda aparecer
 * en Descubrir y Dormir con órdenes distintos.
 *
 * `showOnHome` es únicamente compatibilidad con snapshots antiguos; los
 * snapshots editoriales actuales siempre usan `placements`.
 */
export function getEditorialPlaylistsForSurface(
  surface: EditorialPlacement["surface"],
): EditorialPlaylist[] {
  return PLAYLISTS
    .flatMap((playlist, playlistIndex) => {
      const placements = playlist.placements.filter(
        (placement) => placement.surface === surface && placement.isActive,
      );
      if (placements.length > 0) {
        return placements.map((placement) => ({
          playlist,
          sortOrder: placement.sortOrder,
          playlistIndex,
        }));
      }
      if (surface === "discover" && playlist.showOnHome === true) {
        return [{ playlist, sortOrder: playlist.sortOrder ?? playlistIndex, playlistIndex }];
      }
      return [];
    })
    .sort((a, b) => a.sortOrder - b.sortOrder || a.playlistIndex - b.playlistIndex)
    .map(({ playlist }) => playlist);
}

/** Convierte la respuesta del detalle en un snapshot tolerante a versiones. */
export function normalizeEditorialPlaylistResponse(
  response: EditorialPlaylistDetailResponse,
): PlaylistSnapshot {
  return response.playlist ?? response;
}

/** Endpoint de detalle editorial; se mantiene local hasta que haya codegen. */
export async function fetchEditorialPlaylist(slug: string): Promise<PlaylistSnapshot> {
  const configuredBase = (process.env.EXPO_PUBLIC_API_URL ?? "").replace(/\/+$/, "");
  const apiBase = configuredBase.endsWith("/api") ? configuredBase : `${configuredBase}/api`;
  const response = await fetch(
    `${apiBase}/catalog/playlists/${encodeURIComponent(slug)}`,
    { headers: { Accept: "application/json" } },
  );
  if (!response.ok) throw new EditorialPlaylistFetchError(response.status);
  const payload = (await response.json()) as EditorialPlaylistDetailResponse;
  return normalizeEditorialPlaylistResponse(payload);
}
