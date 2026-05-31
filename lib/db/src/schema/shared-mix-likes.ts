import {
  integer,
  pgTable,
  serial,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { sharedMixesTable } from "./shared-mixes";

export const sharedMixLikesTable = pgTable(
  "shared_mix_likes",
  {
    id: serial("id").primaryKey(),
    mixId: integer("mix_id")
      .notNull()
      .references(() => sharedMixesTable.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    uniquePair: uniqueIndex("shared_mix_likes_pair_idx").on(table.mixId, table.userId),
  }),
);

export type SharedMixLike = typeof sharedMixLikesTable.$inferSelect;
