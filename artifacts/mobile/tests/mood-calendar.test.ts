import assert from "node:assert/strict";
import test from "node:test";

import {
  buildMoodCalendarMonth,
  buildMoodCalendarRange,
} from "../data/mood-calendar.ts";
import { MOOD_CALENDAR_COLORS } from "../data/mood-calendar-colors.ts";
import type { MoodHistoryRecord } from "../data/mood-history.ts";

function record(
  id: string,
  createdAt: string,
  moodIds: MoodHistoryRecord["moodIds"] = ["feliz"],
): MoodHistoryRecord {
  return { id, createdAt, moodIds, answers: {} };
}

test("aligns a month from Monday through Sunday", () => {
  const month = buildMoodCalendarMonth(new Date(2026, 8, 1), []);
  assert.equal(month.cells[0].day, null);
  assert.equal(month.cells[1].day, 1);
  assert.equal(month.cells.at(-1)?.day, null);
  assert.equal(month.cells.length % 7, 0);
});

test("includes leap day and keeps complete calendar rows", () => {
  const month = buildMoodCalendarMonth(new Date(2028, 1, 1), []);
  assert.equal(month.cells.filter((cell) => cell.day !== null).length, 29);
  assert.equal(month.cells.length, 35);
});

test("builds every month from the first record through the current month", () => {
  const months = buildMoodCalendarRange(
    [record("first", "2026-01-12T12:00:00.000Z")],
    new Date(2026, 3, 15),
  );
  assert.deepEqual(months.map((month) => month.key), [
    "2026-01",
    "2026-02",
    "2026-03",
    "2026-04",
  ]);
});

test("uses only the first record and first emotion displayed for a day", () => {
  const newer = record("newer", "2026-09-15T18:00:00", ["feliz", "ansioso"]);
  const older = record("older", "2026-09-15T08:00:00", ["triste"]);
  const month = buildMoodCalendarMonth(new Date(2026, 8, 1), [newer, older]);
  const day = month.cells.find((cell) => cell.day === 15);
  assert.equal(day?.record?.id, "newer");
  assert.equal(day?.record?.moodIds[0], "feliz");
});

test("uses the reference palette for each calendar emotion group", () => {
  for (const id of ["agradecido", "emocionado", "lleno-de-amor"] as const) {
    assert.deepEqual(MOOD_CALENDAR_COLORS[id], ["#56B3CD", "#62A2D2"]);
  }
  for (const id of ["feliz", "esperanzado", "contento"] as const) {
    assert.deepEqual(MOOD_CALENDAR_COLORS[id], ["#41BB9F", "#2CA379"]);
  }
  for (const id of ["ansioso", "cansado", "inepto", "solo", "deprimido", "triste"] as const) {
    assert.deepEqual(MOOD_CALENDAR_COLORS[id], ["#E77A8D", "#FA876C"]);
  }
  for (const id of ["enojado", "adolorido", "desmotivado", "estresado"] as const) {
    assert.deepEqual(MOOD_CALENDAR_COLORS[id], ["#C581BB", "#EC8282"]);
  }
  for (const id of ["presente", "en-paz"] as const) {
    assert.deepEqual(MOOD_CALENDAR_COLORS[id], ["#9188E2", "#BB7EBF"]);
  }
});