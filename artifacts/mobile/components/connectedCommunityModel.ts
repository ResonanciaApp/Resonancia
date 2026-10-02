export type CommunityAvatar = { id: string; avatarUrl: string };
export const MAX_AVATARS = 6;

export function uniqueEligible(avatars: CommunityAvatar[]): CommunityAvatar[] {
  const seen = new Set<string>();
  return avatars.filter((a) => {
    if (!a || !a.id || !a.avatarUrl || seen.has(a.id)) return false;
    seen.add(a.id);
    return true;
  });
}

/** Keeps still-eligible current users in place, fills open slots randomly. */
export function reconcileVisible(
  pool: CommunityAvatar[],
  current: CommunityAvatar[],
  random: () => number = Math.random,
): CommunityAvatar[] {
  const eligible = uniqueEligible(pool);
  const byId = new Map(eligible.map((a) => [a.id, a]));
  const kept = current.filter((a) => byId.has(a.id)).map((a) => byId.get(a.id)!).slice(0, MAX_AVATARS);
  const used = new Set(kept.map((a) => a.id));
  const rest = eligible.filter((a) => !used.has(a.id));
  while (kept.length < MAX_AVATARS && rest.length) {
    kept.push(rest.splice(Math.floor(random() * rest.length), 1)[0]);
  }
  return kept;
}

/** Swaps one random visible slot for a random non-visible eligible user. */
export function rotateOne(
  pool: CommunityAvatar[],
  visible: CommunityAvatar[],
  random: () => number = Math.random,
): CommunityAvatar[] {
  const shown = new Set(visible.map((a) => a.id));
  const candidates = uniqueEligible(pool).filter((a) => !shown.has(a.id));
  if (!visible.length || !candidates.length) return visible;
  const next = visible.slice();
  next[Math.floor(random() * next.length)] = candidates[Math.floor(random() * candidates.length)];
  return next;
}

export function changedDigitSlots(prev: string, next: string): boolean[] {
  const len = Math.max(prev.length, next.length);
  const p = prev.padStart(len, " ");
  const n = next.padStart(len, " ");
  return Array.from(n).map((c, i) => c !== p[i]);
}
