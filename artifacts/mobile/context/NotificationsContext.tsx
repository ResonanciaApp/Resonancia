import { useAuth as useClerkAuth } from "@clerk/expo";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  getGetUnreadNotificationCountQueryKey,
  useGetUnreadNotificationCount,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

interface NotificationsCtx {
  unreadCount: number;
  shouldAnimate: boolean;
  clearAnimation: () => void;
  forceAnimate: () => void;
  refetchCount: () => void;
  devSeedAndAnimate: () => Promise<void>;
}

const Ctx = createContext<NotificationsCtx>({
  unreadCount: 0,
  shouldAnimate: false,
  clearAnimation: () => {},
  forceAnimate: () => {},
  refetchCount: () => {},
  devSeedAndAnimate: async () => {},
});

export function useNotifications() {
  return useContext(Ctx);
}

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { isSignedIn, getToken } = useClerkAuth();
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const prevCountRef = useRef(0);
  const qc = useQueryClient();

  const countQ = useGetUnreadNotificationCount({
    query: {
      queryKey: getGetUnreadNotificationCountQueryKey(),
      enabled: !!isSignedIn,
      refetchInterval: 60_000,
    },
  });

  const unreadCount = countQ.data?.count ?? 0;

  useEffect(() => {
    if (unreadCount > prevCountRef.current) {
      setShouldAnimate(true);
    }
    prevCountRef.current = unreadCount;
  }, [unreadCount]);

  const clearAnimation = useCallback(() => {
    setShouldAnimate(false);
  }, []);

  const forceAnimate = useCallback(() => {
    setShouldAnimate(true);
  }, []);

  const refetchCount = useCallback(() => {
    qc.invalidateQueries({ queryKey: getGetUnreadNotificationCountQueryKey() });
  }, [qc]);

  const devSeedAndAnimate = useCallback(async () => {
    try {
      const token = await getToken();
      await fetch("/api/notifications/seed-dev", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    } catch {
      // en DEV — ignorar errores de red
    }
    qc.invalidateQueries({ queryKey: getGetUnreadNotificationCountQueryKey() });
    setShouldAnimate(true);
  }, [getToken, qc]);

  return (
    <Ctx.Provider value={{ unreadCount, shouldAnimate, clearAnimation, forceAnimate, refetchCount, devSeedAndAnimate }}>
      {children}
    </Ctx.Provider>
  );
}
