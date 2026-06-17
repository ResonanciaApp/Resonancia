import {
  pgTable,
  text,
  boolean,
  integer,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const MIXER_SOUND_CATEGORIES = [
  "animales",
  "bosque",
  "mar",
  "fuego",
  "desierto",
  "cuencos_tibetanos",
  "cuencos_cuarzo",
  "gongs",
  "campanas_viento",
  "vientos",
  "cantos",
  "percusion",
  "mantras",
  "solfeggio",
  "ruidos",
  "frecuencias",
  "asmr",
  "bpm",
  "binaural",
] as const;

export type MixerSoundCategory = (typeof MIXER_SOUND_CATEGORIES)[number];

export const mixerSoundsTable = pgTable("mixer_sounds", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  categoryId: text("category_id").notNull(),
  iconName: text("icon_name").notNull().default("music"),
  iconSet: text("icon_set").notNull().default("feather"),
  isPremium: boolean("is_premium").notNull().default(false),
  objectPath: text("object_path"),
  thumbnailObjectPath: text("thumbnail_object_path"),
  tags: jsonb("tags").$type<string[]>(),
  bpm: integer("bpm"),
  loopBars: integer("loop_bars"),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertMixerSoundSchema = createInsertSchema(mixerSoundsTable, {
  id: z.string().min(1).regex(/^[a-z0-9_-]+$/),
  name: z.string().min(1),
  categoryId: z.enum(MIXER_SOUND_CATEGORIES),
  iconName: z.string().min(1),
  iconSet: z.enum(["feather", "ionicons"]),
  tags: z.array(z.string()).optional(),
});

export const updateMixerSoundSchema = createSelectSchema(mixerSoundsTable, {
  categoryId: z.enum(MIXER_SOUND_CATEGORIES),
  iconSet: z.enum(["feather", "ionicons"]),
  tags: z.array(z.string()).optional().nullable(),
})
  .omit({ id: true, createdAt: true, updatedAt: true })
  .partial();

export type MixerSound = typeof mixerSoundsTable.$inferSelect;
export type InsertMixerSound = z.infer<typeof insertMixerSoundSchema>;
export type UpdateMixerSound = z.infer<typeof updateMixerSoundSchema>;
