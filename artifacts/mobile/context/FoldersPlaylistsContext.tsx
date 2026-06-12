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
  subFolderIds: string[];  // subcarpetas anidadas
  createdAt: string;
};

export type Playlist = {
  id: string;
  name: string;
  sessionIds: string[]; // ordered
  coverUri?: string;
  createdAt: string;
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
  addFolderToFolder: (parentId: string, childId: string) => void;
  removeFolderFromFolder: (parentId: string, childId: string) => void;
  // Playlists
  createPlaylist: (name: string, initialSessionId?: string) => Playlist;
  renamePlaylist: (playlistId: string, name: string) => void;
  setPlaylistCover: (playlistId: string, uri: string) => void;
  addToPlaylist: (playlistId: string, sessionId: string) => void;
  removeFromPlaylist: (playlistId: string, sessionId: string) => void;
  deletePlaylist: (playlistId: string) => void;
  isInPlaylist: (playlistId: string, sessionId: string) => boolean;
}

// ─── Storage keys ─────────────────────────────────────────────────────────────

const FOLDERS_KEY = "@resonance_folders";
const PLAYLISTS_KEY = "@resonance_playlists";

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

  // Load from storage
  useEffect(() => {
    AsyncStorage.multiGet([FOLDERS_KEY, PLAYLISTS_KEY]).then(([fEntry, pEntry]) => {
      if (fEntry[1]) setFolders(JSON.parse(fEntry[1]));
      if (pEntry[1]) setPlaylists(JSON.parse(pEntry[1]));
    });
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

  const setPlaylistCover = useCallback((playlistId: string, uri: string) => {
    updatePlaylists((prev) =>
      prev.map((p) => p.id === playlistId ? { ...p, coverUri: uri } : p)
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
        addFolderToFolder,
        removeFolderFromFolder,
        removeFromFolder,
        deleteFolder,
        isInFolder,
        createPlaylist,
        renamePlaylist,
        setPlaylistCover,
        addToPlaylist,
        removeFromPlaylist,
        deletePlaylist,
        isInPlaylist,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}
