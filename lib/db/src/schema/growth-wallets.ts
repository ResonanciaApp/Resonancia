import { pgTable, text, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { usersTable } from "./users";
import type { GrowthStageRecord } from "./growth-catalog";
export const growthWalletsTable = pgTable("growth_wallets", {
  userId: integer("user_id").primaryKey().references(() => usersTable.id, { onDelete: "cascade" }),
  maxDays: integer("max_days").notNull().default(0),
  reached: jsonb("reached").$type<GrowthStageRecord[]>().notNull().default([]),
});
export const insertGrowthWalletSchema = createInsertSchema(growthWalletsTable);
