import {
  getGetMyLiveSessionsQueryKey,
  useGetMyLiveSessions,
} from "@workspace/api-client-react";
import { useMemo } from "react";
import { useAuth } from "@/context/AuthContext";

export type LiveSessionItem = {
  id: number;
  guideId: string;
  guideDisplayName: string | null;
  scheduledAt: string;
  scheduledEnd: string | null;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  dailyRoomUrl: string | null;
  calEventTitle: string | null;
  attendeeName: string | null;
  calLink: string | null;
};

/** Sesiones en vivo próximas del usuario (status != cancelled/completed, scheduledAt en el futuro). */
export function useLiveSessions() {
  const { isSignedIn, isRegistered } = useAuth();
  const authenticated = isSignedIn || isRegistered;

  const { data, isLoading, refetch } = useGetMyLiveSessions({
    query: {
      queryKey: getGetMyLiveSessionsQueryKey(),
      enabled: !!authenticated,
      staleTime: 5 * 60_000,
      retry: false,
    },
  });

  const upcoming = useMemo<LiveSessionItem[]>(() => {
    if (!data?.sessions) return [];
    const now = Date.now();
    return (data.sessions as LiveSessionItem[])
      .filter(
        (s) =>
          s.status !== "cancelled" &&
          s.status !== "completed" &&
          new Date(s.scheduledAt).getTime() > now
      )
      .sort(
        (a, b) =>
          new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
      );
  }, [data?.sessions]);

  return { upcoming, isLoading, refetch };
}

/** Formatea una fecha ISO en español: "lunes 23 de junio · 18:00" */
export function formatLiveSessionDate(scheduledAt: string): string {
  const d = new Date(scheduledAt);
  const date = d.toLocaleDateString("es", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const time = d.toLocaleTimeString("es", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${date} · ${time}`;
}

/** True si la sesión puede iniciarse (empieza en los próximos 15 min o ya comenzó y no terminó). */
export function canEnterLiveSession(scheduledAt: string, scheduledEnd?: string | null): boolean {
  const now = Date.now();
  const start = new Date(scheduledAt).getTime();
  const end = scheduledEnd ? new Date(scheduledEnd).getTime() : start + 90 * 60 * 1000;
  const minutesUntil = (start - now) / 60_000;
  return minutesUntil <= 15 && now < end;
}
