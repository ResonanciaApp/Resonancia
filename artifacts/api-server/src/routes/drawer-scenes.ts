import { Router } from "express";
import { db, drawerScenesTable } from "@workspace/db";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { requireAuth } from "../middlewares/requireAuth";
import { requireRole } from "../middlewares/requireRole";
import { lockObjectPaths, validateOwnedCompletedImageUpload } from "../lib/objectAccess";

const router = Router();
const ids = ["cloudy", "indigo2", "natural", "pleyades", "galactic", "fuego"] as const;
const titles = ["Día", "Noche", "Natural", "Pleyades", "Galactic", "Fuego"];
const defaults = ids.map((id, index) => ({ id, title: titles[index], iconPath: null }));
const input = z.object({ scenes: z.array(z.object({
  id: z.enum(ids), title: z.string().trim().min(1).max(40),
  iconPath: z.string().regex(/^\/objects\/.+/).nullable(),
})).length(6) }).refine(value => new Set(value.scenes.map(scene => scene.id)).size === 6);
let ready: Promise<unknown> | undefined;
function ensureSchema() {
  ready ??= db.execute(sql`CREATE TABLE IF NOT EXISTS drawer_scenes_settings (id integer PRIMARY KEY CHECK (id = 1), content jsonb NOT NULL)`)
    .catch(error => { ready = undefined; throw error; });
  return ready;
}

router.get(["/drawer-scenes", "/admin/drawer-scenes"], (req, res, next) => {
  if (req.path.startsWith("/admin/")) requireAuth(req, res, () => requireRole("admin")(req, res, next));
  else next();
}, async (req, res) => {
  try {
    await ensureSchema();
    const [row] = await db.select().from(drawerScenesTable);
    res.setHeader("Cache-Control", "no-store");
    res.json({ scenes: row?.content ?? defaults });
  } catch (error) {
    req.log.error({ error }, "Cannot read drawer scenes");
    res.status(500).json({ error: "No se pudieron cargar las escenas" });
  }
});
router.put("/admin/drawer-scenes", requireAuth, requireRole("admin"), async (req, res) => {
  const parsed = input.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Revisa los títulos y las seis escenas" }); return; }
  try {
    await ensureSchema();
    await db.transaction(async tx => {
      const paths = parsed.data.scenes.flatMap(scene => scene.iconPath ? [scene.iconPath] : []);
      await lockObjectPaths(tx, paths);
      await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtextextended('drawer-scenes', 0))`);
      const [old] = await tx.select().from(drawerScenesTable);
      for (const scene of parsed.data.scenes) {
        if (!scene.iconPath || old?.content.some(item => item.iconPath === scene.iconPath)) continue;
        const upload = await validateOwnedCompletedImageUpload({ objectPath: scene.iconPath, userId: req.currentUser!.id });
        if (!upload.ok) throw new Error("invalid_upload");
      }
      await tx.insert(drawerScenesTable).values({ id: 1, content: parsed.data.scenes })
        .onConflictDoUpdate({ target: drawerScenesTable.id, set: { content: parsed.data.scenes } });
    });
    res.json(parsed.data);
  } catch (error) {
    if (error instanceof Error && error.message === "invalid_upload") {
      res.status(400).json({ error: "Sube una imagen válida antes de guardar" }); return;
    }
    req.log.error({ error }, "Cannot save drawer scenes");
    res.status(500).json({ error: "No se pudieron guardar las escenas" });
  }
});
export default router;
