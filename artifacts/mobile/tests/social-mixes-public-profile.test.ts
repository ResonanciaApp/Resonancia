import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { URL } from "node:url";
import test from "node:test";

const read = (p: string) => readFileSync(new URL(p, import.meta.url), "utf8");
const carousel = read("../components/CommunityMixesCarousel.tsx");
const explore = read("../app/(tabs)/explore.tsx");
const profile = read("../app/usuario/[id].tsx");

test("Descubrir renders Mezclas comunidad", () => {
  assert.match(explore, /<CommunityMixesCarousel \/>/);
  assert.match(carousel, /Mezclas comunidad/);
});

test("mix row keeps avatar, name, count, category and likes on one line with separate actions", () => {
  const row = carousel.slice(carousel.indexOf("const categoryLabel"), carousel.indexOf("// ── Celda de grilla"));
  const order = ["community-mix-author-", "{mix.name}", "sonidos", "categoryLabel}", "AnimatedHeart", "count={mix.likes"]
    .map((t) => row.indexOf(t));
  assert.ok(order.every((i, n) => i > 0 && (n === 0 || i > order[n - 1])), order.join());
  assert.match(carousel, /MIX_CATEGORIES\.find/);
  assert.equal((row.match(/numberOfLines=\{1\}/g) ?? []).length >= 3, true);
  assert.match(row, /<AnimatedHeart count=\{mix\.likes/);
  assert.match(carousel, /testID=\{`community-mix-likes-\$\{mixId\}`\}/);
  assert.match(carousel, /router\.push\(`\/usuario\/\$\{mix\.author\.id\}`/);
  assert.match(carousel, /openCategory\(`\/mezcla\/\$\{mix\.id\}`\)/);
  assert.match(carousel, /toggleLike\.mutate/);
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
