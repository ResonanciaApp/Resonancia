import AsyncStorage from "@react-native-async-storage/async-storage";
import { PremiumProvider as BasePremiumProvider, usePremium } from "@workspace/premium";
import React from "react";

import {
  initializeRevenueCat,
  SubscriptionProvider,
  useSubscription,
} from "@/lib/revenuecat";

const storage = {
  getItem: (key: string) => AsyncStorage.getItem(key),
  setItem: (key: string, value: string) => AsyncStorage.setItem(key, value),
};

// Configura RevenueCat una sola vez al cargar el módulo, antes de cualquier
// consulta de suscripción. En Expo Go corre en Preview API Mode (mocks). Si las
// llaves todavía no están configuradas, lanza → lo registramos sin romper el
// arranque (la app sigue funcionando como free).
try {
  initializeRevenueCat();
} catch (err) {
  console.warn(
    "[RevenueCat] no se pudo inicializar:",
    err instanceof Error ? err.message : err,
  );
}

function PremiumStateProvider({ children }: { children: React.ReactNode }) {
  const { isSubscribed } = useSubscription();
  return (
    <BasePremiumProvider
      storage={storage}
      subscribed={isSubscribed}
      devToggleEnabled={__DEV__}
    >
      {children}
    </BasePremiumProvider>
  );
}

export function PremiumProvider({ children }: { children: React.ReactNode }) {
  return (
    <SubscriptionProvider>
      <PremiumStateProvider>{children}</PremiumStateProvider>
    </SubscriptionProvider>
  );
}

export { usePremium };
