import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "resonancia.premium.v1";

type PremiumState = {
  isPremium: boolean;
  hydrated: boolean;
  setPremium: (v: boolean) => Promise<void>;
};

const PremiumContext = createContext<PremiumState | null>(null);

export function PremiumProvider({ children }: { children: React.ReactNode }) {
  const [isPremium, setIsPremium] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw === "1") setIsPremium(true);
      } catch {}
      setHydrated(true);
    })();
  }, []);

  const setPremium = useCallback(async (v: boolean) => {
    setIsPremium(v);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, v ? "1" : "0");
    } catch {}
  }, []);

  return (
    <PremiumContext.Provider value={{ isPremium, hydrated, setPremium }}>
      {children}
    </PremiumContext.Provider>
  );
}

export function usePremium() {
  const ctx = useContext(PremiumContext);
  if (!ctx) throw new Error("usePremium must be used inside PremiumProvider");
  return ctx;
}
