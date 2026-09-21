import { Router, type IRouter } from "express";
import { and, asc, desc, eq, ilike, inArray, sql } from "drizzle-orm";
import {
  db, dailyQuotesTable, dailyQuoteAssignmentsTable, dailyQuoteSettingsTable,
} from "@workspace/db";
import {
  CreateAdminDailyQuoteBody, DeleteAdminDailyQuoteParams,
  GetAdminCurrentDailyQuoteResponse, GetAdminDailyQuoteHistoryQueryParams,
  GetAdminDailyQuoteHistoryResponse, GetQuoteOfTheDayQueryParams,
  GetQuoteOfTheDayResponse, ListAdminDailyQuotesQueryParams,
  ListAdminDailyQuotesResponse, ToggleAdminDailyQuoteParams,
  ToggleAdminDailyQuoteResponse, UpdateAdminDailyQuoteBody,
  UpdateAdminDailyQuoteParams, UpdateAdminDailyQuoteResponse,
  GetAdminDailyQuoteSettingsResponse, UpdateAdminDailyQuoteSettingsBody,
  UpdateAdminDailyQuoteSettingsResponse,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";
import { requireRole } from "../middlewares/requireRole";
import { ensureDailyQuoteSeed } from "../lib/daily-quotes-seed";

const router: IRouter = Router();
const admin = [requireAuth, requireRole("admin")];
const CHILE_TZ = "America/Santiago";
type Quote = typeof dailyQuotesTable.$inferSelect;
type Assignment = typeof dailyQuoteAssignmentsTable.$inferSelect;

export function chileDate(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: CHILE_TZ, year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(now);
  const value = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return `${value.year}-${value.month}-${value.day}`;
}
export function chooseDailyQuote(active: Quote[], assignments: Assignment[], random = Math.random()) {
  if (!active.length) throw new Error("No hay frases activas disponibles");
  const cycle = assignments[0]?.cycle ?? 1;
  const usedIds = new Set(assignments.filter((row) => row.cycle === cycle && row.quoteId).map((row) => row.quoteId));
  let candidates = active.filter((quote) => !usedIds.has(quote.id));
  let nextCycle = cycle;
  if (!candidates.length) {
    nextCycle = cycle + (assignments.length ? 1 : 0);
    const last = assignments[0]?.quoteId;
    candidates = active.filter((quote) => quote.id !== last);
    if (!candidates.length) candidates = active;
  }
  return { quote: candidates[Math.min(candidates.length - 1, Math.floor(random * candidates.length))]!, cycle: nextCycle };
}
function quoteDto(row: Quote) {
  return { ...row, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() };
}
function assignmentDto(row: Assignment) {
  return { ...row, date: row.date, assignedAt: row.assignedAt };
}
async function getDailyQuoteSettings() {
  const [settings] = await db.insert(dailyQuoteSettingsTable)
    .values({ id: 1, paletteId: "jade" })
    .onConflictDoNothing()
    .returning();
  if (settings) return settings;
  const [existing] = await db.select().from(dailyQuoteSettingsTable)
    .where(eq(dailyQuoteSettingsTable.id, 1)).limit(1);
  if (!existing) throw new Error("No se pudo cargar la configuración de frase del día");
  return existing;
}
function settingsDto(row: typeof dailyQuoteSettingsTable.$inferSelect) {
  return {
    paletteId: row.paletteId,
    decorationId: row.decorationId,
    revision: row.revision,
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function assignDailyQuote(date = chileDate()): Promise<Assignment> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended('daily-quote-assignment', 0))`);
    const [existing] = await tx.select().from(dailyQuoteAssignmentsTable)
      .where(eq(dailyQuoteAssignmentsTable.date, date)).limit(1);
    if (existing) return existing;
    const active = await tx.select().from(dailyQuotesTable)
      .where(and(eq(dailyQuotesTable.active, true), eq(dailyQuotesTable.deleted, false)));
    if (!active.length) throw new Error("No hay frases activas disponibles");
    const allAssignments = await tx.select().from(dailyQuoteAssignmentsTable)
      .orderBy(desc(dailyQuoteAssignmentsTable.date));
    const { quote: selected, cycle: nextCycle } = chooseDailyQuote(active, allAssignments);
    const [created] = await tx.insert(dailyQuoteAssignmentsTable).values({
      date, quoteId: selected.id, text: selected.text, author: selected.author, cycle: nextCycle,
    }).onConflictDoNothing().returning();
    if (created) return created;
    const [raced] = await tx.select().from(dailyQuoteAssignmentsTable)
      .where(eq(dailyQuoteAssignmentsTable.date, date)).limit(1);
    if (!raced) throw new Error("No se pudo asignar la frase del día");
    return raced;
  });
}

router.get("/quote-of-the-day", async (req, res): Promise<void> => {
  try {
    const parsed = GetQuoteOfTheDayQueryParams.parse(req.query);
    if (parsed.timeZone && parsed.timeZone !== CHILE_TZ) req.log.warn({ requestedTimeZone: parsed.timeZone }, "Daily quote uses Chile timezone");
    await ensureDailyQuoteSeed();
    const [assignment, settings] = await Promise.all([assignDailyQuote(), getDailyQuoteSettings()]);
    res.json(GetQuoteOfTheDayResponse.parse({
      ...assignmentDto(assignment),
      paletteId: settings.paletteId,
      decorationId: settings.decorationId,
    }));
  } catch (err) {
    req.log.error({ err }, "error assigning daily quote");
    res.status(500).json({ error: "No se pudo obtener la frase del día" });
  }
});

router.get("/admin/daily-quotes", ...admin, async (req, res): Promise<void> => {
  try {
    await ensureDailyQuoteSeed();
    const query = ListAdminDailyQuotesQueryParams.parse(req.query);
    const filters = [eq(dailyQuotesTable.deleted, false)];
    if (query.search) filters.push(ilike(dailyQuotesTable.text, `%${query.search}%`));
    if (query.author) filters.push(eq(dailyQuotesTable.author, query.author));
    if (query.active !== undefined) filters.push(eq(dailyQuotesTable.active, query.active));
    const [quotes, activeRows] = await Promise.all([
      db.select().from(dailyQuotesTable).where(and(...filters)).orderBy(asc(dailyQuotesTable.author), asc(dailyQuotesTable.createdAt)),
      db.select({ id: dailyQuotesTable.id }).from(dailyQuotesTable).where(and(eq(dailyQuotesTable.active, true), eq(dailyQuotesTable.deleted, false))),
    ]);
    res.json(ListAdminDailyQuotesResponse.parse({ quotes: quotes.map(quoteDto), activeCount: activeRows.length, total: quotes.length }));
  } catch (err) {
    req.log.error({ err }, "error listing daily quotes");
    res.status(500).json({ error: "No se pudieron obtener las frases" });
  }
});

router.post("/admin/daily-quotes", ...admin, async (req, res): Promise<void> => {
  const parsed = CreateAdminDailyQuoteBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Datos inválidos", details: parsed.error.issues }); return; }
  try {
    const [row] = await db.insert(dailyQuotesTable).values({ ...parsed.data, text: parsed.data.text.trim(), author: parsed.data.author.trim() }).returning();
    res.status(201).json(quoteDto(row));
  } catch (err) { req.log.error({ err }, "error creating daily quote"); res.status(500).json({ error: "No se pudo crear la frase" }); }
});

router.get("/admin/daily-quotes/settings", ...admin, async (req, res): Promise<void> => {
  try {
    res.json(GetAdminDailyQuoteSettingsResponse.parse(settingsDto(await getDailyQuoteSettings())));
  } catch (err) {
    req.log.error({ err }, "error getting daily quote settings");
    res.status(500).json({ error: "No se pudo obtener la paleta" });
  }
});

router.patch("/admin/daily-quotes/settings", ...admin, async (req, res): Promise<void> => {
  const parsed = UpdateAdminDailyQuoteSettingsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Paleta inválida", details: parsed.error.issues });
    return;
  }
  try {
    await getDailyQuoteSettings();
    const [updated] = await db.update(dailyQuoteSettingsTable)
      .set({
        ...(parsed.data.paletteId !== undefined ? { paletteId: parsed.data.paletteId } : {}),
        ...(parsed.data.decorationId !== undefined ? { decorationId: parsed.data.decorationId } : {}),
        revision: sql`${dailyQuoteSettingsTable.revision} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(dailyQuoteSettingsTable.id, 1))
      .returning();
    res.json(UpdateAdminDailyQuoteSettingsResponse.parse(settingsDto(updated)));
  } catch (err) {
    req.log.error({ err }, "error updating daily quote settings");
    res.status(500).json({ error: "No se pudo actualizar la paleta" });
  }
});

router.get("/admin/daily-quotes/current", ...admin, async (req, res): Promise<void> => {
  try { await ensureDailyQuoteSeed(); res.json(GetAdminCurrentDailyQuoteResponse.parse(assignmentDto(await assignDailyQuote()))); }
  catch (err) { req.log.error({ err }, "error getting current daily quote"); res.status(500).json({ error: "No se pudo obtener la frase actual" }); }
});

router.get("/admin/daily-quotes/history", ...admin, async (req, res): Promise<void> => {
  try {
    const { limit } = GetAdminDailyQuoteHistoryQueryParams.parse(req.query);
    const rows = await db.select().from(dailyQuoteAssignmentsTable).orderBy(desc(dailyQuoteAssignmentsTable.date)).limit(limit);
    res.json(GetAdminDailyQuoteHistoryResponse.parse(rows.map(assignmentDto)));
  } catch (err) { req.log.error({ err }, "error listing daily quote history"); res.status(500).json({ error: "No se pudo obtener el historial" }); }
});

router.patch("/admin/daily-quotes/:id", ...admin, async (req, res): Promise<void> => {
  const params = UpdateAdminDailyQuoteParams.safeParse(req.params);
  const body = UpdateAdminDailyQuoteBody.safeParse(req.body);
  if (!params.success || !body.success) { res.status(400).json({ error: "Datos inválidos" }); return; }
  try {
    const [row] = await db.update(dailyQuotesTable).set({ ...body.data, text: body.data.text?.trim(), author: body.data.author?.trim(), revision: sql`${dailyQuotesTable.revision} + 1`, updatedAt: new Date() }).where(and(eq(dailyQuotesTable.id, params.data.id), eq(dailyQuotesTable.deleted, false))).returning();
    if (!row) { res.status(404).json({ error: "Frase no encontrada" }); return; }
    res.json(UpdateAdminDailyQuoteResponse.parse(quoteDto(row)));
  } catch (err) { req.log.error({ err }, "error updating daily quote"); res.status(500).json({ error: "No se pudo actualizar la frase" }); }
});

router.delete("/admin/daily-quotes/:id", ...admin, async (req, res): Promise<void> => {
  const params = DeleteAdminDailyQuoteParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Id inválido" }); return; }
  try {
    const [row] = await db.update(dailyQuotesTable).set({ active: false, deleted: true, revision: sql`${dailyQuotesTable.revision} + 1`, updatedAt: new Date() }).where(eq(dailyQuotesTable.id, params.data.id)).returning({ id: dailyQuotesTable.id });
    if (!row) { res.status(404).json({ error: "Frase no encontrada" }); return; }
    res.sendStatus(204);
  } catch (err) {
    req.log.error({ err }, "error deleting daily quote");
    res.status(500).json({ error: "No se pudo eliminar la frase" });
  }
});

router.post("/admin/daily-quotes/:id/toggle", ...admin, async (req, res): Promise<void> => {
  const params = ToggleAdminDailyQuoteParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Id inválido" }); return; }
  try {
    const [current] = await db.select().from(dailyQuotesTable).where(and(eq(dailyQuotesTable.id, params.data.id), eq(dailyQuotesTable.deleted, false)));
    if (!current) { res.status(404).json({ error: "Frase no encontrada" }); return; }
    const [row] = await db.update(dailyQuotesTable).set({ active: !current.active, revision: current.revision + 1, updatedAt: new Date() }).where(eq(dailyQuotesTable.id, current.id)).returning();
    res.json(ToggleAdminDailyQuoteResponse.parse(quoteDto(row)));
  } catch (err) {
    req.log.error({ err }, "error toggling daily quote");
    res.status(500).json({ error: "No se pudo cambiar el estado de la frase" });
  }
});

export default router;