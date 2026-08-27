import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { usePollingInterval } from "@/hooks/usePollingInterval";
import { router } from "expo-router";
import React from "react";
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
  useGetMessages,
} from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";
import { resolveAvatarUrl } from "@/lib/avatar";

const WINDOW_MS = 24 * 60 * 60 * 1000;
const PREVIEW_COUNT = 10;

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

  const { data, isLoading } = useGetMessages(
    { page: 1 },
    { query: { queryKey: getGetMessagesQueryKey({ page: 1 }), refetchInterval: usePollingInterval(5 * 60_000) } },
  );

  const allMessages = data?.messages ?? [];
  const total = data?.total ?? 0;
  const preview = allMessages.slice(0, PREVIEW_COUNT);

  return (
    <View style={styles.section}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={[styles.caption, { color: colors.primary }]}>
          Muro de agradecimiento
        </Text>
        <Text style={[styles.title, { color: colors.foreground }]}>
          ¿Por qué estás agradecido(a) hoy?
        </Text>
      </View>

      {/* Compose tap area */}
      <Pressable
        onPress={() => router.push("/mensajes-del-alma" as never)}
        style={({ pressed }) => [
          styles.composeTap,
          { opacity: pressed ? 0.75 : 1 },
        ]}
      >
        <LinearGradient
          colors={["#774544", "#50316f"]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
        <Text style={styles.composeChipText}>Publicar</Text>
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
            return (
              <Pressable
                key={msg.id}
                onPress={() => router.push("/mensajes-del-alma" as never)}
                style={({ pressed }) => [
                  styles.msgCard,
                  {
                    borderBottomColor: isExpiring
                      ? "rgba(192,112,90,0.20)"
                      : "rgba(61,14,22,0.40)",
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
              </Pressable>
            );
          })}
        </View>
      )}

      {/* Cargar más — solo si hay más de 10 mensajes */}
      {preview.length > 0 && total > PREVIEW_COUNT && (
        <Pressable
          onPress={() => router.push("/mensajes-del-alma" as never)}
          style={({ pressed }) => [styles.cargarMasBtn, { opacity: pressed ? 0.7 : 1 }]}
        >
          <Text style={[styles.cargarMasText, { color: colors.primary }]}>Cargar más</Text>
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
    alignItems: "center",
    marginBottom: 24,
  },
  caption: { fontFamily: "Manrope", fontSize: 10, fontWeight: "400", letterSpacing: 1.4, textTransform: "uppercase", marginBottom: 6 },
  title: { fontFamily: "Manrope", fontSize: 18, fontWeight: "700", letterSpacing: 0.2, textAlign: "center" },
  subtitle: { fontFamily: "Manrope", fontSize: 12, marginTop: 4, lineHeight: 16, textAlign: "center" },

  composeTap: {
    alignSelf: "center",
    borderRadius: 15,
    overflow: "hidden",
    paddingHorizontal: 28,
    paddingVertical: 9,
    marginBottom: 16,
  },
  composeChipText: { fontFamily: "Manrope", fontSize: 13, fontWeight: "600", color: "#F9F9F9" },

  emptyRow: {
    paddingVertical: 20,
    alignItems: "center",
    marginTop: 2,
  },
  emptyText: { fontFamily: "Manrope", fontSize: 13, textAlign: "center" },

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
    borderRadius: 15,
    marginTop: 2,
    flexShrink: 0,
  },
  avatarDefault: {
    backgroundColor: "rgba(212,175,55,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: {
    fontFamily: "Manrope",
    fontSize: 14,
    fontWeight: "700",
    color: "#F9F9F9",
  },
  msgBody: { flex: 1 },
  msgAuthor: { fontFamily: "Manrope", fontSize: 11, fontWeight: "600", marginBottom: 3, opacity: 0.75 },
  msgText: { fontFamily: "Manrope", fontSize: 13, lineHeight: 19, opacity: 0.82 },
  msgMeta: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 5 },
  msgTime: { fontFamily: "Manrope", fontSize: 10 },
  expiringTag: { flexDirection: "row", alignItems: "center", gap: 3 },
  expiringText: { fontFamily: "Manrope", fontSize: 9, color: "#C0705A" },

  cargarMasBtn: {
    alignItems: "center",
    marginTop: 14,
    paddingVertical: 11,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.28)",
  },
  cargarMasText: { fontFamily: "Manrope", fontSize: 14, fontWeight: "600" },
});
