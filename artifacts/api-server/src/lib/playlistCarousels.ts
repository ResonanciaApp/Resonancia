import { asc, inArray } from "drizzle-orm";
import {
  db,
  catalogPlaylistCarouselMembershipsTable,
  catalogPlaylistCarouselsTable,
  catalogPlaylistsTable,
  type CatalogPlaylistCarousel,
} from "@workspace/db";

export type PlaylistCarouselResponse = {
  id: number;
  title: string;
  surface: "discover" | "sleep";
  sortOrder: number;
  isActive: boolean;
  playlistIds: string[];
};

/**
 * Reads carousel state independently from legacy per-playlist placements.
 * Public reads resolve active playlist metadata and omit empty carousels;
 * admin reads retain the complete selection, including inactive playlists.
 */
export async function loadPlaylistCarousels(
  publicOnly = false,
): Promise<PlaylistCarouselResponse[]> {
  const [carousels, memberships] = await Promise.all([
    db
      .select()
      .from(catalogPlaylistCarouselsTable)
      .orderBy(
        asc(catalogPlaylistCarouselsTable.surface),
        asc(catalogPlaylistCarouselsTable.sortOrder),
        asc(catalogPlaylistCarouselsTable.id),
      ),
    db
      .select()
      .from(catalogPlaylistCarouselMembershipsTable)
      .orderBy(
        asc(catalogPlaylistCarouselMembershipsTable.carouselId),
        asc(catalogPlaylistCarouselMembershipsTable.sortOrder),
        asc(catalogPlaylistCarouselMembershipsTable.id),
      ),
  ]);

  const playlistIds = [...new Set(memberships.map((membership) => membership.playlistId))];
  const playlists =
    playlistIds.length > 0
      ? await db
          .select({
            id: catalogPlaylistsTable.id,
            slug: catalogPlaylistsTable.slug,
            isActive: catalogPlaylistsTable.isActive,
          })
          .from(catalogPlaylistsTable)
          .where(inArray(catalogPlaylistsTable.id, playlistIds))
      : [];
  const playlistById = new Map(playlists.map((playlist) => [playlist.id, playlist]));
  const membershipsByCarousel = new Map<number, typeof memberships>();
  for (const membership of memberships) {
    const current = membershipsByCarousel.get(membership.carouselId) ?? [];
    current.push(membership);
    membershipsByCarousel.set(membership.carouselId, current);
  }

  return carousels.flatMap((carousel: CatalogPlaylistCarousel) => {
    if (publicOnly && !carousel.isActive) return [];
    const playlistSlugs = (membershipsByCarousel.get(carousel.id) ?? [])
      .map((membership) => playlistById.get(membership.playlistId))
      .filter(
        (playlist): playlist is NonNullable<typeof playlist> =>
          playlist != null && (!publicOnly || playlist.isActive),
      )
      .map((playlist) => playlist.slug);
    if (publicOnly && playlistSlugs.length === 0) return [];
    return [
      {
        id: carousel.id,
        title: carousel.title,
        surface: carousel.surface,
        sortOrder: carousel.sortOrder,
        isActive: carousel.isActive,
        playlistIds: playlistSlugs,
      },
    ];
  });
}