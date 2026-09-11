import assert from "node:assert/strict";
import test from "node:test";

import {
  buildVisibleFavoriteTabs,
  resolveSavedEditorialFavorites,
} from "../lib/favorites-home-helpers.ts";

test("keeps Ver todos fixed and only exposes non-empty favorite collections", () => {
  const tabs = buildVisibleFavoriteTabs(
    ["musica-sonidos", "meditaciones-guiadas", "musica-sonidos"],
    false,
    true,
  );

  assert.deepEqual(
    tabs.map((tab) => tab.id),
    ["all", "meditaciones", "musica", "playlists"],
  );
});

test("rebuilds the visible tab set when a favorite session changes catalog category", () => {
  const before = buildVisibleFavoriteTabs(["musica-sonidos"], false, false);
  const after = buildVisibleFavoriteTabs(["meditaciones-guiadas"], false, false);

  assert.deepEqual(before.map((tab) => tab.id), ["all", "musica"]);
  assert.deepEqual(after.map((tab) => tab.id), ["all", "meditaciones"]);
});

test("shows only Ver todos when every favorite collection is empty", () => {
  assert.deepEqual(
    buildVisibleFavoriteTabs([], false, false).map((tab) => tab.id),
    ["all"],
  );
});

test("resolves saved playlists in order and drops duplicate, missing and inactive ids", () => {
  const playlists = [
    { id: "music", isActive: true },
    { id: "meditations", isActive: true },
    { id: "hidden", isActive: false },
  ];

  assert.deepEqual(
    resolveSavedEditorialFavorites(
      ["meditations", "missing", "hidden", "music", "meditations"],
      playlists,
    ).map((playlist) => playlist.id),
    ["meditations", "music"],
  );
});