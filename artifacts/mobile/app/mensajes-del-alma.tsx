import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Keyboard,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  getGetMessagesQueryKey,
  useCreateMessage,
  useGetMessages,
  useLikeMessage,
} from "@workspace/api-client-react";
import { SacredBackground } from "@/components/SacredBackground";
import { useColors } from "@/hooks/useColors";
import { useUserProfile } from "@/context/UserProfileContext";
import { useQueryClient } from "@tanstack/react-query";

const MAX_CHARS = 300;
const WINDOW_MS = 24 * 60 * 60 * 1000;

function timeAgo(iso: string | Date): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "ahora mismo";
  if (mins < 60) return `hace ${mins} min`;
  return `hace ${Math.floor(mins / 60)} h`;
}

function expiresIn(iso: string | Date): string {
  const msLeft = new Date(iso).getTime() + WINDOW_MS - Date.now();
  if (msLeft <= 0) return "expirado";
  const totalMins = Math.floor(msLeft / 60000);
  const hrs = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  if (hrs > 0) return `${hrs} h ${mins} min`;
  return `${mins} min`;
}

function AuthorAvatar({ uri, name, size = 38 }: { uri?: string | null; name?: string | null; size?: number }) {
  const initials = name ? name.slice(0, 1).toUpperCase() : "?";
  const radius = size / 2;
  if (uri) {
    return <Image source={{ uri }} style={{ width: size, height: size, borderRadius: radius }} />;
  }
  return (
    <View style={[{ width: size, height: size, borderRadius: radius, backgroundColor: "rgba(198,155,79,0.18)", alignItems: "center", justifyContent: "center" }]}>
      <Text style={{ fontSize: size * 0.4, fontWeight: "700", color: "#C69B4F" }}>{initials}</Text>
    </View>
  );
}

export default function MensajesDelAlmaScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 56 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const queryClient = useQueryClient();
  const { recordSentMessage, username, photoUri } = useUserProfile();

  const [text, setText] = useState("");
  const [likedIds, setLikedIds] = useState<Set<number>>(new Set());
  const inputRef = useRef<TextInput>(null);

  const { data, isLoading, refetch, isRefetching } = useGetMessages(
    { page: 1 },
    { query: { queryKey: getGetMessagesQueryKey({ page: 1 }), refetchInterval: 3 * 60_000 } },
  );

  const { mutate: submit, isPending: isSubmitting } = useCreateMessage({
    mutation: {
      onSuccess: (created) => {
        setText("");
        Keyboard.dismiss();
        recordSentMessage(created.id);
        queryClient.invalidateQueries({ queryKey: getGetMessagesQueryKey() });
      },
      onError: () => {
        Alert.alert("Error", "No se pudo enviar. Intentá de nuevo.");
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
            return { ...old, messages: old.messages.map((m) => (m.id === updated.id ? updated : m)) };
          },
        );
      },
    },
  });

  const handleLike = (id: number) => {
    if (likedIds.has(id)) return;
    setLikedIds((prev) => new Set(prev).add(id));
    like({ id });
  };

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    submit({ data: { content: trimmed } });
  };

  const allMessages = data?.messages ?? [];
  const total = data?.total ?? 0;
  const remaining = MAX_CHARS - text.length;

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <StatusBar barStyle="light-content" />
        <SacredBackground />

        {/* Top bar */}
        <View style={[styles.topBar, { paddingTop: topPad + 6 }]}>
          <Pressable
            onPress={() => router.back()}
            style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            hitSlop={8}
          >
            <Feather name="chevron-left" size={20} color={colors.foreground} />
          </Pressable>
          <View style={styles.topTitleBlock}>
            <Text style={[styles.topTitle, { color: colors.foreground }]}>Lo que siente la comunidad</Text>
            {total > 0 && (
              <Text style={[styles.topSub, { color: colors.mutedForeground }]}>
                {total} {total === 1 ? "mensaje" : "mensajes"} · 24 h
              </Text>
            )}
          </View>
          <View style={{ width: 38 }} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{ paddingBottom: 48 + bottomPad, paddingTop: 8 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.primary}
            />
          }
        >
          {/* Compose card */}
          <View style={[styles.composeCard, { backgroundColor: "rgba(255,255,255,0.04)", borderColor: "rgba(198,155,79,0.18)" }]}>
            <View style={styles.composeTop}>
              <AuthorAvatar uri={photoUri} name={username} size={36} />
              <TextInput
                ref={inputRef}
                value={text}
                onChangeText={(t) => setText(t.slice(0, MAX_CHARS))}
                placeholder="¿Qué querés compartir hoy?"
                placeholderTextColor={colors.mutedForeground + "80"}
                multiline
                style={[styles.composeInput, { color: colors.foreground }]}
                selectionColor={colors.primary}
              />
            </View>
            <View style={[styles.composeFooter, { borderTopColor: "rgba(255,255,255,0.06)" }]}>
              <Text style={[styles.charCount, { color: remaining < 40 ? "#D07060" : colors.mutedForeground }]}>
                {remaining}
              </Text>
              <View style={styles.composeFooterRight}>
                <View style={[styles.infoBadge, { borderColor: "rgba(255,255,255,0.10)" }]}>
                  <Feather name="clock" size={10} color={colors.mutedForeground} />
                  <Text style={[styles.infoBadgeText, { color: colors.mutedForeground }]}>24 h</Text>
                </View>
                <Pressable
                  onPress={handleSend}
                  disabled={!text.trim() || isSubmitting}
                  style={({ pressed }) => [
                    styles.sendBtn,
                    {
                      backgroundColor: text.trim() ? colors.primary : "rgba(198,155,79,0.20)",
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#18110C" />
                  ) : (
                    <Text style={[styles.sendBtnText, { color: text.trim() ? "#18110C" : colors.mutedForeground }]}>
                      Compartir
                    </Text>
                  )}
                </Pressable>
              </View>
            </View>
          </View>

          {/* Divider label */}
          <View style={styles.dividerRow}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerLabel, { color: colors.mutedForeground }]}>
              {isLoading ? "CARGANDO..." : `HOY · ${total} ${total === 1 ? "MENSAJE" : "MENSAJES"}`}
            </Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </View>

          {/* Feed */}
          {isLoading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: 32 }} />
          ) : allMessages.length === 0 ? (
            <View style={styles.emptyState}>
              <Feather name="heart" size={36} color={colors.mutedForeground} style={{ opacity: 0.5 }} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                Sé la primera persona en compartir algo hoy
              </Text>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                Los mensajes duran 24 horas y luego desaparecen
              </Text>
            </View>
          ) : (
            <View style={styles.feedList}>
              {allMessages.map((msg) => {
                const msLeft = new Date(msg.createdAt).getTime() + WINDOW_MS - Date.now();
                const isExpiring = msLeft < 3 * 60 * 60 * 1000;
                const isLiked = likedIds.has(msg.id);
                return (
                  <View
                    key={msg.id}
                    style={[
                      styles.msgCard,
                      {
                        backgroundColor: "rgba(255,255,255,0.04)",
                        borderColor: isExpiring ? "rgba(192,112,90,0.25)" : "rgba(255,255,255,0.07)",
                      },
                    ]}
                  >
                    <AuthorAvatar uri={msg.authorAvatarUrl} name={msg.authorName} size={40} />
                    <View style={styles.msgRight}>
                      <View style={styles.msgHeader}>
                        <Text style={[styles.msgAuthor, { color: colors.primary }]}>
                          {msg.authorName ?? "Anónimo"}
                        </Text>
                        <Text style={[styles.msgTime, { color: colors.mutedForeground }]}>
                          {timeAgo(msg.createdAt)}
                        </Text>
                      </View>
                      <Text style={[styles.msgContent, { color: colors.foreground }]}>
                        {msg.content}
                      </Text>
                      <View style={styles.msgFooter}>
                        {isExpiring && (
                          <View style={styles.expiringTag}>
                            <Feather name="clock" size={9} color="#C07060" />
                            <Text style={styles.expiringText}>expira en {expiresIn(msg.createdAt)}</Text>
                          </View>
                        )}
                        <Pressable
                          onPress={() => handleLike(msg.id)}
                          style={styles.likeBtn}
                          hitSlop={10}
                        >
                          <Feather
                            name={isLiked ? "heart" : "heart"}
                            size={14}
                            color={isLiked ? "#D07070" : colors.mutedForeground}
                          />
                          {msg.likes > 0 && (
                            <Text style={[styles.likeCount, { color: isLiked ? "#D07070" : colors.mutedForeground }]}>
                              {msg.likes}
                            </Text>
                          )}
                        </Pressable>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 10,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  topTitleBlock: { flex: 1, alignItems: "center" },
  topTitle: { fontSize: 15, fontWeight: "700", letterSpacing: 0.2, textAlign: "center" },
  topSub: { fontSize: 11, marginTop: 2 },

  composeCard: {
    marginHorizontal: 20,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 24,
    overflow: "hidden",
  },
  composeTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 14,
  },
  composeInput: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    minHeight: 70,
    textAlignVertical: "top",
  },
  composeFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  charCount: { fontSize: 11 },
  composeFooterRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  infoBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  infoBadgeText: { fontSize: 10 },
  sendBtn: {
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 8,
    minWidth: 90,
    alignItems: "center",
  },
  sendBtnText: { fontSize: 13, fontWeight: "700" },

  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  dividerLine: { flex: 1, height: 1 },
  dividerLabel: { fontSize: 10, fontWeight: "700", letterSpacing: 1.2 },

  emptyState: { alignItems: "center", paddingTop: 56, gap: 12, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 15, fontWeight: "700", textAlign: "center" },
  emptyText: { fontSize: 13, textAlign: "center", lineHeight: 20 },

  feedList: { gap: 10, paddingHorizontal: 20 },
  msgCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  msgRight: { flex: 1 },
  msgHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  msgAuthor: { fontSize: 13, fontWeight: "600" },
  msgTime: { fontSize: 10 },
  msgContent: { fontSize: 14, lineHeight: 22 },
  msgFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  expiringTag: { flexDirection: "row", alignItems: "center", gap: 3 },
  expiringText: { fontSize: 9, color: "#C07060" },
  likeBtn: { flexDirection: "row", alignItems: "center", gap: 5 },
  likeCount: { fontSize: 11, fontWeight: "600" },
});
