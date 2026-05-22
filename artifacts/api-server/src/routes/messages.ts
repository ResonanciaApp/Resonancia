import { Router, type IRouter } from "express";
import { eq, sql, desc, lt } from "drizzle-orm";
import { db, messagesTable } from "@workspace/db";
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

router.post("/messages", async (req, res) => {
  const parsed = CreateMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "El mensaje debe tener entre 1 y 300 caracteres" });
    return;
  }

  try {
    // Clean up expired messages before inserting a new one.
    await pruneExpired();

    const [message] = await db
      .insert(messagesTable)
      .values({ content: parsed.data.content })
      .returning();
    res.status(201).json(message);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Error al guardar el mensaje" });
  }
});

router.post("/messages/:id/like", async (req, res) => {
  const parsed = LikeMessageParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "ID inválido" });
    return;
  }

  try {
    // Only allow liking messages still within the active window.
    const start = windowStart();

    const [updated] = await db
      .update(messagesTable)
      .set({ likes: sql`${messagesTable.likes} + 1` })
      .where(
        sql`${messagesTable.id} = ${parsed.data.id} AND ${messagesTable.createdAt} > ${start}`,
      )
      .returning();

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
