import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, streakInfoSettingsTable } from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth";
import { requireRole } from "../middlewares/requireRole";
import { DEFAULT_STREAK_INFO, validateStreakInfoUpdate } from "../lib/streakInfoContent";

const router: IRouter = Router();
const admin = [requireAuth, requireRole("admin")] as const;
let schemaReady: Promise<unknown> | undefined;

/** Additive, idempotent setup; never runs a broad schema push or changes other data. */
function ensureSchema() {
  schemaReady ??= db.execute(sql`
    CREATE TABLE IF NOT EXISTS streak_info_settings (
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
  const [row] = await db.select().from(streakInfoSettingsTable).where(eq(streakInfoSettingsTable.id, 1));
  return { content: row?.content ?? DEFAULT_STREAK_INFO, revision: row?.revision ?? 0 };
}

router.get("/streak-info", async (req, res) => {
  try {
    res.setHeader("Cache-Control", "no-store");
    res.json(await readSettings());
  } catch (err) {
    req.log.error({ err }, "Cannot read streak information");
    res.status(500).json({ error: "No se pudo cargar el sistema de rachas" });
  }
});
router.get("/admin/streak-info", ...admin, async (req, res) => {
  try {
    res.setHeader("Cache-Control", "private, no-store");
    res.json(await readSettings());
  } catch (err) {
    req.log.error({ err }, "Cannot read admin streak information");
    res.status(500).json({ error: "No se pudo cargar el sistema de rachas" });
  }
});
router.put("/admin/streak-info", ...admin, async (req, res) => {
  const parsed = validateStreakInfoUpdate(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Textos inválidos", details: parsed.error.flatten() });
    return;
  }
  try {
    await ensureSchema();
    const result = await db.transaction(async tx => {
      await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtextextended('streak-info-settings', 0))`);
      const [old] = await tx.select().from(streakInfoSettingsTable).where(eq(streakInfoSettingsTable.id, 1));
      if ((old?.revision ?? 0) !== parsed.data.revision) return null;
      const revision = parsed.data.revision + 1;
      const { content } = parsed.data;
      await tx.insert(streakInfoSettingsTable).values({ id: 1, content, revision })
        .onConflictDoUpdate({
          target: streakInfoSettingsTable.id,
          set: { content, revision, updatedAt: new Date() },
        });
      return { content, revision };
    });
    if (!result) {
      res.status(409).json({ error: "Otra persona modificó estos textos. Recarga antes de guardar." });
      return;
    }
    res.setHeader("Cache-Control", "private, no-store");
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Cannot save streak information");
    res.status(500).json({ error: "No se pudo guardar el sistema de rachas" });
  }
});

export default router;
