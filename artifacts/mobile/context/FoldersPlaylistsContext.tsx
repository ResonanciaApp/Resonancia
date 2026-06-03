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
  createFolder: (name: string) => Folder;
  addToFolder: (folderId: string, sessionId: string) => void;
  removeFromFolder: (folderId: string, sessionId: string) => void;
  deleteFolder: (folderId: string) => void;
  isInFolder: (folderId: string, sessionId: string) => boolean;
  // Playlists
  createPlaylist: (name: string) => Playlist;
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

  // Persist helpers
  const saveFolders = useCallback((updated: Folder[]) => {
    setFolders(updated);
    AsyncStorage.setItem(FOLDERS_KEY, JSON.stringify(updated));
  }, []);

  const savePlaylists = useCallback((updated: Playlist[]) => {
    setPlaylists(updated);
    AsyncStorage.setItem(PLAYLISTS_KEY, JSON.stringify(updated));
  }, []);

  // ── Folders ──────────────────────────────────────────────────────────────

  const createFolder = useCallback((name: string): Folder => {
    const folder: Folder = {
      id: `folder_${Date.now()}`,
      name: name.trim(),
      sessionIds: [],
      createdAt: new Date().toISOString(),
    };
    saveFolders([...folders, folder]);
    return folder;
  }, [folders, saveFolders]);

  const addToFolder = useCallback((folderId: string, sessionId: string) => {
    saveFolders(folders.map((f) =>
      f.id === folderId && !f.sessionIds.includes(sessionId)
        ? { ...f, sessionIds: [...f.sessionIds, sessionId] }
        : f
    ));
  }, [folders, saveFolders]);

  const removeFromFolder = useCallback((folderId: string, sessionId: string) => {
    saveFolders(folders.map((f) =>
      f.id === folderId
        ? { ...f, sessionIds: f.sessionIds.filter((id) => id !== sessionId) }
        : f
    ));
  }, [folders, saveFolders]);

  const deleteFolder = useCallback((folderId: string) => {
    saveFolders(folders.filter((f) => f.id !== folderId));
  }, [folders, saveFolders]);

  const isInFolder = useCallback((folderId: string, sessionId: string) =>
    folders.find((f) => f.id === folderId)?.sessionIds.includes(sessionId) ?? false,
  [folders]);

  // ── Playlists ─────────────────────────────────────────────────────────────

  const createPlaylist = useCallback((name: string): Playlist => {
    const pl: Playlist = {
      id: `playlist_${Date.now()}`,
      name: name.trim(),
      sessionIds: [],
      createdAt: new Date().toISOString(),
    };
    savePlaylists([...playlists, pl]);
    return pl;
  }, [playlists, savePlaylists]);

  const addToPlaylist = useCallback((playlistId: string, sessionId: string) => {
    savePlaylists(playlists.map((p) =>
      p.id === playlistId && !p.sessionIds.includes(sessionId)
        ? { ...p, sessionIds: [...p.sessionIds, sessionId] }
        : p
    ));
  }, [playlists, savePlaylists]);

  const removeFromPlaylist = useCallback((playlistId: string, sessionId: string) => {
    savePlaylists(playlists.map((p) =>
      p.id === playlistId
        ? { ...p, sessionIds: p.sessionIds.filter((id) => id !== sessionId) }
        : p
    ));
  }, [playlists, savePlaylists]);

  const deletePlaylist = useCallback((playlistId: string) => {
    savePlaylists(playlists.filter((p) => p.id !== playlistId));
  }, [playlists, savePlaylists]);

  const isInPlaylist = useCallback((playlistId: string, sessionId: string) =>
    playlists.find((p) => p.id === playlistId)?.sessionIds.includes(sessionId) ?? false,
  [playlists]);

  return (
    <Ctx.Provider value={{
      folders, playlists,
      createFolder, addToFolder, removeFromFolder, deleteFolder, isInFolder,
      createPlaylist, addToPlaylist, removeFromPlaylist, deletePlaylist, isInPlaylist,
    }}>
      {children}
    </Ctx.Provider>
  );
}
