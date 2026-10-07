export type PushRouteData = Record<string, unknown>;

/**
 * Resolves the destination for a tapped push notification without depending
 * on React Native or Expo. Older producers used `kind`, while system
 * notifications may use `type`.
 */
export function routeForPushData(data: PushRouteData | undefined): string | undefined {
  if (!data) return undefined;

  const eventType =
    typeof data.kind === "string"
      ? data.kind
      : typeof data.type === "string"
        ? data.type
        : undefined;

  if (eventType === "session_published") {
    const sessionId =
      typeof data.sessionId === "string"
        ? data.sessionId
        : typeof data.entityKey === "string"
          ? data.entityKey
          : undefined;
    return sessionId
      ? `/session/${encodeURIComponent(sessionId)}`
      : "/nuevas-sesiones";
  }

  if (eventType === "dm" && typeof data.fromUserId === "number") {
    return `/chat/${data.fromUserId}`;
  }
  if (eventType === "vibration" && typeof data.fromUserId === "number"
    && Number.isSafeInteger(data.fromUserId) && data.fromUserId > 0) {
    return `/usuario/${data.fromUserId}`;
  }
  if (eventType === "friend_request" || eventType === "friend_accepted") {
    return "/amigos";
  }
  if (eventType === "practice_reminder") {
    return "/notificaciones-practica";
  }

  return undefined;
}