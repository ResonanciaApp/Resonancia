import { Router, type IRouter } from "express";
import { asc, eq } from "drizzle-orm";
import { db, reflectionCategoriesTable, INITIAL_REFLECTION_CATEGORIES } from "@workspace/db";
import {
  CreateAdminReflectionCategoryBody,
  ReorderAdminReflectionCategoriesBody,
  UpdateAdminReflectionCategoryBody,
  UpdateAdminReflectionCategoryParams,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";
import { requireRole } from "../middlewares/requireRole";

const router: IRouter = Router();
const admin = [requireAuth, requireRole("admin")] as const;

export const REFLECTION_ICONS = [
  { name: "cards-heart", family: "MaterialCommunityIcons" },
  { name: "sprout", family: "MaterialCommunityIcons" },
  { name: "triangle", family: "Feather" },
  { name: "flower-tulip", family: "MaterialCommunityIcons" },
  { name: "white-balance-sunny", family: "MaterialCommunityIcons" },
  { name: "brain", family: "MaterialCommunityIcons" },
  { name: "heart-outline", family: "MaterialCommunityIcons" },
  { name: "star-outline", family: "MaterialCommunityIcons" },
  { name: "lightbulb-outline", family: "MaterialCommunityIcons" },
  { name: "leaf", family: "MaterialCommunityIcons" },
  { name: "compass-outline", family: "MaterialCommunityIcons" },
  { name: "weather-sunny", family: "MaterialCommunityIcons" },
  { name: "meditation", family: "MaterialCommunityIcons" },
  { name: "hand-heart", family: "MaterialCommunityIcons" },
  { name: "eye-outline", family: "MaterialCommunityIcons" },
  { name: "water-outline", family: "MaterialCommunityIcons" },
] as const;

const NEW_COLORS = ["#F075B3", "#5FCA81", "#5FA1CA", "#B875F0", "#F2C94C", "#8B95EE"];
let seedPromise: Promise<void> | undefined;

export function ensureReflectionCategories() {
  if (!seedPromise) {
    seedPromise = db.insert(reflectionCategoriesTable)
      .values(INITIAL_REFLECTION_CATEGORIES)
      .onConflictDoNothing()
      .then(() => undefined)
      .catch((error: unknown) => {
        seedPromise = undefined;
        throw error;
      });
  }
  return seedPromise;
}

export async function findReflectionCategory(id: string) {
  await ensureReflectionCategories();
  const [category] = await db.select().from(reflectionCategoriesTable)
    .where(eq(reflectionCategoriesTable.id, id)).limit(1);
  return category;
}

async function catalog() {
  await ensureReflectionCategories();
  const items = await db.select().from(reflectionCategoriesTable)
    .orderBy(asc(reflectionCategoriesTable.sortOrder), asc(reflectionCategoriesTable.id));
  return { items, icons: REFLECTION_ICONS };
}

router.get("/reflection-categories", async (req, res) => {
  try { res.json(await catalog()); }
  catch (error) { req.log.error(error); res.status(503).json({ error: "No se pudieron cargar las categorías" }); }
});

router.post("/admin/reflection-categories", ...admin, async (req, res) => {
  const parsed = CreateAdminReflectionCategoryBody.safeParse(req.body);
  if (!parsed.success || !parsed.data.label.trim()) {
    res.status(400).json({ error: "Nombre o identificador inválido" }); return;
  }
  const icon = parsed.data.icon
    ? REFLECTION_ICONS.find((option) => option.name === parsed.data.icon)
    : undefined;
  if (parsed.data.icon && !icon) { res.status(400).json({ error: "Icono inválido" }); return; }
  try {
    const { items } = await catalog();
    if (items.some((item) => item.id === parsed.data.id)) {
      res.status(409).json({ error: "Ya existe una categoría con ese identificador" }); return;
    }
    const selected = icon ?? REFLECTION_ICONS[items.length % REFLECTION_ICONS.length];
    const [created] = await db.insert(reflectionCategoriesTable).values({
      id: parsed.data.id,
      label: parsed.data.label.trim(),
      icon: selected.name,
      iconFamily: selected.family,
      color: NEW_COLORS[items.length % NEW_COLORS.length],
      sortOrder: (items.at(-1)?.sortOrder ?? -1) + 1,
      active: true,
    }).returning();
    res.status(201).json(created);
  } catch (error) {
    if ((error as { code?: string }).code === "23505") {
      res.status(409).json({ error: "Ya existe una categoría con ese identificador" }); return;
    }
    req.log.error(error); res.status(500).json({ error: "No se pudo crear la categoría" });
  }
});

router.put("/admin/reflection-categories/order", ...admin, async (req, res) => {
  const parsed = ReorderAdminReflectionCategoriesBody.safeParse(req.body);
  if (!parsed.success || new Set(parsed.data.ids).size !== parsed.data.ids.length) {
    res.status(400).json({ error: "Orden inválido" }); return;
  }
  try {
    await ensureReflectionCategories();
    const accepted = await db.transaction(async (tx) => {
      const rows = await tx.select({ id: reflectionCategoriesTable.id })
        .from(reflectionCategoriesTable).for("update");
      const ids = new Set(rows.map((row) => row.id));
      if (rows.length !== parsed.data.ids.length || parsed.data.ids.some((id) => !ids.has(id))) return false;
      for (const [sortOrder, id] of parsed.data.ids.entries()) {
        await tx.update(reflectionCategoriesTable).set({ sortOrder })
          .where(eq(reflectionCategoriesTable.id, id));
      }
      return true;
    });
    if (!accepted) { res.status(409).json({ error: "La lista cambió; actualiza e inténtalo de nuevo" }); return; }
    res.json(await catalog());
  } catch (error) { req.log.error(error); res.status(500).json({ error: "No se pudo guardar el orden" }); }
});

router.patch("/admin/reflection-categories/:id", ...admin, async (req, res) => {
  const params = UpdateAdminReflectionCategoryParams.safeParse(req.params);
  const parsed = UpdateAdminReflectionCategoryBody.safeParse(req.body);
  if (!params.success || !parsed.success || !Object.keys(parsed.data).length ||
      (parsed.data.label !== undefined && !parsed.data.label.trim())) {
    res.status(400).json({ error: "Datos inválidos" }); return;
  }
  const icon = parsed.data.icon
    ? REFLECTION_ICONS.find((option) => option.name === parsed.data.icon)
    : undefined;
  if (parsed.data.icon !== undefined && !icon) { res.status(400).json({ error: "Icono inválido" }); return; }
  try {
    await ensureReflectionCategories();
    const updated = await db.transaction(async (tx) => {
      // Lock the entire small catalog before checking the last active tab.
      // Locking only the edited row allows concurrent admins to archive both
      // remaining active tabs based on the same stale count.
      const rows = await tx.select().from(reflectionCategoriesTable).for("update");
      const current = rows.find((row) => row.id === params.data.id);
      if (!current) return null;
      if (parsed.data.active === false && current.active) {
        if (rows.filter((row) => row.active).length === 1) return "last-active";
      }
      const [row] = await tx.update(reflectionCategoriesTable).set({
        ...(parsed.data.label !== undefined ? { label: parsed.data.label.trim() } : {}),
        ...(icon ? { icon: icon.name, iconFamily: icon.family } : {}),
        ...(parsed.data.active !== undefined ? { active: parsed.data.active } : {}),
      }).where(eq(reflectionCategoriesTable.id, params.data.id)).returning();
      return row;
    });
    if (!updated) { res.status(404).json({ error: "Categoría no encontrada" }); return; }
    if (updated === "last-active") {
      res.status(400).json({ error: "Debe quedar al menos un tab activo" }); return;
    }
    res.json(updated);
  } catch (error) { req.log.error(error); res.status(500).json({ error: "No se pudo actualizar la categoría" }); }
});

export default router;