import { Router, type IRouter } from "express";
import { and, desc, eq, or } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import {
  db,
  usersTable,
  friendshipsTable,
  type User,
  type Friendship,
} from "@workspace/db";
import {
  SendFriendRequestBody,
  RemoveFriendParams,
  AcceptFriendRequestParams,
  DeclineFriendRequestParams,
} from "@workspace/api-zod";
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

function serializeRequest(f: Friendship, requester: User, addressee: User) {
  return {
    id: f.id,
    status: f.status,
    createdAt: f.createdAt.toISOString(),
    requester: toProfile(requester),
    addressee: toProfile(addressee),
  };
}

router.get("/friends", requireAuth, async (req, res) => {
  const me = req.currentUser!;
  try {
    const requesterUser = alias(usersTable, "requester_user");
    const addresseeUser = alias(usersTable, "addressee_user");

    const rows = await db
      .select({
        friendship: friendshipsTable,
        requester: requesterUser,
        addressee: addresseeUser,
      })
      .from(friendshipsTable)
      .innerJoin(requesterUser, eq(requesterUser.id, friendshipsTable.requesterId))
      .innerJoin(addresseeUser, eq(addresseeUser.id, friendshipsTable.addresseeId))
      .where(
        and(
          eq(friendshipsTable.status, "accepted"),
          or(eq(friendshipsTable.requesterId, me.id), eq(friendshipsTable.addresseeId, me.id)),
        ),
      )
      .orderBy(desc(friendshipsTable.updatedAt));

    res.json(rows.map((r) => toProfile(r.requester.id === me.id ? r.addressee : r.requester)));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Error al obtener amigos" });
  }
});

router.delete("/friends/:userId", requireAuth, async (req, res) => {
  const parsed = RemoveFriendParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "ID inválido" });
    return;
  }
  const me = req.currentUser!;
  const otherId = parsed.data.userId;

  try {
    const deleted = await db
      .delete(friendshipsTable)
      .where(
        or(
          and(eq(friendshipsTable.requesterId, me.id), eq(friendshipsTable.addresseeId, otherId)),
          and(eq(friendshipsTable.requesterId, otherId), eq(friendshipsTable.addresseeId, me.id)),
        ),
      )
      .returning();
    if (deleted.length === 0) {
      res.status(404).json({ error: "Relación no encontrada" });
      return;
    }
    res.status(204).send();
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Error al eliminar amigo" });
  }
});

router.get("/friend-requests", requireAuth, async (req, res) => {
  const me = req.currentUser!;
  try {
    const requesterUser = alias(usersTable, "requester_user");
    const addresseeUser = alias(usersTable, "addressee_user");

    const rows = await db
      .select({
        friendship: friendshipsTable,
        requester: requesterUser,
        addressee: addresseeUser,
      })
      .from(friendshipsTable)
      .innerJoin(requesterUser, eq(requesterUser.id, friendshipsTable.requesterId))
      .innerJoin(addresseeUser, eq(addresseeUser.id, friendshipsTable.addresseeId))
      .where(
        and(eq(friendshipsTable.status, "pending"), eq(friendshipsTable.addresseeId, me.id)),
      )
      .orderBy(desc(friendshipsTable.createdAt));

    res.json(rows.map((r) => serializeRequest(r.friendship, r.requester, r.addressee)));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Error al obtener solicitudes" });
  }
});

router.post("/friend-requests", requireAuth, async (req, res) => {
  const parsed = SendFriendRequestBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Datos inválidos" });
    return;
  }
  const me = req.currentUser!;
  const addresseeId = parsed.data.addresseeId;

  if (addresseeId === me.id) {
    res.status(400).json({ error: "No puedes enviarte una solicitud" });
    return;
  }

  try {
    const [target] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, addresseeId))
      .limit(1);
    if (!target) {
      res.status(404).json({ error: "Usuario no encontrado" });
      return;
    }

    // Existing edge in either direction?
    const [existing] = await db
      .select()
      .from(friendshipsTable)
      .where(
        or(
          and(eq(friendshipsTable.requesterId, me.id), eq(friendshipsTable.addresseeId, addresseeId)),
          and(eq(friendshipsTable.requesterId, addresseeId), eq(friendshipsTable.addresseeId, me.id)),
        ),
      )
      .limit(1);

    if (existing) {
      if (existing.status === "accepted") {
        res.status(409).json({ error: "Ya son amigos" });
        return;
      }
      // Pending in same direction: noop conflict.
      if (existing.requesterId === me.id) {
        res.status(409).json({ error: "Ya enviaste esta solicitud" });
        return;
      }
      // Pending incoming → auto-accept.
      const [accepted] = await db
        .update(friendshipsTable)
        .set({ status: "accepted" })
        .where(eq(friendshipsTable.id, existing.id))
        .returning();
      res.status(201).json(serializeRequest(accepted, target, me));
      return;
    }

    const [created] = await db
      .insert(friendshipsTable)
      .values({ requesterId: me.id, addresseeId, status: "pending" })
      .returning();
    res.status(201).json(serializeRequest(created, me, target));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Error al enviar la solicitud" });
  }
});

router.post("/friend-requests/:id/accept", requireAuth, async (req, res) => {
  const parsed = AcceptFriendRequestParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "ID inválido" });
    return;
  }
  const me = req.currentUser!;
  try {
    const [updated] = await db
      .update(friendshipsTable)
      .set({ status: "accepted" })
      .where(
        and(
          eq(friendshipsTable.id, parsed.data.id),
          eq(friendshipsTable.addresseeId, me.id),
          eq(friendshipsTable.status, "pending"),
        ),
      )
      .returning();
    if (!updated) {
      res.status(404).json({ error: "Solicitud no encontrada" });
      return;
    }
    const [requester] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, updated.requesterId))
      .limit(1);
    res.json(serializeRequest(updated, requester!, me));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Error al aceptar la solicitud" });
  }
});

router.post("/friend-requests/:id/decline", requireAuth, async (req, res) => {
  const parsed = DeclineFriendRequestParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "ID inválido" });
    return;
  }
  const me = req.currentUser!;
  try {
    const deleted = await db
      .delete(friendshipsTable)
      .where(
        and(
          eq(friendshipsTable.id, parsed.data.id),
          eq(friendshipsTable.addresseeId, me.id),
          eq(friendshipsTable.status, "pending"),
        ),
      )
      .returning();
    if (deleted.length === 0) {
      res.status(404).json({ error: "Solicitud no encontrada" });
      return;
    }
    res.status(204).send();
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Error al rechazar la solicitud" });
  }
});

export default router;
