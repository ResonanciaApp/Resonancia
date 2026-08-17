import {
  pgTable,
  serial,
  integer,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { usersTable } from "./users";

/** Hitos (logros) conseguidos por el usuario. Log append-only: se sincroniza
 *  por unión (como los eventos de reproducción); nunca se borra un hito. */
export const userMilestonesTable = pgTable(
  "user_milestones",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    milestoneId: text("milestone_id").notNull(),
    unlockedAt: timestamp("unlocked_at", { withTimezone: true }).notNull(),
  },
  (table) => ({
    uniqueMilestone: uniqueIndex("user_milestones_user_milestone_idx").on(
      table.userId,
      table.milestoneId,
    ),
  }),
);

export type UserMilestone = typeof userMilestonesTable.$inferSelect;
