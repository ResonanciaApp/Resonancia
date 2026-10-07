import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  publicProfileCardWidth, PROFILE_CAROUSEL_INSET, PROFILE_CAROUSEL_GAP,
  PROFILE_CAROUSEL_PREVIEW, PROFILE_CAROUSEL_RADIUS,
} from "../lib/public-profile-carousel.ts";

test("both carousels show two complete cards and exactly ten pixels of the third", () => {
  for (const width of [320, 375, 402, 430, 768, 1024]) {
    const card = publicProfileCardWidth(width);
    const thirdStart = PROFILE_CAROUSEL_INSET + 2 * (card + PROFILE_CAROUSEL_GAP);
    assert.equal(width - thirdStart, 10);
    assert.equal(PROFILE_CAROUSEL_PREVIEW, 10);
    assert.ok(PROFILE_CAROUSEL_INSET + 2 * card + PROFILE_CAROUSEL_GAP < width);
  }
  assert.equal(PROFILE_CAROUSEL_RADIUS, 18);
});

test("the profile preserves its actions and places both real-data carousels after them", () => {
  const readSource = (path: string) => readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), path), "utf8");
  const profile = readSource("../app/usuario/[id].tsx");
  const carousels = readSource("../components/PublicProfileCarousels.tsx");
  const gallery = readSource("../app/galeria-reflexiones/[id].tsx");
  assert.match(profile, /\(isFriend \|\| pendingOutgoing\) && \{ backgroundColor: "rgba\(255,255,255,0\.10\)" \}/);
  assert.match(profile, /longDesc: \{[^\n]*marginTop: 20/);
  assert.ok(profile.indexOf("<PublicProfileCarousels") > profile.indexOf("public-profile-message"));
  assert.match(carousels, /getSharedMixes\(\{ author: userId, page: pageParam \}\)/);
  assert.match(carousels, /listUserReflectionStories\(userId/);
  assert.equal((carousels.match(/horizontal/g) ?? []).length, 2);
  assert.match(carousels, /item\.image/);
  assert.match(carousels, /\{item\.name\}/);
  assert.match(carousels, /<StoryArtworkFrame/);
  assert.match(carousels, /composition=\{item\}/);
  const topDivider = carousels.indexOf('testID="public-profile-mixes-divider"');
  const mixesHeading = carousels.indexOf(">Sus mezclas</Text>");
  const betweenDivider = carousels.indexOf('testID="public-profile-reflections-divider"');
  const reflectionsHeading = carousels.indexOf(">Sus reflexiones</Text>");
  assert.ok(topDivider < mixesHeading && mixesHeading < betweenDivider && betweenDivider < reflectionsHeading);
  assert.match(carousels, /divider: \{ height: StyleSheet\.hairlineWidth, marginHorizontal: PROFILE_CAROUSEL_INSET/);
  assert.match(gallery, /useSetMyReflectionStoryVisibility/);
  assert.match(gallery, /isPublic: !story\.isPublic/);
  assert.match(gallery, /Otros usuarios podrán ver esta historia/);
});
