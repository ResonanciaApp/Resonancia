import express from "express";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
const state = vi.hoisted(() => ({ row: null as any }));
vi.mock("@workspace/db", () => {
  const db: any = {
    execute: async () => [],
    select: () => ({ from: () => ({ where: async () => state.row ? [state.row] : [] }) }),
    insert: () => ({ values: (row: any) => ({ onConflictDoUpdate: async () => { state.row = row; } }) }),
    transaction: async (fn: any) => fn(db),
  };
  return { db, journeyInfoSettingsTable: { id: "id" } };
});
vi.mock("../middlewares/requireAuth", () => ({
  requireAuth: (req: any, res: any, next: any) => req.headers["x-test-role"] ? next() : res.sendStatus(401),
}));
vi.mock("../middlewares/requireRole", () => ({
  requireRole: () => (req: any, res: any, next: any) => req.headers["x-test-role"] === "admin" ? next() : res.sendStatus(403),
}));
import router from "./journey-info";
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
describe("journey explanation API", () => {
  it("guards editing and publishes saved paragraphs with conflict protection", async () => {
    expect((await fetch(`${base}/admin/journey-info`)).status).toBe(401);
    expect((await fetch(`${base}/admin/journey-info`, { headers: { "x-test-role": "user" } })).status).toBe(403);
    const initial = await (await fetch(`${base}/journey-info`)).json();
    expect(initial.content.title).toBe("¿Qué es?");
    const content = { title: "Nuestro recorrido", description: "Primer párrafo.\n\nSegundo párrafo." };
    const save = (revision: number) => fetch(`${base}/admin/journey-info`, {
      method: "PUT", headers: { "content-type": "application/json", "x-test-role": "admin" },
      body: JSON.stringify({ content, revision }),
    });
    expect((await save(0)).status).toBe(200);
    expect(await (await fetch(`${base}/journey-info`)).json()).toEqual({ content, revision: 1 });
    expect((await save(0)).status).toBe(409);
  });
});
