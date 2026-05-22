import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  getGetMessagesQueryKey,
  useCreateMessage,
  useGetMessages,
  useLikeMessage,
} from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";
import { useQueryClient } from "@tanstack/react-query";

const MAX_CHARS = 280;
const GRADIENT: [string, string] = ["#5C1A3A", "#3A0D22"];
const ACCENT = "#D4709A";
const WINDOW_MS = 24 * 60 * 60 * 1000;

function timeAgo(iso: string | Date): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "ahora mismo";
  if (mins < 60) return `hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  return `hace ${hrs} h`;
}

/** Returns "expira en X h Y min" for a message given its createdAt */
function expiresIn(iso: string | Date): string {
  const msLeft = new Date(iso).getTime() + WINDOW_MS - Date.now();
  if (msLeft <= 0) return "expirado";
  const totalMins = Math.floor(msLeft / 60000);
  const hrs = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  if (hrs > 0) return `${hrs} h ${mins} min`;
  return `${mins} min`;
}

/** Countdown hook: re-renders every minute */
function useCountdown(targetMs: number | null): string {
  const [label, setLabel] = useState("");

  useEffect(() => {
    if (targetMs === null) return;
    const tick = () => {
      const msLeft = targetMs - Date.now();
      if (msLeft <= 0) { setLabel("en breve"); return; }
      const totalMins = Math.floor(msLeft / 60000);
      const hrs = Math.floor(totalMins / 60);
      const mins = totalMins % 60;
      setLabel(hrs > 0 ? `${hrs} h ${mins} min` : `${mins} min`);
    };
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [targetMs]);

  return label;
}

export function MensajesAnonimosPanel() {
  const colors = useColors();
  const queryClient = useQueryClient();
  const [text, setText] = useState("");
  const [showFeed, setShowFeed] = useState(false);
  const [likedIds, setLikedIds] = useState<Set<number>>(new Set());

  const { data, isLoading, refetch, isRefetching } = useGetMessages(
    { page: 1 },
    { query: { enabled: showFeed, refetchInterval: 5 * 60_000 } },
  );

  const { mutate: submit, isPending: isSubmitting } = useCreateMessage({
    mutation: {
      onSuccess: () => {
        setText("");
        setShowFeed(true);
        queryClient.invalidateQueries({ queryKey: getGetMessagesQueryKey() });
      },
      onError: () => {
        Alert.alert("Error", "No se pudo enviar el mensaje. Intentá de nuevo.");
      },
    },
  });

  const { mutate: like } = useLikeMessage({
    mutation: {
      onSuccess: (updated) => {
        queryClient.setQueryData(
          getGetMessagesQueryKey({ page: 1 }),
          (old: typeof data) => {
            if (!old) return old;
            return {
              ...old,
              messages: old.messages.map((m) =>
                m.id === updated.id ? updated : m,
              ),
            };
          },
        );
      },
    },
  });

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    submit({ data: { content: trimmed } });
  };

  const handleLike = (id: number) => {
    if (likedIds.has(id)) return;
    setLikedIds((prev) => new Set(prev).add(id));
    like({ id });
  };

  const remaining = MAX_CHARS - text.length;
  const messages = data?.messages ?? [];
  const total = data?.total ?? 0;

  // The oldest message in the feed expires soonest — its expiry = the "next clear"
  const oldestMessage = messages.length > 0 ? messages[messages.length - 1] : null;
  const nextClearMs = oldestMessage
    ? new Date(oldestMessage.createdAt).getTime() + WINDOW_MS
    : null;
  const nextClearLabel = useCountdown(nextClearMs);

  return (
    <View
      style={[
        styles.panel,
        { backgroundColor: colors.card, borderColor: "rgba(212,112,154,0.2)" },
      ]}
    >
      {/* Header */}
      <LinearGradient
        colors={GRADIENT}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerLeft}>
          <View style={styles.headerIconBg}>
            <Feather name="users" size={18} color="#FFD6EB" />
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.headerTitleRow}>
              <Text style={styles.headerTitle}>Mensajes del Alma</Text>
              <View style={styles.cycleBadge}>
                <Feather name="clock" size={9} color="#FFD6EB" />
                <Text style={styles.cycleBadgeText}>24 h</Text>
              </View>
            </View>
            <Text style={styles.headerSubtitle}>
              Anónimo · se borran solos cada día
            </Text>
          </View>
        </View>
        {total > 0 && (
          <Pressable
            onPress={() => setShowFeed((v) => !v)}
            style={styles.feedToggle}
          >
            <Feather
              name={showFeed ? "chevron-up" : "globe"}
              size={16}
              color="#FFD6EB"
            />
            <Text style={styles.feedCount}>{total}</Text>
          </Pressable>
        )}
      </LinearGradient>

      {/* Compose area */}
      <View style={styles.composeArea}>
        <TextInput
          value={text}
          onChangeText={(t) => setText(t.slice(0, MAX_CHARS))}
          placeholder="Escribe algo desde el corazón..."
          placeholderTextColor={colors.mutedForeground}
          multiline
          style={[
            styles.textInput,
            {
              color: colors.foreground,
              borderColor: text.length > 0 ? `${ACCENT}55` : colors.border,
            },
          ]}
        />
        <View style={styles.composeFooter}>
          <Text
            style={[
              styles.charCount,
              { color: remaining < 40 ? "#E07060" : colors.mutedForeground },
            ]}
          >
            {remaining} caracteres
          </Text>
          <Pressable
            onPress={handleSubmit}
            disabled={!text.trim() || isSubmitting}
            style={({ pressed }) => [
              styles.sendBtn,
              {
                backgroundColor: text.trim() ? ACCENT : colors.border,
                opacity: pressed || isSubmitting ? 0.7 : 1,
              },
            ]}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Feather
                  name="send"
                  size={13}
                  color={text.trim() ? "#fff" : colors.mutedForeground}
                />
                <Text
                  style={[
                    styles.sendBtnText,
                    { color: text.trim() ? "#fff" : colors.mutedForeground },
                  ]}
                >
                  Enviar
                </Text>
              </>
            )}
          </Pressable>
        </View>
      </View>

      {/* Community feed */}
      {showFeed && (
        <View style={[styles.feed, { borderTopColor: colors.border }]}>
          <View style={styles.feedHeader}>
            <Text style={[styles.feedTitle, { color: colors.mutedForeground }]}>
              HOY · {total} {total === 1 ? "mensaje" : "mensajes"}
            </Text>
            <View style={styles.feedHeaderRight}>
              {nextClearLabel ? (
                <View style={styles.clearBadge}>
                  <Feather name="trash-2" size={9} color={colors.mutedForeground} />
                  <Text style={[styles.clearLabel, { color: colors.mutedForeground }]}>
                    borrar en {nextClearLabel}
                  </Text>
                </View>
              ) : null}
              <Pressable onPress={() => refetch()} hitSlop={8}>
                <Feather
                  name="refresh-cw"
                  size={13}
                  color={isRefetching ? ACCENT : colors.mutedForeground}
                />
              </Pressable>
            </View>
          </View>

          {isLoading ? (
            <ActivityIndicator color={ACCENT} style={{ marginVertical: 20 }} />
          ) : messages.length === 0 ? (
            <View style={styles.emptyState}>
              <Feather name="wind" size={28} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                Sé la primera persona en compartir algo hoy
              </Text>
              <Text style={[styles.emptyHint, { color: colors.mutedForeground }]}>
                Los mensajes duran 24 h y luego desaparecen
              </Text>
            </View>
          ) : (
            <ScrollView
              nestedScrollEnabled
              showsVerticalScrollIndicator={false}
              style={styles.messagesList}
              refreshControl={
                <RefreshControl
                  refreshing={isRefetching}
                  onRefresh={refetch}
                  tintColor={ACCENT}
                />
              }
            >
              {messages.map((msg) => {
                const msLeft = new Date(msg.createdAt).getTime() + WINDOW_MS - Date.now();
                const isExpiringSoon = msLeft < 3 * 60 * 60 * 1000; // < 3 h
                return (
                  <View
                    key={msg.id}
                    style={[
                      styles.messageCard,
                      {
                        backgroundColor: colors.background,
                        borderColor: isExpiringSoon
                          ? "rgba(224,112,96,0.3)"
                          : colors.border,
                      },
                    ]}
                  >
                    <Text style={[styles.messageText, { color: colors.foreground }]}>
                      {msg.content}
                    </Text>
                    <View style={styles.messageMeta}>
                      <View style={styles.messageMetaLeft}>
                        <Text style={[styles.messageTime, { color: colors.mutedForeground }]}>
                          {timeAgo(msg.createdAt)}
                        </Text>
                        {isExpiringSoon && (
                          <View style={styles.expiringTag}>
                            <Feather name="clock" size={8} color="#E07060" />
                            <Text style={styles.expiringText}>
                              {expiresIn(msg.createdAt)}
                            </Text>
                          </View>
                        )}
                      </View>
                      <Pressable
                        onPress={() => handleLike(msg.id)}
                        style={styles.likeBtn}
                        hitSlop={8}
                      >
                        <Feather
                          name="heart"
                          size={12}
                          color={likedIds.has(msg.id) ? "#E07070" : colors.mutedForeground}
                        />
                        {msg.likes > 0 && (
                          <Text
                            style={[
                              styles.likeCount,
                              {
                                color: likedIds.has(msg.id)
                                  ? "#E07070"
                                  : colors.mutedForeground,
                              },
                            ]}
                          >
                            {msg.likes}
                          </Text>
                        )}
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  headerIconBg: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  headerTitle: {
    color: "#FFD6EB",
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 20,
  },
  cycleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  cycleBadgeText: {
    color: "#FFD6EB",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    color: "rgba(255,214,235,0.7)",
    fontSize: 11,
    marginTop: 2,
  },
  feedToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginLeft: 8,
  },
  feedCount: {
    color: "#FFD6EB",
    fontSize: 12,
    fontWeight: "600",
  },

  composeArea: { padding: 14 },
  textInput: {
    minHeight: 88,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    fontSize: 14,
    lineHeight: 22,
    textAlignVertical: "top",
  },
  composeFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
  },
  charCount: { fontSize: 11 },
  sendBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 88,
    justifyContent: "center",
  },
  sendBtnText: { fontSize: 13, fontWeight: "700" },

  feed: { borderTopWidth: 1, padding: 14 },
  feedHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  feedTitle: { fontSize: 10, letterSpacing: 1.5, fontWeight: "600" },
  feedHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  clearBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  clearLabel: { fontSize: 9, letterSpacing: 0.3 },

  messagesList: { maxHeight: 320 },

  emptyState: { alignItems: "center", paddingVertical: 24, gap: 8 },
  emptyText: { fontSize: 13, textAlign: "center", lineHeight: 20 },
  emptyHint: { fontSize: 11, textAlign: "center", opacity: 0.6 },

  messageCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
  },
  messageText: { fontSize: 14, lineHeight: 22 },
  messageMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  messageMetaLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  messageTime: { fontSize: 10, letterSpacing: 0.3 },
  expiringTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  expiringText: { fontSize: 9, color: "#E07060", letterSpacing: 0.2 },
  likeBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  likeCount: { fontSize: 11, fontWeight: "600" },
});
