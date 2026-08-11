import { Router, type IRouter } from "express";
import { inArray, or, and, sql, eq } from "drizzle-orm";
import {
  db,
  communityActivityEventsTable,
  usersTable,
  type CommunityActivityEventType,
  type CommunityActivityPayload,
} from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth";
import { recordCommunityEvent } from "../lib/communityActivity";

const router: IRouter = Router();

const LIVE_TYPES: CommunityActivityEventType[] = ["session_play", "mixer_active", "geometrix_active"];
const DISCRETE_TYPES: CommunityActivityEventType[] = ["mix_shared", "glyph_shared", "user_joined"];

function parseHeartbeatBody(body: unknown): { eventType: CommunityActivityEventType; payload: CommunityActivityPayload } | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  if (!LIVE_TYPES.includes(b.eventType as CommunityActivityEventType)) return null;
  const payload = b.payload && typeof b.payload === "object" ? b.payload as CommunityActivityPayload : {};
  return { eventType: b.eventType as CommunityActivityEventType, payload };
}

function parseDiscreteEventBody(body: unknown): { eventType: CommunityActivityEventType; payload: CommunityActivityPayload } | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  if (!DISCRETE_TYPES.includes(b.eventType as CommunityActivityEventType)) return null;
  const payload = b.payload && typeof b.payload === "object" ? b.payload as CommunityActivityPayload : {};
  return { eventType: b.eventType as CommunityActivityEventType, payload };
}

/**
 * POST /community/activity/heartbeat
 * Upsert a live activity event. One row per (userId, eventType) — refreshed each tick.
 */
router.post("/community/activity/heartbeat", requireAuth, async (req, res) => {
  const parsed = parseHeartbeatBody(req.body);
  if (!parsed) {
    res.status(400).json({ error: "Datos inválidos" });
    return;
  }

  const me = req.currentUser!;
  const now = new Date();

  try {
    await db
      .insert(communityActivityEventsTable)
      .values({
        userId: me.id,
        eventType: parsed.eventType,
        payload: parsed.payload,
        lastHeartbeatAt: now,
        createdAt: now,
      })
      .onConflictDoUpdate({
        target: [communityActivityEventsTable.userId, communityActivityEventsTable.eventType],
        set: {
          payload: sql`excluded.payload`,
          lastHeartbeatAt: now,
          createdAt: now,
        },
      });

    res.status(204).end();
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Error al registrar la actividad" });
  }
});

/**
 * POST /community/activity/event
 * Record a discrete community event (mix_shared | glyph_shared | user_joined).
 * Upserts so the user's most recent event of each type is always shown.
 */
router.post("/community/activity/event", requireAuth, async (req, res) => {
  const parsed = parseDiscreteEventBody(req.body);
  if (!parsed) {
    res.status(400).json({ error: "Datos inválidos" });
    return;
  }

  const me = req.currentUser!;
  const now = new Date();

  try {
    await db
      .insert(communityActivityEventsTable)
      .values({
        userId: me.id,
        eventType: parsed.eventType,
        payload: parsed.payload,
        createdAt: now,
      })
      .onConflictDoUpdate({
        target: [communityActivityEventsTable.userId, communityActivityEventsTable.eventType],
        set: {
          payload: sql`excluded.payload`,
          createdAt: now,
        },
      });

    res.status(204).end();
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Error al registrar el evento" });
  }
});

/**
 * GET /community/feed
 * Public. Returns live events (heartbeat < 2 min ago) + discrete events (< 24 h ago),
 * joined with user profile. Live events appear first. No auth required.
 */
router.get("/community/feed", async (req, res) => {
  const liveThreshold = new Date(Date.now() - 2 * 60 * 1000);
  const discreteThreshold = new Date(Date.now() - 24 * 60 * 60 * 1000);

  try {
    const rows = await db
      .select({
        id: communityActivityEventsTable.id,
        eventType: communityActivityEventsTable.eventType,
        payload: communityActivityEventsTable.payload,
        lastHeartbeatAt: communityActivityEventsTable.lastHeartbeatAt,
        createdAt: communityActivityEventsTable.createdAt,
        isLive: sql<boolean>`(
          ${communityActivityEventsTable.lastHeartbeatAt} IS NOT NULL
          AND ${communityActivityEventsTable.lastHeartbeatAt} > ${liveThreshold}
        )`,
        userId: usersTable.id,
        displayName: usersTable.displayName,
        avatarUrl: usersTable.avatarUrl,
        location: usersTable.location,
      })
      .from(communityActivityEventsTable)
      .innerJoin(usersTable, eq(usersTable.id, communityActivityEventsTable.userId))
      .where(
        and(
          sql`${usersTable.avatarUrl} IS NOT NULL`,
          or(
            // Live events: any heartbeat in last 2 minutes
            and(
              inArray(communityActivityEventsTable.eventType, LIVE_TYPES),
              sql`${communityActivityEventsTable.lastHeartbeatAt} > ${liveThreshold}`,
            ),
            // Discrete events: created in last 24 hours
            and(
              inArray(communityActivityEventsTable.eventType, DISCRETE_TYPES),
              sql`${communityActivityEventsTable.createdAt} > ${discreteThreshold}`,
            ),
          ),
        ),
      )
      .orderBy(
        // Live first (0), discrete second (1), then recency within each group
        sql`
          CASE WHEN ${communityActivityEventsTable.lastHeartbeatAt} IS NOT NULL
                    AND ${communityActivityEventsTable.lastHeartbeatAt} > ${liveThreshold}
               THEN 0 ELSE 1 END ASC,
          COALESCE(${communityActivityEventsTable.lastHeartbeatAt}, ${communityActivityEventsTable.createdAt}) DESC
        `,
      )
      .limit(50);

    res.json(
      rows.map((r) => ({
        id: r.id,
        eventType: r.eventType,
        payload: r.payload,
        lastHeartbeatAt: r.lastHeartbeatAt?.toISOString() ?? null,
        createdAt: r.createdAt.toISOString(),
        isLive: Boolean(r.isLive),
        user: {
          id: r.userId,
          displayName: r.displayName,
          avatarUrl: r.avatarUrl,
          location: r.location ?? null,
        },
      })),
    );
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Error al obtener el feed" });
  }
});

export default router;
