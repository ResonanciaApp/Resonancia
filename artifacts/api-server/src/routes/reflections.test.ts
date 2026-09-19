import { beforeEach, describe, expect, it, vi } from "vitest";
import express, { type NextFunction, type Request, type Response } from "express";
import request from "supertest";

const state = vi.hoisted(() => ({
  userId: 1,
  rows: [] as Array<{ id: number; userId: number; category: string; message: string; createdAt: Date; updatedAt: Date }>,
}));

vi.mock("../middlewares/requireAuth", () => ({
  requireAuth: (req: Request, res: Response, next: NextFunction) => {
    (req as unknown as { currentUser?: { id: number } }).currentUser = { id: state.userId };
    next();
  },
}));

vi.mock("@workspace/db", () => {
  const columns = {
    id: "id", userId: "userId", category: "category", message: "message",
    createdAt: "createdAt", updatedAt: "updatedAt",
  };
  const matches = (row: (typeof state.rows)[number], condition: unknown): boolean => {
    if (!condition || typeof condition !== "object") return true;
    const value = condition as { kind?: string; column?: string; value?: unknown; conditions?: unknown[] };
    if (value.kind === "eq") return row[value.column as keyof typeof row] === value.value;
    if (value.kind === "lt") {
      const left = row[value.column as keyof typeof row] as Date | number;
      return (left instanceof Date ? left.getTime() : left) < (value.value instanceof Date ? value.value.getTime() : value.value as number);
    }
    if (value.kind === "gte") {
      const left = row[value.column as keyof typeof row] as Date | number;
      return (left instanceof Date ? left.getTime() : left) >= (value.value instanceof Date ? value.value.getTime() : value.value as number);
    }
    if (value.kind === "and") return (value.conditions ?? []).every((item) => matches(row, item));
    if (value.kind === "or") return (value.conditions ?? []).some((item) => matches(row, item));
    return true;
  };
  const whereCondition = (condition: unknown) => (row: (typeof state.rows)[number]) =>
    matches(row, condition);
  const db = {
    select: () => {
      let condition: unknown;
      const query = {
        from: () => query,
        where: (value: unknown) => { condition = value; return query; },
        orderBy: () => query,
        limit: async (count: number) => state.rows.filter((row) => row.userId === state.userId && whereCondition(condition)(row))
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime() || b.id - a.id).slice(0, count),
      };
      return query;
    },
    insert: () => ({
      values: (value: Record<string, unknown>) => ({
        returning: async () => {
          const now = new Date();
          const row = { id: state.rows.length + 1, userId: value.userId as number, category: value.category as string, message: value.message as string, createdAt: now, updatedAt: now };
          state.rows.push(row);
          return [row];
        },
      }),
    }),
    update: () => {
      let values: Record<string, unknown> = {};
      let condition: unknown;
      const query = {
        set: (next: Record<string, unknown>) => { values = next; return query; },
        where: (next: unknown) => { condition = next; return query; },
        returning: async () => {
          const row = state.rows.find((item) => whereCondition(condition)(item));
          if (!row) return [];
          Object.assign(row, values);
          return [row];
        },
      };
      return query;
    },
    delete: () => {
      let condition: unknown;
      const query = {
        where: (next: unknown) => { condition = next; return query; },
        returning: async () => {
          const index = state.rows.findIndex((item) => whereCondition(condition)(item));
          if (index < 0) return [];
          const [row] = state.rows.splice(index, 1);
          return [{ id: row.id }];
        },
      };
      return query;
    },
  };
  return {
    db,
    reflectionsTable: columns,
  };
});

vi.mock("drizzle-orm", () => ({
  and: (...conditions: unknown[]) => ({ kind: "and", conditions }),
  or: (...conditions: unknown[]) => ({ kind: "or", conditions }),
  eq: (column: string, value: unknown) => ({ kind: "eq", column, value }),
  lt: (column: string, value: unknown) => ({ kind: "lt", column, value }),
  gte: (column: string, value: unknown) => ({ kind: "gte", column, value }),
  desc: () => null,
}));

import reflectionsRouter from "./reflections";

const app = express();
app.use(express.json());
app.use("/api", reflectionsRouter);

describe("private reflections API", () => {
  beforeEach(() => {
    state.userId = 1;
    state.rows = [];
  });

  it("requires valid category and trimmed non-empty messages", async () => {
    await request(app).post("/api/me/reflections").send({ category: "unknown", message: "x" }).expect(400);
    await request(app).post("/api/me/reflections").send({ category: "calm", message: "   " }).expect(400);
  });

  it("supports CRUD and never exposes another user's reflection", async () => {
    const created = await request(app).post("/api/me/reflections")
      .send({ category: "gratitude", message: "  Mi reflexión  " }).expect(201);
    expect(created.body.message).toBe("Mi reflexión");
    const id = created.body.id;
    state.userId = 2;
    await request(app).get("/api/me/reflections").expect(200).expect({ items: [], nextCursor: null });
    await request(app).patch(`/api/me/reflections/${id}`).send({ message: "hack" }).expect(404);
    await request(app).delete(`/api/me/reflections/${id}`).expect(404);
    state.userId = 1;
    await request(app).patch(`/api/me/reflections/${id}`).send({ message: "  Actualizada " }).expect(200);
    await request(app).delete(`/api/me/reflections/${id}`).expect(204);
  });

  it("returns stable createdAt/id pagination cursors", async () => {
    for (const message of ["uno", "dos", "tres"]) {
      await request(app).post("/api/me/reflections").send({ category: "calm", message }).expect(201);
    }
    const first = await request(app).get("/api/me/reflections?limit=2").expect(200);
    expect(first.body.items).toHaveLength(2);
    expect(first.body.nextCursor).toEqual(expect.any(String));
    const second = await request(app).get(`/api/me/reflections?limit=2&cursor=${encodeURIComponent(first.body.nextCursor)}`).expect(200);
    expect(second.body.items).toHaveLength(1);
    expect(second.body.items[0].id).toBeLessThan(first.body.items[1].id);
    await request(app).get("/api/me/reflections?limit=0").expect(400);
    await request(app).get("/api/me/reflections?cursor=bad").expect(400);
  });

  it("filters a complete monthly date range before paginating", async () => {
    state.rows = [
      { id: 1, userId: 1, category: "calm", message: "agosto", createdAt: new Date("2026-08-31T23:59:59.000Z"), updatedAt: new Date() },
      { id: 2, userId: 1, category: "clarity", message: "septiembre", createdAt: new Date("2026-09-15T12:00:00.000Z"), updatedAt: new Date() },
      { id: 3, userId: 1, category: "purpose", message: "octubre", createdAt: new Date("2026-10-01T00:00:00.000Z"), updatedAt: new Date() },
    ];
    const response = await request(app)
      .get("/api/me/reflections?from=2026-09-01T00%3A00%3A00.000Z&to=2026-10-01T00%3A00%3A00.000Z")
      .expect(200);
    expect(response.body.items.map((item: { message: string }) => item.message)).toEqual(["septiembre"]);
  });
});