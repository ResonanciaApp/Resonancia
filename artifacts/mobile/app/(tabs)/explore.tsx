import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState, useMemo } from "react";
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

import { LinearGradient } from "expo-linear-gradient";
import { SacredBackground } from "@/components/SacredBackground";
import { SessionCard } from "@/components/SessionCard";
import { CommunityMixesCarousel } from "@/components/CommunityMixesCarousel";
import { SESSIONS } from "@/data/sessions";
import { getArtist } from "@/data/artists";
import { getGuide } from "@/data/guides";
import { TEMAS } from "@/data/temas";
import { TAG_CARDS } from "@/data/tags";
import { usePremium } from "@/context/PremiumContext";
import { useColors } from "@/hooks/useColors";
import { useDrawer } from "@/context/DrawerContext";
import { useUserProfile } from "@/context/UserProfileContext";

const { width } = Dimensions.get("window");
const H_PAD = 15;
const GAP = 10;

/** Convierte un color hex + alpha a rgba() para usar como fondo tintado. */
function hexTint(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return `rgba(74,12,12,0.08)`;
  return `rgba(${r},${g},${b},${alpha})`;
}

const SQCARD_W = Math.round((width - H_PAD * 2) / 2.2);
const TEMA_COL_W = Math.floor((width - H_PAD * 2 - GAP * 2) / 3);

const CAT_CARD_GAP = 12;
const CAT_CARD_W = Math.round(((width - H_PAD * 2 - CAT_CARD_GAP) / 2.2 - 30) * 1.25);
const CAT_CARD_IMG_H = Math.round(CAT_CARD_W * 1.15);

const DURATION_SLOTS = [
  { label: "5 min",   min: 0,  max: 5  },
  { label: "10 min",  min: 6,  max: 10 },
  { label: "20 min",  min: 11, max: 25 },
  { label: "30 min",  min: 26, max: 35 },
  { label: "45+ min", min: 36, max: Infinity },
] as const;
type DurSlot = (typeof DURATION_SLOTS)[number]["label"];

const CATEGORY_CARDS = [
  {
    id: "sonidos-ancestrales",
    title: "Ancestral",
    subtitle: "Cuencos, gongs y sonidos sagrados",
    route: "/category/sonidos-ancestrales",
    image: require("../../assets/images/categories/cat-ancestral.png"),
    overlay: "rgba(12,4,8,0.45)",
  },
  {
    id: "meditaciones-guiadas",
    title: "Meditaciones",
    subtitle: "Guías de voz para calmar la mente",
    route: "/category/meditaciones-guiadas",
    image: require("../../assets/images/categories/cat-meditaciones.png"),
    overlay: "rgba(4,8,16,0.42)",
  },
  {
    id: "musica-sonidos",
    title: "Música",
    subtitle: "Ambient, naturaleza y paisajes sonoros",
    route: "/category/musica-sonidos",
    image: require("../../assets/images/categories/cat-musica.png"),
    overlay: "rgba(4,14,8,0.42)",
  },
  {
    id: "reflexiones",
    title: "Reflexiones",
    subtitle: "Contemplación y sabiduría interior",
    route: "/category/reflexiones",
    image: require("../../assets/images/categories/cat-meditaciones.png"),
    overlay: "rgba(30,16,36,0.52)",
  },
] as const;

type Session = (typeof SESSIONS)[number];

/** Seed numérico basado en la fecha (YYYYMMDD) → mismo resultado todo el día */
function dateSeed(): number {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function getDailyRecommendations(count = 5): Session[] {
  const pool = SESSIONS.filter((s) =>
    s.categoryId === "sonidos-ancestrales" ||
    s.categoryId === "meditaciones-guiadas" ||
    s.categoryId === "musica-sonidos",
  );
  const rng = seededRandom(dateSeed());
  const shuffled = [...pool].sort(() => rng() - 0.5);
  return shuffled.slice(0, count);
}

function getSessionAuthor(s: Session): string {
  if (s.guideId) return getGuide(s.guideId).name;
  return getArtist(s.artistId).name;
}

export default function ExploreScreen() {
  const colors   = useColors();
  const insets   = useSafeAreaInsets();
  const { photoUri } = useUserProfile();
  const { open: openDrawer } = useDrawer();
  const [query, setQuery] = useState("");
  const [selectedDur, setSelectedDur] = useState<DurSlot | null>(null);

  const durationSessions = useMemo(() => {
    if (!selectedDur) return [];
    const slot = DURATION_SLOTS.find((s) => s.label === selectedDur)!;
    return SESSIONS.filter((s) => s.duration >= slot.min && s.duration <= slot.max);
  }, [selectedDur]);

  const { isPremium } = usePremium();

  const ancestralesSessions  = SESSIONS.filter(s => s.categoryId === "sonidos-ancestrales").slice(0, 10);
  const musicaSessions       = SESSIONS.filter(s => s.categoryId === "musica-sonidos").slice(0, 10);
  const meditacionesSessions = SESSIONS.filter(s => s.categoryId === "meditaciones-guiadas").slice(0, 10);
  const dailyRecs = React.useMemo(() => getDailyRecommendations(5), []);

  const topPad    = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const filteredSessions = SESSIONS.filter((s) => {
    if (!query) return false;
    const q = query.toLowerCase();
    return (
      s.title.toLowerCase().includes(q) ||
      s.categoryLabel.toLowerCase().includes(q) ||
      s.subtitle.toLowerCase().includes(q)
    );
  });

  function handleSessionPress(s: Session) {
    const locked = s.isPremium && !isPremium;
    router.push((locked ? "/membresia" : `/session/${s.id}`) as never);
  }

  function renderCarousel(title: string, sessions: Session[], categoryRoute: string) {
    return (
      <View style={styles.section} key={title}>
        <Pressable
          onPress={() => router.push(categoryRoute as never)}
          style={({ pressed }) => [styles.sectionRow, { opacity: pressed ? 0.7 : 1 }]}
        >
          <Text style={styles.sectionTitle}>{title}</Text>
          <Feather name="chevron-right" size={18} color="rgba(242,231,228,0.45)" />
        </Pressable>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginHorizontal: -H_PAD }}
          contentContainerStyle={styles.carouselContent}
        >
          {sessions.map((s) => (
            <Pressable
              key={s.id}
              onPress={() => handleSessionPress(s)}
              style={({ pressed }) => [styles.sqCard, { opacity: pressed ? 0.82 : 1 }]}
            >
              <View style={styles.sqImageWrap}>
                <Image
                  source={s.image as number}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                  placeholder={BLUR_PLACEHOLDER}
                  transition={IMAGE_TRANSITION}
                  cachePolicy="memory-disk"
                />
                {s.isPremium && (
                  <View style={styles.premiumBadge}>
                    <Feather name="star" size={10} color="#D4AF37" />
                  </View>
                )}
              </View>
              <Text style={[styles.sqTitle, { color: colors.foreground }]} numberOfLines={2}>
                {s.title}
              </Text>
              <Text style={[styles.sqAuthor, { color: colors.mutedForeground }]} numberOfLines={1}>
                {getSessionAuthor(s)}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={["#4A0C0C", "#27070E", "#1B060F"]}
        locations={[0, 0.5, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <StatusBar barStyle="light-content" />
      <SacredBackground variant="solid" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 160 + bottomPad, paddingTop: topPad + 2 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <Text style={[styles.pageTitle, { flex: 1 }]}>Buscar</Text>
          </View>
          <Text style={styles.pageSubtitle}>Explora entre todas nuestras categorías</Text>
        </View>

        {/* ── Search bar ── */}
        <View style={[styles.searchBar, { backgroundColor: "#FFFFFF", borderColor: "transparent" }]}>
          <Feather name="search" size={16} color="#9AA5B8" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Buscar sesiones, músicas, sonidos..."
            placeholderTextColor="#9AA5B8"
            style={styles.searchInput}
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery("")}>
              <Feather name="x" size={16} color="#9AA5B8" />
            </Pressable>
          )}
        </View>

        {/* ── Carrusel de categorías ── */}
        {query.length === 0 && (
          <>
          <Text style={[styles.sectionTitle, { paddingHorizontal: H_PAD, marginBottom: 12 }]}>
            Explora por categoría
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginHorizontal: H_PAD, marginBottom: 33 }}
            contentContainerStyle={{ gap: CAT_CARD_GAP, paddingBottom: 2 }}
            decelerationRate="fast"
            snapToInterval={CAT_CARD_W + CAT_CARD_GAP}
            snapToAlignment="start"
          >
            {CATEGORY_CARDS.map((cat) => (
              <Pressable
                key={cat.id}
                onPress={() => router.push(cat.route as never)}
                style={({ pressed }) => [styles.catCard, { opacity: pressed ? 0.85 : 1 }]}
              >
                <View style={styles.catCardImage}>
                  <Image
                    source={cat.image}
                    style={StyleSheet.absoluteFill}
                    contentFit="cover"
                    cachePolicy="memory-disk"
                  />
                </View>
                <View style={styles.catCardText}>
                  <Text style={styles.catCardTitle}>{cat.title}</Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>
          </>
        )}

        {/* ── ¿Cuánto tiempo tienes? ── */}
        {query.length === 0 && (
          <View style={styles.durSection}>
            <Text style={[styles.sectionTitle, { paddingHorizontal: H_PAD, marginBottom: 12 }]}>
              ¿Cuánto tiempo tienes?
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.durPillRow}
            >
              {DURATION_SLOTS.map((slot) => {
                const sel = selectedDur === slot.label;
                return (
                  <Pressable
                    key={slot.label}
                    onPress={() => setSelectedDur(sel ? null : slot.label)}
                    style={({ pressed }) => [
                      styles.durPill,
                      sel && styles.durPillActive,
                      { opacity: pressed ? 0.75 : 1 },
                    ]}
                  >
                    {sel && (
                      <LinearGradient
                        colors={["#D6AD5F", "#B47344"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={StyleSheet.absoluteFill}
                      />
                    )}
                    <Text style={[styles.durPillText, sel && styles.durPillTextActive]}>
                      {slot.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {selectedDur && (
              <View style={styles.durResults}>
                {durationSessions.length === 0 ? (
                  <Text style={[styles.durEmpty, { color: colors.mutedForeground }]}>
                    Sin sesiones para este rango
                  </Text>
                ) : (
                  durationSessions.map((s, i) => (
                    <React.Fragment key={s.id}>
                      {i > 0 && <View style={styles.recoDivider} />}
                      <SessionCard session={s} horizontal />
                    </React.Fragment>
                  ))
                )}
              </View>
            )}
          </View>
        )}

        {/* ── Recomendado para ti ── */}
        {query.length === 0 && (
          <View style={styles.recoSection}>
            <Text style={[styles.sectionTitle, { marginBottom: 14 }]}>Recomendado para ti</Text>
            <View style={styles.recoList}>
              {dailyRecs.map((s, i) => (
                <React.Fragment key={s.id}>
                  {i > 0 && <View style={styles.recoDivider} />}
                  <SessionCard session={s} horizontal />
                </React.Fragment>
              ))}
            </View>
          </View>
        )}

        {/* ── Search results ── */}
        {query.length > 0 ? (
          <View style={styles.section}>
            <Text style={[styles.resultsLabel, { color: colors.mutedForeground }]}>
              {filteredSessions.length} sesión{filteredSessions.length !== 1 ? "es" : ""} encontrada{filteredSessions.length !== 1 ? "s" : ""}
            </Text>
            {filteredSessions.map((s) => (
              <SessionCard key={s.id} session={s} horizontal />
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
            {/* ── Explorar todo (TEMAS 6×2) ── */}
            <View style={[styles.section, { marginBottom: 33 }]}>
              <View style={styles.sectionRow}>
                <Text style={styles.sectionTitle}>Explorar todo</Text>
              </View>
              <View style={styles.temaGrid}>
                {TEMAS.map((t) => (
                  <Pressable
                    key={t.id}
                    onPress={() => router.push((t.route ?? `/tema/${t.id}`) as never)}
                    style={({ pressed }) => [
                      styles.temaCell,
                      {
                        width: TEMA_COL_W,
                        height: TEMA_COL_W,
                        opacity: pressed ? 0.75 : 1,
                        backgroundColor: "rgba(255,255,255,0.06)",
                      },
                    ]}
                  >
                    {t.image != null ? (
                      <Image
                        source={t.image}
                        style={styles.temaCellIcon}
                        contentFit="contain"
                      />
                    ) : (
                      <MaterialCommunityIcons name={t.icon} size={26} color={t.color} />
                    )}
                    <Text style={[styles.temaCellLabel, { color: colors.foreground }]} numberOfLines={2}>
                      {t.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* ── Otras temáticas ── */}
            <View style={[styles.section, { marginBottom: 23 }]}>
              <View style={styles.sectionRow}>
                <Text style={styles.sectionTitle}>Otras temáticas</Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: CAT_CARD_GAP, paddingBottom: 4 }}
                decelerationRate="fast"
              >
                {TAG_CARDS.map((t) => (
                  <Pressable
                    key={t.id}
                    onPress={() => router.push(`/tema/${t.id}` as never)}
                    style={({ pressed }) => [styles.tagCard, { opacity: pressed ? 0.8 : 1 }]}
                  >
                    <View style={styles.tagCardImage}>
                      <Image
                        source={t.image}
                        style={StyleSheet.absoluteFill}
                        contentFit="cover"
                        placeholder={BLUR_PLACEHOLDER}
                        transition={IMAGE_TRANSITION}
                        cachePolicy="memory-disk"
                      />
                      <View style={styles.tagCardOverlay}>
                        <Text style={styles.tagCardLabel} numberOfLines={2}>{t.label}</Text>
                      </View>
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            {/* ── Mezclas de la comunidad ── */}
            <View style={styles.communityWrap}>
              <LinearGradient
                colors={["rgba(130,107,232,0.2)", "rgba(188,164,199,0.2)", "rgba(134,89,153,0.2)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <CommunityMixesCarousel />
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1 },
  scroll: { flex: 1 },
  communityWrap: {
    marginBottom: 33,
    borderRadius: 16,
    overflow: "hidden",
    marginHorizontal: H_PAD,
  },

  header:         { paddingHorizontal: H_PAD, marginBottom: 18 },
  headerRow:      { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  avatarBtn:      { width: 32, height: 32, borderRadius: 16, overflow: "hidden" },
  avatarSmall:    { width: 32, height: 32, borderRadius: 16 },
  avatarFallback: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: "rgba(212,175,55,0.12)",
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: "rgba(212,175,55,0.25)",
  },
  pageTitle:    { fontSize: 27, fontWeight: "700", letterSpacing: 0.5, marginBottom: 4, color: "#FFFFFF" },
  pageSubtitle: { fontSize: 14, color: "rgba(244,218,213,0.55)", marginTop: 2 },

  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: H_PAD,
    paddingHorizontal: 14,
    paddingVertical: 15,
    borderRadius: 10,
    borderWidth: 1,
    gap: 10,
    marginBottom: 33,
  },
  searchInput: { flex: 1, fontSize: 14, color: "#0D1520" },

  section:      { paddingHorizontal: H_PAD, marginBottom: 23 },
  sectionRow:   { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 11 },
  sectionTitle: { fontSize: 20, fontWeight: "700", letterSpacing: 0.3, color: "#FFFFFF", marginBottom: 7 },

  resultsLabel: { fontSize: 12, marginBottom: 12 },
  emptyState:   { alignItems: "center", paddingVertical: 48, gap: 10 },
  emptyTitle:   { fontSize: 16, fontWeight: "600" },
  emptySub:     { fontSize: 13 },

  // Recomendado para ti
  recoSection: {
    paddingHorizontal: H_PAD,
    marginBottom: 33,
  },
  recoSub: {
    fontSize: 12,
    marginBottom: 14,
    marginTop: 2,
  },
  recoList: {
    gap: 6,
  },
  recoDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.07)",
    marginHorizontal: 4,
  },

  // ¿Cuánto tiempo tienes?
  durSection: {
    marginBottom: 33,
  },
  durPillRow: {
    paddingHorizontal: H_PAD,
    gap: 8,
    paddingBottom: 2,
  },
  durPill: {
    overflow: "hidden",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "rgba(190,150,80,0.30)",
    backgroundColor: "rgba(74,12,12,0.08)",
  },
  durPillActive: {
    borderColor: "transparent",
  },
  durPillText: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(244,218,213,0.70)",
    letterSpacing: 0.2,
  },
  durPillTextActive: {
    color: "#FFFFFF",
  },
  durResults: {
    marginTop: 16,
    paddingHorizontal: H_PAD,
    gap: 6,
  },
  durEmpty: {
    fontSize: 13,
    textAlign: "center",
    paddingVertical: 16,
  },

  // Carrusel de categorías
  catCard: {
    width: CAT_CARD_W,
  },
  catCardImage: {
    width: CAT_CARD_W,
    height: CAT_CARD_IMG_H,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: "hidden",
  },
  catCardText: {
    marginTop: 0,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: "rgba(255,255,255,0.10)",
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    alignItems: "center",
  },
  catCardTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.2,
    textAlign: "center",
  },
  catCardSubtitle: {
    fontSize: 11,
    color: "rgba(244,218,213,0.65)",
    lineHeight: 15,
    fontWeight: "400",
  },

  // Carrusel cuadrado
  carouselContent: {
    paddingHorizontal: H_PAD,
    gap: GAP,
    paddingBottom: 4,
  },
  sqCard: {
    width: SQCARD_W,
  },
  sqImageWrap: {
    width: SQCARD_W,
    height: SQCARD_W,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "rgba(74,12,12,0.08)",
  },
  premiumBadge: {
    position: "absolute",
    top: 7,
    right: 7,
    backgroundColor: "rgba(6,10,15,0.72)",
    borderRadius: 10,
    padding: 4,
  },
  sqTitle: {
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
    marginTop: 8,
  },
  sqAuthor: {
    fontSize: 11,
    marginTop: 3,
  },

  // Explorar todo — grid 3 columnas, icono arriba + texto centrado
  temaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: GAP,
    marginTop: 2,
  },
  temaCell: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  temaCellIcon: {
    width: 26,
    height: 26,
  },
  temaCellLabel: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 16,
  },

  // Otras temáticas
  tagCard: {
    width: CAT_CARD_W,
  },
  tagCardImage: {
    width: CAT_CARD_W,
    height: Math.round(CAT_CARD_W * 1.25),
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "rgba(74,12,12,0.08)",
  },
  tagCardOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  tagCardLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
    lineHeight: 17,
  },

});
