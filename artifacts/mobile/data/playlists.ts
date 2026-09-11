import { resolveAvatarUrl } from "@/lib/avatar";
import {
  buildLegacyPlaylistCarouselRecords,
  resolvePlaylistCarouselRows,
  type PlaylistCarouselRecord,
  type PlaylistCarouselSurface,
  type SleepCarouselOrderItem,
} from "@/lib/editorial-playlist-helpers";

export type {
  PlaylistCarouselRecord,
  PlaylistCarouselSurface,
  SleepCarouselOrderItem,
} from "@/lib/editorial-playlist-helpers";

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
  editorialType: "meditative" | "relaxation" | "ritual" | "none";
  /** Publicaciones independientes del contenido de la playlist. */
  placements?: EditorialPlacement[];
  isActive?: boolean;
  sortOrder?: number;
  showOnHome?: boolean;
};

export type EditorialPlacement = {
  surface: PlaylistCarouselSurface;
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
/**
 * Public carousel definitions.  This is deliberately separate from
 * HOME_PLAYLISTS: a home placement is not a publication to Descubrir or
 * Dormir, and must never make a hidden carousel reappear.
 */
export const PLAYLIST_CAROUSELS: PlaylistCarouselRecord[] = [];
/** Last valid server publication for the interleaved Dormir surface. */
export let SLEEP_CAROUSEL_ORDER: SleepCarouselOrderItem[] | undefined;

export function applySleepCarouselOrder(input: unknown): void {
  if (!Array.isArray(input)) return;
  const valid = input.map((candidate) => {
    if (!candidate || typeof candidate !== "object") return null;
    const row = candidate as Partial<SleepCarouselOrderItem>;
    if (
      typeof row.key !== "string" ||
      typeof row.label !== "string" ||
      (row.type !== "session" && row.type !== "playlist") ||
      typeof row.visible !== "boolean" ||
      typeof row.sortOrder !== "number" ||
      !Number.isFinite(row.sortOrder)
    ) return null;
    return [{ key: row.key, label: row.label, type: row.type, visible: row.visible, sortOrder: row.sortOrder }];
  });
  if (valid.some((row) => row === null)) return;
  // An explicit [] is valid and authoritative.
  SLEEP_CAROUSEL_ORDER = valid.flat() as SleepCarouselOrderItem[];
}

export type PlaylistCarouselSnapshot = PlaylistCarouselRecord;

export type EditorialPlaylistCarousel = PlaylistCarouselRecord & {
  playlists: EditorialPlaylist[];
};

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
  editorialType?: string;
  sortOrder?: number;
  isActive?: boolean;
  showOnHome?: boolean;
  homePosition?: number | null;
  placements?: EditorialPlacement[];
};

function normalizePlaylistCarousels(input: unknown): PlaylistCarouselSnapshot[] {
  if (!Array.isArray(input)) return [];
  return input.flatMap((candidate) => {
    if (!candidate || typeof candidate !== "object") return [];
    const raw = candidate as Partial<PlaylistCarouselSnapshot>;
    if (
      typeof raw.id !== "number" ||
      !Number.isFinite(raw.id) ||
      typeof raw.title !== "string" ||
      typeof raw.surface !== "string" ||
      (raw.surface !== "discover" && raw.surface !== "sleep") ||
      typeof raw.sortOrder !== "number" ||
      !Number.isFinite(raw.sortOrder) ||
      typeof raw.isActive !== "boolean" ||
      !Array.isArray(raw.playlistIds)
    ) {
      return [];
    }
    return [{
      id: raw.id,
      title: raw.title,
      surface: raw.surface,
      sortOrder: raw.sortOrder,
      isActive: raw.isActive,
      playlistIds: raw.playlistIds.filter(
        (playlistId): playlistId is string => typeof playlistId === "string" && playlistId.length > 0,
      ),
    }];
  });
}

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
  playlistCarousels?: PlaylistCarouselSnapshot[],
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
      editorialType:
        snap.editorialType === "relaxation" ||
        snap.editorialType === "ritual" ||
        snap.editorialType === "none"
          ? snap.editorialType
          : "meditative",
      placements,
      isActive: snap.isActive ?? true,
      sortOrder: snap.sortOrder ?? 0,
      showOnHome: snap.showOnHome,
    });
  }

  // `undefined` means this is an old cached/server snapshot.  Any defined
  // value, including [], is the complete publication and replaces the prior
  // in-memory value.
  const carouselSource =
    playlistCarousels === undefined
      ? buildLegacyPlaylistCarouselRecords(snapshots)
      : normalizePlaylistCarousels(playlistCarousels);
  PLAYLIST_CAROUSELS.length = 0;
  PLAYLIST_CAROUSELS.push(...carouselSource);

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

/** Published, named carousels with active playlist metadata resolved in order. */
export function getEditorialPlaylistCarouselsForSurface(
  surface: PlaylistCarouselSurface,
): EditorialPlaylistCarousel[] {
  return resolvePlaylistCarouselRows(PLAYLIST_CAROUSELS, PLAYLISTS, surface);
}

/**
 * Selecciones publicadas por superficie. Las posiciones pertenecen a la
 * publicación, no a las sesiones, para que una misma playlist pueda aparecer
 * en varios carruseles y con órdenes independientes.  Kept as a compatibility
 * flattening helper for callers that still render one carousel.
 */
export function getEditorialPlaylistsForSurface(
  surface: PlaylistCarouselSurface,
): EditorialPlaylist[] {
  return getEditorialPlaylistCarouselsForSurface(surface).flatMap(
    (carousel) => carousel.playlists,
  );
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
