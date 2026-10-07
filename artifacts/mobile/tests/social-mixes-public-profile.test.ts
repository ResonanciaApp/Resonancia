import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { URL } from "node:url";
import test from "node:test";
import { getTopCommunityMixes, TOP_COMMUNITY_MIX_LIMIT, selectRandomCommunityAvatars } from "../lib/community-mixes-ranking.ts";

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

test("mix row shows only title and username with a four-pixel gap and separate actions", () => {
  const row = carousel.slice(carousel.indexOf("export function MixRow"), carousel.indexOf("// ── Celda de grilla"));
  const order = ["community-mix-author-", "{mix.name}", "{mix.author.displayName}", "AnimatedHeart", "count={mix.likes"]
    .map((t) => row.indexOf(t));
  // Ignore the author's earlier accessibility label when checking text order.
  order[2] = row.indexOf("{mix.author.displayName}", order[1]);
  assert.ok(order.every((i, n) => i > 0 && (n === 0 || i > order[n - 1])), order.join());
  assert.doesNotMatch(row, /categoryLabel|mix\.category|mix\.sounds|sonidos/);
  assert.match(carousel, /rowName: \{.*gap: 4/);
  assert.doesNotMatch(row, /marginTop: 6/);
  assert.equal((row.match(/numberOfLines=\{1\}/g) ?? []).length, 2);
  assert.match(carousel, /minHeight: 59/);
  assert.match(carousel, /height: 59/);
  assert.match(carousel, /paddingVertical: 10/);
  // Text and avatar fit in the card's updated 59px height.
  assert.ok(Math.max(16 + 10 + 4, 37) + 10 * 2 <= 59);
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

test("ranking uses white top-three numbers and preserves typography/avatar sizes", () => {
  assert.match(carousel, /rank=\{index \+ 1\}/);
  assert.match(carousel, /<View style=\{styles\.rankSlot\} pointerEvents="none"/);
  assert.doesNotMatch(carousel, /rankCircle|rank <= 3 && \{ backgroundColor/);
  assert.match(carousel, /rankSlot: \{ width: 26, height: 26, alignItems/);
  assert.match(carousel, /rankText: \{.*fontSize: 10/);
  assert.match(carousel, /transform: \[\{ translateX: -5 \}\]/);
  assert.match(carousel, /rowMeta: \{.*fontSize: 9, lineHeight: 10, color: "#CFCFCF"/);
  assert.match(carousel, /rankText: \{.*transform: \[\{ translateX: -3 \}\]/);
  assert.match(carousel, /rowAvatar: \{.*transform: \[\{ translateX: -7 \}\]/);
  assert.match(carousel, /rowName: \{.*transform: \[\{ translateX: -7 \}\]/);
  assert.match(carousel, /rank <= 3 && \{\s*fontWeight: "700", color: "#F9F9F9"/);
  assert.doesNotMatch(carousel, /#BE9650|#C0C0C0|#B87333/);
  assert.match(carousel, /\{rank\}\./);
  assert.match(carousel, /rowName: \{.*gap: 4/);
  assert.match(carousel, /mixName: \{.*fontWeight: "700"/);
  assert.match(carousel, /name="heart" size=\{16\}/);
  assert.match(carousel, /name="heart-outline" size=\{16\}/);
  assert.match(carousel, /rowLikes: \{.*fontSize: 11/);
  assert.match(carousel, /rowAvatar: \{ width: 37, height: 37, borderRadius: 18\.5/);
  assert.match(carousel, /rowAvatarImg: \{ width: 37, height: 37, borderRadius: 18\.5/);
});

test("avatar simulation randomly samples Profile catalog without duplicates or mutations", () => {
  const sources = Array.from({ length: 14 }, (_, id) => ({ uri: `/avatars/${id}` }));
  const original = [...sources];
  const sampled = selectRandomCommunityAvatars([...sources, { uri: sources[0].uri }], () => 0);
  assert.equal(sampled.length, TOP_COMMUNITY_MIX_LIMIT);
  assert.equal(new Set(sampled.map(source => typeof source === "number" ? source : source.uri)).size, sampled.length);
  assert.deepEqual(sources, original);
  assert.notDeepEqual(sampled, sources.slice(0, 10));
  assert.deepEqual(selectRandomCommunityAvatars([]), []);
  assert.equal(selectRandomCommunityAvatars([1, 1, 2]).length, 2);
});

test("preview uses hydrated Profile avatars, stays stable on rerenders, and is disabled in production", () => {
  assert.match(carousel, /useCoverPresetCatalogState\("profile"\)/);
  assert.doesNotMatch(carousel, /assets\/images\/expansores/);
  const expression = carousel.match(/const previewAvatarSources = React.useMemo\(\s*\(\) => ([\s\S]*?),\s*\[profileCatalog, profileCatalogHydrated\]/)?.[1];
  assert.ok(expression);
  const profileCatalog = Array.from({ length: 14 }, (_, id) => ({ source: { uri: `/profile/${id}` } }));
  const preview = runInNewContext(expression, { __DEV__: true, profileCatalogHydrated: true, profileCatalog, selectRandomCommunityAvatars });
  assert.equal(preview.length, 10);
  for (const state of [{ __DEV__: false, profileCatalogHydrated: true }, { __DEV__: true, profileCatalogHydrated: false }]) {
    const result = runInNewContext(expression, {
      ...state,
      selectRandomCommunityAvatars: () => { throw new Error("Do not sample production or unhydrated catalogs"); },
    });
    assert.equal(result.length, 0);
  }
  assert.match(carousel, /previewAvatarSource=\{previewAvatarSources\[index\]\}/);
  assert.match(carousel, /const avatarSource = previewAvatarSource \?\? realAvatarSource/);
});

test("community divider is vertically centered without moving the adjacent sections", () => {
  assert.match(explore, /styles.sectionSpacer, styles.communityDivider\]\} \/>\s*<CommunityMixesCarousel/);
  const gap = Number(explore.match(/const SECTION_GAP = ([\d.]+)/)?.[1]);
  const extra = Number(explore.match(/const SECTION_EXTRA_GAP = ([\d.]+)/)?.[1]);
  const sectionPadding = Number(carousel.match(/section: \{ paddingHorizontal: \d+, paddingTop: ([\d.]+)/)?.[1]);
  const style = explore.slice(explore.indexOf("communityDivider: {"), explore.indexOf("communityDivider: {") + 260);
  const top = Number(style.match(/marginTop: (-?[\d.]+)/)?.[1]);
  const bottom = Number(style.match(/marginBottom: ([\d.]+) \+ SECTION_EXTRA_GAP/)?.[1]);
  assert.equal(gap + top, bottom + extra + sectionPadding);
  assert.equal(gap + top + bottom + extra + sectionPadding, 75);
});

test("New in Resonancia precedes playlists with remaining Discover sections in place", () => {
  const positions = [
    "Explora según tu tiempo",
    "<View style={styles.newInResonanceSection}>",
    "{editorialDiscoverCarousels.map",
    "<ResonadoresBanner",
    "Explora por objetivo",
    "<CommunityMixesCarousel",
  ].map(marker => explore.indexOf(marker));
  assert.ok(positions.every((position, index) =>
    position >= 0 && (index === 0 || position > positions[index - 1])), positions.join());
  assert.equal((explore.match(/\{editorialDiscoverCarousels\.map/g) ?? []).length, 1);
  assert.match(explore, /<React.Fragment key=\{carousel.id\}>\s*<View style=\{styles.sectionSpacer\} \/>\s*<EditorialPlaylistCarousel/);
});

test("public profile shows name, days pill then stage, with friendship and vibration actions", () => {
  assert.match(profile, /<SceneThemeBackground \/>/);
  assert.doesNotMatch(profile, /BG_GRADIENT|topCategoryLabel/);
  const order = ["styles.avatarWrapper", "public-profile-name", "public-profile-accumulated-pill", "public-profile-stage", "public-profile-long-description"]
    .map((t) => profile.indexOf(t));
  assert.ok(order.every((i, n) => i > 0 && (n === 0 || i > order[n - 1])), order.join());
  assert.match(profile, /growthLevels\[0\]/);
  assert.match(profile, /name="spa"/);
  assert.match(profile, /MEMBERSHIP_AURORA\.premium\.accent/);
  assert.match(profile, /CLOUDY_GROWTH_DAY_PILL_BACKGROUND/);
  assert.match(profile, /rgba\(151,128,231,0\.20\)/);
  assert.match(profile, /\{totalActiveDays\} días/);
  assert.match(profile, /avatarImage: \{ width: 117, height: 117, borderRadius: 58\.5 \}/);
  assert.match(profile, /longDescription \? \(/);
  assert.match(profile, /\/chat\//);
  assert.doesNotMatch(profile, /followersCount|followingCount|Racha acumulada|memberSince|Miembro desde|profile\.location|@\{profile\.username\}/);
  assert.doesNotMatch(profile, /isExpansor|Expansor|useGetExpansorProfile|useFollowUser|useUnfollowUser|useGetUserFollowing/);
  assert.match(profile, /public-profile-add-friend/);
  assert.match(profile, /addFriend\.mutate\(\{ data: \{ addresseeId: userId \} \}\)/);
  assert.match(profile, /pending_outgoing/);
  assert.match(profile, /pending_incoming/);
  assert.match(profile, /Agregar a amigos/);
  assert.match(profile, /name=\{isFriend \? "user-check" : "user-plus"\}/);
  assert.match(profile, /public-profile-vibration/);
  assert.match(profile, /vibration\.mutate\(\{ userId \}\)/);
  assert.match(profile, /name="radio"/);
  assert.match(profile, /disabled=\{vibration\.isPending\}/);
  assert.match(profile, /Vibración enviada/);
});
