import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

/**
 * Postulaciones para unirse al equipo de Resonancia como Resonador o Expansor.
 * Las envían los usuarios desde la app móvil (pantallas resonador-postular /
 * expansor-postular) y las revisa el equipo desde el panel de administración.
 */
export const APPLICATION_TYPES = ["resonador", "expansor"] as const;
export const APPLICATION_STATUSES = [
  "pending",
  "reviewed",
  "accepted",
  "rejected",
] as const;

export const applicationsTable = pgTable("applications", {
  id: serial("id").primaryKey(),
  type: text("type", { enum: APPLICATION_TYPES }).notNull(),
  name: text("name").notNull(),
  /** Ubicación — solo la pide el formulario de Expansor. */
  location: text("location"),
  phone: text("phone").notNull(),
  /** Tipo de aporte / perfil elegido en el dropdown. */
  aporte: text("aporte").notNull(),
  /** Descripción de servicios (opcional). */
  services: text("services"),
  /** objectPath del audio de muestra (solo Resonador, opcional). */
  audioPath: text("audio_path"),
  status: text("status", { enum: APPLICATION_STATUSES })
    .notNull()
    .default("pending"),
  /** Clerk user id de quien postula, si estaba autenticado. */
  userId: text("user_id"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const insertApplicationSchema = createInsertSchema(applicationsTable).omit({
  id: true,
  status: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertApplication = z.infer<typeof insertApplicationSchema>;
export type Application = typeof applicationsTable.$inferSelect;
export type ApplicationType = (typeof APPLICATION_TYPES)[number];
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];
