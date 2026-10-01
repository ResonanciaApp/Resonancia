import { dayKey, startOfWeek, type StatEventLike } from "./stats.ts";

export type WeeklyCompletedSessionEvent = StatEventLike & {
  sessionId: string;
  completed?: boolean;
};

/**
 * Returns completed session events from the current local Monday–Sunday week.
 * Event identity is a session and its exact playedAt value, so repeat listens
 * at different times remain separate completions.
 */
export function getWeeklyCompletedSessions(
  events: readonly WeeklyCompletedSessionEvent[],
  now = new Date(),
): WeeklyCompletedSessionEvent[] {
  const nowTime = now.getTime();
  if (!Number.isFinite(nowTime)) return [];
  const weekStartKey = dayKey(startOfWeek(now));
  const seen = new Set<string>();
  const completed: WeeklyCompletedSessionEvent[] = [];

  for (const event of events) {
    if (event.completed !== true || !event.sessionId) continue;
    if (typeof event.playedAt !== "string" || event.playedAt.trim().length === 0) continue;

    const playedAt = new Date(event.playedAt);
    const playedAtTime = playedAt.getTime();
    if (!Number.isFinite(playedAtTime) || playedAtTime > nowTime) continue;
    if (dayKey(startOfWeek(playedAt)) !== weekStartKey) continue;

    const identity = `${event.sessionId}\u0000${event.playedAt}`;
    if (seen.has(identity)) continue;
    seen.add(identity);
    completed.push(event);
  }

  return completed.sort(
    (a, b) => Date.parse(b.playedAt) - Date.parse(a.playedAt),
  );
}