import { sql } from "drizzle-orm";
import { check, integer, jsonb, pgTable, timestamp } from "drizzle-orm/pg-core";

export const journeyInfoSettingsTable = pgTable("journey_info_settings", {
  id: integer("id").primaryKey(),
  content: jsonb("content").$type<{ title: string; description: string }>().notNull(),
  revision: integer("revision").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, table => [
  check("journey_info_settings_id_check", sql`${table.id} = 1`),
  check("journey_info_settings_revision_check", sql`${table.revision} > 0`),
]);
