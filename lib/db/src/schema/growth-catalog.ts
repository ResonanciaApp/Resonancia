import { pgTable, text, integer, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
export type GrowthStageRecord = {
  id: string; group: string; name: string;
  startDay: number; endDay: number; story: string; imageUrl: string;
  detailPhrase?: string; detailDescription?: string;
  rewards: { id: string; enabled: boolean; text: string; amount: number }[];
};
export type GrowthWorldRecord = {
  id: string; name: string; description: string; coverUrl: string;
};
export const growthCatalogTable = pgTable("growth_catalog", {
  id: text("id").primaryKey(),
  revision: integer("revision").notNull().default(1),
  stages: jsonb("stages").$type<GrowthStageRecord[]>().notNull(),
  worlds: jsonb("worlds").$type<GrowthWorldRecord[]>(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
export const insertGrowthCatalogSchema = createInsertSchema(growthCatalogTable);
export type GrowthCatalogRecord = typeof growthCatalogTable.$inferSelect;
