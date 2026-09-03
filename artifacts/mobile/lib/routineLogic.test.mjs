import assert from "node:assert/strict";
import test from "node:test";

import {
  canMutateRoutineDate,
  completeRoutineDate,
  getRoutineDateFromKey,
  isRoutineActivityScheduledForDate,
  skipRoutineDate,
} from "./routineLogic.ts";

const base = {
  repeatDays: [0, 1, 2, 3, 4, 5, 6],
  completedDates: [],
  skippedDates: [],
  archivedAt: null,
  createdAt: "2026-09-01T12:00:00.000Z",
};

test("a daily routine is scheduled from its creation date", () => {
  assert.equal(
    isRoutineActivityScheduledForDate(base, getRoutineDateFromKey("2026-09-02")),
    true,
  );
  assert.equal(
    isRoutineActivityScheduledForDate(base, getRoutineDateFromKey("2026-08-31")),
    false,
  );
});

test("archiving stops future scheduling without erasing past dates", () => {
  const archived = { ...base, archivedAt: "2026-09-04T10:00:00.000Z" };
  assert.equal(
    isRoutineActivityScheduledForDate(archived, getRoutineDateFromKey("2026-09-03")),
    true,
  );
  assert.equal(
    isRoutineActivityScheduledForDate(archived, getRoutineDateFromKey("2026-09-04")),
    false,
  );
});

test("daily state can only mutate on scheduled, non-archived dates", () => {
  const weekdaysOnly = { ...base, repeatDays: [0, 1, 2, 3, 4] };
  assert.equal(canMutateRoutineDate(weekdaysOnly, "2026-09-02"), true);
  assert.equal(canMutateRoutineDate(weekdaysOnly, "2026-09-06"), false);
  assert.equal(
    canMutateRoutineDate(
      { ...weekdaysOnly, archivedAt: "2026-09-02T18:00:00.000Z" },
      "2026-09-02",
    ),
    false,
  );
});

test("completion is idempotent and replaces a skipped state", () => {
  const skipped = { ...base, skippedDates: ["2026-09-02"] };
  const completed = completeRoutineDate(skipped, "2026-09-02");
  assert.deepEqual(completed.completedDates, ["2026-09-02"]);
  assert.deepEqual(completed.skippedDates, []);
  assert.equal(completeRoutineDate(completed, "2026-09-02"), completed);
});

test("skipping is idempotent and replaces a completed state", () => {
  const completed = { ...base, completedDates: ["2026-09-02"] };
  const skipped = skipRoutineDate(completed, "2026-09-02");
  assert.deepEqual(skipped.completedDates, []);
  assert.deepEqual(skipped.skippedDates, ["2026-09-02"]);
  assert.equal(skipRoutineDate(skipped, "2026-09-02"), skipped);
});