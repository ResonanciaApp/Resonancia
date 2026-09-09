import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

export type RoutineCompletionBannerEvent = {
  id: number;
  previousCount: number;
  nextCount: number;
};

type RoutineCompletionBannerContextValue = {
  activeEvent: RoutineCompletionBannerEvent | null;
  announceCompletion: (previousCount: number, nextCount: number) => void;
  dismissActiveEvent: () => void;
};

const RoutineCompletionBannerContext =
  createContext<RoutineCompletionBannerContextValue | null>(null);

export function RoutineCompletionBannerProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queue, setQueue] = useState<RoutineCompletionBannerEvent[]>([]);
  const nextIdRef = useRef(1);

  const announceCompletion = useCallback((previousCount: number, nextCount: number) => {
    if (nextCount <= previousCount) return;
    const event: RoutineCompletionBannerEvent = {
      id: nextIdRef.current++,
      previousCount,
      nextCount,
    };
    setQueue((current) => [...current, event]);
  }, []);

  const dismissActiveEvent = useCallback(() => {
    setQueue((current) => current.slice(1));
  }, []);

  const value = useMemo(
    () => ({
      activeEvent: queue[0] ?? null,
      announceCompletion,
      dismissActiveEvent,
    }),
    [announceCompletion, dismissActiveEvent, queue],
  );

  return (
    <RoutineCompletionBannerContext.Provider value={value}>
      {children}
    </RoutineCompletionBannerContext.Provider>
  );
}

export function useRoutineCompletionBanner() {
  const value = useContext(RoutineCompletionBannerContext);
  if (!value) {
    throw new Error(
      "useRoutineCompletionBanner must be used within RoutineCompletionBannerProvider",
    );
  }
  return value;
}