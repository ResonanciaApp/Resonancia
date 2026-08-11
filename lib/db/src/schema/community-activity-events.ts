import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const communityActivityEventTypeEnum = pgEnum("community_activity_event_type", [
  "session_play",
  "mixer_active",
  "geometrix_active",
  "mix_shared",
  "glyph_shared",
  "user_joined",
]);

export type CommunityActivityEventType =
  | "session_play"
  | "mixer_active"
  | "geometrix_active"
  | "mix_shared"
  | "glyph_shared"
  | "user_joined";

export type CommunityActivityPayload = {
  sessionId?: string;
  sessionName?: string;
  category?: string;
  mixId?: number;
  mixName?: string;
  glyphId?: number;
  glyphName?: string;
};

/** Live heartbeat + discrete event log for the community activity feed. */
export const communityActivityEventsTable = pgTable(
  "community_activity_events",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    eventType: communityActivityEventTypeEnum("event_type").notNull(),
    payload: jsonb("payload").$type<CommunityActivityPayload>().notNull().default({}),
    /** Timestamp of the most recent heartbeat — only populated for live event types. */
    lastHeartbeatAt: timestamp("last_heartbeat_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    // One live row per user per eventType — enables upsert for heartbeats.
    uniqueUserEvent: uniqueIndex("community_activity_user_event_idx").on(
      table.userId,
      table.eventType,
    ),
    // Fast feed query by recency.
    createdAtIdx: index("community_activity_created_at_idx").on(table.createdAt),
    // Fast lookup of live events by heartbeat time.
    heartbeatIdx: index("community_activity_heartbeat_idx").on(table.lastHeartbeatAt),
  }),
);

export type CommunityActivityEvent = typeof communityActivityEventsTable.$inferSelect;
