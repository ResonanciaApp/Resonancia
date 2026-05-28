import { inArray } from "drizzle-orm";
import { db, pushTokensTable, type PushToken } from "@workspace/db";
import { logger } from "./logger";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

export type PushPayload = {
  title: string;
  body: string;
  data?: Record<string, unknown>;
};

type ExpoTicket = {
  status: "ok" | "error";
  id?: string;
  message?: string;
  details?: { error?: string };
};

/**
 * Send a push notification to all registered devices of the given users.
 * Uses Expo Push API. Fire-and-forget from callers: errors are logged
 * but never thrown so we don't break the originating request.
 */
export async function sendPushToUsers(
  userIds: number[],
  payload: PushPayload,
): Promise<void> {
  if (userIds.length === 0) return;
  try {
    const tokens = await db
      .select()
      .from(pushTokensTable)
      .where(inArray(pushTokensTable.userId, userIds));
    if (tokens.length === 0) return;
    await sendExpoPush(tokens, payload);
  } catch (err) {
    logger.error({ err, userIds }, "sendPushToUsers failed");
  }
}

async function sendExpoPush(tokens: PushToken[], payload: PushPayload) {
  const messages = tokens.map((t) => ({
    to: t.token,
    sound: "default" as const,
    title: payload.title,
    body: payload.body,
    data: payload.data ?? {},
    channelId: "default",
  }));

  // Expo accepts up to 100 per request — chunk to be safe.
  const chunks: (typeof messages)[] = [];
  for (let i = 0; i < messages.length; i += 100) {
    chunks.push(messages.slice(i, i + 100));
  }

  for (const chunk of chunks) {
    let res: Response;
    try {
      res = await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Accept-Encoding": "gzip, deflate",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(chunk),
      });
    } catch (err) {
      logger.error({ err }, "Expo push request failed");
      continue;
    }
    if (!res.ok) {
      logger.warn({ status: res.status }, "Expo push non-OK response");
      continue;
    }
    const json = (await res.json().catch(() => null)) as
      | { data?: ExpoTicket[] }
      | null;
    if (!json?.data) continue;
    await pruneInvalidTokens(chunk, json.data);
  }
}

async function pruneInvalidTokens(
  chunk: { to: string }[],
  tickets: ExpoTicket[],
) {
  const invalid: string[] = [];
  tickets.forEach((t, i) => {
    if (t.status === "error" && t.details?.error === "DeviceNotRegistered") {
      const token = chunk[i]?.to;
      if (token) invalid.push(token);
    }
  });
  if (invalid.length === 0) return;
  try {
    await db.delete(pushTokensTable).where(inArray(pushTokensTable.token, invalid));
  } catch (err) {
    logger.warn({ err }, "Failed to prune invalid push tokens");
  }
}
