import { Router, type IRouter } from "express";
import { z } from "zod";
import { z as zod4 } from "zod/v4";
import { and, asc, count, desc, eq, ilike, inArray, ne, or, sql } from "drizzle-orm";
import {
  db,
  usersTable,
  catalogCategoriesTable,
  catalogSessionsTable,
  catalogPlaylistsTable,
  catalogPlaylistPlacementsTable,
  catalogPlaylistCarouselsTable,
  catalogPlaylistCarouselMembershipsTable,
  playbackHistoryTable,
  sharedMixesTable,
  sharedMixReportsTable,
  mixerSoundsTable,
  guideConfigsTable,
  insertMixerSoundSchema,
  updateMixerSoundSchema,
  insertCatalogPlaylistSchema,
  updateCatalogPlaylistSchema,
  EDITORIAL_PLAYLIST_SURFACES,
  insertGuideConfigSchema,
  updateGuideConfigSchema,
  sceneAnimationsTable,
  CreateSceneAnimationSchema,
  UpdateSceneAnimationSchema,
  type CatalogCategory,
  type CatalogPlaylist,
  type CatalogPlaylistPlacement,
  type CatalogPlaylistCarousel,
  type InsertCatalogPlaylist,
  type UpdateCatalogPlaylist,
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
import { loadPlaylistCarousels } from "../lib/playlistCarousels";
import { getSleepCarouselProjection, updateSleepCarouselOrder } from "../lib/sleepCarouselOrder";

const router: IRouter = Router();

router.get("/admin/sleep-carousel-order", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  try {
    const projection = await getSleepCarouselProjection();
    res.json({ carousels: projection.carousels, revision: projection.revision });
  } catch (err) {
    req.log.error({ err }, "error fetching sleep carousel order");
    res.status(500).json({ error: "Error al obtener el orden de descanso" });
  }
});

router.patch("/admin/sleep-carousel-order", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const parsed = z.object({
    revision: z.string().min(1),
    carousels: z.array(z.object({
      key: z.string().min(1),
      visible: z.boolean(),
    })).min(1),
  }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Se esperaba un array de carousels" });
    return;
  }
  try {
    const result = await updateSleepCarouselOrder(parsed.data.revision, parsed.data.carousels);
    if (result.status === "stale") {
      res.status(409).json({ error: "La configuración cambió; vuelve a cargarla" });
      return;
    }
    res.json({ carousels: result.projection.carousels, revision: result.projection.revision });
  } catch (err) {
    if (err instanceof Error && err.message === "invalid_keys") {
      res.status(400).json({ error: "Las claves deben coincidir exactamente con los carousels existentes" });
      return;
    }
    req.log.error({ err }, "error updating sleep carousel order");
    res.status(500).json({ error: "Error al actualizar el orden de descanso" });
  }
});

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
    showInMeditationBackgrounds: s.showInMeditationBackgrounds,
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

const editorialPlaylistPlacementSchema = zod4
  .object({
    surface: zod4.enum(EDITORIAL_PLAYLIST_SURFACES),
    sortOrder: zod4.number().int().min(0),
    isActive: zod4.boolean(),
  })
  .strict();
type EditorialPlaylistPlacementInput = zod4.infer<
  typeof editorialPlaylistPlacementSchema
>;

const editorialPlaylistTypeSchema = zod4.enum([
  "meditative",
  "relaxation",
  "ritual",
  "none",
]);

const adminPlaylistInputSchema = insertCatalogPlaylistSchema
  .extend({
    // Keep the database default for legacy rows/migrations, but require the
    // editorial choice at the public admin API boundary.
    editorialType: editorialPlaylistTypeSchema,
    placements: zod4.array(editorialPlaylistPlacementSchema).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.isActive !== false && !value.durationLabel?.trim()) {
      ctx.addIssue({
        code: zod4.ZodIssueCode.custom,
        path: ["durationLabel"],
        message: "La duración es obligatoria para playlists activas",
      });
    }
    const placements = value.placements as
      | EditorialPlaylistPlacementInput[]
      | undefined;
    if (!placements) return;
    const surfaces = placements.map((placement) => placement.surface);
    if (new Set(surfaces).size !== surfaces.length) {
      ctx.addIssue({
        code: zod4.ZodIssueCode.custom,
        path: ["placements"],
        message: "Solo puede existir una ubicación por superficie",
      });
    }
  });

const adminPlaylistUpdateSchema = updateCatalogPlaylistSchema
  .extend({
    editorialType: editorialPlaylistTypeSchema.optional(),
    placements: zod4.array(editorialPlaylistPlacementSchema).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.isActive === true && value.durationLabel !== undefined && !value.durationLabel.trim()) {
      ctx.addIssue({
        code: zod4.ZodIssueCode.custom,
        path: ["durationLabel"],
        message: "La duración es obligatoria para playlists activas",
      });
    }
    const placements = value.placements as
      | EditorialPlaylistPlacementInput[]
      | undefined;
    if (!placements) return;
    const surfaces = placements.map((placement) => placement.surface);
    if (new Set(surfaces).size !== surfaces.length) {
      ctx.addIssue({
        code: zod4.ZodIssueCode.custom,
        path: ["placements"],
        message: "Solo puede existir una ubicación por superficie",
      });
    }
  });

function serializePlacement(p: CatalogPlaylistPlacement) {
  return {
    surface: p.surface,
    sortOrder: p.sortOrder,
    isActive: p.isActive,
  };
}

function serializePlaylist(
  p: CatalogPlaylist,
  placements: CatalogPlaylistPlacement[] = [],
) {
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
    editorialType: p.editorialType,
    sortOrder: p.sortOrder,
    isActive: p.isActive,
    showOnHome: p.showOnHome,
    homePosition: p.homePosition ?? null,
    placements: placements.map(serializePlacement),
  };
}

async function loadPlaylistPlacements(playlistIds: number[]) {
  const byPlaylist = new Map<number, CatalogPlaylistPlacement[]>();
  if (playlistIds.length === 0) return byPlaylist;
  const rows = await db
    .select()
    .from(catalogPlaylistPlacementsTable)
    .where(inArray(catalogPlaylistPlacementsTable.playlistId, playlistIds))
    .orderBy(
      asc(catalogPlaylistPlacementsTable.surface),
      asc(catalogPlaylistPlacementsTable.sortOrder),
      asc(catalogPlaylistPlacementsTable.id),
    );
  for (const row of rows) {
    const list = byPlaylist.get(row.playlistId) ?? [];
    list.push(row);
    byPlaylist.set(row.playlistId, list);
  }
  return byPlaylist;
}

async function validatePublishedPlaylistSessions(
  sessionIds: string[],
  requireAtLeastOne = false,
) {
  if (new Set(sessionIds).size !== sessionIds.length) {
    return "Una playlist no puede contener sesiones duplicadas";
  }
  if (sessionIds.some((sessionId) => typeof sessionId !== "string" || !sessionId.trim())) {
    return "Los IDs de sesión deben ser textos no vacíos";
  }
  if (sessionIds.length === 0) {
    return requireAtLeastOne
      ? "La playlist debe incluir al menos una sesión publicada"
      : null;
  }

  const sessions = await db
    .select({ id: catalogSessionsTable.id, status: catalogSessionsTable.status })
    .from(catalogSessionsTable)
    .where(inArray(catalogSessionsTable.id, sessionIds));
  const published = new Set(
    sessions
      .filter((session) => session.status === "published")
      .map((session) => session.id),
  );
  const unavailable = sessionIds.filter((sessionId) => !published.has(sessionId));
  if (unavailable.length > 0) {
    return `Las sesiones no están publicadas o no existen: ${unavailable.join(", ")}`;
  }
  return null;
}

async function replacePlaylistPlacements(
  tx: Pick<typeof db, "delete" | "insert" | "select" | "execute">,
  playlistId: number,
  placements: EditorialPlaylistPlacementInput[],
) {
  // There are only two editorial surfaces for now. Lock both before reading
  // the playlist so a concurrent update cannot change the set of surfaces
  // between the read and the resequencing pass.
  for (const surface of EDITORIAL_PLAYLIST_SURFACES) {
    await tx.execute(
      sql`select pg_advisory_xact_lock(hashtextextended(${surface}, 0))`,
    );
  }
  const existingForPlaylist = await tx
    .select()
    .from(catalogPlaylistPlacementsTable)
    .where(eq(catalogPlaylistPlacementsTable.playlistId, playlistId));
  const surfaces = [
    ...new Set([
      ...existingForPlaylist.map((placement) => placement.surface),
      ...placements.map((placement) => placement.surface),
    ]),
  ] as (typeof EDITORIAL_PLAYLIST_SURFACES)[number][];
  if (surfaces.length === 0) return;

  const rows = await tx
    .select()
    .from(catalogPlaylistPlacementsTable)
    .where(inArray(catalogPlaylistPlacementsTable.surface, surfaces));
  const nextRows: Array<{
    playlistId: number;
    surface: (typeof EDITORIAL_PLAYLIST_SURFACES)[number];
    sortOrder: number;
    isActive: boolean;
  }> = [];

  for (const surface of surfaces) {
    const retained = rows
      .filter(
        (placement) =>
          placement.surface === surface && placement.playlistId !== playlistId,
      )
      .sort(
        (a, b) =>
          a.sortOrder - b.sortOrder ||
          a.id - b.id,
      );
    const requested = placements.find((placement) => placement.surface === surface);
    if (requested) {
      const hasCollision = retained.some(
        (placement) => placement.sortOrder === requested.sortOrder,
      );
      if (hasCollision) {
        for (const placement of retained) {
          if (placement.sortOrder >= requested.sortOrder) {
            placement.sortOrder += 1;
          }
        }
      }
      retained.push({
        id: Number.MAX_SAFE_INTEGER,
        playlistId,
        surface,
        sortOrder: requested.sortOrder,
        isActive: requested.isActive,
        createdAt: new Date(0),
        updatedAt: new Date(0),
      });
      retained.sort(
        (a, b) =>
          a.sortOrder - b.sortOrder ||
          a.id - b.id,
      );
    }
    retained.forEach((placement) => {
      nextRows.push({
        playlistId: placement.playlistId,
        surface,
        sortOrder: placement.sortOrder,
        isActive: placement.isActive,
      });
    });
  }

  // Rewriting affected surfaces inside the same transaction avoids transient
  // `(surface, sortOrder)` conflicts while all neighboring rows are shifted.
  await tx
    .delete(catalogPlaylistPlacementsTable)
    .where(inArray(catalogPlaylistPlacementsTable.surface, surfaces));
  if (nextRows.length > 0) {
    await tx.insert(catalogPlaylistPlacementsTable).values(nextRows);
  }
}

const playlistCarouselPayloadSchema = zod4
  .object({
    title: zod4.string().trim().min(1).max(120),
    surface: zod4.enum(EDITORIAL_PLAYLIST_SURFACES),
    sortOrder: zod4.number().int().min(0),
    isActive: zod4.boolean(),
    playlistIds: zod4
      .array(
        zod4
          .string()
          .trim()
          .min(1)
          .max(80),
      )
      .refine((ids) => new Set(ids).size === ids.length, {
        message: "Una playlist no puede repetirse dentro del mismo carrusel",
      }),
  })
  .strict();
const playlistCarouselPatchSchema = playlistCarouselPayloadSchema
  .partial()
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "No hay campos para actualizar",
  });

type PlaylistCarouselPayload = zod4.infer<typeof playlistCarouselPayloadSchema>;
type PlaylistCarouselPatch = zod4.infer<typeof playlistCarouselPatchSchema>;
type CarouselTx = Pick<
  typeof db,
  "delete" | "insert" | "select" | "update" | "execute"
>;

function serializePlaylistCarousel(carousel: CatalogPlaylistCarousel, playlistIds: string[]) {
  return {
    id: carousel.id,
    title: carousel.title,
    surface: carousel.surface,
    sortOrder: carousel.sortOrder,
    isActive: carousel.isActive,
    playlistIds,
  };
}

async function lockPlaylistCarouselOrdering(tx: CarouselTx) {
  // A single lock covers both surfaces and makes concurrent insert/move
  // requests deterministic without relying on transient unique-index gaps.
  await tx.execute(
    sql`select pg_advisory_xact_lock(hashtextextended('catalog-playlist-carousels', 0))`,
  );
}

async function setTemporaryCarouselOrders(
  tx: CarouselTx,
  rows: CatalogPlaylistCarousel[],
) {
  if (rows.length === 0) return;
  await tx
    .update(catalogPlaylistCarouselsTable)
    .set({ sortOrder: sql`-${catalogPlaylistCarouselsTable.id}` })
    .where(inArray(catalogPlaylistCarouselsTable.id, rows.map((row) => row.id)));
}

async function writeCarouselOrders(
  tx: CarouselTx,
  rowsBySurface: Map<"discover" | "sleep", CatalogPlaylistCarousel[]>,
) {
  for (const surface of EDITORIAL_PLAYLIST_SURFACES) {
    const rows = rowsBySurface.get(surface) ?? [];
    for (const row of rows) {
      await tx
        .update(catalogPlaylistCarouselsTable)
        .set({ sortOrder: row.sortOrder, updatedAt: new Date() })
        .where(eq(catalogPlaylistCarouselsTable.id, row.id));
    }
  }
}

async function validateCarouselPlaylistIds(
  tx: Pick<typeof db, "select">,
  playlistIds: string[],
) {
  if (playlistIds.length === 0) return new Map<string, number>();
  const rows = await tx
    .select({ id: catalogPlaylistsTable.id, slug: catalogPlaylistsTable.slug })
    .from(catalogPlaylistsTable)
    .where(inArray(catalogPlaylistsTable.slug, playlistIds));
  const bySlug = new Map(rows.map((row) => [row.slug, row.id]));
  const missing = playlistIds.filter((slug) => !bySlug.has(slug));
  if (missing.length > 0) {
    return { missing };
  }
  return bySlug;
}

async function replaceCarouselMemberships(
  tx: CarouselTx,
  carouselId: number,
  playlistIds: string[],
  playlistBySlug: Map<string, number>,
) {
  await tx
    .delete(catalogPlaylistCarouselMembershipsTable)
    .where(eq(catalogPlaylistCarouselMembershipsTable.carouselId, carouselId));
  if (playlistIds.length === 0) return;
  await tx.insert(catalogPlaylistCarouselMembershipsTable).values(
    playlistIds.map((slug, sortOrder) => ({
      carouselId,
      playlistId: playlistBySlug.get(slug)!,
      sortOrder,
    })),
  );
}

/**
 * Keep the requested numeric order when there is room, while shifting only
 * colliding neighbors. This preserves existing order values and mirrors the
 * legacy placement contract (e.g. a first item requested at order 2 stays at
 * order 2 rather than being silently rewritten to order 0).
 */
function placeCarouselAtOrder(
  rows: CatalogPlaylistCarousel[],
  target: CatalogPlaylistCarousel,
  sortOrder: number,
) {
  const shifted = rows
    .filter((row) => row.id !== target.id)
    .map((row) =>
      row.sortOrder >= sortOrder
        ? { ...row, sortOrder: row.sortOrder + 1 }
        : row,
    );
  shifted.push({ ...target, sortOrder });
  return shifted.sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
}

// GET /admin/playlists — listar todas las playlists (admin).
router.get("/admin/playlists", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const rows = await db
      .select()
      .from(catalogPlaylistsTable)
      .orderBy(asc(catalogPlaylistsTable.sortOrder), asc(catalogPlaylistsTable.id));
    const placements = await loadPlaylistPlacements(rows.map((row) => row.id));
    res.json(rows.map((row) => serializePlaylist(row, placements.get(row.id))));
  } catch (err) {
    req.log.error({ err }, "error listing playlists");
    res.status(500).json({ error: "Error al cargar las playlists" });
  }
});

// POST /admin/playlists — crear una playlist.
router.post("/admin/playlists", requireAuth, requireRole("admin"), async (req, res) => {
  const parsed = adminPlaylistInputSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const {
    placements = [],
    ...playlistValues
  } = parsed.data as InsertCatalogPlaylist & {
    placements?: EditorialPlaylistPlacementInput[];
  };
  if (playlistValues.isActive !== false && !playlistValues.durationLabel?.trim()) {
    res.status(400).json({
      code: "INVALID_PLAYLIST_DURATION",
      error: "La duración es obligatoria para playlists activas",
    });
    return;
  }
  const sessionError = await validatePublishedPlaylistSessions(
    playlistValues.sessionIds ?? [],
  );
  if (sessionError) {
    res.status(400).json({ code: "INVALID_PLAYLIST_SESSIONS", error: sessionError });
    return;
  }
  try {
    const created = await db.transaction(async (tx) => {
      const [playlist] = await tx
        .insert(catalogPlaylistsTable)
        .values(playlistValues)
        .returning();
      await replacePlaylistPlacements(tx, playlist.id, placements);
      return playlist;
    });
    req.log.info({ playlistId: created.id, slug: created.slug }, "admin playlist created");
    res.status(201).json(
      serializePlaylist(
        created,
        (await loadPlaylistPlacements([created.id])).get(created.id),
      ),
    );
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
  const parsed = adminPlaylistUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  try {
    const [current] = await db
      .select()
      .from(catalogPlaylistsTable)
      .where(eq(catalogPlaylistsTable.id, id))
      .limit(1);
    if (!current) {
      res.status(404).json({ error: "Playlist no encontrada" });
      return;
    }
    const { placements, ...playlistValues } = parsed.data as UpdateCatalogPlaylist & {
      placements?: EditorialPlaylistPlacementInput[];
    };
    const sessionIds = playlistValues.sessionIds ?? current.sessionIds ?? [];
    const effectiveActive = playlistValues.isActive ?? current.isActive;
    const effectiveDuration = playlistValues.durationLabel ?? current.durationLabel;
    if (effectiveActive && !effectiveDuration.trim()) {
      res.status(400).json({
        code: "INVALID_PLAYLIST_DURATION",
        error: "La duración es obligatoria para playlists activas",
      });
      return;
    }
    const sessionIdsChanged =
      playlistValues.sessionIds !== undefined &&
      (playlistValues.sessionIds.length !== current.sessionIds.length ||
        playlistValues.sessionIds.some(
          (sessionId, index) => sessionId !== current.sessionIds[index],
        ));
    const becomingActive = playlistValues.isActive === true && !current.isActive;
    const shouldValidateSessions =
      sessionIdsChanged ||
      becomingActive ||
      placements?.some((placement) => placement.isActive) === true;
    if (shouldValidateSessions) {
      const sessionError = await validatePublishedPlaylistSessions(
        sessionIds,
        playlistValues.isActive === true,
      );
      if (sessionError) {
        res.status(400).json({
          code: "INVALID_PLAYLIST_SESSIONS",
          error: sessionError,
        });
        return;
      }
    }
    const updated = await db.transaction(async (tx) => {
      const [playlist] = await tx
        .update(catalogPlaylistsTable)
        .set({ ...playlistValues, updatedAt: new Date() })
        .where(eq(catalogPlaylistsTable.id, id))
        .returning();
      if (placements !== undefined) {
        await replacePlaylistPlacements(tx, id, placements);
      }
      return playlist;
    });
    if (!updated) {
      res.status(404).json({ error: "Playlist no encontrada" });
      return;
    }
    req.log.info({ playlistId: id }, "admin playlist updated");
    res.json(
      serializePlaylist(
        updated,
        (await loadPlaylistPlacements([updated.id])).get(updated.id),
      ),
    );
  } catch (err: unknown) {
    const e = err as { code?: string };
    if (e?.code === "23505") {
      res.status(409).json({ error: "Ya existe una playlist con ese slug" });
      return;
    }
    req.log.error({ err }, "error updating playlist");
    res.status(500).json({ error: "Error al actualizar la playlist" });
  }
});

// POST /admin/playlists/:id/publish — publicar una playlist y sus ubicaciones.
router.post(
  "/admin/playlists/:id/publish",
  requireAuth,
  requireRole("admin"),
  async (req, res) => {
    const id = parseInt(String(req.params.id), 10);
    if (!Number.isInteger(id)) {
      res.status(400).json({ error: "ID inválido" });
      return;
    }
    try {
      const [current] = await db
        .select()
        .from(catalogPlaylistsTable)
        .where(eq(catalogPlaylistsTable.id, id))
        .limit(1);
      if (!current) {
        res.status(404).json({ error: "Playlist no encontrada" });
        return;
      }
      if (!current.durationLabel.trim()) {
        res.status(400).json({
          code: "INVALID_PLAYLIST_DURATION",
          error: "La duración es obligatoria para playlists activas",
        });
        return;
      }
      const sessionError = await validatePublishedPlaylistSessions(
        current.sessionIds ?? [],
        true,
      );
      if (sessionError) {
        res.status(400).json({
          code: "INVALID_PLAYLIST_SESSIONS",
          error: sessionError,
        });
        return;
      }
      const [published] = await db
        .update(catalogPlaylistsTable)
        .set({ isActive: true, updatedAt: new Date() })
        .where(eq(catalogPlaylistsTable.id, id))
        .returning();
      res.json(
        serializePlaylist(
          published,
          (await loadPlaylistPlacements([id])).get(id),
        ),
      );
    } catch (err) {
      req.log.error({ err }, "error publishing playlist");
      res.status(500).json({ error: "Error al publicar la playlist" });
    }
  },
);

// POST /admin/playlists/:id/hide — ocultar una playlist sin borrar su contenido.
router.post(
  "/admin/playlists/:id/hide",
  requireAuth,
  requireRole("admin"),
  async (req, res) => {
    const id = parseInt(String(req.params.id), 10);
    if (!Number.isInteger(id)) {
      res.status(400).json({ error: "ID inválido" });
      return;
    }
    try {
      const [hidden] = await db
        .update(catalogPlaylistsTable)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(catalogPlaylistsTable.id, id))
        .returning();
      if (!hidden) {
        res.status(404).json({ error: "Playlist no encontrada" });
        return;
      }
      res.json(
        serializePlaylist(
          hidden,
          (await loadPlaylistPlacements([id])).get(id),
        ),
      );
    } catch (err) {
      req.log.error({ err }, "error hiding playlist");
      res.status(500).json({ error: "Error al ocultar la playlist" });
    }
  },
);

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

// ── Admin playlist carousels ────────────────────────────────────────────────

// GET /admin/playlist-carousels — returns hidden and empty editorial groups.
router.get(
  "/admin/playlist-carousels",
  requireAuth,
  requireRole("admin"),
  async (req, res) => {
    try {
      res.json(await loadPlaylistCarousels(false));
    } catch (err) {
      req.log.error({ err }, "error listing playlist carousels");
      res.status(500).json({ error: "Error al cargar los carruseles" });
    }
  },
);

// POST /admin/playlist-carousels — create a named editorial group.
router.post(
  "/admin/playlist-carousels",
  requireAuth,
  requireRole("admin"),
  async (req, res) => {
    const parsed = playlistCarouselPayloadSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const payload: PlaylistCarouselPayload = parsed.data;
    try {
      const created = await db.transaction(async (tx) => {
        const playlistBySlug = await validateCarouselPlaylistIds(tx, payload.playlistIds);
        if ("missing" in playlistBySlug) {
          throw {
            code: "UNKNOWN_CAROUSEL_PLAYLISTS",
            missing: playlistBySlug.missing,
          };
        }
        await lockPlaylistCarouselOrdering(tx);
        const rows = await tx
          .select()
          .from(catalogPlaylistCarouselsTable)
          .orderBy(
            asc(catalogPlaylistCarouselsTable.surface),
            asc(catalogPlaylistCarouselsTable.sortOrder),
            asc(catalogPlaylistCarouselsTable.id),
          );
        await setTemporaryCarouselOrders(tx, rows);
        const temporarySortOrder =
          -(Math.max(0, ...rows.map((candidate) => candidate.id)) + 1);
        const [row] = await tx
          .insert(catalogPlaylistCarouselsTable)
          .values({
            title: payload.title,
            surface: payload.surface,
            // The temporary value is replaced below after all affected rows
            // have been moved out of the unique-index range.
            sortOrder: temporarySortOrder,
            isActive: payload.isActive,
          })
          .returning();
        const rowsBySurface = new Map<"discover" | "sleep", CatalogPlaylistCarousel[]>();
        for (const surface of EDITORIAL_PLAYLIST_SURFACES) {
          const ordered = rows
            .filter((candidate) => candidate.surface === surface)
            .sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
          if (surface === payload.surface) {
            rowsBySurface.set(
              surface,
              placeCarouselAtOrder(ordered, row, payload.sortOrder),
            );
            continue;
          }
          rowsBySurface.set(surface, ordered);
        }
        await writeCarouselOrders(tx, rowsBySurface);
        await replaceCarouselMemberships(tx, row.id, payload.playlistIds, playlistBySlug);
        return row;
      });
      const response = (await loadPlaylistCarousels(false)).find(
        (carousel) => carousel.id === created.id,
      );
      req.log.info({ carouselId: created.id }, "playlist carousel created");
      res.status(201).json(response ?? serializePlaylistCarousel(created, payload.playlistIds));
    } catch (err: unknown) {
      const error = err as { code?: string; missing?: string[] };
      if (error.code === "UNKNOWN_CAROUSEL_PLAYLISTS") {
        res.status(400).json({
          code: error.code,
          error: `Las playlists no existen: ${(error.missing ?? []).join(", ")}`,
        });
        return;
      }
      if (error.code === "23505") {
        res.status(409).json({ error: "El orden del carrusel ya está ocupado" });
        return;
      }
      req.log.error({ err }, "error creating playlist carousel");
      res.status(500).json({ error: "Error al crear el carrusel" });
    }
  },
);

// PATCH /admin/playlist-carousels/:id — edit metadata, order, or memberships.
router.patch(
  "/admin/playlist-carousels/:id",
  requireAuth,
  requireRole("admin"),
  async (req, res) => {
    const id = parseInt(String(req.params.id), 10);
    if (!Number.isInteger(id)) {
      res.status(400).json({ error: "ID inválido" });
      return;
    }
    const parsed = playlistCarouselPatchSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const payload: PlaylistCarouselPatch = parsed.data;
    try {
      const updated = await db.transaction(async (tx) => {
        await lockPlaylistCarouselOrdering(tx);
        const [current] = await tx
          .select()
          .from(catalogPlaylistCarouselsTable)
          .where(eq(catalogPlaylistCarouselsTable.id, id))
          .for("update")
          .limit(1);
        if (!current) return { kind: "not-found" as const };

        let playlistBySlug = new Map<string, number>();
        if (payload.playlistIds !== undefined) {
          const lookup = await validateCarouselPlaylistIds(tx, payload.playlistIds);
          if ("missing" in lookup) {
            return {
              kind: "unknown-playlists" as const,
              missing: lookup.missing,
            };
          }
          playlistBySlug = lookup;
        }

        const rows = await tx
          .select()
          .from(catalogPlaylistCarouselsTable)
          .orderBy(
            asc(catalogPlaylistCarouselsTable.surface),
            asc(catalogPlaylistCarouselsTable.sortOrder),
            asc(catalogPlaylistCarouselsTable.id),
          );
        await setTemporaryCarouselOrders(tx, rows);

        const destinationSurface = payload.surface ?? current.surface;
        const destinationSortOrder = payload.sortOrder ?? current.sortOrder;
        const updates: Partial<typeof catalogPlaylistCarouselsTable.$inferInsert> = {
          title: payload.title ?? current.title,
          surface: destinationSurface,
          isActive: payload.isActive ?? current.isActive,
          sortOrder: -current.id,
          updatedAt: new Date(),
        };
        const [updatedRow] = await tx
          .update(catalogPlaylistCarouselsTable)
          .set(updates)
          .where(eq(catalogPlaylistCarouselsTable.id, id))
          .returning();
        const rowsBySurface = new Map<"discover" | "sleep", CatalogPlaylistCarousel[]>();
        for (const surface of EDITORIAL_PLAYLIST_SURFACES) {
          const ordered = rows
            .filter(
              (candidate) =>
                candidate.id !== id && candidate.surface === surface,
            )
            .sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
          if (surface === destinationSurface) {
            rowsBySurface.set(
              surface,
              placeCarouselAtOrder(
                ordered,
                updatedRow,
                destinationSortOrder,
              ),
            );
            continue;
          }
          rowsBySurface.set(surface, ordered);
        }
        await writeCarouselOrders(tx, rowsBySurface);
        if (payload.playlistIds !== undefined) {
          await replaceCarouselMemberships(
            tx,
            id,
            payload.playlistIds,
            playlistBySlug,
          );
        }
        return { kind: "updated" as const, row: updatedRow };
      });

      if (updated.kind === "not-found") {
        res.status(404).json({ error: "Carrusel no encontrado" });
        return;
      }
      if (updated.kind === "unknown-playlists") {
        res.status(400).json({
          code: "UNKNOWN_CAROUSEL_PLAYLISTS",
          error: `Las playlists no existen: ${updated.missing.join(", ")}`,
        });
        return;
      }
      const response = (await loadPlaylistCarousels(false)).find(
        (carousel) => carousel.id === updated.row.id,
      );
      req.log.info({ carouselId: id }, "playlist carousel updated");
      res.json(response ?? serializePlaylistCarousel(updated.row, payload.playlistIds ?? []));
    } catch (err: unknown) {
      const error = err as { code?: string };
      if (error.code === "23505") {
        res.status(409).json({ error: "El orden del carrusel ya está ocupado" });
        return;
      }
      req.log.error({ err }, "error updating playlist carousel");
      res.status(500).json({ error: "Error al actualizar el carrusel" });
    }
  },
);

// DELETE /admin/playlist-carousels/:id — remove only the grouping.
router.delete(
  "/admin/playlist-carousels/:id",
  requireAuth,
  requireRole("admin"),
  async (req, res) => {
    const id = parseInt(String(req.params.id), 10);
    if (!Number.isInteger(id)) {
      res.status(400).json({ error: "ID inválido" });
      return;
    }
    try {
      const deleted = await db.transaction(async (tx) => {
        await lockPlaylistCarouselOrdering(tx);
        const [current] = await tx
          .select()
          .from(catalogPlaylistCarouselsTable)
          .where(eq(catalogPlaylistCarouselsTable.id, id))
          .for("update")
          .limit(1);
        if (!current) return null;
        const rows = await tx
          .select()
          .from(catalogPlaylistCarouselsTable)
          .where(eq(catalogPlaylistCarouselsTable.surface, current.surface))
          .orderBy(
            asc(catalogPlaylistCarouselsTable.sortOrder),
            asc(catalogPlaylistCarouselsTable.id),
          );
        await setTemporaryCarouselOrders(tx, rows);
        await tx
          .delete(catalogPlaylistCarouselsTable)
          .where(eq(catalogPlaylistCarouselsTable.id, id));
        const remaining = rows
          .filter((row) => row.id !== id)
          .sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
        await writeCarouselOrders(
          tx,
          new Map([[current.surface, remaining]]),
        );
        return current;
      });
      if (!deleted) {
        res.status(404).json({ error: "Carrusel no encontrado" });
        return;
      }
      req.log.info({ carouselId: id }, "playlist carousel deleted");
      res.status(204).end();
    } catch (err) {
      req.log.error({ err }, "error deleting playlist carousel");
      res.status(500).json({ error: "Error al eliminar el carrusel" });
    }
  },
);

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
    const row = await db.transaction(async (tx) => {
      const duplicate = await tx.select({ id: catalogTagOptionsTable.id })
        .from(catalogTagOptionsTable)
        .where(and(eq(catalogTagOptionsTable.type, type), sql`lower(${catalogTagOptionsTable.label}) = lower(${label})`))
        .limit(1);
      if (duplicate.length) throw new Error("DUPLICATE");
      const [created] = await tx.insert(catalogTagOptionsTable)
        .values({ type, label })
        .returning();
      if (type.endsWith("_hidden")) {
        const baseType = type.slice(0, -"_hidden".length);
        const categoryId = CATEGORY_THEME_TYPE_TO_ID[baseType];
        if (isManagedThemeType(baseType)) {
          const storedLabel = storedCategoryThemeLabel(baseType, label);
          await tx.update(catalogSessionsTable)
            .set({ themeTag: sql`array_remove(${catalogSessionsTable.themeTag}, ${storedLabel})` })
            .where(categoryId
              ? and(
                  eq(catalogSessionsTable.categoryId, categoryId),
                  sql`${catalogSessionsTable.themeTag} @> ARRAY[${storedLabel}]::text[]`,
                )
              : sql`${catalogSessionsTable.themeTag} @> ARRAY[${storedLabel}]::text[]`);
        }
      }
      return created;
    });
    req.log.info({ type, label }, "tag option created");
    res.status(201).json(row);
  } catch (err) {
    if (err instanceof Error && err.message === "DUPLICATE") {
      res.status(409).json({ error: "Ya existe una etiqueta con ese nombre" });
      return;
    }
    req.log.error({ err }, "error creating tag option");
    res.status(500).json({ error: "Error al crear etiqueta" });
  }
});

const CATEGORY_THEME_TYPE_TO_ID: Record<string, string> = {
  theme: "musica-sonidos",
  category_theme_meditaciones: "meditaciones-guiadas",
  category_theme_sonoterapia: "sonidos-ancestrales",
  category_theme_charlas: "charlas",
  category_theme_historias: "historias",
  category_theme_ambientales: "ambientales",
};

const SUPERCATEGORY_THEME_TYPES = new Set([
  "supercategory_theme_descanso",
  "supercategory_theme_sonidos",
]);

function isManagedThemeType(type: string): boolean {
  return Boolean(CATEGORY_THEME_TYPE_TO_ID[type]) || SUPERCATEGORY_THEME_TYPES.has(type);
}

function storedCategoryThemeLabel(type: string, label: string): string {
  return type === "theme" ? label : `__${type}__:${label}`;
}

router.patch("/admin/tag-options", requireAuth, requireRole("admin"), async (req, res) => {
  const parsed = z.object({
    type: z.string().trim().min(1).max(60),
    oldLabel: z.string().trim().min(1).max(120),
    newLabel: z.string().trim().min(1).max(120),
  }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Datos inválidos" });
    return;
  }
  const { type, oldLabel, newLabel } = parsed.data;
  if (oldLabel.toLocaleLowerCase() === newLabel.toLocaleLowerCase()) {
    res.status(400).json({ error: "El nombre nuevo debe ser diferente" });
    return;
  }
  try {
    const result = await db.transaction(async (tx) => {
      const duplicate = await tx.select({ id: catalogTagOptionsTable.id })
        .from(catalogTagOptionsTable)
        .where(and(eq(catalogTagOptionsTable.type, type), sql`lower(${catalogTagOptionsTable.label}) = lower(${newLabel})`))
        .limit(1);
      if (duplicate.length) throw new Error("DUPLICATE");

      const existing = await tx.select().from(catalogTagOptionsTable)
        .where(and(eq(catalogTagOptionsTable.type, type), sql`lower(${catalogTagOptionsTable.label}) = lower(${oldLabel})`))
        .limit(1);
      let row;
      if (existing[0]) {
        [row] = await tx.update(catalogTagOptionsTable)
          .set({ label: newLabel })
          .where(eq(catalogTagOptionsTable.id, existing[0].id))
          .returning();
      } else {
        [row] = await tx.insert(catalogTagOptionsTable).values({ type, label: newLabel }).returning();
        await tx.insert(catalogTagOptionsTable)
          .values({ type: `${type}_hidden`, label: oldLabel });
      }

      const categoryId = CATEGORY_THEME_TYPE_TO_ID[type];
      if (isManagedThemeType(type)) {
        const oldStored = storedCategoryThemeLabel(type, oldLabel);
        const newStored = storedCategoryThemeLabel(type, newLabel);
        await tx.update(catalogSessionsTable)
          .set({ themeTag: sql`array_replace(${catalogSessionsTable.themeTag}, ${oldStored}, ${newStored})` })
          .where(categoryId
            ? and(
                eq(catalogSessionsTable.categoryId, categoryId),
                sql`${catalogSessionsTable.themeTag} @> ARRAY[${oldStored}]::text[]`,
              )
            : sql`${catalogSessionsTable.themeTag} @> ARRAY[${oldStored}]::text[]`);
      }
      return row;
    });
    res.json(result);
  } catch (err) {
    if (err instanceof Error && err.message === "DUPLICATE") {
      res.status(409).json({ error: "Ya existe una etiqueta con ese nombre" });
      return;
    }
    req.log.error({ err }, "error renaming tag option");
    res.status(500).json({ error: "Error al renombrar etiqueta" });
  }
});

router.delete("/admin/tag-options/:id", requireAuth, requireRole("admin"), async (req, res) => {
  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) { res.status(400).json({ error: "ID inválido" }); return; }
  try {
    const [deleted] = await db.transaction(async (tx) => {
      const [option] = await tx.select().from(catalogTagOptionsTable)
        .where(eq(catalogTagOptionsTable.id, id)).limit(1);
      if (!option) return [];
      const categoryId = CATEGORY_THEME_TYPE_TO_ID[option.type];
      if (isManagedThemeType(option.type)) {
        const storedLabel = storedCategoryThemeLabel(option.type, option.label);
        await tx.update(catalogSessionsTable)
          .set({ themeTag: sql`array_remove(${catalogSessionsTable.themeTag}, ${storedLabel})` })
          .where(categoryId
            ? and(
                eq(catalogSessionsTable.categoryId, categoryId),
                sql`${catalogSessionsTable.themeTag} @> ARRAY[${storedLabel}]::text[]`,
              )
            : sql`${catalogSessionsTable.themeTag} @> ARRAY[${storedLabel}]::text[]`);
      }
      return tx.delete(catalogTagOptionsTable)
        .where(eq(catalogTagOptionsTable.id, id))
        .returning();
    });
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
