import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "cdc_intenciones_guardadas";

type IntencionContextValue = {
  saved: string[];
  addSaved: (text: string) => void;
  removeSaved: (text: string) => void;
  isSaved: (text: string) => boolean;
};

const IntencionContext = createContext<IntencionContextValue>({
  saved: [],
  addSaved: () => {},
  removeSaved: () => {},
  isSaved: () => false,
});

export function IntencionProvider({ children }: { children: React.ReactNode }) {
  const [saved, setSaved] = useState<string[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try {
          setSaved(JSON.parse(raw) as string[]);
        } catch {
          setSaved([]);
        }
      }
    });
  }, []);

  const persist = useCallback((list: string[]) => {
    setSaved(list);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }, []);

  const addSaved = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      setSaved((prev) => {
        if (prev.includes(trimmed)) return prev;
        const next = [trimmed, ...prev];
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return next;
      });
    },
    [],
  );

  const removeSaved = useCallback(
    (text: string) => {
      setSaved((prev) => {
        const next = prev.filter((s) => s !== text);
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return next;
      });
    },
    [],
  );

  const isSaved = useCallback((text: string) => saved.includes(text.trim()), [saved]);

  return (
    <IntencionContext.Provider value={{ saved, addSaved, removeSaved, isSaved }}>
      {children}
    </IntencionContext.Provider>
  );
}

export function useIntencion() {
  return useContext(IntencionContext);
}
