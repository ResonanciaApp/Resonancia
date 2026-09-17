import assert from "node:assert/strict";
import test from "node:test";

import {
  getNestedScrollItemY,
  isVerticalItemRevealed,
} from "../utils/scroll-reveal.ts";

test("keeps an item hidden before it crosses the viewport threshold", () => {
  assert.equal(
    isVerticalItemRevealed({
      itemY: 900,
      scrollY: 100,
      viewportHeight: 800,
    }),
    false,
  );
});

test("reveals an item when scrolling carries it across the threshold", () => {
  assert.equal(
    isVerticalItemRevealed({
      itemY: 900,
      scrollY: 250,
      viewportHeight: 800,
    }),
    true,
  );
});

test("clamps custom thresholds to the visible viewport", () => {
  assert.equal(
    isVerticalItemRevealed({
      itemY: 801,
      scrollY: 0,
      viewportHeight: 800,
      threshold: 2,
    }),
    false,
  );
});

test("includes a nested content offset before checking visibility", () => {
  const quoteY = getNestedScrollItemY(355, 620);
  assert.equal(
    isVerticalItemRevealed({
      itemY: quoteY,
      scrollY: 100,
      viewportHeight: 800,
    }),
    false,
  );
  assert.equal(
    isVerticalItemRevealed({
      itemY: quoteY,
      scrollY: 350,
      viewportHeight: 800,
    }),
    true,
  );
});