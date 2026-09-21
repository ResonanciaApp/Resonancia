import AsyncStorage from "@react-native-async-storage/async-storage";
import { PremiumProvider as BasePremiumProvider, usePremium } from "@workspace/premium";
import React, { useEffect, useState } from "react";
import { AppState } from "react-native";

import {
  initializeRevenueCat,
  SubscriptionProvider,
  useSubscription,
} from "@/lib/revenuecat";

const storage = {
  getItem: (key: string) => AsyncStorage.getItem(key),
  setItem: (key: string, value: string) => AsyncStorage.setItem(key, value),
};
const VERIFIED_SUBSCRIPTION_KEY = "resonancia.subscription.verified.v1";
type CachedSubscription = {
  active: boolean;
  expiresAt: string | null;
  appUserId: string;
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
  const { subscriptionStatus, customerInfo } = useSubscription();
  const [cachedSubscription, setCachedSubscription] = useState<CachedSubscription | null>(null);
  const [subscriptionCacheLoaded, setSubscriptionCacheLoaded] = useState(false);
  const [cacheNow, setCacheNow] = useState(() => Date.now());

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(VERIFIED_SUBSCRIPTION_KEY)
      .then((value) => {
        if (!active) return;
        if (!value) return;
        try {
          const parsed = JSON.parse(value) as CachedSubscription;
          if (
            typeof parsed.active === "boolean"
            && typeof parsed.appUserId === "string"
            && (parsed.expiresAt === null || typeof parsed.expiresAt === "string")
          ) {
            setCachedSubscription(parsed);
          }
        } catch {
          void AsyncStorage.removeItem(VERIFIED_SUBSCRIPTION_KEY);
        }
      })
      .finally(() => {
        if (active) setSubscriptionCacheLoaded(true);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (subscriptionStatus === "unknown" || !customerInfo) return;
    const verifiedActive = subscriptionStatus === "active";
    const entitlement = customerInfo.entitlements.active.premium;
    const verified: CachedSubscription = {
      active: verifiedActive,
      expiresAt: verifiedActive
        ? entitlement?.expirationDate
          ?? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        : null,
      appUserId: customerInfo.originalAppUserId,
    };
    setCachedSubscription(verified);
    void AsyncStorage.setItem(VERIFIED_SUBSCRIPTION_KEY, JSON.stringify(verified));
  }, [customerInfo, subscriptionStatus]);

  useEffect(() => {
    if (subscriptionStatus !== "unknown" || !cachedSubscription?.expiresAt) return;
    const refreshValidity = () => setCacheNow(Date.now());
    const remaining = Date.parse(cachedSubscription.expiresAt) - Date.now();
    const timeout =
      remaining > 0
        ? setTimeout(refreshValidity, Math.min(remaining + 250, 2_147_000_000))
        : null;
    const appStateSubscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") refreshValidity();
    });
    return () => {
      if (timeout) clearTimeout(timeout);
      appStateSubscription.remove();
    };
  }, [cacheNow, cachedSubscription?.expiresAt, subscriptionStatus]);

  if (!subscriptionCacheLoaded && subscriptionStatus === "unknown") {
    return null;
  }

  const cachedAccessIsValid =
    cachedSubscription?.active === true
    && typeof cachedSubscription.expiresAt === "string"
    && Date.parse(cachedSubscription.expiresAt) > cacheNow;
  const isSubscribed =
    subscriptionStatus === "active"
    || (subscriptionStatus === "unknown" && cachedAccessIsValid);
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
