import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import express, { type Request, type Response, type NextFunction } from "express";
import request from "supertest";
import { eq, inArray } from "drizzle-orm";
import { db, usersTable, reflectionStoriesTable, sharedMixesTable, type User } from "@workspace/db";

const auth = vi.hoisted(() => ({ user: null as User | null, avatarAllowed: true }));
vi.mock("../middlewares/requireAuth", () => ({
  requireAuth: (req: Request, res: Response, next: NextFunction) => {
    if (!auth.user) { res.status(401).json({ error: "No autenticado" }); return; }
    req.currentUser = auth.user; next();
  },
}));
vi.mock("@clerk/express", () => ({
  getAuth: () => ({ userId: auth.user?.clerkUserId }), clerkClient: {},
}));
vi.mock("../lib/objectAccess", () => ({
  canUserReferenceObject: async () => auth.avatarAllowed,
  validateOwnedCompletedImageUpload: async () => auth.avatarAllowed ? { ok: true } : { ok: false, reason: "ownership" },
}));
vi.mock("../lib/push", () => ({ sendPushToUsers: vi.fn(async () => {}) }));
import storiesRouter from "./reflection-stories";
import mixesRouter from "./mixes";

const app = express();
app.use(express.json(), (req, _res, next) => { req.log = { error: vi.fn() } as unknown as Request["log"]; next(); });
app.use("/api", storiesRouter, mixesRouter);
let owner: User, visitor: User;
const userIds: number[] = [];
const snapshot = {
  message: "Una reflexión pública solo si la autorizo", category: "calm", backgroundPresetKey: "moon-valley",
  backgroundScale: 1, backgroundX: 0, backgroundY: 0, textX: 0, textY: 0,
};
async function createStory(extra = {}) {
  const [story] = await db.insert(reflectionStoriesTable).values({
    ...snapshot, userId: owner.id, idempotencyKey: `${Date.now()}-${Math.random()}`, ...extra,
  }).returning();
  return story;
}
beforeAll(async () => {
  const stamp = `${Date.now()}-${Math.random()}`;
  for (const tag of ["owner", "visitor"]) {
    const [user] = await db.insert(usersTable).values({
      clerkUserId: `test_profile_content_${tag}_${stamp}`, username: `test_profile_content_${tag}_${stamp}`,
      displayName: `Profile content ${tag}`,
    }).returning();
    userIds.push(user.id);
    if (tag === "owner") owner = user; else visitor = user;
  }
});
beforeEach(() => { auth.user = owner; auth.avatarAllowed = true; });
afterEach(async () => {
  await db.delete(reflectionStoriesTable).where(inArray(reflectionStoriesTable.userId, userIds));
  await db.delete(sharedMixesTable).where(inArray(sharedMixesTable.authorId, userIds));
});
afterAll(async () => { if (userIds.length) await db.delete(usersTable).where(inArray(usersTable.id, userIds)); });

describe("public profile content privacy", () => {
  it("shares the actual uploaded photo and updates an existing shared mix without duplicating it", async () => {
    const body = { name: "Foto elegida", category: "dormir",
      image: "/objects/uploads/my-original-cover", sounds: [{ id: "rain", volume: 0.5 }, { id: "wind", volume: 0.7 }] };
    const first = await request(app).post("/api/mixes").send(body).expect(201);
    expect(first.body.image).toBe(body.image);
    const image = "/objects/uploads/my-updated-cover";
    const updated = await request(app).post("/api/mixes").send({ ...body, image }).expect(200);
    expect(updated.body).toMatchObject({ id: first.body.id, image });
    await request(app).post("/api/mixes").send({ ...body, image }).expect(409);
    expect(await db.select().from(sharedMixesTable).where(eq(sharedMixesTable.authorId, owner.id))).toHaveLength(1);
  });
  it("does not publish another person's upload or a device-only photo URI", async () => {
    const body = { name: "Portada privada", category: "dormir",
      sounds: [{ id: "rain", volume: 0.5 }, { id: "wind", volume: 0.7 }] };
    auth.avatarAllowed = false;
    await request(app).post("/api/mixes").send({ ...body, image: "/objects/uploads/somebody-elses-photo" }).expect(400);
    for (const image of ["file:///photo.jpg", "blob:local-photo", "data:image/png;base64,abc", "https://example.com/private.jpg"]) {
      await request(app).post("/api/mixes").send({ ...body, image }).expect(400);
    }
    expect(await db.select().from(sharedMixesTable).where(eq(sharedMixesTable.authorId, owner.id))).toHaveLength(0);
  });
  it("keeps new and historical snapshots private until the author opts in", async () => {
    const story = await createStory();
    expect(story.isPublic).toBe(false);
    auth.user = visitor;
    const page = await request(app).get(`/api/users/${owner.id}/reflection-stories`).expect(200);
    expect(page.body.items).toEqual([]);
    await request(app).get(`/api/users/${owner.id}/reflection-stories/${story.id}`).expect(404);
    await request(app).patch(`/api/me/reflection-stories/${story.id}/visibility`).send({ isPublic: true }).expect(404);
    expect((await db.select().from(reflectionStoriesTable).where(eq(reflectionStoriesTable.id, story.id)))[0].isPublic).toBe(false);
  });
  it("publishes the exact snapshot and revokes both list and direct access when hidden", async () => {
    const story = await createStory();
    await request(app).patch(`/api/me/reflection-stories/${story.id}/visibility`).send({ isPublic: true }).expect(200);
    auth.user = visitor;
    const page = await request(app).get(`/api/users/${owner.id}/reflection-stories`).expect(200);
    expect(page.body.items).toHaveLength(1);
    expect(page.body.items[0]).toMatchObject({ ...snapshot, id: story.id, isPublic: true });
    expect(page.body.items[0]).not.toHaveProperty("idempotencyKey");
    await request(app).get(`/api/users/${visitor.id}/reflection-stories/${story.id}`).expect(404);
    await request(app).get(`/api/users/${owner.id}/reflection-stories/${story.id}`).expect(200);
    auth.user = owner;
    await request(app).patch(`/api/me/reflection-stories/${story.id}/visibility`).send({ isPublic: false }).expect(200);
    auth.user = visitor;
    expect((await request(app).get(`/api/users/${owner.id}/reflection-stories`)).body.items).toEqual([]);
    await request(app).get(`/api/users/${owner.id}/reflection-stories/${story.id}`).expect(404);
  });
  it("paginates only public snapshots and removal stops their public visibility", async () => {
    await createStory();
    const first = await createStory({ isPublic: true });
    const last = await createStory({ isPublic: true });
    auth.user = visitor;
    const page = await request(app).get(`/api/users/${owner.id}/reflection-stories?limit=1`).expect(200);
    expect(page.body.items.map((s: { id: number }) => s.id)).toEqual([last.id]);
    const second = await request(app).get(`/api/users/${owner.id}/reflection-stories`)
      .query({ limit: 1, cursor: page.body.nextCursor }).expect(200);
    expect(second.body.items.map((s: { id: number }) => s.id)).toEqual([first.id]);
    expect(second.body.nextCursor).toBeNull();
    auth.user = owner;
    await request(app).delete(`/api/me/reflection-stories/${last.id}`).expect(204);
    await request(app).get(`/api/users/${owner.id}/reflection-stories/${last.id}`).expect(404);
  });
  it("rejects unauthorized images, invalid changes and unauthenticated access", async () => {
    const story = await createStory({ avatarImagePath: "/objects/uploads/private-test-avatar" });
    auth.avatarAllowed = false;
    await request(app).patch(`/api/me/reflection-stories/${story.id}/visibility`).send({ isPublic: true }).expect(409);
    await request(app).patch(`/api/me/reflection-stories/${story.id}/visibility`).send({ isPublic: "true" }).expect(400);
    await request(app).get(`/api/users/${owner.id}/reflection-stories?cursor=invalid`).expect(400);
    auth.user = null;
    await request(app).get(`/api/users/${owner.id}/reflection-stories`).expect(401);
    await request(app).patch(`/api/me/reflection-stories/${story.id}/visibility`).send({ isPublic: true }).expect(401);
  });
  it("opens any visible shared mix by ID without relying on its feed page, and never opens hidden mixes", async () => {
    const [mix] = await db.insert(sharedMixesTable).values({
      authorId: owner.id, name: "Mi portada elegida", image: "cover-forest",
      category: "dormir", sounds: [{ id: "rain", volume: 0.5 }, { id: "wind", volume: 0.7 }],
    }).returning();
    auth.user = visitor;
    const detail = await request(app).get(`/api/mixes/${mix.id}`).expect(200);
    expect(detail.body).toMatchObject({ id: mix.id, name: mix.name, image: mix.image, isMine: false, author: { id: owner.id } });
    await db.update(sharedMixesTable).set({ hidden: true }).where(eq(sharedMixesTable.id, mix.id));
    await request(app).get(`/api/mixes/${mix.id}`).expect(404);
  });
});
