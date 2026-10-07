export const TOP_COMMUNITY_MIX_LIMIT = 10;

/** Keep server order for ties, and never mutate cached query data. */
export function getTopCommunityMixes<T extends { likes?: number | null }>(mixes: readonly T[]): T[] {
  return [...mixes]
    .sort((a, b) => (b.likes ?? 0) - (a.likes ?? 0))
    .slice(0, TOP_COMMUNITY_MIX_LIMIT);
}
