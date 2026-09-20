import { sql } from "drizzle-orm";
import { boolean, check, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const greetingSettingsTable = pgTable("greeting_settings", {
  id: integer("id").primaryKey(),
  enabled: boolean("enabled").notNull().default(false),
  text: text("text"),
  revision: integer("revision").notNull().default(1),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  check("greeting_settings_id_check", sql`${t.id} = 1`),
  check("greeting_settings_revision_check", sql`${t.revision} > 0`),
  check("greeting_settings_text_length_check", sql`${t.text} IS NULL OR length(${t.text}) <= 160`),
  check("greeting_settings_enabled_text_check", sql`NOT ${t.enabled} OR (${t.text} IS NOT NULL AND length(btrim(${t.text})) > 0)`),
]);

export const insertGreetingSettingsSchema = createInsertSchema(greetingSettingsTable);
export type InsertGreetingSettings = z.infer<typeof insertGreetingSettingsSchema>;
export type GreetingSettings = typeof greetingSettingsTable.$inferSelect;