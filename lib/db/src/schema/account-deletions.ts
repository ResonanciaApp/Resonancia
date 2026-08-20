import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const ACCOUNT_DELETION_STATUSES = [
  "pending",
  "database_deleted",
  "storage_deleted",
  "awaiting_storage_expiry",
  "completed",
] as const;

/**
 * Durable, pseudonymous tombstone for an account deletion.
 *
 * The raw Clerk id and email are deliberately not retained. The identity hash
 * lets the API block stale sessions and resume an interrupted deletion without
 * recreating the user row.
 */
export const accountDeletionsTable = pgTable("account_deletions", {
  identityHash: text("identity_hash").primaryKey(),
  status: text("status", { enum: ACCOUNT_DELETION_STATUSES })
    .notNull()
    .default("pending"),
  objectPaths: text("object_paths").array().notNull().default([]),
  liveSessionUids: text("live_session_uids").array().notNull().default([]),
  storageCleanupAfter: timestamp("storage_cleanup_after", { withTimezone: true }),
  requestedAt: timestamp("requested_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export type AccountDeletion = typeof accountDeletionsTable.$inferSelect;