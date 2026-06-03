import {
  pgTable,
  serial,
  integer,
  text,
  real,
  boolean,
  timestamp,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const playbackHistoryTable = pgTable(
  "playback_history",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    clientEventId: text("client_event_id").notNull(),
    sessionId: text("session_id").notNull(),
    categoryId: text("category_id").notNull(),
    categoryLabel: text("category_label").notNull(),
    contentType: text("content_type"),
    source: text("source"),
    minutes: real("minutes").notNull().default(0),
    completed: boolean("completed").notNull().default(false),
    playedAt: timestamp("played_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    uniqueEvent: uniqueIndex("playback_history_event_idx").on(
      table.userId,
      table.clientEventId,
    ),
    userPlayedAtIdx: index("playback_history_user_played_at_idx").on(
      table.userId,
      table.playedAt,
    ),
  }),
);

export const insertPlaybackHistorySchema = createInsertSchema(playbackHistoryTable).omit({
  id: true,
  userId: true,
  createdAt: true,
});
export type InsertPlaybackHistory = z.infer<typeof insertPlaybackHistorySchema>;
export type PlaybackHistory = typeof playbackHistoryTable.$inferSelect;
