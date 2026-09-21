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

export const mixerSoundCategoriesTable = pgTable("mixer_sound_categories", {
  id: text("id").primaryKey(),
  label: text("label").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertMixerSoundCategorySchema = createInsertSchema(mixerSoundCategoriesTable, {
  id: z.string().min(1).regex(/^[a-z0-9_-]+$/),
  label: z.string().min(1),
});
export const updateMixerSoundCategorySchema = createSelectSchema(mixerSoundCategoriesTable)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .partial();
export type MixerSoundCategory = typeof mixerSoundCategoriesTable.$inferSelect;
export type InsertMixerSoundCategory = z.infer<typeof insertMixerSoundCategorySchema>;
export type UpdateMixerSoundCategory = z.infer<typeof updateMixerSoundCategorySchema>;

export const mixerSoundsTable = pgTable("mixer_sounds", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  categoryId: text("category_id").notNull().references(() => mixerSoundCategoriesTable.id),
  iconName: text("icon_name").notNull().default("music"),
  iconSet: text("icon_set").notNull().default("feather"),
  isPremium: boolean("is_premium").notNull().default(false),
  showInMeditationBackgrounds: boolean("show_in_meditation_backgrounds").notNull().default(false),
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
  categoryId: z.string().min(1),
  iconName: z.string().min(1),
  iconSet: z.enum(["feather", "ionicons"]),
  tags: z.array(z.string()).optional(),
});

export const updateMixerSoundSchema = createSelectSchema(mixerSoundsTable, {
  categoryId: z.string().min(1),
  iconSet: z.enum(["feather", "ionicons"]),
  tags: z.array(z.string()).optional().nullable(),
})
  .omit({ id: true, createdAt: true, updatedAt: true })
  .partial();

export type MixerSound = typeof mixerSoundsTable.$inferSelect;
export type InsertMixerSound = z.infer<typeof insertMixerSoundSchema>;
export type UpdateMixerSound = z.infer<typeof updateMixerSoundSchema>;
