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
import { BLUR_PLACEHOLDER, IMAGE_TRANSITION } from "@/constants/imagePlaceholder";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { LinearGradient } from "expo-linear-gradient";
import { SacredBackground } from "@/components/SacredBackground";
import { isIndigoThemeId, type SceneTheme } from "@/config/scene-themes";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { SessionCarousel } from "@/components/SessionCarousel";
import { SessionDurationBadge } from "@/components/SessionDurationBadge";
import { ChakraCarouselSection } from "@/components/ChakraCarouselSection";
import {
  SESSIONS,
  sortSessionsNewestFirst,
} from "@/data/sessions";
import { getArtist } from "@/data/artists";
import { getGuide } from "@/data/guides";
import { PLAYLISTS } from "@/data/playlists";
import { isChakraTag } from "@/data/chakras";
import { TAG_CARDS } from "@/data/tags";
import { usePremium } from "@/context/PremiumContext";
import { usePlayerBrowse } from "@/context/PlayerContext";
import { useAmbientalDuration } from "@/context/AmbientalDurationContext";
import { useDrawer } from "@/context/DrawerContext";
import { useCatalog } from "@/context/CatalogContext";
import { useCategoryOverlay } from "@/context/CategoryOverlayContext";
import { ContextSearchModal } from "@/components/ContextSearchModal";
import { ResonadoresSection } from "@/components/ResonadoresSection";
import { ContentCategoryGrid } from "@/components/ContentCategoryGrid";
import { useGetPopularSessions, getGetPopularSessionsQueryKey } from "@workspace/api-client-react";
import { getContentCarouselCardWidth } from "@/constants/carousel";

const { width } = Dimensions.get("window");
const H_PAD = 16;
const GAP = 16;
const SECTION_GAP = 53;
const COLLAPSED_FIRST_CAROUSEL_GAP = 14;
const FIRST_DISCOVER_CAROUSEL_GAP = 0;
const EXPLORE_SECTIONS_CACHE_KEY = "cdc_explore_sections_v1";

const SQCARD_W = getContentCarouselCardWidth(width, H_PAD);
const DURATION_GAP = 9;
const DURATION_CARD_WIDTH = Math.floor(
  (width - H_PAD * 2 - DURATION_GAP * 2) / 3,
);
const NEW_IN_RESONANCE_CARD_WIDTH = Math.round(
  (width - H_PAD * 2 - 56) * 0.85,
);
const DURATION_SLOTS = [
  { label: "5 min", displayLabel: "5 minutos" },
  { label: "10 min", displayLabel: "10 minutos" },
  { label: "20 min", displayLabel: "20 minutos" },
  { label: "30 min", displayLabel: "30 minutos" },
  { label: "60 min", displayLabel: "60 minutos" },
] as const;

const OTHER_THEME_META: Record<string, {
  icon: React.ComponentProps<typeof Feather>["name"];
  color: string;
  description: string;
}> = {
  "para-la-ansiedad": { icon: "heart", color: "#CE7FA3", description: "Calma tu mente y recupera la paz" },
  "energiza-tus-mananas": { icon: "sunrise", color: "#E3A657", description: "Activa tu energía para comenzar" },
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
  collapseCategoryHeader = false,
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

  const { isPremium } = usePremium();
  const { playSession, history } = usePlayerBrowse();
  const { version: catalogVersion } = useCatalog();
  const { theme: activeTheme, activeSceneId } = useSceneTheme();
  const durationSurfaceColor =
    activeSceneId === "tibet"
      ? "rgba(0,0,0,0.15)"
      : isIndigoThemeId(activeSceneId)
        ? "rgba(181,211,255,0.057)"
        : activeSceneId === "indigo2"
          ? "rgba(191,207,255,0.096)"
          : "rgba(181,211,255,0.057)";
  // Playlists para ti — playlists del catálogo (admin, showOnHome)
  const ritualItems = useMemo(
    () =>
      PLAYLISTS.slice(0, 4).map((pl) => ({
        id: pl.id,
        title: pl.title,
        durationLabel: pl.durationLabel,
        image: pl.coverUrl ? { uri: pl.coverUrl } : (pl.cover as number),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // ── Orden de carruseles desde la API ──
  // null = todavía cargando (no mostrar nada aún)
  // [] o array = respuesta recibida (respetar visibilidad)
  const [exploreSections, setExploreSections] = React.useState<
    { slug: string; label: string; visible: boolean; sortOrder: number }[] | null
  >(null);
  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      // El caché contiene exclusivamente la última configuración recibida del
      // servidor. Evita que un corte transitorio haga desaparecer carruseles,
      // sin activar tags locales ni saltarse la visibilidad elegida en Admin.
      try {
        const raw = await AsyncStorage.getItem(EXPLORE_SECTIONS_CACHE_KEY);
        if (raw && !cancelled) {
          const cached = JSON.parse(raw);
          if (Array.isArray(cached)) setExploreSections(cached);
        }
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
        if (!cancelled) setExploreSections((current) => current ?? []);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const themeCarousels = React.useMemo(() => {
    // Mientras carga o si la respuesta no trae configuración, no mostrar
    // carruseles. Nunca activar todos los tags locales como fallback, porque
    // eso ignora las visibilidades elegidas en Admin.
    if (exploreSections === null || exploreSections.length === 0) return [];

    const sessionLabels: string[] = Array.from(
      new Set<string>(SESSIONS.flatMap((s) => s.themeTag ?? [])),
    ).filter((t) => !isChakraTag(t));

    const seen = new Set<string>();
    return exploreSections
      .filter((sec) => {
        if (!sec.visible || !sessionLabels.includes(sec.label)) return false;
        if (seen.has(sec.label)) return false;
        seen.add(sec.label);
        return true;
      })
      .map((sec) => ({
        slug: sec.slug,
        label: sec.label,
        sessions: SESSIONS.filter((s) =>
          (s.themeTag as readonly string[] | undefined)?.includes(sec.label),
        ).sort(sortSessionsNewestFirst),
      }));
  }, [catalogVersion, exploreSections]); // eslint-disable-line react-hooks/exhaustive-deps

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
      })),
    [catalogVersion],
  );

  const topPad    = Platform.OS === "web" ? 67 : Math.max(insets.top, 40);
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;


  const handleSessionPress = React.useCallback((s: Session) => {
    const locked = s.isPremium && !isPremium;
    if (locked) { router.push("/membresia" as never); return; }
    if (openForSession(s)) return;
    if (s.skipMiniPlayer) { playSession(s); return; }
    if (s.skipDetail) { playSession(s); router.push("/player" as never); return; }
    openCategory(`/session/${s.id}`);
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

      <Animated.ScrollView
        style={styles.contentShift}
        contentContainerStyle={{ paddingBottom: 160 + bottomPad }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
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
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Buscar en ${screenTitle}`}
              testID="discover-search-button"
            >
              <Feather name="search" size={20} color="rgba(249,249,249,0.72)" />
              <Text style={styles.searchPlaceholder}>Buscar en Resonancia</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.scrollContent}>
          <View style={styles.categoryBlocksSection}>
            <ContentCategoryGrid
              marginTop={0}
              marginBottom={0}
              hiddenIds={["__descanzo__", "__mezcla__", "__geometrix__"]}
              discoverTieredLayout
            />
          </View>

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
                      backgroundColor: durationSurfaceColor,
                      opacity: pressed ? 0.72 : 1,
                    },
                  ]}
                >
                  <Text style={styles.durationCardText}>{slot.displayLabel}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

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
                    {session.durationLabel ? (
                      <View style={styles.newInResonanceDuration}>
                        <Text style={styles.newInResonanceDurationText}>
                          {session.durationLabel}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={styles.newInResonanceTitle} numberOfLines={2}>
                    {session.title}
                  </Text>
                  <Text style={styles.newInResonanceAuthor} numberOfLines={1}>
                    {getSessionAuthor(session)}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          <View style={styles.otherThemesSection}>
            <View style={styles.otherThemesHeader}>
              <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>
                Otras temáticas
              </Text>
            </View>
            <View style={styles.themeGrid}>
              {TAG_CARDS.slice(0, 8).map((card) => {
                const meta = OTHER_THEME_META[card.id];
                return (
                  <Pressable
                    key={card.id}
                    onPress={() => openCategory(`/tag/${encodeURIComponent(card.id)}`)}
                    accessibilityRole="button"
                    accessibilityLabel={`${card.label}. ${meta?.description ?? card.description}`}
                    style={({ pressed }) => [
                      styles.themeGridCard,
                      {
                        backgroundColor: durationSurfaceColor,
                        opacity: pressed ? 0.72 : 1,
                      },
                    ]}
                  >
                    <Image
                      source={card.image}
                      style={styles.themeGridThumbnail}
                      contentFit="cover"
                      placeholder={BLUR_PLACEHOLDER}
                      transition={IMAGE_TRANSITION}
                      cachePolicy="memory-disk"
                    />
                    <View style={styles.themeGridCopy}>
                      <Text style={styles.themeGridLabel} numberOfLines={1}>
                        {card.label}
                      </Text>
                      <Text style={styles.themeGridDescription} numberOfLines={1}>
                        {meta?.description ?? card.description}
                      </Text>
                    </View>
                    <Feather
                      name="chevron-right"
                      size={23}
                      color="rgba(255,255,255,0.72)"
                    />
                  </Pressable>
                );
              })}
            </View>
            <Pressable
              onPress={() => openCategory("/todas-las-tematicas")}
              accessibilityRole="button"
              accessibilityLabel="Ver todas las temáticas"
              style={({ pressed }) => [
                styles.searchBox,
                styles.themeViewAllButton,
                activeSceneId === "tibet"
                  ? styles.searchBoxTibet
                  : isIndigoThemeId(activeSceneId)
                    ? styles.searchBoxIndigo
                    : activeSceneId === "indigo2"
                      ? styles.searchBoxIndigo2
                      : null,
                { opacity: pressed ? 0.72 : 1 },
              ]}
            >
              <Text style={styles.themeViewAllText}>Ver todas</Text>
            </Pressable>
          </View>

          {/* ── Carruseles configurados en Explorar — orden y visibilidad desde Admin ── */}
          {themeCarousels.map((carousel, index) => (
            <View key={carousel.slug}>
              <SessionCarousel
                title={carousel.label}
                sessions={carousel.sessions}
                isPremium={isPremium}
                onPress={(s) => handleSessionPress(s)}
                style={{
                  marginTop:
                    index === 0
                      ? collapseCategoryHeader
                        ? COLLAPSED_FIRST_CAROUSEL_GAP
                        : FIRST_DISCOVER_CAROUSEL_GAP
                      : 0,
                  ...(carousel.slug === "para-la-ansiedad"
                    ? { transform: [{ translateY: -13 }] }
                    : {}),
                  marginBottom: SECTION_GAP,
                  paddingHorizontal: H_PAD,
                }}
                titleSize={19}
                presentation="tall-overlay"
                onViewAll={() => openCategory(`/tag/${encodeURIComponent(carousel.slug)}`)}
              />
            </View>
          ))}

          <ResonadoresSection
            marginTop={25}
            marginBottom={SECTION_GAP}
          />

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
          if (session) handleSessionPress(session);
        }}
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
  compactTitleOverlay: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
  compactPageTitle: { fontFamily: "Manrope", fontSize: 18, fontWeight: "800", letterSpacing: 0.2, color: "#F9F9F9", textAlign: "center" },
  headerSearchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  header:       { paddingHorizontal: H_PAD, marginBottom: 0 },
  headerRow:    { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  pageTitle:    { fontFamily: "Manrope", fontSize: 30, fontWeight: "800", letterSpacing: 0.3, color: "#F4F4F4", textAlign: "left", marginTop: 0, transform: [{ translateY: 1 }] },
  searchWrap:   { paddingHorizontal: H_PAD, paddingTop: 10, paddingBottom: 0 },
  searchBox:    { flexDirection: "row" as "row", alignItems: "center" as "center", gap: 10, borderRadius: 999, borderWidth: 0, paddingHorizontal: 18, height: 55 },
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
    color: "rgba(249,249,249,0.62)",
  },
  pageSubtitle: { fontFamily: "Manrope", fontSize: 14, color: "#F4F4F4", marginTop: 2 },

  section:      { paddingHorizontal: H_PAD, marginBottom: SECTION_GAP },
  sectionRow:   { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", marginBottom: 17 },
  sectionTitle: { fontFamily: "Manrope", fontSize: 19, fontWeight: "700", letterSpacing: 0.3, color: "#FBFBFB", marginBottom: 17 },
  contentCategorySection: {
    marginBottom: SECTION_GAP,
  },
  categoryBlocksSection: {
    marginTop: 30,
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
  newInResonanceSection: {
    paddingHorizontal: H_PAD,
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
    aspectRatio: 16 / 9,
    borderRadius: 15,
    overflow: "hidden",
    backgroundColor: "rgba(74,12,12,0.08)",
  },
  newInResonanceDuration: {
    position: "absolute",
    left: 8,
    bottom: 8,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: "rgba(6,10,15,0.72)",
  },
  newInResonanceDurationText: {
    fontFamily: "Manrope",
    fontSize: 10,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  newInResonanceTitle: {
    fontFamily: "Manrope",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
    color: "#FBFBFB",
    marginTop: 8,
    paddingHorizontal: 2,
  },
  newInResonanceAuthor: {
    fontFamily: "Manrope",
    fontSize: 11,
    color: "#c2c2c2",
    marginTop: 4,
    paddingHorizontal: 2,
  },
  otherThemesHeader: {
    marginBottom: 17,
  },
  otherThemesSection: {
    paddingHorizontal: H_PAD,
    marginBottom: 28,
  },
  themeGrid: {
    gap: 10,
  },
  themeGridCard: {
    width: "100%",
    minHeight: 92,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 16,
    paddingRight: 13,
    paddingVertical: 14,
  },
  themeGridThumbnail: {
    width: 64,
    height: 64,
    borderRadius: 12,
    marginRight: 20,
  },
  themeGridCopy: {
    flex: 1,
    minWidth: 0,
  },
  themeGridLabel: {
    fontFamily: "Manrope",
    color: "#FFFFFF",
    fontSize: 15,
    lineHeight: 19,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  themeGridDescription: {
    fontFamily: "Manrope",
    color: "rgba(255,255,255,0.62)",
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "400",
    marginTop: 1,
  },
  themeViewAllButton: {
    marginTop: 16,
    justifyContent: "center",
  },
  themeViewAllText: {
    flex: 1,
    fontFamily: "Manrope",
    fontSize: 15,
    fontWeight: "600",
    color: "#F9F9F9",
    textAlign: "center",
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
