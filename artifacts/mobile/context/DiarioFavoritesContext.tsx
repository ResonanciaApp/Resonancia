import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { type DiarioEntry, type DiarioSection } from "@/hooks/useDiario";

const FAV_KEY = "@diario_favorites";

const SECTION_META: Record<DiarioSection, { title: string; accentColor: string }> = {
  aprendizaje: { title: "Qué aprendí hoy",         accentColor: "#C69B4F" },
  suenos:      { title: "Materializo mis sueños",   accentColor: "#E0B882" },
  reflexiones: { title: "Mis reflexiones",          accentColor: "#7EC8E3" },
  ideas:       { title: "Ideas Brillantes",         accentColor: "#F0CC82" },
};

export type FavoriteDiarioEntry = DiarioEntry & {
  sectionKey: DiarioSection;
  sectionTitle: string;
  accentColor: string;
};

type DiarioFavCtx = {
  favoriteIds: string[];
  favoriteEntries: FavoriteDiarioEntry[];
  isFavorited: (id: string) => boolean;
  toggleFavorite: (entry: DiarioEntry, sectionKey: DiarioSection) => Promise<void>;
};

const DiarioFavoritesContext = createContext<DiarioFavCtx | null>(null);

export function DiarioFavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [favoriteEntries, setFavoriteEntries] = useState<FavoriteDiarioEntry[]>([]);

  const loadFavorites = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(FAV_KEY);
      const ids: string[] = raw ? JSON.parse(raw) : [];
      setFavoriteIds(ids);

      if (ids.length === 0) { setFavoriteEntries([]); return; }

      const sections: DiarioSection[] = ["aprendizaje", "suenos", "reflexiones", "ideas"];
      const all: FavoriteDiarioEntry[] = [];
      for (const section of sections) {
        const sr = await AsyncStorage.getItem(`@diario_${section}`);
        if (!sr) continue;
        const entries: DiarioEntry[] = JSON.parse(sr);
        for (const entry of entries) {
          if (ids.includes(entry.id)) {
            all.push({
              ...entry,
              sectionKey: section,
              sectionTitle: SECTION_META[section].title,
              accentColor: SECTION_META[section].accentColor,
            });
          }
        }
      }
      all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setFavoriteEntries(all);
    } catch {
      setFavoriteIds([]);
      setFavoriteEntries([]);
    }
  }, []);

  useEffect(() => { loadFavorites(); }, [loadFavorites]);

  const isFavorited = useCallback((id: string) => favoriteIds.includes(id), [favoriteIds]);

  const toggleFavorite = useCallback(
    async (entry: DiarioEntry, sectionKey: DiarioSection) => {
      const alreadyFav = favoriteIds.includes(entry.id);
      const updatedIds = alreadyFav
        ? favoriteIds.filter((id) => id !== entry.id)
        : [...favoriteIds, entry.id];

      setFavoriteIds(updatedIds);
      await AsyncStorage.setItem(FAV_KEY, JSON.stringify(updatedIds));

      if (alreadyFav) {
        setFavoriteEntries((prev) => prev.filter((e) => e.id !== entry.id));
      } else {
        const newFav: FavoriteDiarioEntry = {
          ...entry,
          sectionKey,
          sectionTitle: SECTION_META[sectionKey].title,
          accentColor: SECTION_META[sectionKey].accentColor,
        };
        setFavoriteEntries((prev) =>
          [newFav, ...prev].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
        );
      }
    },
    [favoriteIds]
  );

  return (
    <DiarioFavoritesContext.Provider
      value={{ favoriteIds, favoriteEntries, isFavorited, toggleFavorite }}
    >
      {children}
    </DiarioFavoritesContext.Provider>
  );
}

export function useDiarioFavoritesCtx() {
  const ctx = useContext(DiarioFavoritesContext);
  if (!ctx) throw new Error("useDiarioFavoritesCtx must be used within DiarioFavoritesProvider");
  return ctx;
}
