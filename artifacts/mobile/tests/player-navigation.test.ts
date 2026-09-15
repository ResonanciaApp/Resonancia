import assert from "node:assert/strict";
import test from "node:test";

import {
  closePlayerForOrigin,
  stopPlaylistPlaybackOnUnmount,
} from "../lib/player-navigation.ts";

function createCloseHarness(canGoBack: boolean) {
  const calls: string[] = [];
  return {
    calls,
    dependencies: {
      stop: async () => {
        calls.push("stop");
      },
      canGoBack: () => canGoBack,
      back: () => {
        calls.push("back");
      },
      replace: (path: string) => {
        calls.push(`replace:${path}`);
      },
    },
  };
}

test("playlist close stops playback before returning to its existing route", async () => {
  const harness = createCloseHarness(true);

  await closePlayerForOrigin("calma-profunda", harness.dependencies);

  assert.deepEqual(harness.calls, ["stop", "back"]);
});

test("playlist close returns to the originating slug when there is no back route", async () => {
  const harness = createCloseHarness(false);

  await closePlayerForOrigin("calma-profunda", harness.dependencies);

  assert.deepEqual(harness.calls, [
    "stop",
    "replace:/editorial-playlist/calma-profunda",
  ]);
});

test("native dismissal stops playlist audio once but ignores an already handled close", () => {
  let stopCalls = 0;
  const stop = () => {
    stopCalls += 1;
  };

  assert.equal(stopPlaylistPlaybackOnUnmount("calma-profunda", false, stop), true);
  assert.equal(stopPlaylistPlaybackOnUnmount("calma-profunda", true, stop), false);
  assert.equal(stopCalls, 1);
});

test("plain player close keeps global playback behavior and only navigates back", async () => {
  const harness = createCloseHarness(true);

  await closePlayerForOrigin(undefined, harness.dependencies);

  assert.deepEqual(harness.calls, ["back"]);
  assert.equal(
    stopPlaylistPlaybackOnUnmount(undefined, false, harness.dependencies.stop),
    false,
  );
  assert.deepEqual(harness.calls, ["back"]);
});

test("private playlist close stops playback before returning", async () => {
  const harness = createCloseHarness(true);

  await closePlayerForOrigin(undefined, harness.dependencies, "playlist-1");

  assert.deepEqual(harness.calls, ["stop", "back"]);
});

test("private playlist close falls back to its detail without back history", async () => {
  const harness = createCloseHarness(false);

  await closePlayerForOrigin(undefined, harness.dependencies, "playlist-1");

  assert.deepEqual(harness.calls, [
    "stop",
    "replace:/playlist/playlist-1",
  ]);
});

test("native dismissal stops private playlist audio", () => {
  let stopCalls = 0;
  const stop = () => {
    stopCalls += 1;
  };

  assert.equal(
    stopPlaylistPlaybackOnUnmount(undefined, false, stop, "playlist-1"),
    true,
  );
  assert.equal(stopCalls, 1);
});