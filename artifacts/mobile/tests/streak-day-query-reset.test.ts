import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { URL } from "node:url";
import test from "node:test";
import ts from "typescript";

test("daily rollover changes the server cache key so the previous week cannot stay active", () => {
  const source = readFileSync(new URL("../hooks/useStreak.ts", import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  let today = "2026-10-04";
  let queryKey: unknown[] = [];
  const cache = new Map<string, unknown>();
  const mocks: Record<string, unknown> = {
    react: { useMemo: (calculate: () => unknown) => calculate() },
    "@/context/AuthContext": { useAuth: () => ({ isSignedIn: true }) },
    "@/context/PlayerContext": { usePlayer: () => ({ statEvents: [] }) },
    "@/hooks/useDayRollover": { useDayRollover: () => today },
    "@workspace/api-client-react": {
      getGetMyStreakQueryOptions: (params: unknown) => ({ queryKey: ["/me/streak", params] }),
      useGetMyStreak: (_params: unknown, options: { query: { queryKey: unknown[] } }) => {
        queryKey = options.query.queryKey;
        return { data: cache.get(JSON.stringify(queryKey)) };
      },
    },
    "@/utils/stats": {
      computeCurrentStreak: () => 0, computeMaxStreak: () => 0, computeTotalActiveDays: () => 0,
      computeWeekFlags: () => ({ flags: Array(7).fill(false), weekCount: 0, todayIndex: 0 }),
      computeCompletedWeekStarts: () => [],
      mergeCompletedWeekStarts: () => [],
    },
  };
  const module = { exports: {} as { useStreak: () => { weekCount: number; weekFlags: boolean[] } } };
  new Function("require", "module", "exports", compiled)((name: string) => {
    assert.ok(name in mocks, `Missing mock: ${name}`);
    return mocks[name];
  }, module, module.exports);
  module.exports.useStreak();
  const sundayKey = [...queryKey];
  cache.set(JSON.stringify(sundayKey), {
    currentStreak: 7, maxStreak: 7, weekFlags: Array(7).fill(true), weekCount: 7,
    todayIndex: 6, totalActiveDays: 7, completedWeekStarts: [],
  });
  assert.equal(module.exports.useStreak().weekCount, 7);
  today = "2026-10-05";
  const monday = module.exports.useStreak();
  assert.equal(monday.weekCount, 0);
  assert.deepEqual(monday.weekFlags, Array(7).fill(false));
  assert.deepEqual(queryKey.slice(0, -1), sundayKey.slice(0, -1), "generated query key remains an invalidation prefix");
  assert.equal(queryKey.at(-1), today);
  assert.notDeepEqual(queryKey, sundayKey);
});