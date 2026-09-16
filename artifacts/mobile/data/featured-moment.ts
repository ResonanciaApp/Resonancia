import type { Session } from "@/data/sessions";

export function resolveFeaturedMoment(
  sessions: readonly Session[],
  pinnedSessionId: string | null | undefined,
  now = new Date(),
): Session | undefined {
  if (pinnedSessionId) {
    const pinned = sessions.find(
      (session) => session.id === pinnedSessionId && !session.isPlaceholder,
    );
    if (pinned) return pinned;
  }

  const pool = sessions.filter(
    (session) => session.isFeatured && !session.isPlaceholder,
  );
  if (!pool.length) return undefined;

  const start = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor(
    (now.getTime() - start.getTime()) / 86_400_000,
  );
  return pool[dayOfYear % pool.length];
}