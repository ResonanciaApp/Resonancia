import assert from "node:assert/strict";
import test from "node:test";

import {
  getSoundPreviewElapsed,
  getSoundPreviewRemaining,
  SOUND_PREVIEW_DURATION_MS,
} from "../lib/sound-preview.ts";

test("preview duration is fixed at ten seconds", () => {
  assert.equal(SOUND_PREVIEW_DURATION_MS, 10_000);
});

test("pausing accumulates elapsed playback time", () => {
  assert.equal(getSoundPreviewElapsed(2_000, 5_000, 8_500), 5_500);
});

test("elapsed preview time never exceeds ten seconds", () => {
  assert.equal(getSoundPreviewElapsed(8_000, 1_000, 9_000), 10_000);
});

test("resuming uses only the remaining preview time", () => {
  assert.equal(getSoundPreviewRemaining(5_500), 4_500);
  assert.equal(getSoundPreviewRemaining(12_000), 0);
});