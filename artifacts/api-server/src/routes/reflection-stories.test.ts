import { beforeEach, describe, expect, it, vi } from "vitest";
import express, { type NextFunction, type Request, type Response } from "express";
import request from "supertest";

const state = vi.hoisted(() => ({
  userId: 1,
  rows: [] as Array<Record<string, unknown>>,
  avatarAllowed: true,
  avatarContentType: "image/png",
  avatarSize: 2048,
}));

vi.mock("../lib/objectAccess", () => ({
  canUserReferenceObject: async () => state.avatarAllowed,
}));
vi.mock("../lib/objectStorage", () => ({
  ObjectStorageService: class {
    async getObjectEntityFile() {
      return { getMetadata: async () => [{ contentType: state.avatarContentType, size: state.avatarSize }] };
    }
  },
}));
vi.mock("../middlewares/requireAuth", () => ({
  requireAuth: (req: Request, _res: Response, next: NextFunction) => {
    (req as unknown as { currentUser?: { id: number } }).currentUser = { id: state.userId };
    next();
  },
}));
vi.mock("./reflection-categories", () => ({
  findReflectionCategory: async (id: string) =>
    ["gratitude", "understanding", "clarity", "calm", "purpose", "acceptance", "courage"].includes(id)
      ? { id, active: id !== "understanding" }
      : undefined,
}));

vi.mock("@workspace/db", () => {
  const columns = {
    id: "id", userId: "userId", idempotencyKey: "idempotencyKey", message: "message", category: "category",
    backgroundPresetKey: "backgroundPresetKey", backgroundScale: "backgroundScale", backgroundX: "backgroundX",
    backgroundY: "backgroundY", textX: "textX", textY: "textY", createdAt: "createdAt",
  };
  const matches = (row: Record<string, unknown>, condition: unknown): boolean => {
    if (!condition || typeof condition !== "object") return true;
    const value = condition as { kind?: string; column?: string; value?: unknown; conditions?: unknown[] };
    if (value.kind === "eq") return row[value.column!] === value.value;
    if (value.kind === "lt") {
      const left = row[value.column!] as Date | number;
      return (left instanceof Date ? left.getTime() : left) < ((value.value instanceof Date ? value.value.getTime() : value.value) as number);
    }
    if (value.kind === "and") return (value.conditions ?? []).every((item) => matches(row, item));
    if (value.kind === "or") return (value.conditions ?? []).some((item) => matches(row, item));
    return true;
  };
  const db = {
    select: () => {
      let condition: unknown;
      const query = {
        from: () => query,
        where: (next: unknown) => { condition = next; return query; },
        orderBy: () => query,
        limit: async (count: number) => state.rows
          .filter((row) => matches(row, condition))
          .sort((a, b) => (b.createdAt as Date).getTime() - (a.createdAt as Date).getTime() || (b.id as number) - (a.id as number))
          .slice(0, count),
      };
      return query;
    },
    insert: () => ({
      values: (value: Record<string, unknown>) => ({
        returning: async () => {
          if (state.rows.some((row) => row.userId === value.userId && row.idempotencyKey === value.idempotencyKey)) {
            const error = Object.assign(new Error("duplicate"), { code: "23505" });
            throw error;
          }
          const row = { ...value, id: state.rows.length + 1, createdAt: new Date(Date.now() + state.rows.length) };
          state.rows.push(row);
          return [row];
        },
      }),
    }),
    delete: () => ({
      where: (condition: unknown) => ({
        returning: async () => {
          const deleted = state.rows.filter((row) => matches(row, condition));
          state.rows = state.rows.filter((row) => !matches(row, condition));
          return deleted.map((row) => ({ id: row.id }));
        },
      }),
    }),
  };
  return { db, reflectionStoriesTable: columns };
});

vi.mock("drizzle-orm", () => ({
  and: (...conditions: unknown[]) => ({ kind: "and", conditions }),
  or: (...conditions: unknown[]) => ({ kind: "or", conditions }),
  eq: (column: string, value: unknown) => ({ kind: "eq", column, value }),
  lt: (column: string, value: unknown) => ({ kind: "lt", column, value }),
  desc: () => null,
}));

import reflectionStoriesRouter from "./reflection-stories";

const app = express();
app.use(express.json());
app.use("/api", reflectionStoriesRouter);

const body = {
  message: "Una historia guardada",
  category: "calm",
  backgroundPresetKey: "moon-valley",
  backgroundScale: 1,
  backgroundX: 0,
  backgroundY: 0,
  textX: 0,
  textY: 0,
};

describe("private reflection stories API", () => {
  beforeEach(() => {
    state.userId = 1;
    state.rows = [];
    state.avatarAllowed = true;
    state.avatarContentType = "image/png";
    state.avatarSize = 2048;
  });

  it("preserves an exact avatar image path across retries and gallery reads", async () => {
    const payload = { ...body, avatarImagePath: "/objects/uploads/frozen-avatar" };
    const created = await request(app).post("/api/me/reflection-stories")
      .set("Idempotency-Key", "avatar").send(payload).expect(201);
    expect(created.body.avatarImagePath).toBe(payload.avatarImagePath);
    const replay = await request(app).post("/api/me/reflection-stories")
      .set("Idempotency-Key", "avatar").send({ ...payload, avatarImagePath: "/objects/uploads/new-avatar" }).expect(200);
    expect(replay.body.avatarImagePath).toBe(payload.avatarImagePath);
    const read = await request(app).get(`/api/me/reflection-stories/${created.body.id}`).expect(200);
    expect(read.body.avatarImagePath).toBe(payload.avatarImagePath);
  });

  it("keeps legacy compositions avatar-free and accepts explicit removal", async () => {
    const created = await request(app).post("/api/me/reflection-stories")
      .set("Idempotency-Key", "legacy").send(body).expect(201);
    expect(created.body.avatarImagePath).toBeNull();
    const without = await request(app).post("/api/me/reflection-stories")
      .set("Idempotency-Key", "none").send({ ...body, avatarImagePath: null }).expect(201);
    expect(without.body.avatarImagePath).toBeNull();
  });

  it("rejects private foreign images, non-image objects and incomplete uploads", async () => {
    const payload = { ...body, avatarImagePath: "/objects/uploads/other-person" };
    state.avatarAllowed = false;
    await request(app).post("/api/me/reflection-stories").set("Idempotency-Key", "foreign").send(payload).expect(403);
    state.avatarAllowed = true;
    state.avatarContentType = "audio/mpeg";
    await request(app).post("/api/me/reflection-stories").set("Idempotency-Key", "audio").send(payload).expect(400);
    state.avatarContentType = "image/png";
    state.avatarSize = 0;
    await request(app).post("/api/me/reflection-stories").set("Idempotency-Key", "empty").send(payload).expect(400);
    expect(state.rows).toHaveLength(0);
  });

  it("never accepts local URIs or arbitrary external avatar references", async () => {
    for (const avatarImagePath of ["file:///avatar.png", "https://example.org/avatar.png", "/objects//invalid"]) {
      await request(app).post("/api/me/reflection-stories")
        .set("Idempotency-Key", "invalid-path").send({ ...body, avatarImagePath }).expect(400);
    }
  });

  it("round-trips freely positioned avatars and keeps old stories without coordinates", async () => {
    const created = await request(app).post("/api/me/reflection-stories").set("Idempotency-Key", "position")
      .send({ ...body, avatarImagePath: "/objects/uploads/avatar", avatarX: 0.25, avatarY: 0.75 }).expect(201);
    const read = await request(app).get(`/api/me/reflection-stories/${created.body.id}`).expect(200);
    expect(read.body.avatarX).toBe(0.25);
    expect(read.body.avatarY).toBe(0.75);
    const legacy = await request(app).post("/api/me/reflection-stories").set("Idempotency-Key", "old-position")
      .send({ ...body, avatarImagePath: "/objects/uploads/avatar" }).expect(201);
    expect(legacy.body.avatarX).toBeNull();
    expect(legacy.body.avatarY).toBeNull();
  });

  it("rejects missing coordinate pairs, coordinates without an avatar and circles outside the image", async () => {
    for (const coordinates of [{ avatarX: 0.5 }, { avatarX: 0, avatarY: 0.5 }, { avatarX: 0.5, avatarY: 1 }]) {
      await request(app).post("/api/me/reflection-stories").set("Idempotency-Key", "bad-position")
        .send({ ...body, avatarImagePath: "/objects/uploads/avatar", ...coordinates }).expect(400);
    }
    await request(app).post("/api/me/reflection-stories").set("Idempotency-Key", "no-avatar-position")
      .send({ ...body, avatarX: 0.25, avatarY: 0.75 }).expect(400);
  });
  it("persists snapshots, paginates newest first, and gets only the owner item", async () => {
    const created = await request(app).post("/api/me/reflection-stories").set("Idempotency-Key", "one").send(body).expect(201);
    const second = await request(app).post("/api/me/reflection-stories").set("Idempotency-Key", "two").send({ ...body, message: "Segunda" }).expect(201);
    const page = await request(app).get("/api/me/reflection-stories?limit=1").expect(200);
    expect(page.body.items[0].id).toBe(second.body.id);
    expect(page.body.nextCursor).toEqual(expect.any(String));
    await request(app).get(`/api/me/reflection-stories/${created.body.id}`).expect(200);
    state.userId = 2;
    await request(app).get(`/api/me/reflection-stories/${created.body.id}`).expect(404);
    await request(app).get("/api/me/reflection-stories").expect({ items: [], nextCursor: null });
  });

  it("returns the same snapshot for repeated idempotency keys", async () => {
    const first = await request(app).post("/api/me/reflection-stories").set("Idempotency-Key", "repeat").send(body).expect(201);
    const retry = await request(app).post("/api/me/reflection-stories").set("Idempotency-Key", "repeat").send({ ...body, message: "No duplicar" }).expect(200);
    expect(retry.body.id).toBe(first.body.id);
    expect(state.rows).toHaveLength(1);
  });

  it("deletes only the owner's reflection story", async () => {
    const created = await request(app)
      .post("/api/me/reflection-stories")
      .set("Idempotency-Key", "delete-owner")
      .send(body)
      .expect(201);

    state.userId = 2;
    await request(app)
      .delete(`/api/me/reflection-stories/${created.body.id}`)
      .expect(404);
    expect(state.rows).toHaveLength(1);

    state.userId = 1;
    await request(app)
      .delete(`/api/me/reflection-stories/${created.body.id}`)
      .expect(204);
    expect(state.rows).toHaveLength(0);
  });

  it("rejects missing keys, invalid categories, oversized messages, and unsafe offsets", async () => {
    await request(app).post("/api/me/reflection-stories").send(body).expect(400);
    await request(app).post("/api/me/reflection-stories").set("Idempotency-Key", "bad").send({ ...body, category: "other" }).expect(400);
    await request(app).post("/api/me/reflection-stories").set("Idempotency-Key", "long").send({ ...body, message: "a".repeat(161) }).expect(400);
    await request(app).post("/api/me/reflection-stories").set("Idempotency-Key", "offset").send({ ...body, backgroundScale: 1, backgroundX: 0.1 }).expect(400);
  });

  it("persists enlarged text, defaults legacy requests to 1 and rejects shrinking", async () => {
    const enlarged = await request(app).post("/api/me/reflection-stories")
      .set("Idempotency-Key", "enlarged").send({ ...body, textScale: 2.25 }).expect(201);
    expect(enlarged.body.textScale).toBe(2.25);
    const detail = await request(app).get(`/api/me/reflection-stories/${enlarged.body.id}`).expect(200);
    expect(detail.body.textScale).toBe(2.25);
    const legacy = await request(app).post("/api/me/reflection-stories")
      .set("Idempotency-Key", "legacy").send(body).expect(201);
    expect(legacy.body.textScale).toBe(1);
    for (const textScale of [0.5, 3.1]) {
      await request(app).post("/api/me/reflection-stories")
        .set("Idempotency-Key", `invalid-scale-${textScale}`).send({ ...body, textScale }).expect(400);
    }
  });

  it("counts graphemes instead of UTF-16 code units", async () => {
    const joinedFamily = "👨‍👩‍👧‍👦";
    const accepted = await request(app)
      .post("/api/me/reflection-stories")
      .set("Idempotency-Key", "graphemes-ok")
      .send({ ...body, message: joinedFamily.repeat(160) })
      .expect(201);
    expect(accepted.body.message).toBe(joinedFamily.repeat(160));

    await request(app)
      .post("/api/me/reflection-stories")
      .set("Idempotency-Key", "graphemes-too-long")
      .send({ ...body, message: joinedFamily.repeat(161) })
      .expect(400);
  });
});