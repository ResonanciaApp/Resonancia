import { Router, type IRouter } from "express";
import { and, eq, sql } from "drizzle-orm";
import { db, usersTable, followsTable, notificationsTable } from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth";
import { sendPushToUsers } from "../lib/push";

const router: IRouter = Router();

function toProfile(u: { id: number; username: string; displayName: string; avatarUrl: string | null }) {
  return {
    id: u.id,
    username: u.username,
    displayName: u.displayName,
    avatarUrl: u.avatarUrl,
  };
}

/** GET /me/follow-counts — mis contadores de seguidores/siguiendo */
router.get("/me/follow-counts", requireAuth, async (req, res) => {
  const me = req.currentUser!;
  try {
    const [followers] = await db
      .select({ count: sql<number>`count(*)` })
      .from(followsTable)
      .where(eq(followsTable.followingId, me.id));

    const [following] = await db
      .select({ count: sql<number>`count(*)` })
      .from(followsTable)
      .where(eq(followsTable.followerId, me.id));

    res.json({
      followersCount: Number(followers?.count ?? 0),
      followingCount: Number(following?.count ?? 0),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Error al obtener contadores" });
  }
});

/** POST /users/:userId/follow — seguir a un usuario */
router.post("/users/:userId/follow", requireAuth, async (req, res) => {
  const userId = Number(req.params.userId);
  if (!Number.isInteger(userId) || userId <= 0) {
    res.status(400).json({ error: "ID inválido" });
    return;
  }
  const me = req.currentUser!;
  if (userId === me.id) {
    res.status(400).json({ error: "No puedes seguirte a ti mismo" });
    return;
  }
  try {
    const [target] = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);
    if (!target) {
      res.status(404).json({ error: "Usuario no encontrado" });
      return;
    }

    const [alreadyFollowing] = await db
      .select({ id: followsTable.followerId })
      .from(followsTable)
      .where(and(eq(followsTable.followerId, me.id), eq(followsTable.followingId, userId)))
      .limit(1);

    await db
      .insert(followsTable)
      .values({ followerId: me.id, followingId: userId })
      .onConflictDoNothing();

    if (!alreadyFollowing) {
      void db
        .insert(notificationsTable)
        .values({ userId, actorUserId: me.id, type: "new_follower" })
        .catch(() => {});
      void sendPushToUsers([userId], {
        title: "Nuevo seguidor",
        body: `${me.displayName || me.username || "Alguien"} empezó a seguirte`,
        data: { kind: "new_follower", fromUserId: me.id },
      });
    }

    res.status(204).send();
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Error al seguir al usuario" });
  }
});

/** DELETE /users/:userId/follow — dejar de seguir */
router.delete("/users/:userId/follow", requireAuth, async (req, res) => {
  const userId = Number(req.params.userId);
  if (!Number.isInteger(userId) || userId <= 0) {
    res.status(400).json({ error: "ID inválido" });
    return;
  }
  const me = req.currentUser!;
  try {
    await db
      .delete(followsTable)
      .where(
        and(
          eq(followsTable.followerId, me.id),
          eq(followsTable.followingId, userId),
        ),
      );
    res.status(204).send();
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Error al dejar de seguir" });
  }
});

/** GET /users/:userId/followers — lista de seguidores */
router.get("/users/:userId/followers", requireAuth, async (req, res) => {
  const userId = Number(req.params.userId);
  if (!Number.isInteger(userId) || userId <= 0) {
    res.status(400).json({ error: "ID inválido" });
    return;
  }
  try {
    const rows = await db
      .select({
        id: usersTable.id,
        username: usersTable.username,
        displayName: usersTable.displayName,
        avatarUrl: usersTable.avatarUrl,
        followedAt: followsTable.createdAt,
      })
      .from(followsTable)
      .innerJoin(usersTable, eq(usersTable.id, followsTable.followerId))
      .where(eq(followsTable.followingId, userId))
      .orderBy(followsTable.createdAt);

    res.json(
      rows.map((r) => ({
        ...toProfile(r),
        followedAt: r.followedAt.toISOString(),
      })),
    );
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Error al obtener seguidores" });
  }
});

/** GET /users/:userId/following — lista de seguidos */
router.get("/users/:userId/following", requireAuth, async (req, res) => {
  const userId = Number(req.params.userId);
  if (!Number.isInteger(userId) || userId <= 0) {
    res.status(400).json({ error: "ID inválido" });
    return;
  }
  try {
    const rows = await db
      .select({
        id: usersTable.id,
        username: usersTable.username,
        displayName: usersTable.displayName,
        avatarUrl: usersTable.avatarUrl,
        followedAt: followsTable.createdAt,
      })
      .from(followsTable)
      .innerJoin(usersTable, eq(usersTable.id, followsTable.followingId))
      .where(eq(followsTable.followerId, userId))
      .orderBy(followsTable.createdAt);

    res.json(
      rows.map((r) => ({
        ...toProfile(r),
        followedAt: r.followedAt.toISOString(),
      })),
    );
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Error al obtener seguidos" });
  }
});

export default router;
