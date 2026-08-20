import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
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
  sharedMixesTable,
  sharedMixCommentsTable,
  type User,
  type SharedMix,
} from "@workspace/db";
import { eq, inArray } from "drizzle-orm";
import mixesRouter from "./mixes";

function buildApp(): Express {
  const app = express();
  app.use(express.json());
  // El router usa `req.log` en los catch; proveemos un stub silencioso.
  app.use((req: Request, _res: Response, next: NextFunction) => {
    (req as { log: unknown }).log = {
      error: () => {},
      info: () => {},
      warn: () => {},
    };
    next();
  });
  app.use("/api", mixesRouter);
  return app;
}

const app = buildApp();
const suffix = `${Date.now()}_${Math.floor(Math.random() * 1e6)}`;

async function createUser(tag: string): Promise<User> {
  const [user] = await db
    .insert(usersTable)
    .values({
      clerkUserId: `test_clerk_${tag}_${suffix}`,
      username: `test_user_${tag}_${suffix}`,
      displayName: `Test ${tag}`,
    })
    .returning();
  return user;
}

async function createMix(authorId: number, name: string): Promise<SharedMix> {
  const [mix] = await db
    .insert(sharedMixesTable)
    .values({
      authorId,
      name,
      category: "dormir",
      sounds: [{ id: "lluvia", volume: 0.5 }],
    })
    .returning();
  return mix;
}

async function createComment(mixId: number, authorId: number, body: string) {
  const [comment] = await db
    .insert(sharedMixCommentsTable)
    .values({ mixId, authorId, body })
    .returning();
  return comment;
}

function authAs(user: User) {
  authState.clerkUserId = user.clerkUserId;
}

describe("DELETE /mixes/:id/comments/:commentId", () => {
  let userA: User;
  let userB: User;
  let mix1: SharedMix;
  let mix2: SharedMix;
  let ownComment: Awaited<ReturnType<typeof createComment>>;
  let othersComment: Awaited<ReturnType<typeof createComment>>;

  beforeAll(async () => {
    userA = await createUser("a");
    userB = await createUser("b");
    mix1 = await createMix(userA.id, "Mezcla 1");
    mix2 = await createMix(userA.id, "Mezcla 2");
  });

  afterAll(async () => {
    // Borrar los usuarios cascadea mezclas y comentarios.
    await db
      .delete(usersTable)
      .where(inArray(usersTable.id, [userA.id, userB.id]));
    await db.$client.end();
  });

  beforeEach(async () => {
    // Comentarios frescos por test → orden independiente.
    ownComment = await createComment(mix1.id, userA.id, "comentario propio");
    othersComment = await createComment(mix1.id, userB.id, "comentario de otro");
  });

  afterEach(async () => {
    await db
      .delete(sharedMixCommentsTable)
      .where(inArray(sharedMixCommentsTable.id, [ownComment.id, othersComment.id]));
    authState.clerkUserId = null;
  });

  it("devuelve 404 al borrar un comentario propio bajo la mezcla equivocada", async () => {
    authAs(userA);
    const res = await request(app).delete(
      `/api/mixes/${mix2.id}/comments/${ownComment.id}`,
    );
    expect(res.status).toBe(404);

    // El comentario sigue existiendo (no se borró bajo la mezcla incorrecta).
    const [still] = await db
      .select()
      .from(sharedMixCommentsTable)
      .where(eq(sharedMixCommentsTable.id, ownComment.id))
      .limit(1);
    expect(still).toBeTruthy();
  });

  it("devuelve 204 al borrar un comentario propio bajo la mezcla correcta", async () => {
    authAs(userA);
    const res = await request(app).delete(
      `/api/mixes/${mix1.id}/comments/${ownComment.id}`,
    );
    expect(res.status).toBe(204);

    // El comentario fue eliminado.
    const [gone] = await db
      .select()
      .from(sharedMixCommentsTable)
      .where(eq(sharedMixCommentsTable.id, ownComment.id))
      .limit(1);
    expect(gone).toBeUndefined();
  });

  it("devuelve 403 al borrar el comentario de otro usuario", async () => {
    authAs(userA);
    const res = await request(app).delete(
      `/api/mixes/${mix1.id}/comments/${othersComment.id}`,
    );
    expect(res.status).toBe(403);

    // El comentario del otro usuario sigue existiendo.
    const [still] = await db
      .select()
      .from(sharedMixCommentsTable)
      .where(eq(sharedMixCommentsTable.id, othersComment.id))
      .limit(1);
    expect(still).toBeTruthy();
  });
});
