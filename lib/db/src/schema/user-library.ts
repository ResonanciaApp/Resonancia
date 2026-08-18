import {
  pgTable,
  integer,
  jsonb,
  timestamp,
} from "drizzle-orm/pg-core";
import { usersTable } from "./users";

/**
 * Snapshot de la biblioteca personal del usuario:
 * carpetas, playlists, carpetas de favoritos y favoritos fijados.
 * Almacenado como JSONB para permitir evolución del schema sin migraciones
 * relacionales complejas. Una fila por usuario (userId = PK).
 */
export const userLibraryTable = pgTable("user_library", {
  userId: integer("user_id")
    .primaryKey()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  folders: jsonb("folders").notNull().default([]),
  playlists: jsonb("playlists").notNull().default([]),
  favFolders: jsonb("fav_folders").notNull().default([]),
  pinnedFavoriteIds: jsonb("pinned_favorite_ids").notNull().default([]),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type UserLibrary = typeof userLibraryTable.$inferSelect;
