import { Router, type Response } from "express";
import { eq } from "drizzle-orm";
import { db, growthCatalogTable, usersTable } from "@workspace/db";
import { SaveGrowthCatalogBody, UnlockGrowthAvatarBody } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";
import { requireRole } from "../middlewares/requireRole";
import { getGrowthProgress, readGrowthCatalog, unlockGrowthAvatar } from "../lib/growthService";
import { GrowthError, validateGrowthOrder } from "../lib/growthRules";
import { growthSeed } from "../lib/growthSeed";
import { lockObjectPaths, validateOwnedCompletedImageUpload } from "../lib/objectAccess";

const router = Router();
const respondError = (res: Response, error: unknown) => {
  if (error instanceof GrowthError) { res.status(error.status).json({ error: error.message }); return; }
  console.error("[Tu camino]", error);
  res.status(500).json({ error: "No se pudo completar la operación de Tu camino" });
};
router.get("/growth/catalog", async (_req, res) => {
  try { res.json(await readGrowthCatalog()); } catch (error) { respondError(res, error); }
});
router.put("/admin/growth/catalog", requireAuth, requireRole("admin"), async (req, res) => {
  const parsed = SaveGrowthCatalogBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Revisa los campos de las etapas y candados", details: parsed.error.flatten() }); return; }
  try {
    const { stages, revision } = parsed.data;
    validateGrowthOrder(stages);
    await db.transaction(async tx => {
      const [before] = await tx.select().from(growthCatalogTable)
        .where(eq(growthCatalogTable.id, "main")).for("update");
      if (!before || before.revision !== revision) throw new GrowthError(409, "Tu camino cambió. Recarga la configuración antes de guardar");
      const images = [...new Set(stages.map(s => s.imageUrl))];
      await lockObjectPaths(tx, images.filter(p => p.startsWith("/objects/")));
      for (const image of images) {
        if (image.startsWith("/objects/")) {
          // Existing references can be retained by another editor; new references require ownership.
          if (before.stages.some(s => s.imageUrl === image)) continue;
          const validation = await validateOwnedCompletedImageUpload({ objectPath: image, userId: req.currentUser!.id, executor: tx });
          if (!validation.ok) throw new GrowthError(400, `La imagen no es una subida válida (${validation.reason})`);
        } else if (!growthSeed.some(stage => stage.imageUrl === image)) {
          throw new GrowthError(400, "Sube la imagen desde el editor de Tu camino");
        }
      }
      await tx.update(growthCatalogTable).set({ stages, revision: revision + 1, updatedAt: new Date() })
        .where(eq(growthCatalogTable.id, "main"));
    });
    res.json(await readGrowthCatalog());
  } catch (error) { respondError(res, error); }
});
router.get("/me/growth", requireAuth, async (req, res) => {
  try { res.json(await getGrowthProgress(req.currentUser!.id)); } catch (error) { respondError(res, error); }
});
router.post("/me/growth/avatars/unlock", requireAuth, async (req, res) => {
  const parsed = UnlockGrowthAvatarBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Selecciona un avatar válido" }); return; }
  if (parsed.data.expectedClerkUserId !== req.currentUser!.clerkUserId) {
    res.status(409).json({ error: "La cuenta cambió. Vuelve a abrir el selector." }); return;
  }
  try { res.json(await unlockGrowthAvatar(req.currentUser!.id, parsed.data.avatarId)); }
  catch (error) { respondError(res, error); }
});
router.get("/users/:userId/growth", requireAuth, async (req, res) => {
  const id = Number(req.params.userId);
  if (!Number.isSafeInteger(id) || id < 1) { res.status(400).json({ error: "Usuario inválido" }); return; }
  try {
    const [user] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.id, id));
    if (!user) { res.status(404).json({ error: "Usuario no encontrado" }); return; }
    const { currentStage } = await getGrowthProgress(id);
    res.json({ currentStage }); // no wallet or avatar ownership leaks to visitors
  } catch (error) { respondError(res, error); }
});
export default router;
