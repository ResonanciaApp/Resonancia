import { Router, type IRouter } from "express";
import { and, asc, count, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import {
  db,
  usersTable,
  catalogCategoriesTable,
  catalogSessionsTable,
  playbackHistoryTable,
  sharedMixesTable,
  sharedMixReportsTable,
  mixerSoundsTable,
  insertMixerSoundSchema,
  updateMixerSoundSchema,
  type CatalogCategory,
  type SharedMix,
  type User,
  type MixerSound,
} from "@workspace/db";
import {
  GetAdminUsersQueryParams,
  CreateAdminCategoryBody,
  UpdateAdminCategoryBody,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";
import { requireRole } from "../middlewares/requireRole";

const router: IRouter = Router();

function serializeCategory(c: CatalogCategory) {
  return {
    id: c.id,
    title: c.title,
    subtitle: c.subtitle,
    icon: c.icon,
    iconFamily: c.iconFamily,
    sessionCount: c.sessionCount,
    color: c.color,
    gradientStart: c.gradientStart,
    gradientEnd: c.gradientEnd,
    isPrimary: c.isPrimary,
    sortOrder: c.sortOrder,
  };
}

// GET /admin/users — listar todos los usuarios con búsqueda + paginación (admin).
router.get("/admin/users", requireAuth, requireRole("admin"), async (req, res) => {
  const parsed = GetAdminUsersQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Consulta inválida" });
    return;
  }
  const { q, role } = parsed.data;
  const page = parsed.data.page ?? 1;
  const pageSize = parsed.data.pageSize ?? 20;

  const conditions = [];
  if (role) conditions.push(eq(usersTable.role, role));
  if (q && q.trim()) {
    const pattern = `%${q.trim()}%`;
    conditions.push(
      or(
        ilike(usersTable.username, pattern),
        ilike(usersTable.displayName, pattern),
        ilike(usersTable.email, pattern),
      ),
    );
  }
  const where = conditions.length ? and(...conditions) : undefined;

  try {
    const [{ value: total }] = await db
      .select({ value: count() })
      .from(usersTable)
      .where(where);

    const rows = await db
      .select()
      .from(usersTable)
      .where(where)
      .orderBy(desc(usersTable.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    const ids = rows.map((u) => u.id);
    const counts = ids.length
      ? await db
          .select({ createdBy: catalogSessionsTable.createdBy, c: count() })
          .from(catalogSessionsTable)
          .where(inArray(catalogSessionsTable.createdBy, ids))
          .groupBy(catalogSessionsTable.createdBy)
      : [];
    const countByUser = new Map(
      counts.map((r) => [r.createdBy, Number(r.c)]),
    );

    res.json({
      users: rows.map((u) => ({
        id: u.id,
        username: u.username,
        displayName: u.displayName,
        email: u.email,
        avatarUrl: u.avatarUrl,
        role: u.role,
        submissionCount: countByUser.get(u.id) ?? 0,
        createdAt: u.createdAt.toISOString(),
      })),
      total: Number(total),
      page,
      pageSize,
    });
  } catch (err) {
    req.log.error({ err }, "error listing admin users");
    res.status(500).json({ error: "Error al obtener los usuarios" });
  }
});

// GET /admin/stats — agregados globales del panel (admin).
router.get("/admin/stats", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const [userAgg] = await db
      .select({
        total: count(),
        creators: sql<number>`count(*) filter (where ${usersTable.role} = 'creator')`,
        admins: sql<number>`count(*) filter (where ${usersTable.role} = 'admin')`,
      })
      .from(usersTable);

    const [sessionAgg] = await db
      .select({
        total: count(),
        published: sql<number>`count(*) filter (where ${catalogSessionsTable.status} = 'published')`,
        pending: sql<number>`count(*) filter (where ${catalogSessionsTable.status} = 'pending')`,
        activeCreators: sql<number>`count(distinct ${catalogSessionsTable.createdBy}) filter (where ${catalogSessionsTable.status} = 'published')`,
      })
      .from(catalogSessionsTable);

    const [playAgg] = await db
      .select({
        plays: count(),
        minutes: sql<number>`coalesce(sum(${playbackHistoryTable.minutes}), 0)`,
      })
      .from(playbackHistoryTable);

    const topRaw = await db
      .select({
        sessionId: playbackHistoryTable.sessionId,
        plays: count(),
        minutes: sql<number>`coalesce(sum(${playbackHistoryTable.minutes}), 0)`,
      })
      .from(playbackHistoryTable)
      .groupBy(playbackHistoryTable.sessionId)
      .orderBy(desc(count()))
      .limit(10);

    const topIds = topRaw.map((t) => t.sessionId);
    const topSessionRows = topIds.length
      ? await db
          .select({
            id: catalogSessionsTable.id,
            title: catalogSessionsTable.title,
            categoryLabel: catalogSessionsTable.categoryLabel,
          })
          .from(catalogSessionsTable)
          .where(inArray(catalogSessionsTable.id, topIds))
      : [];
    const sessionById = new Map(topSessionRows.map((r) => [r.id, r]));

    const categoryRaw = await db
      .select({
        categoryId: playbackHistoryTable.categoryId,
        categoryLabel: sql<string>`max(${playbackHistoryTable.categoryLabel})`,
        plays: count(),
        minutes: sql<number>`coalesce(sum(${playbackHistoryTable.minutes}), 0)`,
      })
      .from(playbackHistoryTable)
      .groupBy(playbackHistoryTable.categoryId)
      .orderBy(desc(count()));

    res.json({
      totalUsers: Number(userAgg.total),
      totalCreators: Number(userAgg.creators),
      totalAdmins: Number(userAgg.admins),
      totalSessions: Number(sessionAgg.total),
      publishedSessions: Number(sessionAgg.published),
      pendingSubmissions: Number(sessionAgg.pending),
      totalPlays: Number(playAgg.plays),
      totalMinutes: Number(playAgg.minutes),
      activeCreators: Number(sessionAgg.activeCreators),
      topSessions: topRaw.map((t) => ({
        sessionId: t.sessionId,
        title: sessionById.get(t.sessionId)?.title ?? null,
        categoryLabel: sessionById.get(t.sessionId)?.categoryLabel ?? null,
        plays: Number(t.plays),
        minutes: Number(t.minutes),
      })),
      categoryBreakdown: categoryRaw.map((c) => ({
        categoryId: c.categoryId,
        categoryLabel: c.categoryLabel,
        plays: Number(c.plays),
        minutes: Number(c.minutes),
      })),
    });
  } catch (err) {
    req.log.error({ err }, "error building admin stats");
    res.status(500).json({ error: "Error al obtener las estadísticas" });
  }
});

// POST /admin/categories — crear una categoría del catálogo (admin).
router.post("/admin/categories", requireAuth, requireRole("admin"), async (req, res) => {
  const parsed = CreateAdminCategoryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Datos inválidos" });
    return;
  }
  const d = parsed.data;
  try {
    const [existing] = await db
      .select()
      .from(catalogCategoriesTable)
      .where(eq(catalogCategoriesTable.id, d.id))
      .limit(1);
    if (existing) {
      res.status(409).json({ error: "Ya existe una categoría con ese id" });
      return;
    }
    const [created] = await db
      .insert(catalogCategoriesTable)
      .values({
        id: d.id,
        title: d.title,
        subtitle: d.subtitle,
        icon: d.icon,
        iconFamily: d.iconFamily ?? null,
        color: d.color,
        gradientStart: d.gradientStart,
        gradientEnd: d.gradientEnd,
        isPrimary: d.isPrimary ?? false,
        sortOrder: d.sortOrder ?? 0,
      })
      .returning();
    req.log.info({ categoryId: created.id }, "admin category created");
    res.status(201).json(serializeCategory(created));
  } catch (err) {
    req.log.error({ err }, "error creating category");
    res.status(500).json({ error: "Error al crear la categoría" });
  }
});

// PATCH /admin/categories/:id — editar una categoría del catálogo (admin).
router.patch("/admin/categories/:id", requireAuth, requireRole("admin"), async (req, res) => {
  const id = String(req.params.id);
  const parsed = UpdateAdminCategoryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Datos inválidos" });
    return;
  }
  const d = parsed.data;
  const updates: Partial<typeof catalogCategoriesTable.$inferInsert> = {
    updatedAt: new Date(),
  };
  if (d.title !== undefined) updates.title = d.title;
  if (d.subtitle !== undefined) updates.subtitle = d.subtitle;
  if (d.icon !== undefined) updates.icon = d.icon;
  if (d.iconFamily !== undefined) updates.iconFamily = d.iconFamily;
  if (d.color !== undefined) updates.color = d.color;
  if (d.gradientStart !== undefined) updates.gradientStart = d.gradientStart;
  if (d.gradientEnd !== undefined) updates.gradientEnd = d.gradientEnd;
  if (d.isPrimary !== undefined) updates.isPrimary = d.isPrimary;
  if (d.sortOrder !== undefined) updates.sortOrder = d.sortOrder;

  try {
    const [updated] = await db
      .update(catalogCategoriesTable)
      .set(updates)
      .where(eq(catalogCategoriesTable.id, id))
      .returning();
    if (!updated) {
      res.status(404).json({ error: "Categoría no encontrada" });
      return;
    }
    req.log.info({ categoryId: id }, "admin category updated");
    res.json(serializeCategory(updated));
  } catch (err) {
    req.log.error({ err }, "error updating category");
    res.status(500).json({ error: "Error al actualizar la categoría" });
  }
});

function serializeAdminMix(
  mix: SharedMix,
  author: User,
  reportCount: number,
) {
  return {
    id: mix.id,
    name: mix.name,
    description: mix.description,
    image: mix.image,
    category: mix.category,
    sounds: mix.sounds,
    likes: mix.likes,
    hidden: mix.hidden,
    reportCount,
    author: {
      id: author.id,
      username: author.username,
      displayName: author.displayName,
      avatarUrl: author.avatarUrl,
      role: author.role,
      createdAt: author.createdAt.toISOString(),
    },
    createdAt: mix.createdAt.toISOString(),
  };
}

// GET /admin/mixes — mezclas reportadas u ocultas para moderación (admin).
router.get("/admin/mixes", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const reportCounts = db
      .select({
        mixId: sharedMixReportsTable.mixId,
        reportCount: count(sharedMixReportsTable.id).as("report_count"),
      })
      .from(sharedMixReportsTable)
      .groupBy(sharedMixReportsTable.mixId)
      .as("report_counts");

    const rows = await db
      .select({
        mix: sharedMixesTable,
        author: usersTable,
        reportCount: sql<number>`coalesce(${reportCounts.reportCount}, 0)::int`,
      })
      .from(sharedMixesTable)
      .innerJoin(usersTable, eq(usersTable.id, sharedMixesTable.authorId))
      .leftJoin(reportCounts, eq(reportCounts.mixId, sharedMixesTable.id))
      .where(
        or(
          eq(sharedMixesTable.hidden, true),
          sql`${reportCounts.reportCount} > 0`,
        ),
      )
      .orderBy(desc(sql`coalesce(${reportCounts.reportCount}, 0)`), desc(sharedMixesTable.createdAt));

    res.json({
      mixes: rows.map((r) => serializeAdminMix(r.mix, r.author, r.reportCount)),
      total: rows.length,
    });
  } catch (err) {
    req.log.error({ err }, "error listing admin mixes");
    res.status(500).json({ error: "Error al obtener las mezclas" });
  }
});

// POST /admin/mixes/:id/hide — ocultar/mostrar una mezcla (admin).
router.post("/admin/mixes/:id/hide", requireAuth, requireRole("admin"), async (req, res) => {
  const id = parseInt(String(req.params.id), 10);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: "ID inválido" });
    return;
  }
  const hidden = req.body?.hidden !== false;
  try {
    const [updated] = await db
      .update(sharedMixesTable)
      .set({ hidden })
      .where(eq(sharedMixesTable.id, id))
      .returning();
    if (!updated) {
      res.status(404).json({ error: "Mezcla no encontrada" });
      return;
    }
    req.log.info({ mixId: id, hidden }, "admin mix visibility changed");
    res.json({ ok: true, hidden });
  } catch (err) {
    req.log.error({ err }, "error hiding mix");
    res.status(500).json({ error: "Error al actualizar la mezcla" });
  }
});

// ── Sonidos del Mixer ─────────────────────────────────────────────────────

function serializeMixerSound(s: MixerSound) {
  return {
    id: s.id,
    name: s.name,
    categoryId: s.categoryId,
    iconName: s.iconName,
    iconSet: s.iconSet,
    isPremium: s.isPremium,
    isActive: s.isActive,
    sortOrder: s.sortOrder,
    objectPath: s.objectPath ?? null,
    thumbnailObjectPath: s.thumbnailObjectPath ?? null,
    tags: (s.tags as string[] | null) ?? null,
    bpm: s.bpm ?? null,
    loopBars: s.loopBars ?? null,
    createdAt: s.createdAt.toISOString(),
  };
}

// GET /admin/sounds — listar todos los sonidos del mixer.
router.get("/admin/sounds", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const rows = await db
      .select()
      .from(mixerSoundsTable)
      .orderBy(asc(mixerSoundsTable.categoryId), asc(mixerSoundsTable.sortOrder), asc(mixerSoundsTable.name));
    res.json({ sounds: rows.map(serializeMixerSound) });
  } catch (err) {
    req.log.error({ err }, "error listing mixer sounds");
    res.status(500).json({ error: "Error al obtener sonidos" });
  }
});

// POST /admin/sounds — crear un sonido del mixer.
router.post("/admin/sounds", requireAuth, requireRole("admin"), async (req, res) => {
  const parsed = insertMixerSoundSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Datos inválidos", details: parsed.error.issues });
    return;
  }
  try {
    const [existing] = await db.select().from(mixerSoundsTable).where(eq(mixerSoundsTable.id, parsed.data.id)).limit(1);
    if (existing) {
      res.status(409).json({ error: "Ya existe un sonido con ese ID" });
      return;
    }
    const [created] = await db.insert(mixerSoundsTable).values(parsed.data).returning();
    req.log.info({ soundId: created.id }, "mixer sound created");
    res.status(201).json(serializeMixerSound(created));
  } catch (err) {
    req.log.error({ err }, "error creating mixer sound");
    res.status(500).json({ error: "Error al crear el sonido" });
  }
});

// PATCH /admin/sounds/:id — actualizar un sonido del mixer.
router.patch("/admin/sounds/:id", requireAuth, requireRole("admin"), async (req, res) => {
  const id = String(req.params.id);
  const parsed = updateMixerSoundSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Datos inválidos", details: parsed.error.issues });
    return;
  }
  if (Object.keys(parsed.data).length === 0) {
    res.status(400).json({ error: "No hay campos para actualizar" });
    return;
  }
  try {
    const [updated] = await db
      .update(mixerSoundsTable)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(mixerSoundsTable.id, id))
      .returning();
    if (!updated) {
      res.status(404).json({ error: "Sonido no encontrado" });
      return;
    }
    req.log.info({ soundId: id }, "mixer sound updated");
    res.json(serializeMixerSound(updated));
  } catch (err) {
    req.log.error({ err }, "error updating mixer sound");
    res.status(500).json({ error: "Error al actualizar el sonido" });
  }
});

// DELETE /admin/sounds/:id — eliminar un sonido del mixer.
router.delete("/admin/sounds/:id", requireAuth, requireRole("admin"), async (req, res) => {
  const id = String(req.params.id);
  try {
    const [deleted] = await db
      .delete(mixerSoundsTable)
      .where(eq(mixerSoundsTable.id, id))
      .returning();
    if (!deleted) {
      res.status(404).json({ error: "Sonido no encontrado" });
      return;
    }
    req.log.info({ soundId: id }, "mixer sound deleted");
    res.status(204).end();
  } catch (err) {
    req.log.error({ err }, "error deleting mixer sound");
    res.status(500).json({ error: "Error al eliminar el sonido" });
  }
});

// DELETE /admin/mixes/:id — eliminar una mezcla definitivamente (admin).
router.delete("/admin/mixes/:id", requireAuth, requireRole("admin"), async (req, res) => {
  const id = parseInt(String(req.params.id), 10);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: "ID inválido" });
    return;
  }
  try {
    const [deleted] = await db
      .delete(sharedMixesTable)
      .where(eq(sharedMixesTable.id, id))
      .returning();
    if (!deleted) {
      res.status(404).json({ error: "Mezcla no encontrada" });
      return;
    }
    req.log.info({ mixId: id }, "admin mix deleted");
    res.status(204).end();
  } catch (err) {
    req.log.error({ err }, "error deleting mix");
    res.status(500).json({ error: "Error al eliminar la mezcla" });
  }
});

export default router;
