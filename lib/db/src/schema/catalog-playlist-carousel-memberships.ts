import {
  index,
  integer,
  pgTable,
  serial,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { catalogPlaylistCarouselsTable } from "./catalog-playlist-carousels";
import { catalogPlaylistsTable } from "./catalog-playlists";

/**
 * Ordered playlist cards in a carousel.  The same playlist may be included in
 * multiple carousels (including multiple carousels on the same surface), but
 * only once in each individual carousel.
 */
export const catalogPlaylistCarouselMembershipsTable = pgTable(
  "catalog_playlist_carousel_memberships",
  {
    id: serial("id").primaryKey(),
    carouselId: integer("carousel_id")
      .notNull()
      .references(() => catalogPlaylistCarouselsTable.id, { onDelete: "cascade" }),
    playlistId: integer("playlist_id")
      .notNull()
      .references(() => catalogPlaylistsTable.id, { onDelete: "cascade" }),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique("catalog_playlist_carousel_memberships_carousel_playlist_unique").on(
      table.carouselId,
      table.playlistId,
    ),
    unique("catalog_playlist_carousel_memberships_carousel_order_unique").on(
      table.carouselId,
      table.sortOrder,
    ),
    index("catalog_playlist_carousel_memberships_carousel_order_idx").on(
      table.carouselId,
      table.sortOrder,
    ),
  ],
);

export const insertCatalogPlaylistCarouselMembershipSchema = createInsertSchema(
  catalogPlaylistCarouselMembershipsTable,
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertCatalogPlaylistCarouselMembership = z.infer<
  typeof insertCatalogPlaylistCarouselMembershipSchema
>;
export type CatalogPlaylistCarouselMembership =
  typeof catalogPlaylistCarouselMembershipsTable.$inferSelect;