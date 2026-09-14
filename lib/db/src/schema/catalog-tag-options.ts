import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

/**
 * Opciones de etiquetas/subcategorías configurables desde el panel admin.
 * type: "ancestral" | "meditation" | "sound" | "sonidos" | "podcast" |
 *       "sleep" | "theme" | "category_theme_meditaciones" |
 *       "category_theme_sonoterapia" | "category_theme_charlas" |
 *       "category_theme_historias" | "category_theme_ambientales" |
 *       "other_theme" | "tema"
 */
export const catalogTagOptionsTable = pgTable("catalog_tag_options", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  label: text("label").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertCatalogTagOptionSchema = createInsertSchema(catalogTagOptionsTable).omit({ id: true, createdAt: true });
export type InsertCatalogTagOption = z.infer<typeof insertCatalogTagOptionSchema>;
export type CatalogTagOption = typeof catalogTagOptionsTable.$inferSelect;
