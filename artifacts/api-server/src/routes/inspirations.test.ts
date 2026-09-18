import { beforeAll, afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import express, { type NextFunction, type Request, type Response } from "express";
import request from "supertest";
import { readFile } from "node:fs/promises";
import { drizzle } from "drizzle-orm/node-postgres";
import sharp from "sharp";

// Full route/SQL tests use an isolated disposable schema, never existing
// editorial/account rows. Explicit development opt-in prevents production use.
const state = vi.hoisted(() => ({
  role: null as string | null, userId: 1,
  schema: `inspiration_test_${Math.random().toString(36).slice(2)}`,
  pool: undefined as typeof import("@workspace/db").pool | undefined,
  bytes: Buffer.alloc(0), mime: "image/png", generation: "1", imageExists: true,
}));
vi.mock("@workspace/db", async (original) => {
  const actual = await original<typeof import("@workspace/db")>();
  if (process.env.INSPIRATION_DB_TEST !== "development") return actual;
  if (process.env.NODE_ENV === "production") throw new Error("Refusing production test");
  const Pool = actual.pool.constructor as new (options: object) => typeof actual.pool;
  state.pool = new Pool({ connectionString: process.env.DATABASE_URL, options: `-c search_path=${state.schema}` });
  return { ...actual, db: drizzle(state.pool) };
});
vi.mock("../middlewares/requireAuth", () => ({
  requireAuth: (req: Request, res: Response, next: NextFunction) => {
    if (!state.role) { res.status(401).json({ error: "No autenticado" }); return; }
    Object.assign(req, { currentUser: { id: state.userId, role: state.role } }); next();
  },
}));
vi.mock("../middlewares/requireRole", () => ({
  requireRole: (...roles: string[]) => (_req: Request, res: Response, next: NextFunction) => {
    if (!state.role || !roles.includes(state.role)) { res.status(state.role ? 403 : 401).json({ error: "No autorizado" }); return; }
    next();
  },
}));
vi.mock("../lib/objectStorage", () => {
  class ObjectNotFoundError extends Error {}
  const file = () => ({
    name: "fixture", bucket: { file },
    getMetadata: async () => [{ size: String(state.bytes.length), contentType: state.mime, generation: state.generation }],
    download: async () => [state.bytes],
  });
  return {
    ObjectNotFoundError,
    ObjectStorageService: class {
      getObjectEntityUploadURL = async () => "https://upload.example.test/private";
      normalizeObjectEntityPath = () => "/objects/uploads/fixture";
      getObjectEntityFile = async () => { if (!state.imageExists) throw new ObjectNotFoundError(); return file(); };
    },
  };
});
import inspirationsRouter from "./inspirations";
import { pool as basePool } from "@workspace/db";
import { emptyInspirationContent } from "../lib/inspirationPolicy";
const app = express();
app.use(express.json());
app.use("/api", inspirationsRouter);
const past = "2001-01-01", future = "2199-01-01";
const draft = { ...emptyInspirationContent, quote: "Test fixture quote", reflection: "Test fixture reflection", imagePath: "/objects/uploads/fixture" };
const post = (path: string, body: object) => request(app).post(`/api${path}`).send(body);
const put = (path: string, body: object) => request(app).put(`/api${path}`).send(body);
const get = (path: string) => request(app).get(`/api${path}`);

describe("inspiration route validation/authentication", () => {
  beforeEach(() => { state.role = null; });
  it("guards every editorial action and private collection", async () => {
    for (const path of ["/admin/inspirations/week", "/admin/inspirations/image?objectPath=x", "/me/inspiration-notes", "/me/inspiration-favorites"]) await get(path).expect(401);
    state.role = "user";
    await get("/admin/inspirations/week").expect(403);
    await post("/admin/inspirations/uploads", {}).expect(403);
    await post("/admin/inspirations", {}).expect(403);
  });
  it("rejects invalid date/timezone/UUID and payload before DB access", async () => {
    await get("/inspirations/week?date=2026-02-30").expect(400);
    await get("/inspirations/week?timeZone=invalid").expect(400);
    await get("/inspirations/not-a-uuid").expect(400);
    state.role = "admin";
    await post("/admin/inspirations/uploads", { name: "x", size: 1, contentType: "image/svg+xml" }).expect(400);
    await post("/admin/inspirations/uploads", { name: "x", size: 20_000_000, contentType: "image/png" }).expect(400);
    await post("/admin/inspirations", { date: "2026-01-01", draft: { ...draft, overlayOpacity: 1 } }).expect(400);
  });
});

describe.skipIf(process.env.INSPIRATION_DB_TEST !== "development")("inspiration isolated PostgreSQL integration", () => {
  beforeAll(async () => {
    if (!/^[a-z0-9_]+$/.test(state.schema)) throw new Error("Unsafe fixture schema");
    await basePool.query(`CREATE SCHEMA ${state.schema}`);
    await state.pool!.query("CREATE TABLE users (id integer PRIMARY KEY); INSERT INTO users VALUES (1),(2),(3); CREATE TABLE catalog_sessions (id text PRIMARY KEY, status text);");
    const migration = await readFile(new URL("../../../../lib/db/migrations/0009_inspirations.sql", import.meta.url), "utf8");
    await state.pool!.query(migration);
    state.bytes = await sharp({ create: { width: 16, height: 16, channels: 3, background: "#888" } }).png().toBuffer();
  });
  afterAll(async () => {
    await state.pool?.end();
    await basePool.query(`DROP SCHEMA IF EXISTS ${state.schema} CASCADE`);
  });
  beforeEach(async () => {
    state.role = "admin"; state.userId = 1; state.mime = "image/png"; state.generation = "1"; state.imageExists = true;
    await state.pool!.query("TRUNCATE inspirations, inspiration_assets, inspiration_settings, inspiration_notes, inspiration_favorites");
    await post("/admin/inspirations/uploads", { name: "fixture.png", size: state.bytes.length, contentType: "image/png" }).expect(200);
  });
  async function create(date = past) { return (await post("/admin/inspirations", { date, draft }).expect(200)).body; }
  async function publish(row: {id: string; revision: number}) { return (await post(`/admin/inspirations/${row.id}/publish`, { revision: row.revision }).expect(200)).body; }
  it("enforces unique date, isolates drafts, publishes atomically and checks revisions", async () => {
    let row = await create();
    await post("/admin/inspirations", { date: past, draft }).expect(409);
    expect((await get(`/inspirations/${row.id}`)).body.content).toBeNull();
    row = await publish(row);
    const edited = (await put(`/admin/inspirations/${row.id}`, { revision: row.revision, date: past, draft: { ...draft, quote: "Unpublished edit" } }).expect(200)).body;
    expect((await get(`/inspirations/${row.id}`)).body.content.quote).toBe(draft.quote);
    expect((await post(`/admin/inspirations/${row.id}/publish`, { revision: row.revision }).expect(409)).body.currentRevision).toBe(edited.revision);
    await publish(edited);
    expect((await get(`/inspirations/${row.id}`)).body.content.quote).toBe("Unpublished edit");
    await put(`/admin/inspirations/${row.id}`, { revision: edited.revision + 1, date: future, draft }).expect(400);
  });
  it("returns seven positions; gates future ID/date/week/image without editorial leakage", async () => {
    const row = await publish(await create(future));
    const byId = (await get(`/inspirations/${row.id}?timeZone=Pacific/Kiritimati`).expect(200)).body;
    expect(byId).toMatchObject({ status: "future", content: null, id: null, revision: null });
    expect((await get(`/inspirations/by-date/${future}`).expect(200)).body).toEqual(byId);
    const week = (await get(`/inspirations/week?date=${future}`).expect(200)).body;
    expect(week.days).toHaveLength(7);
    expect(JSON.stringify(week)).not.toContain(draft.quote);
    expect(JSON.stringify(week)).not.toContain(draft.imagePath);
    await get(`/inspirations/${row.id}/image`).expect(404);
    state.role = "user";
    await put(`/me/inspiration-favorites/${row.id}`, { revision: 0, deleted: false }).expect(404);
    await put("/me/inspiration-notes/11111111-1111-4111-8111-111111111111", { revision: 0, inspirationId: row.id, text: "private", deleted: false }).expect(404);
  });
  it("rejects foreign/missing images, incomplete content and overwritten upload generations", async () => {
    await post("/admin/inspirations", { date: past, draft: { ...draft, imagePath: "/objects/someone-elses" } }).expect(400);
    let row = (await post("/admin/inspirations", { date: past, draft: emptyInspirationContent }).expect(200)).body;
    await post(`/admin/inspirations/${row.id}/publish`, { revision: row.revision }).expect(400);
    row = (await put(`/admin/inspirations/${row.id}`, { revision: row.revision, date: past, draft }).expect(200)).body;
    state.imageExists = false;
    await post(`/admin/inspirations/${row.id}/publish`, { revision: row.revision }).expect(400);
    state.imageExists = true; row = await publish(row);
    state.generation = "2";
    await post(`/admin/inspirations/${row.id}/publish`, { revision: row.revision }).expect(400);
  });
  it("withdrawal/deletion revoke images and preserve stable identity with CAS recovery", async () => {
    let row = await publish(await create());
    await get(`/inspirations/${row.id}/image?revision=${row.revision}`).expect(200).expect("Cache-Control", "private, no-store");
    await get(`/inspirations/${row.id}/image?revision=999`).expect(404);
    row = (await post(`/admin/inspirations/${row.id}/unpublish`, { revision: row.revision }).expect(200)).body;
    await get(`/inspirations/${row.id}/image`).expect(404);
    row = (await request(app).delete(`/api/admin/inspirations/${row.id}`).send({ revision: row.revision }).expect(200)).body;
    expect(row.deleted).toBe(true);
    expect((await get(`/inspirations/${row.id}`)).body.content).toBeNull();
    await post("/admin/inspirations", { date: past, draft }).expect(409);
    const restored = (await put(`/admin/inspirations/${row.id}`, { revision: row.revision, date: past, draft }).expect(200)).body;
    expect(restored.id).toBe(row.id); expect(restored.deleted).toBe(false);
  });
  it("serializes concurrent saves so exactly one edit wins", async () => {
    const row = await create();
    const results = await Promise.all(["first", "second"].map((quote) => put(`/admin/inspirations/${row.id}`, { revision: row.revision, date: past, draft: { ...draft, quote } })));
    expect(results.map((r) => r.status).sort()).toEqual([200, 409]);
  });
  it("notes isolate owners/admin; retries are idempotent; stale writes cannot revive deletions", async () => {
    let row = await publish(await create()); state.role = "user";
    const id = "11111111-1111-4111-8111-111111111111";
    const body = { revision: 0, inspirationId: row.id, text: "Private exact text\n  unchanged ", deleted: false };
    const created = (await put(`/me/inspiration-notes/${id}`, body).expect(200)).body;
    expect(created.text).toBe(body.text);
    expect((await put(`/me/inspiration-notes/${id}`, body).expect(200)).body.revision).toBe(1);
    state.userId = 2; expect((await get("/me/inspiration-notes")).body.items).toEqual([]);
    state.userId = 3; state.role = "admin"; expect((await get("/me/inspiration-notes")).body.items).toEqual([]);
    row = (await post(`/admin/inspirations/${row.id}/unpublish`, { revision: row.revision }).expect(200)).body;
    state.userId = 1; state.role = "user";
    await put(`/me/inspiration-notes/${id}`, { ...body, revision: 1, text: "Still editable after withdrawal" }).expect(200);
    await put(`/me/inspiration-notes/${id}`, { ...body, revision: 1, text: "conflict" }).expect(409);
    await put(`/me/inspiration-notes/${id}`, { ...body, revision: 2, deleted: true }).expect(200);
    await put(`/me/inspiration-notes/${id}`, { ...body, revision: 2 }).expect(409);
    await put(`/me/inspiration-notes/${id}`, { ...body, revision: 3 }).expect(409);
    expect((await get("/me/inspiration-notes")).body.items[0]).toMatchObject({ text: "", deleted: true, revision: 3 });
  });
  it("unknown deletions produce durable tombstones; account deletion cascades private records", async () => {
    const row = await publish(await create()); state.role = "user";
    const id = "11111111-1111-4111-8111-111111111111";
    const note = { inspirationId: row.id, revision: 0, text: "", deleted: true };
    await put(`/me/inspiration-notes/${id}`, note).expect(200);
    await put(`/me/inspiration-notes/${id}`, { ...note, deleted: false, text: "Late offline create" }).expect(409);
    await put(`/me/inspiration-favorites/${row.id}`, { revision: 0, deleted: true }).expect(200);
    await put(`/me/inspiration-favorites/${row.id}`, { revision: 0, deleted: false }).expect(409);
    await put(`/me/inspiration-favorites/${row.id}`, { revision: 1, deleted: false }).expect(200);
    await state.pool!.query("DELETE FROM users WHERE id=1");
    expect((await state.pool!.query("SELECT * FROM inspiration_notes")).rowCount).toBe(0);
    expect((await state.pool!.query("SELECT * FROM inspiration_favorites")).rowCount).toBe(0);
    await state.pool!.query("INSERT INTO users VALUES (1)");
  });
  it("settings use revisions and defaults without inventing editorial content", async () => {
    const defaults = (await get("/inspirations/settings")).body;
    expect(defaults.revision).toBe(0);
    const updated = { ...defaults, sectionTitle: "Una pausa" };
    await put("/admin/inspirations/settings", updated).expect(200);
    await put("/admin/inspirations/settings", updated).expect(409);
    expect((await get("/inspirations/settings")).body.sectionTitle).toBe("Una pausa");
  });
});