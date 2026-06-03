import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

/**
 * Categorías del catálogo (Ancestrales, Meditaciones, Música, etc.).
 * El `id` es el slug estable usado por la app (ej. "sonidos-ancestrales"),
 * NO un serial, para preservar las referencias existentes.
 */
export const catalogCategoriesTable = pgTable("catalog_categories", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  subtitle: text("subtitle").notNull(),
  icon: text("icon").notNull(),
  iconFamily: text("icon_family"),
  sessionCount: integer("session_count").notNull().default(0),
  color: text("color").notNull(),
  gradientStart: text("gradient_start").notNull(),
  gradientEnd: text("gradient_end").notNull(),
  isPrimary: boolean("is_primary").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertCatalogCategorySchema = createInsertSchema(catalogCategoriesTable).omit({
  createdAt: true,
  updatedAt: true,
});
export type InsertCatalogCategory = z.infer<typeof insertCatalogCategorySchema>;
export type CatalogCategory = typeof catalogCategoriesTable.$inferSelect;
