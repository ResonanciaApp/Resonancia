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
import AsyncStorage from "@react-native-async-storage/async-storage";
import { replaceSoundCatalog, type MixSound } from "@/data/sounds";
import { applyRemoteSounds, resolveRemoteObjectUrl } from "@/lib/remoteSoundMap";

const SOUND_CATALOG_CACHE_KEY = "@resonance_sound_catalog_v1";

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

  const applySnapshot = useCallback((remoteSounds: ApiSound[]) => {
    // Only active API rows participate in the mobile catalog or maps.
    const activeSounds = remoteSounds.filter((sound) => sound.isActive === true);
    applyRemoteSounds(activeSounds);

    const catalog: MixSound[] = activeSounds
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      .map((sound) => ({
        id: sound.id,
        name: sound.name,
        icon: sound.iconName,
        iconSet: (sound.iconSet === "feather" || sound.iconSet === "ionicons"
          ? sound.iconSet
          : "feather") as "feather" | "ionicons",
        category: sound.categoryId as MixSound["category"],
        isPremium: sound.isPremium,
        isActive: true,
        showInMeditationBackgrounds: sound.showInMeditationBackgrounds === true,
        ...(sound.objectPath
          ? { audioUrl: resolveRemoteObjectUrl(sound.objectPath) }
          : {}),
        ...(sound.thumbnailObjectPath
          ? { imageUrl: resolveRemoteObjectUrl(sound.thumbnailObjectPath) }
          : {}),
        ...(sound.tags && sound.tags.length > 0
          ? { tags: sound.tags as MixSound["tags"] }
          : {}),
        ...(sound.bpm != null ? { bpm: sound.bpm as MixSound["bpm"] } : {}),
        ...(sound.loopBars != null ? { loopBars: sound.loopBars } : {}),
      }));

    replaceSoundCatalog(catalog);
    setSounds(catalog);
  }, []);

  const fetchAndMerge = useCallback(async () => {
    try {
      const apiBase = (process.env.EXPO_PUBLIC_API_URL ?? "").replace(/\/+$/, "");
      const res = await fetch(`${apiBase}/api/sounds`);
      if (!res.ok) {
        // Un fallo transitorio no debe vaciar una grilla que ya estaba cargada.
        // Las bajas reales se aplican cuando llega una respuesta válida de la API.
        return;
      }
      const body = (await res.json()) as { sounds?: ApiSound[] };
      const remoteSounds = Array.isArray(body.sounds) ? body.sounds : [];
      applySnapshot(remoteSounds);
      AsyncStorage.setItem(
        SOUND_CATALOG_CACHE_KEY,
        JSON.stringify(remoteSounds),
      ).catch(() => {});
    } catch {
      // Conserva el último catálogo válido; la próxima apertura vuelve a intentar.
    } finally {
      setLoaded(true);
    }
  }, [applySnapshot]);

  useEffect(() => {
    let cancelled = false;

    const hydrateAndRefresh = async () => {
      try {
        const raw = await AsyncStorage.getItem(SOUND_CATALOG_CACHE_KEY);
        if (raw && !cancelled) {
          const cached = JSON.parse(raw) as unknown;
          if (Array.isArray(cached)) {
            applySnapshot(cached as ApiSound[]);
            setLoaded(true);
          }
        }
      } catch {
        // Un caché inválido no bloquea la actualización desde la API.
      }

      if (!cancelled) {
        await fetchAndMerge();
      }
    };

    void hydrateAndRefresh();
    return () => {
      cancelled = true;
    };
  }, [applySnapshot, fetchAndMerge]);

  return (
    <SoundsContext.Provider value={{ sounds, loaded, refresh: fetchAndMerge }}>
      {children}
    </SoundsContext.Provider>
  );
}

export function useSounds() {
  return useContext(SoundsContext);
}
