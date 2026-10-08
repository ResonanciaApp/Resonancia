import { pgTable, text, integer, timestamp, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { usersTable } from "./users";
export const growthGrantsTable = pgTable("growth_grants", {
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  rewardId: text("reward_id").notNull(),
  stageId: text("stage_id").notNull(),
  amount: integer("amount").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [primaryKey({ columns: [t.userId, t.rewardId] })]);
export const insertGrowthGrantSchema = createInsertSchema(growthGrantsTable);
