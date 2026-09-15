import assert from "node:assert/strict";
import test from "node:test";

import {
  claimRoutineCompletion,
  enqueueRoutineCompletion,
  hasPendingRoutineCompletion,
} from "./routineCompletionQueue.ts";

test("completion claims block rapid duplicates but allow a later valid completion", () => {
  const inFlight = new Set();
  assert.equal(claimRoutineCompletion(inFlight, "2026-09-15:activity-1"), true);
  assert.equal(claimRoutineCompletion(inFlight, "2026-09-15:activity-1"), false);
  inFlight.clear();
  assert.equal(claimRoutineCompletion(inFlight, "2026-09-15:activity-1"), true);
});

test("rapid completions retain the active event and coalesce pending totals", () => {
  const first = { id: 1, kind: "completed", previousCount: 0, nextCount: 1 };
  const second = { id: 2, kind: "completed", previousCount: 1, nextCount: 2 };
  const latest = { id: 3, kind: "completed", previousCount: 2, nextCount: 3 };

  const queued = enqueueRoutineCompletion(
    enqueueRoutineCompletion([first], second),
    latest,
  );

  assert.deepEqual(queued, [first, latest]);
  assert.equal(hasPendingRoutineCompletion(queued), true);
});

test("added events keep their order while pending completion totals coalesce", () => {
  const active = { id: 1, kind: "completed", previousCount: 0, nextCount: 1 };
  const added = { id: 2, kind: "added" };
  const second = { id: 3, kind: "completed", previousCount: 1, nextCount: 2 };
  const latest = { id: 4, kind: "completed", previousCount: 2, nextCount: 3 };

  const queued = enqueueRoutineCompletion(
    enqueueRoutineCompletion([active, added], second),
    latest,
  );

  assert.deepEqual(queued, [active, added, latest]);
  assert.equal(hasPendingRoutineCompletion(queued), true);
});