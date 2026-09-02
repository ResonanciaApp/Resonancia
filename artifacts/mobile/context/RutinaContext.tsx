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
  toggleActivity: (activityId: string, dateKey?: string) => void;
  isActivityCompleted: (activity: RoutineActivity, dateKey?: string) => boolean;
}

const RutinaContext = createContext<RutinaContextValue | null>(null);

export function getRoutineDateKey(date = new Date()): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

export function getRoutineWeekday(date = new Date()): number {
  const day = date.getDay();
  return day === 0 ? 6 : day - 1;
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
    completedDates: Array.isArray(item.completedDates)
      ? item.completedDates.filter((date): date is string => typeof date === "string")
      : [],
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
      createdAt: new Date().toISOString(),
    };
    setActivities((current) => [activity, ...current]);
    setLastAddedId(activity.id);
    return activity;
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

  const isActivityCompleted = useCallback(
    (activity: RoutineActivity, dateKey = getRoutineDateKey()) =>
      activity.completedDates.includes(dateKey),
    [],
  );

  const value = useMemo(
    () => ({
      activities,
      isHydrated,
      lastAddedId,
      addActivity,
      toggleActivity,
      isActivityCompleted,
    }),
    [activities, isHydrated, lastAddedId, addActivity, toggleActivity, isActivityCompleted],
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