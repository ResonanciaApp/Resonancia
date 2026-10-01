import type { CatalogSession } from "@workspace/api-client-react";

import { SESSIONS, type Session } from "@/data/sessions";
import { absoluteMediaUrl } from "@/hooks/effectiveHero";
import { normalizeFeaturedMomentSessionData } from "@/lib/featured-moment-session-logic";

const temporaryFeaturedSessions = new Map<string, Session>();

function mediaUri(value: string | null | undefined): string | undefined {
  if (!value || value.startsWith("bundle:")) return undefined;
  return absoluteMediaUrl(value);
}

/** Build a tap/play-ready view without mutating the global catalog. */
export function normalizeFeaturedMomentSession(remote: CatalogSession): Session {
  const local = SESSIONS.find((session) => session.id === remote.id);
  const session = normalizeFeaturedMomentSessionData(
    remote,
    local,
    SESSIONS[0]!.image,
    mediaUri,
  );
  temporaryFeaturedSessions.set(session.id, session);
  return session;
}

/** Detail routes can use the normalized public choice before catalog hydration. */
export function getTemporaryFeaturedMomentSession(id: string): Session | undefined {
  return temporaryFeaturedSessions.get(id);
}

export function clearTemporaryFeaturedMomentSessions(): void {
  temporaryFeaturedSessions.clear();
}