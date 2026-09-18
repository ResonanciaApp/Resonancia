import type { InspirationDay, InspirationWeek } from "@workspace/api-client-react";
import { inspirationWeekDates } from "./inspiration-state.ts";

export interface InspirationCachedWeek {
  week: InspirationWeek;
  receivedAt: number;
  withdrawnRevisions?: Record<string, number>;
  /** Future gates need a fresh request, not a republish, once the server day arrives. */
  futureFences?: Record<string, number>;
}
export type InspirationCatalogCache = Record<string, InspirationCachedWeek>;
export const INSPIRATION_CATALOG_KEY = "@resonancia:inspiration:catalog:v1";
export const inspirationCatalogKey = (timezone: string, weekStart: string) => `${timezone}|${weekStart}`;

export function inspirationNeutralDay(date: string, future: boolean): InspirationDay {
  return { date, status: future ? "future" : "unavailable", id: null, revision: null, content: null };
}

/** Never unlock using the device clock. Server-authorized dates are an upper bound. */
export function inspirationGateWeek(week: InspirationWeek, deviceToday: string): InspirationWeek {
  const ceiling = deviceToday < week.today ? deviceToday : week.today;
  return {
    ...week,
    days: inspirationWeekDates(week.weekStart).map((date) => {
      const day = week.days.find((candidate) => candidate.date === date);
      if (date > ceiling) return inspirationNeutralDay(date, true);
      if (!day || day.status !== "available" || !day.id || !day.content) {
        return inspirationNeutralDay(date, day?.status === "future");
      }
      return day;
    }),
  };
}

export function inspirationAcceptWeek(
  cache: InspirationCatalogCache, week: InspirationWeek, receivedAt: number,
  requestedAt?: number,
): InspirationCatalogCache {
  const key = inspirationCatalogKey(week.timeZone, week.weekStart);
  if (cache[key] && cache[key].receivedAt >= receivedAt) return cache;
  const previous = cache[key];
  const withdrawnRevisions = { ...previous?.withdrawnRevisions };
  const futureFences = { ...previous?.futureFences };
  const gated = inspirationGateWeek(week, week.today);
  const days = gated.days.map((day) => {
    const old = previous?.week.days.find((candidate) => candidate.date === day.date);
    if (day.status === "unavailable" && old?.revision != null) {
      withdrawnRevisions[day.date] = Math.max(withdrawnRevisions[day.date] ?? 0, old.revision);
    }
    if (day.status === "future") futureFences[day.date] = receivedAt;
    if (day.status === "available" && futureFences[day.date] !== undefined) {
      // A late response started before the confirmed gate cannot restore it.
      // An actually fresh server-authorized request can unlock the SAME
      // publication revision on arrival day; future gating is not withdrawal.
      if (requestedAt === undefined || requestedAt <= futureFences[day.date]) {
        return inspirationNeutralDay(day.date, true);
      }
      delete futureFences[day.date];
    }
    if (day.status === "available" && (day.revision ?? 0) <= (withdrawnRevisions[day.date] ?? -1)) {
      return inspirationNeutralDay(day.date, false);
    }
    if (day.status === "available" && old?.status === "available" &&
        (old.revision ?? 0) > (day.revision ?? 0)) return old;
    return day;
  });
  // Successful snapshots replace all seven positions, including explicit withdrawals.
  const settings = previous && previous.week.settings.revision > gated.settings.revision
    ? previous.week.settings : gated.settings;
  const next = { ...cache, [key]: { week: { ...gated, days, settings }, receivedAt, withdrawnRevisions, futureFences } };
  return Object.fromEntries(
    Object.entries(next).sort((a, b) => b[1].receivedAt - a[1].receivedAt).slice(0, 16),
  );
}

// Metadata stays outside the generated response DTO and is shared by all
// observers of a deduplicated React Query request.
const weekRequests = new WeakMap<InspirationWeek, number>();
export function inspirationRememberWeekRequest(week: InspirationWeek, requestedAt: number) {
  weekRequests.set(week, requestedAt);
}
export function inspirationWeekRequestedAt(week: InspirationWeek) {
  return weekRequests.get(week);
}

/** Serialize disk writes and report errors only from the latest cache operation. */
export function createInspirationCatalogPersistence(report: (error: unknown | null) => void) {
  let generation = 0;
  let writes: Promise<void> = Promise.resolve();
  return {
    async load<T>(read: () => Promise<T>, accept: (value: T) => void, active = () => true) {
      const started = ++generation;
      try {
        const value = await read();
        if (started === generation && active()) { accept(value); report(null); }
      } catch (error) {
        if (started === generation && active()) report(error);
      }
    },
    async save(write: () => Promise<void>) {
      const started = ++generation;
      const work = writes.catch(() => undefined).then(write);
      writes = work;
      try {
        await work;
        if (started === generation) report(null);
      } catch (error) {
        if (started === generation) report(error);
      }
    },
  };
}

/** A private favorites response is also authoritative evidence of editorial withdrawal. */
export function inspirationWithdrawSavedDays(
  cache: InspirationCatalogCache,
  items: Array<{ inspirationId: string; day: InspirationDay | null; deleted?: boolean }>,
  timezone: string,
  receivedAt: number,
): InspirationCatalogCache {
  let next = cache;
  for (const { week } of Object.values(cache)) {
    if (week.timeZone !== timezone) continue;
    const changedDates = new Set<string>();
    const days = week.days.map((day) => {
      const item = items.find((favorite) => !favorite.deleted &&
        (favorite.inspirationId === day.id || favorite.day?.date === day.date));
      if (!item || item.day?.status === "available") return day;
      changedDates.add(day.date);
      return inspirationNeutralDay(day.date, item.day?.status === "future");
    });
    if (changedDates.size) {
      const key = inspirationCatalogKey(week.timeZone, week.weekStart);
      const previous = next[key];
      const updated = inspirationAcceptWeek(next, { ...week, days }, receivedAt);
      if (updated === next) continue;
      // A private item response only confirms its own date. Do not turn the
      // untouched future slots of an old week into new server confirmations.
      const futureFences = { ...previous?.futureFences };
      for (const date of changedDates) {
        if (updated[key].futureFences?.[date] !== undefined) futureFences[date] = updated[key].futureFences[date];
      }
      next = { ...updated, [key]: { ...updated[key], futureFences } };
    }
  }
  return next;
}

export function inspirationParseCatalog(raw: string | null): InspirationCatalogCache {
  if (!raw) return {};
  const parsed: unknown = JSON.parse(raw);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("No se pudo leer la caché de Inspiración.");
  }
  const result: InspirationCatalogCache = {};
  for (const [key, item] of Object.entries(parsed)) {
    const entry = item as InspirationCachedWeek;
    if (!entry?.week?.weekStart || !entry.week.timeZone || !entry.week.today ||
        !Array.isArray(entry.week.days) || entry.week.days.length !== 7 ||
        !Number.isFinite(entry.receivedAt) ||
        key !== inspirationCatalogKey(entry.week.timeZone, entry.week.weekStart)) {
      throw new Error("La caché de Inspiración no es válida; vuelve a conectar para actualizarla.");
    }
    result[key] = { ...entry, week: inspirationGateWeek(entry.week, entry.week.today) };
  }
  return result;
}