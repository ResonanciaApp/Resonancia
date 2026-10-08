import { pgTable, text, integer, timestamp, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { usersTable } from "./users";
// No catalog FK: retiring a preset must not refund an already consumed cupo.
export const growthAvatarUnlocksTable = pgTable("growth_avatar_unlocks", {
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  avatarId: text("avatar_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [primaryKey({ columns: [t.userId, t.avatarId] })]);
export const insertGrowthAvatarUnlockSchema = createInsertSchema(growthAvatarUnlocksTable);
