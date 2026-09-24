import { boolean, integer, pgTable, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const reflectionCategoriesTable = pgTable("reflection_categories", {
  id: text("id").primaryKey(),
  label: text("label").notNull(),
  icon: text("icon").notNull(),
  iconFamily: text("icon_family").notNull(),
  color: text("color").notNull(),
  sortOrder: integer("sort_order").notNull(),
  active: boolean("active").notNull().default(true),
});

export const insertReflectionCategorySchema = createInsertSchema(reflectionCategoriesTable);
export type ReflectionCategoryRow = typeof reflectionCategoriesTable.$inferSelect;
export type InsertReflectionCategory = z.infer<typeof insertReflectionCategorySchema>;

// Keep identifiers and the visible order of existing tabs; understanding is a
// historical category which was not a selectable tab before this feature.
export const INITIAL_REFLECTION_CATEGORIES: ReflectionCategoryRow[] = [
  { id: "gratitude", label: "Gratitud", icon: "cards-heart", iconFamily: "MaterialCommunityIcons", color: "#F075B3", sortOrder: 0, active: true },
  { id: "purpose", label: "Propósito", icon: "sprout", iconFamily: "MaterialCommunityIcons", color: "#5FCA81", sortOrder: 1, active: true },
  { id: "acceptance", label: "Aceptación", icon: "triangle", iconFamily: "Feather", color: "#5FA1CA", sortOrder: 2, active: true },
  { id: "calm", label: "Calma", icon: "flower-tulip", iconFamily: "MaterialCommunityIcons", color: "#B875F0", sortOrder: 3, active: true },
  { id: "clarity", label: "Claridad", icon: "white-balance-sunny", iconFamily: "MaterialCommunityIcons", color: "#F2C94C", sortOrder: 4, active: true },
  { id: "understanding", label: "Entendimiento", icon: "brain", iconFamily: "MaterialCommunityIcons", color: "#8B95EE", sortOrder: 5, active: false },
];