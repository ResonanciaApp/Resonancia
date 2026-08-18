import { Router, type IRouter } from "express";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import {
  db,
  playbackHistoryTable,
  favoritesTable,
  sessionProgressTable,
  userMilestonesTable,
} from "@workspace/db";
import {
  GetMyPlaysQueryParams,
  PushMyPlaysBody,
  PushMyMilestonesBody,
  SetMyFavoritesBody,
  SetMyProgressBody,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

const PLAYS_LIMIT = 600;
const MAX_MINUTES_PER_EVENT = 180; // cap defensivo: ninguna sesión puede durar más de 3 h
const FUTURE_SLACK_MS = 5 * 60 * 1000; // 5 min de holgura de reloj

// ── Helpers de cálculo de racha (server-side, espejo de utils/stats.ts) ───────
const GOAL_MINUTES = 3;

/** Formatea una fecha ISO como "YYYY-MM-DD" en la zona horaria dada. */
function dayKeyInTz(isoString: string, tz: string): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(isoString));
  } catch {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "UTC",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(isoString));
  }
}

function todayInTz(tz: string): string {
  return dayKeyInTz(new Date().toISOString(), tz);
}

/** Lunes de la semana actual en la zona horaria dada, como "YYYY-MM-DD". */
function mondayOfCurrentWeek(tz: string): string {
  const now = new Date();
  const localStr = now.toLocaleString("en-US", { timeZone: tz });
  const localDate = new Date(localStr);
  const dow = localDate.getDay(); // 0=Dom
  const daysFromMonday = dow === 0 ? 6 : dow - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - daysFromMonday);
  return dayKeyInTz(monday.toISOString(), tz);
}

/** Añade N días a una fecha "YYYY-MM-DD" y devuelve otra "YYYY-MM-DD". */
function addDays(dateStr: string, n: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d + n);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

type DayAgg = { minutes: number; completed: boolean };

function buildAggByDay(
  rows: Array<{ minutes: number | null; completed: boolean | null; playedAt: string }>,
  tz: string,
): Map<string, DayAgg> {
  const map = new Map<string, DayAgg>();
  for (const r of rows) {
    const k = dayKeyInTz(r.playedAt, tz);
    const cur = map.get(k) ?? { minutes: 0, completed: false };
    cur.minutes += r.minutes ?? 0;
    if (r.completed === true) cur.completed = true;
    map.set(k, cur);
  }
  return map;
}

function isActive(agg: DayAgg | undefined): boolean {
  return !!agg && (agg.minutes >= GOAL_MINUTES || agg.completed);
}

function computeStreakServer(
  rows: Array<{ minutes: number | null; completed: boolean | null; playedAt: string }>,
  tz: string,
): {
  currentStreak: number;
  maxStreak: number;
  weekFlags: boolean[];
  weekCount: number;
  todayIndex: number;
  totalActiveDays: number;
} {
  const byDay = buildAggByDay(rows, tz);
  const today = todayInTz(tz);

  // ── Racha actual ─────────────────────────────────────────────────────────────
  const startOffset = isActive(byDay.get(today)) ? 0 : 1;
  let currentStreak = 0;
  for (let i = startOffset; i < 3650; i++) {
    const k = addDays(today, -i);
    if (isActive(byDay.get(k))) currentStreak++;
    else break;
  }

  // ── Racha máxima ─────────────────────────────────────────────────────────────
  const activeKeys = new Set<string>();
  for (const [k, agg] of byDay) if (isActive(agg)) activeKeys.add(k);
  let maxStreak = 0;
  for (const k of activeKeys) {
    if (activeKeys.has(addDays(k, -1))) continue; // no es inicio de cadena
    let len = 0;
    let walk = k;
    while (activeKeys.has(walk)) { len++; walk = addDays(walk, 1); }
    if (len > maxStreak) maxStreak = len;
  }

  // ── Semana actual (Lun-Dom) ───────────────────────────────────────────────────
  const monday = mondayOfCurrentWeek(tz);
  const weekFlags: boolean[] = [];
  let weekCount = 0;
  let todayIndex = 0;
  for (let i = 0; i < 7; i++) {
    const k = addDays(monday, i);
    const met = isActive(byDay.get(k));
    weekFlags.push(met);
    if (met) weekCount++;
    if (k === today) todayIndex = i;
  }

  // ── Total de días activos ─────────────────────────────────────────────────────
  let totalActiveDays = 0;
  for (const agg of byDay.values()) if (isActive(agg)) totalActiveDays++;

  return { currentStreak, maxStreak, weekFlags, weekCount, todayIndex, totalActiveDays };
}

router.get("/me/plays", requireAuth, async (req, res) => {
  const parsed = GetMyPlaysQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Consulta inválida" });
    return;
  }
  const me = req.currentUser!;
  const since = parsed.data.since;

  try {
    const rows = await db
      .select()
      .from(playbackHistoryTable)
      .where(
        since
          ? and(
              eq(playbackHistoryTable.userId, me.id),
              gte(playbackHistoryTable.playedAt, since),
            )
          : eq(playbackHistoryTable.userId, me.id),
      )
      .orderBy(desc(playbackHistoryTable.playedAt))
      .limit(PLAYS_LIMIT);

    res.json({
      events: rows.map((r) => ({
        clientEventId: r.clientEventId,
        sessionId: r.sessionId,
        categoryId: r.categoryId,
        categoryLabel: r.categoryLabel,
        contentType: r.contentType,
        source: r.source,
        minutes: r.minutes,
        completed: r.completed,
        playedAt: r.playedAt,
      })),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Error al obtener el historial" });
  }
});

router.post("/me/plays", requireAuth, async (req, res) => {
  const parsed = PushMyPlaysBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Datos inválidos" });
    return;
  }
  const me = req.currentUser!;
  const now = Date.now();

  // Validación defensiva: descartar eventos con timestamp futuro o minutos
  // excesivos. onConflictDoNothing sobre clientEventId ya evita duplicados.
  const events = parsed.data.events.filter((e) => {
    const ts = new Date(e.playedAt).getTime();
    return ts <= now + FUTURE_SLACK_MS && e.minutes <= MAX_MINUTES_PER_EVENT;
  });

  if (events.length === 0) {
    res.status(204).end();
    return;
  }

  try {
    await db
      .insert(playbackHistoryTable)
      .values(
        events.map((e) => ({
          userId: me.id,
          clientEventId: e.clientEventId,
          sessionId: e.sessionId,
          categoryId: e.categoryId,
          categoryLabel: e.categoryLabel,
          contentType: e.contentType ?? null,
          source: e.source ?? null,
          minutes: Math.min(e.minutes, MAX_MINUTES_PER_EVENT),
          completed: e.completed,
          playedAt: e.playedAt,
        })),
      )
      .onConflictDoNothing({
        target: [playbackHistoryTable.userId, playbackHistoryTable.clientEventId],
      });
    res.status(204).end();
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Error al sincronizar el historial" });
  }
});

router.get("/me/streak", requireAuth, async (req, res) => {
  const me = req.currentUser!;
  const tz = typeof req.query.tz === "string" && req.query.tz ? req.query.tz : "UTC";

  try {
    const rows = await db
      .select({
        minutes: playbackHistoryTable.minutes,
        completed: playbackHistoryTable.completed,
        playedAt: playbackHistoryTable.playedAt,
      })
      .from(playbackHistoryTable)
      .where(eq(playbackHistoryTable.userId, me.id))
      .orderBy(desc(playbackHistoryTable.playedAt))
      .limit(PLAYS_LIMIT);

    const result = computeStreakServer(rows, tz);
    res.json(result);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Error al calcular la racha" });
  }
});

router.get("/me/favorites", requireAuth, async (req, res) => {
  const me = req.currentUser!;
  try {
    const rows = await db
      .select({ sessionId: favoritesTable.sessionId })
      .from(favoritesTable)
      .where(eq(favoritesTable.userId, me.id))
      .orderBy(desc(favoritesTable.createdAt));
    res.json({ sessionIds: rows.map((r) => r.sessionId) });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Error al obtener favoritos" });
  }
});

router.put("/me/favorites", requireAuth, async (req, res) => {
  const parsed = SetMyFavoritesBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Datos inválidos" });
    return;
  }
  const me = req.currentUser!;
  const sessionIds = Array.from(new Set(parsed.data.sessionIds));

  try {
    await db.transaction(async (tx) => {
      await tx.delete(favoritesTable).where(eq(favoritesTable.userId, me.id));
      if (sessionIds.length > 0) {
        await tx
          .insert(favoritesTable)
          .values(sessionIds.map((sessionId) => ({ userId: me.id, sessionId })))
          .onConflictDoNothing();
      }
    });
    res.json({ sessionIds });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Error al guardar favoritos" });
  }
});

router.get("/me/progress", requireAuth, async (req, res) => {
  const me = req.currentUser!;
  try {
    const rows = await db
      .select({
        sessionId: sessionProgressTable.sessionId,
        progress: sessionProgressTable.progress,
      })
      .from(sessionProgressTable)
      .where(eq(sessionProgressTable.userId, me.id));
    res.json({ items: rows });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Error al obtener el progreso" });
  }
});

router.put("/me/progress", requireAuth, async (req, res) => {
  const parsed = SetMyProgressBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Datos inválidos" });
    return;
  }
  const me = req.currentUser!;
  const items = parsed.data.items;

  try {
    if (items.length > 0) {
      await db
        .insert(sessionProgressTable)
        .values(
          items.map((it) => ({
            userId: me.id,
            sessionId: it.sessionId,
            progress: it.progress,
          })),
        )
        .onConflictDoUpdate({
          target: [sessionProgressTable.userId, sessionProgressTable.sessionId],
          set: { progress: sql`excluded.progress`, updatedAt: new Date() },
        });
    }

    const rows = await db
      .select({
        sessionId: sessionProgressTable.sessionId,
        progress: sessionProgressTable.progress,
      })
      .from(sessionProgressTable)
      .where(eq(sessionProgressTable.userId, me.id));
    res.json({ items: rows });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Error al guardar el progreso" });
  }
});

// ── Hitos (logros) — log append-only, merge por unión ────────────────────────

router.get("/me/milestones", requireAuth, async (req, res) => {
  const me = req.currentUser!;
  try {
    const rows = await db
      .select({
        milestoneId: userMilestonesTable.milestoneId,
        unlockedAt: userMilestonesTable.unlockedAt,
      })
      .from(userMilestonesTable)
      .where(eq(userMilestonesTable.userId, me.id));
    res.json({
      milestones: rows.map((r) => ({
        milestoneId: r.milestoneId,
        unlockedAt: r.unlockedAt.toISOString(),
      })),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Error al obtener hitos" });
  }
});

router.put("/me/milestones", requireAuth, async (req, res) => {
  const parsed = PushMyMilestonesBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Datos inválidos" });
    return;
  }
  const me = req.currentUser!;
  try {
    const incoming = parsed.data.milestones;
    if (incoming.length > 0) {
      await db
        .insert(userMilestonesTable)
        .values(
          incoming.map((m) => ({
            userId: me.id,
            milestoneId: m.milestoneId,
            unlockedAt: new Date(m.unlockedAt),
          })),
        )
        .onConflictDoNothing();
    }
    const rows = await db
      .select({
        milestoneId: userMilestonesTable.milestoneId,
        unlockedAt: userMilestonesTable.unlockedAt,
      })
      .from(userMilestonesTable)
      .where(eq(userMilestonesTable.userId, me.id));
    res.json({
      milestones: rows.map((r) => ({
        milestoneId: r.milestoneId,
        unlockedAt: r.unlockedAt.toISOString(),
      })),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Error al guardar hitos" });
  }
});

// Quitar un hito conseguido (p. ej. para volver a probar la celebración).
router.delete("/me/milestones/:milestoneId", requireAuth, async (req, res) => {
  const me = req.currentUser!;
  const milestoneId = String(req.params.milestoneId ?? "");
  try {
    await db
      .delete(userMilestonesTable)
      .where(
        and(
          eq(userMilestonesTable.userId, me.id),
          eq(userMilestonesTable.milestoneId, milestoneId),
        ),
      );
    res.json({ ok: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Error al borrar el hito" });
  }
});

export default router;
