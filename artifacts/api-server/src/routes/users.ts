import { Router, type IRouter } from "express";
import { and, desc, eq, ilike, inArray, ne, or, sql } from "drizzle-orm";
import {
  db,
  usersTable,
  friendshipsTable,
  followsTable,
  playbackHistoryTable,
  type User,
} from "@workspace/db";
import { UpdateMeBody, SearchUsersQueryParams, SetUserRoleBody } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";
import { requireRole } from "../middlewares/requireRole";

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

router.get("/me", requireAuth, async (req, res) => {
  res.json(toProfile(req.currentUser!));
});

router.patch("/me", requireAuth, async (req, res) => {
  const parsed = UpdateMeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Datos inválidos" });
    return;
  }
  const me = req.currentUser!;
  const updates: Partial<typeof usersTable.$inferInsert> = {};
  if (parsed.data.username !== undefined) updates.username = parsed.data.username;
  if (parsed.data.displayName !== undefined) updates.displayName = parsed.data.displayName;
  if (parsed.data.avatarUrl !== undefined) updates.avatarUrl = parsed.data.avatarUrl;
  if (parsed.data.location !== undefined) updates.location = parsed.data.location;

  if (Object.keys(updates).length === 0) {
    res.json(toProfile(me));
    return;
  }

  try {
    const [updated] = await db
      .update(usersTable)
      .set(updates)
      .where(eq(usersTable.id, me.id))
      .returning();
    res.json(toProfile(updated));
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code;
    if (code === "23505") {
      res.status(409).json({ error: "Ese nombre de usuario ya está en uso" });
      return;
    }
    req.log.error(err);
    res.status(500).json({ error: "Error al actualizar el perfil" });
  }
});

router.get("/users/search", requireAuth, async (req, res) => {
  const parsed = SearchUsersQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Consulta inválida" });
    return;
  }
  const q = parsed.data.q.trim();
  if (!q) {
    res.json([]);
    return;
  }
  const me = req.currentUser!;
  const pattern = `%${q}%`;

  try {
    const matches = await db
      .select()
      .from(usersTable)
      .where(
        and(
          ne(usersTable.id, me.id),
          or(ilike(usersTable.username, pattern), ilike(usersTable.displayName, pattern)),
        ),
      )
      .limit(20);

    if (matches.length === 0) {
      res.json([]);
      return;
    }

    const ids = matches.map((u) => u.id);
    const edges = await db
      .select()
      .from(friendshipsTable)
      .where(
        or(
          and(eq(friendshipsTable.requesterId, me.id), inArray(friendshipsTable.addresseeId, ids)),
          and(eq(friendshipsTable.addresseeId, me.id), inArray(friendshipsTable.requesterId, ids)),
        ),
      );

    const statusFor = (otherId: number) => {
      const edge = edges.find(
        (e) =>
          (e.requesterId === me.id && e.addresseeId === otherId) ||
          (e.addresseeId === me.id && e.requesterId === otherId),
      );
      if (!edge) return "none" as const;
      if (edge.status === "accepted") return "accepted" as const;
      return edge.requesterId === me.id ? ("pending_outgoing" as const) : ("pending_incoming" as const);
    };

    res.json(
      matches.map((u) => ({
        ...toProfile(u),
        friendshipStatus: statusFor(u.id),
      })),
    );
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Error al buscar usuarios" });
  }
});

router.get("/users/:userId/public", requireAuth, async (req, res) => {
  const userId = Number(req.params.userId);
  if (!Number.isInteger(userId) || userId <= 0) {
    res.status(400).json({ error: "ID de usuario inválido" });
    return;
  }

  try {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);
    if (!user) {
      res.status(404).json({ error: "Usuario no encontrado" });
      return;
    }

    const [agg] = await db
      .select({
        totalSessions: sql<number>`count(distinct ${playbackHistoryTable.sessionId})`,
        totalMinutes: sql<number>`coalesce(sum(${playbackHistoryTable.minutes}), 0)`,
      })
      .from(playbackHistoryTable)
      .where(eq(playbackHistoryTable.userId, userId));

    const [topCategory] = await db
      .select({
        categoryLabel: playbackHistoryTable.categoryLabel,
        minutes: sql<number>`coalesce(sum(${playbackHistoryTable.minutes}), 0)`,
      })
      .from(playbackHistoryTable)
      .where(eq(playbackHistoryTable.userId, userId))
      .groupBy(playbackHistoryTable.categoryLabel)
      .orderBy(desc(sql`coalesce(sum(${playbackHistoryTable.minutes}), 0)`))
      .limit(1);

    const [friends] = await db
      .select({ count: sql<number>`count(*)` })
      .from(friendshipsTable)
      .where(
        and(
          eq(friendshipsTable.status, "accepted"),
          or(
            eq(friendshipsTable.requesterId, userId),
            eq(friendshipsTable.addresseeId, userId),
          ),
        ),
      );

    const [followersRow] = await db
      .select({ count: sql<number>`count(*)` })
      .from(followsTable)
      .where(eq(followsTable.followingId, userId));

    const [followingRow] = await db
      .select({ count: sql<number>`count(*)` })
      .from(followsTable)
      .where(eq(followsTable.followerId, userId));

    res.json({
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      location: user.location ?? null,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
      stats: {
        totalSessions: Number(agg?.totalSessions ?? 0),
        totalMinutes: Math.round(Number(agg?.totalMinutes ?? 0)),
        topCategoryLabel: topCategory?.categoryLabel ?? null,
        friendsCount: Number(friends?.count ?? 0),
        followersCount: Number(followersRow?.count ?? 0),
        followingCount: Number(followingRow?.count ?? 0),
      },
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Error al obtener el perfil" });
  }
});

router.patch("/users/:userId/role", requireAuth, requireRole("admin"), async (req, res) => {
  const userId = Number(req.params.userId);
  if (!Number.isInteger(userId) || userId <= 0) {
    res.status(400).json({ error: "ID de usuario inválido" });
    return;
  }
  const parsed = SetUserRoleBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Datos inválidos" });
    return;
  }

  try {
    const [updated] = await db
      .update(usersTable)
      .set({ role: parsed.data.role })
      .where(eq(usersTable.id, userId))
      .returning();
    if (!updated) {
      res.status(404).json({ error: "Usuario no encontrado" });
      return;
    }
    res.json(toProfile(updated));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Error al actualizar el rol" });
  }
});

export default router;
