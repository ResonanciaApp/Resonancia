import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Image } from "expo-image";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useColors } from "@/hooks/useColors";
import { getSessionsByDescansoTag, getSessionById, getDescansoVisibleSessions } from "@/data/sessions";
import { DESCANSO_TAG_CARDS } from "@/data/tags";
import { useCatalog } from "@/context/CatalogContext";
import { SessionCarousel } from "@/components/SessionCarousel";
import { SessionBadgeGlass, SessionDurationBadge } from "@/components/SessionDurationBadge";
import { ContextSearchModal } from "@/components/ContextSearchModal";
import { usePlayerBrowse } from "@/context/PlayerContext";
import { useAmbientalDuration } from "@/context/AmbientalDurationContext";
import { usePremium } from "@/context/PremiumContext";
import { isIndigoThemeId } from "@/config/scene-themes";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { useBackOverride } from "@/context/BackOverrideContext";
import { useCategoryOverlay } from "@/context/CategoryOverlayContext";
import {
  CONTENT_CAROUSEL_GAP,
  getContentCarouselCardWidth,
} from "@/constants/carousel";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function SleepPill({
  sel, label, icon, onPress,
}: {
  sel: boolean;
  label: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  onPress: () => void;
}) {
  const { theme } = useSceneTheme();
  const scale = useRef(new Animated.Value(1)).current;
  const pressCancelledRef = useRef(false);

  const animatePress = useCallback((pressed: boolean) => {
    scale.stopAnimation();
    if (pressed) {
      Animated.timing(scale, {
        toValue: 0.97,
        duration: 90,
        useNativeDriver: true,
      }).start();
      return;
    }
    Animated.spring(scale, {
      toValue: 1,
      tension: 180,
      friction: 14,
      useNativeDriver: true,
    }).start();
  }, [scale]);

  const finishPress = useCallback(() => {
    animatePress(false);
  }, [animatePress]);

  const cancelTouch = useCallback(() => {
    pressCancelledRef.current = true;
    animatePress(false);
  }, [animatePress]);

  return (
    <Animated.View
      collapsable={false}
      style={[styles.sleepPillAnimated, { transform: [{ scale }] }]}
    >
      <AnimatedPressable
        onPressIn={() => {
          pressCancelledRef.current = false;
          animatePress(true);
        }}
        onTouchEnd={finishPress}
        onTouchCancel={cancelTouch}
        onPress={() => {
          if (pressCancelledRef.current) return;
          onPress();
        }}
        style={[
          styles.sleepPill,
          theme.id === "tibet" && styles.sleepPillTibet,
          isIndigoThemeId(theme.id) && styles.sleepPillIndigo,
          !sel && theme.id === "indigo2" && styles.sleepPillIndigo2Inactive,
          sel && styles.sleepPillSel,
        ]}
      >
        {sel && <LinearGradient colors={["#784576", "#50326E"]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFill} />}
        <MaterialCommunityIcons name={icon} size={22} color="#FFFFFF" />
        <Text style={[styles.sleepPillText, sel && styles.sleepPillTextSel]} numberOfLines={1}>
          {label}
        </Text>
      </AnimatedPressable>
    </Animated.View>
  );
}

const H_PAD = 16;
const HERO_H = 220;
const { width: W, height: H } = Dimensions.get("window");
const CARD_W = getContentCarouselCardWidth(W, H_PAD);
const SLEEP_MUSIC_CARD_W = Math.round(
  (W - H_PAD - CONTENT_CAROUSEL_GAP) / 1.85,
);
const SOUND_CARD_W  = 120;

/* ─── Pantalla ──────────────────────────────────────────────────────── */
export default function DescansoScreen() {
  const colors    = useColors();
  const insets    = useSafeAreaInsets();
  const topPad    = Platform.OS === "web" ? 67 : Math.max(insets.top, 40);
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const { theme: sceneTheme } = useSceneTheme();
  const bgGradient = sceneTheme.gradient;
  const indigoSurface = isIndigoThemeId(sceneTheme.id) ? "rgba(181,211,255,0.057)" : undefined;

  const [searchVisible, setSearchVisible] = useState(false);
  const { version: catalogVersion } = useCatalog();

  const stickyHeaderOpacity = useRef(new Animated.Value(0)).current;
  const stickyHeaderActiveRef = useRef(false);
  const [stickyHeaderActive, setStickyHeaderActive] = useState(false);
  const stickyTitleTranslateY = stickyHeaderOpacity.interpolate({
    inputRange: [0, 1],
    outputRange: [20, 0],
  });

  const handleScroll = useCallback((event: {
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

  const {
    currentSession,
    playSession,
    history,
  } = usePlayerBrowse();
  const { openCategory } = useCategoryOverlay();
  const { openForSession } = useAmbientalDuration();
  const { isPremium } = usePremium();

  /** Lógica de tres estados para tocar una sesión de Dormir
   *  (idéntica a SessionCard.tsx handlePress):
   *  1. skipMiniPlayer → arrancar audio (miniplayer se muestra solo), sin navegar
   *  2. skipDetail === true  O  categoría en SKIP_DETAIL_CATS → arrancar audio + reproductor completo
   *  3. Sin flags → abrir pantalla de detalle SIN arrancar audio
   */
  const DESCANSO_SKIP_DETAIL_CATS = ["sonidos-ancestrales", "musica-sonidos"];
  const handleSessionTap = useCallback(
    (s: Parameters<typeof playSession>[0]) => {
      if (s.isPremium && !isPremium) {
        router.push("/membresia" as never);
        return;
      }
      if (openForSession(s)) return;
      if (s.skipMiniPlayer) {
        if (currentSession?.id !== s.id) playSession(s);
        return;
      }
      const goToPlayer =
        s.skipDetail !== false &&
        (s.skipDetail === true || DESCANSO_SKIP_DETAIL_CATS.includes(s.categoryId ?? ""));
      if (goToPlayer) {
        if (currentSession?.id !== s.id) playSession(s);
        router.push("/player" as never);
        return;
      }
      openCategory(`/session/${s.id}`);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentSession, isPremium, openCategory, openForSession, playSession],
  );

  const backOverride = useBackOverride();

  const tabBarH = 68 + Math.max(8, bottomPad - 10);

  const sleepCollections = useMemo(
    () =>
      DESCANSO_TAG_CARDS.map((tag) => ({
        ...tag,
        sessions: getSessionsByDescansoTag(tag.label).slice(0, 5),
      })).filter((tag) => tag.sessions.length > 0),
    [catalogVersion],
  );
  const sleepCarouselStyles = useMemo(
    () =>
      sleepCollections.map((_, index) => ({
        marginTop: index === 0 ? 33 : 53,
        marginBottom: 0,
        paddingHorizontal: H_PAD,
      })),
    [sleepCollections],
  );
  const sleepCarouselViewAllHandlers = useMemo(
    () =>
      Object.fromEntries(
        sleepCollections.map((collection) => [
          collection.id,
          () => openCategory(`/sleep-tag/${collection.id}`),
        ]),
      ) as Record<string, () => void>,
    [openCategory, sleepCollections],
  );

  // allDescansoIds usa getDescansoVisibleSessions() como fuente de verdad compartida
  // con el reproductor: solo las sesiones con tags en DESCANSO_VISIBLE_TAGS.
  const allDescansoIds = useMemo(() => {
    const ids = new Set<string>();
    getDescansoVisibleSessions().forEach((s) => ids.add(s.id));
    return ids;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catalogVersion]);

  const recentInDescanso = useMemo(() => {
    const seen = new Set<string>();
    const result: import("@/data/sessions").Session[] = [];
    for (const h of history) {
      if (seen.has(h.sessionId)) continue;
      seen.add(h.sessionId);
      const s = getSessionById(h.sessionId);
      if (s && allDescansoIds.has(s.id)) result.push(s);
      if (result.length === 10) break;
    }
    return result;
  }, [history, allDescansoIds]);

  const cardW = (W - H_PAD * 2 - 14) / 2;

  // ── "Todas las sesiones" Modal ──
  const [allVisible,      setAllVisible]      = useState(false);
  const [allVisibleCount, setAllVisibleCount] = useState(20);
  const slideX = useRef(new Animated.Value(W)).current;
  const closeAll = () => {
    Animated.timing(slideX, { toValue: W, duration: 280, easing: Easing.in(Easing.cubic), useNativeDriver: true })
      .start(() => { setAllVisible(false); setAllVisibleCount(20); });
  };
  useEffect(() => {
    if (!allVisible) return;
    slideX.setValue(W);
    Animated.timing(slideX, { toValue: 0, duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [allVisible]); // eslint-disable-line react-hooks/exhaustive-deps

  // Mismo conjunto que la cola implícita del reproductor (DESCANSO_VISIBLE_TAGS).
  const allDormiSessions = useMemo(() => getDescansoVisibleSessions(), [catalogVersion]);
  const sleepSearchItems = useMemo(
    () =>
      allDormiSessions.map((session) => ({
        id: session.id,
        title: session.title,
        meta: session.categoryLabel,
        subtitle: session.subtitle ?? undefined,
        searchText: [session.title, session.categoryLabel, session.subtitle ?? ""].join(" "),
        image: session.image as number,
      })),
    [allDormiSessions],
  );

  return (
    <LinearGradient
      colors={bgGradient}
      style={styles.root}
    >
      <StatusBar hidden />

      <View style={styles.contentShift}>
        <Animated.View
          pointerEvents={stickyHeaderActive ? "auto" : "none"}
          style={[
            styles.stickyHeader,
            {
              paddingTop: topPad + 2,
              backgroundColor: sceneTheme.gradient[0] as string,
              opacity: stickyHeaderOpacity,
            },
          ]}
        >
          <View style={styles.titleRow}>
            <Animated.Text
              style={[
                styles.stickyTitle,
                {
                  color: colors.foreground,
                  transform: [{ translateY: stickyTitleTranslateY }],
                },
              ]}
            >
              Dormir
            </Animated.Text>
            <Pressable
              onPress={() => setSearchVisible(true)}
              hitSlop={10}
              style={[styles.headerSearchButton, indigoSurface && { backgroundColor: indigoSurface }]}
              accessibilityRole="button"
              accessibilityLabel="Buscar en Dormir"
              testID="sleep-search-button"
            >
              <Feather name="search" size={24} color={colors.foreground} />
            </Pressable>
          </View>
        </Animated.View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{ paddingBottom: 140 + bottomPad }}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={handleScroll}
        >
          <View style={{ paddingTop: topPad + 2 }}>
            <View style={styles.titleRow}>
              <Text style={[styles.heroTitle, { color: colors.foreground }]}>
                Dormir
              </Text>
              <Pressable
                onPress={() => setSearchVisible(true)}
                hitSlop={10}
                style={[styles.headerSearchButton, indigoSurface && { backgroundColor: indigoSurface }]}
                accessibilityRole="button"
                accessibilityLabel="Buscar en Dormir"
                testID="sleep-search-button"
              >
                <Feather name="search" size={24} color={colors.foreground} />
              </Pressable>
            </View>
            <View style={styles.sleepTabsHeader}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={[styles.tabGrid, { marginBottom: 0 }]}
                contentContainerStyle={styles.tabGridContent}
              >
                {sleepCollections.map((tab) => (
                  <SleepPill
                    key={tab.id}
                    sel={false}
                    label={tab.label}
                    icon={tab.icon as React.ComponentProps<typeof MaterialCommunityIcons>["name"]}
                    onPress={() => openCategory(`/sleep-tag/${tab.id}`)}
                  />
                ))}
              </ScrollView>
            </View>
          </View>
          <View style={{ marginTop: -3 }}>
            {sleepCollections.map((collection, index) => {
              const isSleepMusic = collection.id === "musica-para-dormir";
              return (
                <SessionCarousel
                  key={collection.id}
                  title={collection.label}
                  sessions={collection.sessions}
                  isPremium={isPremium}
                  onPress={handleSessionTap}
                  style={sleepCarouselStyles[index]}
                  cardWidth={isSleepMusic ? SLEEP_MUSIC_CARD_W : CARD_W}
                  allowOversizedCardWidth={isSleepMusic}
                  titleSize={19}
                  squareCards={isSleepMusic}
                  showCardMetadata={!isSleepMusic}
                  showAuthor={isSleepMusic}
                  showDurationBadge={!isSleepMusic}
                  hideAmbientalTitleInSquareRecent={isSleepMusic}
                  onViewAll={sleepCarouselViewAllHandlers[collection.id]}
                />
              );
            })}
          </View>
        </ScrollView>
      </View>

      <ContextSearchModal
        visible={searchVisible}
        onClose={() => setSearchVisible(false)}
        items={sleepSearchItems}
        placeholder="Buscar en Dormir..."
        emptyTitle="Encuentra algo para descansar"
        emptySubtitle="Busca historias, ASMR y sonidos para dormir"
        onSelect={(item) => {
          const session = allDormiSessions.find((candidate) => candidate.id === item.id);
          if (session) handleSessionTap(session);
        }}
      />

      {/* ── Modal "Todas las sesiones de Dormir" (desliza desde la derecha) ── */}
      <Modal visible={allVisible} transparent animationType="none" onRequestClose={closeAll} statusBarTranslucent>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: bgGradient[bgGradient.length - 1] as string, transform: [{ translateX: slideX }] }]}>
          <LinearGradient colors={bgGradient} style={StyleSheet.absoluteFill} />

          {/* Cabecera */}
          <View style={{ flexDirection: "row", alignItems: "center", paddingTop: topPad + 14, paddingHorizontal: H_PAD, paddingBottom: 14, gap: 4 }}>
            <Pressable onPress={closeAll} hitSlop={12} style={{ padding: 4 }}>
              <Feather name="chevron-left" size={28} color="#FBFBFB" />
            </Pressable>
            <Text style={{ fontFamily: "Manrope", fontSize: 20, fontWeight: "700", color: "#FBFBFB", flex: 1 }}>
              Sesiones de Dormir
            </Text>
          </View>

          {/* Grilla paginada */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              flexDirection: "row", flexWrap: "wrap",
              columnGap: 14, paddingHorizontal: H_PAD,
              rowGap: 24, paddingTop: 8, paddingBottom: 120 + bottomPad,
            }}
            scrollEventThrottle={16}
            onScroll={(e) => {
              const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
              if (contentOffset.y + layoutMeasurement.height >= contentSize.height - 300) {
                setAllVisibleCount((c) => c + 20);
              }
            }}
          >
            {allDormiSessions.slice(0, allVisibleCount).map((s) => {
              const locked = !!s.isPremium && !isPremium;
              return (
                <Pressable
                  key={s.id}
                  onPress={() => {
                    if (locked) { router.push("/membresia" as never); return; }
                    closeAll();
                    handleSessionTap(s);
                  }}
                  style={({ pressed }) => [{ width: cardW, opacity: pressed ? 0.85 : 1 }]}
                >
                  <View style={{ width: "100%", aspectRatio: 1, borderRadius: 17, overflow: "hidden" }}>
                    <Image
                      source={s.image as number}
                      style={{ width: "100%", height: "100%" }}
                      contentFit="cover"
                      cachePolicy="memory-disk"
                    />
                    <SessionDurationBadge label={s.durationLabel} style={{ position: "absolute", bottom: 8, left: 8 }} />
                    {locked && (
                      <View style={{ position: "absolute", top: 6, right: 6, width: 20, height: 20, borderRadius: 10, backgroundColor: "rgba(0,0,0,0.55)", alignItems: "center", justifyContent: "center" }}>
                        <Feather name="lock" size={9} color="#fff" />
                      </View>
                    )}
                  </View>
                  <Text style={{ fontFamily: "Manrope", fontSize: 13, fontWeight: "600", color: "#FBFBFB", lineHeight: 18, marginTop: 8 }} numberOfLines={2}>
                    {s.title}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </Animated.View>
      </Modal>

    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1 },
  contentShift: { flex: 1, transform: [{ translateY: -5 }] },
  stickyHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
  },
  scroll: { flex: 1 },

  /* Session grid (Historias / ASMR) */
  sessionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: H_PAD,
    rowGap: 35,
    marginTop: -17,
    marginBottom: 6,
  },

  /* Sound grid */
  soundGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: H_PAD,
    gap: 10,
    marginTop: -17,
    marginBottom: 6,
  },
  soundCell: {
    width: (W - H_PAD * 2 - 20) / 3,
    alignItems: "center",
  },
  todosSectionTitle: {
    fontFamily: "Manrope",
    fontSize: 19,
    fontWeight: "700",
    letterSpacing: 0.3,
    color: "#FBFBFB",
    marginTop: 24,
    marginBottom: 21,
    paddingHorizontal: H_PAD,
  },
  allSessionsButton: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
    overflow: "hidden",
    paddingHorizontal: 28,
    paddingVertical: 9,
    gap: 6,
    marginTop: 29,
    marginBottom: 16,
  },
  allSessionsButtonText: {
    fontFamily: "Manrope",
    fontSize: 13,
    fontWeight: "600",
    color: "#F9F9F9",
  },
  soundImageWrap: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 17,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "transparent",
  },
  soundImageWrapSel: {
    borderColor: "rgba(255,255,255,0.8)",
  },
  soundImage: {
    width: "100%",
    height: "100%",
  },
  soundOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.38)",
  },
  soundLabel: {
    fontFamily: "Manrope",
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
    marginTop: 8,
    paddingHorizontal: 2,
    color: "#FBFBFB",
  },
  soundLabelSel: {
    color: "#FBFBFB",
  },

  dormirMiniPlayer: {
    position: "absolute",
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.40)",
    paddingLeft: 0,
    paddingRight: 0,
    paddingVertical: 0,
    gap: 12,
    height: 64,
    overflow: "hidden",
  },
  dormirMiniImg: {
    width: 60,
    height: 64,
    borderRadius: 0,
    marginLeft: 0,
  },
  dormirMiniPlayBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  dormirMiniTitle: {
    fontFamily: "Manrope",
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255,255,255,0.92)",
    marginBottom: 2,
  },
  dormirMiniSub: {
    fontFamily: "Manrope",
    fontSize: 12,
    color: "rgba(255,255,255,0.48)",
  },

  /* Sleep pills */
  sleepPillAnimated: {
    alignSelf: "flex-start",
  },
  tabGrid: {
    marginBottom: 43,
  },
  tabGridContent: {
    paddingHorizontal: H_PAD,
    gap: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  sleepPillBorder: {},
  sleepPillBorderSel: {},
  sleepPill: {
    flexDirection: "row",
    alignItems: "center",
    height: 51,
    paddingHorizontal: 16,
    borderRadius: 27,
    gap: 12,
    overflow: "hidden",
    backgroundColor: "rgba(181,211,255,0.057)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  sleepPillTibet: { backgroundColor: "rgba(0,0,0,0.15)" },
  sleepPillIndigo: { backgroundColor: "rgba(181,211,255,0.057)" },
  sleepPillIndigo2Inactive: {
    backgroundColor: "rgba(255,255,255,0.025)",
    borderColor: "rgba(255,255,255,0.04)",
  },
  sleepPillInactive: { backgroundColor: "#2B2944" },
  sleepPillSel: {},
  sleepPillText: {
    fontFamily: "Manrope",
    fontSize: 13,
    fontWeight: "600",
    color: "#F4F4F4",
  },
  sleepPillTextSel: { fontFamily: "Manrope", color: "#F9F9F9", fontWeight: "600" },

  pageHeader: {
    backgroundColor: "transparent",
    overflow: "hidden",
  },
  titleRow: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: H_PAD,
    paddingTop: 7,
    paddingBottom: 10,
  },
  stickyTitle: {
    fontFamily: "Manrope",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0.2,
    textAlign: "left",
  },
  sleepTabsHeader: {
    marginTop: 9,
    paddingBottom: 15,
  },

  /* Hero */
  hero: {
    flexDirection: "column",
    alignItems: "stretch",
    paddingHorizontal: H_PAD,
    paddingTop: 7,
    paddingBottom: 10,
  },
  heroTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerSearchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  heroTitle: {
    fontFamily: "Manrope",
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: 0.3,
    textAlign: "left",
    marginTop: 0,
    transform: [{ translateY: 1 }],
  },
});
