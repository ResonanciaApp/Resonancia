import assert from "node:assert/strict";
import test from "node:test";

import { commitPracticeNotificationUpdate } from "../lib/practice-notification-transaction.ts";

test("persists and applies a practice notification update", async () => {
  const operations: string[] = [];
  const result = await commitPracticeNotificationUpdate({
    current: "old",
    next: "new",
    persist: async (value) => {
      operations.push(`persist:${value}`);
    },
    applyNext: async () => {
      operations.push("apply:new");
    },
    restoreCurrent: async () => {
      operations.push("restore:old");
    },
  });

  assert.equal(result, "new");
  assert.deepEqual(operations, ["persist:new", "apply:new"]);
});

test("restores persisted and native state when scheduling or cancellation fails", async () => {
  const operations: string[] = [];

  await assert.rejects(
    commitPracticeNotificationUpdate({
      current: "old",
      next: "new",
      persist: async (value) => {
        operations.push(`persist:${value}`);
      },
      applyNext: async () => {
        operations.push("apply:new");
        throw new Error("native operation failed");
      },
      restoreCurrent: async () => {
        operations.push("restore:old");
      },
    }),
    /native operation failed/,
  );

  assert.deepEqual(operations, [
    "persist:new",
    "apply:new",
    "persist:old",
    "restore:old",
  ]);
});