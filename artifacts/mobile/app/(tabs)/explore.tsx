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
  useWindowDimensions,
  View,
} from "react-native";
import { Image } from "expo-image";
import { BLUR_PLACEHOLDER, IMAGE_TRANSITION } from "@/constants/imagePlaceholder";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useGetPopularSessions, getGetPopularSessionsQueryKey } from "@workspace/api-client-react";
import { SacredBackground } from "@/components/SacredBackground";
import { SessionCard } from "@/components/SessionCard";
import { CommunityMixesCarousel } from "@/components/CommunityMixesCarousel";
import { CATEGORIES, getPrimaryCategories, getSecondaryCategories } from "@/data/categories";
import { SESSIONS, getSessionById } from "@/data/sessions";
import { getArtist } from "@/data/artists";
import { getGuide } from "@/data/guides";
import { SERIES } from "@/data/series";
import { TAG_CARDS, TAGS_PREVIEW_COUNT } from "@/data/tags";
import { TEMAS } from "@/data/temas";
import { usePlayer } from "@/context/PlayerContext";
import { usePremium } from "@/context/PremiumContext";
import { useColors } from "@/hooks/useColors";

const BG_GRADIENT = ["#090D20", "#080A18", "#06070F"] as const;

// Sección "Programas" oculta temporalmente — se lanzará más adelante.
// Poner en true para volver a mostrarla.
const SHOW_PROGRAMAS = false;

const { width } = Dimensions.get("window");
const H_PAD = 20;
const GAP = 10;
const PRIMARY_W = (width - H_PAD * 2 - GAP) / 2;
const TAG_W = (width - H_PAD * 2 - GAP) / 2;
const TAG_H = 130;
const TEMA_W = (width - H_PAD * 2 - GAP * 2) / 3;
const CONTINUE_CARD_W = width - H_PAD * 2 - 48;

const MAIN_CAT_IDS = [
  "sonidos-ancestrales",
  "meditaciones-guiadas",
  "musica-sonidos",
  "podcast",
] as const;

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
  const { history, getSessionProgress } = usePlayer();
  const { isPremium } = usePremium();

  const { data: popular } = useGetPopularSessions(
    { limit: 10 },
    { query: { queryKey: getGetPopularSessionsQueryKey({ limit: 10 }), staleTime: 5 * 60_000 } },
  );
  const popularSessions = (popular?.sessions ?? [])
    .map((s) => getSessionById(s.id))
    .filter((s): s is NonNullable<ReturnType<typeof getSessionById>> => s != null);

  const historySessions = history
    .map((entry) => ({
      session: SESSIONS.find((s) => s.id === entry.sessionId),
      playedAt: entry.playedAt,
    }))
    .filter((e): e is { session: NonNullable<typeof e.session>; playedAt: string } => !!e.session)
    .slice(0, 20);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const { width: winW } = useWindowDimensions();
  const contentW = Platform.OS === "web" ? Math.min(winW, 480) : winW;
  const temaW = (contentW - H_PAD * 2 - GAP * 2) / 3;

  const filteredSessions = SESSIONS.filter((s) => {
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

  // "Sigue escuchando" por categoría: la última sesión escuchada de cada
  // categoría principal. Si no hay historial, la card muestra la portada de la
  // categoría con un placeholder y al tocar abre la categoría.
  const continueByCategory = MAIN_CAT_IDS.flatMap((catId) => {
    const cat = CATEGORIES.find((c) => c.id === catId);
    if (!cat) return [];
    // Buscar en TODO el historial (no en el slice de 20) la última sesión de la categoría.
    let session: (typeof SESSIONS)[number] | null = null;
    for (const entry of history) {
      const s = SESSIONS.find((x) => x.id === entry.sessionId);
      if (s && s.categoryId === catId) {
        session = s;
        break;
      }
    }
    const coverSession = SESSIONS.find((s) => s.categoryId === catId);
    const coverImage = (session?.image ?? coverSession?.image) as number | undefined;
    return [{ cat, session, coverImage }];
  });

  return (
    <LinearGradient

      style={styles.root}

      colors={BG_GRADIENT}

      locations={[0, 0.5, 1]}

      start={{ x: 0, y: 0 }}

      end={{ x: 0, y: 1 }}

    >
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
          <View style={styles.headerRow}>
            <Text style={[styles.pageTitle]}>Explora</Text>
            <Pressable
              onPress={() => router.push("/historial" as never)}
              hitSlop={12}
              style={styles.headerClockBtn}
            >
              <Feather name="clock" size={18} color="#FFFFFF" />
            </Pressable>
          </View>
          <Text style={[styles.pageSub, { color: colors.mutedForeground }]}>Tu biblioteca expansiva</Text>
        </View>

        {/* ── Search bar ── */}
        <View style={[styles.searchBar, { backgroundColor: "rgba(255,255,255,0.03)", borderColor: "transparent" }]}>
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
            {/* ── 12 Temáticas ── */}
            <View style={[styles.section, { paddingHorizontal: H_PAD }]}>
              <View style={Platform.OS === "web" ? styles.temaGridWebWrap : undefined}>
                <View style={styles.temaGrid}>
                  {TEMAS.map((t) => (
                    <Pressable
                      key={t.id}
                      onPress={() => router.push((t.route ?? `/tema/${t.id}`) as never)}
                      style={({ pressed }) => [
                        styles.temaCard,
                        { width: temaW, height: temaW, backgroundColor: "rgba(255,255,255,0.03)" },
                        { opacity: pressed ? 0.75 : 1 },
                      ]}
                    >
                      {t.image != null ? (
                        <>
                          <Image
                            source={t.image}
                            style={styles.temaIcon}
                            contentFit="contain"
                          />
                          <Text style={[styles.temaLabel, { color: colors.foreground }]}>{t.label}</Text>
                        </>
                      ) : (
                        <>
                          <MaterialCommunityIcons name={t.icon} size={26} color={t.color} />
                          <Text style={[styles.temaLabel, { color: colors.foreground }]}>{t.label}</Text>
                        </>
                      )}
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>

            {/* ── ¿Cuánto tiempo tienes hoy? ── */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle]}>¿Cuánto tiempo tienes?</Text>
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
                        backgroundColor: "rgba(255,255,255,0.03)",
                        opacity: pressed ? 0.6 : 1,
                      },
                    ]}
                  >
                    <Feather
                      name="clock"
                      size={16}
                      color="#F3ECE1"
                      style={styles.timeIcon}
                    />
                    <Text style={[styles.timeLabel, { color: "#F3ECE1" }]}>{bucket.label}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            {/* ── Sigue escuchando (carrusel por categoría) ── */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { marginBottom: 12 }]}>Sigue escuchando</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginHorizontal: -H_PAD }}
                contentContainerStyle={{ paddingHorizontal: H_PAD, gap: 12 }}
              >
                {continueByCategory.map(({ cat, session, coverImage }) => {
                  const progress = session ? getSessionProgress(session.id) : 0;
                  const locked = !!session?.isPremium && !isPremium;
                  const author = session
                    ? session.guideId
                      ? getGuide(session.guideId).name
                      : getArtist(session.artistId).name
                    : "";
                  const handlePress = () => {
                    if (session) {
                      router.push((locked ? "/membresia" : `/session/${session.id}`) as never);
                    } else {
                      router.push(`/category/${cat.id}` as never);
                    }
                  };
                  return (
                    <Pressable
                      key={cat.id}
                      onPress={handlePress}
                      style={({ pressed }) => [
                        styles.continueCatCard,
                        { width: CONTINUE_CARD_W, opacity: pressed ? 0.85 : 1 },
                      ]}
                    >
                      <View style={styles.continueCatImageWrap}>
                        {coverImage ? (
                          <Image
                            source={coverImage}
                            style={styles.continueCatImage}
                            contentFit="cover"
                            placeholder={BLUR_PLACEHOLDER}
                            transition={IMAGE_TRANSITION}
                          />
                        ) : (
                          <View style={[styles.continueCatImage, { backgroundColor: cat.gradient[0] }]} />
                        )}
                        <View style={styles.continueCatBadge}>
                          <Text style={styles.continueCatBadgeText}>{cat.title}</Text>
                        </View>
                        {session && (
                          <View style={[styles.continueCatPlay, { backgroundColor: "rgba(214,168,91,0.92)" }]}>
                            <Feather
                              name={locked ? "lock" : "play"}
                              size={15}
                              color="#090F17"
                              style={locked ? undefined : { marginLeft: 2 }}
                            />
                          </View>
                        )}
                        {session && progress > 0 && (
                          <View
                            style={[
                              styles.continueCatTrack,
                              { backgroundColor: "rgba(214,168,91,0.20)" },
                            ]}
                          >
                            <View
                              style={[
                                styles.continueCatFill,
                                {
                                  width: `${Math.min(100, progress * 100)}%`,
                                  backgroundColor: colors.accent,
                                },
                              ]}
                            />
                          </View>
                        )}
                      </View>
                      {session ? (
                        <>
                          <Text
                            style={[styles.continueCatTitle, { color: colors.foreground }]}
                            numberOfLines={2}
                          >
                            {session.title}
                          </Text>
                          {!!author && (
                            <Text
                              style={[styles.continueCatAuthor, { color: colors.mutedForeground }]}
                              numberOfLines={1}
                            >
                              {author}
                            </Text>
                          )}
                        </>
                      ) : (
                        <Text
                          style={[styles.continueCatPlaceholder, { color: colors.mutedForeground }]}
                          numberOfLines={2}
                        >
                          Acá aparecerá la última sesión de {cat.title}
                        </Text>
                      )}
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {/* ── Mezclas de la comunidad ── */}
            <View style={{ marginBottom: 43 }}>
              <CommunityMixesCarousel />
            </View>

            {/* ── Otras Temáticas ── */}
            <View style={styles.section}>
              <View style={styles.sectionRow}>
                <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>
                  Otras Temáticas
                </Text>
              </View>
              <View style={styles.tagGrid}>
                {TAG_CARDS.slice(0, TAGS_PREVIEW_COUNT).map((tag) => (
                  <Pressable
                    key={tag.id}
                    onPress={() => router.push(`/tag/${tag.id}` as never)}
                    style={({ pressed }) => [styles.tagCard, { opacity: pressed ? 0.85 : 1 }]}
                  >
                    <View style={styles.tagImgWrap}>
                      <Image
                        source={tag.image}
                        style={StyleSheet.absoluteFill}
                        contentFit="cover"
                        cachePolicy="memory-disk"
                        placeholder={BLUR_PLACEHOLDER}
                        transition={IMAGE_TRANSITION}
                      />
                      <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(4,0,7,0.35)" }]} />
                    </View>
                    <Text style={styles.tagLabel}>{tag.label}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* ── Programas (oculto temporalmente) ── */}
            {SHOW_PROGRAMAS && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle]}>Programas</Text>
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
                      colors={["#090D20", "#080A18", "#06070F"]}
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
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },

  header: { paddingHorizontal: H_PAD, marginBottom: 18 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headerClockBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.03)", alignItems: "center", justifyContent: "center" },
  pageTitle: { fontSize: 30, fontWeight: "700", letterSpacing: 0.5, marginBottom: 4, color: "#FFFFFF" },
  pageSub:   { fontSize: 13, marginTop: 0 },

  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: H_PAD,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
    marginBottom: 43,
  },
  searchInput: { flex: 1, fontSize: 14 },

  section: { paddingHorizontal: H_PAD, marginBottom: 43 },
  sectionTitle: { fontSize: 20, fontWeight: "700", letterSpacing: 0.3, marginBottom: 7, color: "#FFFFFF" },
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
    color: "#FFFFFF",
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
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 15,
  },

  // Temáticas rápidas (9 bloques)
  temaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: GAP,
  },
  temaCard: {
    width: TEMA_W,
    height: TEMA_W,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  temaIcon: {
    width: 26,
    height: 26,
  },
  temaLabel: {
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 14,
  },
  temaGridWebWrap: {
    maxWidth: 480,
    alignSelf: "center" as const,
    width: "100%" as unknown as number,
  },

  // Tag cards — "Otras Categorías"
  tagGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: GAP,
    rowGap: 20,
  },
  tagCard: {
    width: TAG_W,
    alignItems: "center",
    gap: 8,
  },
  tagImgWrap: {
    width: "100%" as unknown as number,
    height: TAG_H,
    borderRadius: 16,
    overflow: "hidden",
  },
  verTodasBlock: {
    width: "100%",
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.03)",
    marginTop: GAP,
  },
  verTodasBlockText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#FFFFFF",
    letterSpacing: 0.2,
  },
  tagLabel: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 20,
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
    marginBottom: 11,
  },
  verTodasLink: { fontSize: 13, fontWeight: "400" },

  // Sigue escuchando (carrusel por categoría)
  continueCatCard: {},
  continueCatImageWrap: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: 14,
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  continueCatImage: { ...StyleSheet.absoluteFillObject, width: "100%", height: "100%" },
  continueCatBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "rgba(6,10,15,0.72)",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  continueCatBadgeText: { fontSize: 11, fontWeight: "700", color: "#FFFFFF" },
  continueCatPlay: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  continueCatTrack: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 4,
    overflow: "hidden",
  },
  continueCatFill: { height: 4 },
  continueCatTitle: {
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
    marginTop: 8,
    paddingHorizontal: 2,
  },
  continueCatAuthor: {
    fontSize: 11,
    marginTop: 4,
    paddingHorizontal: 2,
  },
  continueCatPlaceholder: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 8,
    paddingHorizontal: 2,
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
    color: "#FFFFFF",
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
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 13,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
    justifyContent: "center",
  },
  timeIcon: { marginRight: 6 },
  timeLabel: { fontSize: 14, fontWeight: "600" },
});
