import test from "node:test";
import assert from "node:assert/strict";

import { padWithBootstrap, type ResolvedCatalogRecord } from "../lib/cover-preset-catalog-logic.ts";
import {
  canShareReflection,
  clampReflectionStoryComposition,
  DEFAULT_REFLECTION_STORY_COMPOSITION,
  reflectionBackgroundOffsetLimit,
  reflectionCharacterCount,
} from "../lib/reflection-story-logic.ts";

const mockItem = (id: string, source: string): ResolvedCatalogRecord<string> => ({
  id,
  key: id,
  label: id,
  source,
});

test("Reflection story catalog maintains exactly 100 stable ordered slots", () => {
  const bootstrap: ResolvedCatalogRecord<string>[] = [];
  for (let i = 1; i <= 100; i++) {
    bootstrap.push(mockItem(String(i).padStart(2, "0"), "builtin"));
  }
  
  assert.equal(bootstrap.length, 100, "Must have exactly 100 default background slots");
  
  // Simulated resolved remote response with fewer items (e.g., 2 items)
  const resolvedRemote = [
    { ...bootstrap[5], source: "remote-6" },
    { ...bootstrap[1], source: "remote-2" },
    mockItem("not-a-stable-slot", "ignored"),
  ];

  const finalCatalog = padWithBootstrap(resolvedRemote, bootstrap);
  assert.equal(finalCatalog.length, 100, "Missing remote items must be padded with bootstrap items to maintain 100 slots");
  assert.equal(finalCatalog[0].key, "01", "A missing first slot must be restored without moving the default");
  assert.equal(finalCatalog[1].id, "06", "Remote order must continue after the restored first slot");
  assert.equal(finalCatalog[1].source, "remote-6", "Remote source must be preserved");
});

test("Text length constraint: <=160 is allowed, >160 is rejected", () => {
  assert.equal(canShareReflection("A".repeat(160)), true);
  assert.equal(canShareReflection("A".repeat(161)), false);
  assert.equal(canShareReflection(`  ${"A".repeat(160)}  `), true);
  assert.equal(reflectionCharacterCount("🧘".repeat(160)), 160, "Emoji count as visible characters");
  assert.equal(reflectionCharacterCount("👨‍👩‍👧‍👦".repeat(160)), 160, "Joined emoji count as one grapheme");
  assert.equal(reflectionCharacterCount("a\u0301".repeat(160)), 160, "Combining accents count as one grapheme");
});

test("Story background offsets stay inside the crop at every zoom level", () => {
  assert.equal(reflectionBackgroundOffsetLimit(1), 0);
  assert.equal(reflectionBackgroundOffsetLimit(2), 0.5);
  assert.equal(reflectionBackgroundOffsetLimit(3), 1);
  assert.equal(reflectionBackgroundOffsetLimit(99), 1, "Scale is capped before calculating limits");
});

test("Story composition clamps zoom, background crop, and text safe area", () => {
  assert.deepEqual(
    clampReflectionStoryComposition({
      backgroundScale: 1,
      backgroundX: 0.4,
      backgroundY: -0.4,
      textX: 1,
      textY: -1,
    }),
    {
      backgroundScale: 1,
      backgroundX: 0,
      backgroundY: 0,
      textX: 100 / 1080,
      textY: -500 / 1920,
    },
  );

  assert.deepEqual(
    clampReflectionStoryComposition({
      ...DEFAULT_REFLECTION_STORY_COMPOSITION,
      backgroundScale: 2,
      backgroundX: 0.75,
      backgroundY: -0.75,
    }),
    {
      ...DEFAULT_REFLECTION_STORY_COMPOSITION,
      backgroundScale: 2,
      backgroundX: 0.5,
      backgroundY: -0.5,
    },
  );
});
