import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import express, {
  type Express,
  type NextFunction,
  type Request,
  type Response,
} from "express";
import request from "supertest";

const authState = vi.hoisted(() => ({ clerkUserId: null as string | null }));

vi.mock("@clerk/express", () => ({
  getAuth: () => ({ userId: authState.clerkUserId }),
  clerkClient: { users: { getUser: vi.fn(async () => ({ primaryEmailAddress: null })) } },
  clerkMiddleware: () => (_req: Request, _res: Response, next: NextFunction) => next(),
}));

vi.mock("../lib/push", () => ({
  sendPushToUsers: vi.fn(async () => {}),
}));

import {
  db,
  usersTable,
  catalogSessionsTable,
  catalogPlaylistsTable,
  catalogPlaylistPlacementsTable,
  userLibraryTable,
  type User,
} from "@workspace/db";
import { eq, inArray } from "drizzle-orm";
import adminRouter from "./admin";
import catalogRouter from "./catalog";
import usersRouter from "./users";

function buildApp(): Express {
  const app = express();
  app.use(express.json());
  app.use((req: Request, _res: Response, next: NextFunction) => {
    (req as { log: unknown }).log = {
      error: (...args: unknown[]) => console.error("[editorial-playlists]", ...args),
      info: (...args: unknown[]) => console.info("[editorial-playlists]", ...args),
      warn: (...args: unknown[]) => console.warn("[editorial-playlists]", ...args),
    };
    next();
  });
  app.use("/api", adminRouter);
  app.use("/api", catalogRouter);
  app.use("/api", usersRouter);
  return app;
}

const app = buildApp();
const suffix = `${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
let admin: User;
let regularUser: User;
const sessionIds = [`editorial-a-${suffix}`, `editorial-b-${suffix}`, `editorial-draft-${suffix}`];
let playlistId = 0;
const createdPlaylistIds: number[] = [];

async function createUser(tag: string, role: "admin" | "user") {
  const [user] = await db
    .insert(usersTable)
    .values({
      clerkUserId: `editorial_clerk_${tag}_${suffix}`,
      username: `editorial_user_${tag}_${suffix}`,
      displayName: `Editorial ${tag}`,
      role,
    })
    .returning();
  return user;
}

function authAs(user: User | null) {
  authState.clerkUserId = user?.clerkUserId ?? null;
}

beforeAll(async () => {
  admin = await createUser("admin", "admin");
  regularUser = await createUser("user", "user");
  await db.insert(catalogSessionsTable).values([
    {
      id: sessionIds[0],
      title: "Editorial A",
      subtitle: "A",
      categoryId: "category-a",
      categoryLabel: "Categoría A",
      duration: 60,
      durationLabel: "1 min",
      description: "A",
      status: "published",
    },
    {
      id: sessionIds[1],
      title: "Editorial B",
      subtitle: "B",
      categoryId: "category-b",
      categoryLabel: "Categoría B",
      duration: 120,
      durationLabel: "2 min",
      description: "B",
      status: "published",
    },
    {
      id: sessionIds[2],
      title: "Editorial Draft",
      subtitle: "Draft",
      categoryId: "category-c",
      categoryLabel: "Categoría C",
      duration: 180,
      durationLabel: "3 min",
      description: "Draft",
      status: "draft",
    },
  ]);
});

describe("editorial playlist contract", () => {
  it("protects playlist mutations with the admin role", async () => {
    authAs(null);
    expect(
      (await request(app).post("/api/admin/playlists").send({})).status,
    ).toBe(401);

    authAs(regularUser);
    expect(
      (
        await request(app).post("/api/admin/playlists").send({
          slug: `editorial-${suffix}`,
          title: "Nope",
          playlistType: "sessions",
        })
      ).status,
    ).toBe(403);
  });

  it("creates placements independently and accepts sessions from any category", async () => {
    authAs(admin);
    const slug = `editorial-${suffix}`;
    const response = await request(app)
      .post("/api/admin/playlists")
      .send({
        slug,
        title: "Selección editorial",
        description: "Varias categorías",
        playlistType: "sessions",
        sessionIds: [sessionIds[0], sessionIds[1]],
        placements: [
          { surface: "discover", sortOrder: 2, isActive: true },
          { surface: "sleep", sortOrder: 1, isActive: false },
        ],
      });

    if (response.status !== 201) {
      console.error(
        "[editorial-playlists] create response",
        response.status,
        response.body,
        response.text,
      );
    }
    expect(response.status).toBe(201);
    playlistId = response.body.id;
    createdPlaylistIds.push(playlistId);
    expect(response.body.sessionIds).toEqual(sessionIds.slice(0, 2));
    expect(response.body.placements).toEqual([
      { surface: "discover", sortOrder: 2, isActive: true },
      { surface: "sleep", sortOrder: 1, isActive: false },
    ]);
    const placements = await db
      .select()
      .from(catalogPlaylistPlacementsTable)
      .where(eq(catalogPlaylistPlacementsTable.playlistId, playlistId));
    expect(placements).toHaveLength(2);

    const collision = await request(app)
      .post("/api/admin/playlists")
      .send({
        slug: `editorial-collision-${suffix}`,
        title: "Colisión editorial",
        playlistType: "sessions",
        sessionIds: [sessionIds[0]],
        isActive: false,
        placements: [{ surface: "discover", sortOrder: 2, isActive: true }],
      });
    expect(collision.status).toBe(201);
    const collisionId = collision.body.id;
    createdPlaylistIds.push(collisionId);
    const discoverPlacements = await db
      .select()
      .from(catalogPlaylistPlacementsTable)
      .where(eq(catalogPlaylistPlacementsTable.surface, "discover"))
      .orderBy(catalogPlaylistPlacementsTable.sortOrder);
    expect(
      discoverPlacements
        .filter((placement) => [playlistId, collisionId].includes(placement.playlistId))
        .map((placement) => [placement.playlistId, placement.sortOrder]),
    ).toEqual([
      [collisionId, 2],
      [playlistId, 3],
    ]);

    const resequenced = await request(app)
      .patch(`/api/admin/playlists/${playlistId}`)
      .send({ placements: [{ surface: "discover", sortOrder: 1, isActive: true }] });
    expect(resequenced.status).toBe(200);
    expect(resequenced.body.placements).toEqual([
      { surface: "discover", sortOrder: 1, isActive: true },
    ]);

    const duplicate = await request(app)
      .patch(`/api/admin/playlists/${playlistId}`)
      .send({ sessionIds: [sessionIds[0], sessionIds[0]] });
    expect(duplicate.status).toBe(400);

    const unpublished = await request(app)
      .patch(`/api/admin/playlists/${playlistId}`)
      .send({ sessionIds: [sessionIds[2]] });
    expect(unpublished.status).toBe(400);

    const duplicateSurface = await request(app)
      .patch(`/api/admin/playlists/${playlistId}`)
      .send({
        placements: [
          { surface: "discover", sortOrder: 0, isActive: true },
          { surface: "discover", sortOrder: 1, isActive: true },
        ],
      });
    expect(duplicateSurface.status).toBe(400);

    const emptyDraft = await request(app)
      .post("/api/admin/playlists")
      .send({
        slug: `editorial-empty-${suffix}`,
        title: "Borrador vacío",
        playlistType: "sessions",
        isActive: false,
      });
    expect(emptyDraft.status).toBe(201);
    expect(emptyDraft.body.sessionIds).toEqual([]);
    expect(emptyDraft.body.placements).toEqual([]);
    createdPlaylistIds.push(emptyDraft.body.id);
    const publishEmptyDraft = await request(app).post(
      `/api/admin/playlists/${emptyDraft.body.id}/publish`,
    );
    expect(publishEmptyDraft.status).toBe(400);

    const deleted = await request(app).delete(
      `/api/admin/playlists/${collisionId}`,
    );
    expect(deleted.status).toBe(204);
    expect(
      await db
        .select()
        .from(catalogPlaylistPlacementsTable)
        .where(eq(catalogPlaylistPlacementsTable.playlistId, collisionId)),
    ).toHaveLength(0);
  });

  it("returns every active playlist and ordered public detail, then supports hide/publish", async () => {
    authAs(admin);
    const catalog = await request(app).get("/api/catalog");
    expect(catalog.status).toBe(200);
    const listed = catalog.body.playlists.find(
      (playlist: { id: number }) => playlist.id === playlistId,
    );
    expect(listed).toBeDefined();
    expect(listed.placements).toEqual([
      { surface: "discover", sortOrder: 1, isActive: true },
    ]);

    const detail = await request(app).get(`/api/catalog/playlists/editorial-${suffix}`);
    expect(detail.status).toBe(200);
    expect(detail.body.playlist.slug).toBe(`editorial-${suffix}`);
    expect(detail.body.sessions.map((session: { id: string }) => session.id)).toEqual(
      sessionIds.slice(0, 2),
    );

    const hidden = await request(app).post(`/api/admin/playlists/${playlistId}/hide`);
    expect(hidden.status).toBe(200);
    expect(hidden.body.isActive).toBe(false);
    expect((await request(app).get(`/api/catalog/playlists/editorial-${suffix}`)).status).toBe(
      404,
    );

    const published = await request(app).post(
      `/api/admin/playlists/${playlistId}/publish`,
    );
    expect(published.status).toBe(200);
    expect(published.body.isActive).toBe(true);
  });

  it("preserves unrelated library fields when syncing saved editorial slugs", async () => {
    authAs(regularUser);
    await db.insert(userLibraryTable).values({
      userId: regularUser.id,
      folders: [{ id: "keep-me" }],
      savedEditorialPlaylistIds: [],
    });

    const response = await request(app)
      .put("/api/me/library")
      .send({ savedEditorialPlaylistIds: [`editorial-${suffix}`] });
    expect(response.status).toBe(200);
    expect(response.body.savedEditorialPlaylistIds).toEqual([`editorial-${suffix}`]);
    expect(response.body.folders).toEqual([{ id: "keep-me" }]);

    const invalid = await request(app)
      .put("/api/me/library")
      .send({ savedEditorialPlaylistIds: [123] });
    expect(invalid.status).toBe(400);

    const get = await request(app).get("/api/me/library");
    expect(get.status).toBe(200);
    expect(get.body.savedEditorialPlaylistIds).toEqual([`editorial-${suffix}`]);
  });
});

afterAll(async () => {
  await db
    .delete(userLibraryTable)
    .where(eq(userLibraryTable.userId, regularUser.id));
  if (createdPlaylistIds.length > 0) {
    await db
      .delete(catalogPlaylistsTable)
      .where(inArray(catalogPlaylistsTable.id, createdPlaylistIds));
  }
  await db
    .delete(catalogSessionsTable)
    .where(inArray(catalogSessionsTable.id, sessionIds));
  await db
    .delete(usersTable)
    .where(inArray(usersTable.id, [admin.id, regularUser.id]));
  await db.$client.end();
});