/**
 * VideosContext — estado local de videos:
 *  - Favoritos de videos (@resonance_video_favorites)
 *  - Carpetas de videos (@resonance_video_folders), con subcarpetas
 *  - Temporizador de reposo para el reproductor de video (runtime, no persiste)
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const FAVORITES_KEY = "@resonance_video_favorites";
const FOLDERS_KEY = "@resonance_video_folders";

export type VideoFolder = {
  id: string;
  name: string;
  videoIds: string[];
  subFolderIds: string[];
  createdAt: string;
  pinned?: boolean;
};

type VideosState = {
  // Favoritos
  favoriteVideoIds: string[];
  isVideoFavorite: (videoId: string) => boolean;
  toggleVideoFavorite: (videoId: string) => void;

  // Carpetas
  videoFolders: VideoFolder[];
  createVideoFolder: (name: string, initialVideoId?: string, parentId?: string) => VideoFolder;
  renameVideoFolder: (folderId: string, name: string) => void;
  deleteVideoFolder: (folderId: string) => void;
  addVideoToFolder: (folderId: string, videoId: string) => void;
  removeVideoFromFolder: (folderId: string, videoId: string) => void;
  isVideoInFolder: (folderId: string, videoId: string) => boolean;

  // Temporizador (segundos restantes; null = apagado)
  videoTimerRemaining: number | null;
  setVideoTimer: (minutes: number | null) => void;
  timerExpired: boolean;
  clearTimerExpired: () => void;
};

const VideosContext = createContext<VideosState | undefined>(undefined);

export function VideosProvider({ children }: { children: React.ReactNode }) {
  const [favoriteVideoIds, setFavoriteVideoIds] = useState<string[]>([]);
  const [videoFolders, setVideoFolders] = useState<VideoFolder[]>([]);
  const [videoTimerRemaining, setVideoTimerRemaining] = useState<number | null>(null);
  const [timerExpired, setTimerExpired] = useState(false);
  const loadedRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Carga inicial ──────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const [favRaw, folRaw] = await Promise.all([
          AsyncStorage.getItem(FAVORITES_KEY),
          AsyncStorage.getItem(FOLDERS_KEY),
        ]);
        if (favRaw) {
          const parsed = JSON.parse(favRaw);
          if (Array.isArray(parsed)) {
            const loaded = parsed.map(String);
            // Merge: si el usuario ya marcó favoritos antes de hidratar, no pisarlos
            setFavoriteVideoIds((prev) =>
              prev.length === 0 ? loaded : Array.from(new Set([...loaded, ...prev])),
            );
          }
        }
        if (folRaw) {
          const parsed = JSON.parse(folRaw);
          if (Array.isArray(parsed)) {
            const loaded: VideoFolder[] = parsed
              .filter((f) => f && typeof f === "object" && typeof f.id === "string")
              .map((f) => ({
                id: String(f.id),
                name: typeof f.name === "string" ? f.name : "Carpeta",
                videoIds: Array.isArray(f.videoIds) ? f.videoIds.map(String) : [],
                subFolderIds: Array.isArray(f.subFolderIds) ? f.subFolderIds.map(String) : [],
                createdAt: typeof f.createdAt === "string" ? f.createdAt : new Date().toISOString(),
                pinned: !!f.pinned,
              }));
            // Merge: las carpetas creadas antes de hidratar (en memoria) ganan por id
            setVideoFolders((prev) => {
              if (prev.length === 0) return loaded;
              const prevIds = new Set(prev.map((f) => f.id));
              return [...loaded.filter((f) => !prevIds.has(f.id)), ...prev];
            });
          }
        }
      } catch {
        // silent — arranca vacío
      } finally {
        loadedRef.current = true;
      }
    })();
  }, []);

  // ── Persistencia ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!loadedRef.current) return;
    AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(favoriteVideoIds)).catch(() => {});
  }, [favoriteVideoIds]);

  useEffect(() => {
    if (!loadedRef.current) return;
    AsyncStorage.setItem(FOLDERS_KEY, JSON.stringify(videoFolders)).catch(() => {});
  }, [videoFolders]);

  // ── Favoritos ──────────────────────────────────────────────────────────────
  const isVideoFavorite = useCallback(
    (videoId: string) => favoriteVideoIds.includes(videoId),
    [favoriteVideoIds],
  );

  const toggleVideoFavorite = useCallback((videoId: string) => {
    setFavoriteVideoIds((prev) =>
      prev.includes(videoId) ? prev.filter((id) => id !== videoId) : [...prev, videoId],
    );
  }, []);

  // ── Carpetas ───────────────────────────────────────────────────────────────
  const createVideoFolder = useCallback(
    (name: string, initialVideoId?: string, parentId?: string): VideoFolder => {
      const folder: VideoFolder = {
        id: `vf_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        name,
        videoIds: initialVideoId ? [initialVideoId] : [],
        subFolderIds: [],
        createdAt: new Date().toISOString(),
      };
      setVideoFolders((prev) => {
        const next = [...prev, folder];
        if (parentId) {
          return next.map((f) =>
            f.id === parentId && !f.subFolderIds.includes(folder.id)
              ? { ...f, subFolderIds: [...f.subFolderIds, folder.id] }
              : f,
          );
        }
        return next;
      });
      return folder;
    },
    [],
  );

  const renameVideoFolder = useCallback((folderId: string, name: string) => {
    setVideoFolders((prev) => prev.map((f) => (f.id === folderId ? { ...f, name } : f)));
  }, []);

  const deleteVideoFolder = useCallback((folderId: string) => {
    setVideoFolders((prev) =>
      prev
        .filter((f) => f.id !== folderId)
        .map((f) =>
          f.subFolderIds.includes(folderId)
            ? { ...f, subFolderIds: f.subFolderIds.filter((id) => id !== folderId) }
            : f,
        ),
    );
  }, []);

  const addVideoToFolder = useCallback((folderId: string, videoId: string) => {
    setVideoFolders((prev) =>
      prev.map((f) =>
        f.id === folderId && !f.videoIds.includes(videoId)
          ? { ...f, videoIds: [...f.videoIds, videoId] }
          : f,
      ),
    );
  }, []);

  const removeVideoFromFolder = useCallback((folderId: string, videoId: string) => {
    setVideoFolders((prev) =>
      prev.map((f) =>
        f.id === folderId ? { ...f, videoIds: f.videoIds.filter((id) => id !== videoId) } : f,
      ),
    );
  }, []);

  const isVideoInFolder = useCallback(
    (folderId: string, videoId: string) =>
      (videoFolders.find((f) => f.id === folderId)?.videoIds ?? []).includes(videoId),
    [videoFolders],
  );

  // ── Temporizador ───────────────────────────────────────────────────────────
  const setVideoTimer = useCallback((minutes: number | null) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (minutes === null) {
      setVideoTimerRemaining(null);
      return;
    }
    setTimerExpired(false);
    setVideoTimerRemaining(minutes * 60);
    intervalRef.current = setInterval(() => {
      setVideoTimerRemaining((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          setTimerExpired(true);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const clearTimerExpired = useCallback(() => setTimerExpired(false), []);

  useEffect(
    () => () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    },
    [],
  );

  const value = useMemo<VideosState>(
    () => ({
      favoriteVideoIds,
      isVideoFavorite,
      toggleVideoFavorite,
      videoFolders,
      createVideoFolder,
      renameVideoFolder,
      deleteVideoFolder,
      addVideoToFolder,
      removeVideoFromFolder,
      isVideoInFolder,
      videoTimerRemaining,
      setVideoTimer,
      timerExpired,
      clearTimerExpired,
    }),
    [
      favoriteVideoIds,
      isVideoFavorite,
      toggleVideoFavorite,
      videoFolders,
      createVideoFolder,
      renameVideoFolder,
      deleteVideoFolder,
      addVideoToFolder,
      removeVideoFromFolder,
      isVideoInFolder,
      videoTimerRemaining,
      setVideoTimer,
      timerExpired,
      clearTimerExpired,
    ],
  );

  return <VideosContext.Provider value={value}>{children}</VideosContext.Provider>;
}

export function useVideosState(): VideosState {
  const ctx = useContext(VideosContext);
  if (!ctx) throw new Error("useVideosState debe usarse dentro de VideosProvider");
  return ctx;
}
