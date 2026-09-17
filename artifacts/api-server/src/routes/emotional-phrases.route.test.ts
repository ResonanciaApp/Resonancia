import { beforeEach, describe, expect, it, vi } from "vitest";
import express, { type NextFunction, type Request, type Response } from "express";
import request from "supertest";

const authState = vi.hoisted(() => ({ role: null as "admin" | "user" | null }));

vi.mock("../middlewares/requireAuth", () => ({
  requireAuth: (req: Request, res: Response, next: NextFunction) => {
    if (!authState.role) {
      res.status(401).json({ error: "No autenticado" });
      return;
    }
    (req as unknown as { currentUser?: { role: string } }).currentUser = {
      role: authState.role,
    };
    next();
  },
}));

vi.mock("../middlewares/requireRole", () => ({
  requireRole: (...roles: string[]) => (req: Request, res: Response, next: NextFunction) => {
    const role = (req as Request & { currentUser?: { role: string } }).currentUser?.role;
    if (!role || !roles.includes(role)) {
      res.status(role ? 403 : 401).json({ error: role ? "No autorizado" : "No autenticado" });
      return;
    }
    next();
  },
}));

import emotionalPhrasesRouter from "./emotional-phrases";

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use((_req, _res, next) => next());
  app.use("/api", emotionalPhrasesRouter);
  return app;
}

const app = buildApp();
const completePayload = {
  revision: 0,
  phrases: Array.from({ length: 7 }, (_, index) => ({
    slot: index + 1,
    text: `Frase ${index + 1}`,
  })),
};

describe("emotional phrase route security and request validation", () => {
  beforeEach(() => {
    authState.role = null;
  });

  it("protects admin GET with authentication and admin role", async () => {
    await request(app).get("/api/admin/emotional-phrases").expect(401);
    authState.role = "user";
    await request(app).get("/api/admin/emotional-phrases").expect(403);
  });

  it("validates all seven unique slots before touching the database", async () => {
    authState.role = "admin";
    const response = await request(app)
      .put("/api/admin/emotional-phrases/feliz")
      .send({
        revision: 0,
        phrases: completePayload.phrases.slice(0, 6),
      })
      .expect(400);
    expect(response.body.error).toBe("Datos inválidos");
    expect(response.body.details).toBeDefined();
  });

  it("rejects unknown moods through the generated path schema", async () => {
    authState.role = "admin";
    await request(app)
      .put("/api/admin/emotional-phrases/no-existe")
      .send(completePayload)
      .expect(400);
  });

  it("rejects negative revisions before a replacement transaction", async () => {
    authState.role = "admin";
    await request(app)
      .put("/api/admin/emotional-phrases/feliz")
      .send({ ...completePayload, revision: -1 })
      .expect(400);
  });
});