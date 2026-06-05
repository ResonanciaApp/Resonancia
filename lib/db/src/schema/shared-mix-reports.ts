import {
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { sharedMixesTable } from "./shared-mixes";

export const SHARED_MIX_REPORT_REASONS = [
  "spam",
  "inapropiado",
  "ofensivo",
  "otro",
] as const;
export type SharedMixReportReason = (typeof SHARED_MIX_REPORT_REASONS)[number];

export const sharedMixReportsTable = pgTable(
  "shared_mix_reports",
  {
    id: serial("id").primaryKey(),
    mixId: integer("mix_id")
      .notNull()
      .references(() => sharedMixesTable.id, { onDelete: "cascade" }),
    reporterId: integer("reporter_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    reason: text("reason").$type<SharedMixReportReason>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    uniquePair: uniqueIndex("shared_mix_reports_pair_idx").on(
      table.mixId,
      table.reporterId,
    ),
  }),
);

export const insertSharedMixReportSchema = createInsertSchema(sharedMixReportsTable)
  .omit({ id: true, reporterId: true, createdAt: true })
  .extend({
    reason: z.enum(SHARED_MIX_REPORT_REASONS),
  });

export type InsertSharedMixReport = z.infer<typeof insertSharedMixReportSchema>;
export type SharedMixReport = typeof sharedMixReportsTable.$inferSelect;
