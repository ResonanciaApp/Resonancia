import assert from "node:assert/strict";
import test from "node:test";

import {
  SOUND_PREVIEW_DURATION_MS,
} from "../lib/sound-preview.ts";

test("preview duration is fixed at ten seconds", () => {
  assert.equal(SOUND_PREVIEW_DURATION_MS, 10_000);
});