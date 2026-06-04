import {
  pgTable,
  integer,
  timestamp,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const followsTable = pgTable(
  "follows",
  {
    followerId: integer("follower_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    followingId: integer("following_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    uniquePair: uniqueIndex("follows_pair_idx").on(
      table.followerId,
      table.followingId,
    ),
    followingIdx: index("follows_following_idx").on(table.followingId),
  }),
);

export type Follow = typeof followsTable.$inferSelect;
