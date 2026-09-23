import { db } from "@workspace/db";
import {
  notificationsTable,
  notificationPreferencesTable,
  type CatalogSession,
} from "@workspace/db";
import { sendPushToUsers } from "./push";
import { getPublicationNotificationMatch } from "./publication-notification-matching";

export { getPublicationNotificationMatch } from "./publication-notification-matching";

/**
 * Creates the durable inbox rows first, then sends push as a best-effort hint.
 * The unique (user_id, session_id) constraint makes retries safe.
 */
type DatabaseTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export type PublicationPushGroup = {
  message: string;
  userIds: number[];
};

export async function insertPublishedSessionNotifications(
  tx: DatabaseTransaction,
  session: CatalogSession,
): Promise<PublicationPushGroup[]> {
  const preferences = await tx.select().from(notificationPreferencesTable);
  const rows = preferences.flatMap((preference) => {
    const match = getPublicationNotificationMatch(session, preference);
    if (!match) return [];
    return [{
      userId: preference.userId,
      actorUserId: null,
      type: "session_published" as const,
      sessionId: session.id,
      entityId: null,
      message: match.message,
    }];
  });
  if (rows.length === 0) return [];

  const inserted = await tx.insert(notificationsTable).values(rows)
    .onConflictDoNothing()
    .returning({ userId: notificationsTable.userId, message: notificationsTable.message });
  const recipientsByMessage = new Map<string, number[]>();
  for (const recipient of inserted) {
    if (!recipient.message) continue;
    const recipients = recipientsByMessage.get(recipient.message) ?? [];
    recipients.push(recipient.userId);
    recipientsByMessage.set(recipient.message, recipients);
  }
  return [...recipientsByMessage].map(([message, userIds]) => ({
    message,
    userIds: [...new Set(userIds)],
  }));
}

export async function sendPublishedSessionPushes(
  sessionId: string,
  groups: PublicationPushGroup[],
) {
  for (const { message, userIds } of groups) {
    await sendPushToUsers([...new Set(userIds)], {
      title: "Nueva sesión disponible",
      body: message,
      data: { kind: "session_published", type: "session_published", sessionId },
    });
  }
}