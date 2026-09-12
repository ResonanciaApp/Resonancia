/**
 * SoundsContext — catálogo publicado del mixer.
 *
 * La API es la única fuente de sonidos que se muestran en móvil. Los mapas
 * remotos se mantienen sincronizados aquí para que el motor de audio pueda
 * reproducir el mismo catálogo sin depender de assets bundleados.
 */
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { replaceSoundCatalog, type MixSound } from "@/data/sounds";
import { applyRemoteSounds, resolveRemoteObjectUrl } from "@/lib/remoteSoundMap";

interface SoundsContextValue {
  /** Lista activa publicada por la API. */
  sounds: MixSound[];
  loaded: boolean;
  refresh: () => void;
}

const SoundsContext = createContext<SoundsContextValue>({
  sounds: [],
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
  sortOrder?: number;
  objectPath: string | null;
  thumbnailObjectPath: string | null;
  tags: string[] | null;
  bpm: number | null;
  loopBars: number | null;
  // This field may be absent until the shared generated client is regenerated.
  showInMeditationBackgrounds?: boolean;
}

export function SoundsProvider({ children }: { children: React.ReactNode }) {
  const [sounds, setSounds] = useState<MixSound[]>([]);
  const [loaded, setLoaded] = useState(false);

  const fetchAndMerge = useCallback(async () => {
    try {
      const apiBase = (process.env.EXPO_PUBLIC_API_URL ?? "").replace(/\/+$/, "");
      const res = await fetch(`${apiBase}/api/sounds`);
      if (!res.ok) {
        applyRemoteSounds([]);
        replaceSoundCatalog([]);
        setSounds([]);
        return;
      }
      const body = (await res.json()) as { sounds?: ApiSound[] };
      const remoteSounds = Array.isArray(body.sounds) ? body.sounds : [];

      // Only active API rows participate in the mobile catalog or maps.
      const activeSounds = remoteSounds.filter((s) => s.isActive === true);
      applyRemoteSounds(activeSounds);

      const catalog: MixSound[] = activeSounds
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
        .map((s) => ({
          id: s.id,
          name: s.name,
          icon: s.iconName,
          iconSet: (s.iconSet === "feather" || s.iconSet === "ionicons"
            ? s.iconSet
            : "feather") as "feather" | "ionicons",
          category: s.categoryId as MixSound["category"],
          isPremium: s.isPremium,
          isActive: true,
          showInMeditationBackgrounds: s.showInMeditationBackgrounds === true,
          ...(s.objectPath ? { audioUrl: resolveRemoteObjectUrl(s.objectPath) } : {}),
          ...(s.thumbnailObjectPath
            ? { imageUrl: resolveRemoteObjectUrl(s.thumbnailObjectPath) }
            : {}),
          ...(s.tags && s.tags.length > 0 ? { tags: s.tags as MixSound["tags"] } : {}),
          ...(s.bpm != null ? { bpm: s.bpm as MixSound["bpm"] } : {}),
          ...(s.loopBars != null ? { loopBars: s.loopBars } : {}),
        }));
      replaceSoundCatalog(catalog);
      setSounds(catalog);
    } catch {
      // No local fallback: an error must not resurrect an obsolete catalog.
      applyRemoteSounds([]);
      replaceSoundCatalog([]);
      setSounds([]);
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
