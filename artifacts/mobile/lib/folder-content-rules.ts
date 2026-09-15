export type FolderContentType = "playlist" | "mix" | null;

export type ExclusiveFolderLike = {
  playlistIds?: string[];
  presetIds?: string[];
};

export type DatedLibraryItem = {
  id: string;
  createdAt: string;
};

export const PLAYLIST_ONLY_FOLDER_MESSAGE = "Esta carpeta solo puede guardar playlists.";
export const MIX_ONLY_FOLDER_MESSAGE = "Esta carpeta solo puede guardar mezclas.";

export function getFolderContentType(folder: ExclusiveFolderLike): FolderContentType {
  if ((folder.playlistIds ?? []).length > 0) return "playlist";
  if ((folder.presetIds ?? []).length > 0) return "mix";
  return null;
}

export function canAddPlaylistToFolder(folder: ExclusiveFolderLike): boolean {
  return (folder.presetIds ?? []).length === 0;
}

export function canAddMixToFolder(folder: ExclusiveFolderLike): boolean {
  return (folder.playlistIds ?? []).length === 0;
}

export function sanitizeExclusiveFolderContents<T extends ExclusiveFolderLike>(
  folders: T[],
  playlists: DatedLibraryItem[],
  mixes: DatedLibraryItem[],
): T[] {
  const playlistDates = new Map(playlists.map((item) => [item.id, Date.parse(item.createdAt) || 0]));
  const mixDates = new Map(mixes.map((item) => [item.id, Date.parse(item.createdAt) || 0]));

  return folders.map((folder) => {
    const playlistIds = (folder.playlistIds ?? []).filter((id) => playlistDates.has(id));
    const presetIds = (folder.presetIds ?? []).filter((id) => mixDates.has(id));
    const pruned =
      playlistIds.length !== (folder.playlistIds ?? []).length ||
      presetIds.length !== (folder.presetIds ?? []).length;

    if (playlistIds.length === 0 || presetIds.length === 0) {
      return pruned ? { ...folder, playlistIds, presetIds } : folder;
    }

    const newestPlaylist = Math.max(...playlistIds.map((id) => playlistDates.get(id) ?? 0));
    const newestMix = Math.max(...presetIds.map((id) => mixDates.get(id) ?? 0));
    return newestMix > newestPlaylist
      ? { ...folder, playlistIds: [], presetIds }
      : { ...folder, playlistIds, presetIds: [] };
  });
}