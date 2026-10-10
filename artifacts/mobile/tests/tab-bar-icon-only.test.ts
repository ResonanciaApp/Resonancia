import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { TAB_BAR_NAVIGATION_HEIGHT } from "../constants/tab-bar.ts";

test("icon-only tabs remove visible labels but retain accessible names and selection", () => {
  const source = readFileSync(new URL("../app/(tabs)/_layout.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(source, /styles\.labelWrap|styles\.label|TAB_LABEL_OFFSET_Y/);
  assert.match(source, /accessibilityLabel=\{conf\.label\}/);
  assert.match(source, /accessibilityState=\{\{ selected: isFocused \}\}/);
  assert.match(source, /\{makeIcon\(isFocused\)\}/);
  assert.doesNotMatch(source, /TAB_CONTENT_OFFSET_Y/);
});

test("bar, notices and bottom canvas reserves share a height reduced by exactly 15px", () => {
  assert.equal(58 - TAB_BAR_NAVIGATION_HEIGHT, 15);
  const tabs = readFileSync(new URL("../app/(tabs)/_layout.tsx", import.meta.url), "utf8");
  assert.match(tabs, /const PILL_H\s*=\s*TAB_BAR_NAVIGATION_HEIGHT/);
  assert.match(tabs, /const barHeight = PILL_H \+ pb/);
  assert.match(tabs, /const tabBarHeight\s*=\s*PILL_H \+ bottomPb/);
  for (const inset of [0, 8, 24, 34]) {
    assert.equal((58 + inset) - (TAB_BAR_NAVIGATION_HEIGHT + inset), 15);
  }
  const profile = readFileSync(new URL("../components/ProfileScreenBase.tsx", import.meta.url), "utf8");
  assert.match(profile, /profileReflectionBannerBottom = TAB_BAR_NAVIGATION_HEIGHT \+/);
  const canvas = readFileSync(new URL("../app/(tabs)/geometrix.tsx", import.meta.url), "utf8");
  assert.match(canvas, /const tabBarHeight = TAB_BAR_NAVIGATION_HEIGHT \+ bottomPb/);
});
