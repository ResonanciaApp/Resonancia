import { Router, type IRouter, type Request, type Response, type RequestHandler } from "express";
import { and, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import {
  db, inspirationsTable as entries, inspirationSettingsTable as settings,
  inspirationAssetsTable as assets, inspirationFavoritesTable as favorites,
  inspirationNotesTable as notes, catalogSessionsTable,
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
  return row ? { revision: row.revision, ...row.labels } : defaultInspirationSettings;
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
    if (!image) throw new InspirationError(400, "Usa una imagen cargada desde Inspiración diaria");
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