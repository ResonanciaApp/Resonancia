import { pgTable, integer, text, timestamp } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const notificationPreferencesTable = pgTable("notification_preferences", {
  userId: integer("user_id")
    .primaryKey()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  selectedCategoryIds: text("selected_category_ids").array().notNull().default(sql`ARRAY[]::text[]`),
  selectedEditorialTags: text("selected_editorial_tags").array().notNull().default(sql`ARRAY[]::text[]`),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertNotificationPreferencesSchema = createInsertSchema(
  notificationPreferencesTable,
).omit({ updatedAt: true });
export type InsertNotificationPreferences = z.infer<typeof insertNotificationPreferencesSchema>;
export type NotificationPreferences = typeof notificationPreferencesTable.$inferSelect;