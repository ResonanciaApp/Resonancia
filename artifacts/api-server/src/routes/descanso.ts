import { Router, type IRouter } from "express";
import { asc, eq } from "drizzle-orm";
import {
  db,
  descansoSoundsTable,
  insertDescansoSoundSchema,
  updateDescansoSoundSchema,
  type DescansoSound,
} from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth";
import { requireRole } from "../middlewares/requireRole";

const router: IRouter = Router();

function serializeDescansoSound(s: DescansoSound) {
  return {
    id: s.id,
    label: s.label,
    categoryId: s.categoryId,
    audioObjectPath: s.audioObjectPath ?? null,
    thumbnailObjectPath: s.thumbnailObjectPath ?? null,
    sortOrder: s.sortOrder,
    isActive: s.isActive,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  };
}

// GET /descanso-sounds — sonidos activos (público, para la app móvil).
router.get("/descanso-sounds", async (req, res) => {
  try {
    const rows = await db
      .select()
      .from(descansoSoundsTable)
      .where(eq(descansoSoundsTable.isActive, true))
      .orderBy(asc(descansoSoundsTable.categoryId), asc(descansoSoundsTable.sortOrder));
    res.json({ sounds: rows.map(serializeDescansoSound) });
  } catch (err) {
    req.log.error({ err }, "error listing descanso sounds");
    res.status(500).json({ error: "Error al obtener sonidos" });
  }
});

// GET /admin/descanso-sounds — listar todos (admin).
router.get("/admin/descanso-sounds", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const rows = await db
      .select()
      .from(descansoSoundsTable)
      .orderBy(asc(descansoSoundsTable.categoryId), asc(descansoSoundsTable.sortOrder));
    res.json({ sounds: rows.map(serializeDescansoSound) });
  } catch (err) {
    req.log.error({ err }, "error listing descanso sounds (admin)");
    res.status(500).json({ error: "Error al obtener sonidos" });
  }
});

// POST /admin/descanso-sounds — crear sonido.
router.post("/admin/descanso-sounds", requireAuth, requireRole("admin"), async (req, res) => {
  const parsed = insertDescansoSoundSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Datos inválidos", details: parsed.error.issues });
    return;
  }
  try {
    const [existing] = await db.select().from(descansoSoundsTable).where(eq(descansoSoundsTable.id, parsed.data.id)).limit(1);
    if (existing) {
      res.status(409).json({ error: "Ya existe un sonido con ese ID" });
      return;
    }
    const [created] = await db.insert(descansoSoundsTable).values(parsed.data).returning();
    req.log.info({ soundId: created.id }, "descanso sound created");
    res.status(201).json(serializeDescansoSound(created));
  } catch (err) {
    req.log.error({ err }, "error creating descanso sound");
    res.status(500).json({ error: "Error al crear el sonido" });
  }
});

// PATCH /admin/descanso-sounds/:id — actualizar sonido.
router.patch("/admin/descanso-sounds/:id", requireAuth, requireRole("admin"), async (req, res) => {
  const id = String(req.params.id);
  const parsed = updateDescansoSoundSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Datos inválidos", details: parsed.error.issues });
    return;
  }
  if (Object.keys(parsed.data).length === 0) {
    res.status(400).json({ error: "No hay campos para actualizar" });
    return;
  }
  try {
    const [updated] = await db
      .update(descansoSoundsTable)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(descansoSoundsTable.id, id))
      .returning();
    if (!updated) {
      res.status(404).json({ error: "Sonido no encontrado" });
      return;
    }
    req.log.info({ soundId: id }, "descanso sound updated");
    res.json(serializeDescansoSound(updated));
  } catch (err) {
    req.log.error({ err }, "error updating descanso sound");
    res.status(500).json({ error: "Error al actualizar el sonido" });
  }
});

// DELETE /admin/descanso-sounds/:id — eliminar sonido.
router.delete("/admin/descanso-sounds/:id", requireAuth, requireRole("admin"), async (req, res) => {
  const id = String(req.params.id);
  try {
    const [deleted] = await db
      .delete(descansoSoundsTable)
      .where(eq(descansoSoundsTable.id, id))
      .returning();
    if (!deleted) {
      res.status(404).json({ error: "Sonido no encontrado" });
      return;
    }
    req.log.info({ soundId: id }, "descanso sound deleted");
    res.status(204).end();
  } catch (err) {
    req.log.error({ err }, "error deleting descanso sound");
    res.status(500).json({ error: "Error al eliminar el sonido" });
  }
});

export default router;
