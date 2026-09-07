import { Router, type IRouter } from "express";
import { and, desc, eq, gte, lt, sql } from "drizzle-orm";
import {
  db,
  catalogSessionsTable,
  searchTrendBucketsTable,
} from "@workspace/db";
import {
  GetSearchTrendsQueryParams,
  RecordSearchTrendOpenBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

const WINDOW_DAYS = 30;
const MINIMUM_VOLUME = 3;
const MAX_OPENS_PER_MINUTE = 12;
const RATE_WINDOW_MS = 60_000;
const TERM_INCREMENT_INTERVAL_MS = 5 * 60_000;
const RETENTION_SWEEP_INTERVAL_MS = 24 * 60 * 60_000;
const rateLimits = new Map<string, { count: number; resetAt: number }>();

function utcDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function windowStartDay(now: Date): string {
  const start = new Date(now);
  start.setUTCDate(start.getUTCDate() - (WINDOW_DAYS - 1));
  return utcDay(start);
}

async function purgeExpiredBuckets(now = new Date()): Promise<void> {
  await db
    .delete(searchTrendBucketsTable)
    .where(lt(searchTrendBucketsTable.bucketDay, windowStartDay(now)));
}

// Retention is independent from search traffic: sweep shortly after startup and
// then daily. unref() lets tests and graceful shutdown finish normally.
const initialRetentionSweep = setTimeout(() => {
  void purgeExpiredBuckets().catch((err) => {
    console.error("search trend retention sweep failed", err);
  });
}, 1_000);
initialRetentionSweep.unref();
const retentionSweep = setInterval(() => {
  void purgeExpiredBuckets().catch((err) => {
    console.error("search trend retention sweep failed", err);
  });
}, RETENTION_SWEEP_INTERVAL_MS);
retentionSweep.unref();

/**
 * Canonical form used exclusively in the anonymous aggregate. It intentionally
 * drops punctuation, accents and repeated whitespace so equivalent searches are
 * counted together and raw free text is never retained.
 */
export function normalizeSearchTrendTerm(value: string): string | null {
  const normalized = value
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLocaleLowerCase("es")
    .trim()
    .replace(/\s+/gu, " ");

  if (
    normalized.length === 0 ||
    normalized.length > 80 ||
    !/^[\p{L}\p{N}]+(?: [\p{L}\p{N}]+)*$/u.test(normalized)
  ) {
    return null;
  }
  return normalized;
}

function isRateLimited(ip: string, nowMs: number): boolean {
  // Bounded cleanup: this transient protection never enters the database and
  // is not associated with a search term or account.
  if (rateLimits.size > 10_000) {
    for (const [key, entry] of rateLimits) {
      if (entry.resetAt <= nowMs) rateLimits.delete(key);
    }
  }

  const entry = rateLimits.get(ip);
  if (!entry || entry.resetAt <= nowMs) {
    rateLimits.set(ip, { count: 1, resetAt: nowMs + RATE_WINDOW_MS });
    return false;
  }
  if (entry.count >= MAX_OPENS_PER_MINUTE) return true;
  entry.count += 1;
  return false;
}

// GET /catalog/search-trends — top 3 anonymous terms during the 30-day window.
router.get("/catalog/search-trends", async (req, res) => {
  const parsed = GetSearchTrendsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Contexto inválido" });
    return;
  }

  try {
    const since = windowStartDay(new Date());
    const rows = await db
      .select({
        term: searchTrendBucketsTable.normalizedTerm,
        count: sql<number>`cast(sum(${searchTrendBucketsTable.count}) as integer)`,
      })
      .from(searchTrendBucketsTable)
      .where(
        and(
          eq(searchTrendBucketsTable.context, parsed.data.context),
          gte(searchTrendBucketsTable.bucketDay, since),
        ),
      )
      .groupBy(searchTrendBucketsTable.normalizedTerm)
      .having(sql`sum(${searchTrendBucketsTable.count}) >= ${MINIMUM_VOLUME}`)
      .orderBy(
        desc(sql`sum(${searchTrendBucketsTable.count})`),
        searchTrendBucketsTable.normalizedTerm,
      )
      .limit(3);

    res.json({ terms: rows });
  } catch (err) {
    req.log.error({ err }, "error listing search trends");
    res.status(500).json({ error: "Error al obtener búsquedas populares" });
  }
});

// POST /catalog/search-trends/open — records an already-opened, published result.
router.post("/catalog/search-trends/open", async (req, res) => {
  if (
    !req.body ||
    typeof req.body !== "object" ||
    Array.isArray(req.body) ||
    Object.keys(req.body).some((key) => !["context", "term", "sessionId"].includes(key))
  ) {
    res.status(400).json({ error: "Datos inválidos" });
    return;
  }
  const parsed = RecordSearchTrendOpenBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Datos inválidos" });
    return;
  }
  const normalizedTerm = normalizeSearchTrendTerm(parsed.data.term);
  if (!normalizedTerm) {
    res.status(400).json({ error: "Término de búsqueda inválido" });
    return;
  }
  if (parsed.data.sessionId.trim() !== parsed.data.sessionId) {
    res.status(400).json({ error: "Datos inválidos" });
    return;
  }

  const ip = req.ip || "unknown";
  if (isRateLimited(ip, Date.now())) {
    res.status(429).json({ error: "Demasiadas aperturas de búsqueda; intentá más tarde" });
    return;
  }

  try {
    // The client only calls this after navigation succeeds. Checking that the
    // target remains publicly playable prevents fabricated trend signals.
    const [session] = await db
      .select({
        id: catalogSessionsTable.id,
        descansoTags: catalogSessionsTable.descansoTags,
        sleepTag: catalogSessionsTable.sleepTag,
      })
      .from(catalogSessionsTable)
      .where(
        and(
          eq(catalogSessionsTable.id, parsed.data.sessionId),
          eq(catalogSessionsTable.status, "published"),
          eq(catalogSessionsTable.isPlaceholder, false),
        ),
      )
      .limit(1);
    if (!session) {
      res.status(404).json({ error: "Sesión no encontrada o no publicada" });
      return;
    }
    if (
      parsed.data.context === "sleep" &&
      (session.descansoTags?.length ?? 0) === 0 &&
      !session.sleepTag
    ) {
      res.status(400).json({ error: "La sesión no pertenece al contexto Dormir" });
      return;
    }

    const now = new Date();
    const since = windowStartDay(now);
    await db.transaction(async (tx) => {
      // Keeping only buckets that can affect the window guarantees that this
      // aggregate cannot become a long-term search history.
      await tx
        .delete(searchTrendBucketsTable)
        .where(lt(searchTrendBucketsTable.bucketDay, since));
      await tx
        .insert(searchTrendBucketsTable)
        .values({
          context: parsed.data.context,
          normalizedTerm,
          bucketDay: utcDay(now),
          count: 1,
          firstOpenedAt: now,
          lastOpenedAt: now,
        })
        .onConflictDoUpdate({
          target: [
            searchTrendBucketsTable.context,
            searchTrendBucketsTable.normalizedTerm,
            searchTrendBucketsTable.bucketDay,
          ],
          set: {
            // Shared DB gate: even across multiple server instances, repeated
            // opens of one term can contribute at most once every five minutes.
            count: sql`case
              when ${searchTrendBucketsTable.lastOpenedAt} <= ${now.toISOString()}::timestamptz - (${TERM_INCREMENT_INTERVAL_MS} * interval '1 millisecond')
              then ${searchTrendBucketsTable.count} + 1
              else ${searchTrendBucketsTable.count}
            end`,
            lastOpenedAt: sql`case
              when ${searchTrendBucketsTable.lastOpenedAt} <= ${now.toISOString()}::timestamptz - (${TERM_INCREMENT_INTERVAL_MS} * interval '1 millisecond')
              then ${now.toISOString()}::timestamptz
              else ${searchTrendBucketsTable.lastOpenedAt}
            end`,
          },
        });
    });
    res.status(204).end();
  } catch (err) {
    req.log.error({ err }, "error recording search trend");
    res.status(500).json({ error: "Error al registrar apertura de búsqueda" });
  }
});

export default router;