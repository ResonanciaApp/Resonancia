import {
  pgTable,
  text,
  boolean,
  integer,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const DESCANSO_SOUND_CATEGORIES = [
  "binaural",
  "ambiental",
] as const;

export type DescansoSoundCategoryId = (typeof DESCANSO_SOUND_CATEGORIES)[number];

export const descansoSoundsTable = pgTable("descanso_sounds", {
  id: text("id").primaryKey(),
  label: text("label").notNull(),
  categoryId: text("category_id").notNull(),
  audioObjectPath: text("audio_object_path"),
  thumbnailObjectPath: text("thumbnail_object_path"),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertDescansoSoundSchema = createInsertSchema(descansoSoundsTable, {
  id: z.string().min(1).regex(/^[a-z0-9_-]+$/),
  label: z.string().min(1),
  categoryId: z.enum(DESCANSO_SOUND_CATEGORIES),
});

export const updateDescansoSoundSchema = createSelectSchema(descansoSoundsTable, {
  categoryId: z.enum(DESCANSO_SOUND_CATEGORIES),
})
  .omit({ id: true, createdAt: true, updatedAt: true })
  .partial();

export type DescansoSound = typeof descansoSoundsTable.$inferSelect;
export type InsertDescansoSound = z.infer<typeof insertDescansoSoundSchema>;
export type UpdateDescansoSound = z.infer<typeof updateDescansoSoundSchema>;
