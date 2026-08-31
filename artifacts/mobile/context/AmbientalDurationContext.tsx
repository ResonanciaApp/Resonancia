import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";

import { AmbientalDurationSheet } from "@/components/AmbientalDurationSheet";
import { AmbientalPlayer } from "@/components/AmbientalPlayer";
import { usePlayer } from "@/context/PlayerContext";
import { usePremium } from "@/context/PremiumContext";
import type { Session } from "@/data/sessions";

type AmbientalDurationContextValue = {
  openForSession: (session: Session) => boolean;
};

const AmbientalDurationContext =
  createContext<AmbientalDurationContextValue | null>(null);

export function AmbientalDurationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, setSession] = useState<Session | null>(null);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [activeMinutes, setActiveMinutes] = useState(0);
  const pendingPlaybackRef = useRef<{
    session: Session;
    minutes: number;
  } | null>(null);
  const { isPremium } = usePremium();
  const { playSessionWithDuration } = usePlayer();

  const openForSession = useCallback((candidate: Session) => {
    if (candidate.categoryId !== "ambientales") return false;
    setSession(candidate);
    return true;
  }, []);

  const close = useCallback(() => {
    setSession(null);
  }, []);

  const start = useCallback(
    (minutes: number) => {
      const selectedSession = session;
      setSession(null);
      if (selectedSession) {
        pendingPlaybackRef.current = {
          session: selectedSession,
          minutes,
        };
        void playSessionWithDuration(selectedSession, minutes);
      }
    },
    [playSessionWithDuration, session],
  );

  const handleSheetDismissed = useCallback(() => {
    const pending = pendingPlaybackRef.current;
    if (!pending) return;
    pendingPlaybackRef.current = null;
    setActiveSession(pending.session);
    setActiveMinutes(pending.minutes);
  }, []);

  const closePlayer = useCallback(() => {
    pendingPlaybackRef.current = null;
    setActiveSession(null);
    setActiveMinutes(0);
  }, []);

  const value = useMemo(() => ({ openForSession }), [openForSession]);

  return (
    <AmbientalDurationContext.Provider value={value}>
      {children}
      <AmbientalDurationSheet
        visible={session !== null}
        sessionTitle={session?.title}
        isPremium={isPremium}
        onClose={close}
        onDismissed={handleSheetDismissed}
        onStart={start}
      />
      <AmbientalPlayer
        visible={activeSession !== null}
        session={activeSession}
        initialMinutes={activeMinutes}
        onClose={closePlayer}
      />
    </AmbientalDurationContext.Provider>
  );
}

export function useAmbientalDuration() {
  const context = useContext(AmbientalDurationContext);
  if (!context) {
    throw new Error(
      "useAmbientalDuration must be used inside AmbientalDurationProvider",
    );
  }
  return context;
}