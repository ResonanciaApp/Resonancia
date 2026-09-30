/**
 * Fuente única de verdad para la racha del usuario.
 *
 * Prefiere el endpoint server-authoritative (/me/streak) cuando el usuario
 * está autenticado. Cae en cómputo local (statEvents) cuando no hay sesión
 * o el fetch aún no resolvió, de forma que la UI nunca queda vacía.
 *
 * Cualquier pantalla o componente que necesite racha/semana debe importar
 * de aquí — nunca llamar directamente a computeCurrentStreak/computeWeekFlags.
 */

import { useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { getGetMyStreakQueryOptions, useGetMyStreak } from "@workspace/api-client-react";
import { usePlayer } from "@/context/PlayerContext";
import {
  computeCurrentStreak,
  computeMaxStreak,
  computeWeekFlags,
  computeTotalActiveDays,
  computeCompletedWeekStarts,
  mergeCompletedWeekStarts,
} from "@/utils/stats";
import { useDayRollover } from "@/hooks/useDayRollover";

export interface StreakData {
  currentStreak: number;
  maxStreak: number;
  weekFlags: boolean[];
  weekCount: number;
  todayIndex: number;
  totalActiveDays: number;
  completedWeeks: number;
}

export function useStreak(): StreakData {
  const { isSignedIn } = useAuth();
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const serverQuery = useGetMyStreak(
    { tz },
    {
      query: {
        queryKey: getGetMyStreakQueryOptions({ tz }).queryKey,
        enabled: !!isSignedIn,
        staleTime: 5 * 60_000,
      },
    },
  );

  const { statEvents } = usePlayer();
  const todayKey = useDayRollover();

  const local = useMemo(() => {
    const { flags, weekCount, todayIndex } = computeWeekFlags(statEvents);
    const completedWeekStarts = computeCompletedWeekStarts(statEvents);
    return {
      currentStreak: computeCurrentStreak(statEvents),
      maxStreak: computeMaxStreak(statEvents),
      weekFlags: flags,
      weekCount,
      todayIndex,
      totalActiveDays: computeTotalActiveDays(statEvents),
      completedWeekStarts,
      completedWeeks: completedWeekStarts.length,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statEvents, todayKey]);

  const d = serverQuery.data;
  if (d) {
    const weekFlags = d.weekFlags.map((flag, index) => flag || local.weekFlags[index]);
    return {
      currentStreak: Math.max(d.currentStreak, local.currentStreak),
      maxStreak: Math.max(d.maxStreak, local.maxStreak),
      weekFlags,
      weekCount: weekFlags.filter(Boolean).length,
      todayIndex: d.todayIndex,
      totalActiveDays: Math.max(d.totalActiveDays, local.totalActiveDays),
      completedWeeks: mergeCompletedWeekStarts(local.completedWeekStarts, d.completedWeekStarts ?? [], weekFlags).length,
    };
  }

  return local;
}
