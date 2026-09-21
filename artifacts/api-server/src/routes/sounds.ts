import { Router, type IRouter } from "express";
import { asc, eq } from "drizzle-orm";
import { db, mixerSoundsTable, mixerSoundCategoriesTable, type MixerSound } from "@workspace/db";

const router: IRouter = Router();

function serializeSound(s: MixerSound) {
  return {
    id: s.id,
    name: s.name,
    categoryId: s.categoryId,
    iconName: s.iconName,
    iconSet: s.iconSet,
    isPremium: s.isPremium,
    showInMeditationBackgrounds: s.showInMeditationBackgrounds,
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
    const [rows, categories] = await Promise.all([
      db
      .select()
      .from(mixerSoundsTable)
      .where(eq(mixerSoundsTable.isActive, true))
      .orderBy(asc(mixerSoundsTable.sortOrder), asc(mixerSoundsTable.name)),
      db.select().from(mixerSoundCategoriesTable)
        .where(eq(mixerSoundCategoriesTable.isActive, true))
        .orderBy(asc(mixerSoundCategoriesTable.sortOrder), asc(mixerSoundCategoriesTable.label)),
    ]);
    res.json({ sounds: rows.map(serializeSound), categories });
  } catch (err) {
    req.log.error({ err }, "error listing mixer sounds");
    res.status(500).json({ error: "Error al obtener sonidos" });
  }
});

export default router;
