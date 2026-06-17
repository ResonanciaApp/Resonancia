/**
 * SoundsContext — carga sonidos del mixer desde la API y los fusiona con
 * los sonidos locales hardcodeados. Los sonidos con `objectPath` remoto
 * se registran en REMOTE_SOUND_MAP para que MixerContext los reproduzca.
 */
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { SOUNDS as LOCAL_SOUNDS, type MixSound } from "@/data/sounds";
import { applyRemoteSounds } from "@/lib/remoteSoundMap";

interface SoundsContextValue {
  /** Lista combinada (locales + remotos sin duplicar). */
  sounds: MixSound[];
  loaded: boolean;
  refresh: () => void;
}

const SoundsContext = createContext<SoundsContextValue>({
  sounds: LOCAL_SOUNDS,
  loaded: false,
  refresh: () => {},
});

interface ApiSound {
  id: string;
  name: string;
  categoryId: string;
  iconName: string;
  iconSet: string;
  isPremium: boolean;
  isActive: boolean;
  objectPath: string | null;
  thumbnailObjectPath: string | null;
  tags: string[] | null;
  bpm: number | null;
  loopBars: number | null;
}

export function SoundsProvider({ children }: { children: React.ReactNode }) {
  const [sounds, setSounds] = useState<MixSound[]>(LOCAL_SOUNDS);
  const [loaded, setLoaded] = useState(false);

  const fetchAndMerge = useCallback(async () => {
    try {
      const apiBase = (process.env.EXPO_PUBLIC_API_URL ?? "").replace(/\/+$/, "");
      const res = await fetch(`${apiBase}/api/sounds`);
      if (!res.ok) return;
      const data = (await res.json()) as { sounds: ApiSound[] };

      // Popula el mapa de sonidos remotos (usado por MixerContext).
      applyRemoteSounds(data.sounds);

      // Fusiona con los locales: los remotos que ya existen localmente
      // actualizan solo el campo isPremium; los nuevos se agregan al final.
      const localIds = new Set(LOCAL_SOUNDS.map((s) => s.id));
      const extra: MixSound[] = data.sounds
        .filter((s) => !localIds.has(s.id))
        .map((s) => ({
          id: s.id,
          name: s.name,
          icon: s.iconName,
          iconSet: (s.iconSet === "feather" || s.iconSet === "ionicons"
            ? s.iconSet
            : "feather") as "feather" | "ionicons",
          category: s.categoryId as MixSound["category"],
          isPremium: s.isPremium,
          ...(s.tags && s.tags.length > 0 ? { tags: s.tags as MixSound["tags"] } : {}),
          ...(s.bpm != null ? { bpm: s.bpm as MixSound["bpm"] } : {}),
          ...(s.loopBars != null ? { loopBars: s.loopBars } : {}),
        }));

      // Actualiza isPremium y campos remotizables para los locales.
      const remoteMap = new Map(data.sounds.map((s) => [s.id, s]));
      const merged: MixSound[] = [
        ...LOCAL_SOUNDS.map((s) => {
          const remote = remoteMap.get(s.id);
          if (!remote) return s;
          return {
            ...s,
            isPremium: remote.isPremium,
            ...(remote.bpm != null ? { bpm: remote.bpm as MixSound["bpm"] } : {}),
            ...(remote.loopBars != null ? { loopBars: remote.loopBars } : {}),
            ...(remote.tags && remote.tags.length > 0 ? { tags: remote.tags as MixSound["tags"] } : {}),
          };
        }),
        ...extra,
      ];

      setSounds(merged);
    } catch {
      // Fallo silencioso — se usan los locales
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    void fetchAndMerge();
  }, [fetchAndMerge]);

  return (
    <SoundsContext.Provider value={{ sounds, loaded, refresh: fetchAndMerge }}>
      {children}
    </SoundsContext.Provider>
  );
}

export function useSounds() {
  return useContext(SoundsContext);
}
