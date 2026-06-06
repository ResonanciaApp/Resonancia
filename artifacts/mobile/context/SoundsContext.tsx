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

export function SoundsProvider({ children }: { children: React.ReactNode }) {
  const [sounds, setSounds] = useState<MixSound[]>(LOCAL_SOUNDS);
  const [loaded, setLoaded] = useState(false);

  const fetchAndMerge = useCallback(async () => {
    try {
      const res = await fetch("/api/sounds");
      if (!res.ok) return;
      const data = (await res.json()) as {
        sounds: {
          id: string;
          name: string;
          categoryId: string;
          iconName: string;
          iconSet: string;
          isPremium: boolean;
          isActive: boolean;
          objectPath: string | null;
        }[];
      };

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
        }));

      // Actualiza isPremium para los locales que cambiaron en la DB.
      const premiumOverrides = new Map(
        data.sounds.map((s) => [s.id, s.isPremium])
      );
      const merged: MixSound[] = [
        ...LOCAL_SOUNDS.map((s) =>
          premiumOverrides.has(s.id)
            ? { ...s, isPremium: premiumOverrides.get(s.id)! }
            : s
        ),
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
