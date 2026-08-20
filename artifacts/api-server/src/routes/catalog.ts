import { Router, type IRouter } from "express";
import { randomUUID } from "node:crypto";
import { and, asc, desc, eq, gte, inArray, or, sql } from "drizzle-orm";
import {
  db,
  catalogCategoriesTable,
  catalogSessionsTable,
  catalogAudioFilesTable,
  catalogPlaylistsTable,
  playbackHistoryTable,
  notificationsTable,
  usersTable,
  sceneAnimationsTable,
  CreateSceneAnimationSchema,
  type CatalogCategory,
  type CatalogSession,
  type CatalogAudioFile,
  type CatalogPlaylist,
  type User,
  type SceneAnimation,
} from "@workspace/db";
import {
  CreateSubmissionBody,
  RejectSubmissionBody,
  EditSubmissionBody,
  GetPendingSubmissionsQueryParams,
  GetAdminSessionsQueryParams,
  AddAdminSessionAudioBody,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";
import { requireRole } from "../middlewares/requireRole";
import {
  canPublishObjectReference,
  canUserReferenceObject,
} from "../lib/objectAccess";

const router: IRouter = Router();

/** Tamaños máximos aceptados (la validación de bytes reales vive en storage). */
const MAX_AUDIO_BYTES = 200 * 1024 * 1024; // 200 MB
const MAX_IMAGE_BYTES = 15 * 1024 * 1024; // 15 MB

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

function serializeAudioFile(a: CatalogAudioFile) {
  return {
    id: a.id,
    sessionId: a.sessionId,
    role: a.role,
    assetKey: a.assetKey,
    url: a.url,
    name: a.name,
    contentType: a.contentType,
    sizeBytes: a.sizeBytes,
    durationSeconds: a.durationSeconds,
    isLoop: a.isLoop,
    createdAt: a.createdAt.toISOString(),
  };
}

function serializeSession(s: CatalogSession, audioFiles: CatalogAudioFile[]) {
  return {
    id: s.id,
    title: s.title,
    subtitle: s.subtitle,
    categoryId: s.categoryId,
    categoryLabel: s.categoryLabel,
    duration: s.duration,
    durationLabel: s.durationLabel,
    description: s.description,
    benefits: s.benefits,
    instruments: s.instruments,
    imageKey: s.imageKey,
    imageUrl: s.imageUrl ?? s.imageKey,
    isFeatured: s.isFeatured,
    isFeaturedCategory: s.isFeaturedCategory,
    isNew: s.isNew,
    isPremium: s.isPremium,
    skipDetail: s.skipDetail,
    skipMiniPlayer: s.skipMiniPlayer,
    isLoop: s.isLoop,
    isPinnedFeatured: s.isPinnedFeatured,
    frequency: s.frequency,
    soundTag: s.soundTag,
    meditationTag: s.meditationTag,
    ancestralTag: s.ancestralTag,
    sabiduriaTag: s.sabiduriaTag,
    podcastTag: s.podcastTag,
    sonidosTag: s.sonidosTag,
    descansoTag: s.descansoTag,
    themeTag: s.themeTag,
    temaTag: s.temaTag,
    sleepTag: s.sleepTag,
    voiceTag: s.voiceTag,
    guideId: s.guideId,
    artistId: s.artistId,
    guests: s.guests,
    playerDescription: s.playerDescription,
    status: s.status,
    sortOrder: s.sortOrder,
    createdAt: s.createdAt.toISOString(),
    audioFiles: audioFiles.map(serializeAudioFile),
  };
}

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

/** Serializa una sesión como "envío" (incluye trail de revisión + creador). */
function serializeSubmission(
  s: CatalogSession,
  audioFiles: CatalogAudioFile[],
  creator: User | null,
) {
  return {
    ...serializeSession(s, audioFiles),
    rejectionReason: s.rejectionReason,
    creator: creator ? toProfile(creator) : null,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  };
}

/** Carga audios + creador de una sesión y la serializa como envío. */
async function loadSubmission(sessionId: string) {
  const [session] = await db
    .select()
    .from(catalogSessionsTable)
    .where(eq(catalogSessionsTable.id, sessionId))
    .limit(1);
  if (!session) return null;

  const audioFiles = await db
    .select()
    .from(catalogAudioFilesTable)
    .where(eq(catalogAudioFilesTable.sessionId, sessionId))
    .orderBy(asc(catalogAudioFilesTable.id));

  let creator: User | null = null;
  if (session.createdBy != null) {
    const [u] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, session.createdBy))
      .limit(1);
    creator = u ?? null;
  }
  return { session, audioFiles, creator };
}

/** Serializa una lista de sesiones como envíos resolviendo creadores en lote. */
async function serializeSubmissionList(sessions: CatalogSession[]) {
  if (sessions.length === 0) return [];
  const ids = sessions.map((s) => s.id);
  const audioFiles = await db
    .select()
    .from(catalogAudioFilesTable)
    .where(inArray(catalogAudioFilesTable.sessionId, ids))
    .orderBy(asc(catalogAudioFilesTable.id));
  const audioBySession = new Map<string, CatalogAudioFile[]>();
  for (const a of audioFiles) {
    if (!a.sessionId) continue;
    const list = audioBySession.get(a.sessionId) ?? [];
    list.push(a);
    audioBySession.set(a.sessionId, list);
  }

  const creatorIds = [
    ...new Set(sessions.map((s) => s.createdBy).filter((v): v is number => v != null)),
  ];
  const creators =
    creatorIds.length > 0
      ? await db.select().from(usersTable).where(inArray(usersTable.id, creatorIds))
      : [];
  const creatorById = new Map(creators.map((c) => [c.id, c]));

  return sessions.map((s) =>
    serializeSubmission(
      s,
      audioBySession.get(s.id) ?? [],
      s.createdBy != null ? (creatorById.get(s.createdBy) ?? null) : null,
    ),
  );
}

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

// GET /catalog — catálogo público (solo sesiones publicadas + playlists del home, máx 4).
router.get("/catalog", async (req, res) => {
  const [categories, sessions, playlists] = await Promise.all([
    db.select().from(catalogCategoriesTable)
      .orderBy(asc(catalogCategoriesTable.sortOrder), asc(catalogCategoriesTable.id))
      .limit(200),
    db.select().from(catalogSessionsTable)
      .where(eq(catalogSessionsTable.status, "published"))
      .orderBy(asc(catalogSessionsTable.sortOrder), asc(catalogSessionsTable.id))
      // Cota defensiva: el mobile hidrata el catálogo completo, pero el
      // endpoint no debe volverse un full-scan sin techo si el catálogo crece.
      .limit(1000),
    db.select().from(catalogPlaylistsTable)
      .where(and(eq(catalogPlaylistsTable.isActive, true), eq(catalogPlaylistsTable.showOnHome, true)))
      .orderBy(asc(catalogPlaylistsTable.homePosition), asc(catalogPlaylistsTable.id))
      .limit(4),
  ]);

  const sessionIds = sessions.map((s) => s.id);
  const audioFiles =
    sessionIds.length > 0
      ? await db
          .select()
          .from(catalogAudioFilesTable)
          .where(inArray(catalogAudioFilesTable.sessionId, sessionIds))
          .orderBy(asc(catalogAudioFilesTable.id))
      : [];

  const audioBySession = new Map<string, CatalogAudioFile[]>();
  for (const a of audioFiles) {
    if (!a.sessionId) continue;
    const list = audioBySession.get(a.sessionId) ?? [];
    list.push(a);
    audioBySession.set(a.sessionId, list);
  }

  req.log.info(
    { categories: categories.length, sessions: sessions.length, playlists: playlists.length, audioFiles: audioFiles.length },
    "served catalog",
  );

  res.json({
    categories: categories.map(serializeCategory),
    sessions: sessions.map((s) => serializeSession(s, audioBySession.get(s.id) ?? [])),
    playlists: playlists.map(serializePlaylist),
  });
});

// GET /catalog/pinned-featured — sesión "Destacada de hoy" elegida por el admin.
router.get("/catalog/pinned-featured", async (req, res) => {
  const row = await db
    .select()
    .from(catalogSessionsTable)
    .where(
      and(
        eq(catalogSessionsTable.isPinnedFeatured, true),
        eq(catalogSessionsTable.status, "published"),
      ),
    )
    .limit(1);

  if (!row.length) {
    res.json({ session: null });
    return;
  }

  const session = row[0];
  const audioFiles = await db
    .select()
    .from(catalogAudioFilesTable)
    .where(eq(catalogAudioFilesTable.sessionId, session.id))
    .orderBy(asc(catalogAudioFilesTable.id));

  res.json({ session: serializeSession(session, audioFiles) });
});

// PUT /admin/pinned-featured — fija (o limpia) la sesión "Destacada de hoy".
router.put(
  "/admin/pinned-featured",
  requireAuth,
  requireRole("admin", "moderador"),
  async (req, res) => {
    const { sessionId } = req.body as { sessionId: string | null };

    // Validar que la sesión existe y está publicada (si se provee)
    if (sessionId != null) {
      if (typeof sessionId !== "string" || !sessionId.trim()) {
        res.status(400).json({ error: "sessionId inválido" });
        return;
      }
      const found = await db
        .select({ id: catalogSessionsTable.id })
        .from(catalogSessionsTable)
        .where(
          and(
            eq(catalogSessionsTable.id, sessionId),
            eq(catalogSessionsTable.status, "published"),
          ),
        )
        .limit(1);
      if (!found.length) {
        res.status(404).json({ error: "Sesión no encontrada o no publicada" });
        return;
      }
    }

    // Desactivar cualquier sesión previamente pinneada
    await db
      .update(catalogSessionsTable)
      .set({ isPinnedFeatured: false })
      .where(eq(catalogSessionsTable.isPinnedFeatured, true));

    // Activar la nueva (si se provee)
    if (sessionId != null) {
      await db
        .update(catalogSessionsTable)
        .set({ isPinnedFeatured: true })
        .where(eq(catalogSessionsTable.id, sessionId));
    }

    res.json({ ok: true });
  },
);

// GET /catalog/sessions/:id/plays — conteo global de reproducciones de una sesión
router.get("/catalog/sessions/:id/plays", async (req, res) => {
  const { id } = req.params;
  const [row] = await db
    .select({ plays: sql<number>`cast(count(*) as int)` })
    .from(playbackHistoryTable)
    .where(eq(playbackHistoryTable.sessionId, id));
  res.json({ plays: row?.plays ?? 0 });
});

// GET /catalog/popular — sesiones más escuchadas (ranking real por reproducciones).
router.get("/catalog/popular", async (req, res) => {
  const limitRaw = Number(req.query.limit);
  const limit =
    Number.isInteger(limitRaw) && limitRaw > 0 && limitRaw <= 50 ? limitRaw : 10;

  const ranked = await db
    .select({
      sessionId: playbackHistoryTable.sessionId,
      plays: sql<number>`count(*)`,
    })
    .from(playbackHistoryTable)
    .groupBy(playbackHistoryTable.sessionId)
    .orderBy(desc(sql`count(*)`))
    .limit(limit * 4);

  const rankedIds = ranked.map((r) => r.sessionId);
  if (rankedIds.length === 0) {
    res.json({ sessions: [] });
    return;
  }

  const published = await db
    .select()
    .from(catalogSessionsTable)
    .where(
      and(
        eq(catalogSessionsTable.status, "published"),
        inArray(catalogSessionsTable.id, rankedIds),
      ),
    );
  const sessionById = new Map(published.map((s) => [s.id, s]));
  const ordered = rankedIds
    .map((id) => sessionById.get(id))
    .filter((s): s is CatalogSession => s != null)
    .slice(0, limit);

  const ids = ordered.map((s) => s.id);
  const audioFiles =
    ids.length > 0
      ? await db
          .select()
          .from(catalogAudioFilesTable)
          .where(inArray(catalogAudioFilesTable.sessionId, ids))
          .orderBy(asc(catalogAudioFilesTable.id))
      : [];
  const audioBySession = new Map<string, CatalogAudioFile[]>();
  for (const a of audioFiles) {
    if (!a.sessionId) continue;
    const list = audioBySession.get(a.sessionId) ?? [];
    list.push(a);
    audioBySession.set(a.sessionId, list);
  }

  res.json({
    sessions: ordered.map((s) => serializeSession(s, audioBySession.get(s.id) ?? [])),
  });
});

// POST /catalog/submissions — un creador sube contenido (queda pending).
router.post(
  "/catalog/submissions",
  requireAuth,
  requireRole("creator", "admin"),
  async (req, res) => {
    const parsed = CreateSubmissionBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Datos inválidos" });
      return;
    }
    const body = parsed.data;
    const me = req.currentUser!;

    // Validación de assets (el server no ve los bytes; valida la metadata).
    for (const a of body.audioFiles) {
      if (!a.objectPath.startsWith("/objects/")) {
        res.status(400).json({ error: "Ruta de audio inválida" });
        return;
      }
      if (!a.contentType.startsWith("audio/")) {
        res.status(400).json({ error: "El archivo principal debe ser audio" });
        return;
      }
      if (a.sizeBytes > MAX_AUDIO_BYTES) {
        res.status(400).json({ error: "El audio supera el tamaño máximo (200 MB)" });
        return;
      }
      if (
        !(await canUserReferenceObject({
          objectPath: a.objectPath,
          userId: me.id,
          clerkUserId: me.clerkUserId,
          role: me.role,
        }))
      ) {
        res.status(403).json({ error: "No podés enviar un audio que no te pertenece" });
        return;
      }
    }
    if (body.imageObjectPath) {
      if (!body.imageObjectPath.startsWith("/objects/")) {
        res.status(400).json({ error: "Ruta de portada inválida" });
        return;
      }
      if (!body.imageContentType || !body.imageContentType.startsWith("image/")) {
        res.status(400).json({ error: "La portada debe ser una imagen" });
        return;
      }
      if (body.imageSizeBytes != null && body.imageSizeBytes > MAX_IMAGE_BYTES) {
        res.status(400).json({ error: "La portada supera el tamaño máximo (15 MB)" });
        return;
      }
      if (
        !(await canUserReferenceObject({
          objectPath: body.imageObjectPath,
          userId: me.id,
          clerkUserId: me.clerkUserId,
          role: me.role,
        }))
      ) {
        res.status(403).json({ error: "No podés usar una portada que no te pertenece" });
        return;
      }
    }

    const id = `usr_${randomUUID().replace(/-/g, "").slice(0, 20)}`;

    try {
      await db.transaction(async (tx) => {
        await tx.insert(catalogSessionsTable).values({
          id,
          title: body.title,
          subtitle: body.subtitle,
          categoryId: body.categoryId,
          categoryLabel: body.categoryLabel,
          duration: body.duration,
          durationLabel: `${body.duration} min`,
          description: body.description,
          benefits: body.benefits ?? [],
          instruments: body.instruments ?? [],
          imageKey: body.imageObjectPath ?? null,
          imageUrl: body.imageObjectPath ?? null,
          isPremium: body.isPremium ?? false,
          skipDetail: body.skipDetail ?? false,
          skipMiniPlayer: body.skipMiniPlayer ?? false,
          isLoop: body.isLoop ?? false,
          frequency: body.frequency ?? null,
          soundTag: body.soundTag ?? null,
          meditationTag: body.meditationTag ?? null,
          ancestralTag: body.ancestralTag ?? null,
          sabiduriaTag: body.sabiduriaTag ?? null,
          podcastTag: body.podcastTag ?? null,
          sonidosTag: body.sonidosTag ?? null,
          descansoTag: body.descansoTag ?? null,
          themeTag: body.themeTag ?? null,
          temaTag: body.temaTag ?? null,
          sleepTag: body.sleepTag ?? null,
          voiceTag: body.voiceTag ?? null,
          guideId: body.guideId ?? null,
          artistId: body.artistId ?? null,
          playerDescription: body.playerDescription ?? null,
          // Solo un admin puede crear directamente como borrador; los creadores
          // siempre entran a la cola de revisión (pending).
          status:
            body.status === "draft" && me.role === "admin" ? "draft" : "pending",
          createdBy: me.id,
        });

        await tx.insert(catalogAudioFilesTable).values(
          body.audioFiles.map((a) => ({
            sessionId: id,
            role: a.role ?? ("main" as const),
            url: a.objectPath,
            name: a.name,
            contentType: a.contentType,
            sizeBytes: a.sizeBytes,
            durationSeconds: a.durationSeconds ?? null,
            isLoop: a.isLoop ?? false,
            uploadedBy: me.id,
          })),
        );
      });

      const loaded = await loadSubmission(id);
      req.log.info({ submissionId: id, by: me.id }, "creator submission created");
      res.status(201).json(
        serializeSubmission(loaded!.session, loaded!.audioFiles, loaded!.creator),
      );
    } catch (err) {
      req.log.error({ err }, "error creating submission");
      res.status(500).json({ error: "Error al crear el envío" });
    }
  },
);

// GET /catalog/my-submissions — envíos del creador autenticado.
router.get(
  "/catalog/my-submissions",
  requireAuth,
  requireRole("creator", "admin"),
  async (req, res) => {
    const me = req.currentUser!;
    try {
      const sessions = await db
        .select()
        .from(catalogSessionsTable)
        .where(eq(catalogSessionsTable.createdBy, me.id))
        .orderBy(desc(catalogSessionsTable.createdAt));
      res.json({ submissions: await serializeSubmissionList(sessions) });
    } catch (err) {
      req.log.error({ err }, "error listing my submissions");
      res.status(500).json({ error: "Error al obtener los envíos" });
    }
  },
);

// GET /catalog/submissions — cola de revisión (admin).
router.get(
  "/catalog/submissions",
  requireAuth,
  requireRole("admin", "moderador"),
  async (req, res) => {
    const parsed = GetPendingSubmissionsQueryParams.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ error: "Consulta inválida" });
      return;
    }
    const { status: rawStatus, categoryId, createdAfter, themeTag, otherTag } = parsed.data;
    const status = rawStatus ?? "pending";
    try {
      const conditions = [eq(catalogSessionsTable.status, status)];
      if (categoryId) {
        conditions.push(eq(catalogSessionsTable.categoryId, categoryId));
      }
      if (createdAfter) {
        const afterDate = new Date(createdAfter);
        if (!isNaN(afterDate.getTime())) {
          conditions.push(gte(catalogSessionsTable.createdAt, afterDate));
        }
      }
      if (themeTag) {
        conditions.push(
          sql`${catalogSessionsTable.themeTag} @> ARRAY[${themeTag}]::text[]`,
        );
      }
      if (otherTag) {
        conditions.push(
          or(
            eq(catalogSessionsTable.sleepTag, otherTag),
            eq(catalogSessionsTable.meditationTag, otherTag),
            eq(catalogSessionsTable.soundTag, otherTag),
            eq(catalogSessionsTable.ancestralTag, otherTag),
          )!,
        );
      }
      const sessions = await db
        .select()
        .from(catalogSessionsTable)
        .where(and(...conditions))
        .orderBy(desc(catalogSessionsTable.createdAt));
      res.json({ submissions: await serializeSubmissionList(sessions) });
    } catch (err) {
      req.log.error({ err }, "error listing submissions");
      res.status(500).json({ error: "Error al obtener la cola de revisión" });
    }
  },
);

// GET /catalog/submissions/filter-options — valores únicos para filtros (admin).
router.get(
  "/catalog/submissions/filter-options",
  requireAuth,
  requireRole("admin", "moderador"),
  async (req, res) => {
    try {
      const rows = await db
        .select({
          categoryId: catalogSessionsTable.categoryId,
          categoryLabel: catalogSessionsTable.categoryLabel,
          themeTag: catalogSessionsTable.themeTag,
          sleepTag: catalogSessionsTable.sleepTag,
          meditationTag: catalogSessionsTable.meditationTag,
          soundTag: catalogSessionsTable.soundTag,
          ancestralTag: catalogSessionsTable.ancestralTag,
        })
        .from(catalogSessionsTable);

      // Categorías únicas ordenadas
      const catMap = new Map<string, string>();
      for (const r of rows) {
        if (!catMap.has(r.categoryId)) catMap.set(r.categoryId, r.categoryLabel);
      }
      const categories = [...catMap.entries()]
        .map(([id, label]) => ({ id, label }))
        .sort((a, b) => a.label.localeCompare(b.label));

      // themeTags: aplanar arrays únicos
      const themeTagSet = new Set<string>();
      for (const r of rows) {
        for (const t of r.themeTag ?? []) {
          if (t) themeTagSet.add(t);
        }
      }

      // otherTags: sleepTag + meditationTag + soundTag + ancestralTag únicos
      const otherTagSet = new Set<string>();
      for (const r of rows) {
        if (r.sleepTag) otherTagSet.add(r.sleepTag);
        if (r.meditationTag) otherTagSet.add(r.meditationTag);
        if (r.soundTag) otherTagSet.add(r.soundTag);
        if (r.ancestralTag) otherTagSet.add(r.ancestralTag);
      }

      res.json({
        categories,
        themeTags: [...themeTagSet].sort(),
        otherTags: [...otherTagSet].sort(),
      });
    } catch (err) {
      req.log.error({ err }, "error fetching filter options");
      res.status(500).json({ error: "Error al obtener opciones de filtro" });
    }
  },
);

// POST /catalog/submissions/:id/approve — aprobar (admin).
router.post(
  "/catalog/submissions/:id/approve",
  requireAuth,
  requireRole("admin", "moderador"),
  async (req, res) => {
    const id = String(req.params.id);
    const me = req.currentUser!;
    try {
      const pending = await loadSubmission(id);
      if (!pending) {
        res.status(404).json({ error: "Envío no encontrado" });
        return;
      }
      const references = [
        pending.session.imageUrl,
        ...pending.audioFiles.map((audio) => audio.url),
      ].filter((value): value is string => typeof value === "string");
      for (const objectPath of references) {
        if (
          !(await canPublishObjectReference({
            objectPath,
            expectedOwnerId: pending.session.createdBy,
          }))
        ) {
          res.status(409).json({
            error: "El envío contiene archivos sin propiedad verificable",
          });
          return;
        }
      }
      const [updated] = await db
        .update(catalogSessionsTable)
        .set({
          status: "published",
          rejectionReason: null,
          reviewedBy: me.id,
          reviewedAt: new Date(),
          isNew: true,
          updatedAt: new Date(),
        })
        .where(eq(catalogSessionsTable.id, id))
        .returning();
      if (!updated) {
        res.status(404).json({ error: "Envío no encontrado" });
        return;
      }
      if (updated.createdBy != null && updated.createdBy !== me.id) {
        await db.insert(notificationsTable).values({
          userId: updated.createdBy,
          actorUserId: me.id,
          type: "content_approved",
        });
      }
      const loaded = await loadSubmission(id);
      req.log.info({ submissionId: id, by: me.id }, "submission approved");
      res.json(serializeSubmission(loaded!.session, loaded!.audioFiles, loaded!.creator));
    } catch (err) {
      req.log.error({ err }, "error approving submission");
      res.status(500).json({ error: "Error al aprobar el envío" });
    }
  },
);

// POST /catalog/submissions/:id/reject — rechazar (admin).
router.post(
  "/catalog/submissions/:id/reject",
  requireAuth,
  requireRole("admin", "moderador"),
  async (req, res) => {
    const id = String(req.params.id);
    const me = req.currentUser!;
    const parsed = RejectSubmissionBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Datos inválidos" });
      return;
    }
    try {
      const [updated] = await db
        .update(catalogSessionsTable)
        .set({
          status: "rejected",
          rejectionReason: parsed.data.reason,
          reviewedBy: me.id,
          reviewedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(catalogSessionsTable.id, id))
        .returning();
      if (!updated) {
        res.status(404).json({ error: "Envío no encontrado" });
        return;
      }
      if (updated.createdBy != null && updated.createdBy !== me.id) {
        await db.insert(notificationsTable).values({
          userId: updated.createdBy,
          actorUserId: me.id,
          type: "content_rejected",
        });
      }
      const loaded = await loadSubmission(id);
      req.log.info({ submissionId: id, by: me.id }, "submission rejected");
      res.json(serializeSubmission(loaded!.session, loaded!.audioFiles, loaded!.creator));
    } catch (err) {
      req.log.error({ err }, "error rejecting submission");
      res.status(500).json({ error: "Error al rechazar el envío" });
    }
  },
);

// PATCH /catalog/submissions/:id — editar metadata (admin).
router.patch(
  "/catalog/submissions/:id",
  requireAuth,
  requireRole("admin", "moderador"),
  async (req, res) => {
    const id = String(req.params.id);
    const parsed = EditSubmissionBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Datos inválidos" });
      return;
    }
    const data = parsed.data;
    const updates: Partial<typeof catalogSessionsTable.$inferInsert> = {
      updatedAt: new Date(),
    };
    if (data.title !== undefined) updates.title = data.title;
    if (data.subtitle !== undefined) updates.subtitle = data.subtitle;
    if (data.categoryId !== undefined) updates.categoryId = data.categoryId;
    if (data.categoryLabel !== undefined) updates.categoryLabel = data.categoryLabel;
    if (data.duration !== undefined) {
      updates.duration = data.duration;
      updates.durationLabel = `${data.duration} min`;
    }
    if (data.description !== undefined) updates.description = data.description;
    if (data.benefits !== undefined) updates.benefits = data.benefits;
    if (data.instruments !== undefined) updates.instruments = data.instruments;
    if (data.isPremium !== undefined) updates.isPremium = data.isPremium;
    if (data.skipDetail !== undefined) updates.skipDetail = data.skipDetail;
    if (data.skipMiniPlayer !== undefined) updates.skipMiniPlayer = data.skipMiniPlayer;
    if (data.isFeatured !== undefined) updates.isFeatured = data.isFeatured;
    if (data.isFeaturedCategory !== undefined) updates.isFeaturedCategory = data.isFeaturedCategory;
    if (data.isNew !== undefined) updates.isNew = data.isNew;
    if (data.voiceTag !== undefined) updates.voiceTag = data.voiceTag;
    if (data.ancestralTag !== undefined) updates.ancestralTag = data.ancestralTag ?? null;
    if (data.meditationTag !== undefined) updates.meditationTag = data.meditationTag ?? null;
    if (data.soundTag !== undefined) updates.soundTag = data.soundTag ?? null;
    if (data.sleepTag !== undefined) updates.sleepTag = data.sleepTag ?? null;
    if (data.themeTag !== undefined) updates.themeTag = data.themeTag;
    if (data.temaTag !== undefined) updates.temaTag = data.temaTag;
    if (data.playerDescription !== undefined) updates.playerDescription = data.playerDescription ?? null;
    if (data.frequency !== undefined) updates.frequency = data.frequency ?? null;
    if (data.guideId !== undefined) updates.guideId = data.guideId ?? null;
    if (data.artistId !== undefined) updates.artistId = data.artistId ?? null;
    if (data.sabiduriaTag !== undefined) updates.sabiduriaTag = data.sabiduriaTag ?? null;
    if (data.podcastTag !== undefined) updates.podcastTag = data.podcastTag ?? null;
    if (data.sonidosTag !== undefined) updates.sonidosTag = data.sonidosTag ?? null;
    if (data.descansoTag !== undefined) updates.descansoTag = data.descansoTag ?? null;
    if (data.sortOrder !== undefined) updates.sortOrder = data.sortOrder;
    if (data.guests !== undefined)
      updates.guests =
        data.guests?.map((g) => ({
          name: g.name,
          role: g.role,
          instagram: g.instagram ?? undefined,
        })) ?? null;
    if (data.isPinnedFeatured !== undefined) updates.isPinnedFeatured = data.isPinnedFeatured;
    if (data.isLoop !== undefined) updates.isLoop = data.isLoop;
    if (data.imageObjectPath !== undefined) {
      if (data.imageObjectPath != null) {
        if (!data.imageObjectPath.startsWith("/objects/")) {
          res.status(400).json({ error: "Ruta de portada inválida" });
          return;
        }
        if (data.imageContentType && !data.imageContentType.startsWith("image/")) {
          res.status(400).json({ error: "La portada debe ser una imagen" });
          return;
        }
        if (data.imageSizeBytes != null && data.imageSizeBytes > MAX_IMAGE_BYTES) {
          res.status(400).json({ error: "La portada supera el tamaño máximo (15 MB)" });
          return;
        }
      }
      updates.imageKey = data.imageObjectPath ?? null;
      updates.imageUrl = data.imageObjectPath ?? null;
    }

    try {
      const [updated] = await db
        .update(catalogSessionsTable)
        .set(updates)
        .where(eq(catalogSessionsTable.id, id))
        .returning();
      if (!updated) {
        res.status(404).json({ error: "Envío no encontrado" });
        return;
      }
      const loaded = await loadSubmission(id);
      req.log.info({ submissionId: id }, "submission edited");
      res.json(serializeSubmission(loaded!.session, loaded!.audioFiles, loaded!.creator));
    } catch (err) {
      req.log.error({ err }, "error editing submission");
      res.status(500).json({ error: "Error al editar el envío" });
    }
  },
);

// POST /catalog/submissions/:id/hide — ocultar una pieza publicada (admin).
// La saca del catálogo público pasándola a "draft" (recuperable con unhide).
router.post(
  "/catalog/submissions/:id/hide",
  requireAuth,
  requireRole("admin", "moderador"),
  async (req, res) => {
    const id = String(req.params.id);
    try {
      const [current] = await db
        .select()
        .from(catalogSessionsTable)
        .where(eq(catalogSessionsTable.id, id))
        .limit(1);
      if (!current) {
        res.status(404).json({ error: "Pieza no encontrada" });
        return;
      }
      if (current.status !== "published") {
        res
          .status(409)
          .json({ error: "Solo se puede ocultar una pieza publicada" });
        return;
      }
      await db
        .update(catalogSessionsTable)
        .set({ status: "draft", isNew: false, updatedAt: new Date() })
        .where(eq(catalogSessionsTable.id, id));
      const loaded = await loadSubmission(id);
      req.log.info({ submissionId: id }, "submission hidden");
      res.json(serializeSubmission(loaded!.session, loaded!.audioFiles, loaded!.creator));
    } catch (err) {
      req.log.error({ err }, "error hiding submission");
      res.status(500).json({ error: "Error al ocultar la pieza" });
    }
  },
);

// POST /catalog/submissions/:id/unhide — volver a publicar una pieza ocultada (admin).
router.post(
  "/catalog/submissions/:id/unhide",
  requireAuth,
  requireRole("admin", "moderador"),
  async (req, res) => {
    const id = String(req.params.id);
    try {
      const [current] = await db
        .select()
        .from(catalogSessionsTable)
        .where(eq(catalogSessionsTable.id, id))
        .limit(1);
      if (!current) {
        res.status(404).json({ error: "Pieza no encontrada" });
        return;
      }
      if (current.status !== "draft") {
        res
          .status(409)
          .json({ error: "Solo se puede volver a publicar una pieza ocultada" });
        return;
      }
      await db
        .update(catalogSessionsTable)
        .set({ status: "published", updatedAt: new Date() })
        .where(eq(catalogSessionsTable.id, id));
      const loaded = await loadSubmission(id);
      req.log.info({ submissionId: id }, "submission unhidden");
      res.json(serializeSubmission(loaded!.session, loaded!.audioFiles, loaded!.creator));
    } catch (err) {
      req.log.error({ err }, "error unhiding submission");
      res.status(500).json({ error: "Error al volver a publicar la pieza" });
    }
  },
);

// DELETE /catalog/submissions/:id — borrar una pieza definitivamente (admin).
// Elimina la sesión y sus audios asociados (cascade). Irreversible.
router.delete(
  "/catalog/submissions/:id",
  requireAuth,
  requireRole("admin"),
  async (req, res) => {
    const id = String(req.params.id);
    try {
      const [current] = await db
        .select()
        .from(catalogSessionsTable)
        .where(eq(catalogSessionsTable.id, id))
        .limit(1);
      if (!current) {
        res.status(404).json({ error: "Pieza no encontrada" });
        return;
      }
      await db.transaction(async (tx) => {
        await tx
          .delete(catalogSessionsTable)
          .where(eq(catalogSessionsTable.id, id));
        // Quitar el ID borrado de todas las playlists que lo referencien
        await tx
          .update(catalogPlaylistsTable)
          .set({
            sessionIds: sql`array_remove(${catalogPlaylistsTable.sessionIds}, ${id})`,
            updatedAt: new Date(),
          })
          .where(sql`${id} = ANY(${catalogPlaylistsTable.sessionIds})`);
      });
      req.log.info({ submissionId: id }, "submission deleted");
      res.json({ ok: true });
    } catch (err) {
      req.log.error({ err }, "error deleting submission");
      res.status(500).json({ error: "Error al borrar la pieza" });
    }
  },
);

// ── Admin: gestión completa de sesiones ─────────────────────────────────────

// GET /admin/sessions — lista todas las sesiones con filtro por status,
// búsqueda por título y paginación (admin).
router.get(
  "/admin/sessions",
  requireAuth,
  requireRole("admin", "moderador"),
  async (req, res) => {
    const parsed = GetAdminSessionsQueryParams.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ error: "Consulta inválida" });
      return;
    }
    const { status, q } = parsed.data;
    const page = parsed.data.page ?? 1;
    const pageSize = parsed.data.pageSize ?? 25;
    try {
      const conditions = [];
      if (status) conditions.push(eq(catalogSessionsTable.status, status));
      if (q && q.trim()) {
        conditions.push(
          sql`${catalogSessionsTable.title} ILIKE ${"%" + q.trim() + "%"}`,
        );
      }
      const where = conditions.length ? and(...conditions) : undefined;

      const [countRow] = await db
        .select({ total: sql<number>`cast(count(*) as int)` })
        .from(catalogSessionsTable)
        .where(where);

      const sessions = await db
        .select()
        .from(catalogSessionsTable)
        .where(where)
        .orderBy(desc(catalogSessionsTable.createdAt))
        .limit(pageSize)
        .offset((page - 1) * pageSize);

      res.json({
        sessions: await serializeSubmissionList(sessions),
        total: countRow?.total ?? 0,
        page,
        pageSize,
      });
    } catch (err) {
      req.log.error({ err }, "error listing admin sessions");
      res.status(500).json({ error: "Error al obtener las sesiones" });
    }
  },
);

// GET /admin/sessions/:id — detalle completo de una sesión (admin).
router.get(
  "/admin/sessions/:id",
  requireAuth,
  requireRole("admin", "moderador"),
  async (req, res) => {
    const id = String(req.params.id);
    try {
      const loaded = await loadSubmission(id);
      if (!loaded) {
        res.status(404).json({ error: "Sesión no encontrada" });
        return;
      }
      res.json(serializeSubmission(loaded.session, loaded.audioFiles, loaded.creator));
    } catch (err) {
      req.log.error({ err }, "error loading admin session");
      res.status(500).json({ error: "Error al obtener la sesión" });
    }
  },
);

// POST /admin/sessions/:id/audio — añadir o reemplazar un audio slot (admin).
// Si `replaceAudioId` viene, elimina ese audio y lo sustituye por el nuevo.
router.post(
  "/admin/sessions/:id/audio",
  requireAuth,
  requireRole("admin", "moderador"),
  async (req, res) => {
    const id = String(req.params.id);
    const parsed = AddAdminSessionAudioBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Datos inválidos" });
      return;
    }
    const body = parsed.data;
    if (!body.objectPath.startsWith("/objects/")) {
      res.status(400).json({ error: "Ruta de audio inválida" });
      return;
    }
    if (!body.contentType.startsWith("audio/")) {
      res.status(400).json({ error: "El archivo debe ser audio" });
      return;
    }
    if (body.sizeBytes > MAX_AUDIO_BYTES) {
      res.status(400).json({ error: "El audio supera el tamaño máximo (200 MB)" });
      return;
    }
    const me = req.currentUser!;
    try {
      const [session] = await db
        .select({ id: catalogSessionsTable.id })
        .from(catalogSessionsTable)
        .where(eq(catalogSessionsTable.id, id))
        .limit(1);
      if (!session) {
        res.status(404).json({ error: "Sesión no encontrada" });
        return;
      }
      await db.transaction(async (tx) => {
        if (body.replaceAudioId != null) {
          await tx
            .delete(catalogAudioFilesTable)
            .where(
              and(
                eq(catalogAudioFilesTable.id, body.replaceAudioId),
                eq(catalogAudioFilesTable.sessionId, id),
              ),
            );
        }
        await tx.insert(catalogAudioFilesTable).values({
          sessionId: id,
          role: body.role ?? ("main" as const),
          url: body.objectPath,
          name: body.name,
          contentType: body.contentType,
          sizeBytes: body.sizeBytes,
          durationSeconds: body.durationSeconds ?? null,
          isLoop: body.isLoop ?? false,
          uploadedBy: me.id,
        });
        await tx
          .update(catalogSessionsTable)
          .set({ updatedAt: new Date() })
          .where(eq(catalogSessionsTable.id, id));
      });
      const loaded = await loadSubmission(id);
      req.log.info({ sessionId: id, replaced: body.replaceAudioId ?? null }, "admin session audio added");
      res.json(serializeSubmission(loaded!.session, loaded!.audioFiles, loaded!.creator));
    } catch (err) {
      req.log.error({ err }, "error adding session audio");
      res.status(500).json({ error: "Error al guardar el audio" });
    }
  },
);

// DELETE /admin/sessions/:id/audio/:audioId — eliminar un audio slot (admin).
router.delete(
  "/admin/sessions/:id/audio/:audioId",
  requireAuth,
  requireRole("admin", "moderador"),
  async (req, res) => {
    const id = String(req.params.id);
    const audioId = Number(req.params.audioId);
    if (!Number.isInteger(audioId)) {
      res.status(400).json({ error: "audioId inválido" });
      return;
    }
    try {
      const existing = await db
        .select({ id: catalogAudioFilesTable.id })
        .from(catalogAudioFilesTable)
        .where(eq(catalogAudioFilesTable.sessionId, id));
      if (!existing.some((a) => a.id === audioId)) {
        res.status(404).json({ error: "Audio no encontrado" });
        return;
      }
      if (existing.length <= 1) {
        res.status(409).json({ error: "La sesión debe conservar al menos un audio" });
        return;
      }
      await db
        .delete(catalogAudioFilesTable)
        .where(
          and(
            eq(catalogAudioFilesTable.id, audioId),
            eq(catalogAudioFilesTable.sessionId, id),
          ),
        );
      await db
        .update(catalogSessionsTable)
        .set({ updatedAt: new Date() })
        .where(eq(catalogSessionsTable.id, id));
      const loaded = await loadSubmission(id);
      req.log.info({ sessionId: id, audioId }, "admin session audio deleted");
      res.json(serializeSubmission(loaded!.session, loaded!.audioFiles, loaded!.creator));
    } catch (err) {
      req.log.error({ err }, "error deleting session audio");
      res.status(500).json({ error: "Error al eliminar el audio" });
    }
  },
);

// ── Scene animations ────────────────────────────────────────────────────────

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

// GET /catalog/scene-animations — lista las escenas activas (público).
router.get("/catalog/scene-animations", async (req, res) => {
  try {
    const rows = await db
      .select()
      .from(sceneAnimationsTable)
      .where(eq(sceneAnimationsTable.isActive, true))
      .orderBy(asc(sceneAnimationsTable.sortOrder), asc(sceneAnimationsTable.createdAt));
    res.json({ scenes: rows.map(serializeScene) });
  } catch (err) {
    req.log.error({ err }, "error fetching scene animations");
    res.status(500).json({ error: "Error al obtener escenas" });
  }
});

export default router;
