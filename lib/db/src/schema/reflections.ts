import { sql } from "drizzle-orm";
import { check, index, integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const REFLECTION_CATEGORIES = [
  "gratitude",
  "understanding",
  "clarity",
  "calm",
  "purpose",
  "acceptance",
] as const;
export type ReflectionCategory = (typeof REFLECTION_CATEGORIES)[number];

export const reflectionsTable = pgTable(
  "reflections",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    category: text("category").notNull(),
    message: text("message").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check("reflections_category_check", sql`${table.category} in ('gratitude', 'understanding', 'clarity', 'calm', 'purpose', 'acceptance')`),
    check("reflections_message_check", sql`length(btrim(${table.message})) between 1 and 300`),
    index("reflections_user_created_id_idx").on(table.userId, table.createdAt, table.id),
  ],
);

export const insertReflectionSchema = createInsertSchema(reflectionsTable).omit({
  id: true, createdAt: true, updatedAt: true,
});
export type Reflection = typeof reflectionsTable.$inferSelect;
export type InsertReflection = z.infer<typeof insertReflectionSchema>;