export const TOP_COMMUNITY_MIX_LIMIT = 10;

/** Keep server order for ties, and never mutate cached query data. */
export function getTopCommunityMixes<T extends { likes?: number | null }>(mixes: readonly T[]): T[] {
  return [...mixes]
    .sort((a, b) => (b.likes ?? 0) - (a.likes ?? 0))
    .slice(0, TOP_COMMUNITY_MIX_LIMIT);
}

type AvatarSource = number | { uri: string };

/** Sample distinct catalog images without changing the shared catalog. */
export function selectRandomCommunityAvatars(
  sources: readonly AvatarSource[],
  random: () => number = Math.random,
): AvatarSource[] {
  const pool = [...new Map(sources.map(source => [
    typeof source === "number" ? `bundle:${source}` : source.uri,
    source,
  ] as const)).values()];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, TOP_COMMUNITY_MIX_LIMIT);
}
