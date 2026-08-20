import { Router, type IRouter } from "express";
import { createHmac, timingSafeEqual } from "node:crypto";
import { and, asc, eq, gt, isNotNull, or, sql } from "drizzle-orm";
import {
  accountDeletionsTable,
  db,
  liveSessionsTable,
  guideConfigsTable,
  usersTable,
} from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth";
import { accountIdentityHash } from "../lib/accountDeletion";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      rawBody?: Buffer;
    }
  }
}

const router: IRouter = Router();

/** Verifica la firma HMAC-SHA256 del webhook de Cal.com usando el body crudo. */
function verifyCalSignature(
  rawBody: Buffer,
  signature: string | undefined,
  secret: string,
): boolean {
  if (!signature) return false;
  const expected = createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");
  try {
    return timingSafeEqual(
      Buffer.from(signature, "hex"),
      Buffer.from(expected, "hex"),
    );
  } catch {
    return false;
  }
}

// GET /live/guides — guiadores con sesiones en vivo habilitadas y calLink configurado (público).
router.get("/live/guides", async (req, res) => {
  try {
    const rows = await db
      .select()
      .from(guideConfigsTable)
      .where(
        and(
          eq(guideConfigsTable.isLiveEnabled, true),
          isNotNull(guideConfigsTable.calLink),
        ),
      )
      .orderBy(asc(guideConfigsTable.guideId));

    res.json({
      guides: rows.map((g) => ({
        guideId: g.guideId,
        displayName: g.displayName,
        calLink: g.calLink ?? null,
        dailyRoomUrl: g.dailyRoomUrl ?? null,
      })),
    });
  } catch (err) {
    req.log.error({ err }, "error listing live guides");
    res.status(500).json({ error: "Error al obtener los guiadores" });
  }
});

// GET /live/sessions/me — sesiones próximas del usuario autenticado.
router.get("/live/sessions/me", requireAuth, async (req, res) => {
  const me = req.currentUser!;
  const clerkUserId = me.clerkUserId;
  const now = new Date();

  try {
    const rows = await db
      .select()
      .from(liveSessionsTable)
      .where(
        and(
          eq(liveSessionsTable.clerkUserId, clerkUserId),
          gt(liveSessionsTable.scheduledAt, now),
        ),
      )
      .orderBy(asc(liveSessionsTable.scheduledAt));

    res.json({
      sessions: rows.map((s) => ({
        id: s.id,
        guideId: s.guideId,
        guideDisplayName: s.guideDisplayName ?? null,
        calEventUid: s.calEventUid,
        calEventTitle: s.calEventTitle ?? null,
        scheduledAt: s.scheduledAt.toISOString(),
        scheduledEnd: s.scheduledEnd?.toISOString() ?? null,
        status: s.status,
        dailyRoomUrl: s.status === "confirmed" ? (s.dailyRoomUrl ?? null) : null,
        attendeeName: s.attendeeName ?? null,
        calLink: s.calLink ?? null,
        notes: s.notes ?? null,
      })),
    });
  } catch (err) {
    req.log.error({ err }, "error listing live sessions for user");
    res.status(500).json({ error: "Error al obtener las sesiones" });
  }
});

// POST /live/webhook/cal — recibe eventos de Cal.com.
// Requiere que la variable de entorno CAL_WEBHOOK_SECRET esté configurada.
// Cal.com firma el body crudo con HMAC-SHA256 y lo envía en X-Cal-Signature-256.
router.post("/live/webhook/cal", async (req, res) => {
  const secret = process.env["CAL_WEBHOOK_SECRET"];
  if (!secret) {
    req.log.error("CAL_WEBHOOK_SECRET is not set — rejecting webhook");
    res.status(500).json({ error: "Webhook secret not configured" });
    return;
  }

  const rawBody = req.rawBody;
  if (!rawBody) {
    req.log.error("rawBody not captured — cannot verify webhook signature");
    res.status(500).json({ error: "Raw body unavailable" });
    return;
  }

  const signature = req.headers["x-cal-signature-256"] as string | undefined;
  if (!verifyCalSignature(rawBody, signature, secret)) {
    req.log.warn({ signature }, "cal webhook signature mismatch");
    res.status(401).json({ error: "Invalid signature" });
    return;
  }

  const payload = req.body as Record<string, unknown>;
  const triggerEvent = payload["triggerEvent"] as string | undefined;
  const booking = payload["payload"] as Record<string, unknown> | undefined;

  if (!booking) {
    res.status(400).json({ error: "Missing payload" });
    return;
  }

  const uid = booking["uid"] as string | undefined;
  if (!uid) {
    res.status(400).json({ error: "Missing uid in payload" });
    return;
  }

  const attendeeList = (booking["attendees"] as Array<{ name?: string; email?: string }> | undefined) ?? [];
  const firstAttendee = attendeeList[0];
  const attendeeName = firstAttendee?.name ?? null;
  const attendeeEmail = firstAttendee?.email ?? null;

  const startTime = booking["startTime"] as string | undefined;
  const endTime = booking["endTime"] as string | undefined;
  const title = booking["title"] as string | undefined;
  const notes = booking["description"] as string | undefined;

  const organizer = booking["organizer"] as Record<string, unknown> | undefined;
  const organizerEmail = organizer?.["email"] as string | undefined;
  const calUsername = organizer?.["username"] as string | undefined;

  // Resolver guideId buscando en guide_configs cuál guiador tiene este cal username/email
  let guideId: string | null = null;
  let guideDisplayName: string | null = null;
  let dailyRoomUrl: string | null = null;
  let guideCalLink: string | null = null;

  try {
    const allConfigs = await db.select().from(guideConfigsTable);
    const matched = allConfigs.find((g) => {
      if (!g.calLink) return false;
      return (
        (calUsername && g.calLink.includes(calUsername)) ||
        (organizerEmail && g.calLink.includes(organizerEmail))
      );
    });
    if (matched) {
      guideId = matched.guideId;
      guideDisplayName = matched.displayName || null;
      dailyRoomUrl = matched.dailyRoomUrl ?? null;
      guideCalLink = matched.calLink ?? null;
    }
  } catch (err) {
    req.log.warn({ err }, "error resolving guideId from cal webhook");
  }

  // Si no se pudo resolver el guiador, rechazar con 202 (aceptado pero ignorado)
  // para evitar persistir datos con guideId incorrecto.
  if (!guideId) {
    req.log.warn(
      { uid, calUsername, organizerEmail, triggerEvent },
      "cal webhook: organizer not matched to any guide_config — ignoring event",
    );
    res.status(202).json({ ok: false, reason: "guide not resolved" });
    return;
  }

  // Resolver clerkUserId a partir del email del asistente
  let clerkUserId: string | null = null;
  if (attendeeEmail) {
    try {
      const [user] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, attendeeEmail))
        .limit(1);
      if (user) {
        clerkUserId = user.clerkUserId;
      }
    } catch (err) {
      req.log.warn({ err, attendeeEmail }, "error resolving clerkUserId for attendee");
    }
  }

  try {
    let keptAnonymized = false;
    await db.transaction(async (tx) => {
      const identityHash = clerkUserId ? accountIdentityHash(clerkUserId) : null;
      const lockKey = identityHash ?? `cal-booking:${uid}`;
      await tx.execute(sql`
        SELECT pg_advisory_xact_lock(hashtextextended(${lockKey}, 0))
      `);

      // Revalidate only after taking the same lock used by account deletion.
      // This closes the check-then-upsert race that could restore attendee PII.
      const deletionPredicates = [
        sql`${uid} = ANY(${accountDeletionsTable.liveSessionUids})`,
      ];
      if (identityHash) {
        deletionPredicates.push(eq(accountDeletionsTable.identityHash, identityHash));
      }
      const [deletedAccountBooking] = await tx
        .select({ identityHash: accountDeletionsTable.identityHash })
        .from(accountDeletionsTable)
        .where(or(...deletionPredicates))
        .limit(1);

      if (deletedAccountBooking) {
        keptAnonymized = true;
        await tx
          .update(liveSessionsTable)
          .set({
            clerkUserId: null,
            attendeeName: null,
            attendeeEmail: null,
            notes: null,
            ...(triggerEvent === "BOOKING_CANCELLED"
              ? { status: "cancelled" as const }
              : {}),
            updatedAt: new Date(),
          })
          .where(eq(liveSessionsTable.calEventUid, uid));
        return;
      }

      if (triggerEvent === "BOOKING_CREATED" || triggerEvent === "BOOKING_RESCHEDULED") {
        await tx
          .insert(liveSessionsTable)
          .values({
            clerkUserId,
            guideId,
            calEventUid: uid,
            calEventTitle: title ?? null,
            scheduledAt: startTime ? new Date(startTime) : new Date(),
            scheduledEnd: endTime ? new Date(endTime) : null,
            status: "confirmed",
            dailyRoomUrl,
            attendeeName,
            attendeeEmail,
            guideDisplayName,
            calLink: guideCalLink,
            notes: notes ?? null,
          })
          .onConflictDoUpdate({
            target: liveSessionsTable.calEventUid,
            set: {
              clerkUserId,
              guideId,
              calEventTitle: title ?? null,
              scheduledAt: startTime ? new Date(startTime) : new Date(),
              scheduledEnd: endTime ? new Date(endTime) : null,
              status: "confirmed",
              dailyRoomUrl,
              attendeeName,
              attendeeEmail,
              guideDisplayName,
              calLink: guideCalLink,
              notes: notes ?? null,
              updatedAt: new Date(),
            },
          });
      } else if (triggerEvent === "BOOKING_CANCELLED") {
        await tx
          .update(liveSessionsTable)
          .set({ status: "cancelled", updatedAt: new Date() })
          .where(eq(liveSessionsTable.calEventUid, uid));
      }
    });

    if (keptAnonymized) {
      req.log.info({ uid, triggerEvent }, "cal webhook kept deleted booking anonymized");
    } else if (triggerEvent === "BOOKING_CREATED" || triggerEvent === "BOOKING_RESCHEDULED") {
      req.log.info({ uid, guideId, clerkUserId, triggerEvent }, "cal booking upserted");
    } else if (triggerEvent === "BOOKING_CANCELLED") {
      req.log.info({ uid }, "cal booking cancelled");
    } else {
      req.log.info({ triggerEvent, uid }, "cal webhook ignored (unhandled event)");
    }

    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err, uid, triggerEvent }, "error processing cal webhook");
    res.status(500).json({ error: "Error procesando el webhook" });
  }
});

export default router;
