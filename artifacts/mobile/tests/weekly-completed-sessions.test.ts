import assert from "node:assert/strict";
import test from "node:test";

import {
  getWeeklyCompletedSessions,
  type WeeklyCompletedSessionEvent,
} from "../utils/weekly-completed-sessions.ts";

const localDate = (
  year: number,
  month: number,
  day: number,
  hour = 12,
  minute = 0,
) => new Date(year, month - 1, day, hour, minute).toISOString();

const event = (
  sessionId: string,
  playedAt: string,
  completed: boolean | undefined = true,
): WeeklyCompletedSessionEvent => ({
  sessionId,
  completed,
  playedAt,
});

test("includes current Monday–Sunday events on Sunday and Monday across a year boundary", () => {
  const sundayNow = new Date(2026, 0, 4, 23, 59);
  const sundayWeek = getWeeklyCompletedSessions([
    event("monday", localDate(2025, 12, 29, 0, 1)),
    event("sunday", localDate(2026, 1, 4, 23, 30)),
    event("previous-week", localDate(2025, 12, 28, 23, 59)),
  ], sundayNow);
  assert.deepEqual(sundayWeek.map(({ sessionId }) => sessionId), ["sunday", "monday"]);

  const mondayNow = new Date(2026, 0, 5, 0, 0);
  const mondayWeek = getWeeklyCompletedSessions([
    event("monday", localDate(2026, 1, 5, 0, 0)),
    event("sunday", localDate(2026, 1, 4, 23, 59)),
  ], mondayNow);
  assert.deepEqual(mondayWeek.map(({ sessionId }) => sessionId), ["monday"]);
});

test("week membership follows the local timezone rather than the UTC calendar date", () => {
  const originalTimezone = process.env.TZ;
  process.env.TZ = "America/Los_Angeles";
  try {
    const now = new Date("2026-01-05T00:45:00-08:00");
    const result = getWeeklyCompletedSessions([
      event("local-monday", "2026-01-05T00:15:00-08:00"),
      event("local-sunday", "2026-01-04T23:30:00-08:00"),
    ], now);
    assert.deepEqual(result.map(({ sessionId }) => sessionId), ["local-monday"]);
  } finally {
    if (originalTimezone === undefined) delete process.env.TZ;
    else process.env.TZ = originalTimezone;
  }
});

test("local calendar week handles the spring DST transition without 7-day millisecond arithmetic", () => {
  const originalTimezone = process.env.TZ;
  process.env.TZ = "America/New_York";
  try {
    const now = new Date(2026, 2, 8, 23, 50);
    const nextMonday = new Date(2026, 2, 9, 0, 0);
    assert.equal((nextMonday.getTime() - new Date(2026, 2, 2).getTime()) / 3_600_000, 167);

    const result = getWeeklyCompletedSessions([
      event("week-monday", localDate(2026, 3, 2, 0, 1)),
      event("dst-sunday", localDate(2026, 3, 8, 23, 45)),
      event("next-monday", localDate(2026, 3, 9, 0, 0)),
    ], now);
    assert.deepEqual(result.map(({ sessionId }) => sessionId), ["dst-sunday", "week-monday"]);
  } finally {
    if (originalTimezone === undefined) delete process.env.TZ;
    else process.env.TZ = originalTimezone;
  }
});

test("includes only explicitly completed events and excludes invalid, future, and other-week events", () => {
  const now = new Date(2026, 4, 13, 12);
  const legacy = event("legacy", localDate(2026, 5, 12, 13));
  delete legacy.completed;
  const result = getWeeklyCompletedSessions([
    event("completed", localDate(2026, 5, 12, 15)),
    event("false", localDate(2026, 5, 12, 14), false),
    legacy,
    event("invalid", "not-a-date"),
    event("future", localDate(2026, 5, 14, 12)),
    event("other-week", localDate(2026, 5, 10, 23, 59)),
  ], now);
  assert.deepEqual(result.map(({ sessionId }) => sessionId), ["completed"]);
});

test("dedupes the same session and timestamp but preserves repeat completions and sorts newest first", () => {
  const repeated = event("repeat", localDate(2026, 5, 12, 9));
  const events = [
    repeated,
    event("other", localDate(2026, 5, 13, 8)),
    { ...repeated },
    event("repeat", localDate(2026, 5, 13, 7)),
  ];
  const result = getWeeklyCompletedSessions(events, new Date(2026, 4, 13, 12));
  assert.deepEqual(
    result.map(({ sessionId, playedAt }) => [sessionId, playedAt]),
    [
      ["other", localDate(2026, 5, 13, 8)],
      ["repeat", localDate(2026, 5, 13, 7)],
      ["repeat", localDate(2026, 5, 12, 9)],
    ],
  );
});

test("does not mutate the source event array or its entries", () => {
  const source = [
    event("older", localDate(2026, 5, 12, 9)),
    event("newer", localDate(2026, 5, 13, 8)),
  ];
  const snapshot = source.map((item) => ({ ...item }));
  Object.freeze(source);
  source.forEach(Object.freeze);

  const result = getWeeklyCompletedSessions(source, new Date(2026, 4, 13, 12));
  assert.deepEqual(source, snapshot);
  assert.deepEqual(result.map(({ sessionId }) => sessionId), ["newer", "older"]);
});