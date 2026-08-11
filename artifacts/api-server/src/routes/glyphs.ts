import { Router, type IRouter } from "express";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { getAuth } from "@clerk/express";
import {
  db,
  sharedGlyphsTable,
  sharedGlyphLikesTable,
  usersTable,
  insertSharedGlyphSchema,
  type SharedGlyph,
  type User,
} from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth";
import { recordCommunityEvent } from "../lib/communityActivity";

const router: IRouter = Router();
const PAGE_SIZE = 20;
const MAX_GLYPHS_PER_USER = 30;

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

function serialize(
  glyph: SharedGlyph,
  author: User,
  likedByMe: boolean,
  currentUserId: number | null,
) {
  return {
    id: glyph.id,
    name: glyph.name,
    description: glyph.description,
    recipe: glyph.recipe,
    likes: glyph.likes,
    likedByMe,
    isMine: currentUserId != null && glyph.authorId === currentUserId,
    author: toProfile(author),
    createdAt: glyph.createdAt.toISOString(),
  };
}

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

router.get("/glyphs", async (req, res) => {
  const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10) || 1);
  const offset = (page - 1) * PAGE_SIZE;
  const authorRaw = req.query.author;
  const authorId =
    typeof authorRaw === "string" && Number.isInteger(parseInt(authorRaw, 10))
      ? parseInt(authorRaw, 10)
      : null;

  try {
    const me = await getOptionalUser(req);
    const conditions = [eq(sharedGlyphsTable.hidden, false)];
    if (authorId != null) conditions.push(eq(sharedGlyphsTable.authorId, authorId));
    const where = and(...conditions);

    const [rows, countResult] = await Promise.all([
      db
        .select({ glyph: sharedGlyphsTable, author: usersTable })
        .from(sharedGlyphsTable)
        .innerJoin(usersTable, eq(usersTable.id, sharedGlyphsTable.authorId))
        .where(where)
        .orderBy(desc(sharedGlyphsTable.likes), desc(sharedGlyphsTable.createdAt))
        .limit(PAGE_SIZE)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(sharedGlyphsTable)
        .where(where),
    ]);

    const glyphIds = rows.map((r) => r.glyph.id);

    let likedIds = new Set<number>();
    if (me && glyphIds.length > 0) {
      const likes = await db
        .select({ glyphId: sharedGlyphLikesTable.glyphId })
        .from(sharedGlyphLikesTable)
        .where(
          and(
            eq(sharedGlyphLikesTable.userId, me.id),
            inArray(sharedGlyphLikesTable.glyphId, glyphIds),
          ),
        );
      likedIds = new Set(likes.map((l) => l.glyphId));
    }

    res.json({
      glyphs: rows.map((r) =>
        serialize(r.glyph, r.author, likedIds.has(r.glyph.id), me?.id ?? null),
      ),
      total: countResult[0]?.count ?? 0,
      page,
      pageSize: PAGE_SIZE,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Error al obtener las composiciones" });
  }
});

router.post("/glyphs", requireAuth, async (req, res) => {
  const parsed = insertSharedGlyphSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Datos de la composición inválidos" });
    return;
  }

  const me = req.currentUser!;

  try {
    const mine = await db
      .select({ id: sharedGlyphsTable.id })
      .from(sharedGlyphsTable)
      .where(eq(sharedGlyphsTable.authorId, me.id));

    if (mine.length >= MAX_GLYPHS_PER_USER) {
      res.status(409).json({
        error: `Alcanzaste el máximo de ${MAX_GLYPHS_PER_USER} composiciones compartidas. Eliminá alguna para compartir otra.`,
      });
      return;
    }

    const [glyph] = await db
      .insert(sharedGlyphsTable)
      .values({ ...parsed.data, authorId: me.id })
      .returning();

    // Fire-and-forget: record community event for the feed.
    void recordCommunityEvent(me.id, "glyph_shared", { glyphId: glyph.id, glyphName: glyph.name });

    res.status(201).json(serialize(glyph, me, false, me.id));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Error al compartir la composición" });
  }
});

router.post("/glyphs/:id/like", requireAuth, async (req, res) => {
  const id = parseInt(String(req.params.id), 10);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: "ID inválido" });
    return;
  }

  const me = req.currentUser!;
  try {
    const [existing] = await db
      .select({ author: usersTable, glyph: sharedGlyphsTable })
      .from(sharedGlyphsTable)
      .innerJoin(usersTable, eq(usersTable.id, sharedGlyphsTable.authorId))
      .where(eq(sharedGlyphsTable.id, id))
      .limit(1);

    if (!existing) {
      res.status(404).json({ error: "Composición no encontrada" });
      return;
    }

    const { updated, likedByMe } = await db.transaction(async (tx) => {
      await tx
        .select({ id: sharedGlyphsTable.id })
        .from(sharedGlyphsTable)
        .where(eq(sharedGlyphsTable.id, id))
        .for("update");

      const [alreadyLiked] = await tx
        .select({ id: sharedGlyphLikesTable.id })
        .from(sharedGlyphLikesTable)
        .where(
          and(
            eq(sharedGlyphLikesTable.glyphId, id),
            eq(sharedGlyphLikesTable.userId, me.id),
          ),
        )
        .limit(1);

      let liked: boolean;
      if (alreadyLiked) {
        await tx
          .delete(sharedGlyphLikesTable)
          .where(eq(sharedGlyphLikesTable.id, alreadyLiked.id));
        liked = false;
      } else {
        await tx
          .insert(sharedGlyphLikesTable)
          .values({ glyphId: id, userId: me.id })
          .onConflictDoNothing();
        liked = true;
      }

      const [{ count }] = await tx
        .select({ count: sql<number>`count(*)::int` })
        .from(sharedGlyphLikesTable)
        .where(eq(sharedGlyphLikesTable.glyphId, id));

      const [row] = await tx
        .update(sharedGlyphsTable)
        .set({ likes: count })
        .where(eq(sharedGlyphsTable.id, id))
        .returning();

      return { updated: row, likedByMe: liked };
    });

    res.json(serialize(updated, existing.author, likedByMe, me.id));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Error al procesar el me gusta" });
  }
});

router.delete("/glyphs/:id", requireAuth, async (req, res) => {
  const id = parseInt(String(req.params.id), 10);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: "ID inválido" });
    return;
  }

  const me = req.currentUser!;
  try {
    const [glyph] = await db
      .select()
      .from(sharedGlyphsTable)
      .where(eq(sharedGlyphsTable.id, id))
      .limit(1);

    if (!glyph) {
      res.status(404).json({ error: "Composición no encontrada" });
      return;
    }
    if (glyph.authorId !== me.id && me.role !== "admin") {
      res.status(403).json({ error: "Solo el autor puede eliminar esta composición" });
      return;
    }

    await db.delete(sharedGlyphsTable).where(eq(sharedGlyphsTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Error al eliminar la composición" });
  }
});

export default router;
