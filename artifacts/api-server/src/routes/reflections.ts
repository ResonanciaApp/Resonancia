import { Router, type IRouter } from "express";
import { and, desc, eq, lt, or } from "drizzle-orm";
import { db, reflectionsTable } from "@workspace/db";
import {
  CreateMyReflectionBody,
  ListMyReflectionsQueryParams,
  UpdateMyReflectionBody,
  UpdateMyReflectionParams,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();
const encodeCursor = (createdAt: Date, id: number) =>
  Buffer.from(JSON.stringify({ createdAt: createdAt.toISOString(), id }), "utf8").toString("base64url");
function decodeCursor(value: string): { createdAt: Date; id: number } | null {
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as { createdAt: string; id: number };
    const date = new Date(parsed.createdAt);
    if (!Number.isFinite(date.getTime()) || !Number.isInteger(parsed.id)) return null;
    return { createdAt: date, id: parsed.id };
  } catch { return null; }
}
function dto(row: typeof reflectionsTable.$inferSelect) {
  return { ...row, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() };
}
function cleanMessage(message: string) {
  const value = message.trim();
  return value.length > 0 && value.length <= 300 ? value : null;
}

router.get("/me/reflections", requireAuth, async (req, res) => {
  const parsed = ListMyReflectionsQueryParams.safeParse(req.query);
  if (!parsed.success) { res.status(400).json({ error: "Datos inválidos" }); return; }
  const { cursor, category, limit } = parsed.data;
  const decoded = cursor ? decodeCursor(cursor) : null;
  if (cursor && !decoded) { res.status(400).json({ error: "Cursor inválido" }); return; }
  const me = req.currentUser!;
  const conditions = [eq(reflectionsTable.userId, me.id)];
  if (category) conditions.push(eq(reflectionsTable.category, category));
  if (decoded) {
    conditions.push(or(
      lt(reflectionsTable.createdAt, decoded.createdAt),
      and(eq(reflectionsTable.createdAt, decoded.createdAt), lt(reflectionsTable.id, decoded.id)),
    )!);
  }
  try {
    const rows = await db.select().from(reflectionsTable)
      .where(and(...conditions)).orderBy(desc(reflectionsTable.createdAt), desc(reflectionsTable.id)).limit(limit + 1);
    const hasMore = rows.length > limit;
    const items = rows.slice(0, limit);
    res.json({ items: items.map(dto), nextCursor: hasMore ? encodeCursor(items[items.length - 1].createdAt, items[items.length - 1].id) : null });
  } catch (error) { req.log.error(error); res.status(500).json({ error: "No se pudieron obtener las reflexiones" }); }
});

router.post("/me/reflections", requireAuth, async (req, res) => {
  const parsed = CreateMyReflectionBody.safeParse(req.body);
  const message = parsed.success ? cleanMessage(parsed.data.message) : null;
  if (!parsed.success || !message) { res.status(400).json({ error: "Datos inválidos" }); return; }
  try {
    const [row] = await db.insert(reflectionsTable).values({ userId: req.currentUser!.id, category: parsed.data.category, message }).returning();
    res.status(201).json(dto(row));
  } catch (error) { req.log.error(error); res.status(500).json({ error: "No se pudo crear la reflexión" }); }
});

router.patch("/me/reflections/:id", requireAuth, async (req, res) => {
  const params = UpdateMyReflectionParams.safeParse(req.params);
  const parsed = UpdateMyReflectionBody.safeParse(req.body);
  const message = parsed.success && parsed.data.message !== undefined ? cleanMessage(parsed.data.message) : undefined;
  if (!params.success || !parsed.success || Object.keys(parsed.data).length === 0 || message === null) {
    res.status(400).json({ error: "Datos inválidos" }); return;
  }
  const values = { ...(parsed.data.category !== undefined ? { category: parsed.data.category } : {}), ...(message !== undefined ? { message } : {}), updatedAt: new Date() };
  try {
    const [row] = await db.update(reflectionsTable).set(values)
      .where(and(eq(reflectionsTable.id, params.data.id), eq(reflectionsTable.userId, req.currentUser!.id))).returning();
    if (!row) { res.status(404).json({ error: "Reflexión no encontrada" }); return; }
    res.json(dto(row));
  } catch (error) { req.log.error(error); res.status(500).json({ error: "No se pudo actualizar la reflexión" }); }
});

router.delete("/me/reflections/:id", requireAuth, async (req, res) => {
  const params = UpdateMyReflectionParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Datos inválidos" }); return; }
  try {
    const rows = await db.delete(reflectionsTable).where(and(eq(reflectionsTable.id, params.data.id), eq(reflectionsTable.userId, req.currentUser!.id))).returning({ id: reflectionsTable.id });
    if (!rows.length) { res.status(404).json({ error: "Reflexión no encontrada" }); return; }
    res.status(204).end();
  } catch (error) { req.log.error(error); res.status(500).json({ error: "No se pudo eliminar la reflexión" }); }
});

export default router;