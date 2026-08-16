import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── Types ────────────────────────────────────────────────────────────────────

export type Folder = {
  id: string;
  name: string;
  sessionIds: string[];    // sesiones (flujo AddToFolderSheet)
  playlistIds: string[];   // playlists agrupadas (flujo carpeta Spotify-style)
  presetIds?: string[];    // mezclas del Mezclador guardadas en la carpeta
  subFolderIds: string[];  // subcarpetas anidadas
  createdAt: string;
  pinned?: boolean;
};

export type FavFolder = {
  id: string;
  name: string;
  sessionIds: string[];
  createdAt: string;
  pinned?: boolean;
  /** IDs de subcarpetas anidadas dentro de esta carpeta. */
  subFolderIds?: string[];
};

export type Playlist = {
  id: string;
  name: string;
  description?: string;
  sessionIds: string[]; // ordered
  /** IDs de videos (data/videos.ts) agregados a la playlist. */
  videoIds?: string[];
  coverUri?: string;
  /** 'image' = foto del celular; 'geometrix' = geometría sagrada; 'creation' = composición propia */
  coverType?: "image" | "geometrix" | "creation";
  coverGeometryId?: string;
  coverCreationId?: string;
  /** Hex del tono de acento elegido por el usuario para el header */
  coverColor?: string;
  createdAt: string;
  pinned?: boolean;
};

interface FoldersPlaylistsCtx {
  folders: Folder[];
  playlists: Playlist[];
  // Folders
  createFolder: (name: string, initialSessionId?: string) => Folder;
  renameFolder: (folderId: string, name: string) => void;
  addToFolder: (folderId: string, sessionId: string) => void;
  removeFromFolder: (folderId: string, sessionId: string) => void;
  deleteFolder: (folderId: string) => void;
  isInFolder: (folderId: string, sessionId: string) => boolean;
  addPlaylistToFolder: (folderId: string, playlistId: string) => void;
  removePlaylistFromFolder: (folderId: string, playlistId: string) => void;
  isPlaylistInFolder: (folderId: string, playlistId: string) => boolean;
  addMixToFolder: (folderId: string, presetId: string) => void;
  removeMixFromFolder: (folderId: string, presetId: string) => void;
  isMixInFolder: (folderId: string, presetId: string) => boolean;
  addFolderToFolder: (parentId: string, childId: string) => void;
  removeFolderFromFolder: (parentId: string, childId: string) => void;
  isFolderInFolder: (parentId: string, childId: string) => boolean;
  // Playlists
  createPlaylist: (name: string, initialSessionId?: string) => Playlist;
  renamePlaylist: (playlistId: string, name: string) => void;
  setPlaylistDescription: (playlistId: string, description: string) => void;
  reorderPlaylist: (playlistId: string, newSessionIds: string[]) => void;
  setPlaylistCover: (playlistId: string, uri: string) => void;
  setPlaylistCoverColor: (playlistId: string, color: string) => void;
  setPlaylistCoverGeometry: (playlistId: string, geometryId: string) => void;
  setPlaylistCoverCreation: (playlistId: string, creationId: string) => void;
  addToPlaylist: (playlistId: string, sessionId: string) => void;
  removeFromPlaylist: (playlistId: string, sessionId: string) => void;
  deletePlaylist: (playlistId: string) => void;
  isInPlaylist: (playlistId: string, sessionId: string) => boolean;
  addVideoToPlaylist: (playlistId: string, videoId: string) => void;
  removeVideoFromPlaylist: (playlistId: string, videoId: string) => void;
  isVideoInPlaylist: (playlistId: string, videoId: string) => boolean;
  togglePinPlaylist: (playlistId: string) => void;
  togglePinFolder: (folderId: string) => void;
  // Fav folders
  favFolders: FavFolder[];
  createFavFolder: (name: string, initialSessionId?: string) => FavFolder;
  renameFavFolder: (folderId: string, name: string) => void;
  deleteFavFolder: (folderId: string) => void;
  togglePinFavFolder: (folderId: string) => void;
  addToFavFolder: (folderId: string, sessionId: string) => void;
  removeFromFavFolder: (folderId: string, sessionId: string) => void;
  isInFavFolder: (folderId: string, sessionId: string) => boolean;
  addFavFolderToFolder: (parentId: string, childId: string) => void;
  removeFavFolderFromFolder: (parentId: string, childId: string) => void;
  isFavFolderInFolder: (parentId: string, childId: string) => boolean;
  // Pinned favorite sessions
  pinnedFavoriteIds: string[];
  isFavoritePinned: (sessionId: string) => boolean;
  togglePinFavorite: (sessionId: string) => void;
}

// ─── Storage keys ─────────────────────────────────────────────────────────────

const FOLDERS_KEY = "@resonance_folders";
const PLAYLISTS_KEY = "@resonance_playlists";
const DEFAULT_PLAYLISTS_SEEDED_KEY = "@resonance_default_playlists_seeded_v2";

// ─── Playlists por defecto (usuarios nuevos) ─────────────────────────────────
// Se crean una sola vez en la primera apertura; si el usuario las borra, no vuelven.
const DEFAULT_PLAYLISTS: Playlist[] = [
  {
    id: "default_para_empezar",
    name: "Para Empezar",
    description: "Una selección para tus primeros pasos en Resonancia.",
    sessionIds: ["1", "25", "26", "20"],
    createdAt: new Date().toISOString(),
  },
  {
    id: "default_calma_profunda",
    name: "Calma Profunda",
    description: "Sonidos y sesiones para soltar el día y relajarte.",
    sessionIds: ["41", "44", "21", "22", "27"],
    createdAt: new Date().toISOString(),
  },
  {
    id: "default_sueno_reparador",
    name: "Sueño Reparador",
    description: "Acompañamiento para una noche de descanso profundo.",
    sessionIds: ["8", "46", "47", "50", "24"],
    createdAt: new Date().toISOString(),
  },
];
const FAV_FOLDERS_KEY = "@resonance_fav_folders";
const PINNED_FAVORITES_KEY = "@resonance_pinned_favorites";

// ─── Context ──────────────────────────────────────────────────────────────────

const Ctx = createContext<FoldersPlaylistsCtx | null>(null);

export function useFoldersPlaylists(): FoldersPlaylistsCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useFoldersPlaylists must be inside FoldersPlaylistsProvider");
  return ctx;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function FoldersPlaylistsProvider({ children }: { children: React.ReactNode }) {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [favFolders, setFavFolders] = useState<FavFolder[]>([]);
  const [pinnedFavoriteIds, setPinnedFavoriteIds] = useState<string[]>([]);

  // Load from storage
  useEffect(() => {
    AsyncStorage.multiGet([FOLDERS_KEY, PLAYLISTS_KEY, FAV_FOLDERS_KEY, PINNED_FAVORITES_KEY, DEFAULT_PLAYLISTS_SEEDED_KEY]).then(
      ([fEntry, pEntry, ffEntry, pfEntry, seededEntry]) => {
        if (fEntry[1]) setFolders(JSON.parse(fEntry[1]));
        const storedPlaylists: Playlist[] = pEntry[1] ? JSON.parse(pEntry[1]) : [];
        if (storedPlaylists.length > 0) {
          setPlaylists(storedPlaylists);
        } else if (!seededEntry[1]) {
          // Usuario nuevo: sembrar las playlists por defecto una sola vez.
          setPlaylists(DEFAULT_PLAYLISTS);
          AsyncStorage.setItem(PLAYLISTS_KEY, JSON.stringify(DEFAULT_PLAYLISTS));
        }
        if (!seededEntry[1]) AsyncStorage.setItem(DEFAULT_PLAYLISTS_SEEDED_KEY, "1");
        if (ffEntry[1]) setFavFolders(JSON.parse(ffEntry[1]));
        if (pfEntry[1]) setPinnedFavoriteIds(JSON.parse(pfEntry[1]));
      }
    );
  }, []);

  // Functional updaters — always read latest state (no stale closure)
  const updateFolders = useCallback((updater: (prev: Folder[]) => Folder[]) => {
    setFolders((prev) => {
      const next = updater(prev);
      AsyncStorage.setItem(FOLDERS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const updatePlaylists = useCallback((updater: (prev: Playlist[]) => Playlist[]) => {
    setPlaylists((prev) => {
      const next = updater(prev);
      AsyncStorage.setItem(PLAYLISTS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const updateFavFolders = useCallback((updater: (prev: FavFolder[]) => FavFolder[]) => {
    setFavFolders((prev) => {
      const next = updater(prev);
      AsyncStorage.setItem(FAV_FOLDERS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const updatePinnedFavorites = useCallback((updater: (prev: string[]) => string[]) => {
    setPinnedFavoriteIds((prev) => {
      const next = updater(prev);
      AsyncStorage.setItem(PINNED_FAVORITES_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  // ── Folders ──────────────────────────────────────────────────────────────

  const createFolder = useCallback((name: string, initialSessionId?: string): Folder => {
    const folder: Folder = {
      id: `folder_${Date.now()}`,
      name: name.trim(),
      sessionIds: initialSessionId ? [initialSessionId] : [],
      playlistIds: [],
      subFolderIds: [],
      createdAt: new Date().toISOString(),
    };
    updateFolders((prev) => [...prev, folder]);
    return folder;
  }, [updateFolders]);

  const addFolderToFolder = useCallback((parentId: string, childId: string) => {
    updateFolders((prev) =>
      prev.map((f) =>
        f.id === parentId && !(f.subFolderIds ?? []).includes(childId)
          ? { ...f, subFolderIds: [...(f.subFolderIds ?? []), childId] }
          : f
      )
    );
  }, [updateFolders]);

  const removeFolderFromFolder = useCallback((parentId: string, childId: string) => {
    updateFolders((prev) =>
      prev.map((f) =>
        f.id === parentId
          ? { ...f, subFolderIds: (f.subFolderIds ?? []).filter((id) => id !== childId) }
          : f
      )
    );
  }, [updateFolders]);

  const renameFolder = useCallback((folderId: string, name: string) => {
    updateFolders((prev) =>
      prev.map((f) => f.id === folderId ? { ...f, name: name.trim() } : f)
    );
  }, [updateFolders]);

  const isFolderInFolder = useCallback(
    (parentId: string, childId: string) =>
      (folders.find((f) => f.id === parentId)?.subFolderIds ?? []).includes(childId),
    [folders]
  );

  const addPlaylistToFolder = useCallback((folderId: string, playlistId: string) => {
    updateFolders((prev) =>
      prev.map((f) =>
        f.id === folderId && !(f.playlistIds ?? []).includes(playlistId)
          ? { ...f, playlistIds: [...(f.playlistIds ?? []), playlistId] }
          : f
      )
    );
  }, [updateFolders]);

  const removePlaylistFromFolder = useCallback((folderId: string, playlistId: string) => {
    updateFolders((prev) =>
      prev.map((f) =>
        f.id === folderId
          ? { ...f, playlistIds: (f.playlistIds ?? []).filter((id) => id !== playlistId) }
          : f
      )
    );
  }, [updateFolders]);

  const isPlaylistInFolder = useCallback(
    (folderId: string, playlistId: string) =>
      (folders.find((f) => f.id === folderId)?.playlistIds ?? []).includes(playlistId),
    [folders]
  );

  const addMixToFolder = useCallback((folderId: string, presetId: string) => {
    updateFolders((prev) =>
      prev.map((f) =>
        f.id === folderId && !(f.presetIds ?? []).includes(presetId)
          ? { ...f, presetIds: [...(f.presetIds ?? []), presetId] }
          : f
      )
    );
  }, [updateFolders]);

  const removeMixFromFolder = useCallback((folderId: string, presetId: string) => {
    updateFolders((prev) =>
      prev.map((f) =>
        f.id === folderId
          ? { ...f, presetIds: (f.presetIds ?? []).filter((id) => id !== presetId) }
          : f
      )
    );
  }, [updateFolders]);

  const isMixInFolder = useCallback(
    (folderId: string, presetId: string) =>
      (folders.find((f) => f.id === folderId)?.presetIds ?? []).includes(presetId),
    [folders]
  );

  const addToFolder = useCallback((folderId: string, sessionId: string) => {
    updateFolders((prev) =>
      prev.map((f) =>
        f.id === folderId && !f.sessionIds.includes(sessionId)
          ? { ...f, sessionIds: [...f.sessionIds, sessionId] }
          : f
      )
    );
  }, [updateFolders]);

  const removeFromFolder = useCallback((folderId: string, sessionId: string) => {
    updateFolders((prev) =>
      prev.map((f) =>
        f.id === folderId
          ? { ...f, sessionIds: f.sessionIds.filter((id) => id !== sessionId) }
          : f
      )
    );
  }, [updateFolders]);

  const deleteFolder = useCallback((folderId: string) => {
    updateFolders((prev) => prev.filter((f) => f.id !== folderId));
  }, [updateFolders]);

  const isInFolder = useCallback(
    (folderId: string, sessionId: string) =>
      folders.find((f) => f.id === folderId)?.sessionIds.includes(sessionId) ?? false,
    [folders]
  );

  // ── Playlists ─────────────────────────────────────────────────────────────

  const createPlaylist = useCallback((name: string, initialSessionId?: string): Playlist => {
    const pl: Playlist = {
      id: `playlist_${Date.now()}`,
      name: name.trim(),
      sessionIds: initialSessionId ? [initialSessionId] : [],
      createdAt: new Date().toISOString(),
    };
    updatePlaylists((prev) => [...prev, pl]);
    return pl;
  }, [updatePlaylists]);

  const renamePlaylist = useCallback((playlistId: string, name: string) => {
    updatePlaylists((prev) =>
      prev.map((p) => p.id === playlistId ? { ...p, name: name.trim() } : p)
    );
  }, [updatePlaylists]);

  const setPlaylistDescription = useCallback((playlistId: string, description: string) => {
    updatePlaylists((prev) =>
      prev.map((p) => p.id === playlistId ? { ...p, description } : p)
    );
  }, [updatePlaylists]);

  const reorderPlaylist = useCallback((playlistId: string, newSessionIds: string[]) => {
    updatePlaylists((prev) =>
      prev.map((p) => p.id === playlistId ? { ...p, sessionIds: newSessionIds } : p)
    );
  }, [updatePlaylists]);

  const setPlaylistCover = useCallback((playlistId: string, uri: string) => {
    updatePlaylists((prev) =>
      prev.map((p) => p.id === playlistId ? { ...p, coverUri: uri, coverType: "image" as const } : p)
    );
  }, [updatePlaylists]);

  const setPlaylistCoverColor = useCallback((playlistId: string, color: string) => {
    updatePlaylists((prev) =>
      prev.map((p) => p.id === playlistId ? { ...p, coverColor: color } : p)
    );
  }, [updatePlaylists]);

  const setPlaylistCoverGeometry = useCallback((playlistId: string, geometryId: string) => {
    updatePlaylists((prev) =>
      prev.map((p) => p.id === playlistId ? { ...p, coverType: "geometrix" as const, coverGeometryId: geometryId } : p)
    );
  }, [updatePlaylists]);

  const setPlaylistCoverCreation = useCallback((playlistId: string, creationId: string) => {
    updatePlaylists((prev) =>
      prev.map((p) => p.id === playlistId ? { ...p, coverType: "creation" as const, coverCreationId: creationId } : p)
    );
  }, [updatePlaylists]);

  const addToPlaylist = useCallback((playlistId: string, sessionId: string) => {
    updatePlaylists((prev) =>
      prev.map((p) =>
        p.id === playlistId && !p.sessionIds.includes(sessionId)
          ? { ...p, sessionIds: [...p.sessionIds, sessionId] }
          : p
      )
    );
  }, [updatePlaylists]);

  const removeFromPlaylist = useCallback((playlistId: string, sessionId: string) => {
    updatePlaylists((prev) =>
      prev.map((p) =>
        p.id === playlistId
          ? { ...p, sessionIds: p.sessionIds.filter((id) => id !== sessionId) }
          : p
      )
    );
  }, [updatePlaylists]);

  const deletePlaylist = useCallback((playlistId: string) => {
    updatePlaylists((prev) => prev.filter((p) => p.id !== playlistId));
  }, [updatePlaylists]);

  const isInPlaylist = useCallback(
    (playlistId: string, sessionId: string) =>
      playlists.find((p) => p.id === playlistId)?.sessionIds.includes(sessionId) ?? false,
    [playlists]
  );

  const addVideoToPlaylist = useCallback((playlistId: string, videoId: string) => {
    updatePlaylists((prev) =>
      prev.map((p) =>
        p.id === playlistId && !(p.videoIds ?? []).includes(videoId)
          ? { ...p, videoIds: [...(p.videoIds ?? []), videoId] }
          : p
      )
    );
  }, [updatePlaylists]);

  const removeVideoFromPlaylist = useCallback((playlistId: string, videoId: string) => {
    updatePlaylists((prev) =>
      prev.map((p) =>
        p.id === playlistId
          ? { ...p, videoIds: (p.videoIds ?? []).filter((id) => id !== videoId) }
          : p
      )
    );
  }, [updatePlaylists]);

  const isVideoInPlaylist = useCallback(
    (playlistId: string, videoId: string) =>
      (playlists.find((p) => p.id === playlistId)?.videoIds ?? []).includes(videoId),
    [playlists]
  );

  const togglePinPlaylist = useCallback((playlistId: string) => {
    updatePlaylists((prev) =>
      prev.map((p) => p.id === playlistId ? { ...p, pinned: !(p.pinned ?? false) } : p)
    );
  }, [updatePlaylists]);

  const togglePinFolder = useCallback((folderId: string) => {
    updateFolders((prev) =>
      prev.map((f) => f.id === folderId ? { ...f, pinned: !(f.pinned ?? false) } : f)
    );
  }, [updateFolders]);

  // ── Fav folders ───────────────────────────────────────────────────────────

  const createFavFolder = useCallback((name: string, initialSessionId?: string): FavFolder => {
    const folder: FavFolder = {
      id: `favfolder_${Date.now()}`,
      name: name.trim(),
      sessionIds: initialSessionId ? [initialSessionId] : [],
      createdAt: new Date().toISOString(),
      subFolderIds: [],
    };
    updateFavFolders((prev) => [...prev, folder]);
    return folder;
  }, [updateFavFolders]);

  const renameFavFolder = useCallback((folderId: string, name: string) => {
    updateFavFolders((prev) =>
      prev.map((f) => f.id === folderId ? { ...f, name: name.trim() } : f)
    );
  }, [updateFavFolders]);

  const deleteFavFolder = useCallback((folderId: string) => {
    updateFavFolders((prev) => prev.filter((f) => f.id !== folderId));
  }, [updateFavFolders]);

  const togglePinFavFolder = useCallback((folderId: string) => {
    updateFavFolders((prev) =>
      prev.map((f) => f.id === folderId ? { ...f, pinned: !(f.pinned ?? false) } : f)
    );
  }, [updateFavFolders]);

  const addToFavFolder = useCallback((folderId: string, sessionId: string) => {
    updateFavFolders((prev) =>
      prev.map((f) =>
        f.id === folderId && !f.sessionIds.includes(sessionId)
          ? { ...f, sessionIds: [...f.sessionIds, sessionId] }
          : f
      )
    );
  }, [updateFavFolders]);

  const removeFromFavFolder = useCallback((folderId: string, sessionId: string) => {
    updateFavFolders((prev) =>
      prev.map((f) =>
        f.id === folderId
          ? { ...f, sessionIds: f.sessionIds.filter((id) => id !== sessionId) }
          : f
      )
    );
  }, [updateFavFolders]);

  const isInFavFolder = useCallback(
    (folderId: string, sessionId: string) =>
      favFolders.find((f) => f.id === folderId)?.sessionIds.includes(sessionId) ?? false,
    [favFolders]
  );

  const addFavFolderToFolder = useCallback((parentId: string, childId: string) => {
    updateFavFolders((prev) =>
      prev.map((f) =>
        f.id === parentId && !(f.subFolderIds ?? []).includes(childId)
          ? { ...f, subFolderIds: [...(f.subFolderIds ?? []), childId] }
          : f
      )
    );
  }, [updateFavFolders]);

  const removeFavFolderFromFolder = useCallback((parentId: string, childId: string) => {
    updateFavFolders((prev) =>
      prev.map((f) =>
        f.id === parentId
          ? { ...f, subFolderIds: (f.subFolderIds ?? []).filter((id) => id !== childId) }
          : f
      )
    );
  }, [updateFavFolders]);

  const isFavFolderInFolder = useCallback(
    (parentId: string, childId: string) =>
      (favFolders.find((f) => f.id === parentId)?.subFolderIds ?? []).includes(childId),
    [favFolders]
  );

  // ── Pinned favorite sessions ──────────────────────────────────────────────

  const isFavoritePinned = useCallback(
    (sessionId: string) => pinnedFavoriteIds.includes(sessionId),
    [pinnedFavoriteIds]
  );

  const togglePinFavorite = useCallback((sessionId: string) => {
    updatePinnedFavorites((prev) =>
      prev.includes(sessionId) ? prev.filter((id) => id !== sessionId) : [...prev, sessionId]
    );
  }, [updatePinnedFavorites]);

  return (
    <Ctx.Provider
      value={{
        folders,
        playlists,
        createFolder,
        renameFolder,
        addToFolder,
        addPlaylistToFolder,
        removePlaylistFromFolder,
        isPlaylistInFolder,
        addMixToFolder,
        removeMixFromFolder,
        isMixInFolder,
        addFolderToFolder,
        removeFolderFromFolder,
        isFolderInFolder,
        removeFromFolder,
        deleteFolder,
        isInFolder,
        createPlaylist,
        renamePlaylist,
        setPlaylistDescription,
        reorderPlaylist,
        setPlaylistCover,
        setPlaylistCoverColor,
        setPlaylistCoverGeometry,
        setPlaylistCoverCreation,
        addToPlaylist,
        removeFromPlaylist,
        deletePlaylist,
        isInPlaylist,
        addVideoToPlaylist,
        removeVideoFromPlaylist,
        isVideoInPlaylist,
        togglePinPlaylist,
        togglePinFolder,
        favFolders,
        createFavFolder,
        renameFavFolder,
        deleteFavFolder,
        togglePinFavFolder,
        addToFavFolder,
        removeFromFavFolder,
        isInFavFolder,
        addFavFolderToFolder,
        removeFavFolderFromFolder,
        isFavFolderInFolder,
        pinnedFavoriteIds,
        isFavoritePinned,
        togglePinFavorite,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}
