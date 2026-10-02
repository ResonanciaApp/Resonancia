import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { URL } from "node:url";

test("Nuevo en Resonancia includes the shared clock without changing its glass badge", () => {
  const source = readFileSync(new URL("../app/(tabs)/explore.tsx", import.meta.url), "utf8");
  const badge = source.match(/<SessionDurationBadge\s+label=\{session\.durationLabel\}[\s\S]*?\/>/)?.[0];
  assert.ok(badge);
  assert.match(badge, /\bshowClock\b/);
  assert.match(badge, /\bwhiteGlass\b/);
});

test("carousel duration pills show the shared clock in every badge layout", () => {
  const source = readFileSync(new URL("../components/SessionCarousel.tsx", import.meta.url), "utf8");
  assert.match(source, /showDurationClock\s*=\s*true/);
  const badges = source.match(/<SessionDurationBadge\b[\s\S]*?\/>/g) ?? [];
  assert.ok(badges.length > 0);
  for (const badge of badges) {
    assert.match(badge, /\bshowClock\b/, `Carousel duration pill missing its clock: ${badge}`);
  }
});

test("featured video duration pills include a clock and explicit text even when duration is unknown", () => {
  const source = readFileSync(new URL("../components/VideoCard.tsx", import.meta.url), "utf8");
  const badge = source.match(/<SessionDurationBadge\s+label=\{video\.durationLabel\.trim\(\) \|\| "Duración pendiente"\}[\s\S]*?\/>/)?.[0];
  assert.ok(badge);
  assert.match(badge, /\bshowClock\b/);
  assert.match(badge, /\bwhiteGlass\b/);
});

test("Descubrir enables the shared clock on editorial playlist duration pills", () => {
  const carousel = readFileSync(new URL("../components/EditorialPlaylistCarousel.tsx", import.meta.url), "utf8");
  const badge = carousel.match(/<SessionDurationBadge\s+label=\{playlist\.durationLabel\}[\s\S]*?\/>/)?.[0];
  assert.ok(badge);
  assert.match(badge, /showClock=\{showDurationClock\}/);
  assert.match(badge, /\bwhiteGlass\b/);
  const discover = readFileSync(new URL("../app/(tabs)/explore.tsx", import.meta.url), "utf8");
  const element = discover.match(/<EditorialPlaylistCarousel\b[\s\S]*?\/>/)?.[0];
  assert.ok(element);
  assert.match(element, /title=\{carousel\.title\}/);
  assert.match(element, /playlists=\{carousel\.playlists\}/);
  assert.match(element, /\bshowDurationClock\b/);
});