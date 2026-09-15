import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  canMutateRoutineDate,
  completeRoutineDate,
  getRoutineDateKey,
  getRoutineOccurrenceKey,
  skipRoutineDate,
} from "@/lib/routineLogic";
export {
  getRoutineDateFromKey,
  getRoutineDateKey,
  getRoutineWeekday,
  isRoutineActivityScheduledForDate,
  canMutateRoutineDate,
  getRoutineOccurrenceKey,
  hasRoutineDateEntry,
} from "@/lib/routineLogic";

const STORAGE_KEY = "@resonance_routine_v1";
const RESET_MARKER_KEY = "@resonance_routine_reset_2026_09_09";

export const ROUTINE_DAY_LABELS = ["L", "M", "X", "J", "V", "S", "D"] as const;
export const ROUTINE_CATEGORY_TABS = [
  "Sugerido",
  "Practicar",
  "Dormir",
  "Autocuidado",
  "Días difíciles",
  "Gratitud",
  "Seres queridos",
] as const;

export type RoutineCategory = (typeof ROUTINE_CATEGORY_TABS)[number];

export interface RoutineActivity {
  id: string;
  title: string;
  description: string;
  category: RoutineCategory;
  repeatDays: number[];
  repeatEnabled: boolean;
  timesPerDay: number;
  completedDates: string[];
  skippedDates: string[];
  archivedAt: string | null;
  createdAt: string;
}

export interface RoutineActivityInput {
  title: string;
  description?: string;
  category: RoutineCategory;
  repeatDays: number[];
  repeatEnabled?: boolean;
  timesPerDay?: number;
}

interface RutinaContextValue {
  activities: RoutineActivity[];
  isHydrated: boolean;
  lastAddedId: string | null;
  addActivity: (input: RoutineActivityInput) => RoutineActivity;
  updateActivityDescription: (activityId: string, description: string) => void;
  completeActivity: (activityId: string, dateKey?: string, occurrenceIndex?: number) => void;
  clearCompletedActivitiesForDate: (dateKey?: string) => void;
  skipActivity: (activityId: string, dateKey?: string, occurrenceIndex?: number) => void;
  archiveActivity: (activityId: string) => void;
  toggleActivity: (activityId: string, dateKey?: string, occurrenceIndex?: number) => void;
  reorderActivities: (orderedActivityIds: string[]) => void;
  isActivityCompleted: (activity: RoutineActivity, dateKey?: string, occurrenceIndex?: number) => boolean;
  isActivitySkipped: (activity: RoutineActivity, dateKey?: string, occurrenceIndex?: number) => boolean;
  getActivityById: (activityId: string) => RoutineActivity | undefined;
}

const RutinaContext = createContext<RutinaContextValue | null>(null);

function normalizeDateList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return Array.from(
    new Set(value.filter((date): date is string => typeof date === "string")),
  ).sort();
}

function normalizeTimesPerDay(value: unknown): number {
  return typeof value === "number" && Number.isInteger(value)
    ? Math.max(1, Math.min(12, value))
    : 1;
}

const SUGGESTION_GROUPS: Record<RoutineCategory, string[]> = {
  Sugerido: [
    "Meditar",
    "Relajarme sin pantallas",
    "Comer algo nutritivo",
    "Celebrar las pequeñas victorias",
    "Apreciar un momento de tranquilidad",
    "Dedicar tiempo a conectar",
    "Ver cómo está un amigo",
  ],
  Practicar: [
    "Meditar",
    "Practicar la respiración",
    "Practicar yoga",
    "Dar un paseo consciente",
    "Entonar cánticos",
    "Repetir un mantra",
    "Escribir en un diario",
  ],
  Dormir: [
    "Relajarme sin pantallas",
    "Preparar mi espacio para dormir",
    "Agradecer el día",
    "Respirar lentamente antes de acostarme",
  ],
  Autocuidado: [
    "Tomar suficiente agua",
    "Comer algo nutritivo",
    "Mover y estirar mi cuerpo",
    "Regalarme un momento de descanso",
  ],
  "Días difíciles": [
    "Celebrar las pequeñas victorias",
    "Pedir ayuda cuando la necesite",
    "Respirar y volver al presente",
    "Hablarme con amabilidad",
  ],
  Gratitud: [
    "Anotar tres cosas que agradezco",
    "Apreciar un momento de tranquilidad",
    "Reconocer algo bueno del día",
  ],
  "Seres queridos": [
    "Dedicar tiempo a conectar",
    "Ver cómo está un amigo",
    "Enviar un mensaje cariñoso",
  ],
};

const SUGGESTED_CATEGORY_BY_TITLE: Record<
  (typeof SUGGESTION_GROUPS.Sugerido)[number],
  Exclude<RoutineCategory, "Sugerido">
> = {
  "Meditar": "Practicar",
  "Relajarme sin pantallas": "Dormir",
  "Comer algo nutritivo": "Autocuidado",
  "Celebrar las pequeñas victorias": "Días difíciles",
  "Apreciar un momento de tranquilidad": "Gratitud",
  "Dedicar tiempo a conectar": "Seres queridos",
  "Ver cómo está un amigo": "Seres queridos",
};

export const ROUTINE_SUGGESTIONS = ROUTINE_CATEGORY_TABS.reduce(
  (groups, category) => {
    groups[category] = SUGGESTION_GROUPS[category].map((title) => ({
      title,
      category:
        category === "Sugerido"
          ? SUGGESTED_CATEGORY_BY_TITLE[title]
          : category,
    }));
    return groups;
  },
  {} as Record<RoutineCategory, { title: string; category: RoutineCategory }[]>,
);

export function getRoutineActivityCategory(
  activity: Pick<RoutineActivity, "title" | "category">,
): Exclude<RoutineCategory, "Sugerido"> | null {
  if (activity.category !== "Sugerido") return activity.category;
  return (
    SUGGESTED_CATEGORY_BY_TITLE[
      activity.title as keyof typeof SUGGESTED_CATEGORY_BY_TITLE
    ] ?? null
  );
}

function normalizeActivity(value: unknown): RoutineActivity | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Partial<RoutineActivity>;
  if (typeof item.id !== "string" || typeof item.title !== "string" || !item.title.trim()) {
    return null;
  }

  const repeatDays = Array.isArray(item.repeatDays)
    ? Array.from(
        new Set(
          item.repeatDays.filter(
            (day): day is number =>
              typeof day === "number" && Number.isInteger(day) && day >= 0 && day <= 6,
          ),
        ),
      ).sort((a, b) => a - b)
    : [];

  const storedCategory = ROUTINE_CATEGORY_TABS.includes(item.category as RoutineCategory)
    ? (item.category as RoutineCategory)
    : "Sugerido";
  const category =
    storedCategory === "Sugerido"
      ? SUGGESTED_CATEGORY_BY_TITLE[
          item.title.trim() as keyof typeof SUGGESTED_CATEGORY_BY_TITLE
        ] ?? storedCategory
      : storedCategory;

  return {
    id: item.id,
    title: item.title.trim(),
    description: typeof item.description === "string" ? item.description : "",
    category,
    repeatDays,
    repeatEnabled: item.repeatEnabled !== false,
    timesPerDay: normalizeTimesPerDay(item.timesPerDay),
    completedDates: normalizeDateList(item.completedDates),
    skippedDates: normalizeDateList(item.skippedDates),
    archivedAt: typeof item.archivedAt === "string" ? item.archivedAt : null,
    createdAt: typeof item.createdAt === "string" ? item.createdAt : new Date().toISOString(),
  };
}

function activityIdentity(activity: RoutineActivity): string {
  return JSON.stringify([
    activity.title.trim().toLocaleLowerCase("es"),
    activity.description.trim().toLocaleLowerCase("es"),
    activity.category,
    activity.repeatEnabled,
    activity.repeatDays,
    activity.timesPerDay,
  ]);
}

export function deduplicateRoutineActivities(
  activities: RoutineActivity[],
): RoutineActivity[] {
  const byIdentity = new Map<string, RoutineActivity>();
  for (const activity of activities) {
    const identity = activityIdentity(activity);
    const existing = byIdentity.get(identity);
    if (!existing) {
      byIdentity.set(identity, activity);
      continue;
    }
    const completedDates = normalizeDateList([
      ...existing.completedDates,
      ...activity.completedDates,
    ]);
    const skippedDates = normalizeDateList([
      ...existing.skippedDates,
      ...activity.skippedDates,
    ]).filter((date) => !completedDates.includes(date));
    byIdentity.set(identity, {
      ...existing,
      completedDates,
      skippedDates,
      createdAt:
        existing.createdAt <= activity.createdAt
          ? existing.createdAt
          : activity.createdAt,
      archivedAt:
        existing.archivedAt && activity.archivedAt
          ? existing.archivedAt >= activity.archivedAt
            ? existing.archivedAt
            : activity.archivedAt
          : null,
    });
  }
  return Array.from(byIdentity.values());
}

export function RutinaProvider({ children }: { children: ReactNode }) {
  const [activities, setActivities] = useState<RoutineActivity[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [lastAddedId, setLastAddedId] = useState<string | null>(null);
  const hydratedRef = useRef(false);
  const persistTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestActivitiesRef = useRef<RoutineActivity[]>([]);
  const persistQueueRef = useRef<Promise<void>>(Promise.resolve());
  const enqueuePersist = useCallback((snapshot: RoutineActivity[]) => {
    persistQueueRef.current = persistQueueRef.current
      .catch(() => {})
      .then(() =>
        AsyncStorage.multiSet([
          [STORAGE_KEY, JSON.stringify(snapshot)],
          [RESET_MARKER_KEY, "complete"],
        ]),
      );
    return persistQueueRef.current;
  }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      AsyncStorage.getItem(STORAGE_KEY),
      AsyncStorage.getItem(RESET_MARKER_KEY),
    ])
      .then(async ([raw, migrationMarker]) => {
        if (cancelled) return;
        let normalized: RoutineActivity[] = [];
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              const validActivities = parsed
                .map(normalizeActivity)
                .filter((item): item is RoutineActivity => item !== null);
              normalized =
                migrationMarker === "complete"
                  ? validActivities
                  : deduplicateRoutineActivities(validActivities);
            }
          } catch {
            normalized = [];
          }
        }
        latestActivitiesRef.current = normalized;
        setActivities(normalized);
        await enqueuePersist(normalized);
        if (cancelled) return;
        hydratedRef.current = true;
        setIsHydrated(true);
      })
      .catch(() => {
        if (!cancelled) {
          hydratedRef.current = true;
          setIsHydrated(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [enqueuePersist]);

  useEffect(() => {
    if (!hydratedRef.current) return;
    latestActivitiesRef.current = activities;
    if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
    persistTimerRef.current = setTimeout(() => {
      persistTimerRef.current = null;
      void enqueuePersist(latestActivitiesRef.current);
    }, 350);
  }, [activities, enqueuePersist]);

  useEffect(
    () => () => {
      if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
      if (hydratedRef.current) {
        void enqueuePersist(latestActivitiesRef.current);
      }
    },
    [enqueuePersist],
  );

  const addActivity = useCallback((input: RoutineActivityInput) => {
    const activity: RoutineActivity = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      title: input.title.trim(),
      description: input.description?.trim() ?? "",
      category: input.category,
      repeatDays: Array.from(new Set(input.repeatDays)).sort((a, b) => a - b),
      repeatEnabled: input.repeatEnabled !== false,
      timesPerDay: normalizeTimesPerDay(input.timesPerDay),
      completedDates: [],
      skippedDates: [],
      archivedAt: null,
      createdAt: new Date().toISOString(),
    };
    setActivities((current) => [...current, activity]);
    setLastAddedId(activity.id);
    return activity;
  }, []);

  const updateActivityDescription = useCallback((activityId: string, description: string) => {
    const normalizedDescription = description.trim();
    setActivities((current) =>
      current.map((activity) =>
        activity.id === activityId
          ? { ...activity, description: normalizedDescription }
          : activity,
      ),
    );
  }, []);

  const completeActivity = useCallback(
    (activityId: string, dateKey = getRoutineDateKey(), occurrenceIndex = 0) => {
      setActivities((current) =>
        current.map((activity) => {
          if (activity.id !== activityId) return activity;
          if (occurrenceIndex < 0 || occurrenceIndex >= activity.timesPerDay) return activity;
          if (!canMutateRoutineDate(activity, dateKey)) return activity;
          const occurrenceKey = getRoutineOccurrenceKey(dateKey, occurrenceIndex);
          return completeRoutineDate(activity, occurrenceKey);
        }),
      );
    },
    [],
  );

  const clearCompletedActivitiesForDate = useCallback((dateKey = getRoutineDateKey()) => {
    setActivities((current) =>
      current.map((activity) => {
        const completedDates = activity.completedDates.filter(
          (entry) => entry !== dateKey && !entry.startsWith(`${dateKey}#`),
        );
        return completedDates.length === activity.completedDates.length
          ? activity
          : { ...activity, completedDates };
      }),
    );
  }, []);

  const skipActivity = useCallback(
    (activityId: string, dateKey = getRoutineDateKey(), occurrenceIndex = 0) => {
      setActivities((current) =>
        current.map((activity) => {
          if (activity.id !== activityId) return activity;
          if (occurrenceIndex < 0 || occurrenceIndex >= activity.timesPerDay) return activity;
          if (!canMutateRoutineDate(activity, dateKey)) return activity;
          const occurrenceKey = getRoutineOccurrenceKey(dateKey, occurrenceIndex);
          return skipRoutineDate(activity, occurrenceKey);
        }),
      );
    },
    [],
  );

  const archiveActivity = useCallback((activityId: string) => {
    const archivedAt = new Date().toISOString();
    setActivities((current) =>
      current.map((activity) =>
        activity.id === activityId && !activity.archivedAt
          ? { ...activity, archivedAt }
          : activity,
      ),
    );
  }, []);

  const toggleActivity = useCallback((activityId: string, dateKey = getRoutineDateKey(), occurrenceIndex = 0) => {
    setActivities((current) =>
      current.map((activity) => {
        if (activity.id !== activityId) return activity;
        if (occurrenceIndex < 0 || occurrenceIndex >= activity.timesPerDay) return activity;
        const occurrenceKey = getRoutineOccurrenceKey(dateKey, occurrenceIndex);
        const completed = activity.completedDates.includes(occurrenceKey);
        return {
          ...activity,
          completedDates: completed
            ? activity.completedDates.filter((date) => date !== occurrenceKey)
            : [...activity.completedDates, occurrenceKey],
        };
      }),
    );
  }, []);

  const reorderActivities = useCallback((orderedActivityIds: string[]) => {
    setActivities((current) => {
      if (orderedActivityIds.length < 2) return current;

      const orderedIdSet = new Set(orderedActivityIds);
      const activitiesById = new Map(current.map((activity) => [activity.id, activity]));
      const orderedActivities = orderedActivityIds
        .map((id) => activitiesById.get(id))
        .filter((activity): activity is RoutineActivity => activity !== undefined);

      if (orderedActivities.length !== orderedActivityIds.length) return current;

      let orderedIndex = 0;
      return current.map((activity) =>
        orderedIdSet.has(activity.id)
          ? orderedActivities[orderedIndex++]
          : activity,
      );
    });
  }, []);

  const isActivityCompleted = useCallback(
    (activity: RoutineActivity, dateKey = getRoutineDateKey(), occurrenceIndex = 0) =>
      activity.completedDates.includes(getRoutineOccurrenceKey(dateKey, occurrenceIndex)),
    [],
  );

  const isActivitySkipped = useCallback(
    (activity: RoutineActivity, dateKey = getRoutineDateKey(), occurrenceIndex = 0) =>
      activity.skippedDates.includes(getRoutineOccurrenceKey(dateKey, occurrenceIndex)),
    [],
  );

  const getActivityById = useCallback(
    (activityId: string) => activities.find((activity) => activity.id === activityId),
    [activities],
  );

  const value = useMemo(
    () => ({
      activities,
      isHydrated,
      lastAddedId,
      addActivity,
      updateActivityDescription,
      completeActivity,
      clearCompletedActivitiesForDate,
      skipActivity,
      archiveActivity,
      toggleActivity,
      reorderActivities,
      isActivityCompleted,
      isActivitySkipped,
      getActivityById,
    }),
    [
      activities,
      isHydrated,
      lastAddedId,
      addActivity,
      updateActivityDescription,
      completeActivity,
      clearCompletedActivitiesForDate,
      skipActivity,
      archiveActivity,
      toggleActivity,
      reorderActivities,
      isActivityCompleted,
      isActivitySkipped,
      getActivityById,
    ],
  );

  return <RutinaContext.Provider value={value}>{children}</RutinaContext.Provider>;
}

export function useRutina() {
  const context = useContext(RutinaContext);
  if (!context) {
    throw new Error("useRutina must be used within a RutinaProvider");
  }
  return context;
}