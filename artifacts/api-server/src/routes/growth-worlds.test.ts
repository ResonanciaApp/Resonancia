import { beforeEach, describe, expect, it, vi } from "vitest";
import express from "express";
import request from "supertest";
import type { GrowthStageRecord, GrowthWorldRecord } from "@workspace/db";
import { growthSeed } from "../lib/growthSeed";
import { growthWorldTemplates } from "../lib/growthWorlds";
import { adoptGrowthEditorial } from "../lib/growthEditorial";

const fixture = vi.hoisted(() => ({
  actor: { id: 1, role: "admin" } as { id: number; role: string } | null,
  row: { revision: 1, stages: [] as GrowthStageRecord[], worlds: [] as GrowthWorldRecord[], updatedAt: new Date() },
  lock: vi.fn(), validateUpload: vi.fn(), rowLock: vi.fn(), progress: vi.fn(),
  serial: Promise.resolve() as Promise<unknown>,
}));
vi.mock("@workspace/db", () => ({
  growthCatalogTable: { id: "id" },
  db: {
    transaction: (callback: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        select: () => ({ from: () => ({ where: () => ({ for: (mode: string) => {
          fixture.rowLock(mode); return Promise.resolve([structuredClone(fixture.row)]);
        } }) }) }),
        update: () => ({ set: (values: object) => ({ where: async () => { Object.assign(fixture.row, values); } }) }),
      };
      const result = fixture.serial.then(() => callback(tx));
      fixture.serial = result.catch(() => {});
      return result;
    },
  },
}));
vi.mock("../middlewares/requireAuth", () => ({
  requireAuth: (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (!fixture.actor) { res.status(401).json({ error: "No autenticado" }); return; }
    req.currentUser = fixture.actor as typeof req.currentUser;
    next();
  },
}));
vi.mock("../middlewares/requireRole", () => ({
  requireRole: (...roles: string[]) => (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (!roles.includes(req.currentUser?.role ?? "")) { res.status(403).json({ error: "Sin permiso" }); return; }
    next();
  },
}));
vi.mock("../lib/objectAccess", () => ({
  lockObjectPaths: (...args: unknown[]) => fixture.lock(...args),
  validateOwnedCompletedImageUpload: (...args: unknown[]) => fixture.validateUpload(...args),
}));
vi.mock("../lib/growthService", () => ({
  readGrowthCatalog: async () => structuredClone(fixture.row),
  getGrowthProgress: (...args: unknown[]) => fixture.progress(...args),
  unlockGrowthAvatar: vi.fn(),
}));
import router from "./growth";
const app = express().use(express.json()).use(router);

beforeEach(() => {
  fixture.actor = { id: 1, role: "admin" };
  fixture.row = { revision: 1, stages: structuredClone(growthSeed), worlds: structuredClone(growthWorldTemplates.slice(0, 2)), updatedAt: new Date() };
  fixture.serial = Promise.resolve();
  fixture.lock.mockReset();
  fixture.rowLock.mockReset();
  fixture.progress.mockReset();
  fixture.validateUpload.mockReset().mockImplementation(({ objectPath }: { objectPath: string }) =>
    objectPath === "/objects/foreign" ? { ok: false, reason: "not_owned" } : { ok: true });
});
const save = (worlds = fixture.row.worlds, stages = fixture.row.stages, revision = 1) =>
  request(app).put("/admin/growth/catalog").send({ revision, worlds, stages });

describe("Guardado autorizado de mundos", () => {
  it("requiere autenticación y rol Admin", async () => {
    fixture.actor = null;
    expect((await save()).status).toBe(401);
    fixture.actor = { id: 1, role: "user" };
    expect((await save()).status).toBe(403);
    expect(fixture.row.revision).toBe(1);
  });
  it("guarda título, descripción y portada propios de un mundo sin tocar sus fases ni progreso", async () => {
    const worlds = structuredClone(fixture.row.worlds);
    worlds[0] = { ...worlds[0], name: "Mi primer mundo", description: "Una descripción editorial", coverUrl: "/objects/editor-cover" };
    const response = await save(worlds);
    expect(response.status).toBe(200);
    expect(response.body.worlds).toEqual(worlds);
    expect(response.body.stages).toEqual(growthSeed.map(stage => adoptGrowthEditorial(stage)));
    expect(fixture.rowLock).toHaveBeenCalledWith("update");
    expect(fixture.lock.mock.calls[0][1]).toContain("/objects/editor-cover");
    expect(fixture.validateUpload).toHaveBeenCalledWith(expect.objectContaining({ objectPath: "/objects/editor-cover", userId: 1 }));
    expect(fixture.progress).not.toHaveBeenCalled();
  });
  it("rechaza portadas ajenas, URLs arbitrarias, orden incorrecto y más de cinco mundos sin escrituras parciales", async () => {
    const worlds = structuredClone(fixture.row.worlds);
    worlds[0].coverUrl = "/objects/foreign";
    expect((await save(worlds)).status).toBe(400);
    worlds[0].coverUrl = "https://untrusted.invalid/image.webp";
    expect((await save(worlds)).status).toBe(400);
    expect((await save([...growthWorldTemplates, growthWorldTemplates[0]])).status).toBe(400);
    expect((await save([...fixture.row.worlds].reverse())).status).toBe(400);
    expect(fixture.row.revision).toBe(1);
    expect(fixture.row.worlds).toEqual(growthWorldTemplates.slice(0, 2));
  });
  it("crea mundos vacíos sin inventar fases y conserva metadata de clientes antiguos", async () => {
    const worlds = growthWorldTemplates.slice(0, 3);
    expect((await save(worlds)).status).toBe(200);
    expect(fixture.row.stages).toHaveLength(17);
    const response = await request(app).put("/admin/growth/catalog").send({ revision: 2, stages: growthSeed });
    expect(response.status).toBe(200);
    expect(response.body.worlds).toEqual(worlds);
    const next = { ...growthSeed[0], id: "new", group: "iluminacion", startDay: 113, endDay: 119, rewards: [] };
    expect((await save(worlds, [...growthSeed, next], 3)).status).toBe(200);
    expect((await request(app).put("/admin/growth/catalog").send({ revision: 4, stages: growthSeed })).status).toBe(409);
    expect(fixture.row.stages).toHaveLength(18);
  });
  it("un guardado con revisión antigua no pisa una edición concurrente", async () => {
    const [one, two] = await Promise.all([save(), save()]);
    expect([one.status, two.status].sort()).toEqual([200, 409]);
    expect(fixture.row.revision).toBe(2);
  });
  it("sirve las cuatro portadas existentes y rechaza nombres no permitidos", async () => {
    for (const world of growthWorldTemplates.slice(1)) {
      const response = await request(app).get(`/growth/world-covers/${world.id}`);
      expect(response.status).toBe(200);
      expect(response.headers["content-type"]).toBe("image/webp");
      expect(response.body.byteLength).toBeGreaterThan(0);
    }
    expect((await request(app).get("/growth/world-covers/constructor")).status).toBe(404);
  });
});
