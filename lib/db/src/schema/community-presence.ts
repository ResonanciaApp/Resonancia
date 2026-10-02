import { pgTable, integer, text, timestamp, primaryKey, index } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { sql } from "drizzle-orm";

/** One foreground lease per login/device. Closed leases cannot be revived. */
export const communityPresenceTable = pgTable("community_presence", {
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  sessionId: text("session_id").notNull(),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull().defaultNow(),
  closedAt: timestamp("closed_at", { withTimezone: true }),
}, (table) => [
  primaryKey({ columns: [table.userId, table.sessionId] }),
  index("community_presence_active_idx").on(table.lastSeenAt).where(sql`${table.closedAt} IS NULL`),
]);