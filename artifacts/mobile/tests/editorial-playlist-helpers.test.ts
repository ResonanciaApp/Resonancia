import assert from "node:assert/strict";
import test from "node:test";

import {
  buildEditorialQueue,
  classifyEditorialDetailStatus,
  parseEditorialPlaylistCache,
  pickRandomQueueStart,
} from "../lib/editorial-playlist-helpers.ts";

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