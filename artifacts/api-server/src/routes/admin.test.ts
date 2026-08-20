import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import express, { type Express, type NextFunction, type Request, type Response } from "express";
import request from "supertest";

// Estado de autenticación controlable por test. `vi.hoisted` lo eleva por
// encima del `vi.mock` para que la factory pueda referenciarlo de forma segura.
const authState = vi.hoisted(() => ({ clerkUserId: null as string | null }));

vi.mock("@clerk/express", () => ({
  getAuth: () => ({ userId: authState.clerkUserId }),
  clerkMiddleware: () => (_req: Request, _res: Response, next: NextFunction) => next(),
}));

// Evita cualquier intento de envío de push durante los tests.
vi.mock("../lib/push", () => ({
  sendPushToUsers: vi.fn(async () => {}),
}));

import {
  db,
  usersTable,
  catalogCategoriesTable,
  catalogAudioFilesTable,
  catalogSessionsTable,
  type User,
  type UserRole,
} from "@workspace/db";
import { eq, inArray } from "drizzle-orm";
import adminRouter from "./admin";
import usersRouter from "./users";
import catalogRouter from "./catalog";

function buildApp(): Express {
  const app = express();
  app.use(express.json());
  // Los routers usan `req.log` en los catch; proveemos un stub silencioso.
  app.use((req: Request, _res: Response, next: NextFunction) => {
    (req as { log: unknown }).log = {
      error: () => {},
      info: () => {},
      warn: () => {},
    };
    next();
  });
  app.use("/api", adminRouter);
  app.use("/api", usersRouter);
  app.use("/api", catalogRouter);
  return app;
}

const app = buildApp();
const suffix = `${Date.now()}_${Math.floor(Math.random() * 1e6)}`;

async function createUser(tag: string, role: UserRole = "user"): Promise<User> {
  const [user] = await db
    .insert(usersTable)
    .values({
      clerkUserId: `test_clerk_${tag}_${suffix}`,
      username: `test_user_${tag}_${suffix}`,
      displayName: `Test ${tag}`,
      role,
    })
    .returning();
  return user;
}

function authAs(user: User) {
  authState.clerkUserId = user.clerkUserId;
}

function noAuth() {
  authState.clerkUserId = null;
}

describe("admin routes — security boundary", () => {
  let userUser: User; // role "user"
  let creatorUser: User; // role "creator"
  let adminUser: User; // role "admin"

  beforeAll(async () => {
    userUser = await createUser("user", "user");
    creatorUser = await createUser("creator", "creator");
    adminUser = await createUser("admin", "admin");
  });

  afterAll(async () => {
    await db
      .delete(usersTable)
      .where(inArray(usersTable.id, [userUser.id, creatorUser.id, adminUser.id]));
  });

  afterEach(() => {
    noAuth();
  });

  // Cada ruta admin debe rechazar sin auth (401) y con un rol no-admin (403).
  const adminEndpoints: Array<{ name: string; call: () => request.Test }> = [
    { name: "GET /admin/users", call: () => request(app).get("/api/admin/users") },
    { name: "GET /admin/stats", call: () => request(app).get("/api/admin/stats") },
    {
      name: "POST /admin/categories",
      call: () => request(app).post("/api/admin/categories").send({}),
    },
    {
      name: "PATCH /admin/categories/:id",
      call: () => request(app).patch("/api/admin/categories/does-not-exist").send({}),
    },
  ];

  describe("401 sin autenticación", () => {
    for (const ep of adminEndpoints) {
      it(`${ep.name} devuelve 401`, async () => {
        const res = await ep.call();
        expect(res.status).toBe(401);
      });
    }
  });

  describe("403 con rol no-admin", () => {
    for (const ep of adminEndpoints) {
      it(`${ep.name} devuelve 403 para un usuario normal`, async () => {
        authAs(userUser);
        const res = await ep.call();
        expect(res.status).toBe(403);
      });

      it(`${ep.name} devuelve 403 para un creator`, async () => {
        authAs(creatorUser);
        const res = await ep.call();
        expect(res.status).toBe(403);
      });
    }
  });

  describe("acceso permitido para admin", () => {
    it("GET /admin/users devuelve 200", async () => {
      authAs(adminUser);
      const res = await request(app).get("/api/admin/users");
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.users)).toBe(true);
    });

    it("GET /admin/stats devuelve 200", async () => {
      authAs(adminUser);
      const res = await request(app).get("/api/admin/stats");
      expect(res.status).toBe(200);
      expect(typeof res.body.totalUsers).toBe("number");
    });

    it("POST /admin/categories crea una categoría (201)", async () => {
      authAs(adminUser);
      const categoryId = `test-cat-${suffix.replace(/_/g, "-")}`;
      const res = await request(app)
        .post("/api/admin/categories")
        .send({
          id: categoryId,
          title: "Categoría de prueba",
          subtitle: "Subtítulo",
          icon: "leaf",
          color: "#BE9650",
          gradientStart: "#0B0F14",
          gradientEnd: "#151A23",
        });
      expect(res.status).toBe(201);
      expect(res.body.id).toBe(categoryId);

      // PATCH /admin/categories/:id como admin actualiza (200).
      const patchRes = await request(app)
        .patch(`/api/admin/categories/${categoryId}`)
        .send({ title: "Categoría actualizada" });
      expect(patchRes.status).toBe(200);
      expect(patchRes.body.title).toBe("Categoría actualizada");

      await db
        .delete(catalogCategoriesTable)
        .where(eq(catalogCategoriesTable.id, categoryId));
    });
  });
});

describe("PATCH /users/:userId/role — transiciones de rol", () => {
  let adminUser: User;
  let targetUser: User;

  beforeAll(async () => {
    adminUser = await createUser("role_admin", "admin");
    targetUser = await createUser("role_target", "user");
  });

  afterAll(async () => {
    await db
      .delete(usersTable)
      .where(inArray(usersTable.id, [adminUser.id, targetUser.id]));
  });

  afterEach(() => {
    noAuth();
  });

  it("devuelve 401 sin autenticación", async () => {
    const res = await request(app)
      .patch(`/api/users/${targetUser.id}/role`)
      .send({ role: "creator" });
    expect(res.status).toBe(401);
  });

  it("devuelve 403 para un usuario no-admin", async () => {
    authAs(targetUser);
    const res = await request(app)
      .patch(`/api/users/${targetUser.id}/role`)
      .send({ role: "admin" });
    expect(res.status).toBe(403);

    // El rol no cambió en la base de datos.
    const [unchanged] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, targetUser.id))
      .limit(1);
    expect(unchanged.role).toBe("user");
  });

  it("un admin puede promover user → creator → admin y degradar a user", async () => {
    authAs(adminUser);

    const toCreator = await request(app)
      .patch(`/api/users/${targetUser.id}/role`)
      .send({ role: "creator" });
    expect(toCreator.status).toBe(200);
    expect(toCreator.body.role).toBe("creator");

    const toAdmin = await request(app)
      .patch(`/api/users/${targetUser.id}/role`)
      .send({ role: "admin" });
    expect(toAdmin.status).toBe(200);
    expect(toAdmin.body.role).toBe("admin");

    const toUser = await request(app)
      .patch(`/api/users/${targetUser.id}/role`)
      .send({ role: "user" });
    expect(toUser.status).toBe(200);
    expect(toUser.body.role).toBe("user");

    const [final] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, targetUser.id))
      .limit(1);
    expect(final.role).toBe("user");
  });

  it("devuelve 400 con un rol inválido", async () => {
    authAs(adminUser);
    const res = await request(app)
      .patch(`/api/users/${targetUser.id}/role`)
      .send({ role: "superuser" });
    expect(res.status).toBe(400);
  });

  it("devuelve 404 para un usuario inexistente", async () => {
    authAs(adminUser);
    const res = await request(app)
      .patch(`/api/users/999999999/role`)
      .send({ role: "creator" });
    expect(res.status).toBe(404);
  });
});

describe("catalog hide/unhide — security boundary (admin)", () => {
  let userUser: User;
  let creatorUser: User;
  let adminUser: User;
  const sessionId = `test-session-${suffix}`;

  beforeAll(async () => {
    userUser = await createUser("hide_user", "user");
    creatorUser = await createUser("hide_creator", "creator");
    adminUser = await createUser("hide_admin", "admin");

    await db.insert(catalogSessionsTable).values({
      id: sessionId,
      title: "Sesión de prueba",
      subtitle: "Subtítulo",
      categoryId: "sonidos-ancestrales",
      categoryLabel: "Sonidos Ancestrales",
      duration: 600,
      durationLabel: "10 min",
      description: "Descripción de prueba",
      status: "published",
      createdBy: creatorUser.id,
    });
    await db.insert(catalogAudioFilesTable).values({
      sessionId,
      role: "main",
      url: "/objects/test-audio.mp3",
      name: "audio-bundleado.mp3",
    });
  });

  afterAll(async () => {
    await db.delete(catalogSessionsTable).where(eq(catalogSessionsTable.id, sessionId));
    await db
      .delete(usersTable)
      .where(inArray(usersTable.id, [userUser.id, creatorUser.id, adminUser.id]));
  });

  afterEach(() => {
    noAuth();
  });

  it("POST /catalog/submissions/:id/hide devuelve 401 sin auth", async () => {
    const res = await request(app).post(`/api/catalog/submissions/${sessionId}/hide`);
    expect(res.status).toBe(401);
  });

  it("POST /catalog/submissions/:id/hide devuelve 403 para no-admin", async () => {
    authAs(creatorUser);
    const res = await request(app).post(`/api/catalog/submissions/${sessionId}/hide`);
    expect(res.status).toBe(403);

    // Sigue publicada.
    const [still] = await db
      .select()
      .from(catalogSessionsTable)
      .where(eq(catalogSessionsTable.id, sessionId))
      .limit(1);
    expect(still.status).toBe("published");
  });

  it("admin puede ocultar (200 → draft) y volver a publicar (200 → published)", async () => {
    authAs(adminUser);

    const hideRes = await request(app).post(`/api/catalog/submissions/${sessionId}/hide`);
    expect(hideRes.status).toBe(200);
    const [hidden] = await db
      .select()
      .from(catalogSessionsTable)
      .where(eq(catalogSessionsTable.id, sessionId))
      .limit(1);
    expect(hidden.status).toBe("draft");

    const unhideRes = await request(app).post(
      `/api/catalog/submissions/${sessionId}/unhide`,
    );
    expect(unhideRes.status).toBe(200);
    const [restored] = await db
      .select()
      .from(catalogSessionsTable)
      .where(eq(catalogSessionsTable.id, sessionId))
      .limit(1);
    expect(restored.status).toBe("published");
  });

  it("POST /catalog/submissions/:id/unhide devuelve 403 para no-admin", async () => {
    authAs(userUser);
    const res = await request(app).post(`/api/catalog/submissions/${sessionId}/unhide`);
    expect(res.status).toBe(403);
  });

  it("PATCH mantiene el miniplayer desactivado para una sesión provisional", async () => {
    authAs(adminUser);
    await db
      .update(catalogSessionsTable)
      .set({ isPlaceholder: true, skipMiniPlayer: false })
      .where(eq(catalogSessionsTable.id, sessionId));

    const res = await request(app)
      .patch(`/api/catalog/submissions/${sessionId}`)
      .send({ skipMiniPlayer: true });
    expect(res.status).toBe(200);
    expect(res.body.skipMiniPlayer).toBe(false);

    const [stored] = await db
      .select({ skipMiniPlayer: catalogSessionsTable.skipMiniPlayer })
      .from(catalogSessionsTable)
      .where(eq(catalogSessionsTable.id, sessionId))
      .limit(1);
    expect(stored.skipMiniPlayer).toBe(false);
  });
});

// El pool de conexiones es compartido por todo el archivo; cerrarlo una sola
// vez al final evita "Cannot use a pool after calling end on the pool".
afterAll(async () => {
  await db.$client.end();
});
