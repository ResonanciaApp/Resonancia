import { Router, type IRouter } from "express";
import { eq, sql, desc } from "drizzle-orm";
import { db, messagesTable } from "@workspace/db";
import {
  CreateMessageBody,
  GetMessagesQueryParams,
  LikeMessageParams,
} from "@workspace/api-zod";

const router: IRouter = Router();
const PAGE_SIZE = 20;

router.get("/messages", async (req, res) => {
  const query = GetMessagesQueryParams.safeParse(req.query);
  const page = query.success ? (query.data.page ?? 1) : 1;
  const offset = (page - 1) * PAGE_SIZE;

  try {
    const [rows, countResult] = await Promise.all([
      db
        .select()
        .from(messagesTable)
        .orderBy(desc(messagesTable.createdAt))
        .limit(PAGE_SIZE)
        .offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(messagesTable),
    ]);

    res.json({
      messages: rows,
      total: countResult[0]?.count ?? 0,
      page,
      pageSize: PAGE_SIZE,
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
    const [updated] = await db
      .update(messagesTable)
      .set({ likes: sql`${messagesTable.likes} + 1` })
      .where(eq(messagesTable.id, parsed.data.id))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "Mensaje no encontrado" });
      return;
    }
    res.json(updated);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Error al registrar el like" });
  }
});

export default router;
