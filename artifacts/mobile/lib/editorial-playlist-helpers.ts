export type EditorialDetailDisposition = "missing" | "transient";

export type PlaylistCarouselSurface = "discover" | "sleep";

/**
 * The public catalog describes a carousel by playlist slug.  Keeping this
 * resolver free of React/RN dependencies makes the ordering and filtering
 * rules easy to exercise in isolation (and keeps the catalog module focused
 * on mutating its in-memory snapshot).
 */
export type PlaylistCarouselRecord = {
  id: number;
  title: string;
  surface: PlaylistCarouselSurface;
  sortOrder: number;
  isActive: boolean;
  playlistIds: string[];
};

export type PlaylistCarouselPlaylist = {
  id: string;
  isActive?: boolean;
};

export type ResolvedPlaylistCarousel<T extends PlaylistCarouselPlaylist> =
  PlaylistCarouselRecord & { playlists: T[] };

type LegacyPlaylistPlacement = {
  surface: PlaylistCarouselSurface;
  sortOrder: number;
  isActive: boolean;
};

export type LegacyPlaylistSnapshot = {
  slug: string;
  sortOrder?: number;
  isActive?: boolean;
  showOnHome?: boolean;
  placements?: readonly LegacyPlaylistPlacement[];
};

/**
 * Converts the pre-carousel publication model to the two former default
 * groups.  This is only for snapshots that do not carry `playlistCarousels`;
 * callers must not use it as a fallback for an explicit empty publication.
 *
 * The Discover home fallback intentionally mirrors the old selector: a
 * showOnHome playlist is included only when it has no active Discover
 * placement, and it keeps the playlist's former sortOrder.
 */
export function buildLegacyPlaylistCarouselRecords(
  snapshots: readonly LegacyPlaylistSnapshot[],
): PlaylistCarouselRecord[] {
  const surfaces: PlaylistCarouselSurface[] = ["discover", "sleep"];
  const activeSnapshots = snapshots
    .map((snapshot, snapshotIndex) => ({ snapshot, snapshotIndex }))
    .filter(({ snapshot }) => snapshot.isActive !== false);

  return surfaces.flatMap((surface, surfaceIndex) => {
    const ordered = activeSnapshots.flatMap(({ snapshot, snapshotIndex }, playlistIndex) => {
      const activePlacements = (snapshot.placements ?? []).filter(
        (placement) =>
          placement.surface === surface &&
          placement.isActive !== false &&
          typeof placement.sortOrder === "number",
      );
      if (activePlacements.length > 0) {
        return activePlacements.map((placement) => ({
          slug: snapshot.slug,
          sortOrder: placement.sortOrder,
          playlistIndex,
          snapshotIndex,
        }));
      }
      if (surface === "discover" && snapshot.showOnHome === true) {
        return [{
          slug: snapshot.slug,
          sortOrder: snapshot.sortOrder ?? 0,
          playlistIndex,
          snapshotIndex,
        }];
      }
      return [];
    }).sort(
      (a, b) => a.sortOrder - b.sortOrder || a.playlistIndex - b.playlistIndex || a.snapshotIndex - b.snapshotIndex,
    );

    const playlistIds: string[] = [];
    const seen = new Set<string>();
    for (const placement of ordered) {
      if (!placement.slug || seen.has(placement.slug)) continue;
      seen.add(placement.slug);
      playlistIds.push(placement.slug);
    }
    if (playlistIds.length === 0) return [];
    return [{
      id: -(surfaceIndex + 1),
      title: surface === "discover" ? "Playlists para ti" : "Selecciones para dormir",
      surface,
      sortOrder: 0,
      isActive: true,
      playlistIds,
    }];
  });
}

/**
 * Resolves the playlist slugs in each published carousel while retaining the
 * server's carousel and card order.  Empty carousels and carousels whose
 * playlists are no longer active are intentionally omitted: their heading
 * must not remain visible in the app.
 */
export function resolvePlaylistCarouselRows<T extends PlaylistCarouselPlaylist>(
  carousels: readonly PlaylistCarouselRecord[] | undefined,
  playlists: readonly T[],
  surface: PlaylistCarouselSurface,
): ResolvedPlaylistCarousel<T>[] {
  const byId = new Map(playlists.map((playlist) => [playlist.id, playlist]));

  return (carousels ?? [])
    .map((carousel, index) => ({ carousel, index }))
    .filter(
      ({ carousel }) =>
        carousel.surface === surface &&
        carousel.isActive === true &&
        carousel.title.trim().length > 0,
    )
    .sort((a, b) => a.carousel.sortOrder - b.carousel.sortOrder || a.index - b.index)
    .map(({ carousel }) => {
      const seen = new Set<string>();
      const resolved = carousel.playlistIds.reduce<T[]>((result, playlistId) => {
        if (seen.has(playlistId)) return result;
        seen.add(playlistId);
        const playlist = byId.get(playlistId);
        if (playlist && playlist.isActive !== false) result.push(playlist);
        return result;
      }, []);
      return { ...carousel, playlists: resolved };
    })
    .filter((carousel) => carousel.playlists.length > 0);
}

/** 404/410 son decisiones editoriales definitivas, no fallos de red. */
export function classifyEditorialDetailStatus(status: number): EditorialDetailDisposition {
  return status === 404 || status === 410 ? "missing" : "transient";
}

/** Lee solo snapshots cacheados con una identidad estable y descarta corrupción. */
export function parseEditorialPlaylistCache<T extends { slug?: unknown }>(
  raw: string | null,
): T | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as T;
    return typeof parsed?.slug === "string" && parsed.slug.length > 0 ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Construye una cola nueva. El modo se pasa explícitamente para que una cola
 * normal nunca herede el shuffle de la cola anterior.
 */
export function buildEditorialQueue(
  ids: string[],
  currentId: string,
  shuffle: boolean,
  random: () => number = Math.random,
): string[] {
  const uniqueIds = Array.from(new Set(ids));
  const first = uniqueIds.includes(currentId) ? currentId : uniqueIds[0];
  if (!first || !shuffle) return uniqueIds;

  const rest = uniqueIds.filter((id) => id !== first);
  for (let index = rest.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [rest[index], rest[swapIndex]] = [rest[swapIndex], rest[index]];
  }
  return [first, ...rest];
}

/** Selecciona el primer elemento de una cola aleatoria antes de barajar el resto. */
export function pickRandomQueueStart<T>(
  items: T[],
  random: () => number = Math.random,
): T | undefined {
  if (items.length === 0) return undefined;
  return items[Math.min(items.length - 1, Math.floor(random() * items.length))];
}