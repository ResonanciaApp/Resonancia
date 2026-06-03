import {
  pgTable,
  serial,
  integer,
  text,
  real,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const sessionProgressTable = pgTable(
  "session_progress",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    sessionId: text("session_id").notNull(),
    progress: real("progress").notNull().default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    uniqueProgress: uniqueIndex("session_progress_user_session_idx").on(
      table.userId,
      table.sessionId,
    ),
  }),
);

export const insertSessionProgressSchema = createInsertSchema(sessionProgressTable).omit({
  id: true,
  userId: true,
  updatedAt: true,
});
export type InsertSessionProgress = z.infer<typeof insertSessionProgressSchema>;
export type SessionProgress = typeof sessionProgressTable.$inferSelect;
