import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useSyncExternalStore } from "react";

const STORAGE_KEY = "@resonance_favorite_theme_collections_v1";

let favoriteThemeIds: string[] = [];
let hydrated = false;
let hydrationPromise: Promise<void> | null = null;
const listeners = new Set<() => void>();

function emitChange() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return favoriteThemeIds;
}

function getHydrationSnapshot() {
  return hydrated;
}

function sanitizeIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((id): id is string => typeof id === "string" && id.length > 0))];
}

function hydrate() {
  if (hydrationPromise) return hydrationPromise;
  hydrationPromise = AsyncStorage.getItem(STORAGE_KEY)
    .then((raw) => {
      favoriteThemeIds = sanitizeIds(raw ? JSON.parse(raw) : []);
    })
    .catch(() => {
      favoriteThemeIds = [];
    })
    .finally(() => {
      hydrated = true;
      emitChange();
    });
  return hydrationPromise;
}

export function useFavoriteThemeCollections() {
  const ids = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const isHydrated = useSyncExternalStore(subscribe, getHydrationSnapshot, getHydrationSnapshot);

  useEffect(() => {
    void hydrate();
  }, []);

  const toggleFavoriteTheme = useCallback(async (id: string) => {
    await hydrate();
    const next = favoriteThemeIds.includes(id)
      ? favoriteThemeIds.filter((candidate) => candidate !== id)
      : [...favoriteThemeIds, id];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    favoriteThemeIds = next;
    emitChange();
  }, []);

  return {
    favoriteThemeIds: ids,
    isHydrated,
    toggleFavoriteTheme,
  };
}