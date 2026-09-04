import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  FlatList,
  Image,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { GeoUniverseBackground } from "@/components/GeoUniverseBackground";
import { DURATION, easeOutCubic } from "@/constants/motion";
import { useColors } from "@/hooks/useColors";
import { getSessionsByDescansoTag, getSessionById, getDescansoVisibleSessions } from "@/data/sessions";
import { DESCANSO_TAG_CARDS } from "@/data/tags";
import { useCatalog } from "@/context/CatalogContext";
import { useDescansoPlayerContext } from "@/context/DescansoPlayerContext";
import { SessionCarousel } from "@/components/SessionCarousel";
import { SessionBadgeGlass, SessionDurationBadge } from "@/components/SessionDurationBadge";
import { ContextSearchModal } from "@/components/ContextSearchModal";
import { usePlayerBrowse } from "@/context/PlayerContext";
import { useAmbientalDuration } from "@/context/AmbientalDurationContext";
import { usePremium } from "@/context/PremiumContext";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { useBackOverride } from "@/context/BackOverrideContext";
import { useCategoryOverlay } from "@/context/CategoryOverlayContext";
import { getTwoCardCarouselCardWidth } from "@/constants/carousel";
import { WIDGET_GREEN_SOLID } from "@/constants/colors";

const SLEEP_PILL_CANCEL_DISTANCE = 14;
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function SleepPill({
  sel, label, icon, indigo2BackgroundColor, onPress,
}: {
  sel: boolean;
  label: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  indigo2BackgroundColor?: Animated.AnimatedInterpolation<string | number> | string;
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

  const cancelPress = useCallback(() => {
    pressCancelledRef.current = true;
  }, []);

  const finishPress = useCallback(() => {
    animatePress(false);
  }, [animatePress]);

  const cancelTouch = useCallback(() => {
    pressCancelledRef.current = true;
    animatePress(false);
  }, [animatePress]);

  const panResponder = useRef(
    PanResponder.create({
      // Let Pressable and the horizontal ScrollView handle the initial touch.
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponderCapture: (_, gesture) =>
        gesture.dy > SLEEP_PILL_CANCEL_DISTANCE && gesture.dy > Math.abs(gesture.dx),
      onMoveShouldSetPanResponder: (_, gesture) =>
        gesture.dy > SLEEP_PILL_CANCEL_DISTANCE && gesture.dy > Math.abs(gesture.dx),
      onPanResponderGrant: cancelPress,
      onPanResponderRelease: finishPress,
      onPanResponderTerminate: cancelTouch,
    }),
  ).current;

  return (
    <Animated.View
      {...panResponder.panHandlers}
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
          theme.id === "indigo" && styles.sleepPillIndigo,
          !sel && theme.id === "indigo2" && styles.sleepPillIndigo2Inactive,
          !sel && theme.id === "indigo2" && indigo2BackgroundColor && {
            backgroundColor: indigo2BackgroundColor,
          },
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

const H_PAD = 14;
const HERO_H = 220;
const { width: W, height: H } = Dimensions.get("window");
// Igual que "Sesiones recientes" de Inicio 2: 2 cards completas + 10 px
// de la tercera, considerando el padding y gap del SessionCarousel.
const RECENT_CARD_W = getTwoCardCarouselCardWidth(W, H_PAD);
const SOUND_CARD_W  = 120;

/* ─── Constantes del sheet ───────────────────────────────────────────── */
const TIMER_OPTIONS = [15, 30, 45, 60, 90] as const;
const SHEET_BG = "#120A18";

/* ─── NightTimerSheet (controlado desde DescansoScreen) ─────────────── */
interface NightTimerSheetProps {
  visible:      boolean;
  onClose:      () => void;
  timerMin:     number | null;
  setTimerMin:  (v: number | null) => void;
  fadeVol:      boolean;
  setFadeVol:   (v: boolean) => void;
}

function NightTimerSheet({
  visible, onClose, timerMin, setTimerMin, fadeVol, setFadeVol,
}: NightTimerSheetProps) {
  const insets     = useSafeAreaInsets();
  const slideY     = useRef(new Animated.Value(500)).current;
  const backdropOp = useRef(new Animated.Value(0)).current;
  const [rendered, setRendered] = useState(false);

  useEffect(() => {
    if (visible) {
      setRendered(true);
      slideY.setValue(500);
      backdropOp.setValue(0);
      Animated.parallel([
        Animated.timing(slideY,     { toValue: 0,   duration: DURATION.SHEET_OPEN,  easing: easeOutCubic, useNativeDriver: true }),
        Animated.timing(backdropOp, { toValue: 1,   duration: DURATION.SHEET_OPEN,  easing: easeOutCubic, useNativeDriver: true }),
      ]).start();
    } else if (rendered) {
      Animated.parallel([
        Animated.timing(slideY,     { toValue: 500, duration: DURATION.SHEET_CLOSE, easing: easeOutCubic, useNativeDriver: true }),
        Animated.timing(backdropOp, { toValue: 0,   duration: DURATION.SHEET_CLOSE, easing: easeOutCubic, useNativeDriver: true }),
      ]).start(() => setRendered(false));
    }
  }, [visible]);

  if (!rendered) return null;

  return (
    <Modal transparent animationType="none" visible statusBarTranslucent onRequestClose={onClose}>
      <Animated.View
        style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.55)", opacity: backdropOp }]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      <Animated.View
        style={[
          styles.sheet,
          { paddingBottom: 28 + insets.bottom, transform: [{ translateY: slideY }] },
        ]}
      >
        <View style={styles.sheetHandle} />

        <View style={styles.sheetHeader}>
          <Ionicons name="moon" size={16} color="#FFFFFF" />
          <Text style={styles.sheetTitle}>Prepara tu noche</Text>
        </View>

        <Text style={styles.sheetLabel}>Temporizador</Text>
        <View style={styles.timerRow}>
          {TIMER_OPTIONS.map((min) => {
            const sel = timerMin === min;
            return (
              <Pressable
                key={min}
                onPress={() => setTimerMin(sel ? null : min)}
                style={[styles.timerChip, sel && styles.timerChipSel]}
              >
                <Text style={[styles.timerChipText, sel && styles.timerChipTextSel]}>
                  {min} min
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.fadeRow}>
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={styles.fadeTitle}>Desvanecer volumen</Text>
            <Text style={styles.fadeSub}>El sonido baja gradualmente hasta silenciarse</Text>
          </View>
          <Switch
            value={fadeVol}
            onValueChange={setFadeVol}
            trackColor={{ false: "rgba(255,255,255,0.12)", true: "#7B4FCE" }}
            thumbColor={fadeVol ? "#C4A8F5" : "rgba(255,255,255,0.6)"}
          />
        </View>
      </Animated.View>
    </Modal>
  );
}


/* ─── Pantalla ──────────────────────────────────────────────────────── */
export default function DescansoScreen() {
  const colors    = useColors();
  const insets    = useSafeAreaInsets();
  const topPad    = Platform.OS === "web" ? 67 : Math.max(insets.top, 40);
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const { theme: sceneTheme } = useSceneTheme();
  const bgGradient = sceneTheme.gradient;
  const indigoSurface = sceneTheme.id === "indigo" ? "rgba(42,40,64,0.65)" : undefined;

  const [timerSheet,  setTimerSheet]  = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollResumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { version: catalogVersion } = useCatalog();
  const { timerMinutes: timerMin, setTimerMinutes: setTimerMin, fadeVolume: fadeVol, setFadeVolume: setFadeVol } = useDescansoPlayerContext();

  const indigo2TabsBackgroundColor = "rgba(255,255,255,0.05)";

  const pauseBackgrounds = useCallback(() => {
    if (scrollResumeTimerRef.current) clearTimeout(scrollResumeTimerRef.current);
    setIsScrolling(true);
  }, []);
  const resumeBackgrounds = useCallback(() => {
    if (scrollResumeTimerRef.current) clearTimeout(scrollResumeTimerRef.current);
    scrollResumeTimerRef.current = setTimeout(() => setIsScrolling(false), 80);
  }, []);
  useEffect(() => () => {
    if (scrollResumeTimerRef.current) clearTimeout(scrollResumeTimerRef.current);
  }, []);

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
      <GeoUniverseBackground paused={isScrolling} />

      <View style={styles.contentShift}>
        <FlatList
          style={styles.scroll}
          data={sleepCollections}
          keyExtractor={(collection) => collection.id}
          contentContainerStyle={{ paddingBottom: 140 + bottomPad }}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          initialNumToRender={2}
          maxToRenderPerBatch={2}
          windowSize={5}
          onScrollBeginDrag={pauseBackgrounds}
          onMomentumScrollBegin={pauseBackgrounds}
          onScrollEndDrag={resumeBackgrounds}
          onMomentumScrollEnd={resumeBackgrounds}
          ListHeaderComponent={(
            <View
              style={[
                styles.pageHeader,
                { paddingTop: topPad + 2, marginBottom: -3 },
              ]}
            >
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
                      indigo2BackgroundColor={indigo2TabsBackgroundColor}
                      onPress={() => openCategory(`/sleep-tag/${tab.id}`)}
                    />
                  ))}
                </ScrollView>
              </View>
            </View>
          )}
          renderItem={({ item: collection, index }) => (
            <SessionCarousel
              title={collection.label}
              sessions={collection.sessions}
              isPremium={isPremium}
              onPress={handleSessionTap}
              style={sleepCarouselStyles[index]}
              cardWidth={RECENT_CARD_W}
              titleSize={19}
              showCardMetadata
              showAuthor={false}
              onViewAll={sleepCarouselViewAllHandlers[collection.id]}
            />
          )}
        />
      </View>

      <NightTimerSheet
        visible={timerSheet}
        onClose={() => setTimerSheet(false)}
        timerMin={timerMin}
        setTimerMin={setTimerMin}
        fadeVol={fadeVol}
        setFadeVol={setFadeVol}
      />

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
                    <Image source={s.image as number} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
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
  scroll: { flex: 1 },

  /* NightTimerSheet */
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: SHEET_BG,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingTop: 12,
    paddingHorizontal: 24,
  },
  sheetHandle: {
    alignSelf: "center",
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.18)",
    marginBottom: 20,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 28,
  },
  sheetTitle: {
    fontFamily: "Manrope",
    fontSize: 19,
    fontWeight: "700",
    color: "#FBFBFB",
  },
  sheetLabel: {
    fontFamily: "Manrope",
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255,255,255,0.45)",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  timerRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 28,
  },
  timerChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
  },
  timerChipSel: {
    backgroundColor: "rgba(196,168,245,0.15)",
    borderColor: "rgba(196,168,245,0.5)",
  },
  timerChipText: {
    fontFamily: "Manrope",
    fontSize: 12,
    color: "rgba(255,255,255,0.45)",
    fontWeight: "500",
  },
  timerChipTextSel: {
    fontFamily: "Manrope",
    color: "#C4A8F5",
    fontWeight: "700",
  },
  fadeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.05)",
  },
  fadeTitle: {
    fontFamily: "Manrope",
    fontSize: 15,
    fontWeight: "600",
    color: "rgba(255,255,255,0.88)",
    marginBottom: 2,
  },
  fadeSub: {
    fontFamily: "Manrope",
    fontSize: 12,
    color: "rgba(255,255,255,0.4)",
    lineHeight: 16,
  },

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

  /* Banner Prepara tu noche */
  nightBannerWrap: {
    marginHorizontal: H_PAD,
    marginTop: -17,
    marginBottom: 24,
    borderRadius: 14,
    overflow: "hidden",
  },
  nightBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 12,
    paddingHorizontal: 4,
    minHeight: 78,
  },
  nightBannerTitle: {
    fontFamily: "Manrope",
    fontSize: 14,
    fontWeight: "700",
    color: "rgba(255,255,255,0.9)",
    marginBottom: 3,
  },
  nightBannerSub: {
    fontFamily: "Manrope",
    fontSize: 12,
    lineHeight: 17,
    color: "rgba(255,255,255,0.5)",
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
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  sleepPillTibet: { backgroundColor: "rgba(0,0,0,0.15)" },
  sleepPillIndigo: { backgroundColor: "rgba(42,40,64,0.65)" },
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
  compactTitleOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  compactPageTitle: {
    fontFamily: "Manrope",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0.2,
    textAlign: "center",
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
