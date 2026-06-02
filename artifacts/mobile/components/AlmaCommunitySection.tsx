import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  getGetMessagesQueryKey,
  useLikeMessage,
  useGetMessages,
} from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";
import { resolveAvatarUrl } from "@/lib/avatar";
import { useQueryClient } from "@tanstack/react-query";

const WINDOW_MS = 24 * 60 * 60 * 1000;
const PREVIEW_COUNT = 3;

function timeAgo(iso: string | Date): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `${mins} min`;
  return `${Math.floor(mins / 60)} h`;
}

function AuthorAvatar({ uri, name }: { uri?: string | null; name?: string | null }) {
  const initials = name ? name.slice(0, 1).toUpperCase() : "?";
  if (uri) {
    return <Image source={{ uri }} style={styles.avatar} />;
  }
  return (
    <View style={[styles.avatar, styles.avatarDefault]}>
      <Text style={styles.avatarInitial}>{initials}</Text>
    </View>
  );
}

export function AlmaCommunitySection() {
  const colors = useColors();
  const queryClient = useQueryClient();
  const [likedIds, setLikedIds] = useState<Set<number>>(new Set());

  const { data, isLoading } = useGetMessages(
    { page: 1 },
    { query: { queryKey: getGetMessagesQueryKey({ page: 1 }), refetchInterval: 3 * 60_000 } },
  );

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

  const allMessages = data?.messages ?? [];
  const total = data?.total ?? 0;
  const preview = allMessages.slice(0, PREVIEW_COUNT);

  return (
    <View style={styles.section}>
      {/* Header */}
      <Pressable
        style={styles.headerRow}
        onPress={() => router.push("/mensajes-del-alma" as never)}
      >
        <View>
          <Text style={[styles.title, { color: colors.foreground }]}>
            Lo que siente la comunidad
          </Text>
          {total > 0 && (
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              {total} {total === 1 ? "mensaje" : "mensajes"} hoy · desaparecen en 24 h
            </Text>
          )}
        </View>
        <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
      </Pressable>

      {/* Compose tap area */}
      <Pressable
        onPress={() => router.push("/mensajes-del-alma" as never)}
        style={({ pressed }) => [
          styles.composeTap,
          { backgroundColor: "rgba(255,255,255,0.04)", borderColor: "rgba(198,155,79,0.18)", opacity: pressed ? 0.75 : 1 },
        ]}
      >
        <View style={[styles.composeDot, { backgroundColor: "rgba(198,155,79,0.25)" }]}>
          <Feather name="edit-2" size={13} color={colors.primary} />
        </View>
        <Text style={[styles.composePlaceholder, { color: colors.mutedForeground }]}>
          ¿Qué querés soltar hoy?
        </Text>
        <View style={[styles.composeChip, { borderColor: "rgba(198,155,79,0.30)" }]}>
          <Text style={[styles.composeChipText, { color: colors.primary }]}>Compartir</Text>
        </View>
      </Pressable>

      {/* Messages preview */}
      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 16 }} />
      ) : preview.length === 0 ? (
        <View style={styles.emptyRow}>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Sé la primera persona en compartir algo hoy
          </Text>
        </View>
      ) : (
        <View style={styles.messagesList}>
          {preview.map((msg) => {
            const msLeft = new Date(msg.createdAt).getTime() + WINDOW_MS - Date.now();
            const isExpiring = msLeft < 3 * 60 * 60 * 1000;
            const isLiked = likedIds.has(msg.id);
            return (
              <Pressable
                key={msg.id}
                onPress={() => router.push("/mensajes-del-alma" as never)}
                style={({ pressed }) => [
                  styles.msgCard,
                  {
                    borderBottomColor: isExpiring
                      ? "rgba(192,112,90,0.20)"
                      : "rgba(255,255,255,0.07)",
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <AuthorAvatar uri={resolveAvatarUrl(msg.authorAvatarUrl)} name={msg.authorName} />
                <View style={styles.msgBody}>
                  <Text style={[styles.msgAuthor, { color: colors.primary }]}>
                    {msg.authorName ?? "Anónimo"}
                  </Text>
                  <Text style={[styles.msgText, { color: colors.foreground }]} numberOfLines={2}>
                    {msg.content}
                  </Text>
                  <View style={styles.msgMeta}>
                    <Text style={[styles.msgTime, { color: colors.mutedForeground }]}>
                      {timeAgo(msg.createdAt)}
                    </Text>
                    {isExpiring && (
                      <View style={styles.expiringTag}>
                        <Feather name="clock" size={9} color="#C0705A" />
                        <Text style={styles.expiringText}>expira pronto</Text>
                      </View>
                    )}
                  </View>
                </View>
                <Pressable
                  onPress={(e) => { e.stopPropagation?.(); handleLike(msg.id); }}
                  style={styles.likeBtn}
                  hitSlop={10}
                >
                  <Feather name="heart" size={14} color={isLiked ? "#D07070" : colors.mutedForeground} />
                  {msg.likes > 0 && (
                    <Text style={[styles.likeCount, { color: isLiked ? "#D07070" : colors.mutedForeground }]}>
                      {msg.likes}
                    </Text>
                  )}
                </Pressable>
              </Pressable>
            );
          })}
        </View>
      )}

      {/* Ver todo */}
      {preview.length > 0 && (
        <Pressable
          onPress={() => router.push("/mensajes-del-alma" as never)}
          style={({ pressed }) => [styles.verTodo, { opacity: pressed ? 0.7 : 1 }]}
        >
          <Text style={[styles.verTodoText, { color: colors.accent }]}>
            Ver todos los mensajes de hoy →
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 20,
    marginBottom: 28,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  title: { fontSize: 18, fontWeight: "700", letterSpacing: 0.3 },
  subtitle: { fontSize: 12, marginTop: 3, lineHeight: 16 },

  composeTap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginBottom: 12,
  },
  composeDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  composePlaceholder: { flex: 1, fontSize: 14 },
  composeChip: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  composeChipText: { fontSize: 12, fontWeight: "600" },

  emptyRow: {
    paddingVertical: 20,
    alignItems: "center",
    marginTop: 2,
  },
  emptyText: { fontSize: 13, textAlign: "center" },

  messagesList: {},
  msgCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    marginTop: 2,
    flexShrink: 0,
  },
  avatarDefault: {
    backgroundColor: "rgba(198,155,79,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: {
    fontSize: 14,
    fontWeight: "700",
    color: "#C69B4F",
  },
  msgBody: { flex: 1 },
  msgAuthor: { fontSize: 12, fontWeight: "600", marginBottom: 3 },
  msgText: { fontSize: 13, lineHeight: 19, opacity: 0.82 },
  msgMeta: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 5 },
  msgTime: { fontSize: 10 },
  expiringTag: { flexDirection: "row", alignItems: "center", gap: 3 },
  expiringText: { fontSize: 9, color: "#C0705A" },
  likeBtn: { flexDirection: "column", alignItems: "center", gap: 3, paddingTop: 2 },
  likeCount: { fontSize: 10, fontWeight: "600" },

  verTodo: { alignItems: "center", marginTop: 12 },
  verTodoText: { fontSize: 13, fontWeight: "600" },
});
