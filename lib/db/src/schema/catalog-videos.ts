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

export const CATALOG_VIDEO_STATUS = ["published", "draft"] as const;
export type CatalogVideoStatus = (typeof CATALOG_VIDEO_STATUS)[number];

/**
 * Videos del catálogo servidos desde Bunny.net Stream (HLS).
 *
 * `bunnyVideoId` — GUID asignado por Bunny al subir el video.
 *   La URL de reproducción es `https://<CDN_HOSTNAME>/<bunnyVideoId>/playlist.m3u8`
 *
 * `thumbnailObjectPath` — ruta en Object Storage ("/objects/...") del thumbnail.
 *   Se sirve desde `GET /api/storage/objects/<path>`.
 *   Puede ser null si Bunny ya tiene un thumbnail auto-generado.
 */
export const catalogVideosTable = pgTable("catalog_videos", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  subtitle: text("subtitle").notNull().default(""),
  description: text("description").notNull().default(""),
  durationLabel: text("duration_label").notNull().default(""),
  /** GUID del video en Bunny.net Stream */
  bunnyVideoId: text("bunny_video_id").notNull(),
  /** Ruta del thumbnail en Object Storage ("/objects/...") o URL absoluta. Null = usar thumbnail de Bunny. */
  thumbnailObjectPath: text("thumbnail_object_path"),
  author: text("author").notNull().default("Casa del Cuenco"),
  isPremium: boolean("is_premium").notNull().default(false),
  isNew: boolean("is_new").notNull().default(false),
  status: text("status", { enum: CATALOG_VIDEO_STATUS }).notNull().default("published"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertCatalogVideoSchema = createInsertSchema(catalogVideosTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateCatalogVideoSchema = insertCatalogVideoSchema.partial();

export type InsertCatalogVideo = z.infer<typeof insertCatalogVideoSchema>;
export type UpdateCatalogVideo = z.infer<typeof updateCatalogVideoSchema>;
export type CatalogVideo = typeof catalogVideosTable.$inferSelect;
