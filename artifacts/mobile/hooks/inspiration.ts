import { useEffect, useMemo, useState } from "react";
import { AppState } from "react-native";
import { getInspirationWeek, useGetInspirationWeek } from "@workspace/api-client-react";
import { useInspirationContext } from "@/context/InspirationContext";
import { inspirationDateInZone, inspirationWeekDates, inspirationWeekStart } from "@/lib/inspiration-state";
import {
  inspirationAcceptWeek, inspirationCatalogKey, inspirationGateWeek, inspirationNeutralDay,
  inspirationRememberWeekRequest, inspirationWeekRequestedAt,
} from "@/lib/inspiration-cache";

export type { InspirationNote, InspirationFavorite } from "@/lib/inspiration-state";
export interface InspirationOptions { weekStart?: string; date?: string; timezone?: string }

/** Single public reading + owner-isolated private state interface for all Inspiration screens. */
export function useInspiration(options: InspirationOptions = {}) {
  const context = useInspirationContext();
  const [clock, setClock] = useState(() => Date.now());
  const [foregroundVersion, setForegroundVersion] = useState(0);
  const selection = useMemo(() => {
    const timezone = options.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    try {
      const deviceToday = inspirationDateInZone(timezone, new Date(clock));
      return { timezone, deviceToday, weekStart: inspirationWeekStart(options.weekStart ?? options.date ?? deviceToday), error: null };
    } catch (error) {
      const deviceToday = inspirationDateInZone("UTC", new Date(clock));
      return { timezone: "UTC", deviceToday, weekStart: inspirationWeekStart(deviceToday),
        error: error instanceof Error ? error.message : "Fecha o zona horaria no válida." };
    }
  }, [options.timezone, options.weekStart, options.date, clock]);
  const { timezone, deviceToday, weekStart } = selection;
  const query = useGetInspirationWeek({ date: weekStart, timeZone: timezone }, {
    query: {
      queryKey: ["inspiration-public-week", weekStart, timezone, deviceToday],
      structuralSharing: false, // retain the response identity carrying request metadata
      // Keep the generated hook/client. Request initiation metadata disambiguates
      // fresh arrival-day reads from old responses settling after a future gate.
      queryFn: async ({ signal }) => {
        const requestedAt = Date.now();
        const result = await getInspirationWeek({ date: weekStart, timeZone: timezone }, { signal });
        inspirationRememberWeekRequest(result, requestedAt);
        return result;
      },
      staleTime: 60_000, gcTime: 300_000, retry: 1, refetchOnWindowFocus: true,
      enabled: !selection.error,
    },
  });
  useEffect(() => {
    const timer = setInterval(() => setClock(Date.now()), 30_000);
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") { setClock(Date.now()); setForegroundVersion((version) => version + 1); }
    });
    return () => { clearInterval(timer); subscription.remove(); };
  }, []);
  const refetch = query.refetch;
  useEffect(() => { if (foregroundVersion > 0) void refetch(); }, [foregroundVersion, refetch]);
  useEffect(() => {
    if (!selection.error && query.data && query.data.weekStart === weekStart && query.data.timeZone === timezone) {
      void context.acceptWeek(query.data, query.dataUpdatedAt);
    }
  }, [query.data, query.dataUpdatedAt, weekStart, timezone, context.acceptWeek, selection.error]);
  const cached = context.catalog[inspirationCatalogKey(timezone, weekStart)];
  const incoming = query.data?.weekStart === weekStart && query.data.timeZone === timezone ? query.data : null;
  // A retained older React Query snapshot cannot override a newer explicit withdrawal.
  const source = selection.error ? null : incoming
    ? inspirationAcceptWeek(context.catalog, incoming, query.dataUpdatedAt, inspirationWeekRequestedAt(incoming))[inspirationCatalogKey(timezone, weekStart)]?.week
    : cached?.week;
  const week = useMemo(() => source ? inspirationGateWeek(source, deviceToday) : null, [source, deviceToday]);
  const today = week?.today ?? deviceToday;
  const days = useMemo(() => week?.days ?? inspirationWeekDates(weekStart).map((date) =>
    inspirationNeutralDay(date, date > deviceToday)), [week, weekStart, deviceToday]);
  const favorites = useMemo(() => context.favorites.map((favorite) => {
    const date = favorite.date ?? favorite.day?.date;
    if (!date) return { ...favorite, day: null };
    const entry = context.catalog[inspirationCatalogKey(timezone, inspirationWeekStart(date))];
    if (entry) {
      const day = inspirationGateWeek(entry.week, deviceToday).days.find((candidate) => candidate.date === date);
      return { ...favorite, day: day?.id === favorite.inspirationId ? day : inspirationNeutralDay(date, date > deviceToday) };
    }
    // A server-gated private favorites response is usable only in its original zone.
    if (favorite.timeZone === timezone && favorite.day?.status === "available" && date <= deviceToday) {
      return favorite;
    }
    // Saved metadata may be from another timezone. Never expose that public content.
    return { ...favorite, day: inspirationNeutralDay(date, date > deviceToday) };
  }), [context.favorites, context.catalog, timezone, deviceToday]);
  // Keep raw cross-zone catalog and private tombstones internal to the provider.
  const { catalog: _catalog, state: _state, acceptWeek: _acceptWeek, catalogError: _catalogError, ...privateState } = context;
  return {
    ...privateState, favorites, week, days, today, timezone, weekStart,
    loading: query.isLoading && !week,
    error: selection.error ?? (query.error instanceof Error ? query.error.message : context.catalogError),
    isCached: !!week && (query.isError || !incoming || query.isFetching),
    retry: query.refetch,
  };
}
