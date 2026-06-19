import { useMemo } from "react";
import { usePlayer } from "@/context/PlayerContext";
import { computeCurrentStreak, computeActiveDays, formatMinutes } from "@/utils/stats";

export interface DrawerStats {
  sessions: number;
  totalTime: string;
  activeDays: number;
  streak: number;
}

export function useDrawerStats(): DrawerStats {
  const { history, statEvents } = usePlayer();

  return useMemo(() => {
    const sessions = history.length;
    const totalMinutes = Math.round(statEvents.reduce((s, e) => s + e.minutes, 0));
    const totalTime = formatMinutes(totalMinutes);
    const activeDays = computeActiveDays(statEvents);
    const streak = computeCurrentStreak(statEvents);
    return { sessions, totalTime, activeDays, streak };
  }, [history, statEvents]);
}
