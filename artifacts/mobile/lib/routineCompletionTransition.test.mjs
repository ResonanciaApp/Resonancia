import assert from "node:assert/strict";
import test from "node:test";

import {
  consumeRoutineAdditionTransition,
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