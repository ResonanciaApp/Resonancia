/**
 * Fire-and-forget helper to record a community activity event.
 * Kept in its own module to avoid circular dependencies between
 * community.ts routes and requireAuth middleware.
 */
import { sql } from "drizzle-orm";
import {
  db,
  communityActivityEventsTable,
  type CommunityActivityEventType,
  type CommunityActivityPayload,
} from "@workspace/db";

export async function recordCommunityEvent(
  userId: number,
  eventType: CommunityActivityEventType,
  payload: CommunityActivityPayload = {},
): Promise<void> {
  try {
    const now = new Date();
    await db
      .insert(communityActivityEventsTable)
      .values({ userId, eventType, payload, createdAt: now })
      .onConflictDoUpdate({
        target: [communityActivityEventsTable.userId, communityActivityEventsTable.eventType],
        set: { payload: sql`excluded.payload`, createdAt: now },
      });
  } catch {
    // Fire-and-forget — never interrupt the caller.
  }
}
