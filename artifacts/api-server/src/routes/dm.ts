import { Router, type IRouter } from "express";
import { and, desc, eq, inArray, isNull, lt, or, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import {
  db,
  usersTable,
  friendshipsTable,
  notificationsTable,
  directMessagesTable,
  type DirectMessage,
  type User,
} from "@workspace/db";
import {
  GetDirectMessagesParams,
  GetDirectMessagesQueryParams,
  SendDirectMessageBody,
  MarkConversationReadParams,
  PingTypingParams,
  GetTypingStatusParams,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

const TYPING_TTL_MS = 6000;
const typingMap = new Map<string, number>();
function typingKey(fromUserId: number, toUserId: number): string {
  return `${fromUserId}->${toUserId}`;
}

// --- Bot Luna (dev only) ---
const LUNA_BOT_USER_ID =
  process.env.NODE_ENV !== "production" ? Number(process.env.LUNA_BOT_USER_ID ?? 3) : null;

const LUNA_REPLIES = [
  "Mmm, qué lindo lo que decís 🌙",
  "Te entiendo totalmente.",
  "Hoy me acordé de vos cuando meditaba.",
  "¿Vos cómo estás durmiendo últimamente?",
  "Esa frase me la guardo ✨",
  "Probá respirar 4-7-8 antes de dormir, me cambió la noche.",
  "Mañana arrancamos el día con una sesión cortita ¿dale?",
  "Estoy escuchando los cuencos ahora mismo 🎶",
  "Gracias por escribirme, lo necesitaba.",
  "Te mando un abrazo grande 🤍",
];
const LUNA_SESSION_REPLY = "¡Uhh gracias! La pongo esta noche para dormir 🌙";
const LUNA_GREETING_REPLY = "¡Hola! ¿Cómo va tu día? 😊";

function pickLunaReply(msgBody: string | null, sessionId: number | null): string {
  if (sessionId != null) return LUNA_SESSION_REPLY;
  const b = (msgBody ?? "").toLowerCase();
  if (/^(hola|holi|buenas|hey|holaa)/.test(b.trim())) return LUNA_GREETING_REPLY;
  return LUNA_REPLIES[Math.floor(Math.random() * LUNA_REPLIES.length)];
}

function scheduleLunaReply(senderId: number, body: string | null, sessionId: number | null) {
  if (LUNA_BOT_USER_ID == null) return;
  const botId = LUNA_BOT_USER_ID;
  // Show "está escribiendo…" immediately and keep it alive across the delay.
  typingMap.set(typingKey(botId, senderId), Date.now());
  const keepAlive = setInterval(() => {
    typingMap.set(typingKey(botId, senderId), Date.now());
  }, 3000);
  const delayMs = 2500 + Math.floor(Math.random() * 2500);
  setTimeout(async () => {
    clearInterval(keepAlive);
    typingMap.delete(typingKey(botId, senderId));
    try {
      await db.insert(directMessagesTable).values({
        senderId: botId,
        recipientId: senderId,
        body: pickLunaReply(body, sessionId),
        sessionId: null,
      });
      await db
        .insert(notificationsTable)
        .values({ userId: senderId, actorUserId: botId, type: "dm" })
        .onConflictDoNothing();
    } catch {
      // dev-only side effect; swallow
    }
  }, delayMs);
}

function toProfile(u: User) {
  return {
    id: u.id,
    username: u.username,
    displayName: u.displayName,
    avatarUrl: u.avatarUrl,
  };
}

function serializeMessage(m: DirectMessage) {
  return {
    id: m.id,
    senderId: m.senderId,
    recipientId: m.recipientId,
    body: m.body,
    sessionId: m.sessionId,
    readAt: m.readAt ? m.readAt.toISOString() : null,
    createdAt: m.createdAt.toISOString(),
  };
}

async function areFriends(aId: number, bId: number): Promise<boolean> {
  const [row] = await db
    .select({ id: friendshipsTable.id })
    .from(friendshipsTable)
    .where(
      and(
        eq(friendshipsTable.status, "accepted"),
        or(
          and(eq(friendshipsTable.requesterId, aId), eq(friendshipsTable.addresseeId, bId)),
          and(eq(friendshipsTable.requesterId, bId), eq(friendshipsTable.addresseeId, aId)),
        ),
      ),
    )
    .limit(1);
  return !!row;
}

// ----- GET /dm/conversations -----
router.get("/dm/conversations", requireAuth, async (req, res) => {
  const me = req.currentUser!;
  try {
    // All accepted friends
    const requesterUser = alias(usersTable, "requester_user");
    const addresseeUser = alias(usersTable, "addressee_user");
    const friendRows = await db
      .select({ requester: requesterUser, addressee: addresseeUser })
      .from(friendshipsTable)
      .innerJoin(requesterUser, eq(requesterUser.id, friendshipsTable.requesterId))
      .innerJoin(addresseeUser, eq(addresseeUser.id, friendshipsTable.addresseeId))
      .where(
        and(
          eq(friendshipsTable.status, "accepted"),
          or(eq(friendshipsTable.requesterId, me.id), eq(friendshipsTable.addresseeId, me.id)),
        ),
      );
    const friends = friendRows.map((r) => (r.requester.id === me.id ? r.addressee : r.requester));
    if (friends.length === 0) {
      res.json([]);
      return;
    }
    const friendIds = friends.map((f) => f.id);

    // Last message per friend (in either direction)
    const lastPerPair = await db.execute(sql`
      SELECT DISTINCT ON (other_id) other_id, id, sender_id, recipient_id, body, session_id, read_at, created_at
      FROM (
        SELECT
          CASE WHEN sender_id = ${me.id} THEN recipient_id ELSE sender_id END AS other_id,
          id, sender_id, recipient_id, body, session_id, read_at, created_at
        FROM direct_messages
        WHERE (sender_id = ${me.id} AND recipient_id = ANY(${friendIds}))
           OR (recipient_id = ${me.id} AND sender_id = ANY(${friendIds}))
      ) AS pairs
      ORDER BY other_id, created_at DESC
    `);

    type Row = {
      other_id: number;
      id: number;
      sender_id: number;
      recipient_id: number;
      body: string | null;
      session_id: number | null;
      read_at: Date | null;
      created_at: Date;
    };
    const lastByFriend = new Map<number, Row>();
    for (const r of lastPerPair.rows as unknown as Row[]) {
      lastByFriend.set(r.other_id, r);
    }

    // Unread counts per friend
    const unreadRows = await db
      .select({
        senderId: directMessagesTable.senderId,
        count: sql<number>`count(*)::int`,
      })
      .from(directMessagesTable)
      .where(
        and(
          eq(directMessagesTable.recipientId, me.id),
          inArray(directMessagesTable.senderId, friendIds),
          isNull(directMessagesTable.readAt),
        ),
      )
      .groupBy(directMessagesTable.senderId);
    const unreadByFriend = new Map<number, number>();
    for (const u of unreadRows) unreadByFriend.set(u.senderId, Number(u.count));

    const out = friends
      .map((f) => {
        const last = lastByFriend.get(f.id);
        return {
          friend: toProfile(f),
          lastMessage: last
            ? {
                id: last.id,
                senderId: last.sender_id,
                recipientId: last.recipient_id,
                body: last.body,
                sessionId: last.session_id,
                readAt: last.read_at ? last.read_at.toISOString() : null,
                createdAt: last.created_at.toISOString(),
              }
            : null,
          unreadCount: unreadByFriend.get(f.id) ?? 0,
        };
      })
      .sort((a, b) => {
        const at = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0;
        const bt = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0;
        return bt - at;
      });

    res.json(out);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Error al obtener conversaciones" });
  }
});

// ----- GET /dm/with/:userId -----
router.get("/dm/with/:userId", requireAuth, async (req, res) => {
  const params = GetDirectMessagesParams.safeParse(req.params);
  const query = GetDirectMessagesQueryParams.safeParse(req.query);
  if (!params.success || !query.success) {
    res.status(400).json({ error: "Parámetros inválidos" });
    return;
  }
  const me = req.currentUser!;
  const otherId = params.data.userId;
  if (otherId === me.id) {
    res.status(400).json({ error: "ID inválido" });
    return;
  }
  if (!(await areFriends(me.id, otherId))) {
    res.status(403).json({ error: "No son amigos" });
    return;
  }
  const limit = Math.min(query.data.limit ?? 50, 100);
  const before = query.data.before ? new Date(query.data.before) : null;

  try {
    const conditions = [
      or(
        and(eq(directMessagesTable.senderId, me.id), eq(directMessagesTable.recipientId, otherId)),
        and(eq(directMessagesTable.senderId, otherId), eq(directMessagesTable.recipientId, me.id)),
      ),
    ];
    if (before) conditions.push(lt(directMessagesTable.createdAt, before));

    const rows = await db
      .select()
      .from(directMessagesTable)
      .where(and(...conditions))
      .orderBy(desc(directMessagesTable.createdAt), desc(directMessagesTable.id))
      .limit(limit);
    res.json(rows.map(serializeMessage));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Error al obtener mensajes" });
  }
});

// ----- POST /dm/with/:userId -----
router.post("/dm/with/:userId", requireAuth, async (req, res) => {
  const params = GetDirectMessagesParams.safeParse(req.params);
  const body = SendDirectMessageBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Datos inválidos" });
    return;
  }
  const me = req.currentUser!;
  const otherId = params.data.userId;
  if (otherId === me.id) {
    res.status(400).json({ error: "ID inválido" });
    return;
  }
  const hasBody = typeof body.data.body === "string" && body.data.body.trim().length > 0;
  const hasSession = typeof body.data.sessionId === "number";
  if (!hasBody && !hasSession) {
    res.status(400).json({ error: "Mensaje vacío" });
    return;
  }
  if (!(await areFriends(me.id, otherId))) {
    res.status(403).json({ error: "No son amigos" });
    return;
  }

  try {
    const [created] = await db
      .insert(directMessagesTable)
      .values({
        senderId: me.id,
        recipientId: otherId,
        body: hasBody ? body.data.body!.trim() : null,
        sessionId: hasSession ? body.data.sessionId! : null,
      })
      .returning();

    // Dedupe: only create a `dm` notification if there isn't an unread one already from me to this user
    const [existingUnread] = await db
      .select({ id: notificationsTable.id })
      .from(notificationsTable)
      .where(
        and(
          eq(notificationsTable.userId, otherId),
          eq(notificationsTable.actorUserId, me.id),
          eq(notificationsTable.type, "dm"),
          isNull(notificationsTable.readAt),
        ),
      )
      .limit(1);
    if (!existingUnread) {
      await db
        .insert(notificationsTable)
        .values({
          userId: otherId,
          actorUserId: me.id,
          type: "dm",
        })
        .onConflictDoNothing();
    }

    // Clear my typing indicator
    typingMap.delete(typingKey(me.id, otherId));

    // Dev-only: bot Luna replies automatically
    if (LUNA_BOT_USER_ID != null && otherId === LUNA_BOT_USER_ID) {
      scheduleLunaReply(
        me.id,
        hasBody ? body.data.body!.trim() : null,
        hasSession ? body.data.sessionId! : null,
      );
    }

    res.status(201).json(serializeMessage(created));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Error al enviar el mensaje" });
  }
});

// ----- POST /dm/with/:userId/read -----
router.post("/dm/with/:userId/read", requireAuth, async (req, res) => {
  const parsed = MarkConversationReadParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "ID inválido" });
    return;
  }
  const me = req.currentUser!;
  const otherId = parsed.data.userId;
  if (otherId === me.id) {
    res.status(400).json({ error: "ID inválido" });
    return;
  }
  if (!(await areFriends(me.id, otherId))) {
    res.status(403).json({ error: "No son amigos" });
    return;
  }
  try {
    await db
      .update(directMessagesTable)
      .set({ readAt: new Date() })
      .where(
        and(
          eq(directMessagesTable.recipientId, me.id),
          eq(directMessagesTable.senderId, otherId),
          isNull(directMessagesTable.readAt),
        ),
      );
    // Also mark `dm` notifications from this user as read
    await db
      .update(notificationsTable)
      .set({ readAt: new Date() })
      .where(
        and(
          eq(notificationsTable.userId, me.id),
          eq(notificationsTable.actorUserId, otherId),
          eq(notificationsTable.type, "dm"),
          isNull(notificationsTable.readAt),
        ),
      );
    res.status(204).send();
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Error al marcar como leído" });
  }
});

// ----- POST /dm/with/:userId/typing -----
router.post("/dm/with/:userId/typing", requireAuth, async (req, res) => {
  const parsed = PingTypingParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "ID inválido" });
    return;
  }
  const me = req.currentUser!;
  const otherId = parsed.data.userId;
  if (otherId === me.id) {
    res.status(400).json({ error: "ID inválido" });
    return;
  }
  if (!(await areFriends(me.id, otherId))) {
    res.status(403).json({ error: "No son amigos" });
    return;
  }
  typingMap.set(typingKey(me.id, otherId), Date.now());
  res.status(204).send();
});

// ----- GET /dm/with/:userId/typing -----
router.get("/dm/with/:userId/typing", requireAuth, async (req, res) => {
  const parsed = GetTypingStatusParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "ID inválido" });
    return;
  }
  const me = req.currentUser!;
  const otherId = parsed.data.userId;
  if (otherId === me.id) {
    res.status(400).json({ error: "ID inválido" });
    return;
  }
  if (!(await areFriends(me.id, otherId))) {
    res.status(403).json({ error: "No son amigos" });
    return;
  }
  const ts = typingMap.get(typingKey(otherId, me.id));
  const typing = !!ts && Date.now() - ts < TYPING_TTL_MS;
  res.json({ typing });
});

export default router;
