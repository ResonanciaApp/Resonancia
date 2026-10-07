import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { URL } from "node:url";
import type { SharedMix, SharedMixesPage } from "@workspace/api-client-react";
import {
  flattenSharedMixesPages,
  getNextSharedMixesPage,
  patchSharedMixesCache,
  type SharedMixesInfiniteCache,
} from "../lib/community-mixes-pagination.ts";

const mix = (id: number, likes = 2, likedByMe = false) => ({ id, likes, likedByMe } as SharedMix);
const page = (n: number, ids: number[], total = 43): SharedMixesPage => ({
  page: n, pageSize: 20, total, mixes: ids.map(id => mix(id)),
});
const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

test("pagination reaches every mix beyond the first twenty and stops at the server total", () => {
  const pages: SharedMixesPage[] = [];
  let next: number | undefined = 1;
  while (next != null) {
    const start = (next - 1) * 20;
    const result = page(next, Array.from({ length: Math.min(20, 43 - start) }, (_, i) => start + i));
    pages.push(result);
    next = getNextSharedMixesPage(result);
  }
  assert.deepEqual(pages.map(p => p.page), [1, 2, 3]);
  assert.deepEqual(flattenSharedMixesPages(pages).map(m => m.id), Array.from({ length: 43 }, (_, i) => i));
  assert.equal(getNextSharedMixesPage(page(1, [1], 20)), undefined);
  assert.equal(getNextSharedMixesPage(page(3, [], 100)), undefined);
});

test("flattening deduplicates overlapping pages without mutating or rearranging the ranking", () => {
  const pages = [page(1, [4, 3, 2]), page(2, [2, 1])];
  const original = structuredClone(pages);
  assert.deepEqual(flattenSharedMixesPages(pages).map(m => m.id), [4, 3, 2, 1]);
  assert.deepEqual(pages, original);
  assert.deepEqual(flattenSharedMixesPages(), []);
});

test("likes patch single-page and infinite caches, keeping other mixes and pagination intact", () => {
  const first = page(1, [1, 2]);
  const second = page(2, [3, 4]);
  const cache: SharedMixesInfiniteCache = { pages: [first, second], pageParams: [1, 2] };
  const optimistic = (m: SharedMix) => ({ ...m, likes: m.likes + 1, likedByMe: true });
  const updated = patchSharedMixesCache(cache, 4, optimistic);
  assert.ok(updated && "pages" in updated);
  assert.equal(updated.pages[1].mixes[1].likes, 3);
  assert.equal(updated.pages[1].mixes[1].likedByMe, true);
  assert.equal(updated.pages[0].mixes[0], first.mixes[0]);
  assert.equal(updated.pageParams, cache.pageParams);
  assert.deepEqual(updated.pages.map(p => [p.total, p.page, p.pageSize]), [[43, 1, 20], [43, 2, 20]]);
  assert.equal(cache.pages[1].mixes[1].likes, 2);

  const flat = patchSharedMixesCache(second, 4, optimistic);
  assert.ok(flat && "mixes" in flat);
  assert.equal(flat.mixes[1].likes, 3);
  assert.equal(patchSharedMixesCache(undefined, 4, optimistic), undefined);

  const reconciled = patchSharedMixesCache(updated, 4, m => ({ ...m, likes: 7, likedByMe: true }));
  assert.ok(reconciled && "pages" in reconciled);
  assert.equal(reconciled.pages[1].mixes[1].likes, 7);
  const rolledBack = patchSharedMixesCache(updated, 4, m => ({ ...m, likes: m.likes - 1, likedByMe: false }));
  assert.deepEqual(rolledBack, cache);
});

test("Creaciones uses the shared row in one unfiltered infinite list with separate cache identity", () => {
  const screen = read("../app/mezclas-comunidad.tsx");
  assert.match(screen, /<FlatList/);
  assert.match(screen, /<MixRow/);
  assert.match(screen, /rank=\{index \+ 1\}/);
  assert.match(screen, /getSharedMixes\(\{ page: pageParam \}, \{ signal \}\)/);
  assert.match(screen, /getNextPageParam: getNextSharedMixesPage/);
  assert.match(screen, /getGetSharedMixesQueryKey\(\), "infinite", clerkUserId \?\? "guest"/);
  assert.match(screen, /onEndReached=\{loadMore\}/);
  assert.match(screen, /hasNextPage && !isFetching && !isFetchNextPageError/);
  assert.match(screen, /void fetchNextPage\(\)/);
  assert.match(screen, /No se pudieron cargar más mezclas/);
  assert.match(screen, /<RefreshControl/);
  assert.doesNotMatch(screen, /MIX_CATEGORIES|activeCategory|numColumns|MixGridCard|<Chip|previewAvatarSource/);
  assert.match(screen, /onAuthorPress=.*\/usuario\//);
  assert.match(screen, /onHeartPress=\{\(\) => handleLike\(mix\)\}/);
  assert.match(screen, /onDotsPress=\{\(\) => setMenuMix\(mix\)\}/);
  assert.match(read("../hooks/useMixLike.ts"), /patchSharedMixesCache\(prev, mixId, patch\)/);
});

test("header matches Historial title, constrains the back surface and opens Bases at the right margin", () => {
  const screen = read("../app/mezclas-comunidad.tsx");
  const historial = read("../app/historial.tsx");
  for (const property of ['fontSize: 18', 'lineHeight: 21', 'fontWeight: "700"', 'letterSpacing: 0.2', 'textAlign: "center"']) {
    assert.ok(screen.includes(property));
    assert.ok(historial.includes(property));
  }
  assert.match(screen, /backButton: \{ width: 43, height: 43, borderRadius: 21\.5 \}/);
  assert.match(screen, /standardSurface/);
  assert.match(screen, /basesButton: \{ position: "absolute", right: 20/);
  assert.match(screen, /onPress=\{\(\) => setRulesVisible\(true\)\}/);
  assert.match(screen, /<CommunityMixRulesSheet visible=\{rulesVisible\} onClose=\{\(\) => setRulesVisible\(false\)\}/);
});

test("Bases describes the real sharing limits and can be dismissed by close, backdrop or native back", () => {
  const rules = read("../components/CommunityMixRulesSheet.tsx");
  assert.match(rules, /Reglas para compartir creaciones/);
  assert.match(rules, /entre 2 y 10 sonidos/);
  assert.match(rules, /hasta 40 caracteres/);
  assert.match(rules, /hasta 120 caracteres/);
  assert.match(rules, /hasta 20 mezclas/);
  assert.match(rules, /mismo conjunto de sonidos/);
  assert.match(rules, /Compartir con la comunidad/);
  assert.match(rules, /onRequestClose=\{onClose\}/);
  assert.equal((rules.match(/onPress=\{onClose\}/g) ?? []).length, 2);
  assert.match(rules, /<ScrollView/);
  assert.match(read("../components/CommunityMixesCarousel.tsx"), /onLongPress=\{onDotsPress\}/);
});
