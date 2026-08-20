import { Readable } from "node:stream";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import express, {
  type Express,
  type NextFunction,
  type Request,
  type Response,
} from "express";
import request from "supertest";

const authState = vi.hoisted(() => ({
  clerkUserId: null as string | null,
  aclAllowed: false,
  aclThrows: false,
}));

vi.mock("@clerk/express", () => ({
  getAuth: () => ({ userId: authState.clerkUserId }),
  clerkClient: {
    users: {
      getUser: vi.fn(async () => ({ primaryEmailAddress: null })),
    },
  },
  clerkMiddleware: () => (_req: Request, _res: Response, next: NextFunction) =>
    next(),
}));

import {
  catalogPlaylistsTable,
  db,
  directMessagesTable,
  uploadsTable,
  usersTable,
  type User,
  type UserRole,
} from "@workspace/db";
import { eq, inArray } from "drizzle-orm";
import { ObjectStorageService } from "../lib/objectStorage";
import dmRouter from "./dm";
import storageRouter from "./storage";
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
  app.use("/api", dmRouter);
  app.use("/api", storageRouter);
  return app;
}

const app = buildApp();
const suffix = `${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
const privatePath = `/objects/uploads/private-${suffix}`;
const publicPath = `/objects/uploads/public-${suffix}`;
const messagePath = `/objects/uploads/message-${suffix}`;
let owner: User;
let other: User;
let admin: User;
let moderator: User;
let recipient: User;

async function createUser(tag: string, role: UserRole = "user"): Promise<User> {
  const [user] = await db
    .insert(usersTable)
    .values({
      clerkUserId: `storage_clerk_${tag}_${suffix}`,
      username: `storage_user_${tag}_${suffix}`,
      displayName: `Storage ${tag}`,
      role,
    })
    .returning();
  return user;
}

function authAs(user: User) {
  authState.clerkUserId = user.clerkUserId;
}

function getObject(objectPath: string) {
  return request(app).get(`/api/storage${objectPath}`);
}

describe("private object serving policy", () => {
  beforeAll(async () => {
    owner = await createUser("owner");
    other = await createUser("other");
    admin = await createUser("admin", "admin");
    moderator = await createUser("moderator", "moderador");
    recipient = await createUser("recipient");
    await db.insert(uploadsTable).values([
      {
        userId: owner.id,
        objectPath: privatePath,
        name: "private.txt",
        contentType: "text/plain",
        sizeBytes: 7,
      },
      {
        userId: owner.id,
        objectPath: messagePath,
        name: "message.txt",
        contentType: "text/plain",
        sizeBytes: 7,
      },
    ]);
    await db.insert(catalogPlaylistsTable).values({
      slug: `storage-public-${suffix}`,
      title: "Public test",
      coverUrl: publicPath,
      isActive: true,
    });
    await db.insert(directMessagesTable).values({
      senderId: owner.id,
      recipientId: other.id,
      attachmentUrl: messagePath,
      attachmentType: "image",
    });
    // Simula referencias manipuladas creadas antes de endurecer los endpoints:
    // ni un avatar ni un DM convierten una ruta ajena en un permiso.
    await db
      .update(usersTable)
      .set({ avatarUrl: privatePath })
      .where(eq(usersTable.id, other.id));
    await db.insert(directMessagesTable).values({
      senderId: other.id,
      recipientId: recipient.id,
      attachmentUrl: privatePath,
      attachmentType: "image",
    });

    vi.spyOn(
      ObjectStorageService.prototype,
      "getObjectEntityFile",
    ).mockResolvedValue({
      getMetadata: vi.fn(async () => [
        { size: "7", contentType: "text/plain" },
      ]),
      createReadStream: vi.fn(
        (range?: { start?: number; end?: number }) => {
          const content = "secured";
          const start = range?.start ?? 0;
          const end = range?.end ?? content.length - 1;
          return Readable.from([content.slice(start, end + 1)]);
        },
      ),
    } as never);
    vi.spyOn(
      ObjectStorageService.prototype,
      "canAccessObjectEntity",
    ).mockImplementation(async () => {
      if (authState.aclThrows) throw new Error("malformed ACL");
      return authState.aclAllowed;
    });
  });

  afterEach(() => {
    authState.clerkUserId = null;
    authState.aclAllowed = false;
    authState.aclThrows = false;
  });

  afterAll(async () => {
    vi.restoreAllMocks();
    await db
      .delete(catalogPlaylistsTable)
      .where(eq(catalogPlaylistsTable.slug, `storage-public-${suffix}`));
    await db
      .delete(usersTable)
      .where(
        inArray(usersTable.id, [
          owner.id,
          other.id,
          admin.id,
          moderator.id,
          recipient.id,
        ]),
      );
  });

  it("returns 401 for an anonymous private upload", async () => {
    const res = await getObject(privatePath);
    expect(res.status).toBe(401);
  });

  it("allows the upload owner", async () => {
    authAs(owner);
    const res = await getObject(privatePath);
    expect(res.status).toBe(200);
    expect(res.text).toBe("secured");
    expect(res.headers["cache-control"]).toContain("private");
  });

  it("authorizes before serving a byte range", async () => {
    authAs(owner);
    const allowed = await getObject(privatePath).set("Range", "bytes=0-2");
    expect(allowed.status).toBe(206);
    expect(allowed.text).toBe("sec");
    expect(allowed.headers["content-range"]).toBe("bytes 0-2/7");

    authAs(other);
    const denied = await getObject(privatePath).set("Range", "bytes=0-2");
    expect(denied.status).toBe(403);
    expect(denied.headers["content-range"]).toBeUndefined();
  });

  it("returns 403 for an unrelated authenticated user", async () => {
    authAs(other);
    const res = await getObject(privatePath);
    expect(res.status).toBe(403);
  });

  it("allows administrators and moderators", async () => {
    authAs(admin);
    expect((await getObject(privatePath)).status).toBe(200);
    authAs(moderator);
    expect((await getObject(privatePath)).status).toBe(200);
  });

  it("allows both participants to read a direct-message attachment", async () => {
    authAs(other);
    const res = await getObject(messagePath);
    expect(res.status).toBe(200);
    expect(res.headers["cache-control"]).toContain("private");
  });

  it("does not grant access through spoofed avatar or DM references", async () => {
    authAs(recipient);
    const res = await getObject(privatePath);
    expect(res.status).toBe(403);
  });

  it("rejects creation of spoofed avatar and DM references", async () => {
    authAs(other);
    const avatar = await request(app)
      .patch("/api/me")
      .send({ avatarUrl: privatePath });
    expect(avatar.status).toBe(403);

    const message = await request(app)
      .post(`/api/dm/with/${recipient.id}`)
      .send({ attachmentUrl: privatePath, attachmentType: "image" });
    expect(message.status).toBe(403);
  });

  it("serves active catalog references publicly", async () => {
    const res = await getObject(publicPath);
    expect(res.status).toBe(200);
    expect(res.headers["cache-control"]).toContain("public");
    expect(res.headers.vary).toContain("Authorization");
  });

  it("revokes anonymous access when catalog content becomes inactive", async () => {
    await db
      .update(catalogPlaylistsTable)
      .set({ isActive: false })
      .where(eq(catalogPlaylistsTable.slug, `storage-public-${suffix}`));
    expect((await getObject(publicPath)).status).toBe(401);
    await db
      .update(catalogPlaylistsTable)
      .set({ isActive: true })
      .where(eq(catalogPlaylistsTable.slug, `storage-public-${suffix}`));
  });

  it("honors a valid explicit public object ACL", async () => {
    authState.aclAllowed = true;
    const res = await getObject(`/objects/uploads/acl-public-${suffix}`);
    expect(res.status).toBe(200);
    expect(res.headers["cache-control"]).toContain("public");
  });

  it("fails closed when explicit ACL evaluation throws", async () => {
    authState.aclThrows = true;
    const res = await getObject(`/objects/uploads/acl-invalid-${suffix}`);
    expect(res.status).toBe(401);
  });
});