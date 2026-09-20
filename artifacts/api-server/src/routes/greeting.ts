import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db, greetingSettingsTable, type GreetingSettings } from "@workspace/db";
import { UpdateAdminGreetingBody } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";
import { requireRole } from "../middlewares/requireRole";

const router: IRouter = Router();
const admin = [requireAuth, requireRole("admin")] as const;
const updateSchema = UpdateAdminGreetingBody.superRefine((value, ctx) => {
  if (value.enabled && !(typeof value.text === "string" && value.text.trim())) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["text"], message: "El saludo activo no puede estar vacío" });
  }
});

export function validateGreetingUpdate(value: unknown) {
  return updateSchema.safeParse(value);
}
export function publicGreetingDto(row: GreetingSettings | null) {
  return { enabled: row?.enabled ?? false, text: row?.enabled ? row.text : null };
}
function adminDto(row: GreetingSettings | null) {
  return {
    enabled: row?.enabled ?? false,
    text: row?.text ?? null,
    revision: row?.revision ?? 0,
    updatedAt: (row?.updatedAt ?? new Date(0)).toISOString(),
  };
}
async function setting() {
  const [row] = await db.select().from(greetingSettingsTable).where(eq(greetingSettingsTable.id, 1));
  return row ?? null;
}

router.get("/greeting", async (_req, res): Promise<void> => {
  try {
    res.json(publicGreetingDto(await setting()));
  } catch (err) {
    _req.log?.error({ err: (err as Error).name }, "Failed to read greeting");
    res.status(500).json({ error: "No se pudo obtener el saludo" });
  }
});

router.get("/admin/greeting", ...admin, async (_req, res): Promise<void> => {
  try {
    res.setHeader("Cache-Control", "private, no-store");
    res.json(adminDto(await setting()));
  } catch (err) {
    _req.log?.error({ err: (err as Error).name }, "Failed to read admin greeting");
    res.status(500).json({ error: "No se pudo obtener el saludo" });
  }
});

router.put("/admin/greeting", ...admin, async (req, res): Promise<void> => {
  const parsed = validateGreetingUpdate(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Datos inválidos" });
    return;
  }
  const body = parsed.data;
  const text = body.text == null ? null : body.text.trim() || null;
  if (body.enabled && !text) {
    res.status(400).json({ error: "El saludo activo no puede estar vacío" });
    return;
  }
  try {
    const result = await db.transaction(async (tx) => {
      await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtextextended('greeting-settings', 0))`);
      const [old] = await tx.select().from(greetingSettingsTable).where(eq(greetingSettingsTable.id, 1));
      const currentRevision = old?.revision ?? 0;
      if (body.revision !== currentRevision) return { conflict: true, currentRevision };
      const values = { id: 1, enabled: body.enabled, text, revision: currentRevision + 1, updatedAt: new Date() };
      const [saved] = await tx.insert(greetingSettingsTable).values(values).onConflictDoUpdate({
        target: greetingSettingsTable.id,
        set: values,
      }).returning();
      return { conflict: false, saved };
    });
    if (result.conflict) {
      res.status(409).json({ error: "El saludo cambió; recarga e inténtalo de nuevo", currentRevision: result.currentRevision });
      return;
    }
    res.json(adminDto(result.saved ?? null));
  } catch (err) {
    req.log?.error({ err: (err as Error).name }, "Failed to update greeting");
    res.status(500).json({ error: "No se pudo guardar el saludo" });
  }
});

export default router;