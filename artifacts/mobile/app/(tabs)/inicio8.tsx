import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useUser } from "@clerk/expo";
import { useDayRollover } from "@/hooks/useDayRollover";
import { useStreak } from "@/hooks/useStreak";
import { useStreakCelebration } from "@/context/StreakCelebrationContext";
import MaskedView from "@react-native-masked-view/masked-view";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing as RNEasing,
  Image,
  FlatList,
  Keyboard,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import RAnimated, {
  cancelAnimation,
  Easing,
  runOnJS,
  type SharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Svg, { Circle as SvgCircle } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AlmaCommunitySection } from "@/components/AlmaCommunitySection";
import { GreetingHeader } from "@/components/GreetingHeader";
import { useGreetingVisible } from "@/context/GreetingVisibleContext";
import { useDrawer } from "@/context/DrawerContext";
import { useCategoryOverlay } from "@/context/CategoryOverlayContext";
import { getWeeklyPhrase } from "@/data/greeting-phrases";
import { MessageDeck } from "@/components/MessageDeck";
import { GlowRing } from "@/components/GlowRing";
import { MoodPickerSheet } from "@/components/MoodPickerSheet";
import { SessionActionsSheet } from "@/components/SessionActionsSheet";
import { SessionCard } from "@/components/SessionCard";
import { SessionCategoryPill } from "@/components/SessionCardMetadataOverlay";
import { SessionRow } from "@/components/SessionRow";
import { EqualizerBars } from "@/components/EqualizerBars";
import { SessionCarousel, CoverCarousel } from "@/components/SessionCarousel";
import { Image as ExpoImage } from "expo-image";
import { useAmbientPlayer, AMBIENT_SCENES } from "@/context/AmbientPlayerContext";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { useCatalog } from "@/context/CatalogContext";
import { useFoldersPlaylists } from "@/context/FoldersPlaylistsContext";
import { useMixer } from "@/context/MixerContext";
import { useMixerPanel } from "@/context/MixerPanelContext";
import { useGeometrixPanel } from "@/context/GeometrixPanelContext";
// voiceLabel no usado en hero
import { getSoundImage } from "@/config/sound-images";
import { usePlayer } from "@/context/PlayerContext";
import { useIntencion } from "@/context/IntencionContext";
import { TEMAS } from "@/data/temas";
import { useGetSceneAnimations } from "@workspace/api-client-react";
import type { SceneAnimation } from "@workspace/api-client-react";
import { SceneAnimationCard } from "@/components/SceneAnimationCard";
import { useRacha } from "@/context/RachaContext";
import { useIntencionDiaria } from "@/context/IntencionDiariaContext";
import { useSelectedScene } from "@/context/SelectedSceneContext";
import { useTabBarVisibility } from "@/context/TabBarVisibilityContext";
import { SceneAnimationInline } from "@/components/SceneAnimationInline";
import { EscenasAnimSheet } from "@/components/EscenasAnimSheet";
import { SESSIONS, getSessionById, type Session } from "@/data/sessions";
import { getMoodById, type Mood, type MoodId } from "@/data/moods";
import { getArtist } from "@/data/artists";
import { getGuide } from "@/data/guides";
import { usePremium } from "@/context/PremiumContext";
import { useUserProfile } from "@/context/UserProfileContext";
import { useColors } from "@/hooks/useColors";
import PremiumBanner from "@/components/PremiumBanner";
import QuoteOfTheDay from "@/components/QuoteOfTheDay";
import { ProgresoModal } from "@/components/ProgresoModal";
import { LiveSessionCard } from "@/components/LiveSessionCard";
import { useLiveSessions } from "@/hooks/useLiveSessions";
import { VideoCard } from "@/components/VideoCard";
import { CardTint } from "@/components/CardTint";
import { useVideos } from "@/hooks/useVideos";
import { ToolsGrid } from "@/components/ToolsGrid";
import { ResonadoresSection } from "@/components/ResonadoresSection";
import { EncuentrosResonadoresSection } from "@/components/EncuentrosResonadoresSection";
import { DailyRecommendationsSection } from "@/components/DailyRecommendationsSection";
import { RecommendedForYouSection } from "@/components/RecommendedForYouSection";
import { CONTENT_CAROUSEL_GAP } from "@/constants/carousel";

const { width, height } = Dimensions.get("window");

// Sentinel interno para "sin filtro" (ya no hay chip visible de "Todos": es el
// estado por defecto al entrar a la app).
const TODOS_TAB_ID = "todos";
const NAV_TABS = [
  { id: "meditaciones",  label: "Meditaciones",   cats: ["meditaciones-guiadas"] },
  { id: "sesiones",      label: "Sonoterapia",  cats: ["sonidos-ancestrales"] },
  { id: "musica",        label: "Música",        cats: ["musica-sonidos"] },
];
const GRID_GAP = 12;
const GRID_PAD = 14;
const INICIO2_SECTION_GAP = 53;

const CARD_W = (width - GRID_PAD * 2 - GRID_GAP) / 2;
const CARD_H = CARD_W * 0.72;
const HERO_HEIGHT = 320;
const INICIO2_HERO_HEIGHT = Math.round(Math.min(465, Math.max(401, width * 0.92 + 75)) * 1.15 * 0.95);
const INICIO2_SLIDES = [
  {
    id: "templo",
    image: require("@/assets/images/inicio2-mistico-1.jpg"),
    destination: null,
    title: "Aprendamos a conectar con lo esencial",
    categoryId: undefined,
    description: "Un mensaje directo a tu corazón",
    actionLabel: "Descubrir",
  },
  {
    id: "lago",
    image: require("@/assets/images/inicio2-mistico-2.jpg"),
    destination: null,
    title: "Un viaje al interior del cosmos",
    categoryId: "meditaciones-guiadas",
    description: "Sesión destacada de la semana",
    actionLabel: "Escuchar",
  },
  {
    id: "arco",
    image: require("@/assets/images/inicio2-mistico-3.jpg"),
    destination: null,
    title: "Descubriendo sonidos nuevos",
    categoryId: "charlas",
    description: "Una reflexión de Nicolás",
    actionLabel: "Meditar",
  },
  {
    id: "oceano",
    image: require("@/assets/images/inicio2-mistico-4.jpg"),
    destination: null,
    title: "El pequeño saltamontes",
    categoryId: "historias",
    description: "Composición ganadora de primera semana de agosto.",
    actionLabel: "Escuchar",
  },
] as const;
const INICIO2_AUTOPLAY_DURATION = 6_000;
const INICIO2_CONTROL_SIZE = 18;
const INICIO2_CONTROL_STROKE_WIDTH = 3;
const INICIO2_CONTROL_RADIUS =
  (INICIO2_CONTROL_SIZE - INICIO2_CONTROL_STROKE_WIDTH) / 2;
const INICIO2_CONTROL_CIRCUMFERENCE =
  2 * Math.PI * INICIO2_CONTROL_RADIUS;
const INICIO2_PROGRESS_COLOR = "#FFFFFF";

const VIDEO_REG_W = 200;
// 1 card completa + 25% del siguiente visible: W = (screenWidth - leftPad - gap) / 1.25
const RECENT_CARD_W = Math.round((width - GRID_PAD * 2) / 1.85);
// Inicio 2: 1 card completa + 85% de la siguiente.
const INICIO2_SESSION_CARD_W = Math.max(
  120,
  Math.round(
    (width - GRID_PAD * 2 - CONTENT_CAROUSEL_GAP) / 1.85,
  ),
);
const INICIO2_SCROLL_START_THRESHOLD = 8;

const SECTION_GAP = 60;
const TEMA_GAP = 10;
const SHOW_CONTINUE_LISTENING = false;

const HEADER_PHRASES = [
  "Tu paz es tu práctica.",
  "Cada respiro, un comienzo.",
  "Hoy eliges cuidarte.",
  "La calma está en ti.",
  "Un momento para ti.",
];
const TEMA3_W = Math.floor((width - GRID_PAD * 2 - TEMA_GAP * 2) / 3);

const DURATION_SLOTS = [
  { label: "5 min",  displayLabel: "5 Minutos",  min: 0,  max: 5  },
  { label: "10 min", displayLabel: "10 Minutos", min: 6,  max: 10 },
  { label: "20 min", displayLabel: "20 Minutos", min: 11, max: 25 },
  { label: "30 min", displayLabel: "30 Minutos", min: 26, max: 35 },
  { label: "60 min", displayLabel: "60 Minutos", min: 36, max: Infinity },
] as const;
type DurSlot = (typeof DURATION_SLOTS)[number]["label"];
const DUR_PILL_W = Math.round((width - GRID_PAD * 2 - 6 * 4) / 4.3);
const VIDEO_HERO_W = Math.round((width - GRID_PAD * 2 - 56) * 1.0);

type Inicio2GestureIntent = "horizontal" | "vertical" | null;

const INICIO2_GESTURE_MIN_DISTANCE = 12;
const INICIO2_VERTICAL_DOWN_RATIO = 1.65;
const INICIO2_HORIZONTAL_COMPONENT_RATIO = 0.55;

/**
 * Resolve the hero's intent before either the carousel or the parent
 * ScrollView commits to the gesture. A downward drag must be noticeably more
 * vertical than horizontal to keep the pull-to-zoom interaction; a diagonal
 * with a meaningful horizontal component belongs to the carousel.
 */
function getInicio2GestureIntent(dx: number, dy: number): Inicio2GestureIntent {
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);

  if (Math.hypot(absDx, absDy) < INICIO2_GESTURE_MIN_DISTANCE) {
    return null;
  }

  const isClearlyDownward = dy > 0 && absDy > absDx * INICIO2_VERTICAL_DOWN_RATIO;
  if (isClearlyDownward) return "vertical";

  if (absDx >= absDy * INICIO2_HORIZONTAL_COMPONENT_RATIO) {
    return "horizontal";
  }

  // Let the ScrollView handle a clearly vertical upward drag as well as
  // small movements that have not established an axis yet.
  return null;
}

/** Convierte un color hex + alpha a rgba() para usar como fondo tintado. */
function hexTint(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return `rgba(74,12,12,0.08)`;
  return `rgba(${r},${g},${b},${alpha})`;
}

const ND = Platform.OS !== "web";

function BlinkingCursor({ color }: { color: string }) {
  const opacity = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0, duration: 480, useNativeDriver: ND }),
        Animated.timing(opacity, { toValue: 1, duration: 480, useNativeDriver: ND }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);
  return (
    <Animated.Text style={{ opacity, color, fontSize: 17, lineHeight: 24, fontWeight: "300" }}>
      |
    </Animated.Text>
  );
}


function NavTabChip({ sel, label, icon, iconSel, onPress }: { sel: boolean; label: string; icon?: number; iconSel?: number; onPress: () => void }) {
  const selOpacity = useRef(new Animated.Value(sel ? 1 : 0)).current;
  const { activeSceneId: chipSceneId } = useSceneTheme();
  const colors = useColors();
  useEffect(() => {
    Animated.timing(selOpacity, { toValue: sel ? 1 : 0, duration: 180, useNativeDriver: true }).start();
  }, [sel]);

  if (icon) {
    const chipBg = chipSceneId === "indigo" ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.07)";
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.headerTabIconChip, { opacity: pressed ? 0.7 : 1 }]}
      >
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: chipBg, borderRadius: 999, borderWidth: chipSceneId === "indigo" ? 0 : 2, borderColor: "rgba(255,255,255,0.1)" }]} />
        <View style={styles.headerTabIconImg}>
          <Image source={icon} style={[styles.headerTabIconImg, { position: "absolute" }]} resizeMode="contain" />
          {iconSel && (
            <Animated.Image
              source={iconSel}
              style={[styles.headerTabIconImg, { position: "absolute", opacity: selOpacity }]}
              resizeMode="contain"
            />
          )}
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.headerTabChip, !sel && styles.headerTabChipUnsel, { opacity: pressed ? 0.7 : 1 }]}
    >
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: selOpacity }]}>
        <LinearGradient
          colors={[colors.primary, colors.primary]}
          start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      <Text style={[styles.headerTabText, sel && styles.headerTabTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

const Inicio2AnimatedCircle = RAnimated.createAnimatedComponent(SvgCircle);

function Inicio2HeroControl({
  active,
  progress,
  onPress,
  accessibilityState,
  accessibilityLabel,
  testID,
}: {
  active: boolean;
  progress: SharedValue<number>;
  onPress: () => void;
  accessibilityState: { selected: boolean };
  accessibilityLabel: string;
  testID: string;
}) {
  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset:
      INICIO2_CONTROL_CIRCUMFERENCE * (1 - progress.value),
  }));

  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      style={styles.inicio2HeroControl}
      accessibilityRole="tab"
      accessibilityState={accessibilityState}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
    >
      {active ? (
        <>
          <Svg
            width={INICIO2_CONTROL_SIZE}
            height={INICIO2_CONTROL_SIZE}
            viewBox={`0 0 ${INICIO2_CONTROL_SIZE} ${INICIO2_CONTROL_SIZE}`}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          >
            <SvgCircle
              cx={INICIO2_CONTROL_SIZE / 2}
              cy={INICIO2_CONTROL_SIZE / 2}
              r={INICIO2_CONTROL_RADIUS}
              fill="#F9F9F9"
              fillOpacity={0.95}
              stroke="rgba(255,255,255,0.42)"
              strokeWidth={INICIO2_CONTROL_STROKE_WIDTH}
            />
            <Inicio2AnimatedCircle
              cx={INICIO2_CONTROL_SIZE / 2}
              cy={INICIO2_CONTROL_SIZE / 2}
              r={INICIO2_CONTROL_RADIUS}
              fill="none"
              stroke={INICIO2_PROGRESS_COLOR}
              strokeWidth={INICIO2_CONTROL_STROKE_WIDTH}
              strokeDasharray={`${INICIO2_CONTROL_CIRCUMFERENCE} ${INICIO2_CONTROL_CIRCUMFERENCE}`}
              strokeDashoffset={INICIO2_CONTROL_CIRCUMFERENCE}
              strokeLinecap="round"
              rotation={-90}
              origin={`${INICIO2_CONTROL_SIZE / 2}, ${INICIO2_CONTROL_SIZE / 2}`}
              animatedProps={animatedProps}
            />
          </Svg>
        </>
      ) : (
        <View style={styles.inicio2HeroControlDot} />
      )}
    </Pressable>
  );
}

// ── Fila de tabs animada (fade + desplazamiento, como en Biblioteca) ─────────
const NAV_CHIP_ANIM_DURATION = 600;
const NAV_CLOSE_SLOT = 38; // ancho de la X (30) + gap (8)

function AnimatedNavTabRow({
  tabs,
  activeTab,
  onSelect,
  onClear,
}: {
  tabs: { id: string; label: string; icon?: number; iconSel?: number }[];
  activeTab: string | null;
  onSelect: (id: string) => void;
  onClear: () => void;
}) {
  const progress = useRef(new Animated.Value(activeTab && activeTab !== TODOS_TAB_ID ? 1 : 0)).current;
  const offsetsRef = useRef<Record<string, number>>({});
  const scrollXRef = useRef(0);
  const [displayTab, setDisplayTab] = useState<string | null>(activeTab);
  const [colorTab, setColorTab] = useState<string | null>(activeTab);
  const [targetTranslate, setTargetTranslate] = useState(0);

  const filtered = displayTab !== null && displayTab !== TODOS_TAB_ID;

  const animate = (toValue: number, onDone?: () => void) => {
    Animated.timing(progress, {
      toValue,
      duration: NAV_CHIP_ANIM_DURATION,
      easing: RNEasing.inOut(RNEasing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) onDone?.();
    });
  };

  const handleSelect = (id: string) => {
    if (id === TODOS_TAB_ID) {
      setColorTab(TODOS_TAB_ID);
      setDisplayTab(TODOS_TAB_ID);
      animate(0);
      requestAnimationFrame(() => onSelect(TODOS_TAB_ID));
      return;
    }
    const off = offsetsRef.current[id] ?? 0;
    const visualLeft = off - scrollXRef.current;
    setTargetTranslate(NAV_CLOSE_SLOT - visualLeft);
    setDisplayTab(id);
    setColorTab(id);
    // Fuerza una transición 0→1 completa incluso si ya había un tab
    // seleccionado (progress ya estaba en 1): sin esto, saltar directo de
    // un tab a otro no mostraba animación.
    progress.setValue(0);
    animate(1);
    // onSelect dispara el filtrado de todo el feed (trabajo pesado en el
    // padre). Se difiere un frame para que la animación arranque primero;
    // si no, el re-render pesado del mismo tick "traga" los primeros
    // frames y el chip parece saltar sin animar.
    requestAnimationFrame(() => onSelect(id));
  };

  const handleClear = () => {
    setColorTab(TODOS_TAB_ID);
    animate(0, () => setDisplayTab(TODOS_TAB_ID));
    requestAnimationFrame(() => onClear());
  };

  useEffect(() => () => progress.stopAnimation(), [progress]);

  return (
    <View style={styles.navAnimWrap}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        scrollEnabled={!filtered}
        scrollEventThrottle={16}
        onScroll={(e) => {
          scrollXRef.current = e.nativeEvent.contentOffset.x;
        }}
        style={styles.headerTabs}
        contentContainerStyle={styles.headerTabsContent}
      >
        {tabs.map((t) => {
          return (
            <View
              key={t.id}
              onLayout={(e) => {
                offsetsRef.current[t.id] = e.nativeEvent.layout.x;
              }}
            >
              <NavTabChip
                sel={colorTab === t.id}
                label={t.label}
                icon={t.icon}
                iconSel={t.iconSel}
                onPress={() => {
                  if (displayTab === t.id) {
                    if (t.id !== TODOS_TAB_ID) handleClear();
                    return;
                  }
                  handleSelect(t.id);
                }}
              />
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

function Inicio2HeroSlider({
  topInset,
  focused,
  scrollY,
  currentStreak,
  giftScale,
  onOpenDrawer,
  onOpenProfile,
  onHorizontalGestureActiveChange,
}: {
  topInset: number;
  focused: boolean;
  scrollY: Animated.Value;
  currentStreak: number;
  giftScale: Animated.Value;
  onOpenDrawer: () => void;
  onOpenProfile: () => void;
  onHorizontalGestureActiveChange: (active: boolean) => void;
}) {
  const { user: clerkUser } = useUser();
  const { username, photoUri } = useUserProfile();
  const [activeIndex, setActiveIndex] = useState(0);
  const activeIndexRef = useRef(0);
  const desiredIndexRef = useRef(0);
  const pendingIndexRef = useRef<number | null>(null);
  const focusedRef = useRef(focused);
  const loadedSlidesRef = useRef(INICIO2_SLIDES.map(() => false));
  const [slideTransition, setSlideTransition] = useState<{
    from: number;
    to: number;
  } | null>(null);
  const slidePositions = useRef(
    INICIO2_SLIDES.map((_, index) => new Animated.Value(index === 0 ? 0 : width)),
  ).current;
  const slideDrift = useRef(new Animated.Value(0)).current;
  const slideProgress = useSharedValue(0);
  const horizontalGestureActiveRef = useRef(false);

  const setHorizontalGestureActive = useCallback((active: boolean) => {
    if (horizontalGestureActiveRef.current === active) return;
    horizontalGestureActiveRef.current = active;
    onHorizontalGestureActiveChange(active);
  }, [onHorizontalGestureActiveChange]);

  const transitionToSlide = useCallback((nextIndex: number) => {
    if (!focusedRef.current) {
      pendingIndexRef.current = nextIndex;
      return;
    }

    if (nextIndex === activeIndexRef.current) {
      pendingIndexRef.current = null;
      desiredIndexRef.current = nextIndex;
      return;
    }

    pendingIndexRef.current = null;
    desiredIndexRef.current = nextIndex;
    const fromIndex = activeIndexRef.current;
    const forwardDistance =
      (nextIndex - fromIndex + INICIO2_SLIDES.length) % INICIO2_SLIDES.length;
    const direction: 1 | -1 =
      forwardDistance > 0 && forwardDistance <= INICIO2_SLIDES.length / 2 ? 1 : -1;
    activeIndexRef.current = nextIndex;
    slideDrift.stopAnimation();
    slideDrift.setValue(0);
    cancelAnimation(slideProgress);
    slideProgress.value = 0;
    slidePositions.forEach((position, index) => {
      position.stopAnimation();
      position.setValue(
        index === fromIndex ? 0 : index === nextIndex ? direction * width : width,
      );
    });
    setSlideTransition({ from: fromIndex, to: nextIndex });
    setActiveIndex(nextIndex);

    Animated.parallel([
      Animated.timing(slidePositions[fromIndex], {
        toValue: -direction * width,
        duration: 420,
        easing: RNEasing.out(RNEasing.cubic),
        useNativeDriver: ND,
      }),
      Animated.timing(slidePositions[nextIndex], {
        toValue: 0,
        duration: 420,
        easing: RNEasing.out(RNEasing.cubic),
        useNativeDriver: ND,
      }),
    ]).start(({ finished }) => {
      if (!finished) return;
      slidePositions.forEach((position, index) => {
        position.setValue(index === nextIndex ? 0 : width);
      });
      setSlideTransition(null);
    });
  }, [slideDrift, slidePositions]);

  const setSlide = useCallback((nextIndex: number) => {
    const normalized = (nextIndex + INICIO2_SLIDES.length) % INICIO2_SLIDES.length;
    desiredIndexRef.current = normalized;
    if (normalized === activeIndexRef.current) {
      pendingIndexRef.current = null;
      return;
    }

    if (!loadedSlidesRef.current[normalized] || !focusedRef.current) {
      pendingIndexRef.current = normalized;
      return;
    }

    transitionToSlide(normalized);
  }, [transitionToSlide]);

  const bounceAtEdge = useCallback((direction: 1 | -1) => {
    const activePosition = slidePositions[activeIndexRef.current];
    activePosition.stopAnimation();
    Animated.sequence([
      Animated.timing(activePosition, {
        toValue: direction * 34,
        duration: 130,
        easing: RNEasing.out(RNEasing.cubic),
        useNativeDriver: ND,
      }),
      Animated.spring(activePosition, {
        toValue: 0,
        friction: 7,
        tension: 120,
        useNativeDriver: ND,
      }),
    ]).start();
  }, [slidePositions]);

  const setSlideFromSwipe = useCallback((direction: 1 | -1) => {
    const baseIndex = pendingIndexRef.current ?? desiredIndexRef.current;
    const nextIndex = baseIndex + direction;
    if (nextIndex < 0 || nextIndex >= INICIO2_SLIDES.length) {
      pendingIndexRef.current = null;
      desiredIndexRef.current = activeIndexRef.current;
      bounceAtEdge(direction);
      return;
    }
    setSlide(nextIndex);
  }, [bounceAtEdge, setSlide]);

  const handleSlideLoad = useCallback((index: number) => {
    loadedSlidesRef.current[index] = true;
    if (pendingIndexRef.current === index && focusedRef.current) {
      transitionToSlide(index);
    }
  }, [transitionToSlide]);

  const handleSlideError = useCallback((index: number, error: unknown) => {
    console.warn(`[Inicio2HeroSlider] No se pudo cargar el slide ${index + 1}:`, error);
    if (pendingIndexRef.current === index) {
      pendingIndexRef.current = null;
      desiredIndexRef.current = activeIndexRef.current;
    }
  }, []);

  // El ciclo comienza de nuevo tanto al enfocar el hero como al cambiar de
  // diapositiva. Reanimated mantiene el anillo en el UI thread y la misma
  // duración se usa para el temporizador de autoplay.
  useEffect(() => {
    cancelAnimation(slideProgress);
    slideProgress.value = 0;

    if (focused) {
      slideProgress.value = withTiming(1, {
        duration: INICIO2_AUTOPLAY_DURATION,
        easing: Easing.linear,
      });
    }

    return () => {
      cancelAnimation(slideProgress);
    };
  }, [activeIndex, focused, slideProgress]);

  useEffect(() => {
    if (!focused) return;

    const autoplayTimer = setTimeout(() => {
      if (focusedRef.current) {
        setSlide(activeIndexRef.current + 1);
      }
    }, INICIO2_AUTOPLAY_DURATION);

    return () => clearTimeout(autoplayTimer);
  }, [activeIndex, focused, setSlide]);

  useEffect(() => () => {
    slidePositions.forEach((position) => position.stopAnimation());
    cancelAnimation(slideProgress);
  }, [slidePositions]);

  useEffect(() => {
    focusedRef.current = focused;

    if (!focused) {
      setHorizontalGestureActive(false);
      slidePositions.forEach((position, index) => {
        position.stopAnimation();
        position.setValue(index === activeIndexRef.current ? 0 : width);
      });
      setSlideTransition(null);
      return;
    }

    const pendingIndex = pendingIndexRef.current;
    if (
      pendingIndex !== null
      && pendingIndex !== activeIndexRef.current
      && loadedSlidesRef.current[pendingIndex]
    ) {
      transitionToSlide(pendingIndex);
    }
  }, [focused, setHorizontalGestureActive, slidePositions, transitionToSlide]);

  useEffect(() => {
    if (!focused) {
      slideDrift.stopAnimation();
      slideDrift.setValue(0);
      return;
    }

    slideDrift.setValue(0);
    const breath = Animated.loop(
      Animated.sequence([
        Animated.timing(slideDrift, { toValue: 1, duration: 11_000, easing: RNEasing.inOut(RNEasing.sin), useNativeDriver: ND }),
        Animated.timing(slideDrift, { toValue: 0, duration: 11_000, easing: RNEasing.inOut(RNEasing.sin), useNativeDriver: ND }),
      ]),
    );
    breath.start();

    return () => {
      breath.stop();
      slideDrift.stopAnimation();
      slideDrift.setValue(0);
    };
  }, [activeIndex, focused, slideDrift]);

  const isHorizontalSwipeIntent = useCallback((dx: number, dy: number) => {
    const intent = getInicio2GestureIntent(dx, dy);
    if (intent === "horizontal") {
      // Prevent the parent ScrollView from taking over once a diagonal has
      // enough horizontal travel to be a slide gesture.
      setHorizontalGestureActive(true);
      return true;
    }
    return false;
  }, [setHorizontalGestureActive]);

  const finishHorizontalGesture = useCallback(() => {
    setHorizontalGestureActive(false);
  }, [setHorizontalGestureActive]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponderCapture: (_event, gesture) =>
          isHorizontalSwipeIntent(gesture.dx, gesture.dy),
        onMoveShouldSetPanResponder: (_event, gesture) =>
          isHorizontalSwipeIntent(gesture.dx, gesture.dy),
        onPanResponderTerminationRequest: () => false,
        onPanResponderRelease: (_event, gesture) => {
          if (horizontalGestureActiveRef.current && Math.abs(gesture.dx) >= 36) {
            setSlideFromSwipe(gesture.dx < 0 ? 1 : -1);
          }
          finishHorizontalGesture();
        },
        onPanResponderTerminate: finishHorizontalGesture,
      }),
    [finishHorizontalGesture, isHorizontalSwipeIntent, setSlideFromSwipe],
  );

  const zoom = slideDrift.interpolate({ inputRange: [0, 1], outputRange: [1, 1.035] });
  const driftX = slideDrift.interpolate({ inputRange: [0, 1], outputRange: [0, -6] });
  // El hero se mueve con el scroll normal, pero a menor velocidad. En
  // overscroll el desplazamiento compensa el movimiento del ScrollView para
  // que la imagen siga anclada al borde superior mientras se estira.
  const parallaxY = scrollY.interpolate({
    inputRange: [-INICIO2_HERO_HEIGHT, 0, INICIO2_SCROLL_START_THRESHOLD, INICIO2_HERO_HEIGHT],
    outputRange: [-INICIO2_HERO_HEIGHT, 0, 0, INICIO2_HERO_HEIGHT * 0.38],
    extrapolate: "clamp",
  });
  const heroCopyY = Animated.add(parallaxY, 15);
  const pullScale = scrollY.interpolate({
    inputRange: [-INICIO2_HERO_HEIGHT, 0],
    outputRange: [1.35, 1],
    extrapolate: "clamp",
  });
  const imageScale = Animated.multiply(zoom, pullScale);
  const displayName =
    username ||
    clerkUser?.firstName ||
    clerkUser?.fullName ||
    clerkUser?.username ||
    "Explorador";
  const displayPhoto = photoUri || clerkUser?.imageUrl || null;
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <View
      {...panResponder.panHandlers}
      style={styles.inicio2Hero}
      testID="inicio2-hero-slider"
      accessibilityLabel={`Diapositiva ${activeIndex + 1} de ${INICIO2_SLIDES.length}`}
    >
      {INICIO2_SLIDES.map((slide, index) => (
        <Animated.View
          key={slide.id}
          pointerEvents="none"
          style={[
            styles.inicio2HeroImageLayer,
            {
              opacity: slideTransition
                ? index === slideTransition.from || index === slideTransition.to ? 1 : 0
                : index === activeIndex ? 1 : 0,
              zIndex: slideTransition
                ? index === slideTransition.to ? 2 : 1
                : index === activeIndex ? 1 : 0,
              transform: [
                { translateX: slidePositions[index] },
                { translateY: parallaxY },
              ],
            },
          ]}
        >
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              { transform: [{ scale: imageScale }, { translateX: driftX }] },
            ]}
          >
            <Image
              source={slide.image}
              resizeMode="cover"
              onLoad={() => handleSlideLoad(index)}
              onError={(error) => handleSlideError(index, error)}
              style={styles.inicio2HeroImage}
            />
            {/* El overlay pertenece a cada slide para que el desplazamiento,
                parallax y estiramiento no puedan separarlo de la imagen. */}
            <LinearGradient
              colors={["rgba(2,5,12,0.42)", "rgba(2,5,12,0.02)", "rgba(2,5,12,0)"]}
              locations={[0, 0.48, 1]}
              style={styles.inicio2HeroImage}
              pointerEvents="none"
            />
          </Animated.View>
        </Animated.View>
      ))}

      <Animated.View
        pointerEvents="box-none"
        style={[
          styles.inicio2HeroActions,
          { paddingTop: topInset + 8, transform: [{ translateY: parallaxY }] },
        ]}
      >
        <View style={styles.inicio2HeroProfileButton}>
          <Pressable
            onPress={() => router.push("/(tabs)/profile" as never)}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Abrir mi perfil"
            testID="inicio2-open-profile"
          >
            {displayPhoto ? (
              <ExpoImage
                source={{ uri: displayPhoto }}
                style={styles.inicio2HeroAvatar}
                contentFit="cover"
              />
            ) : (
              <View style={styles.inicio2HeroAvatarFallback}>
                <Text style={styles.inicio2HeroAvatarInitial}>{initial}</Text>
              </View>
            )}
          </Pressable>
          <Pressable
            onPress={onOpenDrawer}
            hitSlop={8}
            style={styles.inicio2HeroGreeting}
            accessibilityRole="button"
            accessibilityLabel="Abrir menú de perfil"
            testID="inicio2-open-drawer"
          >
            <Text style={styles.inicio2HeroGreetingLabel}>
              Buenas tardes
            </Text>
            <Text style={styles.inicio2HeroGreetingName}>
              {displayName}
            </Text>
          </Pressable>
        </View>

        <Pressable
          onPress={onOpenProfile}
          onPressIn={() => Animated.spring(giftScale, { toValue: 0.84, speed: 30, bounciness: 0, useNativeDriver: ND }).start()}
          onPressOut={() => Animated.spring(giftScale, { toValue: 1, speed: 8, bounciness: 16, useNativeDriver: ND }).start()}
          hitSlop={12}
          style={styles.inicio2HeroLotusButton}
          accessibilityRole="button"
          accessibilityLabel="Abrir mi perfil"
          testID="inicio2-open-profile"
        >
          <Animated.View style={{ transform: [{ scale: giftScale }] }}>
            <View style={styles.inicio2HeroLotusContent}>
              <Text style={styles.inicio2HeroStreak}>{currentStreak}</Text>
              <MaterialCommunityIcons name="spa" size={20} color="#FFFFFF" />
            </View>
          </Animated.View>
        </Pressable>
      </Animated.View>

      <Animated.View
        pointerEvents="box-none"
        style={[styles.inicio2HeroCopy, { transform: [{ translateY: heroCopyY }] }]}
      >
        {INICIO2_SLIDES[activeIndex].categoryId ? (
          <View style={styles.inicio2HeroCategory}>
            <SessionCategoryPill
              categoryId={INICIO2_SLIDES[activeIndex].categoryId}
              inline
            />
          </View>
        ) : null}
        <Text style={styles.inicio2HeroTitle}>{INICIO2_SLIDES[activeIndex].title}</Text>
        <Pressable
          onPress={() => {}}
          style={({ pressed }) => [
            styles.inicio2HeroActionButton,
            { opacity: pressed ? 0.82 : 1 },
          ]}
          accessibilityRole="button"
          accessibilityLabel={INICIO2_SLIDES[activeIndex].actionLabel}
          testID={`inicio2-slide-action-${activeIndex + 1}`}
        >
          <Text style={styles.inicio2HeroActionButtonText}>
            {INICIO2_SLIDES[activeIndex].actionLabel}
          </Text>
        </Pressable>
      </Animated.View>

      <Animated.View
        style={[styles.inicio2HeroControls, { transform: [{ translateY: parallaxY }] }]}
        accessibilityRole="tablist"
      >
        {INICIO2_SLIDES.map((slide, index) => {
          const active = index === activeIndex;
          return (
            <Inicio2HeroControl
              key={slide.id}
              active={active}
              progress={slideProgress}
              onPress={() => setSlide(index)}
              accessibilityState={{ selected: active }}
              accessibilityLabel={`Ver diapositiva ${index + 1}`}
              testID={`inicio2-slide-control-${index + 1}`}
            />
          );
        })}
      </Animated.View>
    </View>
  );
}

function InicioEmotionWidget({
  bottom,
  backgroundColor,
  onOpenMoodPicker,
}: {
  bottom: number;
  backgroundColor: string;
  onOpenMoodPicker: () => void;
}) {
  return (
    <Pressable
      onPress={onOpenMoodPicker}
      accessibilityRole="button"
      accessibilityLabel="Agregar emoción"
      testID="inicio-add-emotion"
      style={({ pressed }) => [
        styles.inicio2HeroEmotionWidget,
        { right: 18, bottom, backgroundColor, opacity: pressed ? 0.82 : 1 },
      ]}
    >
      <Text style={styles.inicio2HeroEmotionEmoji}>😌</Text>
      <View style={styles.inicio2HeroEmotionAdd}>
        <Text style={styles.inicio2HeroEmotionAddText}>+</Text>
      </View>
    </Pressable>
  );
}

type InicioMoodRecommendationsProps = {
  selectedMoods: Mood[];
  moodRecommended: Session[];
  isPremium: boolean;
  cardBg: string;
  titleSize?: number;
  titleSpacing?: number;
  maxItems?: number;
  showTitle?: boolean;
  showDivider?: boolean;
  moodTopOffset?: number;
  onOpenMoodPicker: () => void;
  onClearMood: () => void;
  onRefreshRecommendations: () => void;
  onPlaySession: (session: Session) => void;
  openCategory: (route: string) => void;
};
export type InicioVariant = "original" | "copy";

export default function HomeScreen2({
  variant = "original",
}: {
  variant?: InicioVariant;
} = {}) {
  const isInicio2 = variant === "copy";
  const colors = useColors();
  const { savedEntries: intencionSaved, favorites: intencionFavs } = useIntencion();
  const currentIntencion = intencionSaved[0]?.text ?? intencionFavs[0] ?? null;
  const insets = useSafeAreaInsets();
  const {
    playSession,
    currentSession,
    isPlaying,
    pauseResume,
    history,
    favorites,
    statEvents,
    sessionProgress,
    getSessionProgress,
  } = usePlayer();
  const { previewFlow: previewStreakFlow } = useStreakCelebration();

  const todayKey = useDayRollover();
  const { currentStreak: currentStreakDisplay } = useStreak();

  const { isPremium } = usePremium();
  const { upcoming: upcomingLiveSessions } = useLiveSessions();
  const nextLiveSession = upcomingLiveSessions[0] ?? null;
  const { videos } = useVideos();
  const { playlists } = useFoldersPlaylists();
  const { presets, loadPreset, openSheet } = useMixer();
  const { openMixer } = useMixerPanel();
  const { openGeometrix } = useGeometrixPanel();
  const { openCategory } = useCategoryOverlay();
  const { openSheet: openEscenasSheet } = useAmbientPlayer();
  const { open: openDrawer } = useDrawer();
  const { theme: activeTheme, activeSceneId } = useSceneTheme();
  // La tab bar flotante usa la misma separación inferior que su propio layout.
  // El widget queda 25 px por encima de la parte superior de esa barra.
  const tabBarBottomOffset =
    Platform.OS === "web" ? 2 : Math.max(3, insets.bottom - 15) - 1;
  const emotionWidgetBottom = tabBarBottomOffset + 68 + 25;
  const emotionWidgetBackground =
    activeSceneId === "tibet"
      ? "#1A2453"
      : activeSceneId === "indigo"
        ? "#212033"
        : "#3B2A47";
  const cardBg = activeSceneId === "tibet"
    ? "rgba(0,0,0,0.15)"
    : "rgba(255,255,255,0.05)";
  const durationPillBg = activeSceneId === "indigo"
    ? "rgba(42,40,64,0.65)"
    : cardBg;
  const recommendationSurfaceBg = activeSceneId === "indigo"
    ? "rgba(42,40,64,0.65)"
    : cardBg;
  // Solo tema Índigo: fondo blanco translúcido para los 6 bloques de categoría
  // Fade de 300ms entre degradados de fondo al cambiar de Escena (loto en Inicio):
  // se mantiene el degradado anterior debajo y el nuevo se desvanece encima, en vez
  // de saltar de golpe de un color a otro.
  const [prevGradient, setPrevGradient] = useState(activeTheme.gradient);
  const gradientFade = useRef(new Animated.Value(1)).current;
  const isFirstSceneRender = useRef(true);
  // Cross-fade imagen backdrop (mismo timing que gradiente)
  const currentSceneImage = AMBIENT_SCENES.find((s) => s.id === activeSceneId)?.image;
  const [prevSceneImage, setPrevSceneImage] = useState(currentSceneImage);
  const imageFade = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (isFirstSceneRender.current) {
      isFirstSceneRender.current = false;
      return;
    }
    gradientFade.setValue(0);
    imageFade.setValue(0);
    Animated.parallel([
      Animated.timing(gradientFade, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(imageFade, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setPrevGradient(activeTheme.gradient);
      setPrevSceneImage(currentSceneImage);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSceneId]);

  const [moodSheetVisible, setMoodSheetVisible] = useState(false);
  const [selectedMoods, setSelectedMoods] = useState<Mood[]>([]);
  const [moodRecommendationGeneration, setMoodRecommendationGeneration] = useState(0);
  const [immersive, setImmersive] = useState(false);
  const [immersiveRendered, setImmersiveRendered] = useState(false);
  const { requestHide, showMenu } = useTabBarVisibility();
  const immersiveRef = useRef(false);
  const immersiveAnim = useRef(new Animated.Value(0)).current;
  const contentOpacity = immersiveAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });
  const toggleImmersive = useCallback(() => {
    const next = !immersiveRef.current;
    immersiveRef.current = next;
    immersiveAnim.stopAnimation();
    if (next) setImmersiveRendered(true);
    setImmersive(next);
    if (next) { requestHide(); } else { showMenu(); }
    Animated.timing(immersiveAnim, {
      toValue: next ? 1 : 0,
      duration: 700,
      easing: RNEasing.out(RNEasing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished && !next) setImmersiveRendered(false);
    });
  }, [immersiveAnim, requestHide, showMenu]);

  // ── Zoom del modo inmersivo (pinch) ───────────────────────────────────────
  const pinchScale = useSharedValue(1);
  const lastScale  = useSharedValue(1);

  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      pinchScale.value = Math.max(0.4, Math.min(3.5, lastScale.value * e.scale));
    })
    .onEnd(() => {
      const clamped = Math.max(0.5, Math.min(3, pinchScale.value));
      pinchScale.value = withSpring(clamped, { damping: 18, stiffness: 220 });
      lastScale.value = clamped;
    });

  // Doble-tap: resetear zoom a 1×
  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      pinchScale.value = withSpring(1, { damping: 18, stiffness: 220 });
      lastScale.value = 1;
    });

  const immersiveGesture = Gesture.Simultaneous(pinchGesture, doubleTap);

  function handleMoodSelect(moodIds: MoodId[]) {
    const nextMoods = moodIds
      .map((moodId) => getMoodById(moodId))
      .filter((mood): mood is Mood => Boolean(mood));
    setSelectedMoods(nextMoods);
    setMoodRecommendationGeneration((generation) => generation + 1);
  }

  const handleRecommendedSessionPress = useCallback(
    (session: Session) => {
      if (session.skipMiniPlayer) {
        playSession(session);
        return;
      }
      if (session.skipDetail) {
        playSession(session);
        router.push("/player" as never);
        return;
      }
      openCategory(`/session/${session.id}`);
    },
    [openCategory, playSession],
  );

  function handleIntentionPress() {
    router.push("/intencion-onboarding" as never);
  }

  const cursorOpacity = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const blink = Animated.loop(
      Animated.sequence([
        Animated.timing(cursorOpacity, { toValue: 0, duration: 500, useNativeDriver: true }),
        Animated.timing(cursorOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      ])
    );
    blink.start();
    return () => blink.stop();
  }, [cursorOpacity]);

  const { data: sceneAnimationsData } = useGetSceneAnimations();
  const activeScenes = sceneAnimationsData?.scenes ?? [];
  const { setSelectedScene, bgScene, setBgScene } = useSelectedScene();
  // Escena activa en el header (persistida entre sesiones)
  const HEADER_SCENE_KEY = "@resonancia_header_scene_id";
  const [headerSceneId, setHeaderSceneId] = useState<number | null>(null);

  // ── Estado de la animación inline ────────────────────────────────────────
  // animRevealed: true = escena guardada o usuario presionó "Pulsación"
  const [animRevealed, setAnimRevealed] = useState(false);
  const animRevealFade = useRef(new Animated.Value(0)).current;
  const [phraseVisible, setPhraseVisible] = useState(false);
  const [shuffleBgColor, setShuffleBgColor] = useState<string | null>(null);
  const [animSheetOpen, setAnimSheetOpen] = useState(false);
  // Evita que el efecto de bgScene se dispare después de selecciones locales
  // (esas ya gestionan animRevealFade ellas mismas con la duración correcta).
  const bgSceneHydratedRef = useRef(false);

  useEffect(() => {
    AsyncStorage.getItem(HEADER_SCENE_KEY).then((raw) => {
      if (raw) {
        setHeaderSceneId(parseInt(raw, 10));
        // Había selección guardada → mostrar animación de inmediato
        bgSceneHydratedRef.current = true; // marca también hidratación de ID
        setAnimRevealed(true);
        animRevealFade.setValue(1);
      }
    });
  }, [animRevealFade]);

  // Si bgScene (cache full offline-first) llega antes que el ID → revelar sin Pulsación.
  // Solo durante la hidratación inicial; las selecciones locales NO deben
  // pasar por aquí o cancelarían el fade en curso.
  useEffect(() => {
    if (bgScene && !bgSceneHydratedRef.current) {
      bgSceneHydratedRef.current = true;
      setAnimRevealed(true);
      animRevealFade.setValue(1);
    }
  }, [bgScene, animRevealFade]);

  // Solo la escena elegida explícitamente; sin fallback a la primera de la lista.
  const headerScene =
    bgScene ??
    (headerSceneId != null ? activeScenes.find((s) => s.id === headerSceneId) ?? null : null);

  function selectHeaderScene(scene: SceneAnimation) {
    setHeaderSceneId(scene.id);
    setBgScene(scene);
    AsyncStorage.setItem(HEADER_SCENE_KEY, String(scene.id));
  }

  /** Primera activación: revela la primera escena disponible con fade de 2 400 ms. */
  const handlePulsacion = useCallback(() => {
    const first = activeScenes[0] ?? null;
    if (!first) return;
    // Marcar hidratación ANTES de setBgScene para que el efecto de bgScene
    // no cancele el fade que empezamos aquí.
    bgSceneHydratedRef.current = true;
    selectHeaderScene(first);
    setSelectedScene(first);
    animRevealFade.setValue(0);
    setAnimRevealed(true);
    Animated.timing(animRevealFade, {
      toValue: 1,
      duration: 2400,
      easing: RNEasing.out(RNEasing.cubic),
      useNativeDriver: true,
    }).start();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeScenes, animRevealFade]);

  /** Selección desde el sheet: cambia escena con fade de 400 ms. */
  const handleAnimSceneSelect = useCallback((scene: SceneAnimation) => {
    // Marcar hidratación ANTES de setBgScene para que el efecto de bgScene
    // no cancele el fade de 400 ms que empezamos aquí.
    bgSceneHydratedRef.current = true;
    selectHeaderScene(scene);
    setSelectedScene(scene);
    setShuffleBgColor(null); // resetear color shuffle al cambiar de escena
    animRevealFade.setValue(0);
    Animated.timing(animRevealFade, {
      toValue: 1,
      duration: 400,
      easing: RNEasing.out(RNEasing.cubic),
      useNativeDriver: true,
    }).start();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animRevealFade]);

  /** Shuffle: genera un fondo aleatorio en el mismo tono que el tema activo. */
  const handleShuffle = useCallback(() => {
    const base = (activeTheme.gradient[0] as string) || "#060A0F";
    const h = base.replace("#", "");
    const r0 = parseInt(h.slice(0, 2), 16) || 6;
    const g0 = parseInt(h.slice(2, 4), 16) || 10;
    const b0 = parseInt(h.slice(4, 6), 16) || 15;
    const vary = (v: number) => Math.max(0, Math.min(200, Math.floor(v + (Math.random() - 0.5) * 70)));
    setShuffleBgColor(`rgba(${vary(r0)},${vary(g0)},${vary(b0)},0.92)`);
  }, [activeTheme]);

  const { version: catalogVersion, status: catalogStatus } = useCatalog();

  const [actionsSession, setActionsSession] = useState<Session | null>(null);
  const [activeFilter, setActiveFilter] = useState<string[] | null>(null);
  const [recoOffset, setRecoOffset] = useState(0);

  // Sub-filtros de Sesiones
  const [sesionesOpen,    setSesionesOpen]    = useState(false);
  const [sesionesVisible, setSesionesVisible] = useState(false);
  const [sesAncestral,    setSesAncestral]    = useState(false);
  const [sesMeditacion,   setSesMeditacion]   = useState(false);
  const [progresoVisible, setProgresoVisible] = useState(false);
  const { rachaEnabled } = useRacha();
  const { intencionDiariaEnabled, escenasAnimadasEnabled } = useIntencionDiaria();
  const showAnimatedScene = !intencionDiariaEnabled && escenasAnimadasEnabled;
  const spacerWidthSV  = useSharedValue(0);
  const pillOpacitySV  = useSharedValue(0);
  const pillTranslateSV = useSharedValue(20);
  const spacerAnimStyle = useAnimatedStyle(() => ({ width: spacerWidthSV.value }));
  const pillAnimStyle   = useAnimatedStyle(() => ({
    opacity:   pillOpacitySV.value,
    transform: [{ translateX: pillTranslateSV.value }],
  }));

  useEffect(() => {
    const easeOut = { duration: 200, easing: Easing.out(Easing.quad) };
    if (sesionesOpen) {
      spacerWidthSV.value   = 0;
      pillOpacitySV.value   = 0;
      pillTranslateSV.value = 20;
      setSesionesVisible(true);
      spacerWidthSV.value   = withTiming(188, easeOut);
      pillOpacitySV.value   = withDelay(80, withTiming(1, { duration: 160 }));
      pillTranslateSV.value = withDelay(80, withTiming(0, { duration: 180, easing: Easing.out(Easing.quad) }));
    } else {
      pillOpacitySV.value   = withTiming(0, { duration: 110 });
      pillTranslateSV.value = withTiming(20, { duration: 130, easing: Easing.in(Easing.quad) });
      spacerWidthSV.value   = withDelay(80, withTiming(0, { duration: 160 }, (finished) => {
        if (finished) runOnJS(setSesionesVisible)(false);
      }));
    }
  }, [sesionesOpen]);

  const updateSesFilter = (anc: boolean, med: boolean) => {
    if (anc && !med)  setActiveFilter(["sonidos-ancestrales"]);
    else if (!anc && med) setActiveFilter(["meditaciones-guiadas"]);
    else              setActiveFilter(NAV_TABS[1].cats);
  };

  // Sesiones para "Recomendado para ti" / "Para tu estado de ánimo"
  const RECO_CATS = ["meditaciones-guiadas", "sonidos-ancestrales", "musica-sonidos"];
  const moodRecommended = React.useMemo<Session[]>(() => {
    if (selectedMoods.length) {
      const cats = new Set(selectedMoods.flatMap((mood) => mood.categoryIds));
      const themes = new Set<string>(selectedMoods.flatMap((mood) => mood.themeTags));
      const pool = SESSIONS.filter((s) => cats.has(s.categoryId));
      const boosted = pool.filter((s) => s.themeTag?.some((t) => themes.has(t)));
      const rest = pool.filter((s) => !s.themeTag?.some((t) => themes.has(t)));
      return [...boosted, ...rest].slice(0, 5);
    }
    const pool = SESSIONS.filter((s) => RECO_CATS.includes(s.categoryId));
    const seed = new Date().toDateString() + recoOffset;
    let hash = 0;
    for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) & 0x7fffffff;
    const shuffled = [...pool];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.abs(hash ^ (i * 2654435761)) % (i + 1);
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, 5);
  }, [selectedMoods, catalogVersion, recoOffset]);

  // Sesiones recomendadas — no escuchadas aún, barajadas con semilla diaria
  const recommendedSessions = React.useMemo<Session[]>(() => {
    const historyIds = new Set(history.map((h) => h.sessionId));
    const pool = SESSIONS.filter((s) => !historyIds.has(s.id));
    const seed = new Date().toDateString();
    let hash = 0;
    for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) & 0x7fffffff;
    const shuffled = [...pool];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.abs(hash ^ (i * 2654435761)) % (i + 1);
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, 10);
  }, [history, catalogVersion]);

  // Recomendaciones diarias — selección estable durante el día local.
  // No depende del historial: escuchar una sesión no cambia las otras
  // recomendaciones hasta que cambie la fecha.
  const dailyRecommendations = React.useMemo<Session[]>(() => {
    const pool = SESSIONS.filter((session) => !session.isPlaceholder);
    const seed = `${todayKey}:${pool.map((session) => session.id).join(",")}`;
    let hash = 2166136261;
    for (let i = 0; i < seed.length; i++) {
      hash ^= seed.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }

    let state = hash >>> 0;
    const shuffled = [...pool];
    const nextRandom = () => {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      return state / 0x100000000;
    };
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(nextRandom() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, 3);
  }, [todayKey, catalogVersion]);

  // Recientes — últimas sesiones incorporadas al catálogo, no confundir con
  // “Escuchadas recientemente”, que depende del historial personal.
  const recentSessions = React.useMemo<Session[]>(
    () =>
      [...SESSIONS]
        .sort((a, b) => Number.parseInt(b.id, 10) - Number.parseInt(a.id, 10))
        .slice(0, 7),
    [catalogVersion],
  );

  // Escuchadas recientemente — historial deduplicado, más recientes primero
  // (history ya viene ordenado con el más reciente al inicio, ver addToHistory)
  const listenedRecently = React.useMemo<Session[]>(() => {
    const seen = new Set<string>();
    const result: Session[] = [];
    for (let i = 0; i < history.length; i++) {
      const h = history[i];
      if (seen.has(h.sessionId)) continue;
      seen.add(h.sessionId);
      const s = getSessionById(h.sessionId);
      if (s) result.push(s);
      if (result.length === 10) break;
    }
    return result;
  }, [history]);

  // Seguir escuchando — una sola sesión retomable, no un carrusel.
  // Se prioriza la última sesión con progreso incompleto; si no existe,
  // se conserva la sesión más reciente del historial como fallback.
  const continueSession = React.useMemo<Session | null>(() => {
    const seen = new Set<string>();
    const ordered: Session[] = [];
    for (const entry of history) {
      if (seen.has(entry.sessionId)) continue;
      seen.add(entry.sessionId);
      const session = getSessionById(entry.sessionId);
      if (session) ordered.push(session);
    }

    const resumable = ordered.find((session) => {
      const saved = sessionProgress[session.id] ?? 0;
      return saved > 0 && saved < 0.97;
    });
    return resumable ?? ordered[0] ?? null;
  }, [history, sessionProgress, catalogVersion]);

  const continueProgress = continueSession ? getSessionProgress(continueSession.id) : 0;
  const continueAuthor = React.useMemo(() => {
    if (!continueSession) return "";
    const guideId = continueSession.guideIds?.[0] ?? continueSession.guideId;
    const guide = guideId ? getGuide(guideId) : undefined;
    const artist = continueSession.artistId ? getArtist(continueSession.artistId) : undefined;
    return guide?.name ?? artist?.name ?? "Casa del Cuenco";
  }, [continueSession]);

  const continueLocked = !!continueSession?.isPremium && !isPremium;
  const handleContinueListening = useCallback(() => {
    if (!continueSession) return;
    if (continueLocked) {
      router.push("/membresia" as never);
      return;
    }
    playSession(continueSession);
    if (!continueSession.skipMiniPlayer) {
      router.push("/player" as never);
    }
  }, [continueLocked, continueSession, playSession]);

  // Tus playlist — playlists del usuario, foto de la primera sesión
  const playlistItems = React.useMemo(() =>
    playlists.slice(0, 10).map((pl) => ({
      id: pl.id,
      title: pl.name,
      image: pl.sessionIds[0]
        ? (getSessionById(pl.sessionIds[0])?.image as number | undefined)
        : undefined,
    })),
    [playlists],
  );

  // Tus mezclas — presets guardados, foto del primer sonido
  const mezclaItems = React.useMemo(() =>
    presets.slice(0, 10).map((p) => ({
      id: p.id,
      title: p.name,
      image: p.sounds[0]
        ? (getSoundImage(p.sounds[0].id) as number | undefined)
        : undefined,
    })),
    [presets],
  );

  // ── Filtros por categoría ─────────────────────────────────────────────────
  const filteredRecommended = React.useMemo(() => {
    if (!activeFilter) return recommendedSessions;
    return recommendedSessions.filter((s) => activeFilter.includes(s.categoryId));
  }, [recommendedSessions, activeFilter]);

  const filteredListened = React.useMemo(() => {
    if (!activeFilter) return listenedRecently;
    return listenedRecently.filter((s) => activeFilter.includes(s.categoryId));
  }, [listenedRecently, activeFilter]);

  // Favoritos — sesiones marcadas como favoritas, en orden de guardado (más reciente primero)
  const favoriteSessions = React.useMemo<Session[]>(() => {
    return favorites
      .map((id) => getSessionById(id))
      .filter((s): s is Session => s !== undefined)
      .slice(0, 10);
  }, [favorites]);


  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, 40);
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  // ── La lupa solo aparece cuando el sticky header se "activa" (6% scroll) ──
  const STICKY_ACTIVE_THRESHOLD = 0.06;
  const [stickyActive, setStickyActive] = useState(false);
  const stickyActiveRef = useRef(false);
  const searchOpenRef = useRef(false);
  const scrollContentHeightRef = useRef(0);
  const scrollLayoutHeightRef = useRef(0);
  const scrollYRef = useRef(0);
  const inicio2ScrollY = useRef(new Animated.Value(0)).current;
  const [inicio2ScrollEnabled, setInicio2ScrollEnabled] = useState(true);
  const handleInicio2HorizontalGesture = useCallback((active: boolean) => {
    setInicio2ScrollEnabled(!active);
  }, []);

  const searchBtnAnim = useRef(new Animated.Value(0)).current;
  const giftScaleAnim = useRef(new Animated.Value(1)).current;


  // ── Loto + tabs: al activarse el sticky header, el loto se desvanece y
  //    los tabs se desplazan sutilmente hacia la izquierda hasta el margen ──
  const LOTUS_SHIFT_DISTANCE = 45 + 15; // ancho del universeBtn + gap del headerTopRow
  const lotusFadeAnim = useRef(new Animated.Value(1)).current;
  const tabsShiftAnim = useRef(new Animated.Value(0)).current;

  // ── Borde del sticky header: se activa recién a partir de 1% de scroll ──
  const HEADER_BORDER_THRESHOLD = 0.01;
  const headerBorderActiveRef = useRef(false);
  const headerBorderAnim = useRef(new Animated.Value(0)).current;

  const updateSearchBtnVisibility = useCallback(() => {
    const shouldShow = scrollYRef.current > 10 || searchOpenRef.current;
    Animated.timing(searchBtnAnim, {
      toValue: shouldShow ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [searchBtnAnim]);

  const updateStickyActive = useCallback(() => {
    const scrollable = scrollContentHeightRef.current - scrollLayoutHeightRef.current;
    const progress = scrollable > 0 ? scrollYRef.current / scrollable : 0;
    const shouldBeActive = progress >= STICKY_ACTIVE_THRESHOLD;
    if (shouldBeActive !== stickyActiveRef.current) {
      stickyActiveRef.current = shouldBeActive;
      setStickyActive(shouldBeActive);
      // loto permanece visible — sin fade al activar sticky header
    }
    const shouldShowBorder = progress >= HEADER_BORDER_THRESHOLD;
    if (shouldShowBorder !== headerBorderActiveRef.current) {
      headerBorderActiveRef.current = shouldShowBorder;
      Animated.timing(headerBorderAnim, {
        toValue: shouldShowBorder ? 1 : 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [updateSearchBtnVisibility, headerBorderAnim]);

  const { greetingVisible } = useGreetingVisible();
  const backdropAnim = useRef(new Animated.Value(1)).current;
  const phraseAnim = useRef(new Animated.Value(0)).current;
  const greetingAnim5 = useRef(new Animated.Value(0)).current;
  const logoAnim5     = useRef(new Animated.Value(1)).current;
  const logoLoadAnim  = useRef(new Animated.Value(1)).current;
  const logoOpacity   = useRef(Animated.multiply(logoLoadAnim, logoAnim5)).current;
  const weeklyPhrase = useRef(getWeeklyPhrase()).current;
  const phraseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Pausa las animaciones de SceneAnimationInline al salir de esta tab.
  // Las tabs quedan montadas en Expo Router; sin este gate los withRepeat
  // de las capas siguen corriendo 60fps de fondo → lag acumulativo.
  const [tabFocused, setTabFocused] = useState(false);
  useFocusEffect(
    useCallback(() => {
      setTabFocused(true);
      return () => setTabFocused(false);
    }, []),
  );

  useFocusEffect(
    useCallback(() => {
      phraseAnim.setValue(0);
      if (greetingVisible) {
        // Modo logo ON: logo visible, frase entra/sale, logo se queda, saludo nunca aparece
        greetingAnim5.setValue(0);
        logoAnim5.setValue(1);
        const seq = Animated.sequence([
          Animated.timing(phraseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
          Animated.delay(5000),
          Animated.timing(phraseAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
        ]);
        seq.start();
        return () => {
          seq.stop();
          phraseAnim.stopAnimation();
          logoAnim5.stopAnimation();
          phraseAnim.setValue(0);
          greetingAnim5.setValue(0);
          logoAnim5.setValue(1);
        };
      } else {
        // Modo logo OFF: sin logo, saludo inmediato, frase igual
        greetingAnim5.setValue(1);
        logoAnim5.setValue(0);
        const seq = Animated.sequence([
          Animated.timing(phraseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
          Animated.delay(5000),
          Animated.timing(phraseAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
        ]);
        seq.start();
        return () => {
          seq.stop();
          phraseAnim.stopAnimation();
          phraseAnim.setValue(0);
          greetingAnim5.setValue(1);
          logoAnim5.setValue(0);
        };
      }
    }, [greetingVisible]),
  );

  const handleMainScroll = useCallback(
    (e: { nativeEvent: { contentOffset: { y: number } } }) => {
      const y = e.nativeEvent.contentOffset.y;
      scrollYRef.current = y;

      updateStickyActive();
      // Scroll-linked: imagen visible en y=0, desaparece a los 280px de scroll
      backdropAnim.setValue(Math.max(0, 1 - y / 280));
    },
    [updateStickyActive, backdropAnim],
  );
  const handleInicio2Scroll = useMemo(
    () =>
      Animated.event(
        [{ nativeEvent: { contentOffset: { y: inicio2ScrollY } } }],
        {
          useNativeDriver: ND,
          listener: handleMainScroll,
        },
      ),
    [handleMainScroll, inicio2ScrollY],
  );

  // ── Buscador desplegable (se abre desde el ícono de lupa) ────────────────
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<TextInput>(null);
  const searchOpenSV = useSharedValue(0);

  const openSearch = useCallback(() => {
    setSearchOpen(true);
    searchOpenRef.current = true;
    updateSearchBtnVisibility();
    searchOpenSV.value = withTiming(1, { duration: 260, easing: Easing.out(Easing.cubic) });
    requestAnimationFrame(() => searchInputRef.current?.focus());
  }, [searchOpenSV, updateSearchBtnVisibility]);

  const closeSearch = useCallback(() => {
    Keyboard.dismiss();
    searchOpenRef.current = false;
    updateSearchBtnVisibility();
    searchOpenSV.value = withTiming(0, { duration: 200, easing: Easing.in(Easing.cubic) }, (finished) => {
      if (finished) runOnJS(setSearchOpen)(false);
    });
    setSearchQuery("");
  }, [searchOpenSV, updateSearchBtnVisibility]);

  const handleSearchBtnPress = useCallback(() => {
    if (searchOpen) {
      closeSearch();
    } else {
      openSearch();
    }
  }, [searchOpen, closeSearch, openSearch]);

  const navRowLayerStyle = useAnimatedStyle(() => ({
    opacity: 1 - searchOpenSV.value,
    transform: [{ translateX: -searchOpenSV.value * 10 }],
  }));
  const searchFieldLayerStyle = useAnimatedStyle(() => ({
    opacity: searchOpenSV.value,
    transform: [{ translateX: (1 - searchOpenSV.value) * 16 }],
  }));

  const searchTerm = searchQuery.trim().toLowerCase();
  const searchResults = React.useMemo<Session[]>(() => {
    if (!searchTerm) return [];
    return SESSIONS.filter(
      (s) =>
        s.title.toLowerCase().includes(searchTerm) ||
        s.categoryLabel.toLowerCase().includes(searchTerm) ||
        (s.subtitle ?? "").toLowerCase().includes(searchTerm)
    ).slice(0, 20);
  }, [searchTerm]);

  const handleSelectSearchResult = useCallback(
    (s: Session) => {
      closeSearch();
      if (s.skipMiniPlayer) {
        playSession(s);
        return;
      }
      if (s.skipDetail) {
        playSession(s);
        router.push("/player" as never);
        return;
      }
      openCategory(`/session/${s.id}`);
    },
    [closeSearch, playSession],
  );

  return (
    <View
      testID={`inicio-${variant}`}
      style={[styles.root, { backgroundColor: activeTheme.gradient[activeTheme.gradient.length - 1] as string }]}
    >
      {/* ── Fondo degradado del tema (4 stops) ── */}
      <LinearGradient
        colors={activeTheme.gradient as unknown as [string, string, ...string[]]}
        locations={activeTheme.gradientLocations}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {/* ── Todo el contenido se desvanece en modo inmersivo ── */}
      <Animated.View style={{ flex: 1, opacity: contentOpacity }} pointerEvents={immersive ? "none" : "auto"}>

      {/* ── Frase — anclada, posición fija, se oculta con el backdrop al hacer scroll ── */}
      {greetingVisible && (
        <Animated.View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: topPad + 147,
            left: 0,
            right: 0,
            alignItems: "center",
            gap: 6,
            opacity: backdropAnim,
          }}
        >
          {/* frase oculta */}
        </Animated.View>
      )}

      <StatusBar hidden />

      {/* ── Header fijo: Menú + Racha (solo Inicio original) ── */}
      {!isInicio2 && (
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 20,
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 14,
          paddingTop: topPad - 10,
          paddingBottom: 8,
          overflow: "hidden",
        }}
      >
        {/* Réplica exacta del fondo: mismo degradado full-screen recortado,
            para que el header se funda sin costura con el fondo de la pantalla */}
        <LinearGradient
          colors={activeTheme.gradient as unknown as [string, string, ...string[]]}
          locations={activeTheme.gradientLocations}
          style={{ position: "absolute", top: 0, left: 0, right: 0, height }}
          pointerEvents="none"
        />
        {/* Izquierda: Menú */}
        <View style={{ alignItems: "center", marginLeft: 3 }}>
          <Pressable
            onPress={openDrawer}
            hitSlop={10}
            style={({ pressed }) => ({
              opacity: pressed ? 0.7 : 1,
              width: 36,
              height: 36,
              alignItems: "center",
              justifyContent: "center",
            })}
          >
            <Ionicons name="menu" size={24} color="#FFFFFF" />
          </Pressable>
        </View>

        {/* Centro: espacio */}
        <View style={{ flex: 1 }} pointerEvents="none" />

        {/* Derecha: Racha */}
        <Pressable
          hitSlop={8}
          style={({ pressed }) => [styles.giftBtn, { opacity: pressed ? 0.8 : 1, marginRight: 10, flexDirection: "row", alignItems: "center" }]}
          onPressIn={() =>
            Animated.spring(giftScaleAnim, { toValue: 0.82, speed: 30, bounciness: 0, useNativeDriver: true }).start()
          }
          onPressOut={() => {
            Animated.spring(giftScaleAnim, { toValue: 1, speed: 8, bounciness: 16, useNativeDriver: true }).start();
          }}
          onPress={() => router.push("/(tabs)/profile" as never)}
          // Prueba escondida: presión larga abre el flujo de celebración de
          // día de racha (no marca el día como celebrado).
          onLongPress={previewStreakFlow}
          delayLongPress={600}
        >
          <Animated.View style={{ transform: [{ scale: giftScaleAnim }] }}>
            <View style={{
              backgroundColor: activeSceneId === "indigo" ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.08)",
              borderRadius: 20,
              height: 36,
              paddingHorizontal: 10,
              flexDirection: "row",
              alignItems: "center",
              gap: 5,
            }}>
              {currentStreakDisplay > 0 && (
                <Text style={{ fontSize: 14, fontWeight: "300", color: "#f9f9f9", fontFamily: "Manrope", lineHeight: 18 }}>
                  {currentStreakDisplay}
                </Text>
              )}
              <MaterialCommunityIcons name="spa" size={20} color="#FFFFFF" style={{ marginTop: 1 }} />
            </View>
          </Animated.View>
        </Pressable>
      </View>
      )}

      <Animated.ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 160 + bottomPad, paddingTop: isInicio2 ? 0 : topPad + 38 }}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!isInicio2 || inicio2ScrollEnabled}
        onScroll={isInicio2 ? handleInicio2Scroll : handleMainScroll}
        scrollEventThrottle={16}
        onLayout={(e) => {
          scrollLayoutHeightRef.current = e.nativeEvent.layout.height;
          updateStickyActive();
        }}
        onContentSizeChange={(_w, h) => {
          scrollContentHeightRef.current = h;
          updateStickyActive();
        }}
      >
        {/* ── Slider místico Inicio 2 / escena o intención del Inicio original ── */}
        {isInicio2 ? (
          <>
            <Inicio2HeroSlider
              topInset={topPad}
              focused={tabFocused}
              scrollY={inicio2ScrollY}
              currentStreak={currentStreakDisplay}
              giftScale={giftScaleAnim}
              onOpenDrawer={openDrawer}
              onOpenProfile={() => router.push("/(tabs)/profile" as never)}
              onHorizontalGestureActiveChange={handleInicio2HorizontalGesture}
            />
          </>
        ) : showAnimatedScene ? (
          /* Escena animada: fondo libre, pasa por debajo del contenido.
             El View mantiene el espacio en el flujo; la animación es absoluta para no cortar. */
          <View style={{ height: 260, marginTop: -23, overflow: "visible" }} pointerEvents="box-none">

            {/* Botón "Pulsación" — solo si el usuario nunca activó ninguna escena */}
            {!animRevealed && (
              <Pressable
                onPress={handlePulsacion}
                style={({ pressed }) => ({
                  position: "absolute",
                  top: 72,
                  left: 0,
                  right: 0,
                  alignItems: "center" as const,
                  opacity: pressed ? 0.72 : 1,
                })}
              >
                <LinearGradient
                  colors={["rgba(190,150,80,0.22)", "rgba(190,150,80,0.07)"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    paddingVertical: 14,
                    paddingHorizontal: 38,
                    borderRadius: 50,
                    borderWidth: 1,
                    borderColor: "rgba(190,150,80,0.42)",
                  }}
                >
                  <Text style={{
                    fontFamily: "Manrope",
                    fontSize: 16,
                    fontWeight: "600",
                    color: "#F0DFB0",
                    letterSpacing: 2,
                    textTransform: "uppercase" as const,
                  }}>
                    Pulsación
                  </Text>
                </LinearGradient>
              </Pressable>
            )}

            {/* Animación (visible tras revelar con Pulsación o desde escena guardada) */}
            <Animated.View
              style={{
                opacity: animRevealFade,
                position: "absolute",
                top: 10,
                left: -16,
                right: -16,
              }}
              pointerEvents={animRevealed ? "box-none" : "none"}
            >
              {headerScene && animRevealed && tabFocused && !immersive && (
                <SceneAnimationInline
                  key={headerScene.id}
                  scene={headerScene}
                  height={293}
                  onPress={() => setAnimSheetOpen(true)}
                  bgOverride={shuffleBgColor}
                  noInternalFade
                  quality="home"
                />
              )}

              {/* Frase overlay — centrada sobre la animación */}
              {phraseVisible && (
                <View
                  style={{
                    position: "absolute",
                    left: 28,
                    right: 28,
                    top: 60,
                    bottom: 20,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  pointerEvents="none"
                >
                  <Text
                    style={{
                      fontFamily: "Manrope",
                      fontSize: 14,
                      fontWeight: "500",
                      color: "rgba(255,255,255,0.90)",
                      textAlign: "center",
                      lineHeight: 21,
                      textShadowColor: "rgba(0,0,0,0.65)",
                      textShadowOffset: { width: 0, height: 1 },
                      textShadowRadius: 5,
                    }}
                    numberOfLines={4}
                  >
                    {headerScene?.phrase ?? weeklyPhrase}
                  </Text>
                </View>
              )}
            </Animated.View>
          </View>
        ) : variant === "original" ? (
          /* Establece tu intención aquí (modo intención diaria) */
          <Pressable
            onPress={handleIntentionPress}
            style={({ pressed }) => [
              styles.intencionWrap,
              { marginTop: -5, marginBottom: 0, transform: [], opacity: pressed ? 0.75 : 1 },
            ]}
          >
            <Text style={styles.intencionSuper}>Hoy quiero…</Text>
            <View style={styles.intencionRow}>
              <Animated.View style={[styles.intencionCursor, { opacity: cursorOpacity }]} />
              {currentIntencion ? (
                <Text style={styles.intencionText} numberOfLines={2}>{currentIntencion}</Text>
              ) : (
                <Text style={styles.intencionPlaceholder}>Proyecta tu propósito</Text>
              )}
            </View>
          </Pressable>
        ) : null}

        <View
          style={[
            isInicio2 && styles.inicio2ContentPanel,
            isInicio2 && {
              backgroundColor: activeTheme.gradient[activeTheme.gradient.length - 1] as string,
            },
          ]}
        >
        {isInicio2 && (
          <View pointerEvents="none" style={styles.inicio2ContentGradientClip}>
            <LinearGradient
              colors={activeTheme.gradient as unknown as [string, string, ...string[]]}
              locations={activeTheme.gradientLocations}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={{
                position: "absolute",
                top: -INICIO2_HERO_HEIGHT,
                left: 0,
                right: 0,
                height,
              }}
            />
          </View>
        )}
        {isInicio2 && (
          <View
            style={[
              styles.inicio2ToolsSection,
              // Los tabs bajan 6 px; el espacio siguiente se reduce 11 px
              // para que Recomendaciones diarias y lo que sigue suban 5 px.
              { marginTop: 31, marginBottom: INICIO2_SECTION_GAP - 11 },
            ]}
          >
            <ToolsGrid />
          </View>
        )}
        {isInicio2 && (
          <DailyRecommendationsSection
            sessions={dailyRecommendations}
            dayKey={todayKey}
            style={{ paddingHorizontal: GRID_PAD }}
          />
        )}
        {isInicio2 && (
          <SessionCarousel
            title="Sesiones recientes"
            description="Contenido que has escuchado recientemente"
            sessions={filteredListened}
            isPremium={isPremium}
            onPress={(s) => { if (s.skipMiniPlayer) { playSession(s); return; } if (s.skipDetail) { playSession(s); router.push("/player" as never); return; } openCategory(`/session/${s.id}`); }}
            style={{ marginTop: 0, marginBottom: INICIO2_SECTION_GAP, paddingHorizontal: GRID_PAD }}
            titleOffset={10}
            cardWidth={INICIO2_SESSION_CARD_W}
            allowOversizedCardWidth
            titleSize={19}
            titleSpacing={17}
            onViewAll={() => router.push("/historial" as never)}
            squareCards
            cardAuthorColor="#acaac2"
            showImageCategoryPill
          />
        )}
        {isInicio2 && SHOW_CONTINUE_LISTENING && continueSession && (
          <View style={styles.continueSection} testID="inicio2-continue-listening">
            <Text style={[styles.sectionTitle, styles.continueSectionTitle]}>
              Seguir escuchando
            </Text>
            <Pressable
              onPress={handleContinueListening}
              accessibilityRole="button"
              accessibilityLabel={
                continueLocked
                  ? `Desbloquear ${continueSession.title}`
                  : `Continuar ${continueSession.title}`
              }
              testID="inicio2-continue-listening-button"
              style={({ pressed }) => [
                styles.continueCard,
                { backgroundColor: cardBg, opacity: pressed ? 0.84 : 1 },
              ]}
            >
              <ExpoImage
                source={continueSession.image}
                style={styles.continueImg}
                contentFit="cover"
                transition={180}
              />
              <View style={styles.continueMeta}>
                <Text style={[styles.continueKicker, { color: colors.primary }]}>
                  {continueProgress > 0
                    ? `RETOMA · ${Math.round(continueProgress * 100)}% ESCUCHADO`
                    : "RETOMA DONDE LO DEJASTE"}
                </Text>
                <Text style={[styles.continueTitle, { color: colors.foreground }]} numberOfLines={2}>
                  {continueSession.title}
                </Text>
                <Text style={[styles.continueSub, { color: colors.mutedForeground }]} numberOfLines={1}>
                  {continueAuthor}
                </Text>
                {continueProgress > 0 && (
                  <View
                    style={[
                      styles.continueProgressTrack,
                      { backgroundColor: `${colors.primary}33` },
                    ]}
                  >
                    <View
                      style={[
                        styles.continueProgressFill,
                        {
                          width: `${Math.min(100, Math.max(0, continueProgress * 100))}%`,
                          backgroundColor: colors.primary,
                        },
                      ]}
                    />
                  </View>
                )}
              </View>
              <View style={[styles.continuePlay, { backgroundColor: colors.primary }]}>
                <Feather
                  name={continueLocked ? "lock" : "play"}
                  size={16}
                  color={colors.background}
                  style={continueLocked ? undefined : { marginLeft: 2 }}
                />
              </View>
            </Pressable>
          </View>
        )}
        {isInicio2 && (
          <SessionCarousel
            title="Mis favoritos"
            sessions={favoriteSessions}
            isPremium={isPremium}
            onPress={(s) => { if (s.skipMiniPlayer) { playSession(s); return; } if (s.skipDetail) { playSession(s); router.push("/player" as never); return; } openCategory(`/session/${s.id}`); }}
            style={{ marginTop: 0, marginBottom: INICIO2_SECTION_GAP, paddingHorizontal: GRID_PAD }}
            titleOffset={10}
            cardWidth={INICIO2_SESSION_CARD_W}
            allowOversizedCardWidth
            titleSize={19}
            titleSpacing={17}
            onViewAll={() => openCategory("/favoritos-todos")}
            squareCards
            cardAuthorColor="#acaac2"
            showImageCategoryPill
          />
        )}
        {isInicio2 && (
          <View style={[styles.durSection, { marginTop: 0, marginBottom: INICIO2_SECTION_GAP }]}>
            <Text style={[styles.sectionTitle, { marginBottom: 17, paddingHorizontal: GRID_PAD }]}>
              Explora según tu tiempo
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={[styles.durPillRow, { paddingLeft: GRID_PAD }]}
            >
              {DURATION_SLOTS.map((slot) => (
                <Pressable
                  key={slot.label}
                  onPress={() => openCategory(`/busqueda?tiempo=${encodeURIComponent(slot.label)}`)}
                  style={({ pressed }) => [
                    styles.durPill,
                    styles.inicio2DurPill,
                    { opacity: pressed ? 0.75 : 1 },
                  ]}
                >
                  <View style={[StyleSheet.absoluteFill, { borderRadius: 10, backgroundColor: durationPillBg }]} />
                  <Text
                    style={styles.durPillText}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.7}
                  >
                    {slot.displayLabel}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}
        {isInicio2 && videos.length > 0 && (
          <View style={{ marginBottom: INICIO2_SECTION_GAP }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: GRID_PAD, marginBottom: 17 }}>
              <Text style={[styles.sectionTitle, { fontSize: 20, marginBottom: 0 }]}>Videos destacados</Text>
              <Pressable hitSlop={8} onPress={() => openCategory("/videos")}>
                <Text style={{ color: colors.primary, fontSize: 13, fontFamily: "Manrope", fontWeight: "600" }}>Ver todos</Text>
              </Pressable>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: GRID_PAD, gap: 14 }}
            >
              {videos.slice(0, 8).map((v) => (
                <VideoCard key={v.id} video={v} width={VIDEO_HERO_W} />
              ))}
            </ScrollView>
          </View>
        )}
        {isInicio2 && (
          <RecommendedForYouSection
            selectedMoods={selectedMoods}
            generation={moodRecommendationGeneration}
            catalogStatus={catalogStatus}
            catalogVersion={catalogVersion}
            isPremium={isPremium}
            onPress={handleRecommendedSessionPress}
          />
        )}
        {isInicio2 && (
          <EncuentrosResonadoresSection
            marginTop={INICIO2_SECTION_GAP}
            marginBottom={INICIO2_SECTION_GAP}
            titleMarginTop={0}
          />
        )}
        {isInicio2 && (
          <ResonadoresSection
            marginTop={0}
            marginBottom={INICIO2_SECTION_GAP}
          />
        )}
        {/* ── SESIÓN EN VIVO PRÓXIMA ── */}
        {nextLiveSession && (
          <View style={{ paddingHorizontal: GRID_PAD, marginBottom: isInicio2 ? INICIO2_SECTION_GAP : SECTION_GAP }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <Text style={[styles.sectionTitle, isInicio2 && { marginBottom: 17 }]}>
                Tu próxima sesión
              </Text>
              <Pressable
                onPress={() => router.push("/mis-sesiones" as never)}
                hitSlop={8}
              >
                <Text style={{ color: colors.primary, fontSize: 13, fontFamily: "Manrope" }}>
                  Ver todas
                </Text>
              </Pressable>
            </View>
            <LiveSessionCard
              session={nextLiveSession}
              onEnter={(s) => {
                router.push({
                  pathname: "/sesion-vivo/[id]" as never,
                  params: {
                    id: String(s.id),
                    roomUrl: s.dailyRoomUrl ?? "",
                    guideDisplayName: s.guideDisplayName ?? "",
                  },
                } as never);
              }}
            />
          </View>
        )}


        {/* ── ESCENAS ANIMADAS ── (se muestran en EscenasSheet) */}
        {false && activeScenes.length > 0 && (
          <View style={{ marginBottom: SECTION_GAP }}>
            <View style={{ paddingHorizontal: GRID_PAD, flexDirection: "row", alignItems: "center", marginBottom: 18, gap: 8 }}>
              <Text style={styles.sectionTitle}>Escenas animadas</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: GRID_PAD, gap: 12 }}
            >
              {activeScenes.map((scene) => (
                <SceneAnimationCard
                  key={scene.id}
                  scene={scene}
                  size={136}
                  onPress={() => selectHeaderScene(scene)}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* ── ¿Cuánto tiempo tienes hoy? ── */}
        {!isInicio2 && (
          <View style={[styles.durSection, { marginBottom: SECTION_GAP }]}>
          <Text style={[styles.sectionTitle, isInicio2 && styles.inicio2SectionTitle, { marginBottom: isInicio2 ? 20 : 24, paddingHorizontal: GRID_PAD }]}>
            ¿Cuánto tiempo tienes hoy?
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[styles.durPillRow, { paddingLeft: GRID_PAD }]}
          >
            {DURATION_SLOTS.map((slot) => (
              <Pressable
                key={slot.label}
                onPress={() => openCategory(`/busqueda?tiempo=${encodeURIComponent(slot.label)}`)}
                style={({ pressed }) => [
                  styles.durPill,
                  { opacity: pressed ? 0.75 : 1 },
                ]}
              >
                  <View style={[StyleSheet.absoluteFill, { borderRadius: 20, backgroundColor: durationPillBg }]} />
                <Text
                  style={styles.durPillText}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.7}
                >
                  {slot.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
          </View>
        )}

        {/* ── RECIENTES ── */}
        {!isInicio2 && (
          <SessionCarousel
            title="Recientes"
            sessions={recentSessions}
            isPremium={isPremium}
            onPress={(s) => { if (s.skipMiniPlayer) { playSession(s); return; } if (s.skipDetail) { playSession(s); router.push("/player" as never); return; } openCategory(`/session/${s.id}`); }}
            style={{ marginTop: -6, marginBottom: SECTION_GAP, paddingHorizontal: GRID_PAD }}
            titleOffset={10}
            cardWidth={RECENT_CARD_W}
            titleSize={20}
            showCardMetadata
          />
        )}

        {/* ── ESCUCHADAS RECIENTEMENTE ── */}
        {!isInicio2 && (
          <SessionCarousel
            title="Escuchadas recientemente"
            sessions={filteredListened}
            isPremium={isPremium}
            onPress={(s) => { if (s.skipMiniPlayer) { playSession(s); return; } if (s.skipDetail) { playSession(s); router.push("/player" as never); return; } openCategory(`/session/${s.id}`); }}
            style={{ marginBottom: SECTION_GAP, paddingHorizontal: GRID_PAD }}
            titleOffset={10}
            cardWidth={RECENT_CARD_W}
            titleSize={20}
            showCardMetadata
          />
        )}

        {/* ── FAVORITOS ── */}
        {!isInicio2 && (
          <SessionCarousel
            title="Mis favoritos"
            sessions={favoriteSessions}
            isPremium={isPremium}
            onPress={(s) => { if (s.skipMiniPlayer) { playSession(s); return; } if (s.skipDetail) { playSession(s); router.push("/player" as never); return; } openCategory(`/session/${s.id}`); }}
            style={{ marginBottom: SECTION_GAP, paddingHorizontal: GRID_PAD }}
            titleOffset={10}
            cardWidth={RECENT_CARD_W}
            titleSize={20}
            onViewAll={() => openCategory("/favoritos-todos")}
            showCardMetadata
          />
        )}


        {!isInicio2 && (
          <InicioMoodRecommendations
            selectedMoods={selectedMoods}
            moodRecommended={moodRecommended}
            isPremium={isPremium}
            cardBg={recommendationSurfaceBg}
            onOpenMoodPicker={() => setMoodSheetVisible(true)}
            onClearMood={() => setSelectedMoods([])}
            onRefreshRecommendations={() => setRecoOffset((n) => n + 1)}
            onPlaySession={playSession}
            openCategory={openCategory}
          />
        )}


        {/* ── BANNER PREMIUM ── */}
        {!isPremium && (
          <View style={[styles.premBannerOuter, isInicio2 && { marginTop: 0, marginBottom: INICIO2_SECTION_GAP }]}>
            <Pressable
              onPress={() => router.push("/membresia" as never)}
              style={({ pressed }) => [styles.premBannerWrap, { opacity: pressed ? 0.82 : 1 }]}
            >
              <LinearGradient
                colors={["#4A1212", "#2C0909", "#1E0608"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
              />
              <LinearGradient
                colors={["rgba(255,255,255,0.05)", "transparent"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0.6, y: 1 }}
                style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
                pointerEvents="none"
              />
              <View style={styles.premCrownCircle}>
                <Text style={{ fontSize: 18 }}>👑</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.premTitle}>Prueba Premium</Text>
                <Text style={styles.premSub}>Desbloquea todo el contenido</Text>
              </View>
              <View style={styles.premChevron}>
                <Feather name="chevron-right" size={14} color="#F9F9F9" />
              </View>
            </Pressable>
          </View>
        )}

        {!isInicio2 && <AlmaCommunitySection />}
        {/* ── 10. BANNER PREMIUM ── */}
        <View style={{ marginBottom: isInicio2 ? INICIO2_SECTION_GAP : SECTION_GAP }}>
          <PremiumBanner />
        </View>

        {isInicio2 && <AlmaCommunitySection />}

        </View>
      </Animated.ScrollView>

      <InicioEmotionWidget
        bottom={emotionWidgetBottom}
        backgroundColor={emotionWidgetBackground}
        onOpenMoodPicker={() => setMoodSheetVisible(true)}
      />
      </Animated.View>{/* fin contenido desvanecible */}


      <EscenasAnimSheet
        visible={animSheetOpen}
        scenes={activeScenes}
        activeSceneId={headerSceneId}
        onSelect={handleAnimSceneSelect}
        onClose={() => setAnimSheetOpen(false)}
      />

      <ProgresoModal visible={progresoVisible} onClose={() => setProgresoVisible(false)} />

      <MoodPickerSheet
        visible={moodSheetVisible}
        onClose={() => setMoodSheetVisible(false)}
        initialSelectedIds={selectedMoods.map((mood) => mood.id)}
        onSelect={handleMoodSelect}
      />

      <SessionActionsSheet
        session={actionsSession}
        visible={actionsSession !== null}
        onClose={() => setActionsSession(null)}
      />

      {/* SceneAnimationModal lives at root (_layout.tsx) via SelectedSceneContext */}

      {/* ── Modo inmersivo — animación centrada, fade in/out + pinch zoom ── */}
      {headerScene && immersiveRendered && tabFocused && (
        <Animated.View
          style={[StyleSheet.absoluteFill, { opacity: immersiveAnim, justifyContent: "center" }]}
          pointerEvents={immersive ? "box-none" : "none"}
        >
          <GestureDetector gesture={immersiveGesture}>
            <View style={[StyleSheet.absoluteFill, { justifyContent: "center" }]}>
              <SceneAnimationInline
                key={headerScene.id}
                scene={headerScene}
                height={300}
                onPress={toggleImmersive}
                style={undefined}
                paused={!tabFocused || !immersive}
                liveScaleSV={pinchScale}
                quality="home"
              />
            </View>
          </GestureDetector>
        </Animated.View>
      )}

    </View>
  );
}

// Botones de control sobre la animación inline (Frase / Shuffle / Grid)
const ctrlBtnStyles = StyleSheet.create({
  base: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.38)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  active: {
    backgroundColor: "rgba(190,150,80,0.32)",
    borderColor: "rgba(190,150,80,0.50)",
  },
});

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#210911" },
  inicio2Hero: {
    height: INICIO2_HERO_HEIGHT,
    width: "100%",
    overflow: "visible",
    backgroundColor: "#060A0F",
  },
  inicio2ContentPanel: {
    position: "relative",
    zIndex: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
  },
  inicio2ToolsSection: {
    marginBottom: INICIO2_SECTION_GAP,
    paddingHorizontal: GRID_PAD,
  },
  inicio2ContentGradientClip: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  inicio2HeroImageLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  inicio2HeroImage: {
    ...StyleSheet.absoluteFillObject,
    width: "106%",
    left: "-3%",
    height: "106%",
    top: "-3%",
  },
  inicio2HeroActions: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 18,
  },
  inicio2HeroProfileButton: {
    maxWidth: "76%",
    flexDirection: "row",
    alignItems: "center",
  },
  inicio2HeroAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  inicio2HeroAvatarFallback: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(190,150,80,0.28)",
  },
  inicio2HeroAvatarInitial: {
    color: "#FFFFFF",
    fontFamily: "Manrope",
    fontSize: 17,
    fontWeight: "700",
  },
  inicio2HeroGreeting: {
    minWidth: 0,
    marginLeft: 10,
    gap: 1,
    width: width * 0.6,
  },
  inicio2HeroGreetingLabel: {
    color: "rgba(255,255,255,0.82)",
    fontFamily: "Manrope",
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "500",
    textShadowColor: "rgba(0,0,0,0.65)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  inicio2HeroGreetingName: {
    color: "#FFFFFF",
    fontFamily: "Manrope",
    fontSize: 18,
    lineHeight: 23,
    fontWeight: "700",
    textShadowColor: "rgba(0,0,0,0.65)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  inicio2HeroLotusButton: {
    minWidth: 54,
    height: 36,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  inicio2HeroLotusContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  inicio2HeroEmotionWidget: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    zIndex: 25,
    elevation: 25,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.38,
    shadowRadius: 10,
  },
  inicio2HeroEmotionEmoji: {
    fontSize: 31,
    lineHeight: 38,
  },
  inicio2HeroEmotionAdd: {
    position: "absolute",
    top: -4,
    left: -7,
    width: 31,
    height: 31,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#50326E",
  },
  inicio2HeroEmotionAddText: {
    color: "#FFFFFF",
    fontFamily: "Manrope",
    fontSize: 25,
    lineHeight: 28,
    fontWeight: "600",
    transform: [{ translateY: 2 }],
  },
  inicio2HeroCopy: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
    alignItems: "flex-start",
    justifyContent: "center",
    paddingHorizontal: 18,
    paddingTop: 24,
    paddingBottom: 24,
  },
  inicio2HeroTitle: {
    fontFamily: "Manrope",
    fontSize: 22,
    fontWeight: "800",
    lineHeight: 28,
    color: "#FFFFFF",
    textAlign: "left",
    textShadowColor: "rgba(0,0,0,0.62)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 5,
    transform: [{ translateY: 6 }],
  },
  inicio2HeroCategory: {
    marginBottom: 10,
  },
  inicio2HeroActionButton: {
    marginTop: 20,
    minWidth: 132,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 25,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "#F9F9F9",
    borderWidth: 0.5,
    borderColor: "rgba(249,249,249,0.5)",
    transform: [{ translateY: 15 }],
  },
  inicio2HeroActionButtonText: {
    fontFamily: "Manrope",
    fontSize: 14,
    fontWeight: "700",
    color: "#0D0A1E",
    textAlign: "center",
  },
  inicio2HeroStreak: {
    color: "#FFFFFF",
    fontFamily: "Manrope",
    fontSize: 14,
    fontWeight: "600",
    textShadowColor: "rgba(0,0,0,0.72)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 5,
  },
  inicio2HeroControls: {
    position: "absolute",
    zIndex: 10,
    left: 18,
    right: 18,
    bottom: 18,
    height: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 10,
  },
  inicio2HeroControl: {
    width: INICIO2_CONTROL_SIZE,
    height: INICIO2_CONTROL_SIZE,
    borderRadius: INICIO2_CONTROL_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  inicio2HeroControlDot: {
    width: INICIO2_CONTROL_SIZE,
    height: INICIO2_CONTROL_SIZE,
    borderRadius: INICIO2_CONTROL_SIZE / 2,
    backgroundColor: "rgba(255,255,255,0.42)",
  },
  rootGradient: { ...StyleSheet.absoluteFillObject, top: 25 },
  stickyHeader: {
    paddingHorizontal: GRID_PAD,
    paddingBottom: 0,
    backgroundColor: "transparent",
    zIndex: 10,
  },
  stickyHeaderBorder: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.035)",
  },
  scroll: { flex: 1 },

  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(190,150,80,0.18)",
    marginHorizontal: 20,
    marginVertical: 8,
  },

  // Estado de ánimo
  moodRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: GRID_PAD,
    marginBottom: 8,
    borderRadius: 17,
    overflow: "hidden",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  moodRowActive: {
    paddingVertical: 11,
  },
  moodEmoji: {
    fontFamily: "Manrope",
    fontSize: 22,
  },
  moodRowLabel: {
    fontFamily: "Manrope",
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#FBFBFB",
  },
  moodSientesLabel: {
    fontFamily: "Manrope",
    fontSize: 15,
    fontWeight: "600",
    color: "#FBFBFB",
  },
  moodPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    overflow: "hidden",
  },
  moodPillEmoji: {
    fontFamily: "Manrope",
    fontSize: 16,
  },
  moodPillLabel: {
    fontFamily: "Manrope",
    fontSize: 13,
    fontWeight: "700",
    color: "#fff",
  },
  recoSection: {
    marginHorizontal: GRID_PAD,
    marginBottom: SECTION_GAP,
    flexDirection: "column",
    gap: 16,
  },
  recoCard: {
    borderRadius: 14,
    overflow: "hidden",
    paddingHorizontal: 14,
    paddingVertical: 5,
  },

  inicio2PurposeBlock: {
    marginHorizontal: GRID_PAD,
    marginTop: 28,
    marginBottom: 0,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(130,96,181,0.2)",
    backgroundColor: "rgba(0,0,0,0.15)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  inicio2PurposeCopy: {
    flex: 1,
    minWidth: 0,
  },
  inicio2PurposeKicker: {
    textAlign: "left",
    marginBottom: 8,
  },
  inicio2PurposeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  inicio2PurposeText: {
    flexShrink: 1,
    textAlign: "left",
  },
  inicio2PurposeIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },

  // Intención
  intencionWrap: {
    alignItems: "center",
    paddingHorizontal: GRID_PAD,
    paddingVertical: 20,
    marginTop: 7,
    marginBottom: SECTION_GAP,
    transform: [{ translateY: -37 }],
  },
  intencionSuper: {
    fontFamily: "Manrope",
    fontSize: 13,
    color: "rgba(237,225,211,0.45)",
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  intencionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  intencionCursor: {
    width: 2,
    height: 26,
    borderRadius: 1,
    backgroundColor: "#F9F9F9",
    marginRight: 6,
  },
  intencionText: {
    fontFamily: "Manrope",
    fontSize: 20,
    color: "rgba(255,255,255,0.9)",
    fontWeight: "600",
    textAlign: "center",
    flexShrink: 1,
  },
  intencionPlaceholder: {
    fontFamily: "Manrope",
    fontSize: 20,
    color: "rgba(255,255,255,0.9)",
    fontWeight: "600",
    textAlign: "center",
    flexShrink: 1,
  },

  // Header
  header: {
    paddingHorizontal: GRID_PAD,
    marginBottom: SECTION_GAP,
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    marginBottom: 14,
    gap: 15,
  },
  universeBtn: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  giftBtnInner: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.09)",
  },
  searchBtn: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  giftBtn: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  universeBtnIcon: {
    width: 28,
    height: 28,
  },
  headerRowHost: {
    flex: 1,
    height: 34,
    justifyContent: "center",
    position: "relative",
  },
  headerRowLayer: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: "center",
  },
  searchInputWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(0,0,0,0.14)",
    borderRadius: 17,
    paddingHorizontal: 14,
    height: 34,
  },
  searchInput: {
    fontFamily: "Manrope",
    flex: 1,
    fontSize: 14,
    color: "#FBFBFB",
    padding: 0,
  },
  searchResultsWrap: {
    marginTop: 10,
    maxHeight: 320,
    backgroundColor: "#1B060F",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(190,150,80,0.18)",
    overflow: "hidden",
  },
  searchResultsList: {
    maxHeight: 320,
  },
  searchResultRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(190,150,80,0.12)",
  },
  searchResultThumb: {
    width: 44,
    height: 44,
    borderRadius: 10,
  },
  searchResultCat: {
    fontFamily: "Manrope",
    fontSize: 11,
    color: "rgba(242,231,228,0.45)",
    marginBottom: 2,
  },
  searchResultTitle: {
    fontFamily: "Manrope",
    fontSize: 14,
    fontWeight: "600",
    color: "#FBFBFB",
  },
  searchEmptyWrap: {
    paddingVertical: 18,
    paddingHorizontal: 14,
    alignItems: "center",
  },
  searchEmptyText: {
    fontFamily: "Manrope",
    fontSize: 13,
    color: "rgba(242,231,228,0.45)",
    textAlign: "center",
  },
  searchOutsideCatcher: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 5,
  },
  avatarBtn: {
    width: 33,
    height: 33,
    borderRadius: 16.5,
    overflow: "hidden",
  },
  avatarBtnLoggedIn: {
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.7)",
  },
  avatarSmall: {
    width: 33,
    height: 33,
    borderRadius: 16.5,
  },
  avatarFallback: {
    width: 33,
    height: 33,
    borderRadius: 16.5,
    backgroundColor: "rgba(255,255,255,0.025)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.25)",
  },
  avatarInitial: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(212,175,55,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitialText: {
    fontFamily: "Manrope",
    color: "#F9F9F9",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  headerTabs: {
    flex: 1,
    marginHorizontal: -GRID_PAD,
    overflow: "visible",
  },
  headerTabsContent: {
    flexDirection: "row",
    gap: 5,
    alignItems: "center",
    paddingLeft: GRID_PAD - 3,
    paddingRight: GRID_PAD + 15,
  },
  navAnimWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
  },
  headerTabChip: {
    borderRadius: 20,
    paddingHorizontal: 12,
    height: 34,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTabChipUnsel: {
    borderWidth: 2,
    borderColor: "rgba(244,218,213,0.1)",
  },
  headerTabIconChip: {
    width: 36,
    height: 36,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  headerTabIconImg: {
    width: 26,
    height: 26,
  },
  sesSubSpacer: {
    height: 34,
    overflow: "visible",
    marginLeft: -6,
  },
  sesSubRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingLeft: 6,
  },
  headerTabText: {
    fontFamily: "Manrope",
    fontSize: 12,
    fontWeight: "850" as any,
    color: "#FBFBFB",
    letterSpacing: 0.1,
  },
  headerTabTextActive: {
    fontFamily: "Manrope",
    color: "#1B060F",
    fontWeight: "850" as any,
  },
  intentionCard: {
    paddingVertical: 10,
    marginBottom: 0,
    alignItems: "center",
  },
  intentionLabel: {
    fontFamily: "Manrope",
    fontSize: 11,
    fontWeight: "500",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 6,
    textAlign: "center",
  },
  intentionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  intentionPlaceholder: {
    fontFamily: "Manrope",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.1,
    textAlign: "center",
  },

  // Section — igual para todas las secciones
  section: { marginBottom: SECTION_GAP, paddingHorizontal: GRID_PAD },
  sectionDivider: {
    marginHorizontal: GRID_PAD * 2,
    marginBottom: SECTION_GAP,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  sectionRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginBottom: 0,
  },
  sectionTitle: { fontFamily: "Manrope", fontSize: 20, fontWeight: "700", letterSpacing: 0.3, marginBottom: 17, color: "#FBFBFB" },
  inicio2SectionTitle: { fontSize: 19, marginBottom: 17 },
  continueSection: {
    marginTop: 0,
    marginBottom: INICIO2_SECTION_GAP,
    paddingHorizontal: GRID_PAD,
  },
  continueSectionTitle: {
    color: "#F9F9F9",
    marginBottom: 17,
  },
  continueCard: {
    flexDirection: "row",
    alignItems: "center",
    height: 122,
    borderRadius: 16,
    padding: 10,
    gap: 12,
  },
  continueImg: {
    width: 75.6,
    height: 75.6,
    borderRadius: 12.6,
  },
  continueMeta: { flex: 1 },
  continueKicker: {
    fontFamily: "Manrope",
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  continueTitle: {
    fontFamily: "Manrope",
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 20,
    marginBottom: 3,
  },
  continueSub: {
    fontFamily: "Manrope",
    fontSize: 12,
    lineHeight: 16,
  },
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
  resonadoresBanner: {
    height: 80,
    borderRadius: 14,
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.2)",
  },
  resBannerCircle1: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.07)",
    left: -28,
    top: -30,
  },
  resBannerCircle2: {
    position: "absolute",
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(255,255,255,0.05)",
    right: 30,
    bottom: -24,
  },
  resonadoresBannerInner: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  resonadoresBannerLogo: {
    width: 36,
    height: 36,
  },
  resonadoresBannerContent: {
    gap: 3,
  },
  resonadoresBannerTitle: {
    fontFamily: "Manrope",
    fontSize: 16,
    fontWeight: "400",
    color: "#FBFBFB",
  },
  resonadoresBannerSub: {
    fontFamily: "Manrope",
    fontSize: 12,
    color: "#F4F4F4",
    marginTop: 2,
  },
  resonadoresBannerChevron: {
    marginLeft: 8,
  },
  verTodasLink: { fontFamily: "Manrope", fontSize: 13, fontWeight: "400" },

  // Explorar todo — grid 2 columnas, icono arriba + texto centrado
  temaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: TEMA_GAP,
    marginTop: 2,
  },
  temaCell: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 15,
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  temaCellIcon: {
    width: 28,
    height: 28,
  },
  temaCellLabel: {
    fontFamily: "Manrope",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 17,
  },

  videosEmpty: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(61,14,22,0.40)",
    backgroundColor: "rgba(74,12,12,0.08)",
    paddingVertical: 36,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  videosEmptyTitle: { fontFamily: "Manrope", fontSize: 16, fontWeight: "700", marginBottom: 8 },
  videosEmptySub: { fontFamily: "Manrope", fontSize: 13, textAlign: "center", lineHeight: 19 },

  // Categories — 2×2 grid cards
  catGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  catCard: {
    flexBasis: "40%",
    flexGrow: 1,
    minWidth: 140,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    backgroundColor: "#210911",
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  catCardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  catCardIcon: {
    width: 32,
    height: 32,
  },
  catCardLabel: {
    fontFamily: "Manrope",
    fontSize: 14,
    fontWeight: "600",
    color: "#FBFBFB",
    lineHeight: 18,
  },

  // Escuchados recientemente — foto + título + creador
  recentCard: {
    width: RECENT_CARD_W,
  },
  recentThumbWrap: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "rgba(74,12,12,0.08)",
  },
  recentThumb: {
    width: "100%",
    height: "100%",
  },
  recentStar: {
    position: "absolute",
    top: 8,
    left: 8,
    width: 24,
    height: 24,
  },
  recentDurBadge: {
    position: "absolute",
    bottom: 8,
    left: 8,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  recentDurText: {
    fontFamily: "Manrope",
    fontSize: 11,
    fontWeight: "600",
    color: "#FBFBFB",
  },
  recentTitle: {
    fontFamily: "Manrope",
    fontSize: 13,
    fontWeight: "700",
    color: "#FBFBFB",
    lineHeight: 17,
    marginTop: 8,
  },
  recentCreatorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
  },
  recentAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(74,12,12,0.08)",
  },
  recentCreatorName: {
    fontFamily: "Manrope",
    fontSize: 11,
    color: "#F4F4F4",
    flex: 1,
    marginTop: 4,
  },

  // Hero — sesión destacada del día
  heroImageContainer: {
    width: "100%",
    height: HERO_HEIGHT,
    borderRadius: 15,
    overflow: "hidden",
  },
  heroImage: { width: "100%", height: "100%" },
  heroMetaText: { fontFamily: "Manrope", fontSize: 11, lineHeight: 14, color: "#F4F4F4", marginBottom: 6 },
  heroTitle: { fontFamily: "Manrope", fontSize: 15, fontWeight: "700", lineHeight: 20, color: "#FBFBFB", marginBottom: 4 },
  heroAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: "rgba(255,255,255,0.05)" },
  heroAuthor: { fontFamily: "Manrope", fontSize: 12, color: "#F4F4F4", marginTop: 2 },
  heroBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },

  // Horizontal scroll
  hScroll: { paddingRight: 20 },

  // Square cards (kept for potential reuse)
  squareRow: { flexDirection: "row", gap: 12 },
  squareCard: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 18,
    overflow: "hidden",
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(61,14,22,0.40)",
    alignItems: "center",
    justifyContent: "center",
  },
  diarioIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "rgba(74,12,12,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  squareTitle: { fontFamily: "Manrope", fontSize: 16, fontWeight: "700", letterSpacing: 0.2, marginTop: 12, textAlign: "center", color: "#FBFBFB" },
  squareSub: { fontFamily: "Manrope", fontSize: 12.5, lineHeight: 17, marginTop: 4, textAlign: "center" },
  diarioList: { gap: 10 },

  // Legacy
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionSub: { fontFamily: "Manrope", fontSize: 12, marginTop: 4, marginBottom: 16 },
  seeAll: { fontFamily: "Manrope", fontSize: 13 },
  heroLabel: { fontFamily: "Manrope", fontSize: 10, letterSpacing: 2, marginBottom: 6, fontWeight: "600" },
  heroSub: { fontFamily: "Manrope", fontSize: 13, marginBottom: 18, opacity: 0.85 },

  // Banner premium compacto
  premBannerOuter: {
    marginHorizontal: GRID_PAD,
    marginTop: 7,
    marginBottom: SECTION_GAP,
  },
  premBannerWrap: {
    height: 68,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.35)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 14,
  },
  premCrownCircle: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.025)",
    borderWidth: 1.5,
    borderColor: "rgba(212,175,55,0.45)",
    alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  premTitle: { fontFamily: "Manrope", fontSize: 15, fontWeight: "700", color: "#FBFBFB", lineHeight: 20, marginBottom: 2 },
  premSub:   { fontFamily: "Manrope", fontSize: 12, color: "rgba(255,255,255,0.52)" },
  premChevron: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.025)",
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.35)",
    alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },

  // ¿Cuánto tiempo tienes hoy?
  recoDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.07)",
    marginHorizontal: 4,
  },
  durSection: {
  },
  durPillRow: {
    flexDirection: "row",
    paddingHorizontal: 0,
    paddingRight: DUR_PILL_W * 0.3,
    gap: 6,
    paddingBottom: 2,
  },
  durPill: {
    borderRadius: 20,
    paddingHorizontal: 10,
    minWidth: 80,
    height: 42,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  inicio2DurPill: {
    borderRadius: 10,
  },
  durPillText: {
    fontFamily: "Manrope",
    fontSize: 16,
    fontWeight: "600",
    color: "#FBFBFB",
    letterSpacing: 0.2,
    marginTop: -3,
  },
});

function InicioMoodRecommendations({
  selectedMoods,
  moodRecommended,
  isPremium,
  cardBg,
  titleSize,
  titleSpacing,
  maxItems,
  showTitle = true,
  showDivider = true,
  moodTopOffset = 0,
  onOpenMoodPicker,
  onClearMood,
  onRefreshRecommendations,
  onPlaySession,
  openCategory,
}: InicioMoodRecommendationsProps) {
  return (
    <>
      {/* ── ESTADO DE ÁNIMO ── */}
      {showDivider && <View style={[styles.sectionDivider, { marginTop: -15 }]} />}
      {showTitle && (
        <View style={{ paddingHorizontal: GRID_PAD, marginTop: showDivider ? -15 : 0 }}>
          <Text
            style={[
              styles.sectionTitle,
              titleSize !== undefined && { fontSize: titleSize },
              titleSpacing !== undefined && { marginBottom: titleSpacing },
            ]}
          >
            Personaliza tus recomendaciones
          </Text>
        </View>
      )}

      {selectedMoods.length ? (
        <Pressable
          onPress={onOpenMoodPicker}
          style={({ pressed }) => [
            styles.moodRow,
            styles.moodRowActive,
            { marginTop: moodTopOffset, overflow: "hidden", opacity: pressed ? 0.78 : 1 },
          ]}
        >
          <View style={[StyleSheet.absoluteFill, { backgroundColor: cardBg }]} />
          <Text style={styles.moodSientesLabel}>Sientes:</Text>
          <View style={{ flex: 1 }} />
          <LinearGradient
            colors={["rgba(190,100,80,0.55)", "rgba(120,60,160,0.55)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.moodPill}
          >
            <Text style={styles.moodPillEmoji} numberOfLines={1}>
              {selectedMoods.map((mood) => mood.emoji).join(" ")}
            </Text>
            <Text style={styles.moodPillLabel} numberOfLines={1}>
              {selectedMoods.length === 1
                ? selectedMoods[0].label
                : `${selectedMoods.length} emociones`}
            </Text>
            <Pressable
              onPress={(event) => {
                event.stopPropagation?.();
                onClearMood();
              }}
              hitSlop={10}
              style={{ marginLeft: 2 }}
            >
              <Feather name="x-circle" size={14} color="rgba(255,255,255,0.75)" />
            </Pressable>
          </LinearGradient>
        </Pressable>
      ) : (
        <Pressable
          onPress={onOpenMoodPicker}
          style={({ pressed }) => [
            styles.moodRow,
            { marginTop: moodTopOffset, overflow: "hidden", opacity: pressed ? 0.78 : 1 },
          ]}
        >
          <View style={[StyleSheet.absoluteFill, { backgroundColor: cardBg }]} />
          <Text style={styles.moodEmoji}>🙂</Text>
          <Text style={styles.moodRowLabel}>Expresa tu emoción</Text>
          <Feather name="chevron-right" size={16} color="#f9f9f9" />
        </Pressable>
      )}

      {/* ── RECOMENDADO PARA TI ── */}
      <View style={{ paddingHorizontal: GRID_PAD }}>
        <Text
          style={[
            styles.sectionTitle,
            titleSize !== undefined && { fontSize: titleSize },
            titleSpacing !== undefined && { marginBottom: titleSpacing },
            { marginTop: 24 },
          ]}
        >
          {selectedMoods.length ? "Para tus estados de ánimo" : "Recomendado para ti"}
        </Text>
      </View>
      <View style={styles.recoSection}>
        {moodRecommended.slice(0, maxItems ?? 3).map((session) => (
          <View key={session.id} style={styles.recoCard}>
            <View style={[StyleSheet.absoluteFill, { backgroundColor: cardBg }]} />
            <SessionRow
              session={session}
              imageSize={84}
              showCategoryPill
              onPress={() => {
                if (session.isPremium && !isPremium) {
                  router.push("/membresia" as never);
                  return;
                }
                if (session.skipMiniPlayer) {
                  onPlaySession(session);
                  return;
                }
                if (session.skipDetail) {
                  onPlaySession(session);
                  router.push("/player" as never);
                  return;
                }
                openCategory(`/session/${session.id}`);
              }}
            />
          </View>
        ))}
      </View>

      <Pressable
        onPress={onRefreshRecommendations}
        style={({ pressed }) => ({
          marginTop: -40,
          marginHorizontal: GRID_PAD,
          marginBottom: 0,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          paddingVertical: 12,
          borderRadius: 100,
          backgroundColor: pressed ? "rgba(255,255,255,0.12)" : cardBg,
        })}
      >
        <Text style={{ fontFamily: "Manrope", fontSize: 14, color: "#f9f9f9", fontWeight: "500" }}>
          Actualizar recomendaciones
        </Text>
      </Pressable>
    </>
  );
}
