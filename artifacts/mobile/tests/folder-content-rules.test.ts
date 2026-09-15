import assert from "node:assert/strict";
import test from "node:test";

import {
  canAddMixToFolder,
  canAddPlaylistToFolder,
  getFolderContentType,
  sanitizeExclusiveFolderContents,
} from "../lib/folder-content-rules.ts";

test("an empty folder accepts playlists or mixes", () => {
  const folder = { playlistIds: [], presetIds: [] };
  assert.equal(getFolderContentType(folder), null);
  assert.equal(canAddPlaylistToFolder(folder), true);
  assert.equal(canAddMixToFolder(folder), true);
});

test("a playlist folder rejects mixes and a mix folder rejects playlists", () => {
  assert.equal(canAddMixToFolder({ playlistIds: ["p1"], presetIds: [] }), false);
  assert.equal(canAddPlaylistToFolder({ playlistIds: [], presetIds: ["m1"] }), false);
});

test("legacy mixed folders keep the type with the newest item", () => {
  const folder = { id: "f1", playlistIds: ["p1"], presetIds: ["m1"] };
  const playlists = [{ id: "p1", createdAt: "2026-01-01T00:00:00.000Z" }];
  const mixes = [{ id: "m1", createdAt: "2026-02-01T00:00:00.000Z" }];

  assert.deepEqual(
    sanitizeExclusiveFolderContents([folder], playlists, mixes),
    [{ id: "f1", playlistIds: [], presetIds: ["m1"] }],
  );
});

test("legacy mixed folders keep playlists when dates tie", () => {
  const date = "2026-01-01T00:00:00.000Z";
  const folder = { id: "f1", playlistIds: ["p1"], presetIds: ["m1"] };

  assert.deepEqual(
    sanitizeExclusiveFolderContents(
      [folder],
      [{ id: "p1", createdAt: date }],
      [{ id: "m1", createdAt: date }],
    ),
    [{ id: "f1", playlistIds: ["p1"], presetIds: [] }],
  );
});

test("sanitation prunes dangling references before choosing a type", () => {
  const folder = {
    id: "f1",
    playlistIds: ["missing-playlist"],
    presetIds: ["m1", "missing-mix"],
  };

  assert.deepEqual(
    sanitizeExclusiveFolderContents(
      [folder],
      [],
      [{ id: "m1", createdAt: "2026-02-01T00:00:00.000Z" }],
    ),
    [{ id: "f1", playlistIds: [], presetIds: ["m1"] }],
  );
});