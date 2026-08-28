import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState, useMemo } from "react";
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
import { useSceneTheme } from "@/context/SceneThemeContext";
import { SessionCarousel } from "@/components/SessionCarousel";
import { SESSIONS } from "@/data/sessions";
import { getArtist } from "@/data/artists";
import { getGuide } from "@/data/guides";
import { PLAYLISTS } from "@/data/playlists";
import { CHAKRAS, isChakraTag } from "@/data/chakras";
import { usePremium } from "@/context/PremiumContext";
import { usePlayer } from "@/context/PlayerContext";
import { useColors } from "@/hooks/useColors";
import { useDrawer } from "@/context/DrawerContext";
import { useUserProfile } from "@/context/UserProfileContext";
import { useCatalog } from "@/context/CatalogContext";
import { useCategoryOverlay } from "@/context/CategoryOverlayContext";
import { ContentCategoryGrid } from "@/components/ContentCategoryGrid";
import { ContextSearchModal } from "@/components/ContextSearchModal";
import { useGetPopularSessions, getGetPopularSessionsQueryKey } from "@workspace/api-client-react";

const { width } = Dimensions.get("window");
const H_PAD = 20;
const GAP = 16;
const SECTION_GAP = 53;
const EXPLORE_SECTIONS_CACHE_KEY = "cdc_explore_sections_v1";

const SQCARD_W = Math.round((width - H_PAD * 2) / 1.85);

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

function ChakraCarousel() {
  const { openCategory } = useCategoryOverlay();
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Armoniza tus chakras</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginHorizontal: -H_PAD }}
        contentContainerStyle={styles.carouselContent}
      >
        {CHAKRAS.map((chakra) => (
          <Pressable
            key={chakra.id}
            onPress={() => openCategory(`/chakra/${chakra.id}`)}
            style={({ pressed }) => [styles.chakraCard, { opacity: pressed ? 0.82 : 1 }]}
          >
            <View style={[styles.chakraImageWrap, { backgroundColor: `${chakra.color}22` }]}>
              <Image
                source={chakra.image}
                style={styles.chakraImage}
                contentFit="cover"
                placeholder={BLUR_PLACEHOLDER}
                transition={IMAGE_TRANSITION}
              />
            </View>
            <Text style={styles.chakraName} numberOfLines={1}>
              {chakra.name}
            </Text>
            <Text style={styles.chakraDescription} numberOfLines={1}>
              {chakra.description}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function ExploreScreen() {
  const { openCategory } = useCategoryOverlay();
  const colors   = useColors();
  const insets   = useSafeAreaInsets();
  const { photoUri } = useUserProfile();
  const { open: openDrawer } = useDrawer();
  const [searchVisible, setSearchVisible] = useState(false);
  const [query, setQuery] = useState("");

  const { isPremium } = usePremium();
  const { playSession, history } = usePlayer();
  const { version: catalogVersion } = useCatalog();
  const { theme: activeTheme, activeSceneId } = useSceneTheme();
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

  const ancestralesSessions  = SESSIONS.filter(s => s.categoryId === "sonidos-ancestrales").slice(0, 10);
  const musicaSessions       = SESSIONS.filter(s => s.categoryId === "musica-sonidos").slice(0, 10);
  const meditacionesSessions = SESSIONS.filter(s => s.categoryId === "meditaciones-guiadas").slice(0, 10);

  // ── Recientes (últimas meditaciones agregadas) ──
  const recientesMeditaciones = React.useMemo(() => {
    return SESSIONS
      .filter((s) => s.categoryId === "meditaciones-guiadas")
      .sort((a, b) => parseInt(b.id) - parseInt(a.id))
      .slice(0, 10);
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
        label: sec.label,
        sessions: SESSIONS.filter((s) =>
          (s.themeTag as readonly string[] | undefined)?.includes(sec.label),
        ),
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
  const titleCompactAnim = React.useRef(new Animated.Value(0)).current;
  const titleCompactRef = React.useRef(false);
  const compactTitleOpacity = titleCompactAnim;
  const largeTitleOpacity = titleCompactAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });
  const handleExploreScroll = React.useCallback((event: { nativeEvent: { contentOffset: { y: number } } }) => {
    const shouldCompact = event.nativeEvent.contentOffset.y > 8;
    if (shouldCompact === titleCompactRef.current) return;
    titleCompactRef.current = shouldCompact;
    Animated.timing(titleCompactAnim, {
      toValue: shouldCompact ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [titleCompactAnim]);


  function handleSessionPress(s: Session) {
    const locked = s.isPremium && !isPremium;
    if (locked) { router.push("/membresia" as never); return; }
    if (s.skipMiniPlayer) { playSession(s); return; }
    if (s.skipDetail) { playSession(s); router.push("/player" as never); return; }
    openCategory(`/session/${s.id}`);
  }

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

      <View style={styles.contentShift}>
        {/* ── Header sticky desde el inicio — título + accesos ── */}
        <View
          style={[
            styles.fixedHeader,
            {
              paddingTop: topPad + 2,
            },
          ]}
        >
          <View style={styles.titleRow}>
            <Animated.Text style={[styles.pageTitle, { opacity: largeTitleOpacity }]}>
              Descubrir
            </Animated.Text>
            <Animated.View
              pointerEvents="none"
              style={[styles.compactTitleOverlay, { opacity: compactTitleOpacity }]}
            >
              <Text style={styles.compactPageTitle}>Descubrir</Text>
            </Animated.View>
            <Pressable
              onPress={() => setSearchVisible(true)}
              hitSlop={10}
              style={[
                styles.headerSearchButton,
                activeSceneId === "indigo" && { backgroundColor: "rgba(42,40,64,0.65)" },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Buscar en Descubrir"
              testID="discover-search-button"
            >
              <Feather name="search" size={24} color="#F9F9F9" />
            </Pressable>
          </View>
          <ContentCategoryGrid
            marginTop={4}
            marginBottom={0}
            hiddenIds={["__mezcla__", "__geometrix__"]}
            horizontal
          />
        </View>

        <Animated.ScrollView
          style={styles.scroll}
          contentContainerStyle={{ paddingBottom: 160 + bottomPad }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onScroll={handleExploreScroll}
          scrollEventThrottle={16}
        >
          {/* ── Carruseles configurados en Explorar — orden y visibilidad desde Admin ── */}
          {themeCarousels.map((carousel) => (
            <SessionCarousel
              key={carousel.label}
              title={carousel.label}
              sessions={carousel.sessions}
              isPremium={isPremium}
              onPress={(s) => handleSessionPress(s)}
              style={{
                marginTop: carousel.label.trim().toLowerCase() === "para la ansiedad" ? 5 : 0,
                marginBottom: SECTION_GAP,
              }}
              cardWidth={SQCARD_W}
              titleSize={19}
              showCardMetadata
            />
          ))}

          {/* ── Chakras ── */}
          <ChakraCarousel />

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
        </Animated.ScrollView>
      </View>

      <ContextSearchModal
        visible={searchVisible}
        onClose={() => setSearchVisible(false)}
        items={discoverSearchItems}
        placeholder="Buscar en Descubrir..."
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

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: "#210911" },
  rootGradient: { ...StyleSheet.absoluteFillObject },
  contentShift: { flex: 1, transform: [{ translateY: -5 }] },
  scroll: { flex: 1 },

  fixedHeader:  { zIndex: 10, paddingBottom: 15 },
  titleRow:     { position: "relative", flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 19, paddingBottom: 10, paddingTop: 7 },
  compactTitleOverlay: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
  compactPageTitle: { fontFamily: "Manrope", fontSize: 18, fontWeight: "700", letterSpacing: 0.2, color: "#F9F9F9", textAlign: "center" },
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
  pageTitle:    { fontFamily: "Manrope", fontSize: 30, fontWeight: "700", letterSpacing: 0.3, color: "#F4F4F4", textAlign: "left", marginTop: 0, transform: [{ translateY: 1 }] },
  searchWrap:   { paddingHorizontal: H_PAD, paddingTop: 16, paddingBottom: 15 },
  searchBox:    { flexDirection: "row" as "row", alignItems: "center" as "center", gap: 10, borderRadius: 999, borderWidth: 1.5, paddingHorizontal: 18, height: 45 },
  searchInput:  { fontFamily: "Manrope", flex: 1, fontSize: 15, fontWeight: "300", padding: 0 },
  pageSubtitle: { fontFamily: "Manrope", fontSize: 14, color: "#F4F4F4", marginTop: 2 },

  section:      { paddingHorizontal: H_PAD, marginBottom: SECTION_GAP },
  sectionRow:   { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", marginBottom: 21 },
  sectionTitle: { fontFamily: "Manrope", fontSize: 19, fontWeight: "700", letterSpacing: 0.3, color: "#FBFBFB", marginBottom: 21 },
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
  chakraCard: {
    width: SQCARD_W,
  },
  chakraImageWrap: {
    width: SQCARD_W,
    height: SQCARD_W,
    borderRadius: 15,
    overflow: "hidden",
    marginBottom: 10,
  },
  chakraImage: {
    width: "100%",
    height: "100%",
  },
  chakraName: {
    fontFamily: "Manrope",
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 20,
    color: "#FBFBFB",
    marginBottom: 7,
  },
  chakraDescription: {
    fontFamily: "Manrope",
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "400",
    color: "rgba(255,255,255,0.60)",
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
