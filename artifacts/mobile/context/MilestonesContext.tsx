import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "@/context/AuthContext";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { MILESTONES, type MilestoneDef } from "@/data/milestones";
import { usePlayer } from "@/context/PlayerContext";
import { useMixer } from "@/context/MixerContext";
import {
  readGeometrixCount,
  subscribeGeometrixCount,
} from "@/hooks/useGeometrixCreations";
import { useDayRollover } from "@/hooks/useDayRollover";
import {
  computeCurrentStreak,
  computeMaxStreak,
  computeTotalActiveDays,
} from "@/utils/stats";
import { deleteMilestoneCloud, syncMilestones } from "@/lib/cloudSync";

const STORAGE_KEY = "@resonance_milestones";
/** Contadores de POR VIDA de creaciones (mezclas / Geometrix). Borrar un ítem
 *  no resta progreso: el hito es "creaste N", no "tienes N guardadas". */
const COUNTERS_KEY = "@resonance_creation_counters";

interface LifetimeCounter {
  lifetime: number;
  lastSeen: number;
}
interface Counters {
  mezclas: LifetimeCounter;
  geometrix: LifetimeCounter;
}

export interface MilestoneStatus extends MilestoneDef {
  /** ISO cuando se consiguió; undefined si sigue pendiente. */
  unlockedAt?: string;
  /** Avance actual hacia el umbral (capado al umbral). */
  progress: number;
}

interface MilestonesCtx {
  /** Los 12 hitos con su estado (mismo orden que la definición). */
  statuses: MilestoneStatus[];
  /** Hito pendiente de celebrar (cabeza de la cola) o null. */
  celebrating: MilestoneStatus | null;
  /** Cierra la celebración actual y muestra la siguiente si hay. */
  dismissCelebration: () => void;
  /** Vista previa de diseño: muestra la celebración de un hito SIN marcarlo. */
  previewMilestone: (id: string) => void;
  /** Herramienta de prueba: borra un hito conseguido (local + nube) y rebaja
   *  el contador de su familia para poder volver a ganarlo con la celebración. */
  resetMilestone: (id: string) => void;
  /** Retiene las celebraciones (la cola sigue creciendo, pero no se muestra
   *  nada) mientras otro flujo full-screen está abierto — p. ej. la
   *  celebración de día de racha. Al soltar, se muestran las pendientes. */
  setCelebrationHold: (hold: boolean) => void;
}

const Ctx = createContext<MilestonesCtx | null>(null);

export function MilestonesProvider({ children }: { children: React.ReactNode }) {
  const { statEvents, lastLocalStat } = usePlayer();
  const { presets } = useMixer();
  const { isSignedIn } = useAuth();
  const todayKey = useDayRollover();

  const [geoCount, setGeoCount] = useState(0);
  const [unlocked, setUnlocked] = useState<Record<string, string>>({});
  const [counters, setCounters] = useState<Counters | null>(null);
  const [hydrated, setHydrated] = useState(false);
  // La evaluación (y por lo tanto las celebraciones) espera a que el merge con
  // la nube se resuelva, para NO re-celebrar hitos que ya existían en la cuenta.
  const [cloudSettled, setCloudSettled] = useState(false);
  const [queue, setQueue] = useState<string[]>([]);
  const [celebrationHold, setCelebrationHold] = useState(false);
  // Hitos "dormidos" tras un reset de prueba (familias racha/dias, cuyo
  // progreso no se puede rebajar): no se re-evalúan hasta la PRÓXIMA escucha
  // registrada localmente; si no, se re-desbloquean al instante.
  const [suppressedIds, setSuppressedIds] = useState<ReadonlySet<string>>(new Set());
  const syncedRef = useRef(false);

  // ── Hidratación local ───────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const [rawUnlocked, rawCounters, count] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY),
          AsyncStorage.getItem(COUNTERS_KEY),
          readGeometrixCount(),
        ]);
        if (rawUnlocked) setUnlocked(JSON.parse(rawUnlocked) as Record<string, string>);
        setGeoCount(count);
        setCounters(
          rawCounters
            ? (JSON.parse(rawCounters) as Counters)
            : {
                mezclas: { lifetime: 0, lastSeen: 0 },
                geometrix: { lifetime: 0, lastSeen: 0 },
              },
        );
      } catch {
        setCounters({
          mezclas: { lifetime: 0, lastSeen: 0 },
          geometrix: { lifetime: 0, lastSeen: 0 },
        });
      } finally {
        setHydrated(true);
      }
    })();
    return subscribeGeometrixCount(setGeoCount);
  }, []);

  // ── Merge con la nube (unión append-only) ──────────────────────────────────
  // Igual que PlayerContext: gateado por isSignedIn (cuando flipa a true el
  // token getter ya está instalado). Al cerrar sesión se permite re-sincronizar
  // en el próximo login. Sin cuenta, se evalúa solo con lo local.
  useEffect(() => {
    if (!hydrated) return;
    if (!isSignedIn) {
      syncedRef.current = false;
      setCloudSettled(true);
      return;
    }
    if (syncedRef.current) return;
    syncedRef.current = true;

    let cancelled = false;
    (async () => {
      const raw = (await AsyncStorage.getItem(STORAGE_KEY)) ?? "{}";
      const merged = await syncMilestones(JSON.parse(raw) as Record<string, string>);
      if (cancelled) return;
      setUnlocked((prev) => {
        const next = { ...merged, ...prev };
        void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return next;
      });
      setCloudSettled(true);
    })().catch(() => {
      if (!cancelled) setCloudSettled(true); // offline: seguimos en local
    });
    return () => {
      cancelled = true;
    };
  }, [hydrated, isSignedIn]);

  // ── Contadores de por vida ─────────────────────────────────────────────────
  // Si el conteo actual sube respecto del último visto, la diferencia son
  // creaciones nuevas (aunque antes se hayan borrado otras).
  useEffect(() => {
    if (!hydrated || !counters) return;
    const observe = (c: LifetimeCounter, current: number): LifetimeCounter => {
      // Solo crece por DELTAS (creaciones nuevas desde lo último visto).
      // Sin piso Math.max(lifetime, current): eso re-subía el contador tras
      // un reset manual de hito mientras aún existan creaciones guardadas.
      const lifetime =
        current > c.lastSeen ? c.lifetime + (current - c.lastSeen) : c.lifetime;
      return { lifetime, lastSeen: current };
    };
    const next: Counters = {
      mezclas: observe(counters.mezclas, presets.length),
      geometrix: observe(counters.geometrix, geoCount),
    };
    if (
      next.mezclas.lifetime !== counters.mezclas.lifetime ||
      next.mezclas.lastSeen !== counters.mezclas.lastSeen ||
      next.geometrix.lifetime !== counters.geometrix.lifetime ||
      next.geometrix.lastSeen !== counters.geometrix.lastSeen
    ) {
      setCounters(next);
      void AsyncStorage.setItem(COUNTERS_KEY, JSON.stringify(next));
    }
  }, [hydrated, counters, presets.length, geoCount]);

  // ── Progreso actual por familia ────────────────────────────────────────────
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const familyProgress = useMemo(
    () => ({
      racha: Math.max(computeCurrentStreak(statEvents), computeMaxStreak(statEvents)),
      dias: computeTotalActiveDays(statEvents),
      mezclas: counters?.mezclas.lifetime ?? 0,
      geometrix: counters?.geometrix.lifetime ?? 0,
    }),
    [statEvents, counters, todayKey],
  );

  // ── Evaluación: detectar hitos recién cumplidos (una sola vez cada uno) ────
  useEffect(() => {
    if (!hydrated || !cloudSettled || !counters) return;
    const now = new Date().toISOString();
    const fresh = MILESTONES.filter(
      (m) =>
        !unlocked[m.id] &&
        !suppressedIds.has(m.id) &&
        familyProgress[m.family] >= m.threshold,
    );
    if (fresh.length === 0) return;

    setUnlocked((prev) => {
      const next = { ...prev };
      for (const m of fresh) next[m.id] = now;
      void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      void syncMilestones(next);
      return next;
    });

    // Si varios niveles de la misma familia se cumplen A LA VEZ (p. ej. usuario
    // antiguo con 20 mezclas), se celebra solo el más alto; los inferiores
    // quedan registrados en silencio. En uso normal cada nivel se cruza en
    // momentos distintos y cada uno tiene su propia celebración.
    const byFamily = new Map<string, MilestoneDef>();
    for (const m of fresh) {
      const cur = byFamily.get(m.family);
      if (!cur || m.threshold > cur.threshold) byFamily.set(m.family, m);
    }
    setQueue((q) => [...q, ...Array.from(byFamily.values(), (m) => m.id)]);
  }, [hydrated, cloudSettled, counters, familyProgress, unlocked, suppressedIds]);

  // La supresión se levanta con la PRÓXIMA escucha registrada localmente:
  // ese nuevo evento vuelve a "cruzar" el umbral y celebra normalmente.
  useEffect(() => {
    if (!lastLocalStat) return;
    setSuppressedIds((prev) => (prev.size ? new Set() : prev));
  }, [lastLocalStat]);

  const dismissCelebration = useCallback(() => setQueue((q) => q.slice(1)), []);

  const previewMilestone = useCallback((id: string) => {
    setQueue((q) => (q.includes(id) ? q : [...q, id]));
  }, []);

  const resetMilestone = useCallback((id: string) => {
    const def = MILESTONES.find((m) => m.id === id);
    if (!def) return;
    // 1) Quitar el desbloqueo local y en la nube
    setUnlocked((prev) => {
      if (!prev[id]) return prev;
      const next = { ...prev };
      delete next[id];
      void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
    void deleteMilestoneCloud(id);
    // 2) Para racha/dias el progreso no se puede rebajar (deriva del historial
    //    de escucha): dormir el hito hasta la próxima escucha local, si no se
    //    re-desbloquea (y celebra) al instante.
    if (def.family === "racha" || def.family === "dias") {
      setSuppressedIds((prev) => new Set(prev).add(id));
    }
    // 3) Para familias de creaciones, rebajar el contador de por vida justo
    //    bajo el umbral: la PRÓXIMA creación vuelve a cruzarlo y celebra.
    if (def.family === "mezclas" || def.family === "geometrix") {
      setCounters((prev) => {
        if (!prev) return prev;
        const fam = prev[def.family as "mezclas" | "geometrix"];
        if (fam.lifetime < def.threshold) return prev;
        const next: Counters = {
          ...prev,
          [def.family]: { lifetime: def.threshold - 1, lastSeen: fam.lastSeen },
        };
        void AsyncStorage.setItem(COUNTERS_KEY, JSON.stringify(next));
        return next;
      });
    }
  }, []);

  const statuses = useMemo<MilestoneStatus[]>(
    () =>
      MILESTONES.map((m) => ({
        ...m,
        unlockedAt: unlocked[m.id],
        progress: Math.min(familyProgress[m.family], m.threshold),
      })),
    [unlocked, familyProgress],
  );

  const celebrating = useMemo(() => {
    if (celebrationHold) return null;
    const id = queue[0];
    return id ? (statuses.find((s) => s.id === id) ?? null) : null;
  }, [queue, statuses, celebrationHold]);

  const value = useMemo(
    () => ({ statuses, celebrating, dismissCelebration, previewMilestone, resetMilestone, setCelebrationHold }),
    [statuses, celebrating, dismissCelebration, previewMilestone, resetMilestone],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useMilestones() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useMilestones must be used within MilestonesProvider");
  return ctx;
}
