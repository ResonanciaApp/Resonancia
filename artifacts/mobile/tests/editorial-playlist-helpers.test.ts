import assert from "node:assert/strict";
import test from "node:test";

import {
  buildLegacyPlaylistCarouselRecords,
  buildEditorialQueue,
  classifyEditorialDetailStatus,
  computePlaylistCompletion,
  formatMeditationSessionOrdinal,
  parseEditorialPlaylistCache,
  pickRandomQueueStart,
  resolvePlaylistCarouselRows,
  resolveMeditationPlaylistPlayAction,
  resolveMeditationPlaylistResume,
  resolveSleepCarouselOrder,
} from "../lib/editorial-playlist-helpers.ts";

test("computes meditation playlist completion at 0%, partial and 100%", () => {
  assert.deepEqual(
    computePlaylistCompletion(["a", "b", "c"], []),
    { total: 3, completed: 0, percentage: 0 },
  );
  assert.deepEqual(
    computePlaylistCompletion(["a", "b", "c"], ["b"]),
    { total: 3, completed: 1, percentage: 33 },
  );
  assert.deepEqual(
    computePlaylistCompletion(["a", "b", "c"], ["a", "b", "c"]),
    { total: 3, completed: 3, percentage: 100 },
  );
  assert.deepEqual(
    computePlaylistCompletion(["a", "a", "b"], ["a", "a"]),
    { total: 2, completed: 1, percentage: 50 },
  );
  assert.deepEqual(
    computePlaylistCompletion([], ["a"]),
    { total: 0, completed: 0, percentage: 0 },
  );
});

test("continues a meditation playlist from its first pending session", () => {
  assert.deepEqual(
    resolveMeditationPlaylistResume(["a", "b", "c"], ["a", "b"]),
    { sessionId: "c", index: 2 },
  );
  assert.deepEqual(
    resolveMeditationPlaylistResume(["a", "b", "c"], ["a"], ["a", "c"]),
    { sessionId: "c", index: 2 },
  );
  assert.deepEqual(
    resolveMeditationPlaylistResume(["a", "b", "c"], ["b"]),
    { sessionId: "c", index: 2 },
  );
  assert.deepEqual(
    resolveMeditationPlaylistResume(["a", "b", "c"], ["c"]),
    { sessionId: "a", index: 0 },
  );
  assert.deepEqual(
    resolveMeditationPlaylistResume(["a", "b", "c"], ["a", "b", "c"]),
    { sessionId: "a", index: 0 },
  );
  assert.equal(resolveMeditationPlaylistResume(["a"], [], []), null);
  assert.equal(formatMeditationSessionOrdinal(2), "tercera");
  assert.equal(formatMeditationSessionOrdinal(10), "11.ª");
});

test("resolves every meditation playlist hero play state", () => {
  assert.equal(
    resolveMeditationPlaylistPlayAction({
      currentIsEditorial: true,
      hasPlayableSessions: true,
      hasPremiumSessions: false,
    }),
    "toggle",
  );
  assert.equal(
    resolveMeditationPlaylistPlayAction({
      currentIsEditorial: false,
      hasPlayableSessions: true,
      hasPremiumSessions: false,
    }),
    "play-first",
  );
  assert.equal(
    resolveMeditationPlaylistPlayAction({
      currentIsEditorial: false,
      hasPlayableSessions: false,
      hasPremiumSessions: true,
    }),
    "membership",
  );
  assert.equal(
    resolveMeditationPlaylistPlayAction({
      currentIsEditorial: false,
      hasPlayableSessions: false,
      hasPremiumSessions: false,
    }),
    "unavailable",
  );
});

test("evicts editorial detail cache only for authoritative 404/410", () => {
  assert.equal(classifyEditorialDetailStatus(404), "missing");
  assert.equal(classifyEditorialDetailStatus(410), "missing");
  assert.equal(classifyEditorialDetailStatus(408), "transient");
  assert.equal(classifyEditorialDetailStatus(500), "transient");
});

test("accepts the last valid detail cache and rejects corrupt snapshots", () => {
  assert.deepEqual(
    parseEditorialPlaylistCache<{ slug: string; title: string }>(
      JSON.stringify({ slug: "calma-profunda", title: "Calma profunda" }),
    ),
    { slug: "calma-profunda", title: "Calma profunda" },
  );
  assert.equal(parseEditorialPlaylistCache("{corrupto"), null);
  assert.equal(parseEditorialPlaylistCache(JSON.stringify({ title: "Sin slug" })), null);
});

test("new normal queues reset shuffle while explicit shuffle keeps the first session", () => {
  assert.deepEqual(
    buildEditorialQueue(["a", "b", "c"], "b", false),
    ["a", "b", "c"],
  );
  assert.deepEqual(
    buildEditorialQueue(["a", "b", "c"], "b", true, () => 0),
    ["b", "c", "a"],
  );
  assert.deepEqual(
    buildEditorialQueue(["a", "b", "b", "c"], "b", false),
    ["a", "b", "c"],
  );
});

test("random playback chooses a playable start before shuffling continuation", () => {
  assert.equal(pickRandomQueueStart(["a", "b", "c"], () => 0.8), "c");
  assert.deepEqual(
    buildEditorialQueue(["a", "b", "c"], "c", true, () => 0),
    ["c", "b", "a"],
  );
});

test("resolves multiple named carousels in server order and reuses playlists", () => {
  const playlists = [
    { id: "shared", isActive: true },
    { id: "second", isActive: true },
    { id: "inactive", isActive: false },
  ];
  const carousels = [
    {
      id: 20,
      title: "Después",
      surface: "discover" as const,
      sortOrder: 20,
      isActive: true,
      playlistIds: ["shared", "second", "shared"],
    },
    {
      id: 10,
      title: "Primero",
      surface: "discover" as const,
      sortOrder: 10,
      isActive: true,
      playlistIds: ["shared", "inactive"],
    },
    {
      id: 30,
      title: "Dormir",
      surface: "sleep" as const,
      sortOrder: 1,
      isActive: true,
      playlistIds: ["second"],
    },
  ];

  assert.deepEqual(
    resolvePlaylistCarouselRows(carousels, playlists, "discover").map((carousel) => ({
      id: carousel.id,
      playlistIds: carousel.playlists.map((playlist) => playlist.id),
    })),
    [
      { id: 10, playlistIds: ["shared"] },
      { id: 20, playlistIds: ["shared", "second"] },
    ],
  );
});

test("an explicit empty carousel publication clears all rendered rows", () => {
  const playlists = [{ id: "shared", isActive: true, showOnHome: true }];
  assert.deepEqual(resolvePlaylistCarouselRows([], playlists, "discover"), []);
  assert.deepEqual(
    resolvePlaylistCarouselRows(
      [{
        id: 1,
        title: "Oculto",
        surface: "discover",
        sortOrder: 0,
        isActive: false,
        playlistIds: ["shared"],
      }],
      playlists,
      "discover",
    ),
    [],
  );
});

test("legacy conversion keeps the old Discover home fallback after inactive placements", () => {
  const legacy = buildLegacyPlaylistCarouselRecords([
    {
      slug: "fallback",
      sortOrder: 7,
      showOnHome: true,
      placements: [{ surface: "discover", sortOrder: 2, isActive: false }],
    },
    {
      slug: "placed",
      sortOrder: 99,
      showOnHome: true,
      placements: [{ surface: "discover", sortOrder: 1, isActive: true }],
    },
    {
      slug: "home-only",
      sortOrder: 3,
      showOnHome: true,
      placements: [],
    },
  ]);

  assert.deepEqual(
    legacy.find((carousel) => carousel.surface === "discover")?.playlistIds,
    ["placed", "home-only", "fallback"],
  );
  assert.equal(legacy.some((carousel) => carousel.surface === "sleep"), false);
});

test("interleaves configured sleep carousels and appends newly available content", () => {
  const configured = [
    { key: "playlist:9", label: "Editorial", type: "playlist" as const, visible: true, sortOrder: 2 },
    { key: "session:quiet", label: "Oculto", type: "session" as const, visible: false, sortOrder: 1 },
  ];
  assert.deepEqual(
    resolveSleepCarouselOrder(
      configured,
      ["session:quiet", "session:rest", "playlist:9", "playlist:12"],
      ["session:quiet", "session:rest", "playlist:9", "playlist:12"],
    ),
    ["playlist:9", "session:rest", "playlist:12"],
  );
});

test("an explicit empty sleep order uses deterministic defaults", () => {
  assert.deepEqual(
    resolveSleepCarouselOrder([], ["session:a", "playlist:4", "session:b"]),
    ["session:a", "playlist:4", "session:b"],
  );
});