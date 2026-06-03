import { Router, type IRouter } from "express";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import {
  db,
  playbackHistoryTable,
  favoritesTable,
  sessionProgressTable,
} from "@workspace/db";
import {
  GetMyPlaysQueryParams,
  PushMyPlaysBody,
  SetMyFavoritesBody,
  SetMyProgressBody,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

const PLAYS_LIMIT = 600;

router.get("/me/plays", requireAuth, async (req, res) => {
  const parsed = GetMyPlaysQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Consulta inválida" });
    return;
  }
  const me = req.currentUser!;
  const since = parsed.data.since;

  try {
    const rows = await db
      .select()
      .from(playbackHistoryTable)
      .where(
        since
          ? and(
              eq(playbackHistoryTable.userId, me.id),
              gte(playbackHistoryTable.playedAt, since),
            )
          : eq(playbackHistoryTable.userId, me.id),
      )
      .orderBy(desc(playbackHistoryTable.playedAt))
      .limit(PLAYS_LIMIT);

    res.json({
      events: rows.map((r) => ({
        clientEventId: r.clientEventId,
        sessionId: r.sessionId,
        categoryId: r.categoryId,
        categoryLabel: r.categoryLabel,
        contentType: r.contentType,
        source: r.source,
        minutes: r.minutes,
        completed: r.completed,
        playedAt: r.playedAt,
      })),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Error al obtener el historial" });
  }
});

router.post("/me/plays", requireAuth, async (req, res) => {
  const parsed = PushMyPlaysBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Datos inválidos" });
    return;
  }
  const me = req.currentUser!;
  const events = parsed.data.events;
  if (events.length === 0) {
    res.status(204).end();
    return;
  }

  try {
    await db
      .insert(playbackHistoryTable)
      .values(
        events.map((e) => ({
          userId: me.id,
          clientEventId: e.clientEventId,
          sessionId: e.sessionId,
          categoryId: e.categoryId,
          categoryLabel: e.categoryLabel,
          contentType: e.contentType ?? null,
          source: e.source ?? null,
          minutes: e.minutes,
          completed: e.completed,
          playedAt: e.playedAt,
        })),
      )
      .onConflictDoNothing({
        target: [playbackHistoryTable.userId, playbackHistoryTable.clientEventId],
      });
    res.status(204).end();
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Error al sincronizar el historial" });
  }
});

router.get("/me/favorites", requireAuth, async (req, res) => {
  const me = req.currentUser!;
  try {
    const rows = await db
      .select({ sessionId: favoritesTable.sessionId })
      .from(favoritesTable)
      .where(eq(favoritesTable.userId, me.id))
      .orderBy(desc(favoritesTable.createdAt));
    res.json({ sessionIds: rows.map((r) => r.sessionId) });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Error al obtener favoritos" });
  }
});

router.put("/me/favorites", requireAuth, async (req, res) => {
  const parsed = SetMyFavoritesBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Datos inválidos" });
    return;
  }
  const me = req.currentUser!;
  const sessionIds = Array.from(new Set(parsed.data.sessionIds));

  try {
    await db.transaction(async (tx) => {
      await tx.delete(favoritesTable).where(eq(favoritesTable.userId, me.id));
      if (sessionIds.length > 0) {
        await tx
          .insert(favoritesTable)
          .values(sessionIds.map((sessionId) => ({ userId: me.id, sessionId })))
          .onConflictDoNothing();
      }
    });
    res.json({ sessionIds });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Error al guardar favoritos" });
  }
});

router.get("/me/progress", requireAuth, async (req, res) => {
  const me = req.currentUser!;
  try {
    const rows = await db
      .select({
        sessionId: sessionProgressTable.sessionId,
        progress: sessionProgressTable.progress,
      })
      .from(sessionProgressTable)
      .where(eq(sessionProgressTable.userId, me.id));
    res.json({ items: rows });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Error al obtener el progreso" });
  }
});

router.put("/me/progress", requireAuth, async (req, res) => {
  const parsed = SetMyProgressBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Datos inválidos" });
    return;
  }
  const me = req.currentUser!;
  const items = parsed.data.items;

  try {
    if (items.length > 0) {
      await db
        .insert(sessionProgressTable)
        .values(
          items.map((it) => ({
            userId: me.id,
            sessionId: it.sessionId,
            progress: it.progress,
          })),
        )
        .onConflictDoUpdate({
          target: [sessionProgressTable.userId, sessionProgressTable.sessionId],
          set: { progress: sql`excluded.progress`, updatedAt: new Date() },
        });
    }

    const rows = await db
      .select({
        sessionId: sessionProgressTable.sessionId,
        progress: sessionProgressTable.progress,
      })
      .from(sessionProgressTable)
      .where(eq(sessionProgressTable.userId, me.id));
    res.json({ items: rows });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Error al guardar el progreso" });
  }
});

export default router;
