import { Feather } from "@expo/vector-icons";
import { usePollingInterval } from "@/hooks/usePollingInterval";
import { useAuth as useClerkAuth } from "@clerk/expo";
import { useQueryClient } from "@tanstack/react-query";
import {
  getGetNotificationsQueryKey,
  getGetUnreadNotificationCountQueryKey,
  useDeleteNotification,
  useGetNotifications,
  useMarkAllNotificationsRead,
  type Notification,
} from "@workspace/api-client-react";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useEffect, useMemo, useRef } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GoldGradient } from "@/components/GoldGradient";
import { useBackAfterClose, useBackOverride } from "@/context/BackOverrideContext";
import { useDrawer } from "@/context/DrawerContext";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { useColors } from "@/hooks/useColors";
import { absoluteMediaUrl } from "@/hooks/effectiveHero";

const AVATAR_PALETTE = ["#D4709A", "#8AAAD4", "#f4c993", "#A8C4A8", "#C8B4E0", "#EDD9B8"];

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

function iconFor(type: string): { name: FeatherName; color: string } {
  switch (type) {
    case "session_published": return { name: "bell", color: "#E7B95C" };
    case "friend_request":  return { name: "user-plus",      color: "#8AAAD4" };
    case "vibration":       return { name: "radio",          color: "#E7B95C" };
    case "friend_accepted": return { name: "user-check",     color: "#A8C4A8" };
    case "new_follower":    return { name: "user",           color: "#F9F9F9" };
    case "dm":              return { name: "message-circle", color: "#F9F9F9" };
    case "group_message":   return { name: "users",          color: "#C8B4E0" };
    case "mix_like":        return { name: "heart",          color: "#D4709A" };
    case "mix_comment":     return { name: "message-square", color: "#F9F9F9" };
    default:                return { name: "bell",           color: "#FFFFFF" };
  }
}

function messageFor(n: Notification): string {
  switch ((n as Notification & { type: string }).type) {
    case "session_published": return n.message?.trim() || "hay una nueva sesión para ti";
    case "friend_request":  return "te envió una solicitud de amistad";
    case "vibration":       return "te envió una vibración";
    case "friend_accepted": return "aceptó tu solicitud de amistad";
    case "new_follower":    return "empezó a seguirte";
    case "dm":              return "te envió un mensaje";
    case "group_message":   return "publicó en el grupo";
    case "mix_like":        return "le dio me gusta a tu mezcla";
    case "mix_comment":     return "comentó tu mezcla";
    default:                return "tiene una novedad";
  }
}

function routeFor(n: Notification): string {
  const type = (n as Notification & { type: string }).type;
  if (type === "session_published") {
    const data = n as Notification & { sessionId?: string; entityKey?: string };
    const sessionId = data.sessionId ?? data.entityKey;
    return sessionId ? `/session/${encodeURIComponent(sessionId)}` : "/nuevas-sesiones";
  }
  if (n.type === "dm")            return n.actor?.id != null ? `/chat/${n.actor.id}` : "/amigos";
  if (n.type === "vibration")     return n.actor?.id != null ? `/usuario/${n.actor.id}` : "/amigos";
  if (n.type === "group_message") return n.entityId != null ? `/grupo/${n.entityId}` : "/grupos";
  if (n.type === "new_follower")  return n.actor?.id != null ? `/expansor-perfil/${n.actor.id}` : "/amigos";
  if (n.type === "mix_like" || n.type === "mix_comment") {
    return n.entityId != null ? `/mezcla/${n.entityId}` : "/";
  }
  return "/amigos";
}

type GroupedNotification = Notification & { groupCount: number; groupHasUnread: boolean };


// Collapse all `dm` notifications from the same actor into a single row
// (using the most recent one as the representative). Other types stay as-is.
function groupNotifications(list: Notification[]): GroupedNotification[] {
  const out: GroupedNotification[] = [];
  const dmSeen = new Map<string, number>(); // String(actorId) -> index into `out`
  for (const n of list) {
    if (n.type === "dm") {
      const key = String(n.actor?.id ?? 0);
      const existingIdx = dmSeen.get(key);
      if (existingIdx != null) {
        const existing = out[existingIdx];
        existing.groupCount += 1;
        if (!n.readAt) existing.groupHasUnread = true;
        // Keep the newest as representative (list is newest-first, so first wins).
        continue;
      }
      dmSeen.set(key, out.length);
      out.push({ ...n, groupCount: 1, groupHasUnread: !n.readAt });
    } else {
      out.push({ ...n, groupCount: 1, groupHasUnread: !n.readAt });
    }
  }
  return out;
}

function SwipeDeleteRow({
  children,
  onDelete,
}: {
  children: (deleteRow: () => void) => React.ReactNode;
  onDelete: () => Promise<void>;
}) {
  const offset = useRef(new Animated.Value(0)).current;
  const { width } = useWindowDimensions();
  const deletingRef = useRef(false);
  const deleteRef = useRef(onDelete);
  deleteRef.current = onDelete;

  const reset = () => Animated.spring(offset, { toValue: 0, useNativeDriver: true }).start();
  const remove = () => {
    if (deletingRef.current) return;
    deletingRef.current = true;
    Animated.timing(offset, { toValue: -width, duration: 220, useNativeDriver: true }).start();
    deleteRef.current().catch(() => {
      Alert.alert("No se pudo eliminar", "Inténtalo de nuevo.");
      reset();
    }).finally(() => {
      deletingRef.current = false;
    });
  };
  const removeRef = useRef(remove);
  removeRef.current = remove;

  const pan = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, gesture) =>
      !deletingRef.current &&
      gesture.dx < -12 && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.4,
    onPanResponderMove: (_, gesture) => {
      offset.setValue(Math.max(-140, Math.min(0, gesture.dx)));
    },
    onPanResponderRelease: (_, gesture) => {
      if (gesture.dx < -85 || (gesture.dx < -30 && gesture.vx < -0.8)) removeRef.current();
      else Animated.spring(offset, { toValue: 0, useNativeDriver: true }).start();
    },
    onPanResponderTerminate: () => {
      if (!deletingRef.current) reset();
    },
  }), [offset]);

  return (
    <View style={styles.swipeWrapper}>
      <View style={styles.swipeBackdrop} pointerEvents="none" />
      <Animated.View {...pan.panHandlers} style={{ transform: [{ translateX: offset }] }}>
        {children(removeRef.current)}
      </Animated.View>
    </View>
  );
}

export default function NotificacionesScreen() {
  const colors = useColors();
  const backOverride = useBackOverride();
  const backAfterClose = useBackAfterClose();
  const { close: closeDrawer } = useDrawer();
  const { theme } = useSceneTheme();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, 40);
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const { isSignedIn, isLoaded } = useClerkAuth();
  const qc = useQueryClient();

  const notifsQ = useGetNotifications({
    query: {
      queryKey: getGetNotificationsQueryKey(),
      enabled: !!isSignedIn,
      staleTime: 0,
      refetchInterval: usePollingInterval(30_000),
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

  const deleteNotification = useDeleteNotification();
  async function removeNotification(id: number) {
    await deleteNotification.mutateAsync({ id });
    qc.setQueryData<Notification[]>(getGetNotificationsQueryKey(),
      (current) => current?.filter((notification) => notification.id !== id));
    qc.invalidateQueries({ queryKey: getGetUnreadNotificationCountQueryKey() });
  }

  // Keep the unread marker visible briefly before clearing the inbox count.
  useEffect(() => {
    if (isSignedIn && notifsQ.data && notifsQ.data.some((n) => !n.readAt)) {
      const timer = setTimeout(() => markAll.mutate(), 2_000);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn, notifsQ.data]);

  // Durante esta etapa, el buzón del drawer muestra únicamente los avisos
  // configurados desde “Personalizar notificaciones”.
  const rawList = (notifsQ.data ?? []).filter(
    (notification) => notification.type === "session_published",
  );

  // Group consecutive `dm` notifications from the same actor into a single row.
  const list = useMemo(() => groupNotifications(rawList), [rawList]);

  function openNotification(notification: Notification) {
    const target = routeFor(notification);
    if (backAfterClose) {
      closeDrawer();
      backAfterClose(() => router.push(target as never));
      return;
    }
    router.push(target as never);
  }

  return (
    <LinearGradient
      style={styles.root}
      colors={theme.gradient}
      locations={theme.gradientLocations}
      start={theme.gradientStart}
      end={theme.gradientEnd}
    >
      <StatusBar hidden />

      <View style={styles.contentShift}>
        <View style={[styles.stickyHeader, { paddingTop: topPad + 4 }]}>
          <View style={[styles.stickyHeaderRow, styles.libraryTabHeaderRow]}>
            <Pressable
              onPress={backOverride ?? (() => router.canGoBack() ? router.back() : router.replace("/(tabs)" as never))}
              hitSlop={6}
              style={styles.libraryTabBackHitArea}
              accessibilityRole="button"
              accessibilityLabel="Volver a Inicio"
            >
              {({ pressed }) => (
                <View
                  style={[
                    styles.libraryTabBackBtn,
                    { opacity: pressed ? 0.7 : 1 },
                  ]}
                >
                  <Feather
                    name="chevron-left"
                    size={28}
                    color="#FBFBFB"
                    style={{ transform: [{ translateX: -1 }] }}
                  />
                </View>
              )}
            </Pressable>
            <Text style={styles.stickyTitleLibraryTab}>Notificaciones</Text>
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{
            paddingTop: 23,
            paddingBottom: bottomPad + 40,
            paddingHorizontal: 20,
          }}
          showsVerticalScrollIndicator={false}
        >
          {!isLoaded ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
          ) : !isSignedIn ? (
            <Text style={[styles.empty, { color: colors.mutedForeground }]}>
              Conéctate para ver tus notificaciones.
            </Text>
          ) : notifsQ.isLoading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
          ) : list.length === 0 ? (
            <Text style={[styles.empty, { color: colors.mutedForeground }]}>
              No tienes notificaciones de nuevas sesiones todavía.
            </Text>
          ) : list.map((n) => {
              const notificationType = (n as Notification & { type: string }).type;
              const actor = n.actor;
              const actorId = actor?.id ?? 0;
              const actorName = actor?.displayName ?? "Resonancia";
              const tint = colorFor(actorId);
              const isGroupedDm = n.type === "dm" && n.groupCount > 1;
              const messageText = isGroupedDm
                ? `te envió ${n.groupCount} mensajes`
                : messageFor(n);
              const isSessionPublished = notificationType === "session_published";
              const isEditorialNotification =
                isSessionPublished &&
                n.message?.startsWith("Subimos una sesión de la temática ");
              return (
                <SwipeDeleteRow
                  key={n.type === "dm" ? `dm-${actorId}` : `n-${n.id}`}
                  onDelete={() => removeNotification(n.id)}
                >
                {(deleteRow) => (
                <Pressable
                  onPress={() => openNotification(n)}
                  accessibilityActions={[{ name: "delete", label: "Borrar notificación" }]}
                  onAccessibilityAction={(event) => {
                    if (event.nativeEvent.actionName === "delete") deleteRow();
                  }}
                  style={({ pressed }) => [
                    styles.row,
                    {
                      opacity: pressed ? 0.85 : 1,
                    },
                  ]}
                >
                  {isSessionPublished && n.sessionImageUrl ? (
                    <Image
                      source={{ uri: absoluteMediaUrl(n.sessionImageUrl) }}
                      style={styles.sessionThumbnail}
                      contentFit="cover"
                    />
                  ) : (
                    <View style={styles.avatarWrap}>
                      <View style={[styles.avatar, { backgroundColor: tint + "33" }]}>
                        <Text style={[styles.initials, { color: tint }]}>{initials(actorName)}</Text>
                      </View>
                      <View style={[styles.typeBadge, { backgroundColor: iconFor(n.type).color + "22", borderColor: iconFor(n.type).color + "55" }]}>
                        <Feather name={iconFor(n.type).name} size={10} color={iconFor(n.type).color} />
                      </View>
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    {isSessionPublished && n.sessionTitle && n.sessionLabel ? (
                      <Text style={[styles.text, { color: colors.foreground }]}>
                        Subimos una sesión de la{" "}
                        {isEditorialNotification ? "temática" : "categoría"}{" "}
                        <Text style={styles.bold}>{n.sessionLabel}</Text>, se llama{" "}
                        {"\""}<Text style={styles.bold}>{n.sessionTitle}</Text>{"\""}
                      </Text>
                    ) : (
                      <Text style={[styles.text, { color: colors.foreground }]}>
                        <Text style={styles.bold}>{actorName}</Text>{" "}
                        {messageText}
                      </Text>
                    )}
                    <Text style={[styles.time, { color: colors.mutedForeground }]}>
                      {relativeTime(n.createdAt)}
                    </Text>
                  </View>
                  {isGroupedDm && (
                    <GoldGradient style={styles.countBadge}>
                      <Text style={styles.countText}>{n.groupCount > 9 ? "9+" : n.groupCount}</Text>
                    </GoldGradient>
                  )}
                  {n.groupHasUnread && (
                    <GoldGradient style={styles.dot} />
                  )}
                </Pressable>
                )}
                </SwipeDeleteRow>
              );
            })}
        </ScrollView>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  contentShift: {
    flex: 1,
    transform: [{ translateY: -5 }],
  },
  stickyHeader: {
    zIndex: 10,
    backgroundColor: "transparent",
  },
  stickyHeaderRow: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 6,
  },
  libraryTabHeaderRow: {
    minHeight: 48,
    paddingBottom: 6,
    transform: [{ translateY: 8 }],
  },
  libraryTabBackBtn: {
    width: 43,
    height: 43,
    borderRadius: 21.5,
    borderWidth: 0,
    borderColor: "transparent",
    backgroundColor: "rgba(0,0,0,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  libraryTabBackHitArea: {
    position: "absolute",
    left: 16,
    top: -4,
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 20,
    elevation: 20,
  },
  stickyTitleLibraryTab: {
    fontFamily: "Manrope",
    fontSize: 18,
    lineHeight: 21,
    fontWeight: "700",
    color: "#FBFBFB",
    letterSpacing: 0.2,
    textAlign: "center",
    flex: 1,
    marginLeft: 0,
  },
  scroll: { flex: 1 },
  empty: { fontFamily: "Manrope", fontSize: 14, textAlign: "center", marginTop: 40 },
  swipeWrapper: {
    marginBottom: 14,
    borderRadius: 16,
    overflow: "hidden",
  },
  swipeBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.26)",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 16,
    borderWidth: 0,
    backgroundColor: "rgba(0,0,0,0.26)",
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  avatarWrap: { position: "relative", width: 44, height: 44 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  sessionThumbnail: {
    width: 56,
    height: 56,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
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
  initials: { fontFamily: "Manrope", fontSize: 15, fontWeight: "700" },
  text: { fontFamily: "Manrope", fontSize: 13, lineHeight: 19, marginBottom: 4 },
  bold: { fontWeight: "700" },
  time: { fontFamily: "Manrope", fontSize: 11 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  countBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    paddingHorizontal: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  countText: { fontFamily: "Manrope", color: "#080F0A", fontSize: 12, fontWeight: "700" },
});
