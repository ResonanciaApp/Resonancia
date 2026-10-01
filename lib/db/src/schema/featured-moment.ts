import { pgTable, integer, text, date, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

/** Persisted singleton state for the globally shared daily featured cycle. */
export const featuredMomentStateTable = pgTable("featured_moment_state", {
  id: integer("id").primaryKey().default(1),
  editorialDate: date("editorial_date", { mode: "string" }),
  automaticSessionId: text("automatic_session_id"),
  automaticExposed: boolean("automatic_exposed").notNull().default(false),
  /** Retained for schema compatibility with the already-applied base migration. */
  automaticPreviousLastId: text("automatic_previous_last_id"),
  manualSessionId: text("manual_session_id"),
  manualDate: date("manual_date", { mode: "string" }),
  manualFromLegacy: boolean("manual_from_legacy").notNull().default(false),
  pendingSessionIds: text("pending_session_ids").array().notNull().default([]),
  knownSessionIds: text("known_session_ids").array().notNull().default([]),
  lastAutomaticSessionId: text("last_automatic_session_id"),
  lastShownSessionId: text("last_shown_session_id"),
  revision: integer("revision").notNull().default(0),
  legacyMigrated: boolean("legacy_migrated").notNull().default(false),
});

export const insertFeaturedMomentStateSchema = createInsertSchema(
  featuredMomentStateTable,
).omit({ id: true });
export type InsertFeaturedMomentState = z.infer<
  typeof insertFeaturedMomentStateSchema
>;
export type FeaturedMomentState = typeof featuredMomentStateTable.$inferSelect;