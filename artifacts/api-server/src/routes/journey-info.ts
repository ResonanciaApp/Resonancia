import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, journeyInfoSettingsTable } from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth";
import { requireRole } from "../middlewares/requireRole";
import { DEFAULT_JOURNEY_INFO, validateJourneyInfoUpdate } from "../lib/journeyInfoContent";

const router: IRouter = Router();
const admin = [requireAuth, requireRole("admin")] as const;
let schemaReady: Promise<unknown> | undefined;
function ensureSchema() {
  schemaReady ??= db.execute(sql`
    CREATE TABLE IF NOT EXISTS journey_info_settings (
      id integer PRIMARY KEY CHECK (id = 1),
      content jsonb NOT NULL,
      revision integer NOT NULL CHECK (revision > 0),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `).catch(error => { schemaReady = undefined; throw error; });
  return schemaReady;
}
async function readSettings() {
  await ensureSchema();
  const [row] = await db.select().from(journeyInfoSettingsTable).where(eq(journeyInfoSettingsTable.id, 1));
  return { content: row?.content ?? DEFAULT_JOURNEY_INFO, revision: row?.revision ?? 0 };
}
router.get(["/journey-info", "/admin/journey-info"], (req, res, next) => {
  if (req.path.startsWith("/admin/")) {
    requireAuth(req, res, () => requireRole("admin")(req, res, next));
  } else next();
}, async (req, res) => {
  try {
    res.setHeader("Cache-Control", "no-store");
    res.json(await readSettings());
  } catch (err) {
    req.log.error({ err }, "Cannot read journey explanation");
    res.status(500).json({ error: "No se pudo cargar El Recorrido" });
  }
});
router.put("/admin/journey-info", ...admin, async (req, res) => {
  const parsed = validateJourneyInfoUpdate(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Textos inválidos" });
    return;
  }
  try {
    await ensureSchema();
    const result = await db.transaction(async tx => {
      await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtextextended('journey-info-settings', 0))`);
      const [old] = await tx.select().from(journeyInfoSettingsTable).where(eq(journeyInfoSettingsTable.id, 1));
      if ((old?.revision ?? 0) !== parsed.data.revision) return null;
      const revision = parsed.data.revision + 1;
      const { content } = parsed.data;
      await tx.insert(journeyInfoSettingsTable).values({ id: 1, content, revision })
        .onConflictDoUpdate({
          target: journeyInfoSettingsTable.id,
          set: { content, revision, updatedAt: new Date() },
        });
      return { content, revision };
    });
    if (!result) {
      res.status(409).json({ error: "Otra persona modificó estos textos. Recarga antes de guardar." });
      return;
    }
    res.setHeader("Cache-Control", "no-store");
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Cannot save journey explanation");
    res.status(500).json({ error: "No se pudo guardar El Recorrido" });
  }
});
export default router;
