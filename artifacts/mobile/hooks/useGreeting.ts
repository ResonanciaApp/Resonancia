import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getGetGreetingQueryKey,
  useGetGreeting,
} from "@workspace/api-client-react";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AppState } from "react-native";
import {
  getAutomaticGreeting,
  isValidGreetingSetting,
  millisecondsUntilNextGreetingBoundary,
  resolveGreeting,
  type RemoteGreeting,
} from "@/lib/greeting";

export {
  getAutomaticGreeting,
  isValidGreetingSetting,
  millisecondsUntilNextGreetingBoundary,
  resolveGreeting,
};
export type { RemoteGreeting };
export const GREETING_CACHE_KEY = "@resonancia/active-greeting";

export async function readGreetingCache(): Promise<RemoteGreeting | null> {
  try {
    const raw = await AsyncStorage.getItem(GREETING_CACHE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    return isValidGreetingSetting(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export async function persistGreetingResponse(setting: RemoteGreeting): Promise<void> {
  try {
    if (setting.enabled && typeof setting.text === "string" && setting.text.trim()) {
      await AsyncStorage.setItem(GREETING_CACHE_KEY, JSON.stringify({
        enabled: true,
        text: setting.text.trim(),
      }));
    } else {
      // A valid disabled response deliberately invalidates the previous override.
      await AsyncStorage.removeItem(GREETING_CACHE_KEY);
    }
  } catch {
    // The in-memory response remains authoritative for this app session.
  }
}

export function useGreeting(): string {
  const query = useGetGreeting({
    query: {
      queryKey: getGetGreetingQueryKey(),
      staleTime: Infinity,
      refetchOnWindowFocus: false,
      retry: false,
    },
  });
  const [cached, setCached] = useState<RemoteGreeting | null>(null);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let mounted = true;
    void readGreetingCache().then((value) => {
      if (mounted) setCached(value);
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isValidGreetingSetting(query.data)) return;
    setCached(query.data);
    void persistGreetingResponse(query.data);
  }, [query.data]);

  const refresh = useCallback(() => {
    void query.refetch();
    setNow(new Date());
  }, [query.refetch]);

  useFocusEffect(useCallback(() => {
    refresh();
  }, [refresh]));

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") refresh();
    });
    return () => subscription.remove();
  }, [refresh]);

  useEffect(() => {
    const timer = setTimeout(
      () => setNow(new Date()),
      millisecondsUntilNextGreetingBoundary(now),
    );
    return () => clearTimeout(timer);
  }, [now]);

  return useMemo(
    () => resolveGreeting(query.data, cached, now),
    [cached, now, query.data],
  );
}