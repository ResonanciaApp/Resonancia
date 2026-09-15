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
import { type MixPreset, useMixer } from "@/context/MixerContext";
import { usePlayer } from "@/context/PlayerContext";
import { usePremium } from "@/context/PremiumContext";
import type { Session } from "@/data/sessions";
import { useLoadMix } from "@/hooks/useLoadMix";

type AmbientalDurationContextValue = {
  openForSession: (session: Session) => boolean;
  openForMix: (mix: MixPreset) => void;
};

type DurationTarget =
  | { kind: "session"; session: Session }
  | { kind: "mix"; mix: MixPreset };

const AmbientalDurationContext =
  createContext<AmbientalDurationContextValue | null>(null);

export function AmbientalDurationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [target, setTarget] = useState<DurationTarget | null>(null);
  const [activeTarget, setActiveTarget] = useState<DurationTarget | null>(null);
  const [activeMinutes, setActiveMinutes] = useState(0);
  const pendingPlaybackRef = useRef<{
    target: DurationTarget;
    minutes: number;
  } | null>(null);
  const { isPremium } = usePremium();
  const { playSessionWithDuration } = usePlayer();
  const { setSleepTimer } = useMixer();
  const loadMix = useLoadMix();

  const openForSession = useCallback((candidate: Session) => {
    if (candidate.categoryId !== "ambientales") return false;
    pendingPlaybackRef.current = null;
    setTarget({ kind: "session", session: candidate });
    return true;
  }, []);

  const openForMix = useCallback((mix: MixPreset) => {
    pendingPlaybackRef.current = null;
    setTarget({ kind: "mix", mix });
  }, []);

  const close = useCallback(() => {
    pendingPlaybackRef.current = null;
    setTarget(null);
  }, []);

  const start = useCallback(
    (minutes: number) => {
      const selectedTarget = target;
      if (!selectedTarget) return;

      if (selectedTarget.kind === "session") {
        pendingPlaybackRef.current = { target: selectedTarget, minutes };
        setTarget(null);
        void playSessionWithDuration(selectedTarget.session, minutes);
        return;
      }

      if (!loadMix(selectedTarget.mix)) return;
      setSleepTimer(minutes);
      pendingPlaybackRef.current = { target: selectedTarget, minutes };
      setTarget(null);
    },
    [loadMix, playSessionWithDuration, setSleepTimer, target],
  );

  const handleSheetDismissed = useCallback(() => {
    const pending = pendingPlaybackRef.current;
    if (!pending) return;
    pendingPlaybackRef.current = null;
    setActiveTarget(pending.target);
    setActiveMinutes(pending.minutes);
  }, []);

  const closePlayer = useCallback(() => {
    pendingPlaybackRef.current = null;
    setActiveTarget(null);
    setActiveMinutes(0);
  }, []);

  const value = useMemo(
    () => ({ openForSession, openForMix }),
    [openForMix, openForSession],
  );

  return (
    <AmbientalDurationContext.Provider value={value}>
      {children}
      <AmbientalDurationSheet
        visible={target !== null}
        sessionTitle={
          target?.kind === "session" ? target.session.title : target?.mix.name
        }
        isPremium={isPremium}
        onClose={close}
        onDismissed={handleSheetDismissed}
        onStart={start}
      />
      <AmbientalPlayer
        visible={activeTarget !== null}
        session={activeTarget?.kind === "session" ? activeTarget.session : null}
        mix={activeTarget?.kind === "mix" ? activeTarget.mix : null}
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