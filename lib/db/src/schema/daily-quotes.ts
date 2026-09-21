import { sql } from "drizzle-orm";
import { boolean, check, date, index, integer, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const dailyQuotesTable = pgTable("daily_quotes", {
  id: uuid("id").primaryKey().defaultRandom(),
  seedKey: text("seed_key"),
  text: text("text").notNull(),
  author: text("author").notNull(),
  active: boolean("active").notNull().default(true),
  deleted: boolean("deleted").notNull().default(false),
  revision: integer("revision").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  check("daily_quotes_text_check", sql`length(btrim(${t.text})) between 1 and 1000`),
  check("daily_quotes_author_check", sql`length(btrim(${t.author})) between 1 and 120`),
  check("daily_quotes_revision_check", sql`${t.revision} > 0`),
  index("daily_quotes_active_idx").on(t.active, t.deleted),
  uniqueIndex("daily_quotes_seed_key_unique").on(t.seedKey),
]);

export const dailyQuoteAssignmentsTable = pgTable("daily_quote_assignments", {
  date: date("date", { mode: "string" }).primaryKey(),
  quoteId: uuid("quote_id").references(() => dailyQuotesTable.id, { onDelete: "set null" }),
  text: text("text").notNull(),
  author: text("author").notNull(),
  cycle: integer("cycle").notNull().default(1),
  assignedAt: timestamp("assigned_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("daily_quote_assignments_quote_idx").on(t.quoteId),
  check("daily_quote_assignments_text_check", sql`length(btrim(${t.text})) between 1 and 1000`),
  check("daily_quote_assignments_author_check", sql`length(btrim(${t.author})) between 1 and 120`),
  check("daily_quote_assignments_cycle_check", sql`${t.cycle} > 0`),
]);

export const dailyQuoteSettingsTable = pgTable("daily_quote_settings", {
  id: integer("id").primaryKey(),
  paletteId: text("palette_id").notNull().default("jade"),
  revision: integer("revision").notNull().default(1),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  check("daily_quote_settings_id_check", sql`${t.id} = 1`),
  check("daily_quote_settings_palette_check", sql`${t.paletteId} in ('jade', 'violet', 'ocean', 'ruby', 'amber', 'original')`),
  check("daily_quote_settings_revision_check", sql`${t.revision} > 0`),
]);

export const insertDailyQuoteSchema = createInsertSchema(dailyQuotesTable).omit({
  id: true, createdAt: true, updatedAt: true,
});
export type DailyQuote = typeof dailyQuotesTable.$inferSelect;
export type InsertDailyQuote = z.infer<typeof insertDailyQuoteSchema>;
export type DailyQuoteAssignment = typeof dailyQuoteAssignmentsTable.$inferSelect;
export type DailyQuoteSettings = typeof dailyQuoteSettingsTable.$inferSelect;