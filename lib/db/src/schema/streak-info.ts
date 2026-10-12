import { sql } from "drizzle-orm";
import { check, integer, jsonb, pgTable, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

export const streakInfoSettingsTable = pgTable("streak_info_settings", {
  id: integer("id").primaryKey(),
  content: jsonb("content").$type<Record<string, unknown>>().notNull(),
  revision: integer("revision").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, table => [
  check("streak_info_settings_id_check", sql`${table.id} = 1`),
  check("streak_info_settings_revision_check", sql`${table.revision} > 0`),
]);
export const insertStreakInfoSettingsSchema = createInsertSchema(streakInfoSettingsTable);
export type StreakInfoSettingsRecord = typeof streakInfoSettingsTable.$inferSelect;
