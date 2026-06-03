import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "resonancia.premium.v1";

export type PremiumStorage = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
};

export type PremiumState = {
  /** True si el usuario tiene acceso premium (suscripción real o override de desarrollo). */
  isPremium: boolean;
  /** True una vez que el override local de desarrollo terminó de hidratar. */
  hydrated: boolean;
  /** Activa/desactiva el override de desarrollo (solo efectivo cuando devToggleEnabled). */
  setPremium: (v: boolean) => Promise<void>;
  /** Estado actual del override de desarrollo (para el switch de Configuraciones). */
  devOverride: boolean;
  /** Si el toggle de desarrollo está disponible en este build. */
  devToggleEnabled: boolean;
};

const PremiumContext = createContext<PremiumState | null>(null);

export function PremiumProvider({
  storage,
  subscribed = false,
  devToggleEnabled = false,
  children,
}: {
  storage: PremiumStorage;
  /** Fuente de verdad real de la suscripción (p. ej. RevenueCat). */
  subscribed?: boolean;
  /** Habilita el override de desarrollo (solo en builds dev). */
  devToggleEnabled?: boolean;
  children: React.ReactNode;
}) {
  const [devOverride, setDevOverride] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await storage.getItem(STORAGE_KEY);
        if (raw === "1") setDevOverride(true);
      } catch {}
      setHydrated(true);
    })();
  }, [storage]);

  const setPremium = useCallback(
    async (v: boolean) => {
      setDevOverride(v);
      try {
        await storage.setItem(STORAGE_KEY, v ? "1" : "0");
      } catch {}
    },
    [storage],
  );

  // La suscripción real manda; el override solo aplica en builds de desarrollo.
  const isPremium = subscribed || (devToggleEnabled && devOverride);

  return (
    <PremiumContext.Provider
      value={{ isPremium, hydrated, setPremium, devOverride, devToggleEnabled }}
    >
      {children}
    </PremiumContext.Provider>
  );
}

export function usePremium() {
  const ctx = useContext(PremiumContext);
  if (!ctx) throw new Error("usePremium must be used inside PremiumProvider");
  return ctx;
}
