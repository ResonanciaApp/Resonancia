import { Router, type IRouter } from "express";
import { pool } from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth";
import { isPrivateObjectReference, resolveObjectReadAccess } from "../lib/objectAccess";

const router: IRouter = Router();
const SESSION_ID = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
export const PRESENCE_TTL_SECONDS = 90;
const CACHE_MS = 10_000;
type Summary = {
  count: number;
  updatedAt: string;
  avatars: { id: string; avatarUrl: string | null; avatarPresetId: string | null }[];
};
let cached: { value: Summary; expires: number } | null = null;
let pending: Promise<Summary> | null = null;
const requestWindows = new Map<string, { until: number; count: number }>();
function allowRequest(userId: number, kind: string, limit: number) {
  const key = `${userId}:${kind}`;
  const now = Date.now();
  const entry = requestWindows.get(key);
  if (entry && entry.until > now) {
    if (entry.count >= limit) return false;
    entry.count++; return true;
  }
  if (requestWindows.size >= 10_000) requestWindows.delete(requestWindows.keys().next().value!);
  requestWindows.set(key, { until: now + 60_000, count: 1 });
  return true;
}

router.post("/community/presence/heartbeat", requireAuth, async (req, res) => {
  const sessionId = req.body?.sessionId;
  if (typeof sessionId !== "string" || !SESSION_ID.test(sessionId)) {
    res.status(400).json({ error: "Identificador de sesión inválido" }); return;
  }
  if (!allowRequest(req.currentUser!.id, "write", 40)) {
    res.setHeader("Retry-After", "60");
    res.status(429).json({ error: "Demasiadas actualizaciones de presencia" }); return;
  }
  try {
    // Bound each account's live devices. Serializing by account avoids concurrent
    // registrations bypassing the bound; updates within 20s never write a new tick.
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("SELECT pg_advisory_xact_lock($1)", [req.currentUser!.id]);
      await client.query(`
        INSERT INTO community_presence(user_id, session_id)
        SELECT $1, $2 WHERE
          EXISTS (SELECT 1 FROM community_presence WHERE user_id=$1 AND session_id=$2)
          OR (SELECT count(*) FROM community_presence
              WHERE user_id=$1 AND closed_at IS NULL AND last_seen_at > now()-interval '90 seconds') < 8
        ON CONFLICT(user_id,session_id) DO UPDATE SET last_seen_at=now()
          WHERE community_presence.closed_at IS NULL
            AND community_presence.last_seen_at < now()-interval '20 seconds'
        RETURNING session_id`, [req.currentUser!.id, sessionId]);
      // Expired rows are irrelevant to the count; prune old rows for this account
      // in this bounded heartbeat transaction, never on every summary read.
      await client.query("DELETE FROM community_presence WHERE user_id=$1 AND last_seen_at < now()-interval '1 day'", [req.currentUser!.id]);
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK"); throw error;
    } finally { client.release(); }
    res.status(204).end();
  } catch (error) {
    req.log.error({ err: error }, "Presence heartbeat failed");
    res.status(503).json({ error: "Presencia temporalmente no disponible" });
  }
});

router.post("/community/presence/leave", requireAuth, async (req, res) => {
  const sessionId = req.body?.sessionId;
  if (typeof sessionId !== "string" || !SESSION_ID.test(sessionId)) {
    res.status(400).json({ error: "Identificador de sesión inválido" }); return;
  }
  if (!allowRequest(req.currentUser!.id, "leave", 40)) {
    res.setHeader("Retry-After", "60");
    res.status(429).json({ error: "Demasiadas actualizaciones de presencia" }); return;
  }
  try {
    // Upsert a tombstone even when leave arrives before its in-flight heartbeat.
    await pool.query(`INSERT INTO community_presence(user_id,session_id,closed_at)
      VALUES($1,$2,now()) ON CONFLICT(user_id,session_id)
      DO UPDATE SET closed_at=now()`, [req.currentUser!.id, sessionId]);
    cached = null;
    res.status(204).end();
  } catch (error) {
    req.log.error({ err: error }, "Presence leave failed");
    res.status(503).json({ error: "Presencia temporalmente no disponible" });
  }
});

export async function loadSummary(queryClient: Pick<typeof pool, "query"> = pool): Promise<Summary> {
  const result = await queryClient.query(`
    WITH active_users AS (
      SELECT u.id, u.avatar_url, u.avatar_preset_id FROM users u
      WHERE EXISTS (SELECT 1 FROM community_presence p WHERE p.user_id=u.id
        AND p.closed_at IS NULL AND p.last_seen_at > now()-interval '90 seconds')
    )
    SELECT (SELECT count(*)::integer FROM active_users) AS count,
      now() AS updated_at,
      COALESCE((SELECT jsonb_agg(sample) FROM (
        SELECT id, avatar_url, avatar_preset_id FROM active_users
        WHERE avatar_url IS NOT NULL OR avatar_preset_id IS NOT NULL
        ORDER BY random() LIMIT 24
      ) sample), '[]'::jsonb) AS avatars`);
  const row = result.rows[0];
  const avatars: Summary["avatars"] = [];
  await Promise.all(row.avatars.map(async (user: { id: number; avatar_url: string | null; avatar_preset_id: string | null }) => {
    let avatarUrl = user.avatar_url;
    if (avatarUrl && isPrivateObjectReference(avatarUrl)) {
      // Object references alone are not grants. The shared ACL checks upload
      // ownership and denies inspiration-only images even if referenced as avatars.
      const access = await resolveObjectReadAccess({ objectPath: avatarUrl });
      if (access !== "public") avatarUrl = null;
    } else if (avatarUrl && !/^https:\/\//i.test(avatarUrl)) {
      avatarUrl = null;
    }
    if (avatarUrl || user.avatar_preset_id) avatars.push({
      id: String(user.id), avatarUrl, avatarPresetId: user.avatar_preset_id,
    });
  }));
  return { count: row.count, updatedAt: new Date(row.updated_at).toISOString(), avatars };
}

router.get("/community/presence", requireAuth, async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (!allowRequest(req.currentUser!.id, "read", 120)) {
    res.setHeader("Retry-After", "60");
    res.status(429).json({ error: "Demasiadas consultas de presencia" }); return;
  }
  try {
    if (!cached || cached.expires <= Date.now()) {
      if (!pending) pending = loadSummary().then((value) => {
        cached = { value, expires: Date.now() + CACHE_MS }; return value;
      }).finally(() => { pending = null; });
      res.json(await pending);
    } else res.json(cached.value);
  } catch (error) {
    req.log.error({ err: error }, "Presence summary failed");
    res.status(503).json({ error: "Presencia temporalmente no disponible" });
  }
});

export default router;