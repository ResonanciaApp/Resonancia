import React, { createContext, useContext } from "react";
import { useDescansoPlayer } from "@/hooks/useDescansoPlayer";

type DescansoPlayerCtx = ReturnType<typeof useDescansoPlayer> & {
  timerMinutes: number | null;
  setTimerMinutes: (v: number | null) => void;
  fadeVolume: boolean;
  setFadeVolume: (v: boolean) => void;
  isExpanded: boolean;
  setIsExpanded: (v: boolean) => void;
};

const DescansoPlayerContext = createContext<DescansoPlayerCtx | null>(null);

export function DescansoPlayerProvider({ children }: { children: React.ReactNode }) {
  const [timerMinutes, setTimerMinutes] = React.useState<number | null>(null);
  const [fadeVolume, setFadeVolume] = React.useState(false);
  const [isExpanded, setIsExpanded] = React.useState(false);

  const player = useDescansoPlayer({ timerMinutes: timerMinutes ?? 0, fadeVolume });

  return (
    <DescansoPlayerContext.Provider value={{ ...player, timerMinutes, setTimerMinutes, fadeVolume, setFadeVolume, isExpanded, setIsExpanded }}>
      {children}
    </DescansoPlayerContext.Provider>
  );
}

export function useDescansoPlayerContext() {
  const ctx = useContext(DescansoPlayerContext);
  if (!ctx) throw new Error("useDescansoPlayerContext must be inside DescansoPlayerProvider");
  return ctx;
}
