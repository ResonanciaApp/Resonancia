import express from "express";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
const state = vi.hoisted(() => ({ row: null as any, validUpload: true }));
vi.mock("@workspace/db", async () => {
  const schema = await import("../../../../lib/db/src/schema/premium-content");
  const db: any = {
    execute: async () => [],
    select: () => ({ from: () => ({ where: async () => state.row ? [state.row] : [] }) }),
    insert: () => ({ values: (row: any) => ({ onConflictDoUpdate: async () => { state.row = row; } }) }),
    transaction: async (fn: any) => fn(db),
  };
  return { ...schema, db };
});
vi.mock("../lib/objectAccess", () => ({
  lockObjectPaths: vi.fn(),
  validateOwnedCompletedImageUpload: async () => ({ ok: state.validUpload }),
}));
vi.mock("../lib/objectStorage", () => ({ ObjectStorageService: class {} }));
vi.mock("../middlewares/requireAuth", () => ({
  requireAuth: (req: any, res: any, next: any) => {
    req.currentUser = { id: 1 };
    return req.headers["x-test-role"] ? next() : res.sendStatus(401);
  },
}));
vi.mock("../middlewares/requireRole", () => ({
  requireRole: () => (req: any, res: any, next: any) => req.headers["x-test-role"] === "admin" ? next() : res.sendStatus(403),
}));
import router from "./premium-content";
let server: Server;
let base: string;
beforeAll(async () => {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => { (req as any).log = { error: vi.fn() }; next(); });
  app.use(router);
  server = app.listen(0, "127.0.0.1");
  await new Promise<void>(resolve => server.on("listening", resolve));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
afterAll(() => new Promise<void>(resolve => server.close(() => resolve())));
const save = (body: unknown, role = "admin") => fetch(`${base}/admin/premium-content`, {
  method: "PUT", headers: { "content-type": "application/json", "x-test-role": role },
  body: JSON.stringify(body),
});
describe("Premium editorial API", () => {
  it("protects admin reads and writes", async () => {
    expect((await fetch(`${base}/admin/premium-content`)).status).toBe(401);
    expect((await fetch(`${base}/admin/premium-content`, { headers: { "x-test-role": "user" } })).status).toBe(403);
    expect((await save({}, "user")).status).toBe(403);
  });
  it("publishes all four independent surfaces, persists order/removal and protects revisions", async () => {
    const initial = await (await fetch(`${base}/premium-content`)).json();
    expect(initial.content.sleep.title).toBe("¿Problemas para dormir?");
    expect(initial.content.home.images).toHaveLength(10);
    const content = structuredClone(initial.content);
    for (const key of Object.keys(content)) { content[key].title = `Título ${key}`; content[key].description = `Descripción ${key}`; }
    content.home.images = ["builtin:9", "builtin:2"];
    content.sleep.images = [];
    expect((await save({ content, revision: 0 })).status).toBe(200);
    expect(await (await fetch(`${base}/premium-content`)).json()).toEqual({ content, revision: 1 });
    expect((await save({ content, revision: 0 })).status).toBe(409);
  });
  it("rejects invalid text, image paths, oversize carousels and private unowned uploads", async () => {
    const current = await (await fetch(`${base}/premium-content`)).json();
    const invalid = [
      { ...current, content: { ...current.content, home: { ...current.content.home, title: " " } } },
      { ...current, content: { ...current.content, home: { ...current.content.home, images: ["javascript:alert(1)"] } } },
      { ...current, content: { ...current.content, home: { ...current.content.home, images: Array(31).fill("builtin:0") } } },
      { ...current, content: { ...current.content, sounds: { ...current.content.sounds, images: ["builtin:0"] } } },
    ];
    for (const body of invalid) expect((await save(body)).status).toBe(400);
    state.validUpload = false;
    current.content.home.images = ["/objects/uploads/private-image"];
    expect((await save(current)).status).toBe(400);
    state.validUpload = true;
    expect((await save(current)).status).toBe(200);
    expect((await (await fetch(`${base}/premium-content`)).json()).content.home.images).toEqual(["/objects/uploads/private-image"]);
  });
  it("does not expose arbitrary image paths or non-carousel surfaces", async () => {
    for (const path of ["sounds/0", "sleep/99", "home/not-an-index", "unknown/0"]) {
      expect((await fetch(`${base}/premium-content/image/${path}`)).status).toBe(404);
    }
  });
});
