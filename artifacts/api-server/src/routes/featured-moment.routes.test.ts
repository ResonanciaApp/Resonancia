import { afterEach, describe, expect, it, vi } from "vitest";
import express, { type NextFunction, type Request, type Response } from "express";
import request from "supertest";

const state = vi.hoisted(() => ({
  role: null as string | null,
  get: vi.fn(),
  set: vi.fn(),
}));

vi.mock("@workspace/db", () => new Proxy({}, {
  get: (_target, key) => key === "db" ? {} : {},
}));
vi.mock("@workspace/api-zod", () => new Proxy({}, { get: () => ({}) }));
vi.mock("../lib/featuredMomentService", () => ({
  getFeaturedMoment: state.get,
  setFeaturedMomentManual: state.set,
}));
vi.mock("../lib/featuredMomentEngine", () => ({
  editorialDate: () => "2025-01-15",
}));
vi.mock("../middlewares/requireAuth", () => ({
  requireAuth: (req: Request, res: Response, next: NextFunction) => {
    if (!state.role) {
      res.status(401).json({ error: "No autenticado" });
      return;
    }
    Object.assign(req, { currentUser: { id: 1, role: state.role } });
    next();
  },
}));
vi.mock("../middlewares/requireRole", () => ({
  requireRole: (...roles: string[]) => (_req: Request, res: Response, next: NextFunction) => {
    if (!state.role || !roles.includes(state.role)) {
      res.status(state.role ? 403 : 401).json({ error: "No autorizado" });
      return;
    }
    next();
  },
}));

import catalogRouter from "./catalog";

const snapshot = {
  date: "2025-01-15",
  timezone: "America/Santiago",
  nextChangeAt: "2025-01-16T03:00:00.000Z",
  source: "empty" as const,
  session: null,
  automaticSessionId: null,
  eligibleCount: 0,
  revision: "1",
  manualMigrated: false,
  candidates: [],
};
const app = express();
app.use(express.json());
app.use("/api", catalogRouter);

afterEach(() => {
  state.role = null;
  state.get.mockReset();
  state.set.mockReset();
});

describe("featured moment API route contract/security", () => {
  it("rejects non-editorial roles on the admin endpoint", async () => {
    state.role = "user";
    await request(app).get("/api/admin/featured-moment").expect(403);
    expect(state.get).not.toHaveBeenCalled();
  });

  it("requires auth for admin edits and validates the required date", async () => {
    await request(app)
      .put("/api/admin/featured-moment")
      .send({ sessionId: null, date: "2025-01-15" })
      .expect(401);
    state.role = "moderador";
    await request(app)
      .put("/api/admin/featured-moment")
      .send({ sessionId: null })
      .expect(400);
    await request(app)
      .put("/api/admin/featured-moment")
      .send({ sessionId: null, date: "not-a-day" })
      .expect(400);
    expect(state.set).not.toHaveBeenCalled();
  });

  it("returns 409 for a stale editorial date", async () => {
    state.role = "admin";
    state.set.mockResolvedValue({ kind: "stale-date" });
    await request(app)
      .put("/api/admin/featured-moment")
      .send({ sessionId: null, date: "2025-01-14" })
      .expect(409);
  });

  it("rejects a legacy attempt to pin an excluded Music session", async () => {
    state.role = "admin";
    state.set.mockResolvedValue({ kind: "not-eligible" });
    await request(app)
      .put("/api/admin/pinned-featured")
      .send({ sessionId: "music-session" })
      .expect(404);
    expect(state.set).toHaveBeenCalledWith({
      sessionId: "music-session",
      date: "2025-01-15",
    });
  });

  it("keeps the legacy GET/PUT response envelopes while routing through the dated service", async () => {
    state.get.mockResolvedValue({ ...snapshot, session: null });
    const read = await request(app).get("/api/catalog/pinned-featured").expect(200);
    expect(read.body).toEqual({ session: null });

    state.role = "admin";
    state.set.mockResolvedValue(snapshot);
    const write = await request(app)
      .put("/api/admin/pinned-featured")
      .send({ sessionId: null })
      .expect(200);
    expect(write.body).toEqual({ ok: true });
  });
});