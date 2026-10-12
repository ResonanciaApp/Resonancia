import express from "express";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";

const state = vi.hoisted(() => ({ row: null as any }));
vi.mock("@workspace/db", () => {
  const database: any = {
    execute: async () => [],
    select: () => ({ from: () => ({ where: async () => state.row ? [structuredClone(state.row)] : [] }) }),
    insert: () => ({
      values: (row: any) => ({
        onConflictDoUpdate: async () => { state.row = structuredClone(row); },
      }),
    }),
    transaction: async (fn: any) => fn(database),
  };
  return { db: database, streakInfoSettingsTable: { id: "id" } };
});
vi.mock("../middlewares/requireAuth", () => ({
  requireAuth: (req: any, res: any, next: any) => req.headers["x-test-role"] ? next() : res.status(401).json({ error: "Unauthorized" }),
}));
vi.mock("../middlewares/requireRole", () => ({
  requireRole: () => (req: any, res: any, next: any) => req.headers["x-test-role"] === "admin" ? next() : res.status(403).json({ error: "Forbidden" }),
}));
import router from "./streak-info";
import { DEFAULT_STREAK_INFO } from "../lib/streakInfoContent";

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
beforeEach(() => { state.row = null; });
const save = (body: unknown, role = "admin") => fetch(`${base}/admin/streak-info`, {
  method: "PUT", headers: { "content-type": "application/json", "x-test-role": role }, body: JSON.stringify(body),
});

describe("streak information HTTP contract", () => {
  it("exposes original texts publicly, but guards the editor", async () => {
    const response = await fetch(`${base}/streak-info`);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ content: DEFAULT_STREAK_INFO, revision: 0 });
    expect((await fetch(`${base}/admin/streak-info`)).status).toBe(401);
    expect((await save({ content: DEFAULT_STREAK_INFO, revision: 0 }, "user")).status).toBe(403);
  });
  it("publishes all edited fields and prevents stale overwrites", async () => {
    const content = structuredClone(DEFAULT_STREAK_INFO);
    content.title = "Nuevo título";
    content.description = "Nueva descripción";
    content.cards.forEach(card => { card.title += " editada"; card.description = `Texto ${card.id}`; });
    const saved = await save({ content, revision: 0 });
    expect(saved.status).toBe(200);
    expect(await saved.json()).toEqual({ content, revision: 1 });
    expect(await (await fetch(`${base}/streak-info`)).json()).toEqual({ content, revision: 1 });
    expect((await save({ content: DEFAULT_STREAK_INFO, revision: 0 })).status).toBe(409);
    expect(state.row.content).toEqual(content);
    expect((await save({ content, revision: 1 })).status).toBe(200);
    expect(state.row.revision).toBe(2);
  });
  it("rejects incomplete cards without modifying stored text", async () => {
    const content = structuredClone(DEFAULT_STREAK_INFO);
    content.cards.pop();
    expect((await save({ content, revision: 0 })).status).toBe(400);
    expect(state.row).toBeNull();
  });
});
