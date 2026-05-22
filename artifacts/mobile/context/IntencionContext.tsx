import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

const SAVED_KEY = "cdc_intenciones_guardadas_v2";
const FAVORITES_KEY = "cdc_intenciones_favoritos";
const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

export type SavedEntry = { text: string; savedAt: number };

type IntencionContextValue = {
  savedEntries: SavedEntry[];
  favorites: string[];
  addSaved: (text: string) => void;
  removeSaved: (text: string) => void;
  addFavorite: (text: string) => void;
  removeFavorite: (text: string) => void;
  isFavorite: (text: string) => boolean;
};

const IntencionContext = createContext<IntencionContextValue>({
  savedEntries: [],
  favorites: [],
  addSaved: () => {},
  removeSaved: () => {},
  addFavorite: () => {},
  removeFavorite: () => {},
  isFavorite: () => false,
});

function filterExpired(entries: SavedEntry[]): SavedEntry[] {
  const cutoff = Date.now() - TWENTY_FOUR_HOURS;
  return entries.filter((e) => e.savedAt > cutoff);
}

export function IntencionProvider({ children }: { children: React.ReactNode }) {
  const [savedEntries, setSavedEntries] = useState<SavedEntry[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    AsyncStorage.multiGet([SAVED_KEY, FAVORITES_KEY]).then(([[, rawSaved], [, rawFavs]]) => {
      if (rawSaved) {
        try {
          const parsed = JSON.parse(rawSaved) as SavedEntry[];
          setSavedEntries(filterExpired(parsed));
        } catch {
          setSavedEntries([]);
        }
      }
      if (rawFavs) {
        try {
          setFavorites(JSON.parse(rawFavs) as string[]);
        } catch {
          setFavorites([]);
        }
      }
    });
  }, []);

  const persistSaved = (entries: SavedEntry[]) => {
    const valid = filterExpired(entries);
    setSavedEntries(valid);
    AsyncStorage.setItem(SAVED_KEY, JSON.stringify(valid));
  };

  const persistFavorites = (list: string[]) => {
    setFavorites(list);
    AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(list));
  };

  const addSaved = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setSavedEntries((prev) => {
      const filtered = filterExpired(prev);
      if (filtered.some((e) => e.text === trimmed)) return filtered;
      const next = [{ text: trimmed, savedAt: Date.now() }, ...filtered];
      AsyncStorage.setItem(SAVED_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const removeSaved = useCallback((text: string) => {
    setSavedEntries((prev) => {
      const next = filterExpired(prev).filter((e) => e.text !== text);
      AsyncStorage.setItem(SAVED_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const addFavorite = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    // also remove from saved
    setSavedEntries((prev) => {
      const next = filterExpired(prev).filter((e) => e.text !== trimmed);
      AsyncStorage.setItem(SAVED_KEY, JSON.stringify(next));
      return next;
    });
    setFavorites((prev) => {
      if (prev.includes(trimmed)) return prev;
      const next = [trimmed, ...prev];
      AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const removeFavorite = useCallback((text: string) => {
    setFavorites((prev) => {
      const next = prev.filter((s) => s !== text);
      AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const isFavorite = useCallback((text: string) => favorites.includes(text.trim()), [favorites]);

  return (
    <IntencionContext.Provider value={{ savedEntries, favorites, addSaved, removeSaved, addFavorite, removeFavorite, isFavorite }}>
      {children}
    </IntencionContext.Provider>
  );
}

export function useIntencion() {
  return useContext(IntencionContext);
}
