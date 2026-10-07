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
import coverPresetsRouter, { reflectionStoryBuiltinKey, scopeLimit } from "./cover-presets";
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
const temporaryPresetIds: string[] = [];

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
    if (temporaryPresetIds.length) {
      await db.delete(coverPresetsTable).where(inArray(coverPresetsTable.id, temporaryPresetIds));
    }
    await db.delete(uploadsTable).where(eq(uploadsTable.userId, admin.id));
    await db.delete(usersTable).where(inArray(usersTable.id, [admin.id, regular.id]));
  });

  it("keeps public reads open while protecting admin reads", async () => {
    expect((await request(app).get("/api/cover-presets?scope=playlist")).status).toBe(200);
    const invalidScope = await request(app).get("/api/cover-presets?scope=invalid");
    expect(invalidScope.status).toBe(400);
    expect(invalidScope.body.error).toContain("reflection-story");
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

  it("rejects a stale expected avatar order without changing cards or locks", async () => {
    authAs(admin);
    const before = await request(app).get("/api/admin/cover-presets?scope=profile");
    expect(before.status).toBe(200);
    const ids = before.body.presets.map((preset: { id: string }) => preset.id);
    const staleIds = ids.length > 1 ? [...ids].reverse() : ["not-current"];
    const rejected = await request(app).put("/api/admin/cover-presets/order").send({
      scope: "profile", ids, expectedIds: staleIds,
    });
    expect(rejected.status).toBe(409);
    const after = await request(app).get("/api/admin/cover-presets?scope=profile");
    expect(after.body).toEqual(before.body);
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

  it("limits profile to 200 without expanding other catalogs", () => {
    expect(scopeLimit("profile")).toBe(200);
    expect(scopeLimit("playlist")).toBe(50);
    expect(scopeLimit("mix")).toBe(50);
    expect(scopeLimit("reflection-story")).toBe(100);
  });

  it("allows admins to add an avatar beyond the old 50-slot boundary", async () => {
    authAs(admin);
    const existing = await db.select().from(coverPresetsTable).where(eq(coverPresetsTable.scope, "profile"));
    const fillers = Array.from({ length: Math.max(0, 50 - existing.length) }, (_, index) => ({
      id: `profile:above50-fill-${suffix}-${index}`,
      scope: "profile" as const,
      key: `above50-fill-${suffix}-${index}`,
      label: "Boundary fixture",
      builtinKey: "cosmic-nebula",
      sortOrder: Math.max(-1, ...existing.map((row) => row.sortOrder)) + index + 1,
    }));
    const key = `above50-${suffix}`;
    const path = `/objects/above50-${suffix}`;
    const [upload] = await db.insert(uploadsTable).values({
      userId: admin.id, objectPath: path, name: "avatar.jpg", contentType: "image/jpeg", sizeBytes: 100,
    }).returning();
    try {
      if (fillers.length) await db.insert(coverPresetsTable).values(fillers);
      const created = await request(app).post("/api/admin/cover-presets").send({
        scope: "profile", key, label: "Beyond fifty", objectPath: path,
      });
      expect(created.status).toBe(201);
      expect(created.body.id).toBe(`profile:${key}`);
      expect(created.body.isLocked).toBe(false);
    } finally {
      await db.delete(coverPresetsTable).where(inArray(coverPresetsTable.id, [...fillers.map((row) => row.id), `profile:${key}`]));
      await db.delete(uploadsTable).where(eq(uploadsTable.id, upload.id));
    }
  });

  it("enforces the 200-image avatar limit and cleans failed claims", async () => {
    authAs(admin);
    const existingProfiles = await db.select().from(coverPresetsTable).where(eq(coverPresetsTable.scope, "profile"));
    const rows = Array.from({ length: Math.max(0, 200 - existingProfiles.length) }, (_, index) => ({
      id: `profile:limit-${suffix}-${index}`,
      scope: "profile" as const,
      key: `limit-${suffix}-${index}`,
      label: `Limit ${index}`,
      objectPath: `/objects/limit-${suffix}-${index}`,
      builtinKey: null,
      sortOrder: Math.max(-1, ...existingProfiles.map((row) => row.sortOrder)) + index + 1,
    }));
    temporaryPresetIds.push(...rows.map((row) => row.id));
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
    // The create limit and reorder payload limit must agree: all 200 slots
    // must remain manageable from Admin after the catalog grows past fifty.
    const order = [...existingProfiles, ...rows].sort((a, b) => a.sortOrder - b.sortOrder).map((row) => row.id);
    expect((await request(app).put("/api/admin/cover-presets/order").send({
      scope: "profile", ids: order,
    })).status).toBe(200);
    await request(app).delete("/api/admin/cover-presets/upload").send({ objectPath: upload.objectPath });
    expect(storageState.deleteObjectEntity).toHaveBeenCalledWith(upload.objectPath);
    await db.delete(coverPresetsTable).where(inArray(coverPresetsTable.id, rows.map((row) => row.id)));
    await db.delete(uploadsTable).where(eq(uploadsTable.id, upload.id));
  });

  it("enforces the 100-image limit for reflection story backgrounds", async () => {
    authAs(admin);
    const existingReflectionRows = await db.select().from(coverPresetsTable)
      .where(eq(coverPresetsTable.scope, "reflection-story"));
    const rows = Array.from({ length: Math.max(0, 100 - existingReflectionRows.length) }, (_, index) => ({
      id: `reflection-story:limit-${suffix}-${index}`,
      scope: "reflection-story" as const,
      key: `limit-${suffix}-${index}`,
      label: `Reflection background ${index}`,
      builtinKey: `reflection-story-${index + 1}`,
      objectPath: null,
      sortOrder: Math.max(-1, ...existingReflectionRows.map((row) => row.sortOrder)) + index + 1,
    }));
    if (rows.length > 0) await db.insert(coverPresetsTable).values(rows);
    const publicList = await request(app).get("/api/cover-presets?scope=reflection-story");
    expect(publicList.status).toBe(200);
    expect(publicList.body.presets).toHaveLength(100);
    expect(publicList.body.presets[0].sortOrder).toBe(0);
    const [upload] = await db.insert(uploadsTable).values({
      userId: admin.id,
      objectPath: `/objects/reflection-story-limit-${suffix}`,
      name: "reflection-story.jpg",
      contentType: "image/jpeg",
      sizeBytes: 100,
    }).returning();
    const response = await request(app).post("/api/admin/cover-presets").send({
      scope: "reflection-story",
      label: "Over limit",
      objectPath: upload.objectPath,
    });
    expect(response.status).toBe(409);
    expect(response.body.error).toContain("100");
    expect(storageState.deleteObjectEntity).toHaveBeenCalledWith(upload.objectPath);
    expect(await db.select().from(uploadsTable).where(eq(uploadsTable.id, upload.id))).toHaveLength(0);
    if (rows.length > 0) {
      await db.delete(coverPresetsTable).where(inArray(coverPresetsTable.id, rows.map((row) => row.id)));
    }
  });

  it("maps only the 100 permanent reflection story slots to bundled backgrounds", () => {
    expect(reflectionStoryBuiltinKey("01")).toBe("cosmic-nebula");
    expect(reflectionStoryBuiltinKey("25")).toBe("northern-lights");
    expect(reflectionStoryBuiltinKey("26")).toBe("cosmic-nebula");
    expect(reflectionStoryBuiltinKey("40")).toBe("ice-lagoon");
    expect(reflectionStoryBuiltinKey("41")).toBe("birds-dawn");
    expect(reflectionStoryBuiltinKey("100")).toBe("northern-lights");
    expect(reflectionStoryBuiltinKey("00")).toBeUndefined();
    expect(reflectionStoryBuiltinKey("101")).toBeUndefined();
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

  it("locks profile avatars, protects admin writes, and rejects new assignments until unlocked", async () => {
    const existing = await db.select().from(coverPresetsTable).where(eq(coverPresetsTable.scope, "profile"));
    const [preset] = await db.insert(coverPresetsTable).values({
      id: `profile:lock-${suffix}`,
      scope: "profile", key: `lock-${suffix}`, label: "Lock fixture",
      builtinKey: "cosmic-nebula",
      sortOrder: Math.max(-1, ...existing.map((row) => row.sortOrder)) + 1,
    }).returning();
    const endpoint = `/api/admin/cover-presets/${preset.id}`;
    try {
      expect(preset.isLocked).toBe(false);
      authAs(null);
      expect((await request(app).patch(endpoint).send({ isLocked: true })).status).toBe(401);
      authAs(regular);
      expect((await request(app).patch(endpoint).send({ isLocked: true })).status).toBe(403);
      authAs(admin);
      const locked = await request(app).patch(endpoint).send({ isLocked: true });
      expect(locked.status).toBe(200);
      expect(locked.body.isLocked).toBe(true);
      expect(locked.body.builtinKey).toBe(preset.builtinKey);
      const list = await request(app).get("/api/cover-presets?scope=profile");
      expect(list.body.presets.find((row: { id: string }) => row.id === preset.id).isLocked).toBe(true);
      authAs(regular);
      const rejected = await request(app).patch("/api/me").send({ avatarPresetId: preset.id });
      expect(rejected.status).toBe(403);
      expect(rejected.body.code).toBe("AVATAR_LOCKED");
      expect((await request(app).get("/api/me")).body.avatarPresetId).not.toBe(preset.id);
      authAs(admin);
      expect((await request(app).patch(endpoint).send({ isLocked: false })).body.isLocked).toBe(false);
      authAs(regular);
      expect((await request(app).patch("/api/me").send({ avatarPresetId: preset.id })).status).toBe(200);
      authAs(admin);
      expect((await request(app).patch(endpoint).send({ isLocked: true })).status).toBe(200);
      authAs(regular);
      // Locking never revokes an existing avatar or blocks other profile edits.
      expect((await request(app).get("/api/me")).body.avatarPresetId).toBe(preset.id);
      expect((await request(app).patch("/api/me").send({ avatarPresetId: preset.id, displayName: "Still my avatar" })).status).toBe(200);
      expect((await request(app).patch("/api/me").send({ avatarPresetId: null })).status).toBe(200);
      expect((await request(app).patch("/api/me").send({ avatarPresetId: preset.id })).status).toBe(403);
    } finally {
      await db.update(usersTable).set({ avatarPresetId: null }).where(eq(usersTable.id, regular.id));
      await db.delete(coverPresetsTable).where(eq(coverPresetsTable.id, preset.id));
    }
  });

  it("rejects locking non-profile catalogs without changing their images", async () => {
    authAs(admin);
    for (const scope of ["mix", "playlist", "reflection-story"]) {
      const list = await request(app).get(`/api/admin/cover-presets?scope=${scope}`);
      const preset = list.body.presets[0];
      expect((await request(app).patch(`/api/admin/cover-presets/${preset.id}`).send({ isLocked: true })).status).toBe(400);
      const refreshed = await request(app).get(`/api/cover-presets?scope=${scope}`);
      expect(refreshed.body.presets[0]).toEqual(preset);
    }
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