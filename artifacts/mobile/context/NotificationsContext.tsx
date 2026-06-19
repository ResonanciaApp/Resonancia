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
}

const Ctx = createContext<NotificationsCtx>({
  unreadCount: 0,
  shouldAnimate: false,
  clearAnimation: () => {},
});

export function useNotifications() {
  return useContext(Ctx);
}

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { isSignedIn } = useClerkAuth();
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const prevCountRef = useRef(0);

  const countQ = useGetUnreadNotificationCount({
    query: {
      queryKey: getGetUnreadNotificationCountQueryKey(),
      enabled: !!isSignedIn,
      refetchInterval: 30_000,
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

  return (
    <Ctx.Provider value={{ unreadCount, shouldAnimate, clearAnimation }}>
      {children}
    </Ctx.Provider>
  );
}
