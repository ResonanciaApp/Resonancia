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
  catalogPlaylistCarouselsTable,
  catalogPlaylistCarouselMembershipsTable,
  userLibraryTable,
  type User,
} from "@workspace/db";
import { eq, inArray } from "drizzle-orm";
import { sql } from "drizzle-orm";
import adminRouter from "./admin";
import catalogRouter from "./catalog";
import usersRouter from "./users";
import { resolveObjectReadAccess } from "../lib/objectAccess";

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
const createdCarouselIds: number[] = [];

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
  // Keep the integration fixture usable against development databases that
  // predate migration 0004. Production schema/data is never changed here.
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE editorial_playlist_type AS ENUM ('meditative', 'relaxation', 'ritual');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
  `);
  await db.execute(sql`
    ALTER TYPE editorial_playlist_type ADD VALUE IF NOT EXISTS 'none';
  `);
  await db.execute(sql`
    ALTER TABLE catalog_playlists
      ADD COLUMN IF NOT EXISTS editorial_type editorial_playlist_type
      NOT NULL DEFAULT 'meditative';
  `);
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
  it("serves active playlist covers in object and legacy serving formats without exposing drafts", async () => {
    const objectPath = `/objects/uploads/editorial-cover-${suffix}`;
    const slug = `editorial-cover-${suffix}`;
    const [playlist] = await db.insert(catalogPlaylistsTable).values({
      slug,
      title: "Portada de prueba",
      isActive: true,
      coverUrl: objectPath,
      sessionIds: [],
    }).returning();
    try {
      for (const coverUrl of [objectPath, `/api/storage${objectPath}`, `/api/storage/${objectPath}`]) {
        await db.update(catalogPlaylistsTable).set({ coverUrl }).where(eq(catalogPlaylistsTable.id, playlist.id));
        expect(await resolveObjectReadAccess({ objectPath })).toBe("public");
      }
      await db.update(catalogPlaylistsTable).set({ isActive: false }).where(eq(catalogPlaylistsTable.id, playlist.id));
      expect(await resolveObjectReadAccess({ objectPath })).toBe("denied");
      expect(await resolveObjectReadAccess({ objectPath: `${objectPath}-other` })).toBe("denied");
    } finally {
      await db.delete(catalogPlaylistsTable).where(eq(catalogPlaylistsTable.id, playlist.id));
    }
  });
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
          editorialType: "meditative",
        })
      ).status,
    ).toBe(403);

    authAs(admin);
    const missingType = await request(app)
      .post("/api/admin/playlists")
      .send({
        slug: `editorial-missing-type-${suffix}`,
        title: "Sin tipo",
        playlistType: "sessions",
        durationLabel: "1 min",
        sessionIds: [sessionIds[0]],
      });
    expect(missingType.status).toBe(400);

    const invalidType = await request(app)
      .post("/api/admin/playlists")
      .send({
        slug: `editorial-invalid-type-${suffix}`,
        title: "Tipo inválido",
        playlistType: "sessions",
        editorialType: "selection",
        durationLabel: "1 min",
        sessionIds: [sessionIds[0]],
      });
    expect(invalidType.status).toBe(400);
  });

  it("allows metadata edits without revalidating unchanged legacy sessions", async () => {
    authAs(admin);
    const [legacyPlaylist] = await db
      .insert(catalogPlaylistsTable)
      .values({
        slug: `editorial-legacy-${suffix}`,
        title: "Playlist legado",
        playlistType: "sessions",
        editorialType: "meditative",
        durationLabel: "31 min",
        sessionIds: ["legacy-session-no-disponible"],
        isActive: true,
      })
      .returning();
    createdPlaylistIds.push(legacyPlaylist.id);

    const response = await request(app)
      .patch(`/api/admin/playlists/${legacyPlaylist.id}`)
      .send({
        slug: legacyPlaylist.slug,
        title: legacyPlaylist.title,
        description: legacyPlaylist.description,
        coverUrl: legacyPlaylist.coverUrl,
        durationLabel: legacyPlaylist.durationLabel,
        savedCount: legacyPlaylist.savedCount,
        sessionIds: legacyPlaylist.sessionIds,
        playlistType: legacyPlaylist.playlistType,
        editorialType: "none",
        isActive: legacyPlaylist.isActive,
      });

    expect(response.status).toBe(200);
    expect(response.body.editorialType).toBe("none");
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
        editorialType: "none",
        durationLabel: "25 min",
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
    expect(response.body.editorialType).toBe("none");
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
        editorialType: "meditative",
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
      .send({ editorialType: "ritual", placements: [{ surface: "discover", sortOrder: 1, isActive: true }] });
    expect(resequenced.status).toBe(200);
    expect(resequenced.body.placements).toEqual([
      { surface: "discover", sortOrder: 1, isActive: true },
    ]);
    expect(resequenced.body.editorialType).toBe("ritual");

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
        editorialType: "meditative",
        isActive: false,
      });
    expect(emptyDraft.status).toBe(201);
    expect(emptyDraft.body.sessionIds).toEqual([]);
    expect(emptyDraft.body.editorialType).toBe("meditative");
    expect(emptyDraft.body.placements).toEqual([]);
    createdPlaylistIds.push(emptyDraft.body.id);
    const publishEmptyDraft = await request(app).post(
      `/api/admin/playlists/${emptyDraft.body.id}/publish`,
    );
    expect(publishEmptyDraft.status).toBe(400);

    const blankDurationDraft = await request(app)
      .post("/api/admin/playlists")
      .send({
        slug: `editorial-blank-duration-${suffix}`,
        title: "Borrador sin duración",
        playlistType: "sessions",
        editorialType: "meditative",
        sessionIds: [sessionIds[0]],
        isActive: false,
        durationLabel: "",
      });
    expect(blankDurationDraft.status).toBe(201);
    createdPlaylistIds.push(blankDurationDraft.body.id);
    const publishBlankDuration = await request(app).post(
      `/api/admin/playlists/${blankDurationDraft.body.id}/publish`,
    );
    expect(publishBlankDuration.status).toBe(400);
    expect(publishBlankDuration.body.code).toBe("INVALID_PLAYLIST_DURATION");

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

  it("requires a meaningful duration for active playlists", async () => {
    authAs(admin);
    const create = await request(app)
      .post("/api/admin/playlists")
      .send({
        slug: `editorial-no-duration-${suffix}`,
        title: "Sin duración",
        playlistType: "sessions",
        editorialType: "meditative",
        sessionIds: [sessionIds[0]],
        durationLabel: "   ",
      });
    expect(create.status).toBe(400);
    expect(create.body.code ?? create.body.error).toBeTruthy();

    const edit = await request(app)
      .patch(`/api/admin/playlists/${playlistId}`)
      .send({ durationLabel: " " });
    expect(edit.status).toBe(400);
    expect(edit.body.code ?? edit.body.error).toBeTruthy();
  });

  it("returns every active playlist and ordered public detail, then supports hide/publish", async () => {
    authAs(admin);
    const catalog = await request(app).get("/api/catalog");
    expect(catalog.status).toBe(200);
    const homeRows = (await db
      .select()
      .from(catalogPlaylistsTable)
      .where(eq(catalogPlaylistsTable.isActive, true)))
      .filter((playlist) => playlist.showOnHome)
      .sort(
        (a, b) =>
          (a.homePosition ?? Number.MAX_SAFE_INTEGER) -
            (b.homePosition ?? Number.MAX_SAFE_INTEGER) ||
          a.id - b.id,
      )
      .slice(0, 4);
    expect(catalog.body.homePlaylists.map((playlist: { slug: string }) => playlist.slug)).toEqual(
      homeRows.map((playlist) => playlist.slug),
    );
    const listed = catalog.body.playlists.find(
      (playlist: { id: number }) => playlist.id === playlistId,
    );
    expect(listed).toBeDefined();
    expect(listed.editorialType).toBe("ritual");
    expect(listed.placements).toEqual([
      { surface: "discover", sortOrder: 1, isActive: true },
    ]);

    const detail = await request(app).get(`/api/catalog/playlists/editorial-${suffix}`);
    expect(detail.status).toBe(200);
    expect(detail.body.playlist.slug).toBe(`editorial-${suffix}`);
    expect(detail.body.playlist.editorialType).toBe("ritual");
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

  it("CRUDs independent same-surface carousels and never lets legacy writes drive them", async () => {
    authAs(null);
    expect((await request(app).get("/api/admin/playlist-carousels")).status).toBe(401);
    authAs(regularUser);
    expect((await request(app).get("/api/admin/playlist-carousels")).status).toBe(403);
    authAs(admin);

    const slug = `editorial-${suffix}`;
    const first = await request(app)
      .post("/api/admin/playlist-carousels")
      .send({
        title: "Selección compartida A",
        surface: "discover",
        sortOrder: 1,
        isActive: true,
        playlistIds: [slug],
      });
    expect(first.status).toBe(201);
    expect(first.body.title).toBe("Selección compartida A");
    expect(first.body.playlistIds).toEqual([slug]);
    createdCarouselIds.push(first.body.id);

    const second = await request(app)
      .post("/api/admin/playlist-carousels")
      .send({
        title: "Selección compartida B",
        surface: "discover",
        sortOrder: 0,
        isActive: true,
        playlistIds: [slug],
      });
    expect(second.status).toBe(201);
    createdCarouselIds.push(second.body.id);
    expect(second.body.playlistIds).toEqual([slug]);

    let adminRows = await request(app).get("/api/admin/playlist-carousels");
    expect(adminRows.status).toBe(200);
    const ownRows = adminRows.body.filter((row: { id: number }) =>
      createdCarouselIds.includes(row.id),
    );
    expect(ownRows.map((row: { title: string }) => row.title)).toEqual([
      "Selección compartida B",
      "Selección compartida A",
    ]);
    expect(ownRows.map((row: { sortOrder: number }) => row.sortOrder)).toEqual([
      expect.any(Number),
      expect.any(Number),
    ]);

    const renamed = await request(app)
      .patch(`/api/admin/playlist-carousels/${first.body.id}`)
      .send({ title: "Selección renombrada", sortOrder: 0 });
    expect(renamed.status).toBe(200);
    expect(renamed.body.title).toBe("Selección renombrada");
    expect(renamed.body.playlistIds).toEqual([slug]);

    const hidden = await request(app)
      .patch(`/api/admin/playlist-carousels/${second.body.id}`)
      .send({ isActive: false });
    expect(hidden.status).toBe(200);
    expect(hidden.body.isActive).toBe(false);
    adminRows = await request(app).get("/api/admin/playlist-carousels");
    expect(
      adminRows.body.find((row: { id: number }) => row.id === second.body.id).isActive,
    ).toBe(false);

    const publicBeforeEmpty = await request(app).get("/api/catalog");
    expect(publicBeforeEmpty.status).toBe(200);
    expect(
      publicBeforeEmpty.body.playlistCarousels.some(
        (row: { id: number }) => row.id === first.body.id,
      ),
    ).toBe(true);
    expect(
      publicBeforeEmpty.body.playlistCarousels.some(
        (row: { id: number }) => row.id === second.body.id,
      ),
    ).toBe(false);

    const emptied = await request(app)
      .patch(`/api/admin/playlist-carousels/${first.body.id}`)
      .send({ playlistIds: [] });
    expect(emptied.status).toBe(200);
    expect(emptied.body.playlistIds).toEqual([]);
    const publicEmpty = await request(app).get("/api/catalog");
    expect(
      publicEmpty.body.playlistCarousels.some(
        (row: { id: number }) => row.id === first.body.id,
      ),
    ).toBe(false);

    const restored = await request(app)
      .patch(`/api/admin/playlist-carousels/${first.body.id}`)
      .send({ playlistIds: [slug], isActive: true });
    expect(restored.status).toBe(200);

    const hiddenPlaylist = await request(app).post(
      `/api/admin/playlists/${playlistId}/hide`,
    );
    expect(hiddenPlaylist.status).toBe(200);
    const publicWithoutPlaylist = await request(app).get("/api/catalog");
    expect(
      publicWithoutPlaylist.body.playlistCarousels.some(
        (row: { id: number }) => row.id === first.body.id,
      ),
    ).toBe(false);
    const republishedPlaylist = await request(app).post(
      `/api/admin/playlists/${playlistId}/publish`,
    );
    expect(republishedPlaylist.status).toBe(200);

    // Legacy per-playlist placement writes remain a compatibility surface and
    // must not alter either independently managed carousel.
    const beforeLegacyWrite = await request(app).get("/api/catalog");
    await request(app)
      .patch(`/api/admin/playlists/${playlistId}`)
      .send({ placements: [{ surface: "sleep", sortOrder: 0, isActive: true }] });
    const afterLegacyWrite = await request(app).get("/api/catalog");
    expect(
      afterLegacyWrite.body.playlistCarousels.filter(
        (row: { id: number }) => createdCarouselIds.includes(row.id),
      ),
    ).toEqual(
      beforeLegacyWrite.body.playlistCarousels.filter(
        (row: { id: number }) => createdCarouselIds.includes(row.id),
      ),
    );

    const deleted = await request(app).delete(
      `/api/admin/playlist-carousels/${second.body.id}`,
    );
    expect(deleted.status).toBe(204);
    expect(
      await db
        .select()
        .from(catalogPlaylistCarouselMembershipsTable)
        .where(eq(catalogPlaylistCarouselMembershipsTable.carouselId, second.body.id)),
    ).toHaveLength(0);
    expect(
      await db
        .select({ id: catalogPlaylistsTable.id })
        .from(catalogPlaylistsTable)
        .where(eq(catalogPlaylistsTable.id, playlistId)),
    ).toHaveLength(1);
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
  if (createdCarouselIds.length > 0) {
    await db
      .delete(catalogPlaylistCarouselsTable)
      .where(inArray(catalogPlaylistCarouselsTable.id, createdCarouselIds));
  }
  await db
    .delete(catalogSessionsTable)
    .where(inArray(catalogSessionsTable.id, sessionIds));
  await db
    .delete(usersTable)
    .where(inArray(usersTable.id, [admin.id, regularUser.id]));
  await db.$client.end();
});