import assert from "node:assert/strict";
import test from "node:test";

import {
  consumeRoutineCompletionTransition,
  consumeRoutineAdditionTransition,
  markRoutineCompletionTransition,
  markRoutineAdditionTransition,
} from "./routineCompletionTransition.ts";

test("an addition transition carries its activity id and is consumed once", () => {
  markRoutineAdditionTransition("activity-from-calendar");

  assert.equal(
    consumeRoutineAdditionTransition(),
    "activity-from-calendar",
  );
  assert.equal(consumeRoutineAdditionTransition(), null);
});

test("a completion transition carries the exact counter change", () => {
  markRoutineCompletionTransition("activity-1", "2026-09-15", 0, 2, 3);

  assert.deepEqual(consumeRoutineCompletionTransition(), {
    activityId: "activity-1",
    dateKey: "2026-09-15",
    occurrenceIndex: 0,
    previousCount: 2,
    nextCount: 3,
    token: 1,
  });
  assert.equal(consumeRoutineCompletionTransition(), null);
});