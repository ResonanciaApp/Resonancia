import { Router, type IRouter } from "express";
import { and, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { getAuth } from "@clerk/express";
import {
  db,
  sharedMixesTable,
  sharedMixLikesTable,
  sharedMixCommentsTable,
  notificationsTable,
  usersTable,
  insertSharedMixSchema,
  insertSharedMixCommentSchema,
  type NotificationType,
  type SharedMix,
  type SharedMixComment,
  type User,
} from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth";
import { sendPushToUsers } from "../lib/push";

const router: IRouter = Router();
const PAGE_SIZE = 20;

const CATEGORIES = ["dormir", "trabajar", "motivarme"] as const;
type Category = (typeof CATEGORIES)[number];

function toProfile(u: User) {
  return {
    id: u.id,
    username: u.username,
    displayName: u.displayName,
    avatarUrl: u.avatarUrl,
  };
}

function serialize(
  mix: SharedMix,
  author: User,
  likedByMe: boolean,
  currentUserId: number | null,
) {
  return {
    id: mix.id,
    name: mix.name,
    description: mix.description,
    image: mix.image,
    category: mix.category,
    sounds: mix.sounds,
    likes: mix.likes,
    likedByMe,
    isMine: currentUserId != null && mix.authorId === currentUserId,
    author: toProfile(author),
    createdAt: mix.createdAt.toISOString(),
  };
}

function serializeComment(
  comment: SharedMixComment,
  author: User,
  currentUserId: number | null,
) {
  return {
    id: comment.id,
    mixId: comment.mixId,
    body: comment.body,
    author: toProfile(author),
    isMine: currentUserId != null && comment.authorId === currentUserId,
    createdAt: comment.createdAt.toISOString(),
  };
}

/**
 * Crea una notificación (colapsando no leídas del mismo actor+mezcla) y envía
 * push al creador de la mezcla. Fire-and-forget: nunca rompe la request.
 */
async function notifyMixOwner(opts: {
  ownerId: number;
  actor: User;
  type: Extract<NotificationType, "mix_like" | "mix_comment">;
  mixId: number;
  mixName: string;
}): Promise<void> {
  const { ownerId, actor, type, mixId, mixName } = opts;
  // No te notifiques a ti mismo.
  if (ownerId === actor.id) return;

  const actorName = actor.displayName || actor.username || "Alguien";
  try {
    // Solo inserta si no hay ya una no leída del mismo actor sobre esta mezcla
    // (el índice parcial único respalda el onConflictDoNothing como red de seguridad).
    const [existingUnread] = await db
      .select({ id: notificationsTable.id })
      .from(notificationsTable)
      .where(
        and(
          eq(notificationsTable.userId, ownerId),
          eq(notificationsTable.actorUserId, actor.id),
          eq(notificationsTable.entityId, mixId),
          eq(notificationsTable.type, type),
          isNull(notificationsTable.readAt),
        ),
      )
      .limit(1);
    if (existingUnread) return; // Ya hay una no leída: no dupliques notificación ni push.

    const inserted = await db
      .insert(notificationsTable)
      .values({ userId: ownerId, actorUserId: actor.id, type, entityId: mixId })
      .onConflictDoNothing()
      .returning({ id: notificationsTable.id });
    // El índice único pudo absorber una carrera concurrente: si no se insertó
    // ninguna fila, ya existe una no leída, así que tampoco mandamos push.
    if (inserted.length === 0) return;
  } catch (err) {
    // No interrumpir la acción principal por un fallo de notificación.
    void err;
    return;
  }

  // Push solo cuando se creó una notificación nueva (evita spam de likes/comentarios repetidos).
  void sendPushToUsers([ownerId], {
    title: actorName,
    body:
      type === "mix_like"
        ? `le dio me gusta a tu mezcla "${mixName}"`
        : `comentó tu mezcla "${mixName}"`,
    data: { kind: type, mixId },
  });
}

/** Look up the local user row for a request without creating one. */
async function getOptionalUser(req: Parameters<typeof getAuth>[0]): Promise<User | null> {
  const auth = getAuth(req);
  const clerkUserId = auth?.userId;
  if (!clerkUserId) return null;
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.clerkUserId, clerkUserId))
    .limit(1);
  return user ?? null;
}

router.get("/mixes", async (req, res) => {
  const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10) || 1);
  const offset = (page - 1) * PAGE_SIZE;
  const categoryRaw = req.query.category;
  const category =
    typeof categoryRaw === "string" && CATEGORIES.includes(categoryRaw as Category)
      ? (categoryRaw as Category)
      : null;

  try {
    const me = await getOptionalUser(req);
    const where = category ? eq(sharedMixesTable.category, category) : undefined;

    const [rows, countResult] = await Promise.all([
      db
        .select({ mix: sharedMixesTable, author: usersTable })
        .from(sharedMixesTable)
        .innerJoin(usersTable, eq(usersTable.id, sharedMixesTable.authorId))
        .where(where)
        .orderBy(desc(sharedMixesTable.createdAt))
        .limit(PAGE_SIZE)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(sharedMixesTable)
        .where(where),
    ]);

    let likedIds = new Set<number>();
    if (me && rows.length > 0) {
      const mixIds = rows.map((r) => r.mix.id);
      const likes = await db
        .select({ mixId: sharedMixLikesTable.mixId })
        .from(sharedMixLikesTable)
        .where(
          and(
            eq(sharedMixLikesTable.userId, me.id),
            inArray(sharedMixLikesTable.mixId, mixIds),
          ),
        );
      likedIds = new Set(likes.map((l) => l.mixId));
    }

    res.json({
      mixes: rows.map((r) =>
        serialize(r.mix, r.author, likedIds.has(r.mix.id), me?.id ?? null),
      ),
      total: countResult[0]?.count ?? 0,
      page,
      pageSize: PAGE_SIZE,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Error al obtener las mezclas" });
  }
});

router.post("/mixes", requireAuth, async (req, res) => {
  const parsed = insertSharedMixSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Datos de la mezcla inválidos" });
    return;
  }

  const me = req.currentUser!;
  try {
    const [mix] = await db
      .insert(sharedMixesTable)
      .values({ ...parsed.data, authorId: me.id })
      .returning();
    res.status(201).json(serialize(mix, me, false, me.id));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Error al compartir la mezcla" });
  }
});

router.post("/mixes/:id/like", requireAuth, async (req, res) => {
  const id = parseInt(String(req.params.id), 10);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: "ID inválido" });
    return;
  }

  const me = req.currentUser!;
  try {
    const [existing] = await db
      .select({ author: usersTable, mix: sharedMixesTable })
      .from(sharedMixesTable)
      .innerJoin(usersTable, eq(usersTable.id, sharedMixesTable.authorId))
      .where(eq(sharedMixesTable.id, id))
      .limit(1);

    if (!existing) {
      res.status(404).json({ error: "Mezcla no encontrada" });
      return;
    }

    // Toggle atómico: insertar/borrar el like y recalcular `likes` desde el
    // conteo real de filas en una sola transacción, para que carreras de
    // peticiones concurrentes nunca dejen el contador inconsistente.
    const { updated, likedByMe } = await db.transaction(async (tx) => {
      const [alreadyLiked] = await tx
        .select({ id: sharedMixLikesTable.id })
        .from(sharedMixLikesTable)
        .where(
          and(eq(sharedMixLikesTable.mixId, id), eq(sharedMixLikesTable.userId, me.id)),
        )
        .limit(1);

      let liked: boolean;
      if (alreadyLiked) {
        await tx
          .delete(sharedMixLikesTable)
          .where(eq(sharedMixLikesTable.id, alreadyLiked.id));
        liked = false;
      } else {
        await tx
          .insert(sharedMixLikesTable)
          .values({ mixId: id, userId: me.id })
          .onConflictDoNothing();
        liked = true;
      }

      const [{ count }] = await tx
        .select({ count: sql<number>`count(*)::int` })
        .from(sharedMixLikesTable)
        .where(eq(sharedMixLikesTable.mixId, id));

      const [row] = await tx
        .update(sharedMixesTable)
        .set({ likes: count })
        .where(eq(sharedMixesTable.id, id))
        .returning();

      return { updated: row, likedByMe: liked };
    });

    // Notifica al creador solo cuando se da like (no al quitarlo).
    if (likedByMe) {
      void notifyMixOwner({
        ownerId: existing.mix.authorId,
        actor: me,
        type: "mix_like",
        mixId: id,
        mixName: existing.mix.name,
      });
    }

    res.json(serialize(updated, existing.author, likedByMe, me.id));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Error al registrar el like" });
  }
});

router.delete("/mixes/:id", requireAuth, async (req, res) => {
  const id = parseInt(String(req.params.id), 10);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: "ID inválido" });
    return;
  }

  const me = req.currentUser!;
  try {
    const [mix] = await db
      .select()
      .from(sharedMixesTable)
      .where(eq(sharedMixesTable.id, id))
      .limit(1);

    if (!mix) {
      res.status(404).json({ error: "Mezcla no encontrada" });
      return;
    }
    if (mix.authorId !== me.id) {
      res.status(403).json({ error: "No puedes eliminar esta mezcla" });
      return;
    }

    await db.delete(sharedMixesTable).where(eq(sharedMixesTable.id, id));
    res.status(204).end();
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Error al eliminar la mezcla" });
  }
});

router.get("/mixes/:id/comments", async (req, res) => {
  const id = parseInt(String(req.params.id), 10);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: "ID inválido" });
    return;
  }

  try {
    const me = await getOptionalUser(req);

    const [mix] = await db
      .select({ id: sharedMixesTable.id })
      .from(sharedMixesTable)
      .where(eq(sharedMixesTable.id, id))
      .limit(1);
    if (!mix) {
      res.status(404).json({ error: "Mezcla no encontrada" });
      return;
    }

    const rows = await db
      .select({ comment: sharedMixCommentsTable, author: usersTable })
      .from(sharedMixCommentsTable)
      .innerJoin(usersTable, eq(usersTable.id, sharedMixCommentsTable.authorId))
      .where(eq(sharedMixCommentsTable.mixId, id))
      .orderBy(desc(sharedMixCommentsTable.createdAt));

    res.json({
      comments: rows.map((r) => serializeComment(r.comment, r.author, me?.id ?? null)),
      total: rows.length,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Error al obtener los comentarios" });
  }
});

router.post("/mixes/:id/comments", requireAuth, async (req, res) => {
  const id = parseInt(String(req.params.id), 10);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: "ID inválido" });
    return;
  }

  const parsed = insertSharedMixCommentSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Comentario inválido" });
    return;
  }

  const me = req.currentUser!;
  try {
    const [mix] = await db
      .select({ authorId: sharedMixesTable.authorId, name: sharedMixesTable.name })
      .from(sharedMixesTable)
      .where(eq(sharedMixesTable.id, id))
      .limit(1);
    if (!mix) {
      res.status(404).json({ error: "Mezcla no encontrada" });
      return;
    }

    const [comment] = await db
      .insert(sharedMixCommentsTable)
      .values({ mixId: id, authorId: me.id, body: parsed.data.body })
      .returning();

    void notifyMixOwner({
      ownerId: mix.authorId,
      actor: me,
      type: "mix_comment",
      mixId: id,
      mixName: mix.name,
    });

    res.status(201).json(serializeComment(comment, me, me.id));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Error al publicar el comentario" });
  }
});

router.delete("/mixes/:id/comments/:commentId", requireAuth, async (req, res) => {
  const id = parseInt(String(req.params.id), 10);
  const commentId = parseInt(String(req.params.commentId), 10);
  if (!Number.isInteger(id) || !Number.isInteger(commentId)) {
    res.status(400).json({ error: "ID inválido" });
    return;
  }

  const me = req.currentUser!;
  try {
    const [comment] = await db
      .select()
      .from(sharedMixCommentsTable)
      .where(
        and(
          eq(sharedMixCommentsTable.id, commentId),
          eq(sharedMixCommentsTable.mixId, id),
        ),
      )
      .limit(1);

    if (!comment) {
      res.status(404).json({ error: "Comentario no encontrado" });
      return;
    }
    if (comment.authorId !== me.id) {
      res.status(403).json({ error: "No puedes eliminar este comentario" });
      return;
    }

    await db.delete(sharedMixCommentsTable).where(eq(sharedMixCommentsTable.id, commentId));
    res.status(204).end();
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Error al eliminar el comentario" });
  }
});

export default router;
