import assert from "node:assert/strict";
import test from "node:test";

import { dedupeCompletedHistoryByDay } from "../lib/history-calendar.ts";

test("shows a completed session only once per day", () => {
  const entries = dedupeCompletedHistoryByDay([
    {
      sessionId: "prueba-33",
      playedAt: "2026-09-15T10:00:00.000Z",
      categoryLabel: "Meditación",
    },
    {
      sessionId: "prueba-33",
      playedAt: "2026-09-15T12:00:00.000Z",
      categoryLabel: "Meditación",
    },
  ]);

  assert.equal(entries.length, 1);
  assert.equal(entries[0]?.playedAt, "2026-09-15T12:00:00.000Z");
});

test("keeps the same completed session on different days", () => {
  const entries = dedupeCompletedHistoryByDay([
    { sessionId: "prueba-33", playedAt: "2026-09-14T12:00:00.000Z" },
    { sessionId: "prueba-33", playedAt: "2026-09-15T12:00:00.000Z" },
  ]);

  assert.equal(entries.length, 2);
});

test("keeps different sessions completed on the same day", () => {
  const entries = dedupeCompletedHistoryByDay([
    { sessionId: "prueba-33", playedAt: "2026-09-15T10:00:00.000Z" },
    { sessionId: "prueba-34", playedAt: "2026-09-15T10:00:00.000Z" },
  ]);

  assert.equal(entries.length, 2);
});