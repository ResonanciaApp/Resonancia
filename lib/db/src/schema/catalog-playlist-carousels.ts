import {
  boolean,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { EDITORIAL_PLAYLIST_SURFACES } from "./catalog-playlist-placements";

/**
 * Editorial playlist carousels.  A carousel is an independently publishable
 * grouping of playlist cards, rather than a playlist's session content.
 */
export const catalogPlaylistCarouselsTable = pgTable(
  "catalog_playlist_carousels",
  {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
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
    unique("catalog_playlist_carousels_surface_order_unique").on(
      table.surface,
      table.sortOrder,
    ),
    index("catalog_playlist_carousels_surface_active_order_idx").on(
      table.surface,
      table.isActive,
      table.sortOrder,
    ),
  ],
);

export const insertCatalogPlaylistCarouselSchema = createInsertSchema(
  catalogPlaylistCarouselsTable,
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertCatalogPlaylistCarousel = z.infer<
  typeof insertCatalogPlaylistCarouselSchema
>;
export type CatalogPlaylistCarousel =
  typeof catalogPlaylistCarouselsTable.$inferSelect;

/**
 * Internal marker used by the guarded development migration. Keeping this in
 * the Drizzle schema prevents schema push from treating the marker as an
 * unmanaged table.
 */
export const catalogPlaylistCarouselMigrationStateTable = pgTable(
  "catalog_playlist_carousel_migration_state",
  {
    migrationKey: text("migration_key").primaryKey(),
    completedAt: timestamp("completed_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
);