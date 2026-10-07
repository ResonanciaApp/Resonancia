import type { SharedMix, SharedMixesPage } from "@workspace/api-client-react";

export type SharedMixesInfiniteCache = {
  pages: SharedMixesPage[];
  pageParams: unknown[];
};

export type SharedMixesCache = SharedMixesPage | SharedMixesInfiniteCache;

export function getNextSharedMixesPage(page: SharedMixesPage): number | undefined {
  // An empty page also terminates pagination if the server's total changed.
  return page.mixes.length > 0 && page.page * page.pageSize < page.total
    ? page.page + 1
    : undefined;
}

export function flattenSharedMixesPages(pages: SharedMixesPage[] = []): SharedMix[] {
  const seen = new Set<number>();
  return pages.flatMap(page => page.mixes.filter(mix => {
    // Popularity can change between offset-based requests; don't repeat rows.
    if (seen.has(mix.id)) return false;
    seen.add(mix.id);
    return true;
  }));
}

export function patchSharedMixesCache(
  cache: SharedMixesCache | undefined,
  mixId: number,
  patch: (mix: SharedMix) => SharedMix,
): SharedMixesCache | undefined {
  if (!cache) return cache;
  const patchPage = (page: SharedMixesPage): SharedMixesPage => ({
    ...page,
    mixes: page.mixes.map(mix => mix.id === mixId ? patch(mix) : mix),
  });
  if ("pages" in cache) {
    return { ...cache, pages: cache.pages.map(patchPage) };
  }
  return patchPage(cache);
}
