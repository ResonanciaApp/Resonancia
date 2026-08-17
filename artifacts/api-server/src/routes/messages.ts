import { Router, type IRouter } from "express";
import { sql, desc, lt, eq, and } from "drizzle-orm";
import { getAuth } from "@clerk/express";
import { requireAuth } from "../middlewares/requireAuth";
import { db, messagesTable, messageLikesTable, usersTable } from "@workspace/db";
import {
  CreateMessageBody,
  GetMessagesQueryParams,
  LikeMessageParams,
} from "@workspace/api-zod";

const router: IRouter = Router();
const PAGE_SIZE = 20;

/** Messages older than this are considered expired and get deleted. */
const WINDOW_MS = 24 * 60 * 60 * 1000;

/** Delete messages older than 24 h. Called on write operations so the table stays clean. */
async function pruneExpired() {
  const cutoff = new Date(Date.now() - WINDOW_MS);
  await db.delete(messagesTable).where(lt(messagesTable.createdAt, cutoff));
}

/** Timestamp of the start of the active 24-h window. */
function windowStart(): Date {
  return new Date(Date.now() - WINDOW_MS);
}

router.get("/messages", async (req, res) => {
  const query = GetMessagesQueryParams.safeParse(req.query);
  const page = query.success ? (query.data.page ?? 1) : 1;
  const offset = (page - 1) * PAGE_SIZE;

  try {
    const start = windowStart();

    const [rows, countResult] = await Promise.all([
      db
        .select()
        .from(messagesTable)
        .where(sql`${messagesTable.createdAt} > ${start}`)
        .orderBy(desc(messagesTable.createdAt))
        .limit(PAGE_SIZE)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(messagesTable)
        .where(sql`${messagesTable.createdAt} > ${start}`),
    ]);

    res.json({
      messages: rows,
      total: countResult[0]?.count ?? 0,
      page,
      pageSize: PAGE_SIZE,
      windowStart: start.toISOString(),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Error al obtener mensajes" });
  }
});

router.get("/messages/top", async (req, res) => {
  try {
    const start = windowStart();
    const [top] = await db
      .select()
      .from(messagesTable)
      .where(sql`${messagesTable.createdAt} > ${start}`)
      .orderBy(desc(messagesTable.likes), desc(messagesTable.createdAt))
      .limit(1);
    res.json({ message: top ?? null });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Error al obtener el mensaje más popular" });
  }
});

router.post("/messages", async (req, res) => {
  const parsed = CreateMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "El mensaje debe tener entre 1 y 300 caracteres" });
    return;
  }

  try {
    // Clean up expired messages before inserting a new one.
    await pruneExpired();

    // Optionally attach author info if the request is authenticated.
    let authorClerkId: string | null = null;
    let authorName: string | null = null;
    let authorAvatarUrl: string | null = null;

    const auth = getAuth(req);
    if (auth?.userId) {
      authorClerkId = auth.userId;
      const [user] = await db
        .select({ displayName: usersTable.displayName, avatarUrl: usersTable.avatarUrl })
        .from(usersTable)
        .where(eq(usersTable.clerkUserId, auth.userId))
        .limit(1);
      if (user) {
        authorName = user.displayName ?? null;
        authorAvatarUrl = user.avatarUrl ?? null;
      }
    }

    const [message] = await db
      .insert(messagesTable)
      .values({ content: parsed.data.content, authorClerkId, authorName, authorAvatarUrl })
      .returning();
    res.status(201).json(message);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Error al guardar el mensaje" });
  }
});

router.post("/messages/:id/like", requireAuth, async (req, res) => {
  const parsed = LikeMessageParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "ID inválido" });
    return;
  }
  const me = req.currentUser!;

  try {
    // Only allow liking messages still within the active window.
    const start = windowStart();
    const id = parsed.data.id;

    // Toggle idempotente por (usuario, mensaje): igual que en mixes.ts, el
    // contador denormalizado se recalcula desde las filas reales bajo un
    // row lock, así que llamadas repetidas no pueden inflar el ranking.
    const updated = await db.transaction(async (tx) => {
      const [msg] = await tx
        .select({ id: messagesTable.id, createdAt: messagesTable.createdAt })
        .from(messagesTable)
        .where(eq(messagesTable.id, id))
        .for("update");
      if (!msg || msg.createdAt <= start) return null;

      const [alreadyLiked] = await tx
        .select({ id: messageLikesTable.id })
        .from(messageLikesTable)
        .where(and(eq(messageLikesTable.messageId, id), eq(messageLikesTable.userId, me.id)))
        .limit(1);

      if (alreadyLiked) {
        await tx.delete(messageLikesTable).where(eq(messageLikesTable.id, alreadyLiked.id));
      } else {
        await tx
          .insert(messageLikesTable)
          .values({ messageId: id, userId: me.id })
          .onConflictDoNothing();
      }

      const [{ count }] = await tx
        .select({ count: sql<number>`count(*)::int` })
        .from(messageLikesTable)
        .where(eq(messageLikesTable.messageId, id));

      const [row] = await tx
        .update(messagesTable)
        .set({ likes: count })
        .where(eq(messagesTable.id, id))
        .returning();
      return row;
    });

    if (!updated) {
      res.status(404).json({ error: "Mensaje no encontrado o expirado" });
      return;
    }
    res.json(updated);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Error al registrar el like" });
  }
});

export default router;
