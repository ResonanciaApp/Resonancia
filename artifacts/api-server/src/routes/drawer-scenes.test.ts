import { afterAll, describe, expect, it, vi } from "vitest";
import express from "express";
import request from "supertest";
import { db, drawerScenesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
const auth = vi.hoisted(() => ({ role: "" }));
vi.mock("../middlewares/requireAuth", () => ({
  requireAuth: (req: any, res: any, next: any) => {
    if (!auth.role) return res.sendStatus(401);
    req.currentUser = { id: -1, role: auth.role };
    next();
  },
}));
vi.mock("../middlewares/requireRole", () => ({
  requireRole: () => (_req: any, res: any, next: any) => auth.role === "admin" ? next() : res.sendStatus(403),
}));
vi.mock("../lib/objectAccess", () => ({
  lockObjectPaths: async () => {},
  validateOwnedCompletedImageUpload: async () => ({ ok: false }),
}));
import router from "./drawer-scenes";
const app = express();
app.use(express.json());
app.use((req, _res, next) => { (req as any).log = { error: () => {} }; next(); });
app.use(router);
afterAll(() => { auth.role = ""; });

describe("drawer scenes", () => {
  it("protects editing, persists titles, validates uploads and restores defaults", async () => {
    const initial = await request(app).get("/drawer-scenes");
    expect(initial.status).toBe(200);
    expect(initial.body.scenes).toHaveLength(6);
    expect((await request(app).put("/admin/drawer-scenes").send(initial.body)).status).toBe(401);
    auth.role = "user";
    expect((await request(app).put("/admin/drawer-scenes").send(initial.body)).status).toBe(403);
    auth.role = "admin";
    const scenes = initial.body.scenes.map((scene: any) => ({ ...scene }));
    const [original] = await db.select().from(drawerScenesTable);
    try {
      scenes[0].title = "Día editorial";
      expect((await request(app).put("/admin/drawer-scenes").send({ scenes })).status).toBe(200);
      expect((await request(app).get("/drawer-scenes")).body.scenes[0].title).toBe("Día editorial");
      scenes[0].iconPath = "/objects/not-owned";
      expect((await request(app).put("/admin/drawer-scenes").send({ scenes })).status).toBe(400);
      scenes[0].iconPath = null;
      expect((await request(app).put("/admin/drawer-scenes").send({ scenes })).status).toBe(200);
      expect((await request(app).get("/drawer-scenes")).body.scenes[0].iconPath).toBeNull();
      scenes[0].title = " ";
      expect((await request(app).put("/admin/drawer-scenes").send({ scenes })).status).toBe(400);
      expect((await request(app).put("/admin/drawer-scenes").send({ scenes: [] })).status).toBe(400);
    } finally {
      if (original) await db.update(drawerScenesTable).set({ content: original.content }).where(eq(drawerScenesTable.id, 1));
      else await db.delete(drawerScenesTable).where(eq(drawerScenesTable.id, 1));
    }
  });
});
