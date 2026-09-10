import {
  boolean,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
  index,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { catalogPlaylistsTable } from "./catalog-playlists";

export const EDITORIAL_PLAYLIST_SURFACES = ["discover", "sleep"] as const;
export type EditorialPlaylistSurface =
  (typeof EDITORIAL_PLAYLIST_SURFACES)[number];

/**
 * Ubicaciones editoriales normalizadas.
 *
 * La unicidad playlist + surface representa el único carrusel fijo que
 * soportamos inicialmente por superficie. `isActive` permite ocultar una
 * ubicación sin quitarla ni modificar el contenido de la playlist. La
 * unicidad surface + sortOrder evita posiciones duplicadas entre playlists;
 * las escrituras administrativas resecuencian los vecinos dentro de una
 * transacción.
 */
export const catalogPlaylistPlacementsTable = pgTable(
  "catalog_playlist_placements",
  {
    id: serial("id").primaryKey(),
    playlistId: integer("playlist_id")
      .notNull()
      .references(() => catalogPlaylistsTable.id, { onDelete: "cascade" }),
    surface: text("surface", {
      enum: EDITORIAL_PLAYLIST_SURFACES,
    }).notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique("catalog_playlist_placements_playlist_surface_unique").on(
      table.playlistId,
      table.surface,
    ),
    unique("catalog_playlist_placements_surface_order_unique").on(
      table.surface,
      table.sortOrder,
    ),
    index("catalog_playlist_placements_surface_active_order_idx").on(
      table.surface,
      table.isActive,
      table.sortOrder,
    ),
  ],
);

export const insertCatalogPlaylistPlacementSchema = createInsertSchema(
  catalogPlaylistPlacementsTable,
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertCatalogPlaylistPlacement = z.infer<
  typeof insertCatalogPlaylistPlacementSchema
>;
export type CatalogPlaylistPlacement =
  typeof catalogPlaylistPlacementsTable.$inferSelect;