import { Router } from "express";
import { eq, sql } from "drizzle-orm";
import { db, premiumContentSettingsTable as table, DEFAULT_PREMIUM_CONTENT } from "@workspace/db";
import { UpdateAdminPremiumContentBody } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";
import { requireRole } from "../middlewares/requireRole";
import { lockObjectPaths, validateOwnedCompletedImageUpload } from "../lib/objectAccess";
import { ObjectStorageService } from "../lib/objectStorage";

const router = Router();
const storage = new ObjectStorageService();
let ready: Promise<unknown> | undefined;
function ensureSchema() {
  ready ??= db.execute(sql`CREATE TABLE IF NOT EXISTS premium_content_settings (
    id integer PRIMARY KEY CHECK(id = 1), content jsonb NOT NULL,
    revision integer NOT NULL, updated_at timestamptz NOT NULL DEFAULT now()
  )`).catch(error => { ready = undefined; throw error; });
  return ready;
}
async function readSettings() {
  await ensureSchema();
  const [row] = await db.select().from(table).where(eq(table.id, 1));
  return { content: row?.content ?? DEFAULT_PREMIUM_CONTENT, revision: row?.revision ?? 0 };
}
router.get("/premium-content", async (req, res) => {
  try { res.setHeader("Cache-Control", "no-store"); res.json(await readSettings()); }
  catch (err) { req.log.error({ err }, "Read Premium content"); res.status(500).json({ error: "No se pudo cargar Premium" }); }
});
router.get("/admin/premium-content", requireAuth, requireRole("admin"), async (req, res) => {
  try { res.setHeader("Cache-Control", "no-store"); res.json(await readSettings()); }
  catch (err) { req.log.error({ err }, "Read admin Premium"); res.status(500).json({ error: "No se pudo cargar Premium" }); }
});
router.put("/admin/premium-content", requireAuth, requireRole("admin"), async (req, res) => {
  const parsed = UpdateAdminPremiumContentBody.safeParse(req.body);
  if (!parsed.success || Object.values(parsed.data.content).some(s =>
    !s.title.trim() || s.images.some(p => !/^builtin:[0-9]$/.test(p) && !/^\/objects\/[a-zA-Z0-9/_-]+$/.test(p)))) {
    res.status(400).json({ error: "Contenido o imágenes inválidas" }); return;
  }
  const { content, revision } = parsed.data;
  if (content.sounds.images.length || content.profile.images.length) {
    res.status(400).json({ error: "Solo Inicio y Dormir admiten carruseles" }); return;
  }
  try {
    await ensureSchema();
    const result = await db.transaction(async tx => {
      await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtextextended('premium-content-settings',0))`);
      const [old] = await tx.select().from(table).where(eq(table.id, 1));
      if ((old?.revision ?? 0) !== revision) return null;
      const paths = [...new Set(Object.values(content).flatMap(s => s.images).filter(p => p.startsWith("/objects/")))];
      await lockObjectPaths(tx, paths);
      const oldPaths = new Set(Object.values(old?.content ?? DEFAULT_PREMIUM_CONTENT).flatMap(s => s.images));
      for (const objectPath of paths) {
        if (!oldPaths.has(objectPath)) {
          const valid = await validateOwnedCompletedImageUpload({ objectPath, userId: req.currentUser!.id, executor: tx });
          if (!valid.ok) throw new Error("INVALID_IMAGE");
        }
      }
      await tx.insert(table).values({ id: 1, content, revision: revision + 1 })
        .onConflictDoUpdate({ target: table.id, set: { content, revision: revision + 1, updatedAt: new Date() } });
      return { content, revision: revision + 1 };
    });
    if (!result) { res.status(409).json({ error: "Otro editor guardó cambios. Recarga la versión actual." }); return; }
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Save Premium");
    res.status(err instanceof Error && err.message === "INVALID_IMAGE" ? 400 : 500)
      .json({ error: "No se pudo guardar. Verifica que las imágenes hayan terminado de subir." });
  }
});
// Only published carousel entries are served publicly; an arbitrary private path never grants access.
router.get("/premium-content/image/:surface/:index", async (req, res) => {
  try {
    const { content } = await readSettings();
    const surface = req.params.surface;
    if (!["home", "sleep"].includes(surface) || !/^\d+$/.test(req.params.index)) { res.sendStatus(404); return; }
    const path = content[surface as "home" | "sleep"].images[Number(req.params.index)];
    if (!path?.startsWith("/objects/")) { res.sendStatus(404); return; }
    const file = await storage.getObjectEntityFile(path);
    const [metadata] = await file.getMetadata();
    if (!String(metadata.contentType).startsWith("image/")) { res.sendStatus(404); return; }
    res.setHeader("Content-Type", String(metadata.contentType));
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");
    file.createReadStream().on("error", () => { if (!res.headersSent) res.sendStatus(404); else res.destroy(); }).pipe(res);
  } catch { res.sendStatus(404); }
});
export default router;
