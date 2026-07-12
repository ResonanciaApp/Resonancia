import {
  boolean,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createUpdateSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

/**
 * Escenas animadas — composiciones Geometrix curadas por el admin que se
 * muestran como fondo animado (por ejemplo en Inicio 8). Cada escena es
 * una receta visual completa (misma forma que GeometrixCreation/GlyphRecipe).
 */
export const sceneAnimationsTable = pgTable("scene_animations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  /** Receta visual — capas activas, ajustes por capa y master. */
  recipe: jsonb("recipe").$type<Record<string, unknown>>().notNull(),
  /** Si true, se muestra en la app. */
  isActive: boolean("is_active").notNull().default(false),
  /** Si true, solo usuarios premium. */
  isPremium: boolean("is_premium").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  /** Usuario que subió la escena desde la app (puede ser null si creada desde el panel). */
  submittedBy: integer("submitted_by").references(() => usersTable.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertSceneAnimationSchema = createInsertSchema(
  sceneAnimationsTable,
).omit({ id: true, submittedBy: true, createdAt: true, updatedAt: true });

export const updateSceneAnimationSchema = createUpdateSchema(
  sceneAnimationsTable,
).omit({ id: true, submittedBy: true, createdAt: true, updatedAt: true });

export type SceneAnimation = typeof sceneAnimationsTable.$inferSelect;
export type InsertSceneAnimation = typeof sceneAnimationsTable.$inferInsert;

export const CreateSceneAnimationSchema = z.object({
  name: z.string().min(1).max(80),
  description: z.string().max(300).optional().nullable(),
  recipe: z.record(z.string(), z.unknown()),
  isActive: z.boolean().optional(),
  isPremium: z.boolean().optional(),
  sortOrder: z.int().min(0).optional(),
});

export const UpdateSceneAnimationSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  description: z.string().max(300).optional().nullable(),
  recipe: z.record(z.string(), z.unknown()).optional(),
  isActive: z.boolean().optional(),
  isPremium: z.boolean().optional(),
  sortOrder: z.int().min(0).optional(),
});

export type CreateSceneAnimation = z.infer<typeof CreateSceneAnimationSchema>;
export type UpdateSceneAnimation = z.infer<typeof UpdateSceneAnimationSchema>;
