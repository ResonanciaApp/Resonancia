import { afterAll, beforeAll, describe, it, expect, vi } from "vitest";
import express, { type Request, type Response, type NextFunction } from "express";
import request from "supertest";
import { randomUUID } from "node:crypto";
import { eq, inArray } from "drizzle-orm";
import {
  db, usersTable, coverPresetsTable, playbackHistoryTable, growthWalletsTable,
  growthGrantsTable, growthAvatarUnlocksTable,
} from "@workspace/db";
import { initializeGrowthSchema } from "../lib/growthSchema";
import { readGrowthCatalog, getGrowthProgress, unlockGrowthAvatar, ownsGrowthAvatar } from "../lib/growthService";

// Test-only auth fixture: the shipped middleware remains unchanged.
const auth = vi.hoisted(() => ({ actor: null as { id: number; role: string; clerkUserId: string } | null }));
vi.mock("../middlewares/requireAuth", () => ({
  requireAuth: (req: Request, res: Response, next: NextFunction) => {
    if (!auth.actor) { res.status(401).json({ error: "No autenticado" }); return; }
    req.currentUser = auth.actor as NonNullable<typeof req.currentUser>;
    next();
  },
}));
import router from "./growth";
import usersRouter from "./users";
const app = express().use(express.json()).use(router).use(usersRouter);
const tag = `growth_test_${randomUUID()}`;
const userIds: number[] = [];
const avatarIds: string[] = [];
let user: number;
let visitor: number;
let quota: number;

beforeAll(async () => {
  if (process.env.NODE_ENV === "production") throw new Error("Growth fixtures must never run in production");
  await initializeGrowthSchema();
  for (let i = 0; i < 3; i++) {
    const [row] = await db.insert(usersTable).values({
      clerkUserId: `${tag}_${i}`, username: `${tag}_${i}`, displayName: "Growth test fixture",
    }).returning();
    userIds.push(row.id);
  }
  [user, visitor] = userIds;
  const catalog = await readGrowthCatalog();
  const firstReward = catalog.stages.find(s => s.rewards.some(r => r.enabled));
  if (!firstReward) throw new Error("Test needs the seeded reward catalog");
  // In this freshly seeded catalog Semilla grants 5; derive threshold from data.
  quota = firstReward.rewards.filter(r => r.enabled).reduce((s, r) => s + r.amount, 0);
  for (let i = 0; i < firstReward.startDay; i++) {
    await db.insert(playbackHistoryTable).values({
      userId: user, clientEventId: `${tag}_day${i}`,
      sessionId: "test-only", categoryId: "test", categoryLabel: "Test",
      playedAt: new Date(Date.UTC(2026, 7, i + 1, 16)), minutes: 3,
    });
  }
  for (let i = 0; i < quota + 2; i++) {
    const id = randomUUID();
    avatarIds.push(id);
    await db.insert(coverPresetsTable).values({
      id, scope: "profile", key: `${tag}_${i}`, label: "Test avatar", builtinKey: "test-only", isLocked: true, sortOrder: 1000000 + i,
    });
  }
}, 60_000);
afterAll(async () => {
  auth.actor = null;
  if (avatarIds.length) await db.delete(coverPresetsTable).where(inArray(coverPresetsTable.id, avatarIds));
  if (userIds.length) await db.delete(usersTable).where(inArray(usersTable.id, userIds));
  expect((await db.select().from(growthAvatarUnlocksTable).where(inArray(growthAvatarUnlocksTable.userId, userIds))).length).toBe(0);
});

describe("Tu camino API y canjes transaccionales", () => {
  it("protege saldo, guardado Admin y canjes", async () => {
    auth.actor = null;
    expect((await request(app).get("/me/growth")).status).toBe(401);
    expect((await request(app).post("/me/growth/avatars/unlock").send({ avatarId: avatarIds[0] })).status).toBe(401);
    auth.actor = { id: user, role: "user", clerkUserId: `${tag}_0` };
    expect((await request(app).put("/admin/growth/catalog").send({})).status).toBe(403);
  });
  it("concede cupos una sola vez incluso con reconciliaciones simultáneas", async () => {
    const results = await Promise.all(Array.from({ length: 6 }, () => getGrowthProgress(user)));
    expect(results.every(p => p.balance === quota)).toBe(true);
    expect(results[0].currentStage?.id).toBe("semilla");
    const grants = await db.select().from(growthGrantsTable).where(eq(growthGrantsTable.userId, user));
    expect(grants.reduce((n, g) => n + g.amount, 0)).toBe(quota);
  });
  it("gasta del pool elegido sin modificar el bloqueo global ni permitir saldo negativo", async () => {
    const results = await Promise.allSettled(avatarIds.map(id => unlockGrowthAvatar(user, id)));
    expect(results.filter(r => r.status === "fulfilled")).toHaveLength(quota);
    const progress = await getGrowthProgress(user);
    expect(progress.balance).toBe(0);
    expect(progress.unlockedAvatarIds).toHaveLength(quota);
    expect(await ownsGrowthAvatar(user, progress.unlockedAvatarIds[0])).toBe(true);
    expect(await ownsGrowthAvatar(visitor, progress.unlockedAvatarIds[0])).toBe(false);
    expect((await db.select().from(coverPresetsTable).where(eq(coverPresetsTable.id, progress.unlockedAvatarIds[0])))[0].isLocked).toBe(true);
  });
  it("reintentar un mismo avatar no consume otro cupo", async () => {
    const before = await getGrowthProgress(user);
    const results = await Promise.all(Array.from({ length: 4 }, () => unlockGrowthAvatar(user, before.unlockedAvatarIds[0])));
    expect(results.every(p => p.balance === before.balance && p.unlockedAvatarIds.length === quota)).toBe(true);
  });
  it("permite guardar un avatar ganado y sigue denegándolo a otra cuenta", async () => {
    const progress = await getGrowthProgress(user);
    const id = progress.unlockedAvatarIds[0];
    auth.actor = { id: user, role: "user", clerkUserId: `${tag}_0` };
    expect((await request(app).patch("/me").send({ avatarPresetId: id })).status).toBe(200);
    auth.actor = { id: visitor, role: "user", clerkUserId: `${tag}_1` };
    expect((await request(app).patch("/me").send({ avatarPresetId: id })).status).toBe(403);
  });
  it("el catálogo es público, pero los guardados rechazan revisiones y rangos inválidos", async () => {
    expect((await request(app).get("/growth/catalog")).status).toBe(200);
    auth.actor = { id: user, role: "admin", clerkUserId: `${tag}_0` };
    const catalog = await readGrowthCatalog();
    expect((await request(app).put("/admin/growth/catalog").send({
      revision: catalog.revision + 1, stages: catalog.stages,
    })).status).toBe(409);
    expect((await request(app).put("/admin/growth/catalog").send({
      revision: catalog.revision, stages: [catalog.stages[0], catalog.stages[0]],
    })).status).toBe(400);
    expect((await readGrowthCatalog()).revision).toBe(catalog.revision);
  });
  it("un visitante no ve el saldo privado y no recibe los derechos del dueño", async () => {
    auth.actor = { id: visitor, role: "user", clerkUserId: `${tag}_1` };
    const response = await request(app).get(`/users/${user}/growth`);
    expect(response.status).toBe(200);
    expect(response.body.currentStage.id).toBe("semilla");
    expect(response.body.balance).toBeUndefined();
    expect((await getGrowthProgress(visitor)).unlockedAvatarIds).toEqual([]);
    const spend = await request(app).post("/me/growth/avatars/unlock").send({ avatarId: avatarIds[0], expectedClerkUserId: `${tag}_1` });
    expect(spend.status).toBe(409);
  });
  it("conserva cantidades ya concedidas y avances, sin recalcular un grant existente", async () => {
    const owner = userIds[2];
    const catalog = await readGrowthCatalog();
    const stage = catalog.stages.find(s => s.id === "semilla")!;
    await db.insert(growthWalletsTable).values({ userId: owner, maxDays: 1, reached: [catalog.stages[0], stage] });
    await db.insert(growthGrantsTable).values({ userId: owner, rewardId: stage.rewards[0].id, stageId: stage.id, amount: 2 });
    const result = await getGrowthProgress(owner);
    expect(result.balance).toBe(2);
    expect(result.currentStage?.id).toBe("semilla");
    expect(result.totalActiveDays).toBe(1);
  });
  it("rechaza un canje si la cuenta cambió después de abrir el selector", async () => {
    auth.actor = { id: visitor, role: "user", clerkUserId: `${tag}_1` };
    const response = await request(app).post("/me/growth/avatars/unlock").send({
      avatarId: avatarIds[0], expectedClerkUserId: `${tag}_0`,
    });
    expect(response.status).toBe(409);
    expect((await getGrowthProgress(visitor)).balance).toBe(0);
  });
  it("acumula días chilenos no consecutivos, une minutos del mismo día y excluye futuros", async () => {
    const events = [
      { at: "2026-08-10T23:00:00Z", minutes: 1.5, completed: false },
      { at: "2026-08-11T01:00:00Z", minutes: 1.5, completed: false },
      { at: "2026-08-13T16:00:00Z", minutes: 0, completed: true },
      { at: "2026-08-20T16:00:00Z", minutes: 2, completed: false },
      { at: "2070-08-21T16:00:00Z", minutes: 30, completed: true },
    ];
    await db.insert(playbackHistoryTable).values(events.map((event, i) => ({
      userId: visitor, clientEventId: `${tag}_boundary_${i}`, sessionId: "test-only",
      categoryId: "test", categoryLabel: "Test", playedAt: new Date(event.at),
      minutes: event.minutes, completed: event.completed,
    })));
    const progress = await getGrowthProgress(visitor);
    expect(progress.totalActiveDays).toBe(2);
    expect(progress.balance).toBe(quota);
  });
});
