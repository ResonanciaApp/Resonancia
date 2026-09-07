import {
  date,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

/**
 * Señales de apertura de resultados de búsqueda agregadas por día.
 *
 * No contiene user_id, device_id, IP ni el término original. Las filas se
 * eliminan al salir de la ventana móvil de 30 días.
 */
export const searchTrendBucketsTable = pgTable(
  "search_trend_buckets",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    context: text("context").notNull(),
    normalizedTerm: text("normalized_term").notNull(),
    bucketDay: date("bucket_day", { mode: "string" }).notNull(),
    count: integer("count").notNull().default(0),
    firstOpenedAt: timestamp("first_opened_at", { withTimezone: true }).notNull().defaultNow(),
    lastOpenedAt: timestamp("last_opened_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    contextTermDayUnique: uniqueIndex("search_trend_buckets_context_term_day_idx").on(
      table.context,
      table.normalizedTerm,
      table.bucketDay,
    ),
    windowLookup: index("search_trend_buckets_window_idx").on(
      table.context,
      table.bucketDay,
    ),
  }),
);

export const insertSearchTrendBucketSchema = createInsertSchema(searchTrendBucketsTable);
export type InsertSearchTrendBucket = z.infer<typeof insertSearchTrendBucketSchema>;
export type SearchTrendBucket = typeof searchTrendBucketsTable.$inferSelect;