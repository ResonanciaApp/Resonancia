import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const DOWNLOADS_KEY = "@resonance_downloads";

type DownloadsContextType = {
  downloads: string[];
  hydrated: boolean;
  isDownloaded: (id: string) => boolean;
  toggleDownload: (id: string) => void;
  removeDownload: (id: string) => void;
};

const DownloadsContext = createContext<DownloadsContextType | null>(null);

export function DownloadsProvider({ children }: { children: React.ReactNode }) {
  const [downloads, setDownloads] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(DOWNLOADS_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) setDownloads(parsed.filter((x) => typeof x === "string"));
        }
      } catch {
      } finally {
        setHydrated(true);
      }
    })();
  }, []);

  const persist = useCallback((next: string[]) => {
    setDownloads(next);
    AsyncStorage.setItem(DOWNLOADS_KEY, JSON.stringify(next)).catch(() => {});
  }, []);

  const isDownloaded = useCallback(
    (id: string) => downloads.includes(id),
    [downloads],
  );

  const toggleDownload = useCallback(
    (id: string) => {
      setDownloads((prev) => {
        const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
        AsyncStorage.setItem(DOWNLOADS_KEY, JSON.stringify(next)).catch(() => {});
        return next;
      });
    },
    [],
  );

  const removeDownload = useCallback(
    (id: string) => {
      setDownloads((prev) => {
        const next = prev.filter((x) => x !== id);
        AsyncStorage.setItem(DOWNLOADS_KEY, JSON.stringify(next)).catch(() => {});
        return next;
      });
    },
    [],
  );

  const value = useMemo(
    () => ({ downloads, hydrated, isDownloaded, toggleDownload, removeDownload }),
    [downloads, hydrated, isDownloaded, toggleDownload, removeDownload],
  );

  return <DownloadsContext.Provider value={value}>{children}</DownloadsContext.Provider>;
}

export function useDownloads() {
  const ctx = useContext(DownloadsContext);
  if (!ctx) throw new Error("useDownloads must be used within DownloadsProvider");
  return ctx;
}
