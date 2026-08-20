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
  /** Si true, la sesión aparece en la sección "Destacados de [categoría]" dentro de su pantalla de categoría. */
  isFeaturedCategory: boolean("is_featured_category").notNull().default(false),
  /** Si true, esta sesión se muestra como "Destacada de hoy" en la pantalla de inicio (solo una a la vez). */
  isPinnedFeatured: boolean("is_pinned_featured").notNull().default(false),
  isNew: boolean("is_new").notNull().default(false),
  isPremium: boolean("is_premium").notNull().default(false),
  /**
   * Pieza editorial provisional: puede aparecer en el catálogo, pero aún no
   * tiene audio final y el cliente debe mantener Play deshabilitado.
   * Nunca se infiere desde la ausencia de un archivo de audio.
   */
  isPlaceholder: boolean("is_placeholder").notNull().default(false),
  /** Si es true, el tap en la card lanza el reproductor directo (sin pantalla de descripción). */
  skipDetail: boolean("skip_detail").notNull().default(false),
  /** Si es true, el tap en la card empieza a reproducir directo en el miniplayer (sin abrir descripción ni reproductor). */
  skipMiniPlayer: boolean("skip_mini_player").notNull().default(false),
  /** Si es true, la sesión se reproduce en loop infinito (motor gapless, duración infinita). */
  isLoop: boolean("is_loop").notNull().default(false),
  frequency: text("frequency"),
  soundTag: text("sound_tag"),
  meditationTag: text("meditation_tag"),
  ancestralTag: text("ancestral_tag"),
  sabiduriaTag: text("sabiduria_tag"),
  podcastTag: text("podcast_tag"),
  sonidosTag: text("sonidos_tag"),
  /** Subcategoría de Dormir (ej. "Relajaciones", "Historias para dormir"). */
  descansoTag: text("descanso_tag"),
  themeTag: text("theme_tag").array(),
  /** Etiquetas Nivel 2 (Temas): vinculan la sesión a los bloques de "Explorar todo". */
  temaTag: text("tema_tag").array(),
  sleepTag: text("sleep_tag"),
  /** Etiqueta de voz mostrada en las cards ("Guiada" / "Sin voz"). Vacío = sin etiqueta. */
  voiceTag: text("voice_tag"),
  guideId: text("guide_id"),
  artistId: text("artist_id"),
  guests: jsonb("guests").$type<SessionGuest[]>(),
  status: text("status", { enum: CATALOG_STATUS }).notNull().default("published"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdBy: integer("created_by").references(() => usersTable.id, {
    onDelete: "set null",
  }),
  /** Descripción corta que se muestra en el reproductor (distinta de la descripción larga de la sesión). */
  playerDescription: text("player_description"),
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
