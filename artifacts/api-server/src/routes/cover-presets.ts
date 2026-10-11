import { Router, type IRouter } from "express";
import { and, asc, eq, sql } from "drizzle-orm";
import {
  COVER_PRESET_SCOPES,
  REFLECTION_STORY_BUILTIN_KEYS,
  coverPresetsTable,
  db,
  uploadsTable,
  type CoverPreset,
} from "@workspace/db";
import {
  CreateAdminCoverPresetBody,
  CleanupAdminCoverPresetUploadBody,
  DeleteAdminCoverPresetParams,
  ListAdminCoverPresetsQueryParams,
  ListCoverPresetsQueryParams,
  ReorderAdminCoverPresetsBody,
  UpdateAdminCoverPresetBody,
  UpdateAdminCoverPresetParams,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";
import { requireRole } from "../middlewares/requireRole";
import { ObjectStorageService } from "../lib/objectStorage";
import { PROFILE_AVATAR_PRESET_LIMIT } from "../lib/coverPresetLimits";
import {
  isObjectReferenced,
  lockObjectPaths,
  validateOwnedCompletedImageUpload,
} from "../lib/objectAccess";

const router: IRouter = Router();
const objectStorageService = new ObjectStorageService();
const REFLECTION_STORY_SCOPE = "reflection-story" as const;
const DEFAULT_COVER_PRESET_LIMIT = 50;
const REFLECTION_STORY_PRESET_LIMIT = 100;

function serializePreset(preset: CoverPreset) {
  return {
    id: preset.id,
    scope: preset.scope,
    key: preset.key,
    label: preset.label,
    isLocked: preset.isLocked,
    sortOrder: preset.sortOrder,
    source: preset.objectPath ? "object" as const : "builtin" as const,
    builtinKey: preset.builtinKey ?? null,
    objectPath: preset.objectPath ?? null,
    createdAt: preset.createdAt.toISOString(),
    updatedAt: preset.updatedAt.toISOString(),
  };
}

async function listPresets(scope: (typeof COVER_PRESET_SCOPES)[number]) {
  const presets = await db
    .select()
    .from(coverPresetsTable)
    .where(eq(coverPresetsTable.scope, scope))
    .orderBy(asc(coverPresetsTable.sortOrder), asc(coverPresetsTable.id));
  return { scope, presets: presets.map(serializePreset) };
}

async function cleanupUnclaimedObject(objectPath: string, userId: number, log: { warn: (context: unknown, message: string) => void }) {
  const upload = await validateOwnedCompletedImageUpload({ objectPath, userId });
  if (!upload.ok) return;
  try {
    await db.transaction(async (tx) => {
      await lockObjectPaths(tx, [objectPath]);
      if (await isObjectReferenced({ objectPath })) return;
      await objectStorageService.deleteObjectEntity(objectPath);
      await tx.delete(uploadsTable).where(and(eq(uploadsTable.objectPath, objectPath), eq(uploadsTable.userId, userId)));
    });
  } catch (err) {
    log.warn({ err, objectPath }, "failed to clean unclaimed cover preset upload");
  }
}

function duplicateIds(ids: string[]) {
  return new Set(ids).size !== ids.length;
}

function parseScope(value: unknown) {
  return typeof value === "string" && COVER_PRESET_SCOPES.includes(value as typeof COVER_PRESET_SCOPES[number])
    ? value as typeof COVER_PRESET_SCOPES[number]
    : undefined;
}

export function scopeLimit(scope: (typeof COVER_PRESET_SCOPES)[number]) {
  if (scope === "profile") return PROFILE_AVATAR_PRESET_LIMIT;
  return scope === REFLECTION_STORY_SCOPE ? REFLECTION_STORY_PRESET_LIMIT : DEFAULT_COVER_PRESET_LIMIT;
}

function scopeValidationMessage() {
  return `El scope debe ser ${COVER_PRESET_SCOPES.join(", ")}`;
}

export function reflectionStoryBuiltinKey(key: string): string | undefined {
  if (!/^(?:0[1-9]|[1-9]\d|100)$/.test(key)) return undefined;
  return REFLECTION_STORY_BUILTIN_KEYS[Number.parseInt(key, 10) - 1];
}

router.get("/cover-presets", async (req, res): Promise<void> => {
  const parsed = ListCoverPresetsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: scopeValidationMessage() });
    return;
  }
  try {
    res.json(await listPresets(parsed.data.scope));
  } catch (err) {
    req.log.error({ err }, "error listing public cover presets");
    res.status(500).json({ error: "Error al obtener las portadas" });
  }
});

router.get("/admin/cover-presets", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const parsed = ListAdminCoverPresetsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: scopeValidationMessage() });
    return;
  }
  try {
    res.json(await listPresets(parsed.data.scope));
  } catch (err) {
    req.log.error({ err }, "error listing admin cover presets");
    res.status(500).json({ error: "Error al obtener las portadas" });
  }
});

router.post("/admin/cover-presets", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const parsed = CreateAdminCoverPresetBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Datos inválidos", details: parsed.error.issues });
    return;
  }
  const { scope, label, objectPath } = parsed.data;
  const me = req.currentUser!;
  if (scope === REFLECTION_STORY_SCOPE) {
    if (objectPath) await cleanupUnclaimedObject(objectPath, me.id, req.log);
    res.status(409).json({ error: "Mi viaje interior usa 100 posiciones fijas; reemplaza una posición existente" });
    return;
  }
  if (!objectPath) {
    res.status(400).json({ error: "Las nuevas portadas requieren una imagen subida" });
    return;
  }
  const uploadValidation = await validateOwnedCompletedImageUpload({ objectPath, userId: me.id });
  if (!uploadValidation.ok) {
    res.status(uploadValidation.reason === "ownership" ? 403 : 400).json({ error: "La imagen debe ser una subida de imagen completada y perteneciente al administrador" });
    return;
  }
  if (await isObjectReferenced({ objectPath })) {
    res.status(409).json({ error: "La imagen ya está siendo utilizada por otro contenido" });
    return;
  }
  try {
    const created = await db.transaction(async (tx) => {
      await lockObjectPaths(tx, [objectPath]);
      await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${scope}, 402))`);
      const lockedValidation = await validateOwnedCompletedImageUpload({ objectPath, userId: me.id });
      if (!lockedValidation.ok) throw new Error(`upload_${lockedValidation.reason}`);
      if (await isObjectReferenced({ objectPath })) throw new Error("referenced");
      const existing = await tx.select().from(coverPresetsTable).where(eq(coverPresetsTable.scope, scope));
      if (existing.length >= scopeLimit(scope)) throw new Error("limit");
      const nextOrder = Math.max(-1, ...existing.map((row) => row.sortOrder)) + 1;
      const key = parsed.data.key?.trim() || `custom-${crypto.randomUUID()}`;
      const [row] = await tx.insert(coverPresetsTable).values({
        id: `${scope}:${key}`,
        scope,
        key,
        label: label.trim(),
        objectPath,
        builtinKey: null,
        sortOrder: nextOrder,
      }).returning();
      return row;
    });
    res.status(201).json(serializePreset(created));
  } catch (err) {
    if (err instanceof Error && err.message === "referenced") {
      res.status(409).json({ error: "La imagen ya está siendo utilizada por otro contenido" });
      await cleanupUnclaimedObject(objectPath, me.id, req.log);
      return;
    }
    if (err instanceof Error && err.message === "limit") {
      res.status(409).json({ error: `Esta colección admite como máximo ${scopeLimit(scope)} imágenes` });
      await cleanupUnclaimedObject(objectPath, me.id, req.log);
      return;
    }
    if (typeof err === "object" && err !== null && "code" in err && err.code === "23505") {
      res.status(409).json({ error: "Ya existe una portada con ese identificador" });
      await cleanupUnclaimedObject(objectPath, me.id, req.log);
      return;
    }
    req.log.error({ err }, "error creating cover preset");
    await cleanupUnclaimedObject(objectPath, me.id, req.log);
    res.status(500).json({ error: "Error al crear la portada" });
  }
});

router.put("/admin/cover-presets/order", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const parsed = ReorderAdminCoverPresetsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Datos de orden inválidos", details: parsed.error.issues });
    return;
  }
  try {
    const result = await db.transaction(async (tx) => {
      await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${parsed.data.scope}, 402))`);
      const rows = await tx.select().from(coverPresetsTable).where(eq(coverPresetsTable.scope, parsed.data.scope))
        .orderBy(asc(coverPresetsTable.sortOrder), asc(coverPresetsTable.id));
      if (parsed.data.expectedIds && (
        parsed.data.expectedIds.length !== rows.length
        || rows.some((row, index) => row.id !== parsed.data.expectedIds![index])
      )) {
        throw new Error("stale_order");
      }
      if (
        parsed.data.scope === REFLECTION_STORY_SCOPE
        && (
          rows.length !== REFLECTION_STORY_PRESET_LIMIT
          || rows.some((row) => reflectionStoryBuiltinKey(row.key) === undefined)
        )
      ) {
        throw new Error("fixed_slots");
      }
      const ids = new Set(rows.map((row) => row.id));
      if (duplicateIds(parsed.data.ids)) throw new Error("duplicates");
      if (rows.length !== parsed.data.ids.length || parsed.data.ids.some((id) => !ids.has(id))) {
        throw new Error("order");
      }
      const stagingStart = Math.max(-1, ...rows.map((row) => row.sortOrder)) + 1;
      for (const [index, row] of rows.entries()) {
        await tx.update(coverPresetsTable).set({ sortOrder: stagingStart + index }).where(eq(coverPresetsTable.id, row.id));
      }
      for (const [sortOrder, id] of parsed.data.ids.entries()) {
        await tx.update(coverPresetsTable).set({ sortOrder, updatedAt: new Date() }).where(eq(coverPresetsTable.id, id));
      }
      const ordered = await tx.select().from(coverPresetsTable)
        .where(eq(coverPresetsTable.scope, parsed.data.scope))
        .orderBy(asc(coverPresetsTable.sortOrder), asc(coverPresetsTable.id));
      return { scope: parsed.data.scope, presets: ordered.map(serializePreset) };
    });
    res.json(result);
  } catch (err) {
    if (err instanceof Error && err.message === "stale_order") {
      res.status(409).json({ error: "El catálogo cambió. Recarga el orden antes de volver a guardar." });
      return;
    }
    if (err instanceof Error && err.message === "duplicates") {
      res.status(400).json({ error: "El orden no puede contener IDs duplicados" });
      return;
    }
    if (err instanceof Error && err.message === "order") {
      res.status(400).json({ error: "El orden debe incluir exactamente todas las imágenes de la colección" });
      return;
    }
    if (err instanceof Error && err.message === "fixed_slots") {
      res.status(409).json({ error: "Mi viaje interior debe conservar exactamente sus 100 posiciones fijas" });
      return;
    }
    req.log.error({ err }, "error reordering cover presets");
    res.status(500).json({ error: "Error al ordenar las portadas" });
  }
});

router.delete("/admin/cover-presets/upload", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const parsed = CleanupAdminCoverPresetUploadBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Ruta de objeto inválida" });
    return;
  }
  const objectPath = parsed.data.objectPath;
  const me = req.currentUser!;
  try {
    const validation = await validateOwnedCompletedImageUpload({ objectPath, userId: me.id });
    if (!validation.ok) {
      res.status(validation.reason === "ownership" ? 403 : 400).json({ error: "La subida no existe o no pertenece al administrador" });
      return;
    }
    const cleaned = await db.transaction(async (tx) => {
      await lockObjectPaths(tx, [objectPath]);
      if (await isObjectReferenced({ objectPath })) return false;
      await objectStorageService.deleteObjectEntity(objectPath);
      await tx.delete(uploadsTable).where(and(
        eq(uploadsTable.objectPath, objectPath),
        eq(uploadsTable.userId, me.id),
      ));
      return true;
    });
    if (!cleaned) {
      res.status(409).json({ error: "La imagen ya está siendo utilizada por otro contenido" });
      return;
    }
    res.status(204).end();
  } catch (err) {
    req.log.error({ err, objectPath }, "error cleaning unclaimed cover upload");
    res.status(500).json({ error: "No se pudo limpiar la subida" });
  }
});

router.patch("/admin/cover-presets/:id", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const params = UpdateAdminCoverPresetParams.safeParse(req.params);
  const parsed = UpdateAdminCoverPresetBody.safeParse(req.body);
  if (!params.success || !parsed.success || Object.keys(parsed.data).length === 0) {
    res.status(400).json({ error: "Datos inválidos" });
    return;
  }
  if (parsed.data.objectPath === null) {
    res.status(400).json({ error: "La imagen no puede quedar vacía; elimina la opción completa" });
    return;
  }
  const me = req.currentUser!;
  try {
    const result = await db.transaction(async (tx) => {
      await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${params.data.id}, 402))`);
      let [current] = await tx.select().from(coverPresetsTable).where(eq(coverPresetsTable.id, params.data.id)).limit(1);
      if (!current) throw new Error("not_found");
      if (parsed.data.isLocked !== undefined && current.scope !== "profile") {
        throw new Error("lock_scope");
      }
      if (typeof parsed.data.objectPath === "string" && parsed.data.objectPath !== current.objectPath) {
        await lockObjectPaths(tx, [current.objectPath ?? "", parsed.data.objectPath]);
      }
      await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${current.scope}, 402))`);
      [current] = await tx.select().from(coverPresetsTable).where(eq(coverPresetsTable.id, params.data.id)).limit(1);
      if (!current) throw new Error("not_found");
      if (parsed.data.objectPath !== undefined && parsed.data.objectPath !== current.objectPath) {
        const nextObjectPath = parsed.data.objectPath;
        if (nextObjectPath === null) throw new Error("empty_upload");
        const validation = await validateOwnedCompletedImageUpload({ objectPath: nextObjectPath, userId: me.id });
        if (!validation.ok) throw new Error(`upload_${validation.reason}`);
        if (await isObjectReferenced({ objectPath: nextObjectPath, excludeCoverPresetId: current.id })) {
          throw new Error("referenced");
        }
      }
      const [updated] = await tx.update(coverPresetsTable).set({
        ...(parsed.data.isLocked === undefined ? {} : { isLocked: parsed.data.isLocked }),
        ...(parsed.data.label === undefined ? {} : { label: parsed.data.label.trim() }),
        ...(parsed.data.objectPath === undefined ? {} : { objectPath: parsed.data.objectPath, builtinKey: null }),
        updatedAt: new Date(),
      }).where(eq(coverPresetsTable.id, params.data.id)).returning();
      return { current, updated };
    });
    const { current, updated } = result;
    if (current.objectPath && current.objectPath !== updated.objectPath) {
      const oldObjectPath = current.objectPath;
      await db.transaction(async (tx) => {
        await lockObjectPaths(tx, [oldObjectPath]);
        if (await isObjectReferenced({ objectPath: oldObjectPath })) return;
        await objectStorageService.deleteObjectEntity(oldObjectPath);
        await tx.delete(uploadsTable).where(eq(uploadsTable.objectPath, oldObjectPath));
      }).catch((err) => req.log.warn({ err, objectPath: oldObjectPath }, "failed to delete replaced cover preset object"));
    }
    res.json(serializePreset(updated));
  } catch (err) {
    if (typeof parsed.data.objectPath === "string") {
      await cleanupUnclaimedObject(parsed.data.objectPath, me.id, req.log);
    }
    if (err instanceof Error && err.message === "lock_scope") {
      res.status(400).json({ error: "Solo se pueden bloquear avatares de Perfil" });
      return;
    }
    if (err instanceof Error && err.message === "not_found") {
      res.status(404).json({ error: "Portada no encontrada" });
      return;
    }
    if (err instanceof Error && err.message === "referenced") {
      res.status(409).json({ error: "La imagen ya está siendo utilizada por otro contenido" });
      return;
    }
    if (err instanceof Error && err.message.startsWith("upload_")) {
      const reason = err.message.slice("upload_".length);
      res.status(reason === "ownership" ? 403 : 400).json({ error: "La imagen debe ser una subida de imagen completada y perteneciente al administrador" });
      return;
    }
    req.log.error({ err }, "error updating cover preset");
    res.status(500).json({ error: "Error al actualizar la portada" });
  }
});

router.delete("/admin/cover-presets/:id", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const parsed = DeleteAdminCoverPresetParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "ID inválido" });
    return;
  }
  try {
    const deletedRows = await db.transaction(async (tx) => {
      await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${parsed.data.id}, 402))`);
      let [current] = await tx.select().from(coverPresetsTable).where(eq(coverPresetsTable.id, parsed.data.id)).limit(1);
      if (!current) return [];
      await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${current.scope}, 402))`);
      [current] = await tx.select().from(coverPresetsTable).where(eq(coverPresetsTable.id, parsed.data.id)).limit(1);
      if (!current) return [];
      if (current.scope === REFLECTION_STORY_SCOPE) {
        const builtinKey = reflectionStoryBuiltinKey(current.key);
        if (!builtinKey) throw new Error("invalid_fixed_slot");
        const [reset] = await tx.update(coverPresetsTable).set({
          objectPath: null,
          builtinKey,
          updatedAt: new Date(),
        }).where(eq(coverPresetsTable.id, parsed.data.id)).returning();
        return reset ? [{ ...reset, objectPath: current.objectPath }] : [];
      }
      return tx.delete(coverPresetsTable).where(eq(coverPresetsTable.id, parsed.data.id)).returning();
    });
    const [deleted] = deletedRows;
    if (!deleted) {
      res.status(404).json({ error: "Portada no encontrada" });
      return;
    }
    if (deleted.objectPath) {
      const objectPath = deleted.objectPath;
      await db.transaction(async (tx) => {
        await lockObjectPaths(tx, [objectPath]);
        if (await isObjectReferenced({ objectPath })) return;
        await objectStorageService.deleteObjectEntity(objectPath);
        await tx.delete(uploadsTable).where(eq(uploadsTable.objectPath, objectPath));
      }).catch((err) => {
        req.log.warn({ err, objectPath }, "failed to delete cover preset object");
      });
    }
    res.status(204).end();
  } catch (err) {
    if (err instanceof Error && err.message === "invalid_fixed_slot") {
      res.status(409).json({ error: "La posición no pertenece al catálogo fijo de Mi viaje interior" });
      return;
    }
    req.log.error({ err }, "error deleting cover preset");
    res.status(500).json({ error: "Error al eliminar la portada" });
  }
});

export default router;