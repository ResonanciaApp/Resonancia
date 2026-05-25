import { Router, type IRouter } from "express";
import { and, eq, ilike, ne, or, sql } from "drizzle-orm";
import { db, usersTable, friendshipsTable, type User } from "@workspace/db";
import { UpdateMeBody, SearchUsersQueryParams } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

function toProfile(u: User) {
  return {
    id: u.id,
    username: u.username,
    displayName: u.displayName,
    avatarUrl: u.avatarUrl,
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
          and(eq(friendshipsTable.requesterId, me.id), sql`${friendshipsTable.addresseeId} = ANY(${ids})`),
          and(eq(friendshipsTable.addresseeId, me.id), sql`${friendshipsTable.requesterId} = ANY(${ids})`),
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

export default router;
