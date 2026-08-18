import { useMemo } from "react";
import { usePlayer } from "@/context/PlayerContext";
import { computeActiveDays, formatMinutes } from "@/utils/stats";
import { useStreak } from "@/hooks/useStreak";

export interface DrawerStats {
  sessions: number;
  totalTime: string;
  activeDays: number;
  streak: number;
}

export function useDrawerStats(): DrawerStats {
  const { history, statEvents } = usePlayer();
  const { currentStreak } = useStreak();

  return useMemo(() => {
    const sessions = history.length;
    const totalMinutes = Math.round(statEvents.reduce((s, e) => s + e.minutes, 0));
    const totalTime = formatMinutes(totalMinutes);
    const activeDays = computeActiveDays(statEvents);
    return { sessions, totalTime, activeDays, streak: currentStreak };
  }, [history, statEvents, currentStreak]);
}
