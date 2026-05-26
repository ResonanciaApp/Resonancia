import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  NativeScrollEvent,
  NativeSyntheticEvent,
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
import { useUserProfile } from "@/context/UserProfileContext";
import { useQueryClient } from "@tanstack/react-query";

const MAX_CHARS = 369;
const GRADIENT: [string, string] = ["#111E16", "#0D1810"];
const ACCENT = "#D4709A";

const HOW_IT_WORKS = [
  {
    icon: "edit-3" as const,
    title: "Escribís desde el corazón",
    body: "Compartís lo que sentís, pensás o querés soltar. Sin nombre, sin juicio.",
  },
  {
    icon: "globe" as const,
    title: "La comunidad lo recibe",
    body: "Tu mensaje aparece en el feed de quienes abrieron Diario hoy. Podés dar ❤️ a los que te resuenen.",
  },
  {
    icon: "clock" as const,
    title: "Se va solo a las 24 horas",
    body: "Cada mensaje tiene 24 horas de vida. Después desaparece para siempre. Sin rastro, sin historial.",
  },
];

const WHY_ITEMS = [
  {
    icon: "heart" as const,
    text: "Porque a veces necesitamos soltar algo sin que nadie lo sepa, pero sintiendo que alguien lo recibe.",
  },
  {
    icon: "users" as const,
    text: "Porque la soledad se disuelve cuando descubrís que otros sienten lo mismo que vos.",
  },
  {
    icon: "edit-2" as const,
    text: "Porque lo que escribimos y luego soltamos nos libera más que lo que guardamos.",
  },
];
const WINDOW_MS = 24 * 60 * 60 * 1000;
const LIST_MAX_H = 370;
const TRACK_W = 3;
const THUMB_MIN_H = 32;

function timeAgo(iso: string | Date): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "ahora mismo";
  if (mins < 60) return `hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  return `hace ${hrs} h`;
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

function todayLabel(): string {
  const now = new Date();
  const day = now.getDate();
  const month = now
    .toLocaleDateString("es-ES", { month: "short" })
    .toUpperCase()
    .replace(".", "");
  return `${day} ${month}`;
}

export function MensajesAnonimosPanel() {
  const colors = useColors();
  const queryClient = useQueryClient();
  const { recordSentMessage } = useUserProfile();
  const [text, setText] = useState("");
  const [showFeed, setShowFeed] = useState(true);
  const [showInfo, setShowInfo] = useState(false);
  const [likedIds, setLikedIds] = useState<Set<number>>(new Set());

  // Scrollbar state
  const [scrollY, setScrollY] = useState(0);
  const [contentH, setContentH] = useState(0);
  const [listH, setListH] = useState(LIST_MAX_H);
  const scrollRef = useRef<ScrollView>(null);

  const { data, isLoading, refetch, isRefetching } = useGetMessages(
    { page: 1 },
    { query: { refetchInterval: 5 * 60_000 } },
  );

  const { mutate: submit, isPending: isSubmitting } = useCreateMessage({
    mutation: {
      onSuccess: (created) => {
        setText("");
        recordSentMessage(created.id);
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

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setScrollY(e.nativeEvent.contentOffset.y);
  };

  // Thumb geometry
  const scrollable = contentH > listH;
  const thumbH = scrollable
    ? Math.max(THUMB_MIN_H, (listH / contentH) * listH)
    : listH;
  const maxThumbOffset = listH - thumbH;
  const maxScroll = contentH - listH;
  const thumbTop = scrollable && maxScroll > 0
    ? (scrollY / maxScroll) * maxThumbOffset
    : 0;

  const remaining = MAX_CHARS - text.length;
  const allMessages = data?.messages ?? [];
  const total = data?.total ?? 0;
  const sortedByLikes = [...allMessages].sort((a, b) => b.likes - a.likes);

  const feedLabel = isLoading
    ? "CARGANDO..."
    : `HOY · ${todayLabel()} · ${total} ${total === 1 ? "MENSAJE" : "MENSAJES"}`;

  return (
    <>
    <View
      style={[
        styles.panel,
        { backgroundColor: colors.card },
      ]}
    >
      {/* ── Header ── */}
      <LinearGradient
        colors={GRADIENT}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerLeft}>
          <View style={styles.headerIconBg}>
            <Feather name="users" size={18} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.headerTitleRow}>
              <Text style={styles.headerTitle}>Mensajes del Alma</Text>
              <View style={styles.cycleBadge}>
                <Feather name="clock" size={9} color="rgba(237,225,211,0.7)" />
                <Text style={styles.cycleBadgeText}>24 h</Text>
              </View>
            </View>
            <Text style={styles.headerSubtitle}>
              Anónimo · se borran solos cada día
            </Text>
          </View>
        </View>
        <Pressable
          onPress={() => router.push("/mensajes-del-alma" as never)}
          style={styles.infoBtn}
          hitSlop={8}
        >
          <Feather name="info" size={15} color="#C8A860" />
        </Pressable>
      </LinearGradient>

      {/* ── Compose ── */}
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

      {/* ── Feed toggle row ── */}
      <Pressable
        onPress={() => setShowFeed((v) => !v)}
        style={({ pressed }) => [
          styles.feedToggleRow,
          {
            borderTopColor: colors.border,
            backgroundColor: pressed ? "rgba(212,112,154,0.06)" : "transparent",
          },
        ]}
      >
        <Text style={[styles.feedToggleLabel, { color: colors.mutedForeground }]}>
          {feedLabel}
        </Text>
        <View style={styles.feedToggleRight}>
          {isRefetching && (
            <ActivityIndicator
              size="small"
              color={ACCENT}
              style={{ marginRight: 6 }}
            />
          )}
          <Feather
            name={showFeed ? "chevron-up" : "chevron-down"}
            size={16}
            color="#FFFFFF"
          />
        </View>
      </Pressable>

      {showInfo && (
        <View style={[styles.infoSection, { borderTopColor: "rgba(212,112,154,0.15)" }]}>
          {/* Intro */}
          <Text style={[styles.infoIntro, { color: "rgba(255,214,235,0.85)" }]}>
            Un espacio anónimo para soltar, compartir y conectar con la comunidad. Cada mensaje vive 24 horas y luego desaparece.
          </Text>

          {/* Cómo funciona */}
          <Text style={[styles.infoSubtitle, { color: "#FFD6EB" }]}>¿Cómo funciona?</Text>
          <View style={styles.infoList}>
            {HOW_IT_WORKS.map((step, i) => (
              <View key={i} style={[styles.infoStepCard, { backgroundColor: "rgba(255,255,255,0.06)", borderColor: "rgba(212,112,154,0.18)" }]}>
                <View style={[styles.infoStepIcon, { backgroundColor: `${ACCENT}22` }]}>
                  <Feather name={step.icon} size={15} color={ACCENT} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.infoStepTitle, { color: "#FFD6EB" }]}>{step.title}</Text>
                  <Text style={[styles.infoStepBody, { color: "rgba(255,214,235,0.7)" }]}>{step.body}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Por qué existe */}
          <Text style={[styles.infoSubtitle, { color: "#FFD6EB", marginTop: 16 }]}>¿Por qué existe?</Text>
          <View style={[styles.infoQuote, { borderLeftColor: ACCENT, backgroundColor: "rgba(255,255,255,0.06)" }]}>
            <Text style={[styles.infoQuoteText, { color: "rgba(255,214,235,0.85)" }]}>
              "¿Qué pasaría si pudieras soltar algo hoy, sin que nadie sepa que fuiste vos, pero sintiendo que alguien lo recibió?"
            </Text>
          </View>
          <View style={styles.infoList}>
            {WHY_ITEMS.map((item, i) => (
              <View key={i} style={styles.infoWhyRow}>
                <View style={[styles.infoWhyIcon, { backgroundColor: `${ACCENT}18`, borderColor: `${ACCENT}30` }]}>
                  <Feather name={item.icon} size={12} color={ACCENT} />
                </View>
                <Text style={[styles.infoWhyText, { color: "rgba(255,214,235,0.75)" }]}>{item.text}</Text>
              </View>
            ))}
          </View>

          {/* Espacio seguro */}
          <View style={[styles.infoRules, { backgroundColor: "rgba(255,255,255,0.06)", borderColor: "rgba(182,149,95,0.2)" }]}>
            <View style={styles.infoRulesHeader}>
              <Feather name="shield" size={13} color="rgba(255,214,235,0.6)" />
              <Text style={[styles.infoRulesTitle, { color: "#FFD6EB" }]}>Espacio seguro</Text>
            </View>
            <Text style={[styles.infoRulesBody, { color: "rgba(255,214,235,0.65)" }]}>
              Este es un espacio de respeto y cuidado. Los mensajes que contengan violencia, discriminación o contenido dañino serán eliminados. Compartí desde la vulnerabilidad, no desde el ataque.
            </Text>
          </View>
        </View>
      )}

      {/* ── Expandable feed ── */}
      {showFeed && (
        <View style={[styles.feed, { borderTopColor: colors.border }]}>
          {isLoading ? (
            <ActivityIndicator color={ACCENT} style={{ marginVertical: 24 }} />
          ) : sortedByLikes.length === 0 ? (
            <View style={styles.emptyState}>
              <Feather name="edit-2" size={28} color="#C8A860" />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                Sé la primera persona en compartir algo hoy
              </Text>
              <Text style={[styles.emptyHint, { color: colors.mutedForeground }]}>
                Los mensajes duran 24 h y luego desaparecen
              </Text>
            </View>
          ) : (
            <View style={styles.listWrapper}>
              {/* Scroll track + thumb */}
              {scrollable && (
                <View style={[styles.scrollTrack, { backgroundColor: `${ACCENT}20` }]}>
                  <View
                    style={[
                      styles.scrollThumb,
                      { backgroundColor: `${ACCENT}90`, top: thumbTop, height: thumbH },
                    ]}
                  />
                </View>
              )}

              <ScrollView
                ref={scrollRef}
                nestedScrollEnabled
                showsVerticalScrollIndicator={false}
                style={styles.messagesList}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                onContentSizeChange={(_, h) => setContentH(h)}
                onLayout={(e) => setListH(e.nativeEvent.layout.height)}
                refreshControl={
                  <RefreshControl
                    refreshing={isRefetching}
                    onRefresh={refetch}
                    tintColor={ACCENT}
                  />
                }
              >
                {sortedByLikes.map((msg) => {
                  const msLeft =
                    new Date(msg.createdAt).getTime() + WINDOW_MS - Date.now();
                  const isExpiringSoon = msLeft < 3 * 60 * 60 * 1000;
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
                          <Text
                            style={[
                              styles.messageTime,
                              { color: colors.mutedForeground },
                            ]}
                          >
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
                            color={
                              likedIds.has(msg.id)
                                ? "#E07070"
                                : colors.mutedForeground
                            }
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
            </View>
          )}
        </View>
      )}
    </View>

    {/* ── Descubre más ── */}
    <Pressable
      onPress={() => setShowInfo((v) => !v)}
      style={({ pressed }) => [
        styles.discoverRow,
        { opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <Feather name="info" size={14} color="#FFFFFF" />
      <Text style={[styles.discoverLabel, { color: "#FFFFFF" }]}>
        {showInfo ? "Cerrar" : "Descubre más sobre este espacio"}
      </Text>
    </Pressable>
    </>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderRadius: 20,
    overflow: "hidden",
  },

  // Header
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
    backgroundColor: "rgba(138,184,148,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  headerTitle: {
    color: "#EDE1D3",
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 20,
  },
  cycleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(237,225,211,0.10)",
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  cycleBadgeText: {
    color: "rgba(237,225,211,0.7)",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    color: "rgba(237,225,211,0.50)",
    fontSize: 11,
    marginTop: 2,
  },
  infoBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },

  // Compose
  composeArea: { padding: 14 },
  textInput: {
    minHeight: 88,
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

  // Feed toggle row
  feedToggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  feedToggleLabel: {
    fontSize: 10,
    letterSpacing: 1.4,
    fontWeight: "700",
  },
  feedToggleRight: {
    flexDirection: "row",
    alignItems: "center",
  },

  // Feed
  feed: { padding: 14 },

  listWrapper: {
    position: "relative",
  },

  // Custom scrollbar
  scrollTrack: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: TRACK_W,
    borderRadius: TRACK_W / 2,
    zIndex: 10,
  },
  scrollThumb: {
    position: "absolute",
    width: TRACK_W,
    borderRadius: TRACK_W / 2,
  },

  messagesList: { maxHeight: LIST_MAX_H, paddingRight: 10 },

  emptyState: { alignItems: "center", paddingVertical: 24, gap: 8 },
  emptyText: { fontSize: 13, textAlign: "center", lineHeight: 20 },
  emptyHint: { fontSize: 11, textAlign: "center", opacity: 0.6 },

  messageCard: {
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

  // Descubre más
  discoverRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 10,
    paddingVertical: 6,
  },
  discoverLabel: { fontSize: 12, fontWeight: "700", letterSpacing: 0.3 },

  infoSection: {
    borderTopWidth: 1,
    padding: 16,
    gap: 12,
  },
  infoIntro: { fontSize: 13, lineHeight: 20 },
  infoSubtitle: { fontSize: 14, fontWeight: "700", letterSpacing: 0.2 },
  infoList: { gap: 8 },
  infoStepCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    borderRadius: 14,
    padding: 12,
  },
  infoStepIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  infoStepTitle: { fontSize: 13, fontWeight: "700", marginBottom: 3 },
  infoStepBody: { fontSize: 12, lineHeight: 18 },

  infoQuote: {
    borderLeftWidth: 3,
    paddingLeft: 14,
    paddingVertical: 10,
    paddingRight: 10,
    borderRadius: 4,
  },
  infoQuoteText: { fontSize: 13, lineHeight: 20, fontStyle: "italic" },

  infoWhyRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  infoWhyIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 1,
  },
  infoWhyText: { fontSize: 12, lineHeight: 19, flex: 1 },

  infoRules: {
    borderRadius: 12,
    padding: 14,
    marginTop: 4,
  },
  infoRulesHeader: { flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 8 },
  infoRulesTitle: { fontSize: 13, fontWeight: "700" },
  infoRulesBody: { fontSize: 12, lineHeight: 19 },
});
