import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "resonancia.premium.v1";

export type PremiumStorage = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
};

export type PremiumState = {
  isPremium: boolean;
  hydrated: boolean;
  setPremium: (v: boolean) => Promise<void>;
};

const PremiumContext = createContext<PremiumState | null>(null);

export function PremiumProvider({
  storage,
  children,
}: {
  storage: PremiumStorage;
  children: React.ReactNode;
}) {
  const [isPremium, setIsPremium] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await storage.getItem(STORAGE_KEY);
        if (raw === "1") setIsPremium(true);
      } catch {}
      setHydrated(true);
    })();
  }, [storage]);

  const setPremium = useCallback(
    async (v: boolean) => {
      setIsPremium(v);
      try {
        await storage.setItem(STORAGE_KEY, v ? "1" : "0");
      } catch {}
    },
    [storage],
  );

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
