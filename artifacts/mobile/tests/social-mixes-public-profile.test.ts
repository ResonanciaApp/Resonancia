import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { URL } from "node:url";
import test from "node:test";
import { getTopCommunityMixes, TOP_COMMUNITY_MIX_LIMIT } from "../lib/community-mixes-ranking.ts";

const read = (p: string) => readFileSync(new URL(p, import.meta.url), "utf8");
const carousel = read("../components/CommunityMixesCarousel.tsx");
const explore = read("../app/(tabs)/explore.tsx");
const profile = read("../app/usuario/[id].tsx");

test("Descubrir renders Mezclas comunidad", () => {
  assert.match(explore, /<CommunityMixesCarousel \/>/);
  assert.match(carousel, /Mezclas comunidad/);
  assert.ok(explore.indexOf("Explora por objetivo") < explore.indexOf("<CommunityMixesCarousel"));
  assert.equal((explore.match(/<CommunityMixesCarousel \/>/g) ?? []).length, 1);
  assert.match(explore, /<CommunityMixesCarousel \/>\s*\{\s*\/\* ── Descubre algo nuevo/);
});

test("mix row keeps separate actions and stacks sound count below the title without editorial", () => {
  const row = carousel.slice(carousel.indexOf("export function MixRow"), carousel.indexOf("// ── Celda de grilla"));
  const order = ["community-mix-author-", "{mix.name}", "sonidos", "AnimatedHeart", "count={mix.likes"]
    .map((t) => row.indexOf(t));
  assert.ok(order.every((i, n) => i > 0 && (n === 0 || i > order[n - 1])), order.join());
  assert.doesNotMatch(row, /categoryLabel|mix\.category/);
  assert.match(row, /marginTop: 6/);
  assert.equal((row.match(/numberOfLines=\{1\}/g) ?? []).length >= 2, true);
  assert.match(carousel, /minHeight: 57/);
  assert.match(carousel, /paddingVertical: 10/);
  assert.match(row, /rgba\(0,0,0,0\.16\)/);
  assert.match(row, /activeSceneId === "cloudy".*rgba\(0,0,0,0\.19\)/);
  assert.match(carousel, /heartFill = "#F9F9F9"/);
  assert.match(row, /<AnimatedHeart count=\{mix\.likes/);
  assert.match(carousel, /testID=\{`community-mix-likes-\$\{mixId\}`\}/);
  assert.match(carousel, /router\.push\(`\/usuario\/\$\{mix\.author\.id\}`/);
  assert.match(carousel, /openCategory\(`\/mezcla\/\$\{mix\.id\}`\)/);
  assert.match(carousel, /toggleLike\.mutate/);
});

test("top ten are ranked by real likes without mutating cache or changing tie order", () => {
  const mixes = Array.from({ length: 14 }, (_, id) => ({ id, likes: id % 7 }));
  const original = mixes.map(m => ({ ...m }));
  const top = getTopCommunityMixes(mixes);
  assert.equal(TOP_COMMUNITY_MIX_LIMIT, 10);
  assert.equal(top.length, 10);
  assert.deepEqual(top.map(m => m.id), [6, 13, 5, 12, 4, 11, 3, 10, 2, 9]);
  assert.deepEqual(mixes, original);
  assert.deepEqual(getTopCommunityMixes([]), []);
  assert.equal(getTopCommunityMixes(mixes.slice(0, 2)).length, 2);
  assert.deepEqual(getTopCommunityMixes([{ id: 1, likes: null }, { id: 2, likes: 1 }]).map(m => m.id), [2, 1]);
});

test("ranking medals and exact typography/avatar sizes are preserved", () => {
  assert.match(carousel, /rank=\{index \+ 1\}/);
  assert.match(carousel, /rank <= 3 && \{ backgroundColor: "rgba\(255,255,255,0\.1\)" \}/);
  assert.match(carousel, /fontWeight: "700", color: \["#BE9650", "#C0C0C0", "#B87333"\]/);
  assert.match(carousel, /\{rank\}\./);
  assert.match(carousel, /fontSize: 9, marginTop: 6, lineHeight: 10/);
  assert.match(carousel, /mixName: \{.*fontWeight: "700"/);
  assert.match(carousel, /name="heart" size=\{16\}/);
  assert.match(carousel, /name="heart-outline" size=\{16\}/);
  assert.match(carousel, /rowLikes: \{.*fontSize: 11/);
  assert.match(carousel, /rowAvatar: \{ width: 37, height: 37, borderRadius: 18\.5/);
  assert.match(carousel, /rowAvatarImg: \{ width: 37, height: 37, borderRadius: 18\.5/);
});

test("public profile uses theme background, lotus pill, followers and optional description", () => {
  assert.match(profile, /<SceneThemeBackground \/>/);
  assert.doesNotMatch(profile, /BG_GRADIENT|topCategoryLabel/);
  assert.match(profile, /name="spa"/);
  assert.match(profile, /Racha acumulada/);
  assert.match(profile, /followersCount/);
  assert.match(profile, /longDescription \? \(/);
  assert.match(profile, /isExpansor/);
});
