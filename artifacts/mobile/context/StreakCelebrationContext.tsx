import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { usePlayer, type StatEvent } from "@/context/PlayerContext";
import { useMilestones } from "@/context/MilestonesContext";
import { computeCurrentStreak, computeWeekFlags, dayKey } from "@/utils/stats";

// ── Celebración de "día de racha completado" ─────────────────────────────────
// Cuando un evento de escucha hace pasar el día de HOY de incompleto a completo
// (meta de minutos o sesión completada), se abre el flujo de celebración de dos
// pantallas (StreakCelebrationFlow). Solo una vez por día (persistido).
// Mientras el flujo está abierto se retienen las celebraciones de hitos
// (setCelebrationHold) para que no se pisen los modales.

const CELEBRATED_KEY = "@resonance_streak_day_celebrated";
export const REMINDER_SLOT_KEY = "@resonance_reminder_slot";

export interface StreakFlowInfo {
  sessionId: string;
  /** Minutos del evento que completó el día. */
  minutes: number;
  /** Racha actual (incluye hoy) al momento de completar. */
  streak: number;
}

interface StreakCelebrationCtx {
  flow: StreakFlowInfo | null;
  closeFlow: () => void;
  /** La pantalla de sesión pregunta esto antes de abrir su popup de estrellas:
   *  si la celebración se encargó de la calificación, se suprime el popup. */
  shouldSuppressRating: (sessionId: string) => boolean;
  /** Herramienta de prueba: abre el flujo con la última sesión escuchada,
   *  SIN marcar el día como celebrado (la celebración real sigue intacta). */
  previewFlow: () => void;
}

const Ctx = createContext<StreakCelebrationCtx | null>(null);

function todayActive(events: StatEvent[]): boolean {
  const { flags, todayIndex } = computeWeekFlags(events);
  return flags[todayIndex] === true;
}

export function StreakCelebrationProvider({ children }: { children: React.ReactNode }) {
  const { statEvents, lastLocalStat } = usePlayer();
  const { setCelebrationHold } = useMilestones();

  const [flow, setFlow] = useState<StreakFlowInfo | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const celebratedDayRef = useRef<string | null>(null);
  const processedSeqRef = useRef(0);
  const flowOpenRef = useRef(false);
  const suppressRef = useRef<{ sessionId: string; at: number } | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(CELEBRATED_KEY)
      .then((v) => {
        celebratedDayRef.current = v;
      })
      .catch(() => {})
      .finally(() => setHydrated(true));
  }, []);

  // Solo reacciona a eventos registrados LOCALMENTE (lastLocalStat se setea
  // únicamente en recordStat). La hidratación y el merge con la nube nunca lo
  // tocan, así que no hay falsos positivos al relanzar la app ni al sincronizar.
  useEffect(() => {
    if (!hydrated || !lastLocalStat) return;
    if (lastLocalStat.seq <= processedSeqRef.current) return;
    processedSeqRef.current = lastLocalStat.seq;

    const event = lastLocalStat.event;
    if (!event.sessionId) return;

    const today = dayKey(new Date());
    if (celebratedDayRef.current === today) return;

    // Estado del día ANTES y DESPUÉS de este evento local (misma referencia
    // de objeto que recordStat insertó al frente de statEvents).
    const before = statEvents.filter((e) => e !== event);
    if (todayActive(before)) return; // el día ya estaba completado
    if (!todayActive(statEvents)) return; // aún no se completa

    celebratedDayRef.current = today;
    void AsyncStorage.setItem(CELEBRATED_KEY, today);
    suppressRef.current = { sessionId: event.sessionId, at: Date.now() };
    flowOpenRef.current = true;
    setCelebrationHold(true);
    setFlow({
      sessionId: event.sessionId,
      minutes: Math.max(1, event.minutes ?? 1),
      streak: Math.max(1, computeCurrentStreak(statEvents)),
    });
  }, [lastLocalStat, statEvents, hydrated, setCelebrationHold]);

  const closeFlow = useCallback(() => {
    flowOpenRef.current = false;
    setFlow(null);
    // Libera las celebraciones de hitos retenidas (se muestran DESPUÉS).
    setCelebrationHold(false);
  }, [setCelebrationHold]);

  const previewFlow = useCallback(() => {
    const newest = statEvents.find((e) => e.sessionId);
    if (newest) suppressRef.current = { sessionId: newest.sessionId, at: Date.now() };
    flowOpenRef.current = true;
    setCelebrationHold(true);
    setFlow({
      sessionId: newest?.sessionId ?? "",
      minutes: Math.max(1, newest?.minutes ?? 3),
      streak: Math.max(1, computeCurrentStreak(statEvents)),
    });
  }, [statEvents, setCelebrationHold]);

  const shouldSuppressRating = useCallback((sessionId: string) => {
    const s = suppressRef.current;
    if (!s || s.sessionId !== sessionId) return false;
    // Válido mientras el flujo siga abierto o por una ventana corta después
    // (el popup de la pantalla de sesión llega ~800 ms tras el fin).
    return flowOpenRef.current || Date.now() - s.at < 60 * 1000;
  }, []);

  const value = useMemo(
    () => ({ flow, closeFlow, shouldSuppressRating, previewFlow }),
    [flow, closeFlow, shouldSuppressRating, previewFlow],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStreakCelebration() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStreakCelebration must be used within StreakCelebrationProvider");
  return ctx;
}
