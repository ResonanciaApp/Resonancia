import {
  pgTable,
  text,
  integer,
  boolean,
  serial,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

/**
 * Playlists curatoriales de Resonancia — aparecen en el home del mobile
 * debajo de "Establece tu intención aquí".
 *
 * `slug` es el ID estable usado por la app mobile (ej. "para-la-ansiedad").
 * `sessionIds` es un array de IDs de sesiones en el orden deseado.
 * `playlistType`:
 *   - "sessions" → mezcla de ancestrales / meditaciones / reflexiones
 *   - "music"    → canciones de la categoría Música
 */
export const catalogPlaylistsTable = pgTable("catalog_playlists", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  coverUrl: text("cover_url"),
  durationLabel: text("duration_label").notNull().default(""),
  savedCount: integer("saved_count").notNull().default(0),
  sessionIds: text("session_ids").array().notNull().default([]),
  playlistType: text("playlist_type").notNull().default("sessions"),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  /** Si true, esta playlist aparece en el home de la app (máx 4). */
  showOnHome: boolean("show_on_home").notNull().default(false),
  /** Posición en el home: 1–4. Null si showOnHome=false. */
  homePosition: integer("home_position"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertCatalogPlaylistSchema = createInsertSchema(catalogPlaylistsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateCatalogPlaylistSchema = insertCatalogPlaylistSchema.partial();

export type InsertCatalogPlaylist = z.infer<typeof insertCatalogPlaylistSchema>;
export type UpdateCatalogPlaylist = z.infer<typeof updateCatalogPlaylistSchema>;
export type CatalogPlaylist = typeof catalogPlaylistsTable.$inferSelect;
