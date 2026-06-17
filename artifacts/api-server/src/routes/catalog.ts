import { Router, type IRouter } from "express";
import { randomUUID } from "node:crypto";
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import {
  db,
  catalogCategoriesTable,
  catalogSessionsTable,
  catalogAudioFilesTable,
  catalogPlaylistsTable,
  playbackHistoryTable,
  notificationsTable,
  usersTable,
  type CatalogCategory,
  type CatalogSession,
  type CatalogAudioFile,
  type CatalogPlaylist,
  type User,
} from "@workspace/db";
import {
  CreateSubmissionBody,
  RejectSubmissionBody,
  EditSubmissionBody,
  GetPendingSubmissionsQueryParams,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";
import { requireRole } from "../middlewares/requireRole";

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
    isNew: s.isNew,
    isPremium: s.isPremium,
    skipDetail: s.skipDetail,
    frequency: s.frequency,
    soundTag: s.soundTag,
    meditationTag: s.meditationTag,
    ancestralTag: s.ancestralTag,
    sabiduriaTag: s.sabiduriaTag,
    podcastTag: s.podcastTag,
    sonidosTag: s.sonidosTag,
    themeTag: s.themeTag,
    sleepTag: s.sleepTag,
    voiceTag: s.voiceTag,
    guideId: s.guideId,
    artistId: s.artistId,
    guests: s.guests,
    status: s.status,
    sortOrder: s.sortOrder,
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
  };
}

// GET /catalog — catálogo público (solo sesiones publicadas + playlists activas).
router.get("/catalog", async (req, res) => {
  const [categories, sessions, playlists] = await Promise.all([
    db.select().from(catalogCategoriesTable)
      .orderBy(asc(catalogCategoriesTable.sortOrder), asc(catalogCategoriesTable.id)),
    db.select().from(catalogSessionsTable)
      .where(eq(catalogSessionsTable.status, "published"))
      .orderBy(asc(catalogSessionsTable.sortOrder), asc(catalogSessionsTable.id)),
    db.select().from(catalogPlaylistsTable)
      .where(eq(catalogPlaylistsTable.isActive, true))
      .orderBy(asc(catalogPlaylistsTable.sortOrder), asc(catalogPlaylistsTable.id)),
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
          frequency: body.frequency ?? null,
          soundTag: body.soundTag ?? null,
          meditationTag: body.meditationTag ?? null,
          ancestralTag: body.ancestralTag ?? null,
          sabiduriaTag: body.sabiduriaTag ?? null,
          podcastTag: body.podcastTag ?? null,
          sonidosTag: body.sonidosTag ?? null,
          sleepTag: body.sleepTag ?? null,
          voiceTag: body.voiceTag ?? null,
          guideId: body.guideId ?? null,
          artistId: body.artistId ?? null,
          status: "pending",
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
  requireRole("admin"),
  async (req, res) => {
    const parsed = GetPendingSubmissionsQueryParams.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ error: "Consulta inválida" });
      return;
    }
    const status = parsed.data.status ?? "pending";
    try {
      const sessions = await db
        .select()
        .from(catalogSessionsTable)
        .where(eq(catalogSessionsTable.status, status))
        .orderBy(desc(catalogSessionsTable.createdAt));
      res.json({ submissions: await serializeSubmissionList(sessions) });
    } catch (err) {
      req.log.error({ err }, "error listing submissions");
      res.status(500).json({ error: "Error al obtener la cola de revisión" });
    }
  },
);

// POST /catalog/submissions/:id/approve — aprobar (admin).
router.post(
  "/catalog/submissions/:id/approve",
  requireAuth,
  requireRole("admin"),
  async (req, res) => {
    const id = String(req.params.id);
    const me = req.currentUser!;
    try {
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
  requireRole("admin"),
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
  requireRole("admin"),
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
    if (data.isFeatured !== undefined) updates.isFeatured = data.isFeatured;
    if (data.isNew !== undefined) updates.isNew = data.isNew;
    if (data.voiceTag !== undefined) updates.voiceTag = data.voiceTag;

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

export default router;
