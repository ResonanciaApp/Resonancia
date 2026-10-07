import { Router, type IRouter } from "express";
import { and, desc, eq, lt, or } from "drizzle-orm";
import { db, reflectionStoriesTable } from "@workspace/db";
import {
  CreateMyReflectionStoryBody,
  CreateMyReflectionStoryHeader,
  GetMyReflectionStoryParams,
  ListMyReflectionStoriesQueryParams,
  ListUserReflectionStoriesParams,
  ListUserReflectionStoriesQueryParams,
  GetUserReflectionStoryParams,
  SetMyReflectionStoryVisibilityParams,
  SetMyReflectionStoryVisibilityBody,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";
import { findReflectionCategory } from "./reflection-categories";
import { canUserReferenceObject } from "../lib/objectAccess";
import { ObjectStorageService } from "../lib/objectStorage";

const router: IRouter = Router();
const storage = new ObjectStorageService();

const encodeCursor = (createdAt: Date, id: number) =>
  Buffer.from(JSON.stringify({ createdAt: createdAt.toISOString(), id }), "utf8").toString("base64url");

function decodeCursor(value: string): { createdAt: Date; id: number } | null {
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as { createdAt: string; id: number };
    const date = new Date(parsed.createdAt);
    if (!Number.isFinite(date.getTime()) || !Number.isInteger(parsed.id)) return null;
    return { createdAt: date, id: parsed.id };
  } catch {
    return null;
  }
}

function countGraphemes(value: string): number {
  const Segmenter = (Intl as unknown as { Segmenter?: new (locale?: string, options?: { granularity: string }) => { segment: (input: string) => Iterable<unknown> } }).Segmenter;
  if (Segmenter) return Array.from(new Segmenter("es", { granularity: "grapheme" }).segment(value)).length;
  return Array.from(value).length;
}

function dto(row: typeof reflectionStoriesTable.$inferSelect) {
  const { idempotencyKey: _idempotencyKey, ...publicRow } = row;
  return { ...publicRow, isPublic: row.isPublic ?? false, createdAt: row.createdAt.toISOString() };
}

function isUniqueViolation(error: unknown): boolean {
  return Boolean(error && typeof error === "object" && "code" in error && (error as { code?: string }).code === "23505");
}

router.get("/users/:userId/reflection-stories", requireAuth, async (req, res) => {
  const params = ListUserReflectionStoriesParams.safeParse(req.params);
  const query = ListUserReflectionStoriesQueryParams.safeParse(req.query);
  if (!params.success || !query.success) { res.status(400).json({ error: "Datos inválidos" }); return; }
  const { cursor, limit } = query.data;
  const decoded = cursor ? decodeCursor(cursor) : null;
  if (cursor && !decoded) { res.status(400).json({ error: "Cursor inválido" }); return; }
  const conditions = [
    eq(reflectionStoriesTable.userId, params.data.userId),
    eq(reflectionStoriesTable.isPublic, true),
  ];
  if (decoded) {
    conditions.push(or(
      lt(reflectionStoriesTable.createdAt, decoded.createdAt),
      and(eq(reflectionStoriesTable.createdAt, decoded.createdAt), lt(reflectionStoriesTable.id, decoded.id)),
    )!);
  }
  try {
    const rows = await db.select().from(reflectionStoriesTable).where(and(...conditions))
      .orderBy(desc(reflectionStoriesTable.createdAt), desc(reflectionStoriesTable.id)).limit(limit + 1);
    const items = rows.slice(0, limit);
    res.set("Cache-Control", "private, no-store").json({
      items: items.map(dto),
      nextCursor: rows.length > limit ? encodeCursor(items[items.length - 1].createdAt, items[items.length - 1].id) : null,
    });
  } catch (error) {
    req.log.error(error);
    res.status(500).json({ error: "No se pudieron obtener las reflexiones" });
  }
});

router.get("/users/:userId/reflection-stories/:id", requireAuth, async (req, res) => {
  const parsed = GetUserReflectionStoryParams.safeParse(req.params);
  if (!parsed.success) { res.status(400).json({ error: "Datos inválidos" }); return; }
  try {
    const [row] = await db.select().from(reflectionStoriesTable).where(and(
      eq(reflectionStoriesTable.id, parsed.data.id),
      eq(reflectionStoriesTable.userId, parsed.data.userId),
      eq(reflectionStoriesTable.isPublic, true),
    )).limit(1);
    if (!row) { res.status(404).json({ error: "Reflexión no disponible" }); return; }
    res.set("Cache-Control", "private, no-store").json(dto(row));
  } catch (error) {
    req.log.error(error);
    res.status(500).json({ error: "No se pudo obtener la reflexión" });
  }
});

router.patch("/me/reflection-stories/:id/visibility", requireAuth, async (req, res) => {
  const params = SetMyReflectionStoryVisibilityParams.safeParse(req.params);
  const input = SetMyReflectionStoryVisibilityBody.safeParse(req.body);
  if (!params.success || !input.success) { res.status(400).json({ error: "Datos inválidos" }); return; }
  const actor = req.currentUser!;
  const owned = and(eq(reflectionStoriesTable.id, params.data.id), eq(reflectionStoriesTable.userId, actor.id));
  try {
    const [existing] = await db.select().from(reflectionStoriesTable).where(owned).limit(1);
    if (!existing) { res.status(404).json({ error: "Historia no encontrada" }); return; }
    if (input.data.isPublic && existing.avatarImagePath && !(await canUserReferenceObject({
      objectPath: existing.avatarImagePath, userId: actor.id, clerkUserId: actor.clerkUserId, role: actor.role,
    }))) {
      res.status(409).json({ error: "La imagen de esta historia no puede hacerse pública" }); return;
    }
    const [row] = await db.update(reflectionStoriesTable).set({ isPublic: input.data.isPublic }).where(owned).returning();
    if (!row) { res.status(404).json({ error: "Historia no encontrada" }); return; }
    res.json(dto(row));
  } catch (error) {
    req.log.error(error);
    res.status(500).json({ error: "No se pudo cambiar la visibilidad" });
  }
});

router.get("/me/reflection-stories", requireAuth, async (req, res) => {
  const parsed = ListMyReflectionStoriesQueryParams.safeParse(req.query);
  if (!parsed.success) { res.status(400).json({ error: "Datos inválidos" }); return; }
  const { cursor, limit } = parsed.data;
  const decoded = cursor ? decodeCursor(cursor) : null;
  if (cursor && !decoded) { res.status(400).json({ error: "Cursor inválido" }); return; }
  const conditions = [eq(reflectionStoriesTable.userId, req.currentUser!.id)];
  if (decoded) {
    conditions.push(or(
      lt(reflectionStoriesTable.createdAt, decoded.createdAt),
      and(eq(reflectionStoriesTable.createdAt, decoded.createdAt), lt(reflectionStoriesTable.id, decoded.id)),
    )!);
  }
  try {
    const rows = await db.select().from(reflectionStoriesTable)
      .where(and(...conditions))
      .orderBy(desc(reflectionStoriesTable.createdAt), desc(reflectionStoriesTable.id))
      .limit(limit + 1);
    const hasMore = rows.length > limit;
    const items = rows.slice(0, limit);
    res.json({
      items: items.map(dto),
      nextCursor: hasMore ? encodeCursor(items[items.length - 1].createdAt, items[items.length - 1].id) : null,
    });
  } catch (error) {
    req.log.error(error);
    res.status(500).json({ error: "No se pudieron obtener las historias compartidas" });
  }
});

router.post("/me/reflection-stories", requireAuth, async (req, res) => {
  const header = CreateMyReflectionStoryHeader.safeParse({ "Idempotency-Key": req.get("Idempotency-Key") });
  const parsed = CreateMyReflectionStoryBody.safeParse(req.body);
  if (!header.success || !parsed.success) { res.status(400).json({ error: "Datos inválidos" }); return; }
  const input = parsed.data;
  const message = input.message.trim();
  const backgroundOffsetLimit = (input.backgroundScale - 1) / 2;
  const avatarX = input.avatarX ?? null;
  const avatarY = input.avatarY ?? null;
  if (
    countGraphemes(message) > 160
    || message.length === 0
    || Math.abs(input.backgroundX) > backgroundOffsetLimit
    || Math.abs(input.backgroundY) > backgroundOffsetLimit
    || ((avatarX === null) !== (avatarY === null))
    || (avatarX !== null && (!input.avatarImagePath || avatarX < 62 / 1080 || avatarX > 1 - 62 / 1080))
    || (avatarY !== null && (avatarY < 62 / 1920 || avatarY > 1 - 62 / 1920))
  ) {
    res.status(400).json({ error: "La composición no es válida" });
    return;
  }
  const userId = req.currentUser!.id;
  const idempotencyKey = header.data["Idempotency-Key"];
  try {
    if (input.avatarImagePath) {
      const actor = req.currentUser!;
      if (!(await canUserReferenceObject({
        objectPath: input.avatarImagePath, userId: actor.id,
        clerkUserId: actor.clerkUserId, role: actor.role,
      }))) {
        res.status(403).json({ error: "No puedes utilizar esta imagen de avatar" }); return;
      }
      const file = await storage.getObjectEntityFile(input.avatarImagePath);
      const [metadata] = await file.getMetadata();
      const size = Number(metadata.size);
      if (!String(metadata.contentType).startsWith("image/") || !Number.isFinite(size) || size <= 0) {
        res.status(400).json({ error: "La imagen del avatar no está lista" }); return;
      }
    }
    if (!(await findReflectionCategory(input.category))) {
      res.status(400).json({ error: "Categoría desconocida" }); return;
    }
    const [row] = await db.insert(reflectionStoriesTable).values({
      userId,
      idempotencyKey,
      message,
      category: input.category,
      backgroundPresetKey: input.backgroundPresetKey.trim(),
      backgroundScale: input.backgroundScale,
      backgroundX: input.backgroundX,
      backgroundY: input.backgroundY,
      textX: input.textX,
      textY: input.textY,
      avatarImagePath: input.avatarImagePath ?? null,
      avatarX,
      avatarY,
    }).returning();
    res.status(201).json(dto(row));
  } catch (error) {
    if (isUniqueViolation(error)) {
      const [existing] = await db.select().from(reflectionStoriesTable)
        .where(and(eq(reflectionStoriesTable.userId, userId), eq(reflectionStoriesTable.idempotencyKey, idempotencyKey)))
        .limit(1);
      if (existing) { res.status(200).json(dto(existing)); return; }
    }
    req.log.error(error);
    res.status(500).json({ error: "No se pudo guardar la historia compartida" });
  }
});

router.get("/me/reflection-stories/:id", requireAuth, async (req, res) => {
  const parsed = GetMyReflectionStoryParams.safeParse(req.params);
  if (!parsed.success) { res.status(400).json({ error: "Datos inválidos" }); return; }
  try {
    const [row] = await db.select().from(reflectionStoriesTable)
      .where(and(eq(reflectionStoriesTable.id, parsed.data.id), eq(reflectionStoriesTable.userId, req.currentUser!.id)))
      .limit(1);
    if (!row) { res.status(404).json({ error: "Historia compartida no encontrada" }); return; }
    res.json(dto(row));
  } catch (error) {
    req.log.error(error);
    res.status(500).json({ error: "No se pudo obtener la historia compartida" });
  }
});

router.delete("/me/reflection-stories/:id", requireAuth, async (req, res) => {
  const parsed = GetMyReflectionStoryParams.safeParse(req.params);
  if (!parsed.success) { res.status(400).json({ error: "Datos inválidos" }); return; }
  try {
    const rows = await db.delete(reflectionStoriesTable)
      .where(and(
        eq(reflectionStoriesTable.id, parsed.data.id),
        eq(reflectionStoriesTable.userId, req.currentUser!.id),
      ))
      .returning({ id: reflectionStoriesTable.id });
    if (!rows.length) {
      res.status(404).json({ error: "Historia compartida no encontrada" });
      return;
    }
    res.status(204).end();
  } catch (error) {
    req.log.error(error);
    res.status(500).json({ error: "No se pudo eliminar la historia compartida" });
  }
});

export default router;