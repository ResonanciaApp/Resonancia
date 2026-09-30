import assert from "node:assert/strict";
import test from "node:test";
import { computeCompletedWeekStarts, mergeCompletedWeekStarts, type StatEventLike } from "../utils/stats.ts";

const date = (year: number, month: number, day: number) => new Date(year, month - 1, day, 12);
const week = (monday: Date, days = 7): StatEventLike[] => Array.from({ length: days }, (_, index) => {
  const day = new Date(monday);
  day.setDate(day.getDate() + index);
  return { playedAt: day.toISOString(), minutes: 3 };
});
const now = date(2026, 9, 30);

test("counts only complete Monday-Sunday weeks, including year boundaries", () => {
  const events = [
    ...week(date(2025, 12, 29)),
    ...week(date(2026, 1, 12)),
    ...week(date(2026, 1, 19), 6),
  ];
  assert.deepEqual(computeCompletedWeekStarts(events, now), ["2025-12-29", "2026-01-12"]);
});

test("seven consecutive days straddling two incomplete weeks are not a completed week", () => {
  assert.deepEqual(computeCompletedWeekStarts(week(date(2026, 1, 14)), now), []);
});

test("daily activity aggregates minutes or a completed session; duplicate plays do not add days", () => {
  const events = week(date(2026, 1, 12));
  events[0] = { ...events[0], minutes: 1 };
  events.push({ ...events[0], minutes: 2 });
  events[1] = { ...events[1], minutes: 0, completed: true };
  events.push({ ...events[1] });
  assert.deepEqual(computeCompletedWeekStarts(events, now), ["2026-01-12"]);
  assert.deepEqual(computeCompletedWeekStarts(Array(7).fill(events[1]), now), []);
});

test("future and malformed events do not complete a week", () => {
  const events = [...week(date(2026, 9, 28)), { playedAt: "invalid", minutes: 20 }];
  assert.deepEqual(computeCompletedWeekStarts(events, now), []);
  assert.deepEqual(computeCompletedWeekStarts([], now), []);
});

test("calendar grouping remains correct across daylight-saving transitions", () => {
  assert.deepEqual(computeCompletedWeekStarts(week(date(2026, 3, 30)), now), ["2026-03-30"]);
});

test("remote historic weeks and local new weeks are unioned without double counting", () => {
  assert.deepEqual(mergeCompletedWeekStarts(
    ["2026-09-14", "2026-09-21"],
    ["2026-01-12", "2026-09-14"],
    [true, false, true, false, false, false, false],
    now,
  ), ["2026-01-12", "2026-09-14", "2026-09-21"]);
});

test("Sunday completion counts immediately before the next server fetch", () => {
  assert.deepEqual(mergeCompletedWeekStarts([], [], Array(7).fill(true), date(2026, 9, 27)), ["2026-09-21"]);
  assert.deepEqual(mergeCompletedWeekStarts([], [], Array(7).fill(true), now), []);
  assert.deepEqual(mergeCompletedWeekStarts([], [], [], now), []);
});