import { Router, type IRouter } from "express";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { db, notificationsTable, usersTable, type Notification, type User } from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

function toProfile(u: User) {
  return {
    id: u.id,
    username: u.username,
    displayName: u.displayName,
    avatarUrl: u.avatarUrl,
    role: u.role,
    createdAt: u.createdAt.toISOString(),
  };
}

function serialize(n: Notification, actor: User) {
  return {
    id: n.id,
    type: n.type,
    entityId: n.entityId,
    createdAt: n.createdAt.toISOString(),
    readAt: n.readAt ? n.readAt.toISOString() : null,
    actor: toProfile(actor),
  };
}

router.get("/notifications", requireAuth, async (req, res) => {
  const me = req.currentUser!;
  try {
    const rows = await db
      .select({ n: notificationsTable, actor: usersTable })
      .from(notificationsTable)
      .innerJoin(usersTable, eq(usersTable.id, notificationsTable.actorUserId))
      .where(eq(notificationsTable.userId, me.id))
      .orderBy(desc(notificationsTable.createdAt))
      .limit(50);
    res.json(rows.map((r) => serialize(r.n, r.actor)));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Error al obtener notificaciones" });
  }
});

router.get("/notifications/unread-count", requireAuth, async (req, res) => {
  const me = req.currentUser!;
  try {
    const [row] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(notificationsTable)
      .where(and(eq(notificationsTable.userId, me.id), isNull(notificationsTable.readAt)));
    res.json({ count: row?.count ?? 0 });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Error" });
  }
});

router.post("/notifications/read-all", requireAuth, async (req, res) => {
  const me = req.currentUser!;
  try {
    await db
      .update(notificationsTable)
      .set({ readAt: new Date() })
      .where(and(eq(notificationsTable.userId, me.id), isNull(notificationsTable.readAt)));
    res.status(204).send();
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Error" });
  }
});

export default router;
