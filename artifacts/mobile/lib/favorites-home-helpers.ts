export const FAVORITE_COLLECTION_TABS = [
  { id: "meditaciones", label: "Meditaciones", categoryId: "meditaciones-guiadas" },
  { id: "sesiones", label: "Sonoterapia", categoryId: "sonidos-ancestrales" },
  { id: "musica", label: "Música", categoryId: "musica-sonidos" },
  { id: "ambientales", label: "Ambientales", categoryId: "ambientales" },
  { id: "historias", label: "Historias", categoryId: "historias" },
  { id: "charlas", label: "Charlas", categoryId: "charlas" },
] as const;

export type FavoriteCollectionTabId =
  | "all"
  | (typeof FAVORITE_COLLECTION_TABS)[number]["id"]
  | "videos"
  | "playlists";

export type FavoriteTabDefinition = {
  id: FavoriteCollectionTabId;
  label: string;
  categoryId: string | null;
};

export const ALL_FAVORITES_TAB: FavoriteTabDefinition = {
  id: "all",
  label: "Ver todos",
  categoryId: null,
};

export function buildVisibleFavoriteTabs(
  sessionCategoryIds: readonly string[],
  hasVideos: boolean,
  hasPlaylists: boolean,
): FavoriteTabDefinition[] {
  const categorySet = new Set(sessionCategoryIds);
  const tabs: FavoriteTabDefinition[] = [
    ALL_FAVORITES_TAB,
    ...FAVORITE_COLLECTION_TABS.filter((tab) => categorySet.has(tab.categoryId)),
  ];
  if (hasVideos) tabs.push({ id: "videos", label: "Videos", categoryId: null });
  if (hasPlaylists) tabs.push({ id: "playlists", label: "Playlists", categoryId: null });
  return tabs;
}

export function resolveSavedEditorialFavorites<
  T extends { id: string; isActive?: boolean },
>(savedIds: readonly string[], playlists: readonly T[]): T[] {
  const byId = new Map(playlists.map((playlist) => [playlist.id, playlist]));
  const seen = new Set<string>();
  const resolved: T[] = [];

  for (const id of savedIds) {
    if (seen.has(id)) continue;
    seen.add(id);
    const playlist = byId.get(id);
    if (playlist && playlist.isActive !== false) resolved.push(playlist);
  }

  return resolved;
}