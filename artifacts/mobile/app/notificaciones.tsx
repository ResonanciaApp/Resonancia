import { Feather } from "@expo/vector-icons";
import { useAuth as useClerkAuth } from "@clerk/expo";
import { useQueryClient } from "@tanstack/react-query";
import {
  getGetNotificationsQueryKey,
  getGetUnreadNotificationCountQueryKey,
  useGetNotifications,
  useMarkAllNotificationsRead,
  type Notification,
} from "@workspace/api-client-react";
import { router } from "expo-router";
import React, { useEffect, useMemo } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SacredBackground } from "@/components/SacredBackground";
import { useColors } from "@/hooks/useColors";

const AVATAR_PALETTE = ["#D4709A", "#8AAAD4", "#E8C87A", "#A8C4A8", "#C8B4E0", "#EDD9B8"];

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] ?? "" : "";
  return (first + last).toUpperCase() || "·";
}

function colorFor(id: number) {
  return AVATAR_PALETTE[Math.abs(id) % AVATAR_PALETTE.length];
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "ahora";
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  return `hace ${d} d`;
}

type FeatherName = React.ComponentProps<typeof Feather>["name"];

function iconFor(type: Notification["type"]): { name: FeatherName; color: string } {
  switch (type) {
    case "friend_request":  return { name: "user-plus",     color: "#8AAAD4" };
    case "friend_accepted": return { name: "user-check",    color: "#A8C4A8" };
    case "dm":              return { name: "message-circle", color: "#C69B4F" };
    case "group_message":   return { name: "users",          color: "#C8B4E0" };
    default:                return { name: "bell",           color: "#EDE1D3" };
  }
}

function messageFor(n: Notification): string {
  switch (n.type) {
    case "friend_request":  return "te envió una solicitud de amistad";
    case "friend_accepted": return "aceptó tu solicitud de amistad";
    case "dm":              return "te envió un mensaje";
    case "group_message":   return "publicó en el grupo";
    default:                return "tiene una novedad";
  }
}

function routeFor(n: Notification): string {
  if (n.type === "dm")            return `/chat/${n.actor.id}`;
  if (n.type === "group_message") return "/grupos";
  return "/amigos";
}

type GroupedNotification = Notification & { groupCount: number; groupHasUnread: boolean };

const MOCK_NOTIFICATIONS: GroupedNotification[] = [
  { id: -1, type: "friend_request",  createdAt: new Date(Date.now() - 2 * 60_000).toISOString(),   readAt: null,  actor: { id: 1, displayName: "Ana García",   username: "ana" },   groupCount: 1, groupHasUnread: true  },
  { id: -2, type: "friend_accepted",  createdAt: new Date(Date.now() - 15 * 60_000).toISOString(),  readAt: null,  actor: { id: 2, displayName: "Carlos López", username: "carlos" }, groupCount: 1, groupHasUnread: false },
  { id: -3, type: "dm",               createdAt: new Date(Date.now() - 60 * 60_000).toISOString(),   readAt: null,  actor: { id: 3, displayName: "María Torres", username: "maria" },  groupCount: 3, groupHasUnread: true  },
  { id: -4, type: "group_message",    createdAt: new Date(Date.now() - 3 * 3600_000).toISOString(), readAt: null,  actor: { id: 4, displayName: "Lucía Ramos",  username: "lucia" },  groupCount: 1, groupHasUnread: true  },
];

// Collapse all `dm` notifications from the same actor into a single row
// (using the most recent one as the representative). Other types stay as-is.
function groupNotifications(list: Notification[]): GroupedNotification[] {
  const out: GroupedNotification[] = [];
  const dmSeen = new Map<number, number>(); // actorId -> index into `out`
  for (const n of list) {
    if (n.type === "dm") {
      const existingIdx = dmSeen.get(n.actor.id);
      if (existingIdx != null) {
        const existing = out[existingIdx];
        existing.groupCount += 1;
        if (!n.readAt) existing.groupHasUnread = true;
        // Keep the newest as representative (list is newest-first, so first wins).
        continue;
      }
      dmSeen.set(n.actor.id, out.length);
      out.push({ ...n, groupCount: 1, groupHasUnread: !n.readAt });
    } else {
      out.push({ ...n, groupCount: 1, groupHasUnread: !n.readAt });
    }
  }
  return out;
}

export default function NotificacionesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const { isSignedIn, isLoaded } = useClerkAuth();
  const qc = useQueryClient();

  const notifsQ = useGetNotifications({
    query: {
      queryKey: getGetNotificationsQueryKey(),
      enabled: !!isSignedIn,
      refetchInterval: 10_000,
    },
  });

  const markAll = useMarkAllNotificationsRead({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getGetNotificationsQueryKey() });
        qc.invalidateQueries({ queryKey: getGetUnreadNotificationCountQueryKey() });
      },
    },
  });

  // Mark as read on open.
  useEffect(() => {
    if (isSignedIn && notifsQ.data && notifsQ.data.some((n) => !n.readAt)) {
      markAll.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn, notifsQ.data]);

  const rawList = notifsQ.data ?? [];

  // Group consecutive `dm` notifications from the same actor into a single row.
  // Append mock notifications at the end for preview purposes.
  const list = useMemo(
    () => [...groupNotifications(rawList), ...MOCK_NOTIFICATIONS],
    [rawList],
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />
      <SacredBackground />

      <ScrollView
        contentContainerStyle={{
          paddingTop: topPad + 8,
          paddingBottom: bottomPad + 40,
          paddingHorizontal: 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </Pressable>
        </View>

        <Text style={[styles.title, { color: colors.foreground }]}>Notificaciones</Text>

        {(notifsQ.isLoading && isSignedIn) ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
        ) : null}

        {list.map((n) => {
            const tint = colorFor(n.actor.id);
            const isGroupedDm = n.type === "dm" && n.groupCount > 1;
            const messageText = isGroupedDm
              ? `te envió ${n.groupCount} mensajes`
              : messageFor(n);
            return (
              <Pressable
                key={n.type === "dm" ? `dm-${n.actor.id}` : `n-${n.id}`}
                onPress={() => router.push(routeFor(n) as never)}
                style={({ pressed }) => [
                  styles.row,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                {/* Avatar + type icon badge */}
                <View style={styles.avatarWrap}>
                  <View style={[styles.avatar, { backgroundColor: tint + "33" }]}>
                    <Text style={[styles.initials, { color: tint }]}>{initials(n.actor.displayName)}</Text>
                  </View>
                  <View style={[styles.typeBadge, { backgroundColor: iconFor(n.type).color + "22", borderColor: iconFor(n.type).color + "55" }]}>
                    <Feather name={iconFor(n.type).name} size={10} color={iconFor(n.type).color} />
                  </View>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.text, { color: colors.foreground }]}>
                    <Text style={{ fontWeight: "700" }}>{n.actor.displayName}</Text>{" "}
                    {messageText}
                  </Text>
                  <Text style={[styles.time, { color: colors.mutedForeground }]}>
                    {relativeTime(n.createdAt)}
                  </Text>
                </View>
                {isGroupedDm && (
                  <View style={[styles.countBadge, { backgroundColor: colors.primary }]}>
                    <Text style={styles.countText}>{n.groupCount > 9 ? "9+" : n.groupCount}</Text>
                  </View>
                )}
                {n.groupHasUnread && (
                  <View style={[styles.dot, { backgroundColor: colors.primary }]} />
                )}
              </Pressable>
            );
          })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 16, height: 40 },
  title: { fontSize: 26, fontWeight: "700", marginBottom: 20 },
  empty: { fontSize: 14, textAlign: "center", marginTop: 40 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  avatarWrap: { position: "relative", width: 44, height: 44 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  typeBadge: {
    position: "absolute",
    bottom: -2,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  initials: { fontSize: 15, fontWeight: "700" },
  text: { fontSize: 14, lineHeight: 20, marginBottom: 4 },
  time: { fontSize: 12 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  countBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    paddingHorizontal: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  countText: { color: "#1A0E06", fontSize: 12, fontWeight: "700" },
});
