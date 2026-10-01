export const FEATURED_MOMENT_TIME_ZONE = "America/Santiago";

export type FeaturedCycle = {
  queue: string[];
  knownSessionIds: string[];
  lastAutomaticId: string | null;
};

export function editorialDate(now: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: FEATURED_MOMENT_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export function nextEditorialBoundary(now: Date): Date {
  const currentDay = editorialDate(now);
  let high = now.getTime();
  const max = high + 30 * 60 * 60 * 1000;
  while (high < max && editorialDate(new Date(high)) === currentDay) {
    high += 60 * 60 * 1000;
  }
  if (editorialDate(new Date(high)) === currentDay) {
    throw new Error("No se pudo determinar el próximo cambio editorial de Chile");
  }
  let low = now.getTime();
  while (high - low > 1) {
    const middle = Math.floor((low + high) / 2);
    if (editorialDate(new Date(middle)) === currentDay) low = middle;
    else high = middle;
  }
  return new Date(high);
}

export function shuffleIds(ids: readonly string[], random: () => number): string[] {
  const shuffled = [...ids];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const index = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[index]] = [shuffled[index], shuffled[i]];
  }
  return shuffled;
}

export function resolveManualOverride(
  sessionId: string | null,
  manualDate: string | null,
  today: string,
  eligibleIds: readonly string[],
): string | null {
  return sessionId && manualDate === today && eligibleIds.includes(sessionId)
    ? sessionId
    : null;
}

export function migrateLegacyPin(
  pinnedIds: readonly string[],
  eligibleIds: readonly string[],
  alreadyMigrated: boolean,
): string | null {
  return alreadyMigrated ? null : pinnedIds.find((id) => eligibleIds.includes(id)) ?? null;
}

export function recordManualAsSeen(
  sessionId: string,
  cycle: FeaturedCycle,
): { cycle: FeaturedCycle; changed: boolean } {
  const queue = cycle.queue.filter((id) => id !== sessionId);
  const known = new Set(cycle.knownSessionIds);
  known.add(sessionId);
  const knownSessionIds = [...known];
  const changed =
    queue.length !== cycle.queue.length ||
    knownSessionIds.length !== cycle.knownSessionIds.length;
  return {
    cycle: { ...cycle, queue, knownSessionIds },
    changed,
  };
}

/**
 * Retains the pending cycle when the catalog changes. New IDs are shuffled
 * into the pending queue; removed IDs are discarded without restarting it.
 */
export function takeAutomaticId(
  eligibleIds: readonly string[],
  cycle: FeaturedCycle,
  lastShownId: string | null,
  random: () => number = Math.random,
): { id: string | null; cycle: FeaturedCycle } {
  const eligible = [...new Set(eligibleIds)].sort();
  if (eligible.length === 0) {
    // If every candidate is withdrawn, no unavailable IDs remain in the
    // pending cycle. A later republished catalog starts a fresh eligible cycle.
    return {
      id: null,
      cycle: { queue: [], knownSessionIds: [], lastAutomaticId: cycle.lastAutomaticId },
    };
  }

  const available = new Set(eligible);
  let queue = cycle.queue.filter((id) => available.has(id));
  const known = new Set(cycle.knownSessionIds.filter((id) => available.has(id)));
  const newIds = eligible.filter((id) => !known.has(id));
  if (newIds.length > 0) {
    queue.push(...shuffleIds(newIds, random));
    for (const id of newIds) known.add(id);
  } else if (queue.length === 0) {
    queue = shuffleIds(eligible, random);
    for (const id of eligible) known.add(id);
    if (queue.length > 1 && queue[0] === cycle.lastAutomaticId) {
      [queue[0], queue[1]] = [queue[1], queue[0]];
    }
  }
  if (queue.length > 1 && queue[0] === lastShownId) {
    const alternative = queue.findIndex((id) => id !== lastShownId);
    if (alternative > 0) [queue[0], queue[alternative]] = [queue[alternative], queue[0]];
  }

  const [id, ...remaining] = queue;
  return {
    id: id ?? null,
    cycle: {
      queue: remaining,
      knownSessionIds: [...known],
      lastAutomaticId: id ?? cycle.lastAutomaticId,
    },
  };
}