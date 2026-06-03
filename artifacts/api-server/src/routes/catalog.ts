import { Router, type IRouter } from "express";
import { asc, eq, inArray } from "drizzle-orm";
import {
  db,
  catalogCategoriesTable,
  catalogSessionsTable,
  catalogAudioFilesTable,
  type CatalogCategory,
  type CatalogSession,
  type CatalogAudioFile,
} from "@workspace/db";

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

function serializeSession(
  s: CatalogSession,
  audioFiles: CatalogAudioFile[],
) {
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
    imageUrl: s.imageUrl,
    isFeatured: s.isFeatured,
    isNew: s.isNew,
    isPremium: s.isPremium,
    frequency: s.frequency,
    soundTag: s.soundTag,
    meditationTag: s.meditationTag,
    ancestralTag: s.ancestralTag,
    sabiduriaTag: s.sabiduriaTag,
    podcastTag: s.podcastTag,
    sonidosTag: s.sonidosTag,
    themeTag: s.themeTag,
    sleepTag: s.sleepTag,
    guideId: s.guideId,
    artistId: s.artistId,
    guests: s.guests,
    status: s.status,
    sortOrder: s.sortOrder,
    audioFiles: audioFiles.map(serializeAudioFile),
  };
}

// GET /catalog — catálogo público (solo sesiones publicadas).
router.get("/catalog", async (req, res) => {
  const categories = await db
    .select()
    .from(catalogCategoriesTable)
    .orderBy(asc(catalogCategoriesTable.sortOrder), asc(catalogCategoriesTable.id));

  const sessions = await db
    .select()
    .from(catalogSessionsTable)
    .where(eq(catalogSessionsTable.status, "published"))
    .orderBy(asc(catalogSessionsTable.sortOrder), asc(catalogSessionsTable.id));

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
    { categories: categories.length, sessions: sessions.length, audioFiles: audioFiles.length },
    "served catalog",
  );

  res.json({
    categories: categories.map(serializeCategory),
    sessions: sessions.map((s) => serializeSession(s, audioBySession.get(s.id) ?? [])),
  });
});

export default router;
