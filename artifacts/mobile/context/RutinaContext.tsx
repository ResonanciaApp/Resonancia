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
  skipRoutineDate,
} from "@/lib/routineLogic";
export {
  getRoutineDateFromKey,
  getRoutineDateKey,
  getRoutineWeekday,
  isRoutineActivityScheduledForDate,
  canMutateRoutineDate,
} from "@/lib/routineLogic";

const STORAGE_KEY = "@resonance_routine_v1";

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
}

interface RutinaContextValue {
  activities: RoutineActivity[];
  isHydrated: boolean;
  lastAddedId: string | null;
  addActivity: (input: RoutineActivityInput) => RoutineActivity;
  completeActivity: (activityId: string, dateKey?: string) => void;
  skipActivity: (activityId: string, dateKey?: string) => void;
  archiveActivity: (activityId: string) => void;
  toggleActivity: (activityId: string, dateKey?: string) => void;
  reorderActivities: (orderedActivityIds: string[]) => void;
  isActivityCompleted: (activity: RoutineActivity, dateKey?: string) => boolean;
  isActivitySkipped: (activity: RoutineActivity, dateKey?: string) => boolean;
  getActivityById: (activityId: string) => RoutineActivity | undefined;
}

const RutinaContext = createContext<RutinaContextValue | null>(null);

function normalizeDateList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return Array.from(
    new Set(value.filter((date): date is string => typeof date === "string")),
  ).sort();
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

export const ROUTINE_SUGGESTIONS = ROUTINE_CATEGORY_TABS.reduce(
  (groups, category) => {
    groups[category] = SUGGESTION_GROUPS[category].map((title) => ({
      title,
      category,
    }));
    return groups;
  },
  {} as Record<RoutineCategory, { title: string; category: RoutineCategory }[]>,
);

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

  return {
    id: item.id,
    title: item.title.trim(),
    description: typeof item.description === "string" ? item.description : "",
    category: ROUTINE_CATEGORY_TABS.includes(item.category as RoutineCategory)
      ? (item.category as RoutineCategory)
      : "Sugerido",
    repeatDays,
    completedDates: normalizeDateList(item.completedDates),
    skippedDates: normalizeDateList(item.skippedDates),
    archivedAt: typeof item.archivedAt === "string" ? item.archivedAt : null,
    createdAt: typeof item.createdAt === "string" ? item.createdAt : new Date().toISOString(),
  };
}

export function RutinaProvider({ children }: { children: ReactNode }) {
  const [activities, setActivities] = useState<RoutineActivity[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [lastAddedId, setLastAddedId] = useState<string | null>(null);
  const hydratedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (cancelled) return;
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              setActivities(parsed.map(normalizeActivity).filter((item): item is RoutineActivity => item !== null));
            }
          } catch {
            setActivities([]);
          }
        }
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
  }, []);

  useEffect(() => {
    if (!hydratedRef.current) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(activities)).catch(() => {});
  }, [activities]);

  const addActivity = useCallback((input: RoutineActivityInput) => {
    const activity: RoutineActivity = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      title: input.title.trim(),
      description: input.description?.trim() ?? "",
      category: input.category,
      repeatDays: Array.from(new Set(input.repeatDays)).sort((a, b) => a - b),
      completedDates: [],
      skippedDates: [],
      archivedAt: null,
      createdAt: new Date().toISOString(),
    };
    setActivities((current) => [activity, ...current]);
    setLastAddedId(activity.id);
    return activity;
  }, []);

  const completeActivity = useCallback(
    (activityId: string, dateKey = getRoutineDateKey()) => {
      setActivities((current) =>
        current.map((activity) => {
          if (activity.id !== activityId) return activity;
          if (!canMutateRoutineDate(activity, dateKey)) return activity;
          return completeRoutineDate(activity, dateKey);
        }),
      );
    },
    [],
  );

  const skipActivity = useCallback(
    (activityId: string, dateKey = getRoutineDateKey()) => {
      setActivities((current) =>
        current.map((activity) => {
          if (activity.id !== activityId) return activity;
          if (!canMutateRoutineDate(activity, dateKey)) return activity;
          return skipRoutineDate(activity, dateKey);
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

  const toggleActivity = useCallback((activityId: string, dateKey = getRoutineDateKey()) => {
    setActivities((current) =>
      current.map((activity) => {
        if (activity.id !== activityId) return activity;
        const completed = activity.completedDates.includes(dateKey);
        return {
          ...activity,
          completedDates: completed
            ? activity.completedDates.filter((date) => date !== dateKey)
            : [...activity.completedDates, dateKey],
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
    (activity: RoutineActivity, dateKey = getRoutineDateKey()) =>
      activity.completedDates.includes(dateKey),
    [],
  );

  const isActivitySkipped = useCallback(
    (activity: RoutineActivity, dateKey = getRoutineDateKey()) =>
      activity.skippedDates.includes(dateKey),
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
      completeActivity,
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
      completeActivity,
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