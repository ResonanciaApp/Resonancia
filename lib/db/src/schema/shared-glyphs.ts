import {
  boolean,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export type GlyphMaster = {
  opacity: number;
  motion: boolean;
  glow: number;
  bgColor: string | null;
  bgGradientId: string | null;
  bgBrightness: number;
};

/**
 * Receta visual de una composición Geometrix: capas activas + ajustes por capa
 * + master. Se almacena como JSONB y es suficiente para re-dibujar la
 * composición en cualquier dispositivo sin requerir assets estáticos.
 */
export type GlyphRecipe = {
  active: string[];
  master: GlyphMaster;
  settings: Record<string, unknown>;
  soloId?: string | null;
};

export const sharedGlyphsTable = pgTable("shared_glyphs", {
  id: serial("id").primaryKey(),
  authorId: integer("author_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  recipe: jsonb("recipe").$type<GlyphRecipe>().notNull(),
  likes: integer("likes").default(0).notNull(),
  hidden: boolean("hidden").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

const glyphMasterSchema = z.object({
  opacity: z.number().min(0).max(1),
  motion: z.boolean(),
  glow: z.number().min(0).max(1),
  bgColor: z.string().nullable(),
  bgGradientId: z.string().nullable(),
  bgBrightness: z.number().min(0).max(1),
});

const glyphRecipeSchema = z.object({
  active: z.array(z.string().min(1).max(40)).min(1).max(20),
  master: glyphMasterSchema,
  settings: z.record(z.string(), z.unknown()),
  soloId: z.string().nullable().optional(),
});

export const insertSharedGlyphSchema = createInsertSchema(sharedGlyphsTable)
  .omit({ id: true, authorId: true, likes: true, hidden: true, createdAt: true })
  .extend({
    name: z.string().min(1).max(40),
    description: z.string().max(120).optional(),
    recipe: glyphRecipeSchema,
  });

export type InsertSharedGlyph = z.infer<typeof insertSharedGlyphSchema>;
export type SharedGlyph = typeof sharedGlyphsTable.$inferSelect;
