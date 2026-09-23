import assert from "node:assert/strict";
import test from "node:test";

import { selectDailyRecommendations } from "../lib/daily-recommendations.ts";

const sessions = Array.from({ length: 9 }, (_, index) => ({
  id: `session-${index + 1}`,
  isPlaceholder: false,
}));

test("keeps the same daily recommendations for the same inputs", () => {
  const first = selectDailyRecommendations(sessions, "2026-09-23", 0);
  const second = selectDailyRecommendations(sessions, "2026-09-23", 0);
  assert.deepEqual(second, first);
});

test("returns three distinct recommendations", () => {
  const result = selectDailyRecommendations(sessions, "2026-09-23", 0);
  assert.equal(result.length, 3);
  assert.equal(new Set(result.map((session) => session.id)).size, 3);
});

test("avoids the previous three cards when the catalog is large enough", () => {
  const current = selectDailyRecommendations(sessions, "2026-09-23", 0);
  const next = selectDailyRecommendations(
    sessions,
    "2026-09-23",
    1,
    current.map((session) => session.id),
  );
  assert.equal(
    next.some((session) => current.some((item) => item.id === session.id)),
    false,
  );
});

test("falls back to the full catalog when exclusions leave too few cards", () => {
  const compact = sessions.slice(0, 4);
  const result = selectDailyRecommendations(
    compact,
    "2026-09-23",
    1,
    compact.slice(0, 3).map((session) => session.id),
  );
  assert.equal(result.length, 3);
});

test("never includes placeholder sessions", () => {
  const result = selectDailyRecommendations(
    [...sessions, { id: "placeholder", isPlaceholder: true }],
    "2026-09-23",
    0,
  );
  assert.equal(result.some((session) => session.id === "placeholder"), false);
});