import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { URL } from "node:url";
import {
  DURATION_SHEET_OPEN_SPEED,
  DURATION_SHEET_OPEN_SPRING,
  DURATION_SHEET_OPEN_BACKDROP_MS,
} from "../lib/ambiental-duration-opening.ts";

test("opening is 10% slower without changing the spring trajectory or bounce", () => {
  assert.equal(DURATION_SHEET_OPEN_SPEED, 0.9);
  const oldStiffness = (55 - 30) * 3.62 + 194;
  const oldDamping = (8 - 8) * 3 + 25;
  const response = (seconds: number, stiffness: number, damping: number) => {
    const decay = damping / 2;
    const frequency = Math.sqrt(stiffness - decay ** 2);
    return 400 * Math.exp(-decay * seconds) *
      (Math.cos(frequency * seconds) + decay / frequency * Math.sin(frequency * seconds));
  };
  for (const seconds of [0, 0.1, 0.25, 0.5, 0.75, 1, 1.5]) {
    assert.ok(Math.abs(
      response(seconds, DURATION_SHEET_OPEN_SPRING.stiffness, DURATION_SHEET_OPEN_SPRING.damping) -
      response(seconds * 0.9, oldStiffness, oldDamping),
    ) < 1e-8);
  }
  assert.equal(DURATION_SHEET_OPEN_SPRING.mass, 1);
  assert.equal(DURATION_SHEET_OPEN_SPRING.restSpeedThreshold, 0.001 * 0.9);
  assert.equal(DURATION_SHEET_OPEN_BACKDROP_MS, 556);
});

test("the sheet applies the slower spring and backdrop together, without changing its closing motion", () => {
  const source = readFileSync(new URL("../components/AmbientalDurationSheet.tsx", import.meta.url), "utf8");
  assert.match(source, /Animated\.spring\(sheetY,\s*\{\s*toValue: 0,\s*\.\.\.DURATION_SHEET_OPEN_SPRING,\s*useNativeDriver: true/);
  assert.match(source, /toValue: 0\.62,\s*duration: DURATION_SHEET_OPEN_BACKDROP_MS/);
  assert.match(source, /toValue: Math\.max\(SHEET_HEIGHT, baselineHeight\.current\) \+ MANUAL_HEIGHT_INCREASE \+ 80,\s*duration: 500/);
  assert.match(source, /toValue: 0,\s*duration: 460/);
});