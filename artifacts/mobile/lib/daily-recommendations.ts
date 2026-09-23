export type DailyRecommendationCandidate = {
  id: string;
  isPlaceholder?: boolean;
};

export function selectDailyRecommendations<T extends DailyRecommendationCandidate>(
  sessions: readonly T[],
  dayKey: string,
  offset: number,
  excludedIds: readonly string[] = [],
  count = 3,
): T[] {
  const available = sessions.filter((session) => !session.isPlaceholder);
  const excluded = new Set(excludedIds);
  const canAvoidPrevious = available.length - excluded.size >= count;
  const pool = canAvoidPrevious
    ? available.filter((session) => !excluded.has(session.id))
    : available;
  const seed = `${dayKey}:${offset}:${pool.map((session) => session.id).join(",")}`;
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  let state = hash >>> 0;
  const shuffled = [...pool];
  const nextRandom = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(nextRandom() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [
      shuffled[swapIndex],
      shuffled[index],
    ];
  }
  return shuffled.slice(0, count);
}