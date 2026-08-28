import { Feather } from "@expo/vector-icons";
import { usePollingInterval } from "@/hooks/usePollingInterval";
import { BackPill } from "@/components/BackPill";
import { GoldGradientFill } from "@/components/GoldGradient";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
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
} from "@workspace/api-client-react";
import { SacredBackground } from "@/components/SacredBackground";
import { useColors } from "@/hooks/useColors";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { resolveAvatarUrl } from "@/lib/avatar";
import { useUserProfile } from "@/context/UserProfileContext";
import { useQueryClient } from "@tanstack/react-query";

const MAX_CHARS = 300;

function timeAgo(iso: string | Date): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "Ahora";
  if (mins < 60) return `Hace ${mins} ${mins === 1 ? "minuto" : "minutos"}`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Hace ${hours} ${hours === 1 ? "hora" : "horas"}`;
  const days = Math.floor(hours / 24);
  return `Hace ${days} ${days === 1 ? "día" : "días"}`;
}

function AuthorAvatar({ uri, name, size = 38 }: { uri?: string | null; name?: string | null; size?: number }) {
  const initials = name ? name.slice(0, 1).toUpperCase() : "?";
  const radius = size / 2;
  if (uri) {
    return <Image source={{ uri }} style={{ width: size, height: size, borderRadius: radius }} />;
  }
  return (
    <View style={[{ width: size, height: size, borderRadius: radius, backgroundColor: "rgba(212,175,55,0.18)", alignItems: "center", justifyContent: "center" }]}>
      <Text style={{ fontSize: size * 0.4, fontWeight: "700", color: "#F9F9F9" }}>{initials}</Text>
    </View>
  );
}

const BG_GRADIENT = ["#340D1A", "#190913"] as const;

export default function MensajesDelAlmaScreen() {
  const colors = useColors();
  const { theme: sceneTheme } = useSceneTheme();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 56 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const queryClient = useQueryClient();
  const { recordSentMessage, sentMessageIds, username, photoUri } = useUserProfile();

  const [text, setText] = useState("");
  const [publishedThisVisit, setPublishedThisVisit] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const { data, isLoading, refetch, isRefetching } = useGetMessages(
    { page: 1 },
    { query: { queryKey: getGetMessagesQueryKey({ page: 1 }), refetchInterval: usePollingInterval(5 * 60_000) } },
  );

  const { mutate: submit, isPending: isSubmitting } = useCreateMessage({
    mutation: {
      onSuccess: (created) => {
        setText("");
        Keyboard.dismiss();
        recordSentMessage(created.id);
        setPublishedThisVisit(true);
        queryClient.invalidateQueries({ queryKey: getGetMessagesQueryKey() });
      },
      onError: () => {
        Alert.alert("Error", "No se pudo enviar. Intentá de nuevo.");
      },
    },
  });

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    submit({ data: { content: trimmed } });
  };

  const allMessages = data?.messages ?? [];
  const total = data?.total ?? 0;
  const remaining = MAX_CHARS - text.length;
  const hasPublished = publishedThisVisit || sentMessageIds.some((id) => allMessages.some((message) => message.id === id));

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <LinearGradient

        style={styles.root}

        colors={sceneTheme.gradient as [string, string, ...string[]]}

        locations={[0, 0.5, 1]}

        start={{ x: 0, y: 0 }}

        end={{ x: 0, y: 1 }}

      >
        <StatusBar hidden />
        <SacredBackground />

        {/* Top bar */}
        <View style={[styles.topBar, { paddingTop: topPad + 6 }]}>
          <BackPill onPress={() => router.back()} size={28} bgColor="rgba(255,255,255,0.10)" iconOffsetX={-1} />
          <View style={styles.topTitleBlock}>
            <Text style={[styles.topTitle, { color: colors.foreground }]}>Agradecer es el inicio</Text>
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
          {hasPublished ? (
            <View style={[styles.publishedNotice, { backgroundColor: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.1)" }]}>
              <Text style={[styles.publishedNoticeText, { color: colors.mutedForeground }]}>
                Ya compartiste tu mensaje de hoy
              </Text>
            </View>
          ) : (
            <View style={[styles.composeCard, { backgroundColor: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.1)", borderWidth: 2 }]}>
              <View style={styles.composeTop}>
                <AuthorAvatar uri={photoUri} name={username} size={36} />
                <TextInput
                  ref={inputRef}
                  value={text}
                  onChangeText={(t) => setText(t.slice(0, MAX_CHARS))}
                  placeholder="¿Qué te gustaría compartir hoy?"
                  placeholderTextColor="#F9F9F9"
                  multiline
                  style={[styles.composeInput, { color: colors.foreground }]}
                  selectionColor={colors.primary}
                />
              </View>
              <View style={[styles.composeFooter, { borderTopColor: "rgba(255,255,255,0.1)" }]}>
                <Text style={[styles.charCount, { color: remaining < 40 ? "#D07060" : colors.mutedForeground }]}>
                  {remaining}
                </Text>
                <View style={styles.composeFooterRight}>
                  <View style={[styles.infoBadge, { borderColor: "rgba(255,255,255,0.08)" }]}>
                    <Feather name="clock" size={10} color={colors.mutedForeground} />
                    <Text style={[styles.infoBadgeText, { color: colors.mutedForeground }]}>24 h</Text>
                  </View>
                  <Pressable
                    onPress={handleSend}
                    disabled={!text.trim() || isSubmitting}
                    style={({ pressed }) => [
                      styles.sendBtn,
                      {
                        backgroundColor: text.trim() ? undefined : "rgba(212,175,55,0.20)",
                        overflow: "hidden",
                        opacity: pressed ? 0.8 : 1,
                      },
                    ]}
                  >
                    {text.trim() && <GoldGradientFill />}
                    {isSubmitting ? (
                      <ActivityIndicator size="small" color="#1B060F" />
                    ) : (
                      <Text style={[styles.sendBtnText, { color: text.trim() ? "#1B060F" : colors.mutedForeground }]}>
                        Compartir
                      </Text>
                    )}
                  </Pressable>
                </View>
              </View>
            </View>
          )}

          {/* Divider label */}
          <View style={styles.dividerRow}>
            <View style={[styles.dividerLine, { backgroundColor: "rgba(255,255,255,0.1)" }]} />
            <Text style={[styles.dividerLabel, { color: colors.mutedForeground }]}>
              {isLoading ? "CARGANDO..." : "HOY"}
            </Text>
            <View style={[styles.dividerLine, { backgroundColor: "rgba(255,255,255,0.1)" }]} />
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
                return (
                  <View
                    key={msg.id}
                    style={[
                      styles.msgCard,
                      { borderBottomColor: "rgba(255,255,255,0.1)" },
                    ]}
                  >
                    <AuthorAvatar uri={resolveAvatarUrl(msg.authorAvatarUrl)} name={msg.authorName} size={40} />
                    <View style={styles.msgRight}>
                      <View style={styles.msgHeader}>
                        <Text style={styles.msgAuthor}>
                          {msg.authorName ?? "Anónimo"}
                        </Text>
                        <Text style={styles.msgTime}>
                          {timeAgo(msg.createdAt)}
                        </Text>
                      </View>
                      <Text style={styles.msgContent}>
                        {msg.content}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      </LinearGradient>
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
  topTitle: { fontFamily: "Manrope", fontSize: 15, fontWeight: "700", letterSpacing: 0.2, textAlign: "center" },
  topSub: { fontFamily: "Manrope", fontSize: 11, marginTop: 2 },

  composeCard: {
    marginHorizontal: 20,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 24,
    overflow: "hidden",
  },
  publishedNotice: {
    marginHorizontal: 20,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 24,
    paddingHorizontal: 18,
    paddingVertical: 20,
    alignItems: "center",
  },
  publishedNoticeText: { fontFamily: "Manrope", fontSize: 13, textAlign: "center" },
  composeTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 14,
  },
  composeInput: {
    fontFamily: "Manrope",
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
  charCount: { fontFamily: "Manrope", fontSize: 11 },
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
  infoBadgeText: { fontFamily: "Manrope", fontSize: 10 },
  sendBtn: {
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 8,
    minWidth: 90,
    alignItems: "center",
  },
  sendBtnText: { fontFamily: "Manrope", fontSize: 13, fontWeight: "700" },

  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  dividerLine: { flex: 1, height: 1 },
  dividerLabel: { fontFamily: "Manrope", fontSize: 10, fontWeight: "700", letterSpacing: 1.2 },

  emptyState: { alignItems: "center", paddingTop: 56, gap: 12, paddingHorizontal: 32 },
  emptyTitle: { fontFamily: "Manrope", fontSize: 15, fontWeight: "700", textAlign: "center" },
  emptyText: { fontFamily: "Manrope", fontSize: 13, textAlign: "center", lineHeight: 20 },

  feedList: { paddingHorizontal: 20 },
  msgCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  msgRight: { flex: 1 },
  msgHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 10,
    marginBottom: 6,
  },
  msgAuthor: { fontFamily: "Manrope", fontSize: 13, fontWeight: "600", color: "#F4F4F4" },
  msgTime: { fontFamily: "Manrope", fontSize: 10, color: "#F4F4F4" },
  msgContent: { fontFamily: "Manrope", fontSize: 14, lineHeight: 20, color: "#F9F9F9" },
});
