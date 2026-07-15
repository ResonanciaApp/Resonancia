import { pgTable, serial, text, boolean, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const exploreSectionsTable = pgTable("explore_sections", {
  id:        serial("id").primaryKey(),
  slug:      text("slug").notNull().unique(),
  label:     text("label").notNull(),
  visible:   boolean("visible").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertExploreSectionSchema = createInsertSchema(exploreSectionsTable).omit({
  id: true, createdAt: true, updatedAt: true,
});
export type InsertExploreSection = z.infer<typeof insertExploreSectionSchema>;
export type ExploreSection = typeof exploreSectionsTable.$inferSelect;
