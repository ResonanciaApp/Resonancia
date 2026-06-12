import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
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
import { SESSIONS } from "@/data/sessions";
import { getArtist } from "@/data/artists";
import { getGuide } from "@/data/guides";
import { TEMAS } from "@/data/temas";
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
  if (isNaN(r) || isNaN(g) || isNaN(b)) return `rgba(255,255,255,0.04)`;
  return `rgba(${r},${g},${b},${alpha})`;
}

const SQCARD_W = Math.round((width - H_PAD * 2) / 2.2);
const TEMA_COL_W = (width - H_PAD * 2 - GAP) / 2;

type Session = (typeof SESSIONS)[number];

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
  const { isPremium } = usePremium();

  const ancestralesSessions  = SESSIONS.filter(s => s.categoryId === "sonidos-ancestrales").slice(0, 10);
  const musicaSessions       = SESSIONS.filter(s => s.categoryId === "musica-sonidos").slice(0, 10);
  const meditacionesSessions = SESSIONS.filter(s => s.categoryId === "meditaciones-guiadas").slice(0, 10);

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
          <Feather name="chevron-right" size={18} color="#7A8FA8" />
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
                    <Feather name="star" size={10} color="#BE9650" />
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
    <View style={[styles.root, { backgroundColor: "#080B1A" }]}>
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
            <Pressable onPress={() => openDrawer()} hitSlop={8} style={styles.avatarBtn}>
              {photoUri ? (
                <Image source={{ uri: photoUri }} style={styles.avatarSmall} contentFit="cover" />
              ) : (
                <View style={styles.avatarFallback}>
                  <Feather name="user" size={15} color="#7A8FA8" />
                </View>
              )}
            </Pressable>
            <Text style={[styles.pageTitle, { flex: 1, marginLeft: 10 }]}>Buscar</Text>
          </View>
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
            {/* ── Carruseles por categoría ── */}
            {renderCarousel("Explora nuevos sonidos",        ancestralesSessions,  "/category/sonidos-ancestrales")}
            {renderCarousel("Explora música ambient",        musicaSessions,       "/category/musica-sonidos")}
            {renderCarousel("Explora meditaciones guiadas",  meditacionesSessions, "/category/meditaciones-guiadas")}

            {/* ── Explorar todo (TEMAS 6×2) ── */}
            <View style={styles.section}>
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
                        opacity: pressed ? 0.75 : 1,
                        backgroundColor: hexTint(t.color, 0.12),
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
                    <Text style={[styles.temaCellLabel, { color: colors.foreground }]} numberOfLines={1}>
                      {t.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* ── Mezclas de la comunidad ── */}
            <View style={styles.section}>
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

  header:         { paddingHorizontal: H_PAD, marginBottom: 18 },
  headerRow:      { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  avatarBtn:      { width: 32, height: 32, borderRadius: 16, overflow: "hidden" },
  avatarSmall:    { width: 32, height: 32, borderRadius: 16 },
  avatarFallback: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: "rgba(190,150,80,0.12)",
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: "rgba(190,150,80,0.25)",
  },
  pageTitle: { fontSize: 27, fontWeight: "700", letterSpacing: 0.5, marginBottom: 4, color: "#FFFFFF" },

  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: H_PAD,
    paddingHorizontal: 14,
    paddingVertical: 15,
    borderRadius: 10,
    borderWidth: 1,
    gap: 10,
    marginBottom: 16,
  },
  searchInput: { flex: 1, fontSize: 14, color: "#5A6A8A" },

  section:      { paddingHorizontal: H_PAD, marginBottom: 23 },
  sectionRow:   { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 11 },
  sectionTitle: { fontSize: 20, fontWeight: "700", letterSpacing: 0.3, color: "#FFFFFF", marginBottom: 7 },

  resultsLabel: { fontSize: 12, marginBottom: 12 },
  emptyState:   { alignItems: "center", paddingVertical: 48, gap: 10 },
  emptyTitle:   { fontSize: 16, fontWeight: "600" },
  emptySub:     { fontSize: 13 },

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
    backgroundColor: "rgba(255,255,255,0.04)",
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

  // Explorar todo — grid 2 columnas, icono + texto horizontal
  temaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: GAP,
    rowGap: 10,
    marginTop: 2,
  },
  temaCell: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 33,
  },
  temaCellIcon: {
    width: 26,
    height: 26,
  },
  temaCellLabel: {
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
    lineHeight: 19,
  },

});
