import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Image } from "expo-image";
import { BLUR_PLACEHOLDER, IMAGE_TRANSITION } from "@/constants/imagePlaceholder";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SacredBackground } from "@/components/SacredBackground";
import { SessionCard } from "@/components/SessionCard";
import { CommunityMixesCarousel } from "@/components/CommunityMixesCarousel";
import { CATEGORIES, getPrimaryCategories, getSecondaryCategories } from "@/data/categories";
import { SESSIONS } from "@/data/sessions";
import { SERIES } from "@/data/series";
import { TAG_CARDS, TAGS_PREVIEW_COUNT } from "@/data/tags";
import { usePlayer } from "@/context/PlayerContext";
import { usePremium } from "@/context/PremiumContext";
import { useColors } from "@/hooks/useColors";

// Sección "Programas" oculta temporalmente — se lanzará más adelante.
// Poner en true para volver a mostrarla.
const SHOW_PROGRAMAS = false;

const { width } = Dimensions.get("window");
const H_PAD = 20;
const GAP = 10;
const PRIMARY_W = (width - H_PAD * 2 - GAP) / 2;
const TAG_W = (width - H_PAD * 2 - GAP) / 2;
const TAG_H = 130;


const TIME_BUCKETS = [
  { label: "5 min",  min: 0,   max: 5   },
  { label: "10 min", min: 6,   max: 10  },
  { label: "15 min", min: 11,  max: 15  },
  { label: "20 min", min: 16,  max: 20  },
  { label: "30 min", min: 21,  max: 30  },
  { label: "30+ min",min: 31,  max: 9999},
];

export default function ExploreScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const { history, playSession, getSessionProgress, sessionProgress } = usePlayer();
  const { isPremium } = usePremium();

  const historySessions = history
    .map((entry) => ({
      session: SESSIONS.find((s) => s.id === entry.sessionId),
      playedAt: entry.playedAt,
    }))
    .filter((e): e is { session: NonNullable<typeof e.session>; playedAt: string } => !!e.session)
    .slice(0, 20);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const filteredSessions = SESSIONS.filter((s) => {
    if (s.categoryId === "sabiduria-dia") return false;
    if (!query) return false;
    const q = query.toLowerCase();
    return (
      s.title.toLowerCase().includes(q) ||
      s.categoryLabel.toLowerCase().includes(q) ||
      s.subtitle.toLowerCase().includes(q)
    );
  });

  function handleTimeBucket(bucket: typeof TIME_BUCKETS[number]) {
    router.push({
      pathname: "/medita-tiempo",
      params: { min: String(bucket.min), max: String(bucket.max), label: bucket.label },
    } as never);
  }

  const primaryCats = getPrimaryCategories();
  const secondaryCats = getSecondaryCategories();

  // Pick the most recent session that still has saved progress (unfinished).
  // Fall back to the most recent history entry if none qualifies.
  const lastSession =
    historySessions.find((e) => {
      const p = sessionProgress[e.session.id] ?? 0;
      return p > 0 && p < 0.97;
    })?.session ??
    historySessions[0]?.session ??
    null;
  const lastSessionProgress = lastSession ? getSessionProgress(lastSession.id) : 0;
  const lastSessionLocked = !!lastSession?.isPremium && !isPremium;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />
      <SacredBackground variant="solid" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 160 + bottomPad, paddingTop: topPad + 12 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={[styles.pageTitle, { color: colors.foreground }]}>Biblioteca</Text>
        </View>

        {/* ── Search bar ── */}
        <View style={[styles.searchBar, { backgroundColor: "#090E17", borderColor: "transparent" }]}>
          <Feather name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Buscar sesiones, músicas, sonidos..."
            placeholderTextColor={colors.mutedForeground}
            style={[styles.searchInput, { color: colors.foreground }]}
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery("")}>
              <Feather name="x" size={16} color={colors.mutedForeground} />
            </Pressable>
          )}
        </View>

        {/* ── Search results ── */}
        {query.length > 0 ? (
          <View style={styles.section}>
            <Text style={[styles.resultsLabel, { color: colors.mutedForeground }]}>
              {filteredSessions.length} sesión{filteredSessions.length !== 1 ? "es" : ""} encontrada{filteredSessions.length !== 1 ? "s" : ""}
            </Text>
            {filteredSessions.map((s) => (
              <SessionCard
                key={s.id}
                session={s}
                horizontal
              />
            ))}
            {filteredSessions.length === 0 && (
              <View style={styles.emptyState}>
                <Feather name="search" size={36} color={colors.border} />
                <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Sin resultados</Text>
                <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
                  Prueba con otro término
                </Text>
              </View>
            )}
          </View>
        ) : (
          <>
            {/* ── Continúa escuchando (sin título; el reproductor basta) ── */}
            <View style={styles.section}>
              {lastSession ? (
                <Pressable
                  onPress={() =>
                    router.push(
                      (lastSessionLocked
                        ? "/membresia"
                        : `/session/${lastSession.id}`) as never,
                    )
                  }
                  style={({ pressed }) => [
                    styles.continueCard,
                    { backgroundColor: "#090E17", opacity: pressed ? 0.85 : 1 },
                  ]}
                >
                  <Image
                    source={lastSession.image as number}
                    style={styles.continueImg}
                    contentFit="cover"
                    placeholder={BLUR_PLACEHOLDER}
                    transition={IMAGE_TRANSITION}
                  />
                  <View style={styles.continueMeta}>
                    <Text style={[styles.continueKicker, { color: colors.primary }]}>
                      {lastSessionProgress > 0
                        ? `RETOMA · ${Math.round(lastSessionProgress * 100)}% ESCUCHADO`
                        : "RETOMA DONDE LO DEJASTE"}
                    </Text>
                    <Text style={[styles.continueTitle, { color: colors.foreground }]} numberOfLines={2}>
                      {lastSession.title}
                    </Text>
                    <Text style={[styles.continueSub, { color: colors.mutedForeground }]} numberOfLines={1}>
                      {lastSession.categoryLabel} · {lastSession.durationLabel}
                    </Text>
                    {lastSessionProgress > 0 && (
                      <View style={[styles.continueProgressTrack, { backgroundColor: "rgba(182,149,95,0.2)" }]}>
                        <View
                          style={[
                            styles.continueProgressFill,
                            {
                              width: `${Math.min(100, lastSessionProgress * 100)}%`,
                              backgroundColor: colors.primary,
                            },
                          ]}
                        />
                      </View>
                    )}
                  </View>
                  <View style={[styles.continuePlay, { backgroundColor: "#3A2417" }]}>
                    <Feather
                      name={lastSessionLocked ? "lock" : "play"}
                      size={16}
                      color="#FFFFFF"
                      style={lastSessionLocked ? undefined : { marginLeft: 2 }}
                    />
                  </View>
                </Pressable>
              ) : (
                <View
                  style={[
                    styles.continuePlaceholder,
                    { backgroundColor: "#090E17", borderColor: "transparent" },
                  ]}
                >
                  <View
                    style={[styles.continuePlaceholderIcon, { backgroundColor: "rgba(182,149,95,0.12)" }]}
                  >
                    <Feather name="headphones" size={20} color={colors.primary} />
                  </View>
                  <Text style={[styles.continuePlaceholderText, { color: colors.mutedForeground }]}>
                    Acá se mostrará la sesión que estabas escuchando
                  </Text>
                </View>
              )}
            </View>

            {/* ── ¿Cuánto tiempo tienes hoy? ── */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>¿Cuánto tiempo tienes hoy?</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.timeRow}
              >
                {TIME_BUCKETS.map((bucket) => (
                  <Pressable
                    key={bucket.label}
                    onPress={() => handleTimeBucket(bucket)}
                    style={({ pressed }) => [
                      styles.timeChip,
                      {
                        backgroundColor: "#0E1929",
                        opacity: pressed ? 0.6 : 1,
                      },
                    ]}
                  >
                    <Feather
                      name="clock"
                      size={13}
                      color="white"
                      style={styles.timeIcon}
                    />
                    <Text style={[styles.timeLabel, { color: colors.foreground }]}>{bucket.label}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            {/* ── Otras Temáticas ── */}
            <View style={styles.section}>
              <View style={styles.sectionRow}>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                  Otras Temáticas
                </Text>
                <Pressable onPress={() => router.push("/todas-las-tematicas" as never)} hitSlop={8}>
                  <Text style={[styles.verTodasLink, { color: colors.accent }]}>Ver todas</Text>
                </Pressable>
              </View>
              <View style={[styles.tagGrid, { marginTop: 14 }]}>
                {TAG_CARDS.slice(0, TAGS_PREVIEW_COUNT).map((tag) => (
                  <Pressable
                    key={tag.id}
                    onPress={() => router.push(`/tag/${tag.id}` as never)}
                    style={({ pressed }) => [styles.tagCard, { opacity: pressed ? 0.85 : 1 }]}
                  >
                    <Image
                      source={tag.image}
                      style={{ position: "absolute", width: TAG_W, height: TAG_H }}
                      contentFit="cover"
                      cachePolicy="memory-disk"
                      placeholder={BLUR_PLACEHOLDER}
                      transition={IMAGE_TRANSITION}
                    />
                    <LinearGradient
                      colors={["rgba(10,6,4,0.22)", "rgba(10,6,4,0.72)"]}
                      style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
                    />
                    <Text style={styles.tagLabel}>{tag.label}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* ── Historial ── */}
            <View style={styles.section}>
              <View style={styles.sectionRow}>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                  Historial
                </Text>
                {historySessions.length > 5 && (
                  <Pressable onPress={() => router.push("/historial" as never)} hitSlop={8}>
                    <Text style={[styles.verTodasLink, { color: colors.accent }]}>Ver todo</Text>
                  </Pressable>
                )}
              </View>

              {historySessions.length === 0 ? (
                <View style={[styles.historyEmpty, { borderColor: "rgba(182,149,95,0.15)", backgroundColor: colors.card }]}>
                  <Feather name="clock" size={28} color={colors.primary} style={{ marginBottom: 10 }} />
                  <Text style={[styles.historyEmptyTitle, { color: colors.foreground }]}>
                    Aún no hay sesiones
                  </Text>
                  <Text style={[styles.historyEmptySub, { color: colors.mutedForeground }]}>
                    Cuando empieces a escuchar, tu historial aparecerá aquí.
                  </Text>
                </View>
              ) : (
                <View style={{ gap: 8 }}>
                  {historySessions.slice(0, 5).map(({ session, playedAt }) => {
                    const date = new Date(playedAt);
                    const dateLabel = date.toLocaleDateString("es", { day: "numeric", month: "short" });
                    return (
                      <View key={`${session.id}-${playedAt}`} style={styles.historyRow}>
                        <View style={{ flex: 1 }}>
                          <SessionCard session={session} horizontal cardBg="#090E17" noBorder />
                          <Text style={[styles.historyDateOverlay, { color: colors.mutedForeground }]}>{dateLabel}</Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>

            {/* ── Mezclas de la comunidad ── */}
            <CommunityMixesCarousel />

            {/* ── Programas (oculto temporalmente) ── */}
            {SHOW_PROGRAMAS && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Programas</Text>
              <Text style={[styles.sectionSub, { color: colors.mutedForeground }]}>
                Caminos guiados de varios días para crear hábito
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.seriesRow}
              >
                {SERIES.map((s) => (
                  <Pressable
                    key={s.id}
                    onPress={() => router.push(`/serie/${s.id}` as never)}
                    style={({ pressed }) => [styles.seriesCard, { opacity: pressed ? 0.85 : 1 }]}
                  >
                    <Image
                      source={s.image}
                      style={StyleSheet.absoluteFill}
                      contentFit="cover"
                      placeholder={BLUR_PLACEHOLDER}
                      transition={IMAGE_TRANSITION}
                    />
                    <LinearGradient
                      colors={["rgba(10,6,4,0.15)", "rgba(10,6,4,0.85)"]}
                      style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
                    />
                    <View style={styles.seriesContent}>
                      <Text style={[styles.seriesKicker, { color: s.accentColor }]}>
                        {s.subtitle.toUpperCase()}
                      </Text>
                      <Text style={styles.seriesTitle} numberOfLines={2}>{s.title}</Text>
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
            )}

          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },

  header: { paddingHorizontal: H_PAD, marginBottom: 18 },
  pageTitle: { fontSize: 30, fontWeight: "700", letterSpacing: 0.5, marginBottom: 4 },

  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: H_PAD,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
    marginBottom: 24,
  },
  searchInput: { flex: 1, fontSize: 14 },

  section: { paddingHorizontal: H_PAD, marginBottom: 50 },
  sectionTitle: { fontSize: 18, fontWeight: "700", letterSpacing: 0.3, marginBottom: 6 },
  sectionSub: { fontSize: 12, marginBottom: 16 },

  resultsLabel: { fontSize: 12, marginBottom: 12 },
  emptyState: { alignItems: "center", paddingVertical: 48, gap: 10 },
  emptyTitle: { fontSize: 16, fontWeight: "600" },
  emptySub: { fontSize: 13 },

  // Primary categories
  primaryRow: {
    flexDirection: "row",
    gap: GAP,
    marginBottom: 10,
  },
  primaryCard: {
    height: 148,
    borderRadius: 18,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    paddingVertical: 16,
  },
  primaryBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 18,
  },
  primaryIcon: { marginBottom: 12 },
  primaryLabel: {
    color: "#F5EDD8",
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 18,
  },

  // Secondary categories
  secondaryRow: {
    flexDirection: "row",
    gap: GAP,
  },
  secondaryCard: {
    flex: 1,
    height: 100,
    borderRadius: 14,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
    paddingVertical: 12,
  },
  secondaryBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 14,
  },
  secondaryIcon: { marginBottom: 8 },
  secondaryLabel: {
    color: "#F5EDD8",
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 15,
  },

  // Tag cards — "Otras Categorías"
  tagGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: GAP,
  },
  tagCard: {
    width: TAG_W,
    height: TAG_H,
    borderRadius: 16,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  tagLabel: {
    color: "#F5EDD8",
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 20,
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  // Historial
  historyEmpty: {
    borderRadius: 18,
    borderWidth: 1,
    paddingVertical: 36,
    paddingHorizontal: 24,
    alignItems: "center",
    marginTop: 4,
  },
  videosEmpty: {
    borderRadius: 18,
    borderWidth: 1,
    paddingVertical: 36,
    paddingHorizontal: 24,
    alignItems: "center",
    marginTop: 12,
  },
  historyEmptyTitle: { fontSize: 16, fontWeight: "700", marginBottom: 8 },
  historyEmptySub: { fontSize: 13, textAlign: "center", lineHeight: 19 },
  historyRow: {},
  historyDateOverlay: {
    position: "absolute",
    top: 10,
    right: 12,
    fontSize: 10,
    fontWeight: "600",
  },
  verTodoBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 14,
    marginTop: 4,
  },
  verTodoText: { fontSize: 14, fontWeight: "600" },
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  verTodasLink: { fontSize: 13, fontWeight: "600" },

  // Continúa escuchando
  continueCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    padding: 10,
    gap: 12,
    marginTop: 8,
  },
  continueImg: {
    width: 72,
    height: 72,
    borderRadius: 12,
  },
  continuePlaceholder: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    padding: 14,
    gap: 12,
    marginTop: 8,
    borderWidth: 1,
    borderStyle: "dashed",
  },
  continuePlaceholderIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  continuePlaceholderText: {
    flex: 1,
    fontSize: 13.5,
    lineHeight: 19,
  },
  continueMeta: { flex: 1 },
  continueKicker: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  continueTitle: {
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 20,
    marginBottom: 3,
  },
  continueSub: { fontSize: 12, lineHeight: 16 },
  continueProgressTrack: {
    height: 3,
    borderRadius: 2,
    marginTop: 8,
    overflow: "hidden",
  },
  continueProgressFill: {
    height: 3,
    borderRadius: 2,
  },
  continuePlay: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  // Programas
  seriesRow: {
    gap: 12,
    paddingRight: 4,
    paddingTop: 12,
  },
  seriesCard: {
    width: 220,
    height: 140,
    borderRadius: 16,
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  seriesContent: {
    padding: 14,
  },
  seriesKicker: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  seriesTitle: {
    color: "#F5EDD8",
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 21,
  },

  // Time buckets
  timeRow: {
    flexDirection: "row",
    gap: 8,
    paddingRight: 4,
    marginTop: 6,
  },
  timeChip: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
    justifyContent: "center",
  },
  timeIcon: { marginRight: 5 },
  timeLabel: { fontSize: 13, fontWeight: "600" },
});
