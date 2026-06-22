import {
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const LIVE_SESSION_STATUS = [
  "pending",
  "confirmed",
  "cancelled",
  "completed",
] as const;
export type LiveSessionStatus = (typeof LIVE_SESSION_STATUS)[number];

/**
 * Reservas de sesiones en vivo con guiadores.
 * Se crean / actualizan automáticamente desde el webhook de Cal.com.
 * `clerkUserId` es el ID de Clerk del asistente (puede ser null si el usuario
 * reservó sin cuenta — se vincula en el webhook por email).
 */
export const liveSessionsTable = pgTable("live_sessions", {
  id: serial("id").primaryKey(),
  /** ID de usuario de Clerk. Nulo si aún no está vinculado. */
  clerkUserId: text("clerk_user_id"),
  /** Slug del guiador (ej. "sofia-ramirez"). */
  guideId: text("guide_id").notNull(),
  /** UID único del evento en Cal.com (usado para upsert en webhook). */
  calEventUid: text("cal_event_uid").notNull().unique(),
  /** Nombre legible del evento de Cal.com. */
  calEventTitle: text("cal_event_title"),
  /** Fecha/hora de la sesión (inicio). */
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(),
  /** Fecha/hora de fin de la sesión. */
  scheduledEnd: timestamp("scheduled_end", { withTimezone: true }),
  status: text("status", { enum: LIVE_SESSION_STATUS })
    .notNull()
    .default("confirmed"),
  /** URL de la sala de Daily.co (disponible cuando status = confirmed). */
  dailyRoomUrl: text("daily_room_url"),
  /** Nombre del asistente (tal como lo ingresó en Cal.com). */
  attendeeName: text("attendee_name"),
  /** Email del asistente. */
  attendeeEmail: text("attendee_email"),
  /** Nombre del guiador para mostrar en la app sin join adicional. */
  guideDisplayName: text("guide_display_name"),
  /** Link de Cal.com del guiador al momento de la reserva (snapshot). */
  calLink: text("cal_link"),
  /** Notas adicionales del asistente enviadas en la reserva. */
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertLiveSessionSchema = createInsertSchema(liveSessionsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertLiveSession = z.infer<typeof insertLiveSessionSchema>;
export type LiveSession = typeof liveSessionsTable.$inferSelect;
