import { Router, type IRouter } from "express";
import { createHmac, timingSafeEqual } from "node:crypto";
import { and, asc, eq, gt } from "drizzle-orm";
import {
  db,
  liveSessionsTable,
  guideConfigsTable,
} from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

/** Verifica la firma HMAC-SHA256 del webhook de Cal.com. */
function verifyCalSignature(
  rawBody: string,
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

// GET /live/guides — guiadores con sesiones en vivo habilitadas (público).
router.get("/live/guides", async (req, res) => {
  try {
    const rows = await db
      .select()
      .from(guideConfigsTable)
      .where(eq(guideConfigsTable.isLiveEnabled, true))
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
// Cal.com envía el HMAC-SHA256 del body en el header X-Cal-Signature-256.
router.post("/live/webhook/cal", async (req, res) => {
  const secret = process.env["CAL_WEBHOOK_SECRET"];
  if (!secret) {
    req.log.error("CAL_WEBHOOK_SECRET is not set — rejecting webhook");
    res.status(500).json({ error: "Webhook secret not configured" });
    return;
  }

  const rawBody = JSON.stringify(req.body);
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

  // guideId: buscamos en la metadata o lo derivamos del eventTypeSlug
  const eventTypeId = booking["eventTypeId"] as number | undefined;
  const organizer = booking["organizer"] as Record<string, unknown> | undefined;
  const organizerEmail = organizer?.["email"] as string | undefined;

  // Buscar el guideId en la tabla guide_configs por el calLink que contiene el email/username
  // Por ahora usamos el username del organizador del evento (slug estándar de Cal.com)
  const calUsername = organizer?.["username"] as string | undefined;

  // Buscar en guide_configs cuál guiador tiene este cal username en su calLink
  let guideId = "casa-cuenco";
  let guideDisplayName: string | null = null;
  let dailyRoomUrl: string | null = null;

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
    }
  } catch (err) {
    req.log.warn({ err }, "error resolving guideId from cal webhook");
  }

  try {
    if (triggerEvent === "BOOKING_CREATED" || triggerEvent === "BOOKING_RESCHEDULED") {
      await db
        .insert(liveSessionsTable)
        .values({
          clerkUserId: null,
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
          notes: notes ?? null,
        })
        .onConflictDoUpdate({
          target: liveSessionsTable.calEventUid,
          set: {
            calEventTitle: title ?? null,
            scheduledAt: startTime ? new Date(startTime) : new Date(),
            scheduledEnd: endTime ? new Date(endTime) : null,
            status: "confirmed",
            attendeeName,
            attendeeEmail,
            guideDisplayName,
            notes: notes ?? null,
            updatedAt: new Date(),
          },
        });
      req.log.info({ uid, guideId, triggerEvent }, "cal booking upserted");
    } else if (triggerEvent === "BOOKING_CANCELLED") {
      await db
        .update(liveSessionsTable)
        .set({ status: "cancelled", updatedAt: new Date() })
        .where(eq(liveSessionsTable.calEventUid, uid));
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
