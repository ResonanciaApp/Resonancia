import assert from "node:assert/strict";
import test from "node:test";
import { clampReflectionStoryComposition, canShareReflection, getStableIdempotencyKey } from "../lib/reflection-story-logic.ts";

test("canShareReflection respects character limits", () => {
  assert.equal(canShareReflection("Hello world"), true);
  const longString = Array(200).fill("a").join("");
  assert.equal(canShareReflection(longString), false);
});

test("clampReflectionStoryComposition clamps extreme values", () => {
  const raw = {
    backgroundScale: 5,
    backgroundX: 100,
    backgroundY: -100,
    textX: 100,
    textY: -100,
  };

  const clamped = clampReflectionStoryComposition(raw);

  assert.ok(clamped.backgroundScale <= 3);
  assert.ok(clamped.backgroundX <= ((3 - 1) / 2));
  assert.ok(clamped.textX <= (100 / 1080));
});

test("getStableIdempotencyKey regenerates only on payload change", () => {
  const payloadA = { a: 1 };
  const state1 = getStableIdempotencyKey(payloadA, { hash: "", key: "" });

  assert.ok(state1.key.length > 0);
  assert.equal(state1.hash, JSON.stringify(payloadA));

  const state2 = getStableIdempotencyKey(payloadA, state1);
  assert.equal(state1.key, state2.key, "key should be identical for same payload");

  const payloadB = { a: 2 };
  const state3 = getStableIdempotencyKey(payloadB, state2);
  assert.notEqual(state2.key, state3.key, "key should change for different payload");
});
