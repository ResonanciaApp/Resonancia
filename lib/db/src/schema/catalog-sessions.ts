import {
  pgTable,
  text,
  integer,
  boolean,
  jsonb,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

/** Estados de publicación de una pieza del catálogo. */
export const CATALOG_STATUS = ["draft", "pending", "published", "rejected"] as const;
export type CatalogStatus = (typeof CATALOG_STATUS)[number];

export type SessionGuest = { name: string; role: string; instagram?: string };

/**
 * Sesiones del catálogo (la unidad reproducible de la app).
 * El `id` es el identificador estable existente (ej. "1".."40"), NO un serial,
 * para preservar todas las referencias (favoritos, progreso, mapeos de audio).
 *
 * Las etiquetas (soundTag, meditationTag, etc.) se guardan como texto libre:
 * la validación de los valores permitidos vive en la app (uniones TS) y en el
 * futuro panel de creador. Las imágenes/audios siguen bundleados en la app y se
 * resuelven por id; aquí guardamos solo claves/metadata (imageKey/imageUrl).
 */
export const catalogSessionsTable = pgTable("catalog_sessions", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  subtitle: text("subtitle").notNull(),
  categoryId: text("category_id").notNull(),
  categoryLabel: text("category_label").notNull(),
  duration: integer("duration").notNull(),
  durationLabel: text("duration_label").notNull(),
  description: text("description").notNull(),
  benefits: text("benefits").array().notNull().default([]),
  instruments: text("instruments").array().notNull().default([]),
  imageKey: text("image_key"),
  imageUrl: text("image_url"),
  isFeatured: boolean("is_featured").notNull().default(false),
  isNew: boolean("is_new").notNull().default(false),
  isPremium: boolean("is_premium").notNull().default(false),
  frequency: text("frequency"),
  soundTag: text("sound_tag"),
  meditationTag: text("meditation_tag"),
  ancestralTag: text("ancestral_tag"),
  sabiduriaTag: text("sabiduria_tag"),
  podcastTag: text("podcast_tag"),
  sonidosTag: text("sonidos_tag"),
  themeTag: text("theme_tag").array(),
  sleepTag: text("sleep_tag"),
  guideId: text("guide_id"),
  artistId: text("artist_id"),
  guests: jsonb("guests").$type<SessionGuest[]>(),
  status: text("status", { enum: CATALOG_STATUS }).notNull().default("published"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdBy: integer("created_by").references(() => usersTable.id, {
    onDelete: "set null",
  }),
  /** Motivo de rechazo (solo cuando status = "rejected"). */
  rejectionReason: text("rejection_reason"),
  /** Admin que aprobó/rechazó la pieza (trail de revisión). */
  reviewedBy: integer("reviewed_by").references(() => usersTable.id, {
    onDelete: "set null",
  }),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertCatalogSessionSchema = createInsertSchema(catalogSessionsTable).omit({
  createdAt: true,
  updatedAt: true,
});
export type InsertCatalogSession = z.infer<typeof insertCatalogSessionSchema>;
export type CatalogSession = typeof catalogSessionsTable.$inferSelect;
