import assert from "node:assert/strict";
import test from "node:test";
import {
  getAutomaticGreeting,
  millisecondsUntilNextGreetingBoundary,
  resolveGreeting,
} from "../lib/greeting.ts";

const at = (hour: number) => new Date(2024, 0, 1, hour, 0, 0);

test("automatic greeting uses inclusive/exclusive local hour boundaries", () => {
  assert.equal(getAutomaticGreeting(at(5)), "Buenas noches");
  assert.equal(getAutomaticGreeting(at(6)), "Buenos días");
  assert.equal(getAutomaticGreeting(at(11)), "Buenos días");
  assert.equal(getAutomaticGreeting(at(12)), "Buenas tardes");
  assert.equal(getAutomaticGreeting(at(18)), "Buenas tardes");
  assert.equal(getAutomaticGreeting(at(19)), "Buenas noches");
  assert.equal(getAutomaticGreeting(at(23)), "Buenas noches");
});

test("enabled nonblank remote text wins over cache and automatic value", () => {
  assert.equal(
    resolveGreeting(
      { enabled: true, text: "  Hola, alma  " },
      { enabled: true, text: "Cached" },
      at(12),
    ),
    "Hola, alma",
  );
});

test("disabled or blank remote responses invalidate cached override", () => {
  assert.equal(resolveGreeting({ enabled: false, text: "Old" }, { enabled: true, text: "Cached" }, at(12)), "Buenas tardes");
  assert.equal(resolveGreeting({ enabled: true, text: " " }, { enabled: true, text: "Cached" }, at(6)), "Buenos días");
});

test("schedules a refresh at every local greeting boundary", () => {
  const minute = 60_000;
  assert.equal(
    millisecondsUntilNextGreetingBoundary(new Date(2024, 0, 1, 5, 59, 0)),
    minute,
  );
  assert.equal(
    millisecondsUntilNextGreetingBoundary(new Date(2024, 0, 1, 11, 59, 0)),
    minute,
  );
  assert.equal(
    millisecondsUntilNextGreetingBoundary(new Date(2024, 0, 1, 18, 59, 0)),
    minute,
  );
  assert.equal(
    millisecondsUntilNextGreetingBoundary(new Date(2024, 0, 1, 19, 0, 0)),
    11 * 60 * minute,
  );
});