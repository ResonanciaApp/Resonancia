import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import express, { type NextFunction, type Request, type Response } from "express";
import request from "supertest";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db, coverPresetsTable, profileAvatarCategoriesTable, profileAvatarMembershipsTable, usersTable, type User } from "@workspace/db";
const authState = vi.hoisted(() => ({ clerkUserId: null as string | null }));
vi.mock("@clerk/express", () => ({
  getAuth: () => ({ userId: authState.clerkUserId }),
  clerkMiddleware: () => (_req: Request, _res: Response, next: NextFunction) => next(),
}));
vi.mock("../lib/objectStorage", () => ({
  ObjectStorageService: class {},
}));
import categoriesRouter from "./profile-avatar-categories";
import coversRouter from "./cover-presets";
import { normalizeAvatarCategoryName } from "../lib/profileAvatarCategories";

const app = express();
app.use(express.json());
app.use((req, _res, next) => {
  req.log = { error: vi.fn(), info: vi.fn(), warn: vi.fn() } as unknown as Request["log"];
  next();
});
app.use("/api", categoriesRouter);
app.use("/api", coversRouter);
const suffix = randomUUID();
const presetIds = [`category-test-a-${suffix}`, `category-test-b-${suffix}`, `category-test-mix-${suffix}`];
const categoryIds: string[] = [];
let admin: User, regular: User;
let originalCatalog: unknown;
const userIds: number[] = [];
const originalRows = () => db.select().from(coverPresetsTable).where(and(eq(coverPresetsTable.scope, "profile"), sql`${coverPresetsTable.id} not like 'category-test-%'`)).orderBy(coverPresetsTable.sortOrder);
const assign = (ids: string[], groups: string[], mode = "add") => request(app).put("/api/admin/profile-avatar-memberships").send({ presetIds: ids, categoryIds: groups, mode });

beforeAll(async () => {
  if (process.env.NODE_ENV === "production") throw new Error("Development-only test fixtures");
  originalCatalog = await originalRows();
  for (const role of ["admin", "user"] as const) {
    const [user] = await db.insert(usersTable).values({
      clerkUserId: `avatar_category_${role}_${suffix}`,
      username: `avatar_category_${role}_${suffix}`,
      displayName: "Avatar category test fixture",
      email: `avatar_category_${role}_${suffix}@test.invalid`,
      role,
    }).returning();
    userIds.push(user.id);
    if (role === "admin") admin = user; else regular = user;
  }
  await db.transaction(async tx => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended('profile', 402))`);
    const [{ maximum }] = await tx.select({ maximum: sql<number>`coalesce(max(${coverPresetsTable.sortOrder}), -1)::int` }).from(coverPresetsTable).where(eq(coverPresetsTable.scope, "profile"));
    const [{ mixMaximum }] = await tx.select({ mixMaximum: sql<number>`coalesce(max(${coverPresetsTable.sortOrder}), -1)::int` }).from(coverPresetsTable).where(eq(coverPresetsTable.scope, "mix"));
    await tx.insert(coverPresetsTable).values(presetIds.map((id, index) => ({
      id, key: id, label: "Temporary avatar category fixture",
      scope: index === 2 ? "mix" as const : "profile" as const,
      builtinKey: "cosmic-nebula", sortOrder: index === 2 ? mixMaximum + 1 : maximum + 1 + index,
      isLocked: index === 1,
    })));
  });
  authState.clerkUserId = admin.clerkUserId;
});

afterAll(async () => {
  authState.clerkUserId = null;
  try {
    if (categoryIds.length) await db.delete(profileAvatarCategoriesTable).where(inArray(profileAvatarCategoriesTable.id, categoryIds));
  } finally {
    await db.delete(coverPresetsTable).where(inArray(coverPresetsTable.id, presetIds));
    if (userIds.length) await db.delete(usersTable).where(inArray(usersTable.id, userIds));
  }
  expect(await originalRows()).toEqual(originalCatalog);
  expect(await db.select().from(profileAvatarMembershipsTable).where(inArray(profileAvatarMembershipsTable.presetId, presetIds))).toEqual([]);
});

describe("profile avatar categories", () => {
  it("normalizes whitespace/case without stripping accents, rejecting reserved names", () => {
    expect(normalizeAvatarCategoryName("  Mandalas   del  Corazón  ")).toEqual({ name: "Mandalas del Corazón", normalizedName: "mandalas del corazón" });
    for (const value of ["", "   ", "TODOS", "Sin categoría", "x".repeat(81)]) expect(normalizeAvatarCategoryName(value)).toBeNull();
  });
  it("protects all category and membership writes", async () => {
    authState.clerkUserId = null;
    expect((await request(app).post("/api/admin/profile-avatar-categories").send({ name: "No access" })).status).toBe(401);
    authState.clerkUserId = regular.clerkUserId;
    for (const response of [
      await request(app).post("/api/admin/profile-avatar-categories").send({ name: "No access" }),
      await request(app).patch("/api/admin/profile-avatar-categories/missing").send({ name: "No access" }),
      await request(app).delete("/api/admin/profile-avatar-categories/missing"),
      await assign([presetIds[0]], ["missing"]),
    ]) expect(response.status).toBe(403);
    authState.clerkUserId = admin.clerkUserId;
  });
  it("creates, rejects duplicate/empty names and renames categories", async () => {
    for (const label of ["One", "Two"]) {
      const created = await request(app).post("/api/admin/profile-avatar-categories").send({ name: `Category ${label} ${suffix}` });
      expect(created.status).toBe(201);
      categoryIds.push(created.body.id);
    }
    expect((await request(app).post("/api/admin/profile-avatar-categories").send({ name: `  CATEGORY ONE ${suffix}  ` })).status).toBe(409);
    expect((await request(app).post("/api/admin/profile-avatar-categories").send({ name: "  " })).status).toBe(400);
    expect((await request(app).patch(`/api/admin/profile-avatar-categories/${categoryIds[1]}`).send({ name: `Category One ${suffix}` })).status).toBe(409);
    const renamed = await request(app).patch(`/api/admin/profile-avatar-categories/${categoryIds[1]}`).send({ name: `Renamed ${suffix}` });
    expect(renamed.status).toBe(200);
    expect(renamed.body.id).toBe(categoryIds[1]);
  });
  it("adds multiple memberships idempotently and publishes them without changing identity/locks/order", async () => {
    const before = await db.select().from(coverPresetsTable).where(inArray(coverPresetsTable.id, presetIds));
    expect((await assign(presetIds.slice(0, 2), categoryIds)).status).toBe(200);
    expect((await assign([presetIds[0], presetIds[0]], [categoryIds[0], categoryIds[0]])).status).toBe(200);
    authState.clerkUserId = null;
    const publicCatalog = await request(app).get("/api/cover-presets?scope=profile");
    expect(publicCatalog.status).toBe(200);
    expect(publicCatalog.body.categories.some((category: { id: string }) => category.id === categoryIds[1])).toBe(true);
    for (const id of presetIds.slice(0, 2)) expect(publicCatalog.body.presets.find((p: { id: string }) => p.id === id).categoryIds.sort()).toEqual([...categoryIds].sort());
    expect(await db.select().from(coverPresetsTable).where(inArray(coverPresetsTable.id, presetIds))).toEqual(before);
    authState.clerkUserId = admin.clerkUserId;
    const edited = await request(app).patch(`/api/admin/cover-presets/${presetIds[0]}`).send({ label: "Edited temporary fixture" });
    expect(edited.status).toBe(200);
    expect(edited.body.categoryIds.sort()).toEqual([...categoryIds].sort());
  });
  it("atomically rejects missing avatars/categories, non-profile avatars and invalid actions", async () => {
    const before = await db.select().from(profileAvatarMembershipsTable).where(inArray(profileAvatarMembershipsTable.presetId, presetIds));
    expect((await assign([presetIds[0], "missing"], categoryIds, "remove")).status).toBe(400);
    expect((await assign([presetIds[2]], categoryIds)).status).toBe(400);
    expect((await assign([presetIds[0]], [categoryIds[0], "missing"], "remove")).status).toBe(404);
    expect((await assign([], categoryIds)).status).toBe(400);
    expect((await assign([presetIds[0]], categoryIds, "replace")).status).toBe(400);
    expect(await db.select().from(profileAvatarMembershipsTable).where(inArray(profileAvatarMembershipsTable.presetId, presetIds))).toEqual(before);
  });
  it("removes only selected category memberships; category deletion preserves avatars and other memberships", async () => {
    const removed = await assign([presetIds[0]], [categoryIds[0]], "remove");
    expect(removed.status).toBe(200);
    expect(removed.body.presets.find((p: { id: string }) => p.id === presetIds[0]).categoryIds).toEqual([categoryIds[1]]);
    expect((await request(app).delete(`/api/admin/profile-avatar-categories/${categoryIds[0]}`)).status).toBe(204);
    expect((await request(app).delete(`/api/admin/profile-avatar-categories/${categoryIds[0]}`)).status).toBe(404);
    const catalog = await request(app).get("/api/admin/cover-presets?scope=profile");
    for (const id of presetIds.slice(0, 2)) expect(catalog.body.presets.find((p: { id: string }) => p.id === id).categoryIds).toEqual([categoryIds[1]]);
    expect((await request(app).get("/api/cover-presets?scope=mix")).body.categories).toBeUndefined();
  });
});
