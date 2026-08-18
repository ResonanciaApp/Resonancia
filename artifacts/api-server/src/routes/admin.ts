import { Router, type IRouter } from "express";
import { z } from "zod";
import { and, asc, count, desc, eq, ilike, inArray, ne, or, sql } from "drizzle-orm";
import {
  db,
  usersTable,
  catalogCategoriesTable,
  catalogSessionsTable,
  catalogPlaylistsTable,
  playbackHistoryTable,
  sharedMixesTable,
  sharedMixReportsTable,
  mixerSoundsTable,
  guideConfigsTable,
  insertMixerSoundSchema,
  updateMixerSoundSchema,
  insertCatalogPlaylistSchema,
  updateCatalogPlaylistSchema,
  insertGuideConfigSchema,
  updateGuideConfigSchema,
  sceneAnimationsTable,
  CreateSceneAnimationSchema,
  UpdateSceneAnimationSchema,
  type CatalogCategory,
  type CatalogPlaylist,
  type SharedMix,
  type User,
  type MixerSound,
  type GuideConfig,
  type SceneAnimation,
  catalogTagOptionsTable,
  exploreSectionsTable,
  type ExploreSection,
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
        clerkUserId: u.clerkUserId,
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
  const parsedBody = z.object({ hidden: z.boolean().optional() }).safeParse(req.body ?? {});
  if (!parsedBody.success) {
    res.status(400).json({ error: "Datos inválidos" });
    return;
  }
  const hidden = parsedBody.data.hidden !== false;
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

// ── Admin Playlists ────────────────────────────────────────────────────────

function serializePlaylist(p: CatalogPlaylist) {
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    description: p.description,
    coverUrl: p.coverUrl ?? null,
    durationLabel: p.durationLabel,
    savedCount: p.savedCount,
    sessionIds: p.sessionIds ?? [],
    playlistType: p.playlistType,
    sortOrder: p.sortOrder,
    isActive: p.isActive,
    showOnHome: p.showOnHome,
    homePosition: p.homePosition ?? null,
  };
}

// GET /admin/playlists — listar todas las playlists (admin).
router.get("/admin/playlists", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const rows = await db
      .select()
      .from(catalogPlaylistsTable)
      .orderBy(asc(catalogPlaylistsTable.sortOrder), asc(catalogPlaylistsTable.id));
    res.json(rows.map(serializePlaylist));
  } catch (err) {
    req.log.error({ err }, "error listing playlists");
    res.status(500).json({ error: "Error al cargar las playlists" });
  }
});

// POST /admin/playlists — crear una playlist.
router.post("/admin/playlists", requireAuth, requireRole("admin"), async (req, res) => {
  const parsed = insertCatalogPlaylistSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  try {
    const [created] = await db
      .insert(catalogPlaylistsTable)
      .values(parsed.data)
      .returning();
    req.log.info({ playlistId: created.id, slug: created.slug }, "admin playlist created");
    res.status(201).json(serializePlaylist(created));
  } catch (err: unknown) {
    const e = err as { code?: string };
    if (e?.code === "23505") {
      res.status(409).json({ error: "Ya existe una playlist con ese slug" });
      return;
    }
    req.log.error({ err }, "error creating playlist");
    res.status(500).json({ error: "Error al crear la playlist" });
  }
});

// PATCH /admin/playlists/:id — editar una playlist.
router.patch("/admin/playlists/:id", requireAuth, requireRole("admin"), async (req, res) => {
  const id = parseInt(String(req.params.id), 10);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: "ID inválido" });
    return;
  }
  const parsed = updateCatalogPlaylistSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  try {
    const [updated] = await db
      .update(catalogPlaylistsTable)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(catalogPlaylistsTable.id, id))
      .returning();
    if (!updated) {
      res.status(404).json({ error: "Playlist no encontrada" });
      return;
    }
    req.log.info({ playlistId: id }, "admin playlist updated");
    res.json(serializePlaylist(updated));
  } catch (err) {
    req.log.error({ err }, "error updating playlist");
    res.status(500).json({ error: "Error al actualizar la playlist" });
  }
});

// DELETE /admin/playlists/:id — eliminar una playlist.
router.delete("/admin/playlists/:id", requireAuth, requireRole("admin"), async (req, res) => {
  const id = parseInt(String(req.params.id), 10);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: "ID inválido" });
    return;
  }
  try {
    const [deleted] = await db
      .delete(catalogPlaylistsTable)
      .where(eq(catalogPlaylistsTable.id, id))
      .returning();
    if (!deleted) {
      res.status(404).json({ error: "Playlist no encontrada" });
      return;
    }
    req.log.info({ playlistId: id }, "admin playlist deleted");
    res.status(204).end();
  } catch (err) {
    req.log.error({ err }, "error deleting playlist");
    res.status(500).json({ error: "Error al eliminar la playlist" });
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

// ── Configuración de guiadores en vivo ────────────────────────────────────

function serializeGuideConfig(g: GuideConfig) {
  return {
    guideId: g.guideId,
    displayName: g.displayName,
    calLink: g.calLink ?? null,
    dailyRoomUrl: g.dailyRoomUrl ?? null,
    isLiveEnabled: g.isLiveEnabled,
    updatedAt: g.updatedAt.toISOString(),
  };
}

// GET /admin/guide-configs — listar todas las configuraciones de guiadores.
router.get("/admin/guide-configs", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const rows = await db
      .select()
      .from(guideConfigsTable)
      .orderBy(asc(guideConfigsTable.guideId));
    res.json({ guideConfigs: rows.map(serializeGuideConfig) });
  } catch (err) {
    req.log.error({ err }, "error listing guide configs");
    res.status(500).json({ error: "Error al obtener las configuraciones" });
  }
});

// POST /admin/guide-configs — crear configuración de guiador.
router.post("/admin/guide-configs", requireAuth, requireRole("admin"), async (req, res) => {
  const parsed = insertGuideConfigSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Datos inválidos", details: parsed.error.issues });
    return;
  }
  try {
    const [existing] = await db
      .select()
      .from(guideConfigsTable)
      .where(eq(guideConfigsTable.guideId, parsed.data.guideId))
      .limit(1);
    if (existing) {
      res.status(409).json({ error: "Ya existe una configuración para ese guiador" });
      return;
    }
    const [created] = await db.insert(guideConfigsTable).values(parsed.data).returning();
    req.log.info({ guideId: created.guideId }, "guide config created");
    res.status(201).json(serializeGuideConfig(created));
  } catch (err) {
    req.log.error({ err }, "error creating guide config");
    res.status(500).json({ error: "Error al crear la configuración" });
  }
});

// PATCH /admin/guide-configs/:guideId — actualizar configuración de guiador.
router.patch("/admin/guide-configs/:guideId", requireAuth, requireRole("admin"), async (req, res) => {
  const guideId = String(req.params.guideId);
  const parsed = updateGuideConfigSchema.safeParse(req.body);
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
      .update(guideConfigsTable)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(guideConfigsTable.guideId, guideId))
      .returning();
    if (!updated) {
      res.status(404).json({ error: "Configuración no encontrada" });
      return;
    }
    req.log.info({ guideId }, "guide config updated");
    res.json(serializeGuideConfig(updated));
  } catch (err) {
    req.log.error({ err }, "error updating guide config");
    res.status(500).json({ error: "Error al actualizar la configuración" });
  }
});

// DELETE /admin/guide-configs/:guideId — eliminar configuración de guiador.
router.delete("/admin/guide-configs/:guideId", requireAuth, requireRole("admin"), async (req, res) => {
  const guideId = String(req.params.guideId);
  try {
    const [deleted] = await db
      .delete(guideConfigsTable)
      .where(eq(guideConfigsTable.guideId, guideId))
      .returning();
    if (!deleted) {
      res.status(404).json({ error: "Configuración no encontrada" });
      return;
    }
    req.log.info({ guideId }, "guide config deleted");
    res.status(204).end();
  } catch (err) {
    req.log.error({ err }, "error deleting guide config");
    res.status(500).json({ error: "Error al eliminar la configuración" });
  }
});

// ── Tag options ────────────────────────────────────────────────────────────

router.get("/admin/tag-options", requireAuth, requireRole("admin"), async (req, res) => {
  const parsedQuery = z
    .object({ type: z.string().trim().min(1).max(60).optional() })
    .safeParse(req.query);
  if (!parsedQuery.success) {
    res.status(400).json({ error: "Parámetros inválidos" });
    return;
  }
  const type = parsedQuery.data.type;
  try {
    const rows = await db
      .select()
      .from(catalogTagOptionsTable)
      .where(type ? eq(catalogTagOptionsTable.type, type) : undefined)
      .orderBy(catalogTagOptionsTable.createdAt);
    res.json(rows);
  } catch (err) {
    req.log.error({ err }, "error fetching tag options");
    res.status(500).json({ error: "Error al obtener etiquetas" });
  }
});

router.post("/admin/tag-options", requireAuth, requireRole("admin"), async (req, res) => {
  const parsedBody = z
    .object({
      type: z.string().trim().min(1, "type es requerido").max(60),
      label: z.string().trim().min(1, "label es requerido").max(120),
    })
    .safeParse(req.body);
  if (!parsedBody.success) {
    res.status(400).json({ error: "type y label son requeridos" });
    return;
  }
  const { type, label } = parsedBody.data;
  try {
    const [row] = await db
      .insert(catalogTagOptionsTable)
      .values({ type, label })
      .returning();
    req.log.info({ type, label }, "tag option created");
    res.status(201).json(row);
  } catch (err) {
    req.log.error({ err }, "error creating tag option");
    res.status(500).json({ error: "Error al crear etiqueta" });
  }
});

router.delete("/admin/tag-options/:id", requireAuth, requireRole("admin"), async (req, res) => {
  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) { res.status(400).json({ error: "ID inválido" }); return; }
  try {
    const [deleted] = await db
      .delete(catalogTagOptionsTable)
      .where(eq(catalogTagOptionsTable.id, id))
      .returning();
    if (!deleted) { res.status(404).json({ error: "Etiqueta no encontrada" }); return; }
    req.log.info({ id }, "tag option deleted");
    res.status(204).end();
  } catch (err) {
    req.log.error({ err }, "error deleting tag option");
    res.status(500).json({ error: "Error al eliminar etiqueta" });
  }
});

// ── Scene animations (admin) ────────────────────────────────────────────────

function serializeScene(s: SceneAnimation) {
  return {
    id: s.id,
    name: s.name,
    description: s.description ?? null,
    phrase: s.phrase ?? null,
    recipe: s.recipe,
    isActive: s.isActive,
    isPremium: s.isPremium,
    sortOrder: s.sortOrder,
    submittedBy: s.submittedBy ?? null,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  };
}

// GET /admin/scene-animations — listar todas las escenas (admin).
router.get("/admin/scene-animations", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const rows = await db
      .select()
      .from(sceneAnimationsTable)
      .orderBy(asc(sceneAnimationsTable.sortOrder), desc(sceneAnimationsTable.createdAt));
    res.json({ scenes: rows.map(serializeScene) });
  } catch (err) {
    req.log.error({ err }, "error fetching scene animations (admin)");
    res.status(500).json({ error: "Error al obtener escenas" });
  }
});

const MAX_ACTIVE_SCENES = 9;

// POST /admin/scene-animations — crear una escena (admin).
router.post("/admin/scene-animations", requireAuth, requireRole("admin"), async (req, res) => {
  const parsed = CreateSceneAnimationSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Datos inválidos", details: parsed.error.issues });
    return;
  }
  try {
    if (parsed.data.isActive) {
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(sceneAnimationsTable)
        .where(eq(sceneAnimationsTable.isActive, true));
      if (count >= MAX_ACTIVE_SCENES) {
        res.status(409).json({ error: `Límite alcanzado: solo puede haber ${MAX_ACTIVE_SCENES} escenas activas simultáneas.` });
        return;
      }
    }
    const [scene] = await db
      .insert(sceneAnimationsTable)
      .values({
        name: parsed.data.name,
        description: parsed.data.description ?? null,
        phrase: parsed.data.phrase ?? null,
        recipe: parsed.data.recipe,
        isActive: parsed.data.isActive ?? false,
        isPremium: parsed.data.isPremium ?? false,
        sortOrder: parsed.data.sortOrder ?? 0,
        updatedAt: new Date(),
      })
      .returning();
    req.log.info({ sceneId: scene.id }, "scene animation created");
    res.status(201).json(serializeScene(scene));
  } catch (err) {
    req.log.error({ err }, "error creating scene animation");
    res.status(500).json({ error: "Error al crear la escena" });
  }
});

// PATCH /admin/scene-animations/:id — actualizar una escena (admin).
router.patch("/admin/scene-animations/:id", requireAuth, requireRole("admin"), async (req, res) => {
  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) { res.status(400).json({ error: "ID inválido" }); return; }
  const parsed = UpdateSceneAnimationSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Datos inválidos", details: parsed.error.issues });
    return;
  }
  try {
    if (parsed.data.isActive === true) {
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(sceneAnimationsTable)
        .where(and(eq(sceneAnimationsTable.isActive, true), ne(sceneAnimationsTable.id, id)));
      if (count >= MAX_ACTIVE_SCENES) {
        res.status(409).json({ error: `Límite alcanzado: solo puede haber ${MAX_ACTIVE_SCENES} escenas activas simultáneas.` });
        return;
      }
    }
    const [updated] = await db
      .update(sceneAnimationsTable)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(sceneAnimationsTable.id, id))
      .returning();
    if (!updated) { res.status(404).json({ error: "Escena no encontrada" }); return; }
    req.log.info({ sceneId: id }, "scene animation updated");
    res.json(serializeScene(updated));
  } catch (err) {
    req.log.error({ err }, "error updating scene animation");
    res.status(500).json({ error: "Error al actualizar la escena" });
  }
});

// DELETE /admin/scene-animations/:id — eliminar una escena (admin).
router.delete("/admin/scene-animations/:id", requireAuth, requireRole("admin"), async (req, res) => {
  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) { res.status(400).json({ error: "ID inválido" }); return; }
  try {
    const [deleted] = await db
      .delete(sceneAnimationsTable)
      .where(eq(sceneAnimationsTable.id, id))
      .returning();
    if (!deleted) { res.status(404).json({ error: "Escena no encontrada" }); return; }
    req.log.info({ sceneId: id }, "scene animation deleted");
    res.status(204).end();
  } catch (err) {
    req.log.error({ err }, "error deleting scene animation");
    res.status(500).json({ error: "Error al eliminar la escena" });
  }
});

// ── Explore sections ────────────────────────────────────────────────────────

// Tags fijos que se usan como seed inicial
const DEFAULT_EXPLORE_SLUGS = [
  "para-la-ansiedad",
  "energiza-tus-mananas",
  "foco-concentracion",
  "suelto-la-rabia",
  "crecimiento-personal",
  "armonia-familiar",
  "respiracion-consciente",
  "meditaciones-activas",
  "astrologia",
];

const DEFAULT_EXPLORE_LABELS: Record<string, string> = {
  "para-la-ansiedad":       "Para la ansiedad",
  "energiza-tus-mananas":   "Energiza tus mañanas",
  "foco-concentracion":     "Foco y concentración",
  "suelto-la-rabia":        "Suelto la Rabia",
  "crecimiento-personal":   "Crecimiento personal",
  "armonia-familiar":       "Armonía familiar",
  "respiracion-consciente": "Respiración consciente",
  "meditaciones-activas":   "Meditaciones Activas",
  "astrologia":             "Astrología",
};

function serializeExploreSection(s: ExploreSection) {
  return {
    id:        s.id,
    slug:      s.slug,
    label:     s.label,
    visible:   s.visible,
    sortOrder: s.sortOrder,
  };
}

/** Convierte un label de tag a un slug simple (minúsculas, sin acentos, guiones). */
function labelToSlug(label: string): string {
  return label
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Asegura que existan en explore_sections:
 * 1. Los 9 tags fijos por defecto.
 * 2. Cualquier themeTag único que ya esté en sesiones de la DB.
 * Llamado en el GET para auto-seed.
 */
async function ensureDefaultSections() {
  const existing = await db
    .select({ slug: exploreSectionsTable.slug, sortOrder: exploreSectionsTable.sortOrder })
    .from(exploreSectionsTable);
  const existingSlugs = new Set(existing.map((r) => r.slug));
  const maxOrder = existing.reduce((m, r) => Math.max(m, r.sortOrder), -1);

  // 1. Tags fijos que faltan
  const missingDefaults = DEFAULT_EXPLORE_SLUGS.filter((s) => !existingSlugs.has(s));

  // 2. Tags custom en sesiones que aún no tienen entrada
  const sessionRows = await db
    .select({ themeTag: catalogSessionsTable.themeTag })
    .from(catalogSessionsTable)
    .where(sql`theme_tag is not null`);

  const customLabels = new Set<string>();
  for (const row of sessionRows) {
    for (const tag of row.themeTag ?? []) {
      const slug = labelToSlug(tag);
      if (!existingSlugs.has(slug) && !DEFAULT_EXPLORE_SLUGS.includes(slug)) {
        customLabels.add(slug);
      }
    }
  }

  // Reconstruir mapa slug→label para los custom
  const customLabelMap = new Map<string, string>();
  for (const row of sessionRows) {
    for (const tag of row.themeTag ?? []) {
      const slug = labelToSlug(tag);
      if (customLabels.has(slug)) customLabelMap.set(slug, tag);
    }
  }

  const toInsert: { slug: string; label: string; visible: boolean; sortOrder: number }[] = [];
  let nextOrder = maxOrder + 1;

  for (const slug of missingDefaults) {
    toInsert.push({
      slug,
      label:     DEFAULT_EXPLORE_LABELS[slug] ?? slug,
      visible:   true,
      sortOrder: DEFAULT_EXPLORE_SLUGS.indexOf(slug),
    });
  }

  for (const slug of customLabels) {
    toInsert.push({
      slug,
      label:     customLabelMap.get(slug) ?? slug,
      visible:   true,
      sortOrder: nextOrder++,
    });
  }

  if (toInsert.length === 0) return;
  await db.insert(exploreSectionsTable).values(toInsert);
}

// GET /admin/explore-sections — listar todas las secciones con su orden y visibilidad.
router.get("/admin/explore-sections", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    await ensureDefaultSections();
    const rows = await db
      .select()
      .from(exploreSectionsTable)
      .orderBy(asc(exploreSectionsTable.sortOrder), asc(exploreSectionsTable.id));
    res.json({ sections: rows.map(serializeExploreSection) });
  } catch (err) {
    req.log.error({ err }, "error fetching explore sections");
    res.status(500).json({ error: "Error al obtener secciones" });
  }
});

// GET /explore-sections — versión pública para la app mobile (sin auth).
router.get("/explore-sections", async (req, res) => {
  try {
    await ensureDefaultSections();
    const rows = await db
      .select()
      .from(exploreSectionsTable)
      .orderBy(asc(exploreSectionsTable.sortOrder), asc(exploreSectionsTable.id));
    res.json({ sections: rows.map(serializeExploreSection) });
  } catch (err) {
    req.log.error({ err }, "error fetching explore sections (public)");
    res.status(500).json({ error: "Error al obtener secciones" });
  }
});

// PATCH /admin/explore-sections — actualizar orden y visibilidad de una lista de secciones.
// Body: { sections: [{ id, sortOrder, visible }] }
router.patch("/admin/explore-sections", requireAuth, requireRole("admin"), async (req, res) => {
  const parsedBody = z
    .object({
      sections: z
        .array(
          z.object({
            id: z.coerce.number().int(),
            visible: z.boolean().optional(),
            sortOrder: z.number().int().optional(),
          }),
        )
        .min(1),
    })
    .safeParse(req.body);
  if (!parsedBody.success) {
    res.status(400).json({ error: "Se esperaba un array de secciones" });
    return;
  }
  const items = parsedBody.data.sections;
  try {
    await db.transaction(async (tx) => {
      for (const item of items) {
        const id = item.id;
        const updates: Partial<{ visible: boolean; sortOrder: number }> = {};
        if (item.visible !== undefined) updates.visible = item.visible;
        if (item.sortOrder !== undefined) updates.sortOrder = item.sortOrder;
        if (Object.keys(updates).length === 0) continue;
        await tx
          .update(exploreSectionsTable)
          .set({ ...updates, updatedAt: new Date() })
          .where(eq(exploreSectionsTable.id, id));
      }
    });
    const rows = await db
      .select()
      .from(exploreSectionsTable)
      .orderBy(asc(exploreSectionsTable.sortOrder), asc(exploreSectionsTable.id));
    req.log.info({ count: items.length }, "explore sections updated");
    res.json({ sections: rows.map(serializeExploreSection) });
  } catch (err) {
    req.log.error({ err }, "error updating explore sections");
    res.status(500).json({ error: "Error al actualizar secciones" });
  }
});

// POST /admin/explore-sections — agregar una sección nueva (tag custom no en la lista por defecto).
router.post("/admin/explore-sections", requireAuth, requireRole("admin"), async (req, res) => {
  const parsedBody = z
    .object({
      slug: z.string().trim().min(1, "slug es requerido").max(60),
      label: z.string().trim().min(1, "label es requerido").max(120),
    })
    .safeParse(req.body);
  if (!parsedBody.success) {
    res.status(400).json({ error: "slug y label son requeridos" });
    return;
  }
  const { slug, label } = parsedBody.data;
  try {
    const [maxRow] = await db
      .select({ max: sql<number>`max(sort_order)` })
      .from(exploreSectionsTable);
    const nextOrder = (maxRow?.max ?? -1) + 1;
    const [row] = await db
      .insert(exploreSectionsTable)
      .values({ slug: slug.trim(), label: label.trim(), visible: true, sortOrder: nextOrder })
      .returning();
    req.log.info({ slug, label }, "explore section created");
    res.status(201).json(serializeExploreSection(row!));
  } catch (err) {
    req.log.error({ err }, "error creating explore section");
    res.status(500).json({ error: "Error al crear sección" });
  }
});

// DELETE /admin/explore-sections/:id — eliminar una sección custom.
router.delete("/admin/explore-sections/:id", requireAuth, requireRole("admin"), async (req, res) => {
  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) { res.status(400).json({ error: "ID inválido" }); return; }
  try {
    const [deleted] = await db
      .delete(exploreSectionsTable)
      .where(eq(exploreSectionsTable.id, id))
      .returning();
    if (!deleted) { res.status(404).json({ error: "Sección no encontrada" }); return; }
    req.log.info({ id }, "explore section deleted");
    res.status(204).end();
  } catch (err) {
    req.log.error({ err }, "error deleting explore section");
    res.status(500).json({ error: "Error al eliminar sección" });
  }
});

export default router;
