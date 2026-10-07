import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import express, { type Express, type NextFunction, type Request, type Response } from "express";
import request from "supertest";

const testState = vi.hoisted(() => ({
  clerkUserId: null as string | null,
  deleteClerkUser: vi.fn(async (_userId: string) => {}),
  deleteObject: vi.fn(async (_objectPath: string) => {}),
}));

vi.mock("@clerk/express", () => ({
  getAuth: () => ({ userId: testState.clerkUserId }),
  clerkClient: {
    users: {
      getUser: vi.fn(async () => ({ primaryEmailAddress: null })),
      deleteUser: testState.deleteClerkUser,
    },
  },
  clerkMiddleware: () => (_req: Request, _res: Response, next: NextFunction) => next(),
}));

vi.mock("../lib/objectStorage", () => ({
  OBJECT_UPLOAD_URL_TTL_SEC: 900,
  ObjectStorageService: class {
    deleteObjectEntity(objectPath: string) {
      return testState.deleteObject(objectPath);
    }
  },
}));

import {
  accountDeletionsTable,
  applicationsTable,
  inspirationNotesTable,
  inspirationFavoritesTable,
  db,
  liveSessionsTable,
  pushTokensTable,
  uploadsTable,
  playbackHistoryTable,
  usersTable,
  type User,
} from "@workspace/db";
import { eq } from "drizzle-orm";
import { accountIdentityHash } from "../lib/accountDeletion";
import { sweepExpiredAccountDeletionsOnce } from "../lib/accountDeletionCleanup";
import usersRouter from "./users";

function buildApp(): Express {
  const app = express();
  app.use(express.json());
  app.use((req: Request, _res: Response, next: NextFunction) => {
    (req as { log: unknown }).log = {
      error: () => {},
      info: () => {},
      warn: () => {},
    };
    next();
  });
  app.use("/api", usersRouter);
  return app;
}

const app = buildApp();
const suffix = `${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
let sequence = 0;
let currentUser: User | null = null;
let currentLiveSessionUid: string | null = null;

async function createUser(): Promise<User> {
  sequence += 1;
  const clerkUserId = `test_account_${suffix}_${sequence}`;
  const [user] = await db
    .insert(usersTable)
    .values({
      clerkUserId,
      username: `account_${suffix}_${sequence}`,
      displayName: "Cuenta de prueba",
      email: "account-test@example.invalid",
    })
    .returning();
  currentUser = user;
  testState.clerkUserId = clerkUserId;
  return user;
}

describe("account data lifecycle", () => {
  beforeEach(async () => {
    testState.deleteClerkUser.mockReset();
    testState.deleteClerkUser.mockResolvedValue(undefined);
    testState.deleteObject.mockReset();
    testState.deleteObject.mockResolvedValue(undefined);
    await createUser();
  });

  afterEach(async () => {
    if (currentLiveSessionUid) {
      await db
        .delete(liveSessionsTable)
        .where(eq(liveSessionsTable.calEventUid, currentLiveSessionUid));
    }
    if (currentUser) {
      await db.delete(usersTable).where(eq(usersTable.id, currentUser.id));
      await db
        .delete(accountDeletionsTable)
        .where(
          eq(
            accountDeletionsTable.identityHash,
            accountIdentityHash(currentUser.clerkUserId),
          ),
        );
    }
    currentUser = null;
    currentLiveSessionUid = null;
    testState.clerkUserId = null;
  });

  afterAll(async () => {
    await db.$client.end();
  });

  it("returns the visited user's full accumulated days and optional biography, without contact data", async () => {
    const [visited] = await db.insert(usersTable).values({
      clerkUserId: `visited_${suffix}_${sequence}`,
      username: `visited_${suffix}_${sequence}`,
      displayName: "Perfil visitado",
      longDescription: "Una descripción pública extensa.",
    }).returning();
    try {
      const events = [
        // Both UTC dates belong to the same Chilean calendar day.
        { minutes: 1.5, completed: false, playedAt: new Date("2026-09-10T23:50:00Z") },
        { minutes: 1.5, completed: false, playedAt: new Date("2026-09-11T00:10:00Z") },
        { minutes: 0, completed: true, playedAt: new Date("2026-09-13T12:00:00Z") },
        { minutes: 2.9, completed: false, playedAt: new Date("2026-09-14T12:00:00Z") },
        { minutes: 5, completed: true, playedAt: new Date(Date.now() + 86400_000) },
        ...Array.from({ length: 620 }, () => ({
          minutes: 0.1, completed: false, playedAt: new Date("2026-09-15T12:00:00Z"),
        })),
      ];
      await db.insert(playbackHistoryTable).values(events.map((event, i) => ({
        userId: visited.id, clientEventId: `public-${suffix}-${i}`,
        sessionId: "public-fixture", categoryId: "calm", categoryLabel: "Calma", ...event,
      })));
      const response = await request(app).get(`/api/users/${visited.id}/public`).expect(200);
      expect(response.body.id).toBe(visited.id);
      expect(response.body.totalActiveDays).toBe(3);
      expect(response.body.longDescription).toBe("Una descripción pública extensa.");
      expect(response.body).not.toHaveProperty("email");
      expect(response.body).not.toHaveProperty("clerkUserId");
      const own = await request(app).get(`/api/users/${currentUser!.id}/public`).expect(200);
      expect(own.body.totalActiveDays).toBe(0);
      expect(own.body.longDescription).toBeNull();
      await request(app).get("/api/users/not-a-number/public").expect(400);
      await request(app).get("/api/users/2147483647/public").expect(404);
    } finally {
      await db.delete(usersTable).where(eq(usersTable.id, visited.id));
    }
  });

  it("exports the authenticated account in a portable JSON envelope", async () => {
    const inspirationId = "b6f996da-5ed1-4630-a3ba-b887311e1fc2";
    await db.insert(inspirationNotesTable).values({
      id: inspirationId, inspirationId, userId: currentUser!.id,
      revision: 1, deleted: false, text: "Mi nota privada",
    });
    await db.insert(inspirationFavoritesTable).values({
      inspirationId, userId: currentUser!.id, revision: 1, deleted: false,
    });
    await db.insert(applicationsTable).values({
      type: "resonador",
      name: "Cuenta de prueba",
      phone: "+56 000000000",
      aporte: "Sonoterapia",
      userId: currentUser!.clerkUserId,
    });
    await db.insert(pushTokensTable).values({
      userId: currentUser!.id,
      token: `ExponentPushToken[${suffix}-${sequence}]`,
      platform: "ios",
    });

    const res = await request(app).get("/api/me/export");

    expect(res.status, JSON.stringify(res.body)).toBe(200);
    expect(res.headers["cache-control"]).toBe("no-store");
    expect(res.body.formatVersion).toBe(1);
    expect(res.body.exportedAt).toEqual(expect.any(String));
    expect(res.body.data.account.clerk_user_id).toBe(currentUser!.clerkUserId);
    expect(res.body.data.activity.playbackHistory).toEqual([]);
    expect(res.body.data.social.directMessages).toEqual([]);
    expect(res.body.data.applications).toHaveLength(1);
    expect(res.body.data.applications[0].phone).toBe("+56 000000000");
    expect(res.body.data.pushTokens).toHaveLength(1);
    expect(res.body.data.pushTokens[0].platform).toBe("ios");
    expect(res.body.data.inspirationNotes).toHaveLength(1);
    expect(res.body.data.inspirationNotes[0].text).toBe("Mi nota privada");
    expect(res.body.data.inspirationFavorites).toHaveLength(1);
  });

  it("rejects account deletion without the exact confirmation", async () => {
    const res = await request(app)
      .delete("/api/me")
      .send({ confirmation: "BORRAR" });

    expect(res.status).toBe(400);
    expect(testState.deleteObject).not.toHaveBeenCalled();
    expect(testState.deleteClerkUser).not.toHaveBeenCalled();

    const [stillExists] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, currentUser!.id));
    expect(stillExists).toBeTruthy();
  });

  it("deletes owned objects, database data, and the Clerk identity", async () => {
    const objectPath = `/objects/account-test-${suffix}`;
    const inspirationId = "b6f996da-5ed1-4630-a3ba-b887311e1fc2";
    await db.insert(inspirationNotesTable).values({
      id: inspirationId, inspirationId, userId: currentUser!.id,
      revision: 2, deleted: false, text: "Eliminar junto a mi cuenta",
    });
    await db.insert(inspirationFavoritesTable).values({
      inspirationId, userId: currentUser!.id, revision: 2, deleted: true,
    });
    await db.insert(uploadsTable).values({
      userId: currentUser!.id,
      objectPath,
      name: "avatar.jpg",
      contentType: "image/jpeg",
      sizeBytes: 128,
    });

    const res = await request(app)
      .delete("/api/me")
      .send({ confirmation: "ELIMINAR" });

    expect(res.status, JSON.stringify(res.body)).toBe(200);
    expect(res.body.deleted).toBe(true);
    expect(res.body.cleanupPending).toBe(true);
    expect(testState.deleteObject).toHaveBeenCalledWith(objectPath);
    expect(testState.deleteClerkUser).toHaveBeenCalledWith(currentUser!.clerkUserId);

    const [deleted] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, currentUser!.id));
    expect(deleted).toBeUndefined();
    expect(await db.select().from(inspirationNotesTable).where(eq(inspirationNotesTable.userId, currentUser!.id))).toEqual([]);
    expect(await db.select().from(inspirationFavoritesTable).where(eq(inspirationFavoritesTable.userId, currentUser!.id))).toEqual([]);

    const [tombstone] = await db
      .select()
      .from(accountDeletionsTable)
      .where(
        eq(
          accountDeletionsTable.identityHash,
          accountIdentityHash(currentUser!.clerkUserId),
        ),
      );
    expect(tombstone.status).toBe("awaiting_storage_expiry");
    expect(tombstone.objectPaths).toContain(objectPath);
  });

  it("resumes Clerk revocation without recreating database data", async () => {
    testState.deleteClerkUser
      .mockRejectedValueOnce(new Error("temporary Clerk outage"))
      .mockRejectedValueOnce(new Error("temporary Clerk outage"))
      .mockRejectedValueOnce(new Error("temporary Clerk outage"));

    const first = await request(app)
      .delete("/api/me")
      .send({ confirmation: "ELIMINAR" });
    expect(first.status).toBe(503);

    const [deletedAfterFirstAttempt] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, currentUser!.id));
    expect(deletedAfterFirstAttempt).toBeUndefined();

    testState.deleteClerkUser.mockResolvedValue(undefined);
    const retry = await request(app)
      .delete("/api/me")
      .send({ confirmation: "ELIMINAR" });
    expect(retry.status).toBe(200);
    expect(retry.body.deleted).toBe(true);

    const recreated = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.clerkUserId, currentUser!.clerkUserId));
    expect(recreated).toEqual([]);
  });

  it("serializes concurrent deletions without losing object or booking snapshots", async () => {
    const objectPath = `/objects/concurrent-account-test-${suffix}-${sequence}`;
    currentLiveSessionUid = `cal-concurrent-${suffix}-${sequence}`;
    await db.insert(uploadsTable).values({
      userId: currentUser!.id,
      objectPath,
      name: "voice.m4a",
      contentType: "audio/mp4",
      sizeBytes: 256,
    });
    await db.insert(liveSessionsTable).values({
      clerkUserId: currentUser!.clerkUserId,
      guideId: "test-guide",
      calEventUid: currentLiveSessionUid,
      scheduledAt: new Date(Date.now() + 86_400_000),
      attendeeName: "Persona privada",
      attendeeEmail: "private@example.invalid",
      notes: "Nota privada",
    });
    testState.deleteObject.mockImplementation(
      async () => new Promise<void>((resolve) => setTimeout(resolve, 30)),
    );

    const [first, second] = await Promise.all([
      request(app).delete("/api/me").send({ confirmation: "ELIMINAR" }),
      request(app).delete("/api/me").send({ confirmation: "ELIMINAR" }),
    ]);

    expect(
      [first.status, second.status],
      JSON.stringify([first.body, second.body]),
    ).toEqual([200, 200]);
    const [tombstone] = await db
      .select()
      .from(accountDeletionsTable)
      .where(
        eq(
          accountDeletionsTable.identityHash,
          accountIdentityHash(currentUser!.clerkUserId),
        ),
      );
    expect(tombstone.objectPaths).toContain(objectPath);
    expect(tombstone.liveSessionUids).toContain(currentLiveSessionUid);

    const [booking] = await db
      .select()
      .from(liveSessionsTable)
      .where(eq(liveSessionsTable.calEventUid, currentLiveSessionUid));
    expect(booking.clerkUserId).toBeNull();
    expect(booking.attendeeName).toBeNull();
    expect(booking.attendeeEmail).toBeNull();
    expect(booking.notes).toBeNull();

    // Simulate the signed PUT URL expiring after a client delayed the upload.
    await db
      .update(accountDeletionsTable)
      .set({ storageCleanupAfter: new Date(0) })
      .where(
        eq(
          accountDeletionsTable.identityHash,
          accountIdentityHash(currentUser!.clerkUserId),
        ),
      );
    testState.deleteObject.mockClear();
    const completed = await sweepExpiredAccountDeletionsOnce({
      storage: { deleteObjectEntity: testState.deleteObject },
      log: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      },
    });
    expect(completed).toBe(1);
    expect(testState.deleteObject).toHaveBeenCalledWith(objectPath);

    const [completedTombstone] = await db
      .select()
      .from(accountDeletionsTable)
      .where(
        eq(
          accountDeletionsTable.identityHash,
          accountIdentityHash(currentUser!.clerkUserId),
        ),
      );
    expect(completedTombstone.status).toBe("completed");
  });
});