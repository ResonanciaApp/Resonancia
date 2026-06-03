import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { catalogSessionsTable } from "./catalog-sessions";

/** Rol del archivo de audio dentro de una sesión. */
export const AUDIO_ROLES = ["main", "voice", "ambient", "base", "sound"] as const;
export type AudioRole = (typeof AUDIO_ROLES)[number];

/**
 * Metadato de cada archivo de audio del catálogo (para uso futuro: panel de
 * creador, migración a Bunny.net, validación de tamaño/duración).
 *
 * Hoy los archivos siguen bundleados en la app (resueltos por id en
 * config/audio-map.ts); aquí registramos su metadata: assetKey (nombre del
 * archivo bundleado), url (remota, futura), nombre, tipo, tamaño, duración,
 * si hace loop, quién lo subió y cuándo.
 */
export const catalogAudioFilesTable = pgTable("catalog_audio_files", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").references(() => catalogSessionsTable.id, {
    onDelete: "cascade",
  }),
  role: text("role", { enum: AUDIO_ROLES }).notNull().default("main"),
  assetKey: text("asset_key"),
  url: text("url"),
  name: text("name").notNull(),
  contentType: text("content_type"),
  sizeBytes: integer("size_bytes"),
  durationSeconds: integer("duration_seconds"),
  isLoop: boolean("is_loop").notNull().default(false),
  uploadedBy: integer("uploaded_by").references(() => usersTable.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertCatalogAudioFileSchema = createInsertSchema(catalogAudioFilesTable).omit({
  id: true,
  createdAt: true,
});
export type InsertCatalogAudioFile = z.infer<typeof insertCatalogAudioFileSchema>;
export type CatalogAudioFile = typeof catalogAudioFilesTable.$inferSelect;
