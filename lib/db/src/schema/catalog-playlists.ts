import {
  pgTable,
  pgEnum,
  text,
  integer,
  boolean,
  serial,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

/**
 * Playlists editoriales de Resonancia.
 *
 * `slug` es el ID estable usado por la app mobile (ej. "para-la-ansiedad").
 * `sessionIds` es el contenido de la playlist, en el orden de reproducción.
 * Las ubicaciones editoriales viven en `catalog_playlist_placements` para que
 * cada superficie pueda publicarse y ordenarse de forma independiente.
 *
 * `playlistType` se conserva por compatibilidad con el catálogo legado; las
 * playlists editoriales nuevas pueden contener sesiones de cualquier categoría.
 */
export const editorialPlaylistTypeEnum = pgEnum("editorial_playlist_type", [
  "meditative",
  "relaxation",
  "ritual",
  "none",
]);

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
  editorialType: editorialPlaylistTypeEnum("editorial_type").notNull().default("meditative"),
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
