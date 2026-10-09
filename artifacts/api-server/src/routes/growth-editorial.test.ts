import { beforeEach, describe, expect, it, vi } from "vitest";
import express from "express";
import request from "supertest";
import { growthSeed } from "../lib/growthSeed";
import { adoptGrowthEditorial } from "../lib/growthEditorial";

const fixture = vi.hoisted(() => ({
  catalog: null as any,
  role: "admin" as string | null,
  writes: [] as string[],
}));
// Entire database is replaced: these tests never modify the shared editorial catalog.
vi.mock("@workspace/db", () => {
  const table = { id: "main", tag: "growth_catalog" };
  const db = {
    select: () => ({
      from: () => ({
        where: () => {
          const rows = [structuredClone(fixture.catalog)];
          return Object.assign(Promise.resolve(rows), { for: async () => rows });
        },
      }),
    }),
    transaction: async (fn: any) => fn(db),
    update: (target: any) => ({
      set: (values: any) => ({
        where: async () => {
          fixture.writes.push(target.tag);
          fixture.catalog = { ...fixture.catalog, ...structuredClone(values) };
        },
      }),
    }),
  };
  return {
    db, growthCatalogTable: table,
    usersTable: {}, growthWalletsTable: {}, growthGrantsTable: {}, growthAvatarUnlocksTable: {},
    coverPresetsTable: {}, playbackHistoryTable: {},
  };
});
vi.mock("../middlewares/requireAuth", () => ({
  requireAuth: (req: any, res: any, next: any) => {
    if (!fixture.role) return res.status(401).json({ error: "No autenticado" });
    req.currentUser = { id: 123, role: fixture.role };
    next();
  },
}));
vi.mock("../lib/objectAccess", () => ({
  lockObjectPaths: vi.fn(async () => {}),
  validateOwnedCompletedImageUpload: vi.fn(async () => ({ ok: true })),
}));
import router from "./growth";
const app = express().use("/admin/growth/catalog", express.json({ limit: "12mb" })).use(express.json()).use(router);

beforeEach(() => {
  fixture.catalog = { id: "main", revision: 1, stages: structuredClone(growthSeed), updatedAt: new Date() };
  fixture.role = "admin";
  fixture.writes = [];
});

describe("Admin growth editorial save and reload", () => {
  it("adopts legacy catalogs on read without writing any table", async () => {
    const response = await request(app).get("/growth/catalog");
    expect(response.status).toBe(200);
    expect(response.body.stages[0].detailPhrase).toBe(growthSeed[0].story);
    expect(response.body.stages[0].detailDescription).toContain("Antes del primer día");
    expect(fixture.writes).toEqual([]);
  });
  it("round-trips texts separately from story, while preserving names, ranges and rewards", async () => {
    const stages = growthSeed.map(stage => ({
      ...stage, detailPhrase: `Frase ${stage.name}`, detailDescription: "Descripción larga\nSegundo párrafo",
    }));
    const saved = await request(app).put("/admin/growth/catalog").send({ revision: 1, stages });
    expect(saved.status).toBe(200);
    expect(saved.body.revision).toBe(2);
    const reloaded = await request(app).get("/growth/catalog");
    expect(reloaded.body.stages).toEqual(stages);
    expect(fixture.writes).toEqual(["growth_catalog"]);
    expect(reloaded.body.stages.map(({ detailPhrase, detailDescription, ...stage }: any) => stage)).toEqual(growthSeed);
  });
  it("keeps deliberate empty strings after save, reload and an old-client update", async () => {
    const stages = growthSeed.map(stage => ({ ...stage, detailPhrase: "", detailDescription: "" }));
    expect((await request(app).put("/admin/growth/catalog").send({ revision: 1, stages })).status).toBe(200);
    const legacy = growthSeed.map(stage => ({ ...stage, story: "Recorrido editado" }));
    expect((await request(app).put("/admin/growth/catalog").send({ revision: 2, stages: legacy })).status).toBe(200);
    const reloaded = await request(app).get("/growth/catalog");
    expect(reloaded.body.stages.every((s: any) => s.detailPhrase === "" && s.detailDescription === "")).toBe(true);
  });
  it("preserves saved editorial copy when older clients omit the fields", async () => {
    fixture.catalog.stages = growthSeed.map(stage => ({
      ...adoptGrowthEditorial(stage), detailPhrase: "Conservar frase", detailDescription: "Conservar descripción",
    }));
    expect((await request(app).put("/admin/growth/catalog").send({ revision: 1, stages: growthSeed })).status).toBe(200);
    expect(fixture.catalog.stages.every((s: any) => s.detailPhrase === "Conservar frase" && s.detailDescription === "Conservar descripción")).toBe(true);
  });
  it("rejects unauthenticated, non-admin, oversized and conflicting saves without writes", async () => {
    for (const [role, status] of [[null, 401], ["user", 403]] as const) {
      fixture.role = role;
      expect((await request(app).put("/admin/growth/catalog").send({ revision: 1, stages: growthSeed })).status).toBe(status);
    }
    fixture.role = "admin";
    const oversized = growthSeed.map(stage => ({ ...stage, detailDescription: "a".repeat(10001) }));
    expect((await request(app).put("/admin/growth/catalog").send({ revision: 1, stages: oversized })).status).toBe(400);
    expect((await request(app).put("/admin/growth/catalog").send({ revision: 2, stages: growthSeed })).status).toBe(409);
    expect(fixture.writes).toEqual([]);
  });
  it("stores new phases and removes retired ones together with their editorial details", async () => {
    const previous = growthSeed.at(-1)!;
    const added = { ...previous, id: "new-phase", name: "Nueva fase", startDay: previous.endDay + 1,
      endDay: previous.endDay + 2, rewards: [], detailPhrase: "Nueva frase", detailDescription: "Nuevo texto" };
    const stages = [...growthSeed.slice(0, -1), added];
    expect((await request(app).put("/admin/growth/catalog").send({ revision: 1, stages })).status).toBe(200);
    const response = await request(app).get("/growth/catalog");
    expect(response.body.stages.at(-1)).toEqual(added);
    expect(response.body.stages.some((s: any) => s.id === previous.id)).toBe(false);
  });
  it("saves a whole catalog of long descriptions larger than the default JSON limit", async () => {
    const stages = growthSeed.map(stage => ({ ...stage, detailDescription: "a".repeat(10000) }));
    expect(JSON.stringify(stages).length).toBeGreaterThan(100 * 1024);
    const response = await request(app).put("/admin/growth/catalog").send({ revision: 1, stages });
    expect(response.status).toBe(200);
    expect(response.body.stages.every((s: any) => s.detailDescription.length === 10000)).toBe(true);
  });
});
