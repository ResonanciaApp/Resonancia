import { Router, type IRouter } from "express";
import { asc, eq } from "drizzle-orm";
import { db, mixerSoundsTable, type MixerSound } from "@workspace/db";

const router: IRouter = Router();

function serializeSound(s: MixerSound) {
  return {
    id: s.id,
    name: s.name,
    categoryId: s.categoryId,
    iconName: s.iconName,
    iconSet: s.iconSet,
    isPremium: s.isPremium,
    isActive: s.isActive,
    sortOrder: s.sortOrder,
    objectPath: s.objectPath ?? null,
    thumbnailObjectPath: s.thumbnailObjectPath ?? null,
    tags: (s.tags as string[] | null) ?? null,
    bpm: s.bpm ?? null,
    loopBars: s.loopBars ?? null,
  };
}

// GET /sounds — catálogo de sonidos del mixer (activos).
router.get("/sounds", async (req, res) => {
  try {
    const rows = await db
      .select()
      .from(mixerSoundsTable)
      .where(eq(mixerSoundsTable.isActive, true))
      .orderBy(asc(mixerSoundsTable.sortOrder), asc(mixerSoundsTable.name));
    res.json({ sounds: rows.map(serializeSound) });
  } catch (err) {
    req.log.error({ err }, "error listing mixer sounds");
    res.status(500).json({ error: "Error al obtener sonidos" });
  }
});

export default router;
