import { randomUUID } from "node:crypto";
import { Router, type IRouter } from "express";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db, coverPresetsTable, profileAvatarCategoriesTable, profileAvatarMembershipsTable } from "@workspace/db";
import { CreateProfileAvatarCategoryBody, UpdateProfileAvatarCategoryBody, UpdateProfileAvatarMembershipsBody } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";
import { requireRole } from "../middlewares/requireRole";
import { normalizeAvatarCategoryName } from "../lib/profileAvatarCategories";
import { listPresets } from "./cover-presets";

const router: IRouter = Router();
router.use("/admin/profile-avatar-categories", requireAuth, requireRole("admin"));
router.use("/admin/profile-avatar-memberships", requireAuth, requireRole("admin"));

function isUniqueViolation(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as { code?: string; cause?: unknown };
  return e.code === "23505" || (e.cause !== undefined && isUniqueViolation(e.cause));
}

router.post("/admin/profile-avatar-categories", async (req, res): Promise<void> => {
  const parsed = CreateProfileAvatarCategoryBody.safeParse(req.body);
  const name = parsed.success ? normalizeAvatarCategoryName(parsed.data.name) : null;
  if (!name) { res.status(400).json({ error: "Escribe un nombre válido de hasta 80 caracteres, distinto de Todos o Sin categoría." }); return; }
  try {
    const [created] = await db.insert(profileAvatarCategoriesTable).values({ id: randomUUID(), ...name }).returning();
    res.status(201).json({ id: created.id, name: created.name });
  } catch (err) {
    if (isUniqueViolation(err)) { res.status(409).json({ error: "Ya existe una categoría con ese nombre." }); return; }
    req.log.error({ err }, "creating avatar category");
    res.status(500).json({ error: "No se pudo crear la categoría." });
  }
});

router.patch("/admin/profile-avatar-categories/:id", async (req, res): Promise<void> => {
  const parsed = UpdateProfileAvatarCategoryBody.safeParse(req.body);
  const name = parsed.success ? normalizeAvatarCategoryName(parsed.data.name) : null;
  if (!name) { res.status(400).json({ error: "Escribe un nombre válido de hasta 80 caracteres, distinto de Todos o Sin categoría." }); return; }
  try {
    const [updated] = await db.update(profileAvatarCategoriesTable).set(name).where(eq(profileAvatarCategoriesTable.id, String(req.params.id))).returning();
    if (!updated) { res.status(404).json({ error: "La categoría ya no existe." }); return; }
    res.json({ id: updated.id, name: updated.name });
  } catch (err) {
    if (isUniqueViolation(err)) { res.status(409).json({ error: "Ya existe una categoría con ese nombre." }); return; }
    req.log.error({ err }, "updating avatar category");
    res.status(500).json({ error: "No se pudo editar la categoría." });
  }
});

router.delete("/admin/profile-avatar-categories/:id", async (req, res): Promise<void> => {
  try {
    const removed = await db.transaction(async tx => {
      await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended('profile', 402))`);
      return tx.delete(profileAvatarCategoriesTable).where(eq(profileAvatarCategoriesTable.id, String(req.params.id))).returning({ id: profileAvatarCategoriesTable.id });
    });
    if (!removed.length) { res.status(404).json({ error: "La categoría ya no existe." }); return; }
    res.status(204).end();
  } catch (err) {
    req.log.error({ err }, "deleting avatar category");
    res.status(500).json({ error: "No se pudo eliminar la categoría." });
  }
});

router.put("/admin/profile-avatar-memberships", async (req, res): Promise<void> => {
  const parsed = UpdateProfileAvatarMembershipsBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Selecciona avatares, categorías y una acción válida." }); return; }
  const presetIds = [...new Set(parsed.data.presetIds)];
  const categoryIds = [...new Set(parsed.data.categoryIds)];
  try {
    const result = await db.transaction(async tx => {
      await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended('profile', 402))`);
      const presets = await tx.select({ id: coverPresetsTable.id, scope: coverPresetsTable.scope }).from(coverPresetsTable).where(inArray(coverPresetsTable.id, presetIds));
      if (presets.length !== presetIds.length || presets.some(p => p.scope !== "profile")) return { status: 400, error: "Solo se pueden categorizar avatares existentes de Perfil." };
      const categories = await tx.select({ id: profileAvatarCategoriesTable.id }).from(profileAvatarCategoriesTable).where(inArray(profileAvatarCategoriesTable.id, categoryIds));
      if (categories.length !== categoryIds.length) return { status: 404, error: "Una categoría seleccionada ya no existe." };
      if (parsed.data.mode === "add") {
        await tx.insert(profileAvatarMembershipsTable).values(presetIds.flatMap(presetId => categoryIds.map(categoryId => ({ presetId, categoryId })))).onConflictDoNothing();
      } else {
        await tx.delete(profileAvatarMembershipsTable).where(and(inArray(profileAvatarMembershipsTable.presetId, presetIds), inArray(profileAvatarMembershipsTable.categoryId, categoryIds)));
      }
      return null;
    });
    if (result) { res.status(result.status).json({ error: result.error }); return; }
    res.json(await listPresets("profile"));
  } catch (err) {
    req.log.error({ err }, "assigning avatar categories");
    res.status(500).json({ error: "No se pudieron actualizar las categorías de los avatares." });
  }
});
export default router;
