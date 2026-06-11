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
  sessionIds: string[];
  createdAt: string;
};

export type Playlist = {
  id: string;
  name: string;
  sessionIds: string[]; // ordered
  createdAt: string;
};

interface FoldersPlaylistsCtx {
  folders: Folder[];
  playlists: Playlist[];
  // Folders
  createFolder: (name: string, initialSessionId?: string) => Folder;
  addToFolder: (folderId: string, sessionId: string) => void;
  removeFromFolder: (folderId: string, sessionId: string) => void;
  deleteFolder: (folderId: string) => void;
  isInFolder: (folderId: string, sessionId: string) => boolean;
  // Playlists
  createPlaylist: (name: string, initialSessionId?: string) => Playlist;
  renamePlaylist: (playlistId: string, name: string) => void;
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
      createdAt: new Date().toISOString(),
    };
    updateFolders((prev) => [...prev, folder]);
    return folder;
  }, [updateFolders]);

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
        addToFolder,
        removeFromFolder,
        deleteFolder,
        isInFolder,
        createPlaylist,
        renamePlaylist,
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
