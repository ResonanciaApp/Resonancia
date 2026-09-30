import { beforeEach, describe, expect, it, vi } from "vitest";
import express, { type NextFunction, type Request, type Response } from "express";
import request from "supertest";

const state = vi.hoisted(() => ({
  userId: 1,
  recentRows: [] as Array<{ minutes: number; completed: boolean; playedAt: Date }>,
  groupedRows: [] as Array<{ localDay: string; minutes: number; completed: boolean }>,
  limitCalls: [] as number[],
  groupByCalls: 0,
  whereConditions: [] as unknown[],
}));

vi.mock("../middlewares/requireAuth", () => ({
  requireAuth: (req: Request, _res: Response, next: NextFunction) => {
    (req as unknown as { currentUser?: { id: number } }).currentUser = { id: state.userId };
    next();
  },
}));

vi.mock("@workspace/db", () => {
  const playbackHistoryTable = {
    userId: "userId",
    minutes: "minutes",
    completed: "completed",
    playedAt: "playedAt",
  };
  return {
    playbackHistoryTable,
    favoritesTable: {},
    sessionProgressTable: {},
    userMilestonesTable: {},
    db: {
      select: () => {
        const query: Record<string, (...args: unknown[]) => unknown> = {
          from: () => query,
          where: (condition) => {
            state.whereConditions.push(condition);
            return query;
          },
          orderBy: () => query,
          limit: async (count) => {
            state.limitCalls.push(count as number);
            return state.recentRows;
          },
          groupBy: async () => {
            state.groupByCalls++;
            return state.groupedRows;
          },
        };
        return query;
      },
    },
  };
});

vi.mock("drizzle-orm", () => ({
  and: (...conditions: unknown[]) => ({ kind: "and", conditions }),
  desc: (column: unknown) => ({ kind: "desc", column }),
  eq: (column: unknown, value: unknown) => ({ kind: "eq", column, value }),
  gte: (column: unknown, value: unknown) => ({ kind: "gte", column, value }),
  lte: (column: unknown, value: unknown) => ({ kind: "lte", column, value }),
  sql: (strings: TemplateStringsArray, ...values: unknown[]) => ({ strings, values }),
}));

import activityRouter from "./activity";

const app = express();
app.use("/api", activityRouter);

const date = (year: number, month: number, day: number): string => {
  const value = new Date(Date.UTC(year, month - 1, day));
  return `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(2, "0")}-${String(value.getUTCDate()).padStart(2, "0")}`;
};

describe("GET /me/streak completed weeks query", () => {
  beforeEach(() => {
    state.userId = 1;
    state.recentRows = [];
    state.groupedRows = [];
    state.limitCalls = [];
    state.groupByCalls = 0;
    state.whereConditions = [];
  });

  it("returns fully historical grouped weeks beyond the limited recent plays and excludes future timestamps", async () => {
    state.groupedRows = Array.from({ length: 7 }, (_, index) => ({
      localDay: date(2018, 6, 4 + index),
      minutes: 3,
      completed: false,
    }));

    const response = await request(app).get("/api/me/streak?tz=UTC").expect(200);

    expect(response.body.completedWeekStarts).toEqual(["2018-06-04"]);
    expect(response.body).toMatchObject({
      currentStreak: 0,
      maxStreak: 0,
      weekFlags: expect.any(Array),
      weekCount: 0,
      todayIndex: expect.any(Number),
      totalActiveDays: 0,
    });
    expect(state.limitCalls).toEqual([600]);
    expect(state.groupByCalls).toBe(1);

    const conditions = state.whereConditions as Array<{
      kind?: string;
      conditions?: Array<{ kind?: string; value?: unknown }>;
    }>;
    const futureFilters = conditions.flatMap((condition) => condition.conditions ?? [])
      .filter((condition) => condition.kind === "lte");
    expect(futureFilters).toHaveLength(2);
    expect(futureFilters.every((condition) => condition.value instanceof Date)).toBe(true);
  });
});