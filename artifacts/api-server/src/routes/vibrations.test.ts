import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import express, { type Request, type Response, type NextFunction } from "express";
import request from "supertest";
import { eq, inArray } from "drizzle-orm";
import { db, friendshipsTable, notificationsTable, usersTable, type User } from "@workspace/db";
import { GetNotificationsResponse } from "@workspace/api-zod";

const auth = vi.hoisted(() => ({ user: null as User | null }));
vi.mock("../middlewares/requireAuth", () => ({
  requireAuth: (req: Request, res: Response, next: NextFunction) => {
    if (!auth.user) {
      res.status(401).json({ error: "No autenticado" });
      return;
    }
    req.currentUser = auth.user;
    next();
  },
}));
vi.mock("../lib/push", () => ({ sendPushToUsers: vi.fn(async () => {}) }));

import vibrationsRouter from "./vibrations";
import notificationsRouter from "./notifications";
import usersRouter from "./users";
import { sendPushToUsers } from "../lib/push";

const app = express();
app.use(express.json());
app.use((req, _res, next) => {
  req.log = { error: vi.fn() } as unknown as Request["log"];
  next();
});
app.use("/api", vibrationsRouter, notificationsRouter, usersRouter);

let sender: User;
let recipient: User;
const ids: number[] = [];

beforeAll(async () => {
  // Ephemeral development fixtures only; cascade cleanup removes all test notices.
  const suffix = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  for (const tag of ["sender", "recipient"]) {
    const [user] = await db.insert(usersTable).values({
      clerkUserId: `test_vibration_${tag}_${suffix}`,
      username: `test_vibration_${tag}_${suffix}`,
      displayName: `Vibration test ${tag}`,
    }).returning();
    ids.push(user.id);
    if (tag === "sender") sender = user;
    else recipient = user;
  }
});
beforeEach(() => {
  auth.user = sender;
  vi.mocked(sendPushToUsers).mockClear();
});
afterEach(async () => {
  vi.restoreAllMocks();
  await db.delete(notificationsTable).where(inArray(notificationsTable.userId, ids));
});
afterAll(async () => {
  if (ids.length) await db.delete(usersTable).where(inArray(usersTable.id, ids));
});

describe("vibration notifications", () => {
  it("persists the authenticated sender's notice in the recipient inbox and routes the push", async () => {
    const result = await request(app).post(`/api/users/${recipient.id}/vibrations`)
      .send({ actorUserId: recipient.id });
    expect(result.status).toBe(201);
    expect(result.body).toEqual({ sent: true });
    const rows = await db.select().from(notificationsTable).where(eq(notificationsTable.userId, recipient.id));
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      type: "vibration", actorUserId: sender.id, userId: recipient.id,
      message: "te envió una vibración", readAt: null,
    });
    expect(sendPushToUsers).toHaveBeenCalledWith([recipient.id], {
      title: "Nueva vibración",
      body: `${sender.displayName} te envió una vibración`,
      data: { kind: "vibration", fromUserId: sender.id },
    });
    // The sender cannot see the recipient's inbox entry.
    expect((await request(app).get("/api/notifications")).body).toEqual([]);
    auth.user = recipient;
    // Existing bell count is editorial-only; do not change its scope for this feature.
    expect((await request(app).get("/api/notifications/unread-count")).body).toEqual({ count: 0 });
    const inbox = await request(app).get("/api/notifications");
    expect(inbox.status).toBe(200);
    expect(GetNotificationsResponse.safeParse(inbox.body).success).toBe(true);
    expect(inbox.body[0]).toMatchObject({ type: "vibration", actor: { id: sender.id } });
    expect((await request(app).post("/api/notifications/read-all")).status).toBe(204);
    expect((await request(app).get("/api/notifications/unread-count")).body).toEqual({ count: 0 });
  });

  it("rejects unauthenticated, invalid, self and missing recipients without push or inbox writes", async () => {
    auth.user = null;
    expect((await request(app).post(`/api/users/${recipient.id}/vibrations`)).status).toBe(401);
    auth.user = sender;
    for (const id of ["abc", "0", "-1", "1.2", String(sender.id)]) {
      expect((await request(app).post(`/api/users/${id}/vibrations`)).status).toBe(400);
    }
    expect((await request(app).post("/api/users/2147483647/vibrations")).status).toBe(404);
    expect(await db.select().from(notificationsTable).where(inArray(notificationsTable.userId, ids))).toEqual([]);
    expect(sendPushToUsers).not.toHaveBeenCalled();
  });

  it("reports a failed inbox write instead of confirming or sending a push", async () => {
    vi.spyOn(db, "insert").mockImplementationOnce(() => { throw new Error("test write failure"); });
    const result = await request(app).post(`/api/users/${recipient.id}/vibrations`);
    expect(result.status).toBe(500);
    expect(result.body).toEqual({ error: "No se pudo enviar la vibración" });
    expect(sendPushToUsers).not.toHaveBeenCalled();
  });

  it("public profiles preserve pending and accepted friendship state when reopened", async () => {
    const getProfile = () => request(app).get(`/api/users/${recipient.id}/public`);
    expect((await getProfile()).body.friendshipStatus).toBe("none");
    const [edge] = await db.insert(friendshipsTable).values({
      requesterId: sender.id, addresseeId: recipient.id, status: "pending",
    }).returning();
    expect((await getProfile()).body.friendshipStatus).toBe("pending_outgoing");
    auth.user = recipient;
    expect((await request(app).get(`/api/users/${sender.id}/public`)).body.friendshipStatus)
      .toBe("pending_incoming");
    expect((await getProfile()).body.friendshipStatus).toBe("self");
    await db.update(friendshipsTable).set({ status: "accepted" }).where(eq(friendshipsTable.id, edge.id));
    auth.user = sender;
    expect((await getProfile()).body.friendshipStatus).toBe("accepted");
  });
});
