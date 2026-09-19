import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import express, { type Express, type NextFunction, type Request, type Response } from "express";
import request from "supertest";

const authState = vi.hoisted(() => ({ clerkUserId: null as string | null }));
const storageState = vi.hoisted(() => ({
  deleteObjectEntity: vi.fn(async (_path: string) => {}),
  getObjectEntityFile: vi.fn(async (_path: string) => ({
    getMetadata: async () => [{ contentType: "image/jpeg", size: "100" }],
  })),
}));

vi.mock("@clerk/express", () => ({
  getAuth: () => ({ userId: authState.clerkUserId }),
  clerkMiddleware: () => (_req: Request, _res: Response, next: NextFunction) => next(),
}));
vi.mock("../lib/objectStorage", () => ({
  ObjectStorageService: class {
    deleteObjectEntity = storageState.deleteObjectEntity;
    getObjectEntityFile = storageState.getObjectEntityFile;
  },
}));
vi.mock("../lib/communityActivity", () => ({ recordCommunityEvent: vi.fn(async () => {}) }));

import { coverPresetsTable, db, uploadsTable, usersTable, type User } from "@workspace/db";
import { eq, inArray } from "drizzle-orm";
import coverPresetsRouter from "./cover-presets";
import usersRouter from "./users";

function buildApp(): Express {
  const app = express();
  app.use(express.json());
  app.use((req: Request, _res: Response, next: NextFunction) => {
    (req as { log: unknown }).log = { error: () => {}, info: () => {}, warn: () => {} };
    next();
  });
  app.use("/api", coverPresetsRouter);
  app.use("/api", usersRouter);
  return app;
}

const app = buildApp();
const suffix = `${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
let admin: User;
let regular: User;

function authAs(user: User | null) {
  authState.clerkUserId = user?.clerkUserId ?? null;
}

describe("cover preset catalog security and profile identity", () => {
  beforeAll(async () => {
    [admin] = await db.insert(usersTable).values({
      clerkUserId: `cover_admin_${suffix}`,
      username: `cover_admin_${suffix}`,
      displayName: "Cover admin",
      email: `cover_admin_${suffix}@test.invalid`,
      role: "admin",
    }).returning();
    [regular] = await db.insert(usersTable).values({
      clerkUserId: `cover_user_${suffix}`,
      username: `cover_user_${suffix}`,
      displayName: "Cover user",
      email: `cover_user_${suffix}@test.invalid`,
      role: "user",
    }).returning();
  });

  afterEach(() => authAs(null));

  afterAll(async () => {
    await db.delete(uploadsTable).where(eq(uploadsTable.userId, admin.id));
    await db.delete(usersTable).where(inArray(usersTable.id, [admin.id, regular.id]));
  });

  it("keeps public reads open while protecting admin reads", async () => {
    expect((await request(app).get("/api/cover-presets?scope=playlist")).status).toBe(200);
    expect((await request(app).get("/api/cover-presets?scope=invalid")).status).toBe(400);
    expect((await request(app).get("/api/admin/cover-presets?scope=playlist")).status).toBe(401);
    authAs(regular);
    expect((await request(app).get("/api/admin/cover-presets?scope=playlist")).status).toBe(403);
  });

  it("rejects duplicate and incomplete reorder payloads without mutation", async () => {
    authAs(admin);
    const list = await request(app).get("/api/admin/cover-presets?scope=playlist");
    const ids = list.body.presets.map((preset: { id: string }) => preset.id);
    expect((await request(app).put("/api/admin/cover-presets/order").send({ scope: "playlist", ids: [ids[0], ids[0], ...ids.slice(2)] })).status).toBe(400);
    expect((await request(app).put("/api/admin/cover-presets/order").send({ scope: "playlist", ids: ids.slice(1) })).status).toBe(400);
  });

  it("rejects arbitrary, non-owned, and non-image upload paths", async () => {
    authAs(admin);
    expect((await request(app).post("/api/admin/cover-presets").send({ scope: "mix", label: "Bad", objectPath: "/objects/not-uploaded" })).status).toBe(403);
    const [audio] = await db.insert(uploadsTable).values({
      userId: admin.id,
      objectPath: `/objects/audio-${suffix}`,
      name: "sound.mp3",
      contentType: "audio/mpeg",
      sizeBytes: 100,
    }).returning();
    expect((await request(app).post("/api/admin/cover-presets").send({ scope: "mix", label: "Audio", objectPath: audio.objectPath })).status).toBe(400);
    await db.delete(uploadsTable).where(eq(uploadsTable.id, audio.id));
  });

  it("enforces the 50-image collection limit and cleans failed claims", async () => {
    authAs(admin);
    const rows = Array.from({ length: 25 }, (_, index) => ({
      id: `profile:limit-${suffix}-${index}`,
      scope: "profile" as const,
      key: `limit-${suffix}-${index}`,
      label: `Limit ${index}`,
      objectPath: `/objects/limit-${suffix}-${index}`,
      builtinKey: null,
      sortOrder: 25 + index,
    }));
    await db.delete(coverPresetsTable).where(inArray(coverPresetsTable.id, rows.map((row) => row.id)));
    await db.insert(coverPresetsTable).values(rows.map((row) => ({ ...row, sortOrder: row.sortOrder })));
    const [upload] = await db.insert(uploadsTable).values({
      userId: admin.id,
      objectPath: `/objects/limit-upload-${suffix}`,
      name: "cover.jpg",
      contentType: "image/jpeg",
      sizeBytes: 100,
    }).returning();
    expect((await request(app).post("/api/admin/cover-presets").send({
      scope: "profile",
      label: "Over limit",
      objectPath: upload.objectPath,
    })).status).toBe(409);
    await request(app).delete("/api/admin/cover-presets/upload").send({ objectPath: upload.objectPath });
    expect(storageState.deleteObjectEntity).toHaveBeenCalledWith(upload.objectPath);
    await db.delete(coverPresetsTable).where(inArray(coverPresetsTable.id, rows.map((row) => row.id)));
    await db.delete(uploadsTable).where(eq(uploadsTable.id, upload.id));
  });

  it("does not delete an uploaded object while another entity references it", async () => {
    authAs(admin);
    const objectPath = `/objects/referenced-${suffix}`;
    const [upload] = await db.insert(uploadsTable).values({
      userId: admin.id,
      objectPath,
      name: "cover.jpg",
      contentType: "image/jpeg",
      sizeBytes: 100,
    }).returning();
    const [preset] = await db.insert(coverPresetsTable).values({
      id: `mix:test-${suffix}`,
      scope: "mix",
      key: `test-${suffix}`,
      label: "Referenced",
      objectPath,
      builtinKey: null,
      sortOrder: 50,
    }).returning();
    await db.update(usersTable).set({ avatarUrl: objectPath }).where(eq(usersTable.id, regular.id));
    expect((await request(app).delete(`/api/admin/cover-presets/${preset.id}`)).status).toBe(204);
    expect(storageState.deleteObjectEntity).not.toHaveBeenCalledWith(objectPath);
    await db.update(usersTable).set({ avatarUrl: null }).where(eq(usersTable.id, regular.id));
    await db.delete(uploadsTable).where(eq(uploadsTable.id, upload.id));
  });

  it("persists and serializes a stable profile preset identity", async () => {
    authAs(regular);
    const response = await request(app).patch("/api/me").send({ avatarPresetId: "profile:cosmic-nebula" });
    expect(response.status).toBe(200);
    expect(response.body.avatarPresetId).toBe("profile:cosmic-nebula");
    expect(response.body.avatarUrl).toBeNull();
    const me = await request(app).get("/api/me");
    expect(me.body.avatarPresetId).toBe("profile:cosmic-nebula");
    await request(app).patch("/api/me").send({ avatarPresetId: null });
  });
});