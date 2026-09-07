import assert from "node:assert/strict";
import test from "node:test";

import { SEARCH_DURATION_RANGES } from "../constants/searchDuration.ts";

function rangeFor(minutes: number): string | undefined {
  return SEARCH_DURATION_RANGES.find(
    (range) => minutes >= range.min && minutes <= range.max,
  )?.id;
}

test("clasifica correctamente todas las fronteras", () => {
  assert.equal(rangeFor(0), "under-5");
  assert.equal(rangeFor(4), "under-5");
  assert.equal(rangeFor(5), "5-10");
  assert.equal(rangeFor(10), "5-10");
  assert.equal(rangeFor(11), "10-15");
  assert.equal(rangeFor(15), "10-15");
  assert.equal(rangeFor(16), "15-25");
  assert.equal(rangeFor(25), "15-25");
  assert.equal(rangeFor(26), "over-25");
});

test("no deja minutos positivos sin clasificar", () => {
  for (let minutes = 0; minutes <= 180; minutes += 1) {
    assert.notEqual(rangeFor(minutes), undefined);
  }
});