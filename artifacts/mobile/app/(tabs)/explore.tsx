import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState, useMemo, useRef } from "react";
import {
  Dimensions,
  Animated,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";
import { SymbolView } from "expo-symbols";
import { BLUR_PLACEHOLDER, IMAGE_TRANSITION } from "@/constants/imagePlaceholder";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { LinearGradient } from "expo-linear-gradient";
import { SacredBackground } from "@/components/SacredBackground";
import { isIndigoThemeId, type SceneTheme } from "@/config/scene-themes";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { SessionDurationBadge } from "@/components/SessionDurationBadge";
import { ChakraCarouselSection } from "@/components/ChakraCarouselSection";
import {
  SESSIONS,
  getSessionById,
  sortSessionsNewestFirst,
} from "@/data/sessions";
import { getArtist } from "@/data/artists";
import { getGuide } from "@/data/guides";
import { getEditorialPlaylistCarouselsForSurface } from "@/data/playlists";
import { isChakraTag } from "@/data/chakras";
import { TAG_CARDS, slugifyThemeTag } from "@/data/tags";
import { usePremium } from "@/context/PremiumContext";
import { usePlayerBrowse } from "@/context/PlayerContext";
import { useAmbientalDuration } from "@/context/AmbientalDurationContext";
import { useDrawer } from "@/context/DrawerContext";
import { useCatalog } from "@/context/CatalogContext";
import { useCategoryOverlay } from "@/context/CategoryOverlayContext";
import { ContextSearchModal } from "@/components/ContextSearchModal";
import { EditorialPlaylistCarousel } from "@/components/EditorialPlaylistCarousel";
import { SessionCarousel } from "@/components/SessionCarousel";
import { ContentCategoryGrid } from "@/components/ContentCategoryGrid";
import {
  useGetPopularSessions,
  getGetPopularSessionsQueryKey,
} from "@workspace/api-client-react";
import {
  CONTENT_CAROUSEL_GAP,
  CONTENT_CAROUSEL_HEIGHT_SCALE,
  getContentCarouselCardWidth,
  getTwoCardCarouselCardWidth,
} from "@/constants/carousel";
import { SESSION_CARD_METADATA_HEIGHT_SCALE } from "@/components/SessionCardMetadataOverlay";
import {
  buildOtherThemeCards,
  keepLastExploreSections,
  parseExploreSectionsCache,
  type ExploreSection,
} from "@/lib/explore-other-themes";

const { width } = Dimensions.get("window");
const H_PAD = 16;
const GAP = 16;
const SECTION_GAP = 53;
const MONTHLY_SOUND_THERAPY_HERO_HEIGHT = 220;
const EXPLORE_SECTIONS_CACHE_KEY = "cdc_explore_sections_v1";

const SQCARD_W = getContentCarouselCardWidth(width, H_PAD);
const DURATION_GAP = 9;
const DURATION_CARD_WIDTH = Math.floor(
  (width - H_PAD * 2 - DURATION_GAP * 2) / 3,
);
const NEW_IN_RESONANCE_BASE_WIDTH = (width - H_PAD * 2 - 56) * 0.85;
const NEW_IN_RESONANCE_CARD_WIDTH = Math.round(
  NEW_IN_RESONANCE_BASE_WIDTH * 1.25 - 25,
);
const NEW_IN_RESONANCE_CARD_HEIGHT = Math.round(
  (NEW_IN_RESONANCE_CARD_WIDTH / (16 / 9)) * 1.1,
);
const POPULAR_CARD_WIDTH = Math.round(
  (width - H_PAD - CONTENT_CAROUSEL_GAP) / 1.9,
);
const COLLECTION_CARD_W =
  getTwoCardCarouselCardWidth(width, 14) - 3.5;
const COLLECTION_CARD_H =
  Math.round(
    (COLLECTION_CARD_W + 50) *
      SESSION_CARD_METADATA_HEIGHT_SCALE *
      CONTENT_CAROUSEL_HEIGHT_SCALE,
  ) - 11;
const DURATION_SLOTS = [
  { label: "5 min", displayLabel: "5 minutos" },
  { label: "10 min", displayLabel: "10 minutos" },
  { label: "20 min", displayLabel: "20 minutos" },
  { label: "30 min", displayLabel: "30 minutos" },
  { label: "60 min", displayLabel: "60 minutos" },
] as const;

const OTHER_THEME_META: Record<string, {
  icon: React.ComponentProps<typeof Feather>["name"];
  iconSize?: number;
  color: string;
  description: string;
}> = {
  "para-la-ansiedad": { icon: "heart", iconSize: 26, color: "#CE7FA3", description: "Calma tu mente y recupera la paz" },
  "energiza-tus-mananas": { icon: "sunrise", iconSize: 25, color: "#E3A657", description: "Activa tu energía para comenzar" },
  "foco-concentracion": { icon: "crosshair", color: "#72A0DA", description: "Claridad para sostener tu atención" },
  "suelto-la-rabia": { icon: "zap", color: "#DC7164", description: "Libera y transforma lo que sientes" },
  "crecimiento-personal": { icon: "trending-up", color: "#70BE8D", description: "Expande tu conciencia y tus recursos" },
  "armonia-familiar": { icon: "users", color: "#D08DAA", description: "Fortalece vínculos y crea armonía" },
  "respiracion-consciente": { icon: "wind", color: "#59BBC0", description: "Regresa al presente con tu respiración" },
  "meditaciones-activas": { icon: "activity", color: "#DE9467", description: "Conecta cuerpo y mente en movimiento" },
};

const BREATHING_EXERCISES = [
  { id: "478", name: "4-7-8", subtitle: "Calma y sueño" },
  { id: "box", name: "Cuadrada", subtitle: "Foco y equilibrio" },
  { id: "coherence", name: "Coherencia", subtitle: "Equilibrio cardíaco" },
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

function getDailyRecommendations(count = 5, offset = 0): Session[] {
  const pool = SESSIONS.filter((s) => s.categoryId === "meditaciones-guiadas");
  const rng = seededRandom(dateSeed());
  const shuffled = [...pool].sort(() => rng() - 0.5);
  if (!shuffled.length) return [];
  const start = offset % shuffled.length;
  return [...shuffled.slice(start), ...shuffled.slice(0, start)].slice(0, count);
}

function getSessionAuthor(s: Session): string {
  if (s.guideId) return getGuide(s.guideId).name;
  return getArtist(s.artistId).name;
}

type DiscoverIconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

const DISCOVER_ICON_BY_SLUG: Record<string, DiscoverIconName> = {
  "para-la-ansiedad": "heart-pulse",
  "energiza-tus-mananas": "weather-sunset-up",
  "foco-concentracion": "bullseye-arrow",
  "suelto-la-rabia": "fire",
  "crecimiento-personal": "sprout",
  "armonia-familiar": "account-group-outline",
  "respiracion-consciente": "weather-windy",
  "meditaciones-activas": "meditation",
  astrologia: "star-four-points-outline",
};

function getDiscoverIcon(slug: string, label: string): DiscoverIconName {
  const directIcon = DISCOVER_ICON_BY_SLUG[slug];
  if (directIcon) return directIcon;

  const concept = `${slug} ${label}`.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  if (concept.includes("ansiedad") || concept.includes("estres")) return "heart-pulse";
  if (concept.includes("manana") || concept.includes("energia")) return "weather-sunset-up";
  if (concept.includes("foco") || concept.includes("concentr")) return "bullseye-arrow";
  if (concept.includes("rabia")) return "fire";
  if (concept.includes("crecimiento")) return "sprout";
  if (concept.includes("famil")) return "account-group-outline";
  if (concept.includes("respir")) return "weather-windy";
  if (concept.includes("medit")) return "meditation";
  if (concept.includes("astro")) return "star-four-points-outline";
  return "compass-outline";
}

function DiscoverPill({
  label,
  icon,
  sceneId,
  indigo2BackgroundColor,
  onPress,
}: {
  label: string;
  icon: DiscoverIconName;
  sceneId: SceneTheme["id"];
  indigo2BackgroundColor?: Animated.AnimatedInterpolation<string | number>;
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    scale.stopAnimation();
    Animated.timing(scale, {
      toValue: 0.97,
      duration: 90,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    scale.stopAnimation();
    Animated.spring(scale, {
      toValue: 1,
      tension: 180,
      friction: 14,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onTouchEnd={handlePressOut}
      onTouchCancel={handlePressOut}
      testID={`discover-carousel-tab-${label}`}
    >
      <Animated.View
        style={[
          styles.discoverPill,
          sceneId === "tibet" && styles.discoverPillTibet,
          isIndigoThemeId(sceneId) && styles.discoverPillIndigo,
          sceneId === "indigo2" && styles.discoverPillIndigo2,
          { transform: [{ scale }] },
        ]}
      >
        {sceneId === "indigo2" && indigo2BackgroundColor && (
          <Animated.View
            pointerEvents="none"
            style={[StyleSheet.absoluteFill, { backgroundColor: indigo2BackgroundColor }]}
          />
        )}
        <MaterialCommunityIcons name={icon} size={22} color="#FFFFFF" />
        <Text style={styles.discoverPillText} numberOfLines={1}>
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export function ExploreScreen({
  screenTitle = "Descubrir",
}: {
  screenTitle?: string;
  categoryVisualVariant?: "default" | "watercolor";
  collapseCategoryHeader?: boolean;
}) {
  const { openCategory } = useCategoryOverlay();
  const { openForSession } = useAmbientalDuration();
  const insets   = useSafeAreaInsets();
  const { open: openDrawer } = useDrawer();
  const [searchVisible, setSearchVisible] = useState(false);
  const stickyHeaderOpacity = useRef(new Animated.Value(0)).current;
  const stickyHeaderActiveRef = useRef(false);
  const [stickyHeaderActive, setStickyHeaderActive] = useState(false);
  const stickyTitleTranslateY = stickyHeaderOpacity.interpolate({
    inputRange: [0, 1],
    outputRange: [20, 0],
  });

  const handleMainScroll = React.useCallback((event: {
    nativeEvent: { contentOffset: { y: number } };
  }) => {
    const active = event.nativeEvent.contentOffset.y > 8;
    if (active === stickyHeaderActiveRef.current) return;
    stickyHeaderActiveRef.current = active;
    setStickyHeaderActive(active);
    stickyHeaderOpacity.stopAnimation();
    Animated.timing(stickyHeaderOpacity, {
      toValue: active ? 1 : 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [stickyHeaderOpacity]);

  const { isPremium } = usePremium();
  const { playSession, history } = usePlayerBrowse();
  const { version: catalogVersion } = useCatalog();
  const { theme: activeTheme, activeSceneId } = useSceneTheme();
  const searchTabBarSurface = "rgba(0,0,0,0.28)";
  const durationSurfaceColor =
    activeSceneId === "tibet"
      ? "rgba(0,0,0,0.14)"
      : activeSceneId === "indigo2"
        ? "rgba(0,0,0,0.28)"
        : isIndigoThemeId(activeSceneId)
          ? "rgba(181,211,255,0.14)"
          : "rgba(181,211,255,0.14)";
  const contentCardSurfaceColor = durationSurfaceColor;
  const otherThemeCardSurfaceColor = "rgba(0,0,0,0.28)";
  const editorialDiscoverCarousels = useMemo(
    () => getEditorialPlaylistCarouselsForSurface("discover"),
    [catalogVersion],
  );

  const ancestralesSessions = React.useMemo(
    () => SESSIONS.filter(s => s.categoryId === "sonidos-ancestrales").slice(0, 10),
    [catalogVersion],
  );
  const musicaSessions = React.useMemo(
    () => SESSIONS.filter(s => s.categoryId === "musica-sonidos").slice(0, 10),
    [catalogVersion],
  );
  const meditacionesSessions = React.useMemo(
    () => SESSIONS.filter(s => s.categoryId === "meditaciones-guiadas").slice(0, 10),
    [catalogVersion],
  );

  // ── Nuevo en Resonancia (últimas 3 meditaciones agregadas) ──
  const recientesMeditaciones = React.useMemo(() => {
    return SESSIONS
      .filter((s) => s.categoryId === "meditaciones-guiadas")
      .sort((a, b) => parseInt(b.id) - parseInt(a.id))
      .slice(0, 3);
  }, [catalogVersion]);

  // ── Escuchadas recientemente (historial local, más reciente primero) ──
  const escuchadasRecientemente = React.useMemo(() => {
    const meditIds = new Set(SESSIONS.filter((s) => s.categoryId === "meditaciones-guiadas").map((s) => s.id));
    const seen = new Set<string>();
    const list: Session[] = [];
    for (const entry of history) {
      if (!meditIds.has(entry.sessionId) || seen.has(entry.sessionId)) continue;
      const s = SESSIONS.find((se) => se.id === entry.sessionId);
      if (!s) continue;
      seen.add(entry.sessionId);
      list.push(s);
      if (list.length >= 10) break;
    }
    return list;
  }, [history, catalogVersion]);

  // ── Orden y visibilidad de las cards de Otras temáticas desde la API ──
  // null = todavía cargando (no mostrar nada aún)
  // [] o array = respuesta recibida (respetar visibilidad)
  const [exploreSections, setExploreSections] = React.useState<ExploreSection[] | null>(null);
  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      // El caché contiene exclusivamente la última configuración recibida del
      // servidor. Evita que un corte transitorio haga desaparecer las cards,
      // sin activar tags locales ni saltarse la visibilidad elegida en Admin.
      try {
        const raw = await AsyncStorage.getItem(EXPLORE_SECTIONS_CACHE_KEY);
        const cached = parseExploreSectionsCache(raw);
        if (cached && !cancelled) setExploreSections(cached);
      } catch {
        // Caché ausente/corrupto: esperamos la respuesta de red.
      }

      try {
        const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "";
        const response = await fetch(`${API_URL}/api/explore-sections`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        const sections = Array.isArray(data?.sections) ? data.sections : [];
        if (cancelled) return;
        setExploreSections(sections);
        AsyncStorage.setItem(
          EXPLORE_SECTIONS_CACHE_KEY,
          JSON.stringify(sections),
        ).catch(() => {});
      } catch {
        // Conservar el último valor válido del servidor si existe. Solo cuando
        // nunca hubo respuesta ni caché se muestra la lista vacía.
        if (!cancelled) setExploreSections(keepLastExploreSections);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const otherThemeCards = React.useMemo(
    () =>
      buildOtherThemeCards({
        sections: exploreSections,
        localCards: TAG_CARDS,
        sessions: SESSIONS,
        isExcludedLabel: isChakraTag,
        slugifyLabel: slugifyThemeTag,
      }),
    [catalogVersion, exploreSections], // eslint-disable-line react-hooks/exhaustive-deps
  );

  // ── Las más escuchadas (ranking real de GET /catalog/popular) ──
  const { data: popularData } = useGetPopularSessions(
    { limit: 30 },
    { query: { queryKey: getGetPopularSessionsQueryKey({ limit: 30 }), staleTime: 5 * 60_000 } },
  );
  const masEscuchadasMeditaciones = React.useMemo(() => {
    const ids = (popularData?.sessions ?? []).map((s) => s.id);
    return ids
      .map((id) => SESSIONS.find((s) => s.id === id))
      .filter((s): s is Session => !!s && s.categoryId === "meditaciones-guiadas")
      .slice(0, 10);
  }, [popularData, catalogVersion]);
  const popularSessions = React.useMemo(
    () =>
      (popularData?.sessions ?? [])
        .map((session) => getSessionById(session.id))
        .filter(
          (session): session is Session =>
            session !== undefined
            && !session.isPlaceholder
            && session.categoryId !== "ambientales",
        )
        .slice(0, 10),
    [popularData, catalogVersion],
  );

  const discoverSearchItems = React.useMemo(
    () =>
      SESSIONS.map((session) => ({
        id: session.id,
        title: session.title,
        meta: session.categoryLabel,
        subtitle: getSessionAuthor(session),
        searchText: [
          session.title,
          session.categoryLabel,
          session.subtitle ?? "",
          getSessionAuthor(session),
        ].join(" "),
        image: session.image as number,
        duration: session.duration,
      })),
    [catalogVersion],
  );

  const topPad    = Platform.OS === "web" ? 67 : Math.max(insets.top, 40);
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;


  const handleSessionPress = React.useCallback((s: Session) => {
    const locked = s.isPremium && !isPremium;
    if (locked) { router.push("/membresia" as never); return false; }
    if (openForSession(s)) return false;
    if (s.skipMiniPlayer) { playSession(s); return true; }
    if (s.skipDetail) { playSession(s); router.push("/player" as never); return true; }
    openCategory(`/session/${s.id}`);
    return true;
  }, [isPremium, openCategory, openForSession, playSession]);

  function renderCarousel(title: string, sessions: Session[], categoryRoute: string, contentPaddingTop = 0) {
    return (
      <View style={styles.section} key={title}>
        <Pressable
          onPress={() => router.push(categoryRoute as never)}
          style={({ pressed }) => [styles.sectionRow, { opacity: pressed ? 0.7 : 1 }]}
        >
          <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>{title}</Text>
          <Feather name="chevron-right" size={18} color="#c2c2c2" />
        </Pressable>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginHorizontal: -H_PAD }}
          contentContainerStyle={[styles.carouselContent, contentPaddingTop > 0 && { paddingTop: contentPaddingTop }]}
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
                    <Feather name="star" size={10} color="#F9F9F9" />
                  </View>
                )}
              </View>
              <Text style={[styles.sqTitle, { color: "#FBFBFB" }]} numberOfLines={2}>
                {s.title}
              </Text>
              <Text style={[styles.sqAuthor, { color: "#c2c2c2" }]} numberOfLines={1}>
                {getSessionAuthor(s)}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: activeTheme.gradient[0] as string }]}>
      <LinearGradient colors={activeTheme.gradient} style={styles.rootGradient} />
      <StatusBar hidden />

      <Animated.View
        pointerEvents={stickyHeaderActive ? "auto" : "none"}
        style={[
          styles.stickyHeader,
          {
            paddingTop: topPad + 2,
            backgroundColor: activeTheme.gradient[0] as string,
            opacity: stickyHeaderOpacity,
          },
        ]}
      >
        <View style={[styles.titleRow, styles.stickyTitleRow]}>
          <Animated.Text
            style={[
              styles.stickyTitle,
              { transform: [{ translateY: stickyTitleTranslateY }] },
            ]}
          >
            {screenTitle}
          </Animated.Text>
        </View>
        <View style={[styles.searchWrap, styles.stickySearchWrap]}>
          <Pressable
            onPress={() => setSearchVisible(true)}
            style={[
              styles.searchBox,
              activeSceneId === "tibet"
                ? styles.searchBoxTibet
                : isIndigoThemeId(activeSceneId)
                  ? styles.searchBoxIndigo
                  : activeSceneId === "indigo2"
                    ? styles.searchBoxIndigo2
                    : null,
              styles.searchBoxWhiteBorder,
              { backgroundColor: searchTabBarSurface },
            ]}
            accessibilityRole="button"
            accessibilityLabel={`Buscar en ${screenTitle}`}
            testID="discover-sticky-search-button"
          >
            {Platform.OS === "ios" ? (
              <SymbolView
                name="magnifyingglass"
                tintColor="rgba(249,249,249,0.72)"
                size={20}
              />
            ) : (
              <Feather
                name="search"
                size={20}
                color="rgba(249,249,249,0.72)"
              />
            )}
            <Text style={styles.searchPlaceholder}>
              Busca por título, categoría o autor
            </Text>
          </Pressable>
        </View>
      </Animated.View>

      <Animated.ScrollView
        style={styles.contentShift}
        contentContainerStyle={{ paddingBottom: 160 + bottomPad }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        scrollEventThrottle={16}
        onScroll={handleMainScroll}
      >
        <View style={[styles.pageHeader, { paddingTop: topPad + 2 }]}>
          <View style={styles.titleRow}>
            <Text style={styles.pageTitle}>{screenTitle}</Text>
          </View>
          <View style={styles.searchWrap}>
            <Pressable
              onPress={() => setSearchVisible(true)}
              style={[
                styles.searchBox,
                activeSceneId === "tibet"
                  ? styles.searchBoxTibet
                  : isIndigoThemeId(activeSceneId)
                    ? styles.searchBoxIndigo
                    : activeSceneId === "indigo2"
                      ? styles.searchBoxIndigo2
                      : null,
                styles.searchBoxWhiteBorder,
                { backgroundColor: searchTabBarSurface },
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Buscar en ${screenTitle}`}
              testID="discover-search-button"
            >
              {Platform.OS === "ios" ? (
                <SymbolView
                  name="magnifyingglass"
                  tintColor="rgba(249,249,249,0.72)"
                  size={20}
                />
              ) : (
                <Feather name="search" size={20} color="rgba(249,249,249,0.72)" />
              )}
              <Text style={styles.searchPlaceholder}>
                Busca por título, categoría o autor
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.scrollContent}>
          <View style={styles.monthlySoundTherapySection}>
            <View style={styles.monthlySoundTherapyHeader}>
              <Text style={styles.monthlySoundTherapySectionTitle}>
                Sonoterapia del mes
              </Text>
            </View>

            <View
              accessibilityRole="image"
              accessibilityLabel="Sonoterapia del mes de Casa del Cuenco"
            >
              <View style={styles.monthlySoundTherapyHero}>
                <Image
                  source={require("@/assets/images/ambient/universo.jpg")}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                  transition={IMAGE_TRANSITION}
                  placeholder={BLUR_PLACEHOLDER}
                />
              </View>
              <View style={styles.monthlySoundTherapyMeta}>
                <Image
                  source={require("@/assets/images/avatar-fundador.png")}
                  style={styles.monthlySoundTherapyAvatar}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                />
                <View style={styles.monthlySoundTherapyMetaCopy}>
                  <Text style={styles.monthlySoundTherapyContentTitle}>
                    Sonidos de la Tierra y el Universo
                  </Text>
                  <Text
                    style={[
                      styles.monthlySoundTherapyAuthor,
                      { color: activeTheme.accent },
                    ]}
                  >
                    Casa del Cuenco
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.sectionDivider} />

          <Pressable
            onPress={() => router.push("/equipo" as never)}
            accessibilityRole="button"
            accessibilityLabel="Conoce a los Resonadores"
            style={({ pressed }) => [
              styles.sleepMixerBanner,
              { opacity: pressed ? 0.82 : 1 },
            ]}
          >
            <View style={styles.sleepMixerBannerIcon}>
              <Feather name="users" color="#F9F9F9" size={30} />
            </View>
            <View style={styles.sleepMixerBannerCopy}>
              <Text style={styles.sleepMixerBannerTitle}>
                Conoce a los Resonadores
              </Text>
              <Text style={styles.sleepMixerBannerSubtitle}>
                La esencia que le da vida a este espacio, las personas detrás de Resonancia.
              </Text>
            </View>
            <Feather name="chevron-right" size={20} color="rgba(249,249,249,0.7)" />
          </Pressable>

          <View style={styles.sectionDivider} />

          <View style={styles.categoryBlocksSection}>
            <ContentCategoryGrid
              marginTop={0}
              marginBottom={0}
              hiddenIds={[
                "__descanzo__",
                "__mezcla__",
                "__geometrix__",
              ]}
              discoverTieredLayout
            />
          </View>

          <View style={styles.sectionDivider} />

          <View style={styles.newInResonanceSection}>
            <View style={styles.newInResonanceHeader}>
              <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>
                Nuevo en Resonancia
              </Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginHorizontal: -H_PAD }}
              contentContainerStyle={styles.newInResonanceRow}
            >
              {recientesMeditaciones.map((session) => (
                <Pressable
                  key={session.id}
                  onPress={() => handleSessionPress(session)}
                  accessibilityRole="button"
                  accessibilityLabel={`${session.title}. ${getSessionAuthor(session)}`}
                  style={({ pressed }) => [
                    styles.newInResonanceCard,
                    { opacity: pressed ? 0.82 : 1 },
                  ]}
                >
                  <View style={styles.newInResonanceImageWrap}>
                    <Image
                      source={session.image as number}
                      style={StyleSheet.absoluteFill}
                      contentFit="cover"
                      placeholder={BLUR_PLACEHOLDER}
                      transition={IMAGE_TRANSITION}
                      cachePolicy="memory-disk"
                    />
                    <SessionDurationBadge
                      label={session.durationLabel}
                      style={styles.categoryDurationBadge}
                    />
                  </View>
                  <View style={styles.newInResonanceMeta}>
                    <Text style={styles.newInResonanceTitle} numberOfLines={2}>
                      {session.title}
                    </Text>
                    <Text
                      style={[
                        styles.newInResonanceSecondary,
                        { color: activeTheme.accent ?? "#c2c2c2" },
                      ]}
                      numberOfLines={1}
                    >
                      {getSessionAuthor(session)}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          <View style={styles.sectionDivider} />

          {editorialDiscoverCarousels.map((carousel) => (
            <React.Fragment key={carousel.id}>
              <EditorialPlaylistCarousel
                title={carousel.title}
                playlists={carousel.playlists}
                onPress={(playlist) =>
                  openCategory(`/editorial-playlist/${encodeURIComponent(playlist.id)}`)
                }
              />
              <View style={styles.sectionDivider} />
            </React.Fragment>
          ))}

          <View style={styles.durationSection}>
            <Text style={[styles.sectionTitle, { paddingHorizontal: H_PAD }]}>
              Explora según tu tiempo
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.durationRow}
            >
              {DURATION_SLOTS.map((slot) => (
                <Pressable
                  key={slot.label}
                  onPress={() =>
                    openCategory(`/busqueda?tiempo=${encodeURIComponent(slot.label)}`)
                  }
                  accessibilityRole="button"
                  accessibilityLabel={slot.displayLabel}
                  style={({ pressed }) => [
                    styles.durationCard,
                    {
                      backgroundColor: contentCardSurfaceColor,
                      opacity: pressed ? 0.72 : 1,
                    },
                  ]}
                >
                  <Text style={styles.durationCardText}>{slot.displayLabel}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          <View style={styles.sectionDivider} />

          <View style={styles.otherThemesSection}>
            <View style={styles.otherThemesHeader}>
              <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>
                Otras temáticas
              </Text>
            </View>
            <View style={styles.themeGrid}>
              {otherThemeCards.map((card) => {
                const meta = OTHER_THEME_META[card.id];
                return (
                  <Pressable
                    key={card.id}
                    onPress={() => openCategory(`/tag/${encodeURIComponent(card.id)}`)}
                    accessibilityRole="button"
                    accessibilityLabel={`${card.label}. ${meta?.description ?? card.description}`}
                    style={({ pressed }) => [
                      styles.themeGridCard,
                      { opacity: pressed ? 0.72 : 1 },
                    ]}
                  >
                    <View
                      style={[
                        styles.themeGridImageWrap,
                        { backgroundColor: otherThemeCardSurfaceColor },
                      ]}
                    >
                      {card.image ? (
                        <Image
                          source={card.image}
                          style={StyleSheet.absoluteFill}
                          contentFit="cover"
                          cachePolicy="memory-disk"
                          transition={IMAGE_TRANSITION}
                        />
                      ) : meta ? (
                        <Feather
                          name={meta.icon}
                          size={meta.iconSize ?? 27}
                          color={meta.color}
                        />
                      ) : (
                        <Feather name="circle" size={27} color="#C8A6FF" />
                      )}
                      <View
                        pointerEvents="none"
                        style={styles.themeGridVioletOverlay}
                      />
                      <Text style={styles.themeGridLabel} numberOfLines={2}>
                        {card.label}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* ── Descubre algo nuevo (al final de la página) — oculta a pedido del usuario ── */}
          {false && (
          <View style={[styles.section, { marginBottom: SECTION_GAP }]}>
            <Text style={styles.sectionTitle}>Descubre algo nuevo</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginHorizontal: -H_PAD }}
              contentContainerStyle={{ paddingHorizontal: H_PAD, gap: 10 }}
            >
              {([
                ["Cuencos", "Meditaciones"],
                ["Energízate", "Gongs"],
                ["Playlists", "Paisajes sonoros"],
              ] as [string, string][]).map(([top, bottom]) => (
                <View key={top} style={{ gap: 10 }}>
                  {[top, bottom].map((label) => (
                    <View
                      key={label}
                      style={{
                        width: 148,
                        height: 70,
                        backgroundColor: "rgba(218,212,236,0.05)",
                        borderRadius: 12,
                        borderWidth: 2,
                        borderColor: "rgba(255,255,255,0.7)",
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <Text style={{ fontFamily: "Manrope", fontSize: 13, fontWeight: "600", color: "#F9F9F9", textAlign: "center" }}>
                        {label}
                      </Text>
                    </View>
                  ))}
                </View>
              ))}
            </ScrollView>
          </View>
          )}
        </View>
      </Animated.ScrollView>

      <ContextSearchModal
        visible={searchVisible}
        onClose={() => setSearchVisible(false)}
        items={discoverSearchItems}
        placeholder={`Buscar en ${screenTitle}...`}
        emptyTitle="Encuentra algo para ti"
        emptySubtitle="Busca sesiones, voces guía, artistas o temas"
        onSelect={(item) => {
          const session = SESSIONS.find((candidate) => candidate.id === item.id);
          return session ? handleSessionPress(session) : false;
        }}
        scope="discover"
      />

    </View>
  );
}

export default function ExploreRoute() {
  return <ExploreScreen />;
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: "#210911" },
  rootGradient: { ...StyleSheet.absoluteFillObject },
  contentShift: { flex: 1, transform: [{ translateY: -5 }] },
  scroll: { flex: 1 },
  scrollContent: { marginTop: -3 },
  stickyHeader: {
    position: "absolute",
    top: -5,
    left: 0,
    right: 0,
    zIndex: 20,
  },

  pageHeader: { paddingBottom: 10 },
  overlayHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingBottom: 0,
  },
  discoverTabsHeader: {
    marginTop: 9,
    paddingBottom: 15,
    paddingHorizontal: H_PAD,
  },
  discoverTabs: {
    marginHorizontal: -H_PAD,
    marginBottom: 0,
  },
  discoverTabsContent: {
    paddingLeft: H_PAD,
    paddingRight: H_PAD,
    gap: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  discoverPill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 51,
    paddingHorizontal: 16,
    borderRadius: 27,
    gap: 12,
    overflow: "hidden",
    backgroundColor: "rgba(181,211,255,0.057)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  discoverPillTibet: {
    backgroundColor: "rgba(0,0,0,0.15)",
  },
  discoverPillIndigo: {
    backgroundColor: "rgba(181,211,255,0.057)",
  },
  discoverPillIndigo2: {
    backgroundColor: "rgba(191,207,255,0.096)",
    borderColor: "rgba(255,255,255,0.04)",
  },
  discoverPillText: {
    fontFamily: "Manrope",
    fontSize: 13,
    fontWeight: "600",
    color: "#F4F4F4",
  },
  titleRow:     { position: "relative", flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: H_PAD, paddingBottom: 10, paddingTop: 7 },
  stickyTitle: {
    fontFamily: "Manrope",
    fontSize: 18,
    lineHeight: 22,
    fontWeight: "800",
    letterSpacing: 0.2,
    color: "#F4F4F4",
    textAlign: "center",
  },
  stickyTitleRow: {
    minHeight: 54,
    justifyContent: "center",
  },
  stickySearchButton: {
    position: "absolute",
    top: 7,
    right: H_PAD,
  },
  compactTitleOverlay: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
  compactPageTitle: { fontFamily: "Manrope", fontSize: 18, fontWeight: "800", letterSpacing: 0.2, color: "#F9F9F9", textAlign: "center" },
  headerSearchButton: {
    width: 43,
    height: 43,
    borderRadius: 21.5,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.28)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  header:       { paddingHorizontal: H_PAD, marginBottom: 0 },
  headerRow:    { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  pageTitle:    { fontFamily: "Manrope", fontSize: 30, fontWeight: "800", letterSpacing: 0.3, color: "#F4F4F4", textAlign: "left", marginTop: 0, transform: [{ translateY: 1 }] },
  searchWrap:   { paddingHorizontal: H_PAD, paddingTop: 10, paddingBottom: 0 },
  stickySearchWrap: { paddingTop: 0, paddingBottom: 12 },
  searchBox:    { flexDirection: "row" as "row", alignItems: "center" as "center", gap: 10, borderRadius: 999, borderWidth: 1, paddingHorizontal: 18, height: 50 },
  searchBoxWhiteBorder: {
    borderColor: "#F9F9F9",
  },
  searchInput:  { fontFamily: "Manrope", flex: 1, fontSize: 15, fontWeight: "300", padding: 0 },
  searchBoxTibet: {
    backgroundColor: "rgba(0,0,0,0.15)",
    borderColor: "rgba(255,255,255,0.12)",
  },
  searchBoxIndigo: {
    backgroundColor: "rgba(181,211,255,0.057)",
    borderColor: "rgba(170,170,196,0.18)",
  },
  searchBoxIndigo2: {
    backgroundColor: "rgba(191,207,255,0.096)",
    borderColor: "rgba(255,255,255,0.08)",
  },
  searchPlaceholder: {
    flex: 1,
    fontFamily: "Manrope",
    fontSize: 15,
    fontWeight: "400",
    color: "#F4F4F4",
  },
  pageSubtitle: { fontFamily: "Manrope", fontSize: 14, color: "#F4F4F4", marginTop: 2 },

  section:      { paddingHorizontal: H_PAD, marginBottom: SECTION_GAP },
  sectionRow:   { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", marginBottom: 17 },
  sectionTitle: { fontFamily: "Manrope", fontSize: 17, fontWeight: "700", letterSpacing: 0.3, color: "#FBFBFB", marginBottom: 17 },
  sectionDivider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: H_PAD,
    marginTop: -27,
    marginBottom: 26,
    backgroundColor: "rgba(249,249,249,0.18)",
  },
  sleepMixerBanner: {
    minHeight: 110,
    marginTop: 0,
    marginBottom: 53,
    marginHorizontal: H_PAD,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.27)",
    backgroundColor: "rgba(0,0,0,0.34)",
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  sleepMixerBannerIcon: {
    width: 51,
    height: 51,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
    transform: [{ translateY: 2 }],
  },
  sleepMixerBannerCopy: {
    flex: 1,
    minWidth: 0,
  },
  sleepMixerBannerTitle: {
    color: "#F9F9F9",
    fontFamily: "Manrope",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 5,
  },
  sleepMixerBannerSubtitle: {
    color: "#F9F9F9",
    fontFamily: "Manrope",
    fontSize: 12,
  },
  popularSection: {
    marginTop: 0,
    marginBottom: SECTION_GAP,
    paddingHorizontal: H_PAD,
  },
  monthlySoundTherapySection: {
    paddingHorizontal: H_PAD,
    marginTop: 20,
    marginBottom: SECTION_GAP,
  },
  monthlySoundTherapyHeader: {
    marginBottom: 17,
  },
  monthlySoundTherapyAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(181,211,255,0.057)",
  },
  monthlySoundTherapySectionTitle: {
    fontFamily: "Manrope",
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "700",
    letterSpacing: 0.3,
    color: "#FBFBFB",
  },
  monthlySoundTherapyHero: {
    width: "100%",
    height: MONTHLY_SOUND_THERAPY_HERO_HEIGHT,
    borderRadius: 15,
    overflow: "hidden",
    backgroundColor: "rgba(74,12,12,0.08)",
  },
  monthlySoundTherapyMeta: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  monthlySoundTherapyMetaCopy: {
    flex: 1,
  },
  monthlySoundTherapyContentTitle: {
    fontFamily: "Manrope",
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "700",
    color: "#FBFBFB",
    marginBottom: 4,
  },
  monthlySoundTherapyAuthor: {
    fontFamily: "Manrope",
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "500",
  },
  contentCategorySection: {
    marginBottom: SECTION_GAP,
  },
  categoryBlocksSection: {
    marginBottom: SECTION_GAP,
  },
  durationSection: {
    marginBottom: SECTION_GAP,
  },
  durationRow: {
    gap: DURATION_GAP,
    paddingHorizontal: H_PAD,
    paddingRight: H_PAD,
  },
  durationCard: {
    width: DURATION_CARD_WIDTH,
    minWidth: DURATION_CARD_WIDTH,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  durationCardText: {
    fontFamily: "Manrope",
    fontSize: 16,
    fontWeight: "600",
    color: "#FBFBFB",
    letterSpacing: 0.2,
  },
  playlistCollectionSection: {
    paddingHorizontal: H_PAD,
    marginTop: 0,
    marginBottom: SECTION_GAP,
  },
  playlistCard: {
    width: COLLECTION_CARD_W,
  },
  playlistStack: {
    width: COLLECTION_CARD_W,
    height: COLLECTION_CARD_H + 11,
  },
  playlistStackStripFront: {
    position: "absolute",
    top: COLLECTION_CARD_H,
    left: 12,
    right: 12,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "#717172",
  },
  playlistStackStripBack: {
    position: "absolute",
    top: COLLECTION_CARD_H + 5,
    left: 17,
    right: 17,
    height: 2,
    borderRadius: 1,
    backgroundColor: "#48474D",
  },
  playlistCover: {
    width: COLLECTION_CARD_W,
    height: COLLECTION_CARD_H,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.1)",
  },
  playlistDurationBadge: {
    position: "absolute",
    top: 15,
    left: 15,
  },
  playlistMeta: {
    position: "absolute",
    left: 19,
    right: 19,
    bottom: 20,
  },
  playlistTitle: {
    fontFamily: "Manrope",
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 18,
    color: "#F9F9F9",
    textShadowColor: "rgba(0,0,0,0.75)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  newInResonanceSection: {
    paddingHorizontal: H_PAD,
    marginTop: 5,
    marginBottom: SECTION_GAP,
  },
  newInResonanceHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 17,
  },
  newInResonanceRow: {
    paddingHorizontal: H_PAD,
    gap: 14,
  },
  newInResonanceCard: {
    width: NEW_IN_RESONANCE_CARD_WIDTH,
  },
  newInResonanceImageWrap: {
    width: "100%",
    height: NEW_IN_RESONANCE_CARD_HEIGHT,
    borderRadius: 15,
    overflow: "hidden",
    backgroundColor: "rgba(74,12,12,0.08)",
  },
  categoryDurationBadge: {
    position: "absolute",
    left: 8,
    bottom: 8,
    paddingHorizontal: 9,
  },
  newInResonanceDuration: {
    alignSelf: "flex-start",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: "rgba(6,10,15,0.72)",
    marginBottom: 6,
  },
  newInResonanceDurationText: {
    fontFamily: "Manrope",
    fontSize: 10,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  newInResonanceTitle: {
    fontFamily: "Manrope",
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "700",
    color: "#FBFBFB",
    marginTop: 2,
    marginBottom: 2,
  },
  newInResonanceSecondary: {
    fontFamily: "Manrope",
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "500",
  },
  newInResonanceMeta: {
    marginTop: 8,
  },
  otherThemesHeader: {
    marginBottom: 17,
  },
  otherThemesSection: {
    paddingHorizontal: H_PAD,
    marginBottom: SECTION_GAP,
  },
  themeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: 7,
    rowGap: 9,
  },
  themeGridCard: {
    width: (width - H_PAD * 2 - 7) / 2,
  },
  themeGridImageWrap: {
    width: "100%",
    aspectRatio: 1.35,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  themeGridLabel: {
    position: "absolute",
    left: 12,
    right: 12,
    fontFamily: "Manrope",
    color: "#FFFFFF",
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "700",
    letterSpacing: 0.2,
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
    zIndex: 2,
  },
  themeGridVioletOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.56)",
    zIndex: 1,
  },
  categoryCarouselTitle: { marginHorizontal: H_PAD, marginBottom: 12 },
  // Playlists para ti
  ritualGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 14,
  },
  ritualCard: {
    width: (width - H_PAD * 2 - 14) / 2,
    borderRadius: 14,
    overflow: "hidden",
  },
  ritualImage: {
    width: "100%",
    aspectRatio: 1.35,
  },
  ritualTextWrap: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  ritualTitle: {
    fontFamily: "Manrope",
    fontSize: 14,
    fontWeight: "600",
    color: "#FBFBFB",
    lineHeight: 19,
  },
  ritualSub: {
    fontFamily: "Manrope",
    fontSize: 12,
    fontWeight: "400",
    color: "rgba(255,255,255,0.60)",
    marginTop: 3,
  },

  // Recomendado para ti
  recoSection: {
    paddingHorizontal: H_PAD,
    marginBottom: SECTION_GAP,
  },
  recoSub: {
    fontFamily: "Manrope",
    fontSize: 12,
    marginBottom: 14,
    marginTop: 2,
  },
  recoList: {
    gap: 6,
  },
  recoDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
    marginHorizontal: 4,
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
    borderRadius: 15,
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
    fontFamily: "Manrope",
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
    marginTop: 10,
  },
  sqAuthor: {
    fontFamily: "Manrope",
    fontSize: 11,
    marginTop: 3,
  },

  // Hero: Vuelve a ti
  introHeroContainer: {
    width: "100%",
    aspectRatio: 1536 / 1024,
    borderRadius: 15,
    overflow: "hidden",
    justifyContent: "center",
  },
  introHeroImage: { ...StyleSheet.absoluteFillObject },
  introHeroTextWrap: {
    paddingHorizontal: 20,
  },
  introHeroTitle: {
    fontFamily: "Manrope",
    fontSize: 26,
    fontWeight: "700",
    color: "#FBFBFB",
    letterSpacing: 0.3,
    marginBottom: 6,
  },
  introHeroSubtitle: {
    fontFamily: "Manrope",
    fontSize: 14,
    color: "rgba(244,218,213,0.75)",
  },

  // Ejercicios de respiración
  breathingRow: {
    paddingHorizontal: H_PAD,
    gap: 12,
    paddingBottom: 4,
  },
  breathingCard: {
    width: 132,
    alignItems: "center",
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 10,
    backgroundColor: "rgba(190,150,80,0.05)",
  },
  breathingIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(190,150,80,0.12)",
    marginBottom: 10,
  },
  breathingName: {
    fontFamily: "Manrope",
    fontSize: 15,
    fontWeight: "700",
    color: "#FBFBFB",
    marginBottom: 3,
  },
  breathingDesc: {
    fontFamily: "Manrope",
    fontSize: 12,
    color: "#c2c2c2",
    textAlign: "center",
  },

});
