import { Router, type IRouter, type Request, type Response, type RequestHandler } from "express";
import { and, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import {
  db, inspirationsTable as entries, inspirationSettingsTable as settings,
  inspirationAssetsTable as assets, inspirationFavoritesTable as favorites,
  heroOverridesTable as heroes, heroOverrideAssetsTable as heroAssets,
  inspirationNotesTable as notes, catalogSessionsTable,
  heroSessionSlidesTable,
  catalogCategoriesTable,
  type InspirationContent,
} from "@workspace/db";
import {
  CreateAdminInspirationBody, UpdateAdminInspirationBody,
  PublishAdminInspirationBody, UpdateInspirationSettingsBody,
  RequestInspirationUploadBody, PutInspirationFavoriteBody, PutInspirationNoteBody,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";
import { requireRole } from "../middlewares/requireRole";
import { getClerkProxyHost } from "../middlewares/clerkProxyMiddleware";
import { ObjectStorageService, ObjectNotFoundError } from "../lib/objectStorage";
import { validateInspirationImage } from "../lib/inspirationImage";
import {
  InspirationError, inspirationDate, inspirationClock, inspirationWeekDates,
  inspirationAvailable, inspirationDay, defaultInspirationSettings,
  emptyInspirationContent, requireInspirationRevision,
} from "../lib/inspirationPolicy";

const router: IRouter = Router();
const storage = new ObjectStorageService();
const uuid = z.string().uuid();
const admin = [requireAuth, requireRole("admin")];
const heroMedia = z.object({ type: z.enum(["image", "video"]), objectPath: z.string().min(1), contentType: z.enum(["image/jpeg", "image/png", "image/webp", "video/mp4", "video/webm"]), sizeBytes: z.number().int().positive().max(104857600), generation: z.string().nullable(), posterObjectPath: z.string().nullable().optional() });
const heroContent = z.object({ media: heroMedia, title: z.string().max(200).nullable().optional() });
const slugifyHeroTag = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const themeSlug = (value: string) => {
  const slug = slugifyHeroTag(value);
  return slug === "foco-y-concentracion" ? "foco-concentracion" : slug;
};
const themeLabels: Record<string, string> = {
  "para-la-ansiedad": "Para la ansiedad", "energiza-tus-mananas": "Energiza tus mañanas",
  "foco-concentracion": "Foco y concentración", "suelto-la-rabia": "Suelto la Rabia",
  "crecimiento-personal": "Crecimiento personal", "armonia-familiar": "Armonía familiar",
  "respiracion-consciente": "Respiración consciente", "meditaciones-activas": "Meditaciones Activas",
  astrologia: "Astrología",
};
const customCollectionId = (label: string) => {
  const slug = slugifyHeroTag(label).slice(0, 48) || "coleccion";
  let hash = 0;
  for (let i = 0; i < label.length; i++) hash = ((hash << 5) - hash + label.charCodeAt(i)) | 0;
  return `custom-${slug}-${Math.abs(hash).toString(36)}`;
};
const sleepLabels = ["Música para dormir", "Meditaciones para dormir", "Historias para dormir", "Sonidos para dormir", "Paisajes sonoros", "Para niños", "Sonidos de lluvia", "Ruido"];
const soundLabels = ["Todos los sonidos", "Sonidos de naturaleza", "Sonidos binaurales", "Frecuencias Astrales", "Música de enfoque", "Cantos medicinales", "Sonidos de lluvia", "Sonidos para Chakras"];
const collectionRouteId = (label: string, type: "sleep" | "sounds") =>
  (type === "sleep" ? sleepLabels : soundLabels).includes(label) ? slugifyHeroTag(label) : customCollectionId(label);
const editorialPrefixByCategory: Record<string, string> = {
  "meditaciones-guiadas": "__category_theme_meditaciones__:",
  "sonidos-ancestrales": "__category_theme_sonoterapia__:",
  charlas: "__category_theme_charlas__:",
  historias: "__category_theme_historias__:",
  ambientales: "__category_theme_ambientales__:",
};
const categoryEditorialLabels = (values: string[], categoryId: string) => {
  if (categoryId === "musica-sonidos" || categoryId === "noches") return values.filter((value) => !value.startsWith("__"));
  const prefix = editorialPrefixByCategory[categoryId];
  return prefix ? values.filter((value) => value.startsWith(prefix)).map((value) => value.slice(prefix.length)) : [];
};
const parseOtherThemeTag = (value: string) => {
  const match = /^__other_theme_internal:([^_]+)__:(.+)$/.exec(value);
  return match ? { parentId: themeSlug(match[1]), label: match[2].trim() } : null;
};
type Entry = typeof entries.$inferSelect;
type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
const wrap = (fn: (req: Request, res: Response) => Promise<void>): RequestHandler => async (req, res) => {
  res.setHeader("Cache-Control", "private, no-store");
  res.setHeader("Vary", "Authorization, Cookie");
  try { await fn(req, res); }
  catch (err) {
    if (err instanceof InspirationError) {
      res.status(err.status).json({ error: err.message, ...(err.currentRevision !== undefined ? { currentRevision: err.currentRevision } : {}) });
    } else if (err instanceof z.ZodError || (err as Error)?.name === "ZodError") {
      res.status(400).json({ error: "Datos inválidos" });
    } else if (err instanceof ObjectNotFoundError) {
      res.status(400).json({ error: "La imagen no existe o la carga no ha terminado" });
    } else if ((err as { code?: string; cause?: { code?: string } })?.code === "23505" || (err as { cause?: { code?: string } })?.cause?.code === "23505") {
      res.status(409).json({ error: "Ya existe una inspiración para esa fecha. Recarga el calendario." });
    } else {
      // Do not log req.body / note text, including DB errors containing values.
      req.log?.error({ name: (err as Error)?.name }, "Inspiration operation failed");
      res.status(500).json({ error: "No se pudo completar la operación. Intenta nuevamente." });
    }
  }
};
function origin(req: Request) {
  // Match existing Clerk proxy resolution rather than returning internal
  // localhost/http addresses to React Native behind Replit's HTTPS proxy.
  const host = getClerkProxyHost(req);
  if (!host || !/^[a-z0-9.[\]:-]+$/i.test(host)) throw new InspirationError(400, "Host inválido");
  const forwarded = req.get("x-forwarded-proto")?.split(",")[0]?.trim();
  return `${forwarded === "https" ? "https" : req.protocol}://${host}`;
}
async function labels() {
  const [row] = await db.select().from(settings).where(eq(settings.id, 1));
  if (!row) return defaultInspirationSettings;
  const resolved = { revision: row.revision, ...row.labels };
  return resolved.sectionTitle === "Inspiración diaria"
    ? { ...resolved, sectionTitle: "Sabiduría diaria" }
    : resolved;
}
async function entry(id: string, tx: Tx | typeof db = db) {
  const [row] = await tx.select().from(entries).where(eq(entries.id, uuid.parse(id)));
  if (!row) throw new InspirationError(404, "Inspiración no encontrada");
  return row;
}
async function lock(tx: Tx, key: string) { await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtextextended(${`inspiration:${key}`}, 0))`); }
function adminDto(row: Entry) { return { ...row, updatedAt: row.updatedAt.toISOString() }; }
async function checkDraft(draft: InspirationContent, tx: Tx | typeof db) {
  if (draft.imagePath) {
    const [image] = await tx.select().from(assets).where(eq(assets.objectPath, draft.imagePath));
    if (!image) throw new InspirationError(400, "Usa una imagen cargada desde Sabiduría diaria");
  }
  if (draft.sessionId) {
    const [session] = await tx.select({ id: catalogSessionsTable.id }).from(catalogSessionsTable).where(eq(catalogSessionsTable.id, draft.sessionId));
    if (!session) throw new InspirationError(400, "Audio relacionado no encontrado");
  }
}
async function checkedAsset(path: string, tx: Tx | typeof db = db) {
  const [asset] = await tx.select().from(assets).where(eq(assets.objectPath, path));
  if (!asset) throw new InspirationError(400, "Imagen no autorizada");
  const file = await storage.getObjectEntityFile(path);
  const [meta] = await file.getMetadata();
  if (Number(meta.size) !== asset.sizeBytes || Number(meta.size) > 15 * 1024 * 1024 || meta.contentType !== asset.contentType) {
    throw new InspirationError(400, "La imagen no coincide con el tipo o tamaño declarado");
  }
  // Pin object generation so a still-valid PUT upload URL cannot replace a
  // published image behind our snapshot. Future requests fail closed on change.
  if (!meta.generation || (asset.generation && asset.generation !== String(meta.generation))) throw new InspirationError(400, "La imagen fue reemplazada; carga una nueva");
  const pinned = file.bucket.file(file.name, { generation: String(meta.generation) });
  const [bytes] = await pinned.download();
  await validateInspirationImage(bytes, asset.contentType);
  return { asset, file: pinned, generation: String(meta.generation) };
}
async function sendImage(path: string, res: Response, published: boolean) {
  const [asset] = await db.select().from(assets).where(eq(assets.objectPath, path));
  if (!asset || (published && !asset.generation)) throw new InspirationError(404, "Imagen no disponible");
  const current = await storage.getObjectEntityFile(path);
  const file = published ? current.bucket.file(current.name, { generation: asset.generation! }) : (await checkedAsset(path)).file;
  // Read before sending headers: storage failures return a structured error.
  // Maximum 15 MiB, checked when uploading/publishing.
  const [metadata] = await file.getMetadata();
  if (Number(metadata.size) !== asset.sizeBytes) throw new InspirationError(404, "Imagen no disponible");
  const [bytes] = await file.download();
  res.setHeader("Content-Type", asset.contentType);
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.send(bytes);
}

router.get("/inspirations/settings", wrap(async (_req, res) => { res.json(await labels()); }));
router.get("/hero", wrap(async (req, res) => {
  const clock = inspirationClock(req.query.timeZone);
  const [override] = await db.select().from(heroes).where(eq(heroes.date, clock.today));
  const [inspiration] = await db.select().from(entries).where(eq(entries.date, clock.today));
  const fallback = inspirationAvailable(inspiration, clock.today) && inspiration.published?.imagePath
    ? `${origin(req)}/api/inspirations/${inspiration.id}/image?timeZone=${encodeURIComponent(clock.timeZone)}&revision=${inspiration.publishedRevision}` : null;
  if (override && !override.deleted && override.published) {
    const media = override.published.media;
    const timeZone = encodeURIComponent(clock.timeZone);
    const mediaUrl = `${origin(req)}/api/hero/media/${override.id}?revision=${override.publishedRevision}&timeZone=${timeZone}`;
    res.json({
      date: clock.today,
      timeZone: clock.timeZone,
      source: "override",
      media: { type: media.type, objectPath: mediaUrl },
      fallbackImageUrl: media.type === "video"
        ? (media.posterObjectPath
            ? `${origin(req)}/api/hero/poster/${override.id}?revision=${override.publishedRevision}&timeZone=${timeZone}`
            : fallback)
        : null,
    });
    return;
  }
  if (fallback) {
    res.json({ date: clock.today, timeZone: clock.timeZone, source: "inspiration", media: { type: "image", objectPath: fallback }, fallbackImageUrl: fallback });
  } else res.json({ date: clock.today, timeZone: clock.timeZone, source: "fallback", media: null, fallbackImageUrl: null });
}));
function slideInput(value: unknown) {
  return z.object({
    position: z.union([z.literal(2), z.literal(3), z.literal(4)]),
    enabled: z.boolean().optional().default(true),
    destinationType: z.enum(["session", "category", "category-internal", "sleep", "sleep-internal", "sounds", "sounds-internal", "mixer", "topics", "topics-internal"]).optional(),
    destinationId: z.string().min(1).optional(),
    destinationParentId: z.string().min(1).optional(),
    destinationSource: z.enum(["legacy", "editorial"]).optional(),
    imageObjectPath: z.string().min(1).optional(),
    sessionId: z.string().min(1).optional(),
    title: z.string().trim().min(1).max(200),
    description: z.string().trim().max(300).optional(),
    pillLabel: z.string().trim().max(80).optional(),
    actionLabel: z.string().trim().min(1).max(60),
  }).transform((slide) => ({ ...slide, destinationType: slide.destinationType ?? "session", destinationId: slide.destinationId ?? slide.sessionId }))
    .parse(value);
}
async function sessionSlidesDto(content: { slides: Array<unknown | null> } | null, revision: number) {
  const inputs = (content?.slides ?? []).filter((slide) => slide != null).map(slideInput);
  if (!inputs.length) return { revision, slides: [] };
  const sessionInputs = inputs.filter((slide) => slide.destinationType === "session");
  const sessions = sessionInputs.length ? await db.select().from(catalogSessionsTable).where(inArray(catalogSessionsTable.id, sessionInputs.map((slide) => slide.destinationId!))) : [];
  const byId = new Map(sessions.filter((session) => session.status === "published").map((session) => [session.id, session]));
  const validInputs = (await Promise.all(inputs.map(async (slide) => {
    try { await validateHeroDestination(slide); return slide; } catch { return null; }
  }))).filter((slide): slide is ReturnType<typeof slideInput> => slide !== null);
  return {
    revision,
    slides: validInputs.sort((a, b) => a.position - b.position).map((slide) => {
       const session = slide.destinationType === "session" ? byId.get(slide.destinationId!) : undefined;
       if (slide.destinationType === "session" && !session) return null;
       const imageUrl = slide.imageObjectPath
         ? `/api/hero/session-slide-image/${slide.position}?revision=${revision}`
         : session?.imageUrl ?? session?.imageKey ?? null;
       if (!imageUrl) return null;
      return {
        ...slide,
         ...(session ? { categoryId: session.categoryId, categoryLabel: session.categoryLabel, skipDetail: session.skipDetail, skipMiniPlayer: session.skipMiniPlayer, isPremium: session.isPremium } : {}),
         imageUrl,
      };
    }).filter((slide): slide is NonNullable<typeof slide> => slide != null),
  };
}
router.get("/hero/session-slides", wrap(async (_req, res) => {
  const [row] = await db.select().from(heroSessionSlidesTable).where(eq(heroSessionSlidesTable.id, 1));
  res.json(await sessionSlidesDto(row?.published ?? null, row?.publishedRevision ?? 0));
}));
router.get("/hero/session-slide-image/:position", wrap(async (req, res) => {
  const position = z.coerce.number().int().min(2).max(4).parse(req.params.position);
  const [row] = await db.select().from(heroSessionSlidesTable).where(eq(heroSessionSlidesTable.id, 1));
  if (!row?.published || String(row.publishedRevision) !== String(req.query.revision)) throw new InspirationError(404, "Imagen no disponible");
  const slide = row.published.slides.find((item) => item?.position === position);
  if (!slide?.imageObjectPath) throw new InspirationError(404, "Imagen no disponible");
  await sendHeroAsset(slide.imageObjectPath, res, true);
}));
router.get("/hero/media/:id", wrap(async (req, res) => {
  const row = await heroEntry(String(req.params.id));
  const clock = inspirationClock(req.query.timeZone);
  if (!row.published || row.deleted || row.date !== clock.today || String(row.publishedRevision) !== String(req.query.revision)) throw new InspirationError(404, "Media no disponible");
  const media = row.published.media;
  const asset = (await db.select().from(heroAssets).where(eq(heroAssets.objectPath, media.objectPath)))[0];
  if (!asset?.generation || asset.generation !== media.generation) throw new InspirationError(404, "Media no disponible");
  const current = await storage.getObjectEntityFile(media.objectPath);
  const file = current.bucket.file(current.name, { generation: asset.generation });
  const [meta] = await file.getMetadata(); const size = Number(meta.size);
  streamRangedFile(req, res, file, size, media.contentType);
}));
router.get("/hero/poster/:id", wrap(async (req, res) => {
  const row = await heroEntry(String(req.params.id));
  const clock = inspirationClock(req.query.timeZone);
  if (!row.published || row.deleted || row.date !== clock.today || String(row.publishedRevision) !== String(req.query.revision)) {
    throw new InspirationError(404, "Imagen no disponible");
  }
  const posterPath = row.published.media.posterObjectPath;
  if (!posterPath) throw new InspirationError(404, "Imagen no disponible");
  await sendHeroAsset(posterPath, res, true);
}));
router.get("/inspirations/week", wrap(async (req, res) => {
  const clock = inspirationClock(req.query.timeZone);
  const days = inspirationWeekDates(inspirationDate.parse(req.query.date ?? clock.today));
  const rows = await db.select().from(entries).where(inArray(entries.date, days));
  const byDate = new Map(rows.map((r) => [r.date, r]));
  res.json({ ...clock, weekStart: days[0], days: days.map((d) => inspirationDay(byDate.get(d), d, clock.today, clock.timeZone, origin(req))), settings: await labels() });
}));
router.get("/inspirations/by-date/:date", wrap(async (req, res) => {
  const date = inspirationDate.parse(req.params.date);
  const clock = inspirationClock(req.query.timeZone);
  const [row] = await db.select().from(entries).where(eq(entries.date, date));
  res.json(inspirationDay(row, date, clock.today, clock.timeZone, origin(req)));
}));
router.get("/inspirations/:id/image", wrap(async (req, res) => {
  const clock = inspirationClock(req.query.timeZone);
  const row = await entry(String(req.params.id));
  if (!inspirationAvailable(row, clock.today) || !row.published.imagePath || (req.query.revision !== undefined && String(row.publishedRevision) !== req.query.revision)) {
    throw new InspirationError(404, "Imagen no disponible");
  }
  await sendImage(row.published.imagePath, res, true);
}));
router.get("/inspirations/:id", wrap(async (req, res) => {
  const clock = inspirationClock(req.query.timeZone);
  const row = await entry(String(req.params.id));
  res.json(inspirationDay(row, row.date, clock.today, clock.timeZone, origin(req)));
}));

router.get("/admin/inspirations/week", ...admin, wrap(async (req, res) => {
  const days = inspirationWeekDates(inspirationDate.parse(req.query.date ?? inspirationClock(undefined).today));
  const rows = await db.select().from(entries).where(inArray(entries.date, days));
  const byDate = new Map(rows.map((r) => [r.date, r]));
  res.json({ weekStart: days[0], days: days.map((date) => ({ date, inspiration: byDate.has(date) ? adminDto(byDate.get(date)!) : null })), settings: await labels() });
}));
function heroDto(row: typeof heroes.$inferSelect) { return { ...row, updatedAt: row.updatedAt.toISOString() }; }
async function heroEntry(id: string, tx: Tx | typeof db = db) {
  const [row] = await tx.select().from(heroes).where(eq(heroes.id, uuid.parse(id)));
  if (!row) throw new InspirationError(404, "Hero no encontrado");
  return row;
}
async function verifyHeroMedia(media: { type: "image" | "video"; objectPath: string; contentType: string; sizeBytes: number; generation: string | null }, tx: Tx | typeof db) {
  const [asset] = await tx.select().from(heroAssets).where(eq(heroAssets.objectPath, media.objectPath));
  if (!asset || asset.contentType !== media.contentType || asset.sizeBytes !== media.sizeBytes) throw new InspirationError(400, "Asset editorial no encontrado");
  if (media.type === "image" && asset.sizeBytes > 15 * 1024 * 1024) {
    throw new InspirationError(400, "La imagen supera el máximo de 15 MiB");
  }
  if ((media.type === "image") !== asset.contentType.startsWith("image/")) {
    throw new InspirationError(400, "El tipo de media no coincide con el archivo");
  }
  const file = await storage.getObjectEntityFile(media.objectPath);
  const [meta] = await file.getMetadata();
  if (Number(meta.size) !== asset.sizeBytes || meta.contentType !== asset.contentType || !meta.generation || (asset.generation && asset.generation !== String(meta.generation))) throw new InspirationError(400, "El asset fue reemplazado; carga uno nuevo");
  const generation = String(meta.generation);
  const pinned = file.bucket.file(file.name, { generation });
  if (media.type === "image") {
    const [bytes] = await pinned.download();
    await validateInspirationImage(bytes, asset.contentType);
  } else {
    const prefix = await new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];
      const stream = pinned.createReadStream({ start: 0, end: 63 });
      stream.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
      stream.on("error", reject);
      stream.on("end", () => resolve(Buffer.concat(chunks)));
    });
    const validMp4 = asset.contentType === "video/mp4"
      && prefix.length >= 12
      && prefix.toString("ascii", 4, 8) === "ftyp";
    const validWebm = asset.contentType === "video/webm"
      && prefix.length >= 4
      && prefix.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]));
    if (!validMp4 && !validWebm) throw new InspirationError(400, "El video no coincide con el formato declarado");
  }
  await tx.update(heroAssets).set({ generation }).where(eq(heroAssets.objectPath, media.objectPath));
  return generation;
}
async function sendHeroAsset(path: string, res: Response, published: boolean) {
  const [asset] = await db.select().from(heroAssets).where(eq(heroAssets.objectPath, path));
  if (!asset || !asset.contentType.startsWith("image/") || (published && !asset.generation)) {
    throw new InspirationError(404, "Imagen no disponible");
  }
  const current = await storage.getObjectEntityFile(path);
  const file = published
    ? current.bucket.file(current.name, { generation: asset.generation! })
    : current;
  const [metadata] = await file.getMetadata();
  if (Number(metadata.size) !== asset.sizeBytes || metadata.contentType !== asset.contentType) {
    throw new InspirationError(404, "Imagen no disponible");
  }
  const [bytes] = await file.download();
  await validateInspirationImage(bytes, asset.contentType);
  res.setHeader("Content-Type", asset.contentType);
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.send(bytes);
}
async function checkedHeroSlideAsset(path: string) {
  const [asset] = await db.select().from(heroAssets).where(eq(heroAssets.objectPath, path));
  if (!asset || !asset.contentType.startsWith("image/") || asset.sizeBytes > 15 * 1024 * 1024) {
    throw new InspirationError(400, "Imagen editorial no encontrada");
  }
  const file = await storage.getObjectEntityFile(path);
  const [metadata] = await file.getMetadata();
  if (Number(metadata.size) !== asset.sizeBytes || metadata.contentType !== asset.contentType || !metadata.generation) {
    throw new InspirationError(400, "La imagen no coincide con el archivo cargado");
  }
  const [bytes] = await file.download();
  await validateInspirationImage(bytes, asset.contentType);
  await db.update(heroAssets).set({ generation: String(metadata.generation) }).where(eq(heroAssets.objectPath, path));
}
async function validateHeroDestination(slide: ReturnType<typeof slideInput>) {
  if (["session", "sleep", "sounds", "mixer"].includes(slide.destinationType)) {
    if (slide.destinationType === "session" && !slide.destinationId) throw new InspirationError(400, "La sesión requiere un identificador");
    return;
  }
  if (slide.destinationType === "topics" && !slide.destinationId) return;
  const id = slide.destinationId;
  if (!id) throw new InspirationError(400, "El destino requiere un identificador");
  if (slide.destinationType === "category" && !(await db.select({ id: catalogCategoriesTable.id }).from(catalogCategoriesTable).where(eq(catalogCategoriesTable.id, id))).length) {
    throw new InspirationError(400, "La categoría no está disponible");
  }
  if (slide.destinationType === "category-internal") {
    if (!slide.destinationParentId) throw new InspirationError(400, "La categoría requiere un identificador padre");
    const rows = await db.select({ categoryId: catalogSessionsTable.categoryId, sonidosTags: catalogSessionsTable.sonidosTags, descansoTags: catalogSessionsTable.descansoTags, temaTag: catalogSessionsTable.temaTag, soundTag: catalogSessionsTable.soundTag, meditationTag: catalogSessionsTable.meditationTag, ancestralTag: catalogSessionsTable.ancestralTag, sabiduriaTag: catalogSessionsTable.sabiduriaTag, podcastTag: catalogSessionsTable.podcastTag, sonidosTag: catalogSessionsTable.sonidosTag, themeTag: catalogSessionsTable.themeTag }).from(catalogSessionsTable).where(and(eq(catalogSessionsTable.status, "published"), eq(catalogSessionsTable.categoryId, slide.destinationParentId)));
    const valid = rows.some((row) => {
      const legacyValue = slide.destinationParentId === "musica-sonidos" ? row.soundTag
        : slide.destinationParentId === "meditaciones-guiadas" ? row.meditationTag
        : slide.destinationParentId === "sonidos-ancestrales" ? row.ancestralTag
        : slide.destinationParentId === "charlas" ? row.podcastTag
        : slide.destinationParentId === "historias" ? row.sabiduriaTag
        : slide.destinationParentId === "ambientales" ? row.sonidosTag : null;
      const values = slide.destinationSource === "editorial"
        ? categoryEditorialLabels(row.themeTag ?? [], slide.destinationParentId!)
        : legacyValue ? [legacyValue] : [];
      return values.filter((value): value is string => Boolean(value)).includes(id);
    });
    if (!valid) throw new InspirationError(400, "La etiqueta de categoría no está disponible");
  } else if (["sleep-internal", "sounds-internal"].includes(slide.destinationType)) {
    const sessions = await db.select({ descansoTags: catalogSessionsTable.descansoTags, sonidosTags: catalogSessionsTable.sonidosTags }).from(catalogSessionsTable).where(eq(catalogSessionsTable.status, "published"));
    const type = slide.destinationType === "sleep-internal" ? "sleep" : "sounds";
    const valid = sessions.some((row) => (type === "sleep" ? row.descansoTags : row.sonidosTags).some((label) => collectionRouteId(label, type) === id));
    if (!valid) throw new InspirationError(400, "La colección no está disponible");
  } else if (slide.destinationType === "topics-internal") {
    const rows = await db.select({ themeTag: catalogSessionsTable.themeTag }).from(catalogSessionsTable).where(eq(catalogSessionsTable.status, "published"));
    const matchingTag = rows.flatMap((row) => row.themeTag ?? []).map(parseOtherThemeTag).find((tag): tag is { parentId: string; label: string } => tag !== null && tag.parentId === slide.destinationParentId && tag.label === id);
    if (!matchingTag || !slide.destinationParentId) throw new InspirationError(400, "La colección no está disponible");
  }
  if (slide.destinationType === "topics") {
    const rows = await db.select({ themeTag: catalogSessionsTable.themeTag }).from(catalogSessionsTable).where(eq(catalogSessionsTable.status, "published"));
    if (!rows.some((row) => (row.themeTag ?? []).some((tag) => !tag.startsWith("__") && themeSlug(tag) === id)) &&
      !rows.some((row) => (row.themeTag ?? []).some((tag) => parseOtherThemeTag(tag)?.parentId === id))) {
      throw new InspirationError(400, "La temática no está disponible");
    }
  }
}
function streamRangedFile(
  req: Request,
  res: Response,
  file: { createReadStream(options?: { start?: number; end?: number }): NodeJS.ReadableStream },
  size: number,
  contentType: string,
) {
  res.setHeader("Content-Type", contentType);
  res.setHeader("Accept-Ranges", "bytes");
  res.setHeader("X-Content-Type-Options", "nosniff");
  const range = req.headers.range;
  if (!range) {
    res.setHeader("Content-Length", String(size));
    file.createReadStream().pipe(res);
    return;
  }
  const match = /^bytes=(\d*)-(\d*)$/.exec(range);
  if (!match || (!match[1] && !match[2])) {
    res.status(416).setHeader("Content-Range", `bytes */${size}`).end();
    return;
  }
  let start: number;
  let end: number;
  if (!match[1]) {
    const suffixLength = Number(match[2]);
    if (!Number.isSafeInteger(suffixLength) || suffixLength <= 0) {
      res.status(416).setHeader("Content-Range", `bytes */${size}`).end();
      return;
    }
    start = Math.max(0, size - suffixLength);
    end = size - 1;
  } else {
    start = Number(match[1]);
    end = match[2] ? Math.min(Number(match[2]), size - 1) : size - 1;
  }
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || end < start || start >= size) {
    res.status(416).setHeader("Content-Range", `bytes */${size}`).end();
    return;
  }
  res.status(206);
  res.setHeader("Content-Range", `bytes ${start}-${end}/${size}`);
  res.setHeader("Content-Length", String(end - start + 1));
  file.createReadStream({ start, end }).pipe(res);
}
router.get("/admin/heroes", ...admin, wrap(async (_req, res) => { res.json((await db.select().from(heroes)).map(heroDto)); }));
router.get("/admin/hero/session-slides", ...admin, wrap(async (_req, res) => {
  const [row] = await db.select().from(heroSessionSlidesTable).where(eq(heroSessionSlidesTable.id, 1));
  const draft = (row?.draft?.slides ?? []).map(slideInput);
  const published = row?.published ? await sessionSlidesDto(row.published, row.publishedRevision ?? 0) : null;
  res.json({
    revision: row?.revision ?? 0,
    draft,
    published: published?.slides ?? null,
    publishedRevision: row?.publishedRevision ?? null,
  });
}));
router.get("/admin/hero/destinations", ...admin, wrap(async (_req, res) => {
  const sessions = await db.select({ id: catalogSessionsTable.id, label: catalogSessionsTable.title, categoryId: catalogSessionsTable.categoryId, categoryLabel: catalogSessionsTable.categoryLabel, sonidosTags: catalogSessionsTable.sonidosTags, sonidosTag: catalogSessionsTable.sonidosTag, descansoTags: catalogSessionsTable.descansoTags, temaTag: catalogSessionsTable.temaTag, soundTag: catalogSessionsTable.soundTag, meditationTag: catalogSessionsTable.meditationTag, ancestralTag: catalogSessionsTable.ancestralTag, sabiduriaTag: catalogSessionsTable.sabiduriaTag, podcastTag: catalogSessionsTable.podcastTag, themeTag: catalogSessionsTable.themeTag }).from(catalogSessionsTable).where(eq(catalogSessionsTable.status, "published"));
  const categories = await db.select({ id: catalogCategoriesTable.id, label: catalogCategoriesTable.title }).from(catalogCategoriesTable);
  const options = (items: Array<{ id: string; label: string; parentId?: string; source?: "legacy" | "editorial" }>) => items.sort((a, b) => a.label.localeCompare(b.label));
  const publishedTags = (field: "descansoTags" | "sonidosTags", type: "sleep" | "sounds") => {
    const values = sessions.flatMap((session) => (session[field] ?? []) as string[]);
    return options([...new Set(values)].map((label) => ({ id: collectionRouteId(label, type), label })));
  };
  res.json([
    { destinationType: "session", options: options(sessions.map((s) => ({ id: s.id, label: s.label, parentId: s.categoryId }))) },
    { destinationType: "category", options: options(categories.map((c) => ({ id: c.id, label: c.label }))) },
    { destinationType: "category-internal", options: options(sessions.flatMap((s) => {
      const legacy = [{ value: s.soundTag, category: "musica-sonidos" }, { value: s.meditationTag, category: "meditaciones-guiadas" }, { value: s.ancestralTag, category: "sonidos-ancestrales" }, { value: s.podcastTag, category: "charlas" }, { value: s.sabiduriaTag, category: "historias" }, { value: s.sonidosTag, category: "ambientales" }].filter((item) => item.value && item.category === s.categoryId);
      const editorial = categoryEditorialLabels(s.themeTag ?? [], s.categoryId);
      return [...legacy.map(({ value }) => ({ id: value!, label: value!, parentId: s.categoryId, source: "legacy" as const })), ...editorial.map((label) => ({ id: label, label, parentId: s.categoryId, source: "editorial" as const }))];
    }).filter((option, index, all) => all.findIndex((item) => item.id === option.id && item.parentId === option.parentId && item.source === option.source) === index)) },
    { destinationType: "sleep", options: [] },
    { destinationType: "sleep-internal", options: publishedTags("descansoTags", "sleep") },
    { destinationType: "sounds", options: [] },
    { destinationType: "sounds-internal", options: publishedTags("sonidosTags", "sounds") },
    { destinationType: "mixer", options: [] },
    { destinationType: "topics", options: options([...new Map(sessions.flatMap((s) => (s.themeTag ?? []).flatMap((tag) => {
      const internal = parseOtherThemeTag(tag);
      if (internal) return [{ id: internal.parentId, label: themeLabels[internal.parentId] ?? internal.parentId.replace(/-/g, " ") }];
      return tag.startsWith("__") ? [] : [{ id: themeSlug(tag), label: tag }];
    })).map((item) => [item.id, item])).values()]) },
    { destinationType: "topics-internal", options: options([...new Map(sessions.flatMap((s) => (s.themeTag ?? []).map(parseOtherThemeTag).filter((tag): tag is { parentId: string; label: string } => Boolean(tag)).map((tag) => ({ id: tag.label, label: tag.label, parentId: tag.parentId }))).map((item) => [`${item.parentId}:${item.id}`, item])).values()]) },
  ]);
}));
router.put("/admin/hero/session-slides", ...admin, wrap(async (req, res) => {
  const body = z.object({
    revision: z.number().int().min(0),
    slides: z.array(z.unknown()).length(3),
  }).parse(req.body);
  const slides = body.slides.map(slideInput);
  const positions = new Set(slides.map((slide) => slide.position));
  if (positions.size !== 3 || ![2, 3, 4].every((position) => positions.has(position as 2 | 3 | 4))) {
    throw new InspirationError(400, "Los tres slots del hero son obligatorios");
  }
  if (slides.some((slide) => slide.enabled && !slide.pillLabel)) {
    throw new InspirationError(400, "Elige una etiqueta editorial para cada slide activo");
  }
  const uniqueSessionIds = [...new Set(slides.filter((slide) => slide.destinationType === "session").map((slide) => slide.destinationId!))];
  const found = uniqueSessionIds.length ? await db.select({
    id: catalogSessionsTable.id,
    status: catalogSessionsTable.status,
    imageKey: catalogSessionsTable.imageKey,
    imageUrl: catalogSessionsTable.imageUrl,
  })
    .from(catalogSessionsTable)
    .where(inArray(catalogSessionsTable.id, uniqueSessionIds)) : [];
  if (found.length !== uniqueSessionIds.length || found.some((session) => session.status !== "published")) {
    throw new InspirationError(400, "Todas las sesiones deben estar publicadas");
  }
  const foundById = new Map(found.map((session) => [session.id, session]));
  if (slides.some((slide) => {
    if (slide.destinationType !== "session" || slide.imageObjectPath) return false;
    const session = foundById.get(slide.destinationId!);
    return !session?.imageUrl && !session?.imageKey;
  })) {
    throw new InspirationError(400, "Todas las sesiones deben tener una portada");
  }
  for (const slide of slides) {
    await validateHeroDestination(slide);
    if (slide.destinationType !== "session" && !slide.imageObjectPath) throw new InspirationError(400, "Los destinos sin sesión necesitan una imagen");
    if (slide.imageObjectPath) await checkedHeroSlideAsset(slide.imageObjectPath);
  }
  const row = await db.transaction(async (tx) => {
    await lock(tx, "hero-session-slides");
    const [old] = await tx.select().from(heroSessionSlidesTable).where(eq(heroSessionSlidesTable.id, 1));
    requireInspirationRevision(old?.revision ?? 0, body.revision);
    const value = {
      id: 1,
      revision: (old?.revision ?? 0) + 1,
      draft: { slides: slides as [ReturnType<typeof slideInput>, ReturnType<typeof slideInput>, ReturnType<typeof slideInput>] },
      published: { slides: slides as [ReturnType<typeof slideInput>, ReturnType<typeof slideInput>, ReturnType<typeof slideInput>] },
      publishedRevision: (old?.revision ?? 0) + 1,
      updatedAt: new Date(),
    };
    const [saved] = await tx.insert(heroSessionSlidesTable).values(value).onConflictDoUpdate({
      target: heroSessionSlidesTable.id,
      set: value,
    }).returning();
    return saved;
  });
  res.json({
    revision: row.revision,
    draft: row.draft.slides,
    published: row.published ? (await sessionSlidesDto(row.published, row.publishedRevision ?? 0)).slides : null,
    publishedRevision: row.publishedRevision,
  });
}));
router.get("/admin/heroes/asset", ...admin, wrap(async (req, res) => {
  const path = z.string().max(500).parse(req.query.objectPath);
  const [asset] = await db.select().from(heroAssets).where(eq(heroAssets.objectPath, path));
  if (!asset) throw new InspirationError(404, "Media no disponible");
  if (asset.contentType.startsWith("image/")) {
    await sendHeroAsset(path, res, false);
    return;
  }
  const file = await storage.getObjectEntityFile(path);
  const [metadata] = await file.getMetadata();
  const size = Number(metadata.size);
  if (size !== asset.sizeBytes || metadata.contentType !== asset.contentType) throw new InspirationError(404, "Media no disponible");
  streamRangedFile(req, res, file, size, asset.contentType);
}));
router.get("/admin/heroes/:id", ...admin, wrap(async (req, res) => { res.json(heroDto(await heroEntry(String(req.params.id)))); }));
router.post("/admin/heroes/uploads", ...admin, wrap(async (req, res) => {
  const body = z.object({ name: z.string().min(1).max(200), size: z.number().int().min(1).max(104857600), contentType: z.enum(["image/jpeg", "image/png", "image/webp", "video/mp4", "video/webm"]) }).parse(req.body);
  if (body.contentType.startsWith("image/") && body.size > 15 * 1024 * 1024) {
    throw new InspirationError(400, "La imagen supera el máximo de 15 MiB");
  }
  const uploadURL = await storage.getObjectEntityUploadURL(), objectPath = storage.normalizeObjectEntityPath(uploadURL);
  await db.insert(heroAssets).values({ objectPath, contentType: body.contentType, sizeBytes: body.size });
  res.json({ uploadURL, objectPath });
}));
router.post("/admin/heroes", ...admin, wrap(async (req, res) => {
  const body = z.object({ date: z.string(), revision: z.number().int().min(0).optional(), draft: heroContent }).parse(req.body);
  inspirationDate.parse(body.date); heroContent.parse(body.draft);
  const row = await db.transaction(async (tx) => {
    await lock(tx, "hero-editorial");
    const [existing] = await tx.select().from(heroes).where(eq(heroes.date, body.date));
    if (existing) throw new InspirationError(409, "La fecha ya tiene un hero", existing.revision);
    const [created] = await tx.insert(heroes).values({ date: body.date, draft: body.draft }).returning(); return created;
  });
  res.json(heroDto(row));
}));
router.put("/admin/heroes/:id", ...admin, wrap(async (req, res) => {
  const body = z.object({ date: z.string(), revision: z.number().int().min(0), draft: heroContent }).parse(req.body); inspirationDate.parse(body.date);
  const row = await db.transaction(async (tx) => {
    await lock(tx, "hero-editorial"); const old = await heroEntry(String(req.params.id), tx); requireInspirationRevision(old.revision, body.revision);
    const [updated] = await tx.update(heroes).set({ date: body.date, draft: body.draft, deleted: false, revision: old.revision + 1, updatedAt: new Date() }).where(eq(heroes.id, old.id)).returning(); return updated;
  }); res.json(heroDto(row));
}));
for (const action of ["publish", "unpublish", "delete"] as const) {
  const handler = wrap(async (req, res) => {
    const body = z.object({ revision: z.number().int().min(0) }).parse(req.body);
    const row = await db.transaction(async (tx) => {
      await lock(tx, "hero-editorial"); const old = await heroEntry(String(req.params.id), tx); requireInspirationRevision(old.revision, body.revision);
      let published = action === "publish" ? old.draft : null;
      if (action === "publish") {
        if (old.deleted) throw new InspirationError(400, "Guarda el borrador para restaurar este override antes de publicarlo");
        const generation = await verifyHeroMedia(old.draft.media, tx);
        if (old.draft.media.posterObjectPath) {
          const [poster] = await tx.select().from(heroAssets).where(eq(heroAssets.objectPath, old.draft.media.posterObjectPath));
          if (!poster || !poster.contentType.startsWith("image/")) throw new InspirationError(400, "Poster editorial no encontrado");
          await verifyHeroMedia({
            type: "image",
            objectPath: poster.objectPath,
            contentType: poster.contentType,
            sizeBytes: poster.sizeBytes,
            generation: poster.generation,
          }, tx);
        }
        published = { ...old.draft, media: { ...old.draft.media, generation } };
      }
      const [updated] = await tx.update(heroes).set({ revision: old.revision + 1, updatedAt: new Date(), published, publishedRevision: action === "publish" ? old.revision + 1 : null, ...(action === "delete" ? { deleted: true } : {}) }).where(eq(heroes.id, old.id)).returning(); return updated;
    }); res.json(heroDto(row));
  });
  if (action === "delete") router.delete("/admin/heroes/:id", ...admin, handler); else router.post(`/admin/heroes/:id/${action}`, ...admin, handler);
}
router.put("/admin/inspirations/settings", ...admin, wrap(async (req, res) => {
  const { revision, ...newLabels } = UpdateInspirationSettingsBody.parse(req.body);
  if (Object.values(newLabels).some((v) => !v.trim())) throw new InspirationError(400, "Las etiquetas no pueden estar vacías");
  const result = await db.transaction(async (tx) => {
    await lock(tx, "settings");
    const [old] = await tx.select().from(settings).where(eq(settings.id, 1));
    requireInspirationRevision(old?.revision ?? 0, revision);
    await tx.insert(settings).values({ id: 1, revision: revision + 1, labels: newLabels }).onConflictDoUpdate({ target: settings.id, set: { revision: revision + 1, labels: newLabels } });
    return { revision: revision + 1, ...newLabels };
  });
  res.json(result);
}));
router.post("/admin/inspirations/uploads", ...admin, wrap(async (req, res) => {
  const body = RequestInspirationUploadBody.parse(req.body);
  const uploadURL = await storage.getObjectEntityUploadURL();
  const objectPath = storage.normalizeObjectEntityPath(uploadURL);
  await db.insert(assets).values({ objectPath, contentType: body.contentType, sizeBytes: body.size });
  res.json({ uploadURL, objectPath });
}));
router.get("/admin/inspirations/image", ...admin, wrap(async (req, res) => {
  await sendImage(z.string().max(500).parse(req.query.objectPath), res, false);
}));
router.get("/admin/inspirations/:id", ...admin, wrap(async (req, res) => { res.json(adminDto(await entry(String(req.params.id)))); }));
router.post("/admin/inspirations", ...admin, wrap(async (req, res) => {
  const body = CreateAdminInspirationBody.parse(req.body);
  inspirationDate.parse(body.date);
  const result = await db.transaction(async (tx) => {
    await lock(tx, "editorial");
    await checkDraft(body.draft, tx);
    const [existing] = await tx.select().from(entries).where(eq(entries.date, body.date));
    if (existing) throw new InspirationError(409, "La fecha ya tiene identidad; recarga y edita su registro", existing.revision);
    const [row] = await tx.insert(entries).values({ date: body.date, draft: body.draft }).returning();
    return row;
  });
  res.json(adminDto(result));
}));
router.put("/admin/inspirations/:id", ...admin, wrap(async (req, res) => {
  const body = UpdateAdminInspirationBody.parse(req.body);
  inspirationDate.parse(body.date);
  const result = await db.transaction(async (tx) => {
    await lock(tx, "editorial");
    const old = await entry(String(req.params.id), tx);
    requireInspirationRevision(old.revision, body.revision);
    if (old.published && old.date !== body.date) throw new InspirationError(400, "Despublica antes de cambiar la fecha");
    await checkDraft(body.draft, tx);
    const [row] = await tx.update(entries).set({ date: body.date, draft: body.draft, deleted: false, revision: old.revision + 1, updatedAt: new Date() }).where(eq(entries.id, old.id)).returning();
    return row;
  });
  res.json(adminDto(result));
}));
for (const action of ["publish", "unpublish", "delete"] as const) {
  const handler = wrap(async (req, res) => {
    const body = PublishAdminInspirationBody.parse(req.body);
    const result = await db.transaction(async (tx) => {
      await lock(tx, "editorial");
      const old = await entry(String(req.params.id), tx);
      requireInspirationRevision(old.revision, body.revision);
      const revision = old.revision + 1;
      if (action === "publish") {
        if (old.deleted || !old.draft.quote.trim() || !old.draft.reflection.trim() || !old.draft.imagePath) throw new InspirationError(400, "Publicar requiere frase, reflexión e imagen válidas");
        await checkDraft(old.draft, tx);
        if (old.draft.sessionId) {
          const [session] = await tx.select({ status: catalogSessionsTable.status }).from(catalogSessionsTable).where(eq(catalogSessionsTable.id, old.draft.sessionId));
          if (session?.status !== "published") throw new InspirationError(400, "El audio relacionado debe estar publicado");
        }
        const image = await checkedAsset(old.draft.imagePath, tx);
        await tx.update(assets).set({ generation: image.generation }).where(eq(assets.objectPath, old.draft.imagePath));
      }
      const [row] = await tx.update(entries).set({
        revision, updatedAt: new Date(),
        published: action === "publish" ? old.draft : null,
        publishedRevision: action === "publish" ? revision : null,
        ...(action === "delete" ? { deleted: true, draft: emptyInspirationContent } : {}),
      }).where(eq(entries.id, old.id)).returning();
      return row;
    });
    res.json(adminDto(result));
  });
  if (action === "delete") router.delete("/admin/inspirations/:id", ...admin, handler);
  else router.post(`/admin/inspirations/:id/${action}`, ...admin, handler);
}

async function favoriteDto(row: typeof favorites.$inferSelect, req: Request) {
  const clock = inspirationClock(req.query.timeZone);
  const [published] = row.deleted ? [] : await db.select().from(entries).where(eq(entries.id, row.inspirationId));
  return {
    inspirationId: row.inspirationId, revision: row.revision, deleted: row.deleted, updatedAt: row.updatedAt.toISOString(),
    day: published ? inspirationDay(published, published.date, clock.today, clock.timeZone, origin(req)) : null,
  };
}
async function noteDto(row: typeof notes.$inferSelect) {
  const [linked] = await db.select({ date: entries.date }).from(entries).where(eq(entries.id, row.inspirationId));
  return { id: row.id, inspirationId: row.inspirationId, text: row.text, revision: row.revision, deleted: row.deleted, updatedAt: row.updatedAt.toISOString(), date: linked?.date ?? null };
}
router.get("/me/inspiration-favorites", requireAuth, wrap(async (req, res) => {
  inspirationClock(req.query.timeZone);
  const rows = await db.select().from(favorites).where(eq(favorites.userId, req.currentUser!.id));
  res.json({ items: await Promise.all(rows.map((r) => favoriteDto(r, req))) });
}));
router.put("/me/inspiration-favorites/:inspirationId", requireAuth, wrap(async (req, res) => {
  const body = PutInspirationFavoriteBody.parse(req.body);
  const id = uuid.parse(req.params.inspirationId), userId = req.currentUser!.id;
  const clock = inspirationClock(req.query.timeZone);
  const result = await db.transaction(async (tx) => {
    await lock(tx, `favorite:${userId}:${id}`);
    const condition = and(eq(favorites.userId, userId), eq(favorites.inspirationId, id));
    const [old] = await tx.select().from(favorites).where(condition);
    if (old && old.revision === body.revision + 1 && old.deleted === body.deleted) return old;
    requireInspirationRevision(old?.revision ?? 0, body.revision);
    if (!body.deleted && !inspirationAvailable(await entry(id, tx), clock.today)) throw new InspirationError(404, "Inspiración no disponible");
    const value = { userId, inspirationId: id, revision: body.revision + 1, deleted: body.deleted, updatedAt: new Date() };
    const [row] = await tx.insert(favorites).values(value).onConflictDoUpdate({ target: [favorites.userId, favorites.inspirationId], set: value }).returning();
    return row;
  });
  res.json(await favoriteDto(result, req));
}));
router.get("/me/inspiration-notes", requireAuth, wrap(async (req, res) => {
  const id = req.query.inspirationId === undefined ? undefined : uuid.parse(req.query.inspirationId);
  const rows = await db.select().from(notes).where(and(eq(notes.userId, req.currentUser!.id), id ? eq(notes.inspirationId, id) : undefined));
  res.json({ items: await Promise.all(rows.map(noteDto)) });
}));
router.put("/me/inspiration-notes/:id", requireAuth, wrap(async (req, res) => {
  const body = PutInspirationNoteBody.parse(req.body);
  const id = uuid.parse(req.params.id), inspirationId = uuid.parse(body.inspirationId), userId = req.currentUser!.id;
  const clock = inspirationClock(req.query.timeZone);
  if (!body.deleted && !body.text.trim()) throw new InspirationError(400, "La nota no puede estar vacía");
  const text = body.deleted ? "" : body.text;
  const result = await db.transaction(async (tx) => {
    await lock(tx, `note:${userId}:${id}`);
    const [old] = await tx.select().from(notes).where(and(eq(notes.userId, userId), eq(notes.id, id)));
    if (old && old.inspirationId !== inspirationId) throw new InspirationError(409, "No se puede mover una nota a otra inspiración", old.revision);
    if (old && old.revision === body.revision + 1 && old.deleted === body.deleted && old.text === text) return old;
    requireInspirationRevision(old?.revision ?? 0, body.revision);
    if (old?.deleted && !body.deleted) throw new InspirationError(409, "La nota fue borrada. Guarda el texto con una identidad nueva.", old.revision);
    if (!old && !body.deleted && !inspirationAvailable(await entry(inspirationId, tx), clock.today)) throw new InspirationError(404, "Inspiración no disponible");
    const value = { id, userId, inspirationId, text, deleted: body.deleted, revision: body.revision + 1, updatedAt: new Date() };
    const [row] = await tx.insert(notes).values(value).onConflictDoUpdate({ target: [notes.userId, notes.id], set: value }).returning();
    return row;
  });
  res.json(await noteDto(result));
}));
export default router;