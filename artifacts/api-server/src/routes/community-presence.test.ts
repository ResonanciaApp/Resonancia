import { beforeEach, describe, expect, it, vi } from "vitest";
import express, { type Request, type Response, type NextFunction } from "express";
import request from "supertest";

const mock = vi.hoisted(() => ({
  authenticated: true,
  query: vi.fn(),
  clientQuery: vi.fn(),
  release: vi.fn(),
}));
vi.mock("@workspace/db", () => ({ pool: {
  query: mock.query,
  connect: async () => ({ query: mock.clientQuery, release: mock.release }),
} }));
vi.mock("../middlewares/requireAuth", () => ({ requireAuth: (req: Request, res: Response, next: NextFunction) => {
  if (!mock.authenticated) { res.status(401).json({ error: "No autenticado" }); return; }
  req.currentUser = { id: 123 } as any;
  (req as any).log = { error: vi.fn() };
  next();
} }));
vi.mock("../lib/objectAccess", () => ({
  isPrivateObjectReference: (value: string) => value.startsWith("/objects/"),
  resolveObjectReadAccess: async ({ objectPath }: { objectPath: string }) =>
    objectPath === "/objects/owned-photo" ? "public" : "denied",
}));
const sessionId = "11111111-1111-4111-8111-111111111111";
async function app() {
  const { default: router } = await import("./community-presence");
  return express().use(express.json()).use(router);
}
beforeEach(() => {
  vi.resetModules();
  mock.authenticated = true;
  mock.query.mockReset().mockResolvedValue({
    rows: [{ count: 4, updated_at: new Date(), avatars: [
      { id: 1, avatar_url: "/objects/owned-photo", avatar_preset_id: null },
      { id: 2, avatar_url: "/objects/stolen-photo", avatar_preset_id: null },
      { id: 3, avatar_url: "file:///private/photo", avatar_preset_id: null },
      { id: 4, avatar_url: null, avatar_preset_id: "profile:photo-1" },
    ] }],
  });
  mock.clientQuery.mockReset().mockResolvedValue({ rowCount: 1, rows: [] });
  mock.release.mockClear();
});
describe("foreground community presence", () => {
  it("requires authentication for all operations", async () => {
    const server = await app();
    mock.authenticated = false;
    for (const path of ["/community/presence/heartbeat", "/community/presence/leave"]) {
      expect((await request(server).post(path).send({ sessionId })).status).toBe(401);
    }
    expect((await request(server).get("/community/presence")).status).toBe(401);
    expect(mock.query).not.toHaveBeenCalled();
    expect(mock.clientQuery).not.toHaveBeenCalled();
  });
  it("returns the full total independently of eligible photos without leaking private fields", async () => {
    const response = await request(await app()).get("/community/presence");
    expect(response.status).toBe(200);
    expect(response.body.count).toBe(4);
    expect(response.body.avatars.sort((a: { id: string }, b: { id: string }) => Number(a.id) - Number(b.id))).toEqual([
      { id: "1", avatarUrl: "/objects/owned-photo", avatarPresetId: null },
      { id: "4", avatarUrl: null, avatarPresetId: "profile:photo-1" },
    ]);
    expect(response.body).not.toHaveProperty("email");
    expect(response.headers["cache-control"]).toBe("no-store");
    expect(mock.query.mock.calls[0][0]).toContain("EXISTS");
    expect(mock.query.mock.calls[0][0]).toContain("interval '90 seconds'");
  });
  it("rejects malformed sessions and retires only this authenticated device using a tombstone", async () => {
    const server = await app();
    expect((await request(server).post("/community/presence/heartbeat").send({ sessionId: "other-user" })).status).toBe(400);
    expect(mock.clientQuery).not.toHaveBeenCalled();
    expect((await request(server).post("/community/presence/leave").send({ sessionId, userId: 999 })).status).toBe(204);
    expect(mock.query.mock.calls[0][1]).toEqual([123, sessionId]);
    expect(mock.query.mock.calls[0][0]).toContain("DO UPDATE SET closed_at=now()");
  });
  it("uses server time, bounded devices and throttled updates without reviving retired leases", async () => {
    expect((await request(await app()).post("/community/presence/heartbeat").send({ sessionId, lastSeenAt: "2099" })).status).toBe(204);
    const insert = mock.clientQuery.mock.calls.find(([sql]) => sql.includes("INSERT INTO community_presence"))!;
    expect(insert[1]).toEqual([123, sessionId]);
    expect(insert[0]).toContain("closed_at IS NULL");
    expect(insert[0]).toContain("interval '20 seconds'");
    expect(insert[0]).toContain("< 8");
    expect(mock.release).toHaveBeenCalledOnce();
  });
  it("shares its short summary cache and does not convert an outage to zero", async () => {
    const server = await app();
    await request(server).get("/community/presence");
    await request(server).get("/community/presence");
    expect(mock.query).toHaveBeenCalledOnce();
    await request(server).post("/community/presence/leave").send({ sessionId });
    mock.query.mockRejectedValueOnce(new Error("offline"));
    const failed = await request(server).get("/community/presence");
    expect(failed.status).toBe(503);
    expect(failed.body).not.toHaveProperty("count");
    mock.query.mockResolvedValueOnce({ rows: [{ count: 0, updated_at: new Date(), avatars: [] }] });
    expect((await request(server).get("/community/presence")).body.count).toBe(0);
  });
  it("limits authenticated query bursts", async () => {
    const server = await app();
    for (let i = 0; i < 120; i++) expect((await request(server).get("/community/presence")).status).toBe(200);
    const response = await request(server).get("/community/presence");
    expect(response.status).toBe(429);
    expect(response.headers["retry-after"]).toBe("60");
  });
});