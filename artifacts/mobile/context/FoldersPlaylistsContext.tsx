import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getMyLibrary, setMyLibrary } from "@workspace/api-client-react";
import {
  parseActiveMeditationPlaylist,
  pickLatestMeditationPlaylist,
  type ActiveMeditationPlaylist,
} from "@/lib/editorial-playlist-helpers";
import { useAuth } from "@/context/AuthContext";

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

/** Referencia a una playlist del catálogo; nunca se convierte en playlist privada. */
export type EditorialPlaylistLibraryRef = string;

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
  savedEditorialPlaylistIds: EditorialPlaylistLibraryRef[];
  isEditorialPlaylistSaved: (slug: string) => boolean;
  toggleEditorialPlaylist: (slug: string) => void;
  activeMeditationPlaylist: ActiveMeditationPlaylist | null;
  markMeditationPlaylistStarted: (slug: string) => void;
}

// ─── Storage keys ─────────────────────────────────────────────────────────────

const FOLDERS_KEY = "@resonance_folders";
const PLAYLISTS_KEY = "@resonance_playlists";
const REMOVED_DEFAULT_PLAYLIST_IDS = new Set([
  "default_para_empezar",
  "default_calma_profunda",
  "default_sueno_reparador",
]);
const FAV_FOLDERS_KEY = "@resonance_fav_folders";
const PINNED_FAVORITES_KEY = "@resonance_pinned_favorites";
const EDITORIAL_PLAYLISTS_KEY = "@resonance_saved_editorial_playlist_ids";
const ACTIVE_MEDITATION_PLAYLIST_KEY = "@resonance_active_meditation_playlist";

/**
 * Marca de primera sincronización de biblioteca con la nube.
 * En el firstSync hacemos unión local∪server (recuperación tras reinstalar).
 * En las siguientes lo local es autoritativo (los borrados persisten).
 */
const LIBRARY_FIRST_SYNC_KEY = "@resonance_library_first_sync";

// ─── Context ──────────────────────────────────────────────────────────────────

const Ctx = createContext<FoldersPlaylistsCtx | null>(null);

export function useFoldersPlaylists(): FoldersPlaylistsCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useFoldersPlaylists must be inside FoldersPlaylistsProvider");
  return ctx;
}

// ─── Helpers de merge ─────────────────────────────────────────────────────────

function mergeById<T extends { id: string }>(local: T[], server: T[]): T[] {
  const map = new Map<string, T>();
  for (const item of server) map.set(item.id, item);
  // Lo local gana sobre lo del server (más reciente), pero añadimos los que
  // solo están en el server (recuperación tras reinstalar).
  for (const item of local) map.set(item.id, item);
  return Array.from(map.values());
}

function mergeStringArrays(local: string[], server: string[]): string[] {
  return Array.from(new Set([...local, ...server]));
}

function withoutRemovedDefaultPlaylists(items: Playlist[]): Playlist[] {
  return items.filter((playlist) => !REMOVED_DEFAULT_PLAYLIST_IDS.has(playlist.id));
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function FoldersPlaylistsProvider({ children }: { children: React.ReactNode }) {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [favFolders, setFavFolders] = useState<FavFolder[]>([]);
  const [pinnedFavoriteIds, setPinnedFavoriteIds] = useState<string[]>([]);
  const [savedEditorialPlaylistIds, setSavedEditorialPlaylistIds] = useState<string[]>([]);
  const [activeMeditationPlaylist, setActiveMeditationPlaylist] =
    useState<ActiveMeditationPlaylist | null>(null);

  // True mientras se carga desde storage (no empujar al server aún)
  const hydrating = useRef(true);
  // Debounce timer para no saturar el server con un push por cada keystroke
  const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { clerkUserId, isSignedIn } = useAuth();
  const activeMeditationStorageKey =
    `${ACTIVE_MEDITATION_PLAYLIST_KEY}:${clerkUserId ?? "anonymous"}`;

  // ── Carga inicial desde AsyncStorage + merge con server ─────────────────────

  useEffect(() => {
    // Clerk puede resolver la sesión después del primer render. Mantener la
    // hidratación activa mientras cambia evita que el push debounced de una
    // sesión anónima sobrescriba la biblioteca remota antes del merge.
    hydrating.current = true;
    if (pushTimer.current) {
      clearTimeout(pushTimer.current);
      pushTimer.current = null;
    }
    let cancelled = false;
    AsyncStorage.multiGet([
      FOLDERS_KEY,
      PLAYLISTS_KEY,
      FAV_FOLDERS_KEY,
      PINNED_FAVORITES_KEY,
      EDITORIAL_PLAYLISTS_KEY,
      activeMeditationStorageKey,
      LIBRARY_FIRST_SYNC_KEY,
    ]).then(async ([
      fEntry,
      pEntry,
      ffEntry,
      pfEntry,
      editorialEntry,
      activeMeditationEntry,
      firstSyncEntry,
    ]) => {
      if (cancelled) return;
      // ── Folders ──
      const localFolders: Folder[] = fEntry[1] ? JSON.parse(fEntry[1]) : [];

      // ── Playlists ──
      const storedPlaylists: Playlist[] = pEntry[1] ? JSON.parse(pEntry[1]) : [];
      const localPlaylists = withoutRemovedDefaultPlaylists(storedPlaylists);
      if (storedPlaylists.length !== localPlaylists.length) {
        AsyncStorage.setItem(PLAYLISTS_KEY, JSON.stringify(localPlaylists));
      }

      // ── Fav folders & pinned ──
      const localFavFolders: FavFolder[] = ffEntry[1] ? JSON.parse(ffEntry[1]) : [];
      const localPinned: string[] = pfEntry[1] ? JSON.parse(pfEntry[1]) : [];
      const localEditorial: string[] = editorialEntry[1] ? JSON.parse(editorialEntry[1]) : [];
      const localActiveMeditation = parseActiveMeditationPlaylist(
        activeMeditationEntry[1] ? JSON.parse(activeMeditationEntry[1]) : null,
      );

      // ── Sync con server ──────────────────────────────────────────────────────
      if (isSignedIn) {
        try {
          const snap = await getMyLibrary();
           if (cancelled) return;
          const serverFolders = (snap.folders ?? []) as Folder[];
           const serverPlaylists = withoutRemovedDefaultPlaylists(
             (snap.playlists ?? []) as Playlist[],
           );
          const serverFavFolders = (snap.favFolders ?? []) as FavFolder[];
          const serverPinned = (snap.pinnedFavoriteIds ?? []) as string[];
           const serverEditorial = (
             (snap as typeof snap & { savedEditorialPlaylistIds?: unknown }).savedEditorialPlaylistIds ?? []
           ) as string[];
            const serverActiveMeditation = parseActiveMeditationPlaylist(
              snap.activeMeditationPlaylist,
            );

          const firstSync = !firstSyncEntry[1];

          let finalFolders: Folder[];
          let finalPlaylists: Playlist[];
          let finalFavFolders: FavFolder[];
          let finalPinned: string[];
           let finalEditorial: string[];
            let finalActiveMeditation: ActiveMeditationPlaylist | null;

          if (firstSync) {
            // Primera sync de este dispositivo: unión para recuperar datos de la nube
            finalFolders = mergeById(localFolders, serverFolders);
            finalPlaylists = mergeById(localPlaylists, serverPlaylists);
            finalFavFolders = mergeById(localFavFolders, serverFavFolders);
            finalPinned = mergeStringArrays(localPinned, serverPinned);
             finalEditorial = mergeStringArrays(localEditorial, serverEditorial);
              finalActiveMeditation = pickLatestMeditationPlaylist(
                localActiveMeditation,
                serverActiveMeditation,
              );
            await AsyncStorage.setItem(LIBRARY_FIRST_SYNC_KEY, "1");
            // Guardar el resultado fusionado localmente
            AsyncStorage.setItem(FOLDERS_KEY, JSON.stringify(finalFolders));
            AsyncStorage.setItem(PLAYLISTS_KEY, JSON.stringify(finalPlaylists));
            AsyncStorage.setItem(FAV_FOLDERS_KEY, JSON.stringify(finalFavFolders));
            AsyncStorage.setItem(PINNED_FAVORITES_KEY, JSON.stringify(finalPinned));
             AsyncStorage.setItem(EDITORIAL_PLAYLISTS_KEY, JSON.stringify(finalEditorial));
          } else {
            // Syncs siguientes: local es autoritativo
            finalFolders = localFolders;
            finalPlaylists = localPlaylists;
            finalFavFolders = localFavFolders;
            finalPinned = localPinned;
             finalEditorial = localEditorial;
              finalActiveMeditation = pickLatestMeditationPlaylist(
                localActiveMeditation,
                serverActiveMeditation,
              );
          }

            if (finalActiveMeditation) {
              AsyncStorage.setItem(
                activeMeditationStorageKey,
                JSON.stringify(finalActiveMeditation),
              );
              if (
                !serverActiveMeditation ||
                finalActiveMeditation.slug !== serverActiveMeditation.slug ||
                finalActiveMeditation.startedAt !== serverActiveMeditation.startedAt
              ) {
                setMyLibrary({ activeMeditationPlaylist: finalActiveMeditation }).catch(() => {});
              }
            }

          setFolders(finalFolders);
          setPlaylists(finalPlaylists);
          setFavFolders(finalFavFolders);
          setPinnedFavoriteIds(finalPinned);
           setSavedEditorialPlaylistIds(finalEditorial);
            setActiveMeditationPlaylist(finalActiveMeditation);
        } catch {
          // Sin red: usar datos locales
          setFolders(localFolders);
          setPlaylists(localPlaylists);
          setFavFolders(localFavFolders);
          setPinnedFavoriteIds(localPinned);
           setSavedEditorialPlaylistIds(localEditorial);
            setActiveMeditationPlaylist(localActiveMeditation);
        }
      } else {
        setFolders(localFolders);
        setPlaylists(localPlaylists);
        setFavFolders(localFavFolders);
        setPinnedFavoriteIds(localPinned);
         setSavedEditorialPlaylistIds(localEditorial);
          setActiveMeditationPlaylist(localActiveMeditation);
      }

       if (!cancelled) hydrating.current = false;
    });
    return () => {
      cancelled = true;
    };
  }, [activeMeditationStorageKey, clerkUserId, isSignedIn]);

  // ── Push debounced al server cuando cambian los datos ─────────────────────

  useEffect(() => {
    if (hydrating.current || !isSignedIn) return;
    if (pushTimer.current) clearTimeout(pushTimer.current);
    pushTimer.current = setTimeout(() => {
      // El campo savedEditorialPlaylistIds se incorpora al contrato compartido de
      // biblioteca; este cliente antiguo lo envía de forma estructural mientras
      // el paquete generado termina de regenerarse.
      const librarySnapshot = {
        folders,
        playlists,
        favFolders,
        pinnedFavoriteIds,
        savedEditorialPlaylistIds,
      };
      setMyLibrary(librarySnapshot).catch(() => {
        // Sin red: silencioso; se intentará en la siguiente sesión
      });
    }, 1500);
  }, [
    folders,
    playlists,
    favFolders,
    pinnedFavoriteIds,
    savedEditorialPlaylistIds,
    isSignedIn,
  ]);

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

  const updateEditorialPlaylistSlugs = useCallback((updater: (prev: string[]) => string[]) => {
    setSavedEditorialPlaylistIds((prev) => {
      const next = Array.from(new Set(updater(prev)));
      AsyncStorage.setItem(EDITORIAL_PLAYLISTS_KEY, JSON.stringify(next));
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

  const isEditorialPlaylistSaved = useCallback(
    (slug: string) => savedEditorialPlaylistIds.includes(slug),
    [savedEditorialPlaylistIds],
  );

  const toggleEditorialPlaylist = useCallback((slug: string) => {
    updateEditorialPlaylistSlugs((prev) =>
      prev.includes(slug) ? prev.filter((item) => item !== slug) : [slug, ...prev],
    );
  }, [updateEditorialPlaylistSlugs]);

  const markMeditationPlaylistStarted = useCallback((slug: string) => {
    const next = { slug, startedAt: new Date().toISOString() };
    setActiveMeditationPlaylist(next);
    AsyncStorage.setItem(activeMeditationStorageKey, JSON.stringify(next)).catch(() => {});
    if (isSignedIn) {
      setMyLibrary({ activeMeditationPlaylist: next }).catch(() => {});
    }
  }, [activeMeditationStorageKey, isSignedIn]);

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
         savedEditorialPlaylistIds,
         isEditorialPlaylistSaved,
         toggleEditorialPlaylist,
         activeMeditationPlaylist,
         markMeditationPlaylistStarted,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}
