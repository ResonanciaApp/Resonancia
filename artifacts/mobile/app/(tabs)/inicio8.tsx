import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useUser } from "@clerk/expo";
import { useDayRollover } from "@/hooks/useDayRollover";
import { useStreak } from "@/hooks/useStreak";
import { useEmojiWidget } from "@/context/EmojiWidgetContext";
import { StreakWeekRow } from "@/components/StreakWeekRow";
import { useStreakCelebration } from "@/context/StreakCelebrationContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { SceneThemeBackground } from "@/components/SceneThemeBackground";
import { DrawerEdgeGesture } from "@/components/DrawerForeground";
import { BlurView } from "expo-blur";
import { SymbolView } from "expo-symbols";
import { router, useFocusEffect, useRouter } from "expo-router";
import { openPremiumPlans } from "@/lib/premiumGate";
import { useVideoPlayer, VideoView } from "expo-video";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CardCaptionText as Text } from "@/components/CardCaptionText";
import {
  Animated,
  Dimensions,
  Easing as RNEasing,
  Image,
  FlatList,
  Keyboard,
  Modal,
  type GestureResponderEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import RAnimated, {
  cancelAnimation,
  Easing,
  runOnJS,
  type SharedValue,
  useAnimatedProps,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Svg, {
  Circle as SvgCircle,
} from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GreetingHeader } from "@/components/GreetingHeader";
import { useGreeting } from "@/hooks/useGreeting";
import { useGreetingVisible } from "@/context/GreetingVisibleContext";
import { useDrawerMotion, useHomeDrawer } from "@/context/DrawerContext";
import { useDrawerMediaPaused } from "@/hooks/useDrawerMediaPaused";
import { useRoutineCompletionBanner } from "@/context/RoutineCompletionBannerContext";
import { useCategoryOverlay } from "@/context/CategoryOverlayContext";
import { getWeeklyPhrase } from "@/data/greeting-phrases";
import { GlowRing } from "@/components/GlowRing";
import { HeroCornerBorder } from "@/components/HeroCornerBorder";
import { MoodPickerSheet } from "@/components/MoodPickerSheet";
import { ContextSearchModal } from "@/components/ContextSearchModal";
import { SessionActionsSheet } from "@/components/SessionActionsSheet";
import { SessionCard } from "@/components/SessionCard";
import {
  SessionCategoryPill,
  SESSION_CARD_METADATA_HEIGHT_SCALE,
} from "@/components/SessionCardMetadataOverlay";
import { SessionRow } from "@/components/SessionRow";
import { EqualizerBars } from "@/components/EqualizerBars";
import { SessionCarousel, CoverCarousel } from "@/components/SessionCarousel";
import { SessionDurationBadge } from "@/components/SessionDurationBadge";
import { PremiumBadge } from "@/components/PremiumBadge";
import { Image as ExpoImage } from "expo-image";
import { useAmbientPlayer, AMBIENT_SCENES } from "@/context/AmbientPlayerContext";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { isIndigoThemeId } from "@/config/scene-themes";
import { useCatalog } from "@/context/CatalogContext";
import { useFeaturedMoment } from "@/hooks/useFeaturedMoment";
import { useFoldersPlaylists } from "@/context/FoldersPlaylistsContext";
import { useMixerLibrary } from "@/context/MixerContext";
import { useMixerPanel } from "@/context/MixerPanelContext";
// voiceLabel no usado en hero
import { getSoundImage } from "@/config/sound-images";
import { usePlayerBrowse, usePlayerHome } from "@/context/PlayerContext";
import { useAmbientalDuration } from "@/context/AmbientalDurationContext";
import { TEMAS } from "@/data/temas";
import {
  getGetPopularSessionsQueryKey,
  useGetHeroSessionSlides,
  useGetPopularSessions,
  useGetSceneAnimations,
} from "@workspace/api-client-react";
import type { HeroSessionSlide, SceneAnimation } from "@workspace/api-client-react";
import { SceneAnimationCard } from "@/components/SceneAnimationCard";
import { useRacha } from "@/context/RachaContext";
import { useIntencionDiaria } from "@/context/IntencionDiariaContext";
import { useSelectedScene } from "@/context/SelectedSceneContext";
import { useTabBarVisibility } from "@/context/TabBarVisibilityContext";
import { useCurrentUserAvatarSource } from "@/lib/profile-avatar";
import { SceneAnimationInline } from "@/components/SceneAnimationInline";
import { EscenasAnimSheet } from "@/components/EscenasAnimSheet";
import { SESSIONS, getSessionById, type Session } from "@/data/sessions";
import { getMoodById, type Mood, type MoodId } from "@/data/moods";
import { getArtist } from "@/data/artists";
import { getGuide } from "@/data/guides";
import { usePremium } from "@/context/PremiumContext";
import { useUserProfile } from "@/context/UserProfileContext";
import { useColors } from "@/hooks/useColors";
import {
  CARD_TEXT_ABOVE,
  CARD_TEXT_BELOW,
  CLOUDY_WIDGET_PLUS_GRADIENT,
  NATURAL_WIDGET_PLUS_GRADIENT,
  MEMBERSHIP_AURORA,
  WIDGET_GREEN_SOLID,
} from "@/constants/colors";
import PremiumBanner from "@/components/PremiumBanner";
import QuoteOfTheDay from "@/components/QuoteOfTheDay";
import { ProgresoModal } from "@/components/ProgresoModal";
import { CardTint } from "@/components/CardTint";
import { ToolsGrid } from "@/components/ToolsGrid";
import { DailyRecommendationsSection } from "@/components/DailyRecommendationsSection";
import { selectDailyRecommendations } from "@/lib/daily-recommendations";
import { DailyWisdomCard } from "@/components/DailyWisdomCard";
import { AlmaCommunitySection } from "@/components/AlmaCommunitySection";
import { VideoCard } from "@/components/VideoCard";
import { useVideos } from "@/hooks/useVideos";
import { useResonadores } from "@/hooks/useResonadores";
import {
  CONTENT_CAROUSEL_GAP,
  getTwoCardCarouselCardWidth,
} from "@/constants/carousel";
import { PLAYLISTS } from "@/data/playlists";
import { buildOtherThemeInternalRoute } from "@/lib/explore-other-themes";

import { absoluteMediaUrl, useEffectiveHero } from "@/hooks/effectiveHero";
const { width, height } = Dimensions.get("window");

const GRID_GAP = 12;
const GRID_PAD = 16;
const INICIO2_SECTION_GAP = 53;
const INICIO3_SECTION_EXTRA_GAP = 5;
const SECTION_DIVIDER_COLOR = "rgba(255,255,255,0.12)";
const INICIO3_VERTICAL_LIFT = 11;
const INICIO3_SESSION_CARD_WIDTH = Math.round(
  (width - GRID_PAD - CONTENT_CAROUSEL_GAP) / 1.9,
);
const INICIO3_VIDEO_CARD_WIDTH = Math.round(
  (width - GRID_PAD - CONTENT_CAROUSEL_GAP) / 1.25,
);

const CARD_W = (width - GRID_PAD * 2 - GRID_GAP) / 2;
const CARD_H = CARD_W * 0.72;
const HERO_HEIGHT = 220;
const INICIO2_HERO_HEIGHT = Math.round(Math.min(465, Math.max(401, width * 0.92 + 75)) * 1.15 * 0.95);
const INICIO2_SLIDES = [
  {
    id: "templo",
    image: require("@/assets/images/inicio2-mistico-1-warm.jpg"),
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
// Inicio 2: 2 cards completas + 10 px de la tercera.
const INICIO2_SESSION_CARD_W = Math.max(
  getTwoCardCarouselCardWidth(width, GRID_PAD),
);
// Misma medida exacta usada por los carruseles de Dormir.
const INICIO2_SLEEP_CARD_W = (width - 20 * 2 - 12) / 2;
const INICIO2_SLEEP_CARD_H = Math.round(
  (INICIO2_SLEEP_CARD_W + 50) * SESSION_CARD_METADATA_HEIGHT_SCALE,
);
const INICIO2_SCROLL_START_THRESHOLD = 8;

const SECTION_GAP = 60;
const INICIO3_QUOTE_SECTION_GAP = SECTION_GAP + INICIO3_SECTION_EXTRA_GAP + StyleSheet.hairlineWidth;
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
  { label: "5 min",  displayLabel: "5 minutos",  min: 0,  max: 5  },
  { label: "10 min", displayLabel: "10 minutos", min: 6,  max: 10 },
  { label: "20 min", displayLabel: "20 minutos", min: 11, max: 25 },
  { label: "30 min", displayLabel: "30 minutos", min: 26, max: 35 },
  { label: "60 min", displayLabel: "60 minutos", min: 36, max: Infinity },
] as const;
type DurSlot = (typeof DURATION_SLOTS)[number]["label"];
const DUR_PILL_W = Math.round((width - GRID_PAD * 2 - 6 * 4) / 4.3);
const INICIO2_DURATION_PILL_GAP = 9;
const INICIO2_DURATION_PILL_WIDTH = Math.floor(
  (width - GRID_PAD * 2 - INICIO2_DURATION_PILL_GAP * 2) / 3,
);

function DurationExplorePill({
  label,
  backgroundColor,
  onPress,
  compact = false,
}: {
  label: string;
  backgroundColor: string;
  onPress: () => void;
  compact?: boolean;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const [isPressed, setIsPressed] = useState(false);

  const handlePressIn = () => {
    setIsPressed(true);
    scale.stopAnimation();
    Animated.timing(scale, {
      toValue: 0.97,
      duration: 90,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    setIsPressed(false);
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
      onPressOut={handlePressOut}
      style={styles.durationPillPressable}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Animated.View
        style={[
          styles.durPill,
          compact && styles.inicio2DurPill,
          {
            backgroundColor: isPressed ? WIDGET_GREEN_SOLID : backgroundColor,
            transform: [{ scale }],
          },
        ]}
      >
        <Text
          style={[styles.durPillText, isPressed && { color: "#0E0E17" }]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.7}
        >
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
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

const Inicio2AnimatedCircle = RAnimated.createAnimatedComponent(SvgCircle);

function Inicio2LotusStreak({ lightBackground = false }: { lightBackground?: boolean } = {}) {
  const { currentStreak } = useStreak();

  return (
    <View
      style={[
        styles.inicio2HeroLotusContent,
        { backgroundColor: "rgba(0,0,0,0.25)" },
        lightBackground && styles.inicio3HeroLotusSurface,
      ]}
    >
      <Text
        style={[
          styles.inicio2HeroLotusCount,
          lightBackground && styles.inicio3HeroLotusCount,
        ]}
      >
        {currentStreak}
      </Text>
      <MaterialCommunityIcons name="spa" size={22} color="#F9F9F9" />
    </View>
  );
}

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

function Inicio2HeroSlideLayer({
  active,
  direction,
  revealDirection,
  horizontalDirection,
  horizontalDrag,
  children,
}: {
  active: boolean;
  direction: -1 | 1;
  revealDirection: -1 | 0 | 1;
  horizontalDirection: SharedValue<number>;
  horizontalDrag: SharedValue<number>;
  children: React.ReactNode;
}) {
  const animatedStyle = useAnimatedStyle(() => ({
    opacity:
      active
      || (revealDirection !== 0 && horizontalDirection.value === revealDirection)
        ? 1
        : 0,
    transform: [{
      translateX: active
        ? horizontalDrag.value
        : direction * width + horizontalDrag.value,
    }],
  }), [active, direction, revealDirection]);

  return (
    <RAnimated.View
      pointerEvents="none"
      style={[
        styles.inicio2HeroImageLayer,
        { zIndex: active ? 1 : 2 },
        animatedStyle,
      ]}
    >
      {children}
    </RAnimated.View>
  );
}

function Inicio2HeroSlider({
  topInset,
  focused,
  scrollY,
  giftScale,
  onOpenDrawer,
  onOpenProfile,
}: {
  topInset: number;
  focused: boolean;
  scrollY: SharedValue<number>;
  giftScale: Animated.Value;
  onOpenDrawer: () => void;
  onOpenProfile: () => void;
}) {
  const { user: clerkUser } = useUser();
  const { username } = useUserProfile();
  const greeting = useGreeting();
  const avatarSource = useCurrentUserAvatarSource();
  const [activeIndex, setActiveIndex] = useState(0);
  const activeIndexSV = useSharedValue(0);
  const activeIndexRef = useRef(0);
  const desiredIndexRef = useRef(0);
  const pendingIndexRef = useRef<number | null>(null);
  const focusedRef = useRef(focused);
  // Son assets locales empaquetados: no necesitan una capa oculta para
  // "precargarse". Metro ya conoce los cuatro y solo componemos los relevantes.
  const loadedSlidesRef = useRef(INICIO2_SLIDES.map(() => true));
  const [slideTransition, setSlideTransition] = useState<{
    from: number;
    to: number;
    direction: 1 | -1;
  } | null>(null);
  const slideDrift = useRef(new Animated.Value(0)).current;
  const slideProgress = useSharedValue(0);
  const horizontalGestureActiveRef = useRef(false);
  const [horizontalGestureActive, setHorizontalGestureActiveState] = useState(false);
  const horizontalDrag = useSharedValue(0);
  const horizontalDirection = useSharedValue(0);

  const setHorizontalGestureActive = useCallback((active: boolean) => {
    if (horizontalGestureActiveRef.current === active) return;
    horizontalGestureActiveRef.current = active;
    setHorizontalGestureActiveState(active);
  }, []);

  const commitSlideTransition = useCallback((nextIndex: number) => {
    activeIndexSV.value = nextIndex;
    horizontalDrag.value = 0;
    horizontalDirection.value = 0;
    setSlideTransition(null);
  }, [activeIndexSV, horizontalDirection, horizontalDrag]);

  const transitionToSlide = useCallback((nextIndex: number, continueFromDrag = false) => {
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
    activeIndexSV.value = nextIndex;
    slideDrift.stopAnimation();
    slideDrift.setValue(0);
    cancelAnimation(slideProgress);
    slideProgress.value = 0;
    setSlideTransition({ from: fromIndex, to: nextIndex, direction });
    setActiveIndex(nextIndex);
    horizontalDirection.value = direction;
    if (!continueFromDrag) horizontalDrag.value = 0;
    horizontalDrag.value = withTiming(
      -direction * width,
      {
        duration: continueFromDrag ? 320 : 420,
        easing: Easing.out(Easing.cubic),
      },
      (finished) => {
        if (finished) runOnJS(commitSlideTransition)(nextIndex);
      },
    );
  }, [activeIndexSV, commitSlideTransition, horizontalDirection, horizontalDrag, slideDrift, slideProgress]);

  const setSlide = useCallback((nextIndex: number) => {
    const normalized = (nextIndex + INICIO2_SLIDES.length) % INICIO2_SLIDES.length;
    desiredIndexRef.current = normalized;
    if (slideTransition) {
      pendingIndexRef.current = normalized;
      return;
    }
    if (normalized === activeIndexRef.current) {
      pendingIndexRef.current = null;
      return;
    }

    if (!loadedSlidesRef.current[normalized] || !focusedRef.current) {
      pendingIndexRef.current = normalized;
      return;
    }

    transitionToSlide(normalized);
  }, [slideTransition, transitionToSlide]);

  const bounceAtEdge = useCallback((direction: 1 | -1) => {
    horizontalDirection.value = direction;
    horizontalDrag.value = withSpring(direction * 34, {}, () => {
      horizontalDrag.value = withSpring(0, {}, () => {
        horizontalDirection.value = 0;
      });
    });
  }, [horizontalDirection, horizontalDrag]);

  const setSlideFromSwipe = useCallback((direction: 1 | -1) => {
    const baseIndex = pendingIndexRef.current ?? desiredIndexRef.current;
    const nextIndex = baseIndex + direction;
    if (nextIndex < 0 || nextIndex >= INICIO2_SLIDES.length) {
      pendingIndexRef.current = null;
      desiredIndexRef.current = activeIndexRef.current;
      bounceAtEdge(direction === 1 ? -1 : 1);
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

    if (focused && !horizontalGestureActive) {
      slideProgress.value = withTiming(1, {
        duration: INICIO2_AUTOPLAY_DURATION,
        easing: Easing.linear,
      });
    }

    return () => {
      cancelAnimation(slideProgress);
    };
  }, [activeIndex, focused, horizontalGestureActive, slideProgress]);

  useEffect(() => {
    if (!focused || horizontalGestureActive) return;

    const autoplayTimer = setTimeout(() => {
      if (focusedRef.current && !horizontalGestureActiveRef.current) {
        setSlide(activeIndexRef.current + 1);
      }
    }, INICIO2_AUTOPLAY_DURATION);

    return () => clearTimeout(autoplayTimer);
  }, [activeIndex, focused, horizontalGestureActive, setSlide]);

  useEffect(() => {
    if (slideTransition) return;
    const pendingIndex = pendingIndexRef.current;
    if (pendingIndex === activeIndexRef.current) {
      pendingIndexRef.current = null;
      return;
    }
    if (
      pendingIndex !== null
      && pendingIndex !== activeIndexRef.current
      && loadedSlidesRef.current[pendingIndex]
      && focusedRef.current
    ) {
      transitionToSlide(pendingIndex);
    }
  }, [activeIndex, slideTransition, transitionToSlide]);

  useEffect(() => () => {
    cancelAnimation(slideProgress);
    cancelAnimation(horizontalDrag);
  }, [horizontalDrag, slideProgress]);

  useEffect(() => {
    focusedRef.current = focused;

    if (!focused) {
      setHorizontalGestureActive(false);
      horizontalDrag.value = 0;
      horizontalDirection.value = 0;
      activeIndexSV.value = activeIndexRef.current;
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
  }, [activeIndexSV, focused, horizontalDirection, horizontalDrag, setHorizontalGestureActive, transitionToSlide]);

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

  const finishHorizontalGesture = useCallback((dx: number) => {
    if (Math.abs(dx) >= 36) {
      const direction: 1 | -1 = dx < 0 ? 1 : -1;
      const nextIndex = activeIndexRef.current + direction;
      if (nextIndex >= 0 && nextIndex < INICIO2_SLIDES.length && loadedSlidesRef.current[nextIndex]) {
        transitionToSlide(nextIndex, true);
      } else {
        horizontalDrag.value = withSpring(0);
        setSlideFromSwipe(direction);
      }
    } else {
      horizontalDrag.value = withSpring(0);
    }
    setHorizontalGestureActive(false);
  }, [horizontalDrag, setHorizontalGestureActive, setSlideFromSwipe, transitionToSlide]);

  const horizontalGesture = useMemo(
    () => Gesture.Pan()
      .enabled(slideTransition === null)
      .activeOffsetX([-12, 12])
      .failOffsetY([-10, 10])
      .onStart(() => {
        runOnJS(setHorizontalGestureActive)(true);
      })
      .onUpdate((event) => {
        const direction = event.translationX < 0 ? 1 : -1;
        const nextIndex = activeIndexSV.value + direction;
        horizontalDirection.value = direction;
        horizontalDrag.value =
          nextIndex < 0 || nextIndex >= INICIO2_SLIDES.length
            ? event.translationX * 0.18
            : Math.max(-width, Math.min(width, event.translationX));
      })
      .onEnd((event) => {
        runOnJS(finishHorizontalGesture)(event.translationX);
      })
      .onFinalize((_event, success) => {
        if (!success) {
          horizontalDrag.value = withSpring(0);
          runOnJS(setHorizontalGestureActive)(false);
        }
      }),
    [activeIndexSV, finishHorizontalGesture, horizontalDirection, horizontalDrag, setHorizontalGestureActive, slideTransition],
  );

  const zoom = slideDrift.interpolate({ inputRange: [0, 1], outputRange: [1, 1.035] });
  const driftX = slideDrift.interpolate({ inputRange: [0, 1], outputRange: [0, -6] });
  // El hero se mueve con el scroll normal, pero a menor velocidad. En
  // overscroll el desplazamiento compensa el movimiento del ScrollView para
  // que la imagen siga anclada al borde superior mientras se estira.
  const heroScrollStyle = useAnimatedStyle(() => {
    const y = scrollY.value;
    const translateY = y < 0
      ? Math.max(-INICIO2_HERO_HEIGHT, y)
      : y <= INICIO2_SCROLL_START_THRESHOLD
        ? 0
        : Math.min(INICIO2_HERO_HEIGHT * 0.38, (y - INICIO2_SCROLL_START_THRESHOLD) * 0.38);
    return { transform: [{ translateY }] };
  });
  const heroImageScrollStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + Math.min(0.35, Math.max(0, -scrollY.value / INICIO2_HERO_HEIGHT * 0.35)) }],
  }));
  const heroCopyScrollStyle = useAnimatedStyle(() => {
    const y = scrollY.value;
    const parallax = y < 0
      ? Math.max(-INICIO2_HERO_HEIGHT, y)
      : y <= INICIO2_SCROLL_START_THRESHOLD
        ? 0
        : Math.min(INICIO2_HERO_HEIGHT * 0.38, (y - INICIO2_SCROLL_START_THRESHOLD) * 0.38);
    return { transform: [{ translateY: parallax + 15 }] };
  });
  const displayName =
    username ||
    clerkUser?.firstName ||
    clerkUser?.fullName ||
    clerkUser?.username ||
    "Explorador";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <GestureDetector gesture={horizontalGesture}>
    <View style={styles.inicio2Hero} testID="inicio2-hero-slider" accessibilityLabel={`Diapositiva ${activeIndex + 1} de ${INICIO2_SLIDES.length}`}>
      {INICIO2_SLIDES.map((slide, index) => {
        const isRelevant = index === activeIndex
          || index === activeIndex - 1
          || index === activeIndex + 1
          || slideTransition?.from === index
          || slideTransition?.to === index;
        if (!isRelevant) return null;
        const direction: -1 | 1 = slideTransition?.to === index
          ? slideTransition.direction
          : index < activeIndex ? -1 : 1;
        const revealDirection: -1 | 0 | 1 =
          slideTransition && index !== slideTransition.to ? 0 : direction;
        return (
        <Inicio2HeroSlideLayer
          key={slide.id}
          active={index === (slideTransition?.from ?? activeIndex)}
          direction={direction}
          revealDirection={revealDirection}
          horizontalDirection={horizontalDirection}
          horizontalDrag={horizontalDrag}
        >
          <RAnimated.View style={[StyleSheet.absoluteFill, heroScrollStyle]}>
          <RAnimated.View style={[StyleSheet.absoluteFill, heroImageScrollStyle]}>
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              { transform: [{ scale: zoom }, { translateX: driftX }] },
            ]}
          >
            <Image
              source={slide.image}
              resizeMode="cover"
              onLoad={() => handleSlideLoad(index)}
              onError={(error) => handleSlideError(index, error)}
              style={styles.inicio2HeroImage}
            />
          </Animated.View>
          </RAnimated.View>
          </RAnimated.View>
        </Inicio2HeroSlideLayer>
      )})}

      <RAnimated.View
        pointerEvents="box-none"
        style={[
          styles.inicio2HeroActions,
          { paddingTop: topInset + 8 },
          heroScrollStyle,
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
            {avatarSource ? (
              <ExpoImage
                source={avatarSource}
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
              {greeting}
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
          accessibilityLabel="Abrir Tu progreso"
          testID="inicio2-open-progress-control"
        >
          <Animated.View style={{ transform: [{ scale: giftScale }] }}>
            <Inicio2LotusStreak />
          </Animated.View>
        </Pressable>
      </RAnimated.View>

      <RAnimated.View
        pointerEvents="box-none"
        style={[styles.inicio2HeroCopy, heroCopyScrollStyle]}
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
      </RAnimated.View>

      <RAnimated.View
        style={[styles.inicio2HeroControls, heroScrollStyle]}
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
      </RAnimated.View>
    </View>
    </GestureDetector>
  );
}

function Inicio2HeroSliderRebuilt({
  topInset,
  focused,
  scrollY,
  giftScale,
  onOpenDrawer,
  onOpenProfile,
}: {
  topInset: number;
  focused: boolean;
  scrollY: SharedValue<number>;
  giftScale: Animated.Value;
  onOpenDrawer: () => void;
  onOpenProfile: () => void;
}) {
  const { user: clerkUser } = useUser();
  const { username } = useUserProfile();
  const greeting = useGreeting();
  const avatarSource = useCurrentUserAvatarSource();
  const sliderRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const activeIndexRef = useRef(0);
  const [dragging, setDragging] = useState(false);
  const slideDrift = useRef(new Animated.Value(0)).current;
  const slideProgress = useSharedValue(0);

  const selectSlide = useCallback((index: number, animated = true) => {
    const boundedIndex = Math.max(0, Math.min(INICIO2_SLIDES.length - 1, index));
    sliderRef.current?.scrollTo({ x: boundedIndex * width, animated });
    if (!animated) {
      activeIndexRef.current = boundedIndex;
      setActiveIndex(boundedIndex);
    }
  }, []);

  useEffect(() => {
    cancelAnimation(slideProgress);
    slideProgress.value = 0;
    if (focused && !dragging) {
      slideProgress.value = withTiming(1, {
        duration: INICIO2_AUTOPLAY_DURATION,
        easing: Easing.linear,
      });
    }
    return () => cancelAnimation(slideProgress);
  }, [activeIndex, dragging, focused, slideProgress]);

  useEffect(() => {
    if (!focused || dragging) return;
    const timer = setTimeout(() => {
      const nextIndex = (activeIndexRef.current + 1) % INICIO2_SLIDES.length;
      selectSlide(nextIndex, nextIndex !== 0);
    }, INICIO2_AUTOPLAY_DURATION);
    return () => clearTimeout(timer);
  }, [activeIndex, dragging, focused, selectSlide]);

  useEffect(() => {
    if (!focused) {
      slideDrift.stopAnimation();
      slideDrift.setValue(0);
      return;
    }
    slideDrift.setValue(0);
    const breath = Animated.loop(
      Animated.sequence([
        Animated.timing(slideDrift, {
          toValue: 1,
          duration: 11_000,
          easing: RNEasing.inOut(RNEasing.sin),
          useNativeDriver: ND,
        }),
        Animated.timing(slideDrift, {
          toValue: 0,
          duration: 11_000,
          easing: RNEasing.inOut(RNEasing.sin),
          useNativeDriver: ND,
        }),
      ]),
    );
    breath.start();
    return () => {
      breath.stop();
      slideDrift.stopAnimation();
      slideDrift.setValue(0);
    };
  }, [activeIndex, focused, slideDrift]);

  const finishNativeSlide = useCallback((x: number) => {
    const nextIndex = Math.max(
      0,
      Math.min(INICIO2_SLIDES.length - 1, Math.round(x / width)),
    );
    activeIndexRef.current = nextIndex;
    setActiveIndex(nextIndex);
    setDragging(false);
  }, []);

  const heroScrollStyle = useAnimatedStyle(() => {
    const y = scrollY.value;
    const translateY = y < 0
      ? Math.max(-INICIO2_HERO_HEIGHT, y)
      : 0;
    return { transform: [{ translateY }] };
  });
  const heroImageStretchStyle = useAnimatedStyle(() => ({
    transformOrigin: "top center",
    transform: [{
      scaleY: 1 + Math.min(
        0.22,
        Math.max(0, (-scrollY.value / INICIO2_HERO_HEIGHT) * 0.35),
      ),
    }],
  }));
  const heroCopyScrollStyle = useAnimatedStyle(() => {
    const y = scrollY.value;
    const translateY = y < 0
      ? Math.max(-INICIO2_HERO_HEIGHT, y)
      : 0;
    return { transform: [{ translateY: translateY + 15 }] };
  });

  const zoom = slideDrift.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.035],
  });
  const driftX = slideDrift.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -6],
  });
  const displayName =
    username
    || clerkUser?.firstName
    || clerkUser?.fullName
    || clerkUser?.username
    || "Explorador";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <View
      style={styles.inicio2Hero}
      testID="inicio2-hero-slider"
      accessibilityLabel={`Diapositiva ${activeIndex + 1} de ${INICIO2_SLIDES.length}`}
    >
      <RAnimated.View
        pointerEvents="box-none"
        style={[StyleSheet.absoluteFill, heroScrollStyle]}
      >
        <RAnimated.View
          pointerEvents="box-none"
          style={[
            StyleSheet.absoluteFill,
            styles.inicio2HeroSliderClip,
            heroImageStretchStyle,
          ]}
        >
          <ScrollView
            ref={sliderRef}
            horizontal
            pagingEnabled
            bounces={false}
            showsHorizontalScrollIndicator={false}
            directionalLockEnabled
            disableIntervalMomentum
            scrollEventThrottle={16}
            decelerationRate="fast"
            onScrollBeginDrag={() => setDragging(true)}
            onScrollEndDrag={(event) => {
              if (!event.nativeEvent.velocity?.x) {
                finishNativeSlide(event.nativeEvent.contentOffset.x);
              }
            }}
            onMomentumScrollEnd={(event) =>
              finishNativeSlide(event.nativeEvent.contentOffset.x)
            }
            style={StyleSheet.absoluteFill}
            contentContainerStyle={{ width: width * INICIO2_SLIDES.length }}
          >
            {INICIO2_SLIDES.map((slide) => (
              <View key={slide.id} style={{ width, height: INICIO2_HERO_HEIGHT }}>
                <Animated.View
                  style={[
                    StyleSheet.absoluteFill,
                    { transform: [{ scale: zoom }, { translateX: driftX }] },
                  ]}
                >
                  <Image
                    source={slide.image}
                    resizeMode="cover"
                    style={styles.inicio2HeroImage}
                  />
                </Animated.View>
              </View>
            ))}
          </ScrollView>
        </RAnimated.View>
      </RAnimated.View>

      <RAnimated.View
        pointerEvents="box-none"
        style={[
          styles.inicio2HeroActions,
          { paddingTop: topInset + 8 },
          heroScrollStyle,
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
            {avatarSource ? (
              <ExpoImage
                source={avatarSource}
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
            <Text style={styles.inicio2HeroGreetingLabel}>{greeting}</Text>
            <Text style={styles.inicio2HeroGreetingName}>{displayName}</Text>
          </Pressable>
        </View>

        <Pressable
          onPress={onOpenProfile}
          onPressIn={() =>
            Animated.spring(giftScale, {
              toValue: 0.84,
              speed: 30,
              bounciness: 0,
              useNativeDriver: ND,
            }).start()
          }
          onPressOut={() =>
            Animated.spring(giftScale, {
              toValue: 1,
              speed: 8,
              bounciness: 16,
              useNativeDriver: ND,
            }).start()
          }
          hitSlop={12}
          style={styles.inicio2HeroLotusButton}
          accessibilityRole="button"
          accessibilityLabel="Abrir Tu progreso"
          testID="inicio2-open-progress-control"
        >
          <Animated.View style={{ transform: [{ scale: giftScale }] }}>
            <Inicio2LotusStreak />
          </Animated.View>
        </Pressable>
      </RAnimated.View>

      <RAnimated.View
        pointerEvents="box-none"
        style={[styles.inicio2HeroCopy, heroCopyScrollStyle]}
      >
        {INICIO2_SLIDES[activeIndex].categoryId ? (
          <View style={styles.inicio2HeroCategory}>
            <SessionCategoryPill
              categoryId={INICIO2_SLIDES[activeIndex].categoryId}
              inline
            />
          </View>
        ) : null}
        <Text style={styles.inicio2HeroTitle}>
          {INICIO2_SLIDES[activeIndex].title}
        </Text>
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
      </RAnimated.View>

      <RAnimated.View
        style={[styles.inicio2HeroControls, heroScrollStyle]}
        accessibilityRole="tablist"
      >
        {INICIO2_SLIDES.map((slide, index) => (
          <Inicio2HeroControl
            key={slide.id}
            active={index === activeIndex}
            progress={slideProgress}
            onPress={() => selectSlide(index)}
            accessibilityState={{ selected: index === activeIndex }}
            accessibilityLabel={`Ver diapositiva ${index + 1}`}
            testID={`inicio2-slide-control-${index + 1}`}
          />
        ))}
      </RAnimated.View>
    </View>
  );
}

const INICIO3_HERO_FALLBACK = require("@/assets/images/inicio2-mistico-1-warm.jpg");
const INICIO3_SLIDES_CACHE_KEY = "inicio3-published-slides-v1";

type Inicio3EffectiveHero = ReturnType<typeof useEffectiveHero>;

function Inicio3HeroMedia({
  active,
  effectiveHero,
  reduceMotion,
}: {
  active: boolean;
  effectiveHero: Inicio3EffectiveHero;
  reduceMotion: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [failedImageUri, setFailedImageUri] = useState<string | number | null>(null);
  const videoUri = effectiveHero.kind === "video" && !videoFailed && !reduceMotion
    ? effectiveHero.uri
    : "";
  const drawerMediaPaused = useDrawerMediaPaused(Boolean(videoUri));
  const heroPlayer = useVideoPlayer(videoUri, (player) => {
    player.loop = true;
    player.muted = true;
  });
  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => setFocused(false);
    }, []),
  );
  useEffect(() => {
    if (!videoUri || !focused || !active || drawerMediaPaused) heroPlayer.pause();
    else heroPlayer.play();
  }, [active, drawerMediaPaused, focused, heroPlayer, videoUri]);
  useEffect(() => {
    setVideoFailed(false);
    setVideoReady(false);
  }, [effectiveHero.uri, effectiveHero.kind]);
  useEffect(() => {
    const subscription = heroPlayer.addListener("statusChange", (event) => {
      if (event.status === "error") {
        setVideoFailed(true);
        setVideoReady(false);
      } else if (event.status === "readyToPlay") {
        setVideoReady(true);
      }
    });
    return () => subscription.remove();
  }, [heroPlayer]);

  const fallbackSource = typeof effectiveHero.fallbackImage === "string"
    ? { uri: effectiveHero.fallbackImage }
    : INICIO3_HERO_FALLBACK;
  const imageSource = effectiveHero.kind === "image" && typeof effectiveHero.uri === "string"
    ? { uri: effectiveHero.uri }
    : fallbackSource;
  const visibleImageSource = failedImageUri === effectiveHero.uri
    ? INICIO3_HERO_FALLBACK
    : imageSource;
  const showVideo = effectiveHero.kind === "video" && !videoFailed && !reduceMotion;

  return (
    <View style={StyleSheet.absoluteFill}>
      <ExpoImage
        source={visibleImageSource}
        placeholder={INICIO3_HERO_FALLBACK}
        cachePolicy="memory-disk"
        onError={() => setFailedImageUri(effectiveHero.uri)}
        contentFit="cover"
        style={styles.inicio2HeroImage}
      />
      {showVideo ? (
        <VideoView
          player={heroPlayer}
          style={[styles.inicio2HeroImage, StyleSheet.absoluteFill, { opacity: videoReady ? 1 : 0 }]}
          contentFit="cover"
          nativeControls={false}
          allowsFullscreen={false}
          allowsPictureInPicture={false}
        />
      ) : null}
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { backgroundColor: `rgba(0,0,0,${effectiveHero.overlayOpacity})` }]}
      />
    </View>
  );
}

function Inicio3HeroTitle({
  title,
  boldRanges,
}: {
  title: string | undefined;
  boldRanges: { start: number; end: number }[];
}) {
  const text = title ?? "Aprendamos a conectar con lo esencial";
  const parts: { text: string; bold: boolean }[] = [];
  let position = 0;
  for (const { start, end } of boldRanges) {
    if (start < position || end <= start || end > text.length) continue;
    if (start > position) parts.push({ text: text.slice(position, start), bold: false });
    parts.push({ text: text.slice(start, end), bold: true });
    position = end;
  }
  if (position < text.length) parts.push({ text: text.slice(position), bold: false });
  return (
    <Text
      style={[
        styles.inicio2HeroTitle,
        styles.inicio2HeroStaticTitle,
        styles.inicio3HeroTitle,
      ]}
    >
      {parts.map((part, index) => part.bold
        ? <Text key={index} style={styles.inicio3HeroTitleBold}>{part.text}</Text>
        : part.text)}
    </Text>
  );
}

type Inicio3PagerSlide = {
  id: string;
  image: any;
  title: string | null;
  description?: string;
  actionLabel?: string;
  categoryId?: string;
  categoryLabel?: string;
  pillLabel?: string;
  sessionId?: string;
  skipDetail?: boolean;
  skipMiniPlayer?: boolean;
  isPremiumSession?: boolean;
  destinationType?: HeroDestinationType;
  destinationId?: string;
  destinationParentId?: string;
  destinationSource?: HeroDestinationSource;
};
type HeroDestinationType =
  | "session"
  | "category"
  | "category-internal"
  | "sleep"
  | "sleep-internal"
  | "sounds"
  | "sounds-internal"
  | "mixer"
  | "topics"
  | "topics-internal";
type HeroDestinationSource = "legacy" | "editorial";

const INICIO3_PAGER_SLIDES: Inicio3PagerSlide[] = [
  { id: "today", image: null, title: null },
];

function Inicio3HeroProgressDot({ active, reduceMotion }: { active: boolean; reduceMotion: boolean }) {
  const opacity = useSharedValue(active ? 0.9 : 0.2);

  useEffect(() => {
    opacity.value = reduceMotion
      ? (active ? 0.9 : 0.2)
      : withTiming(active ? 0.9 : 0.2, { duration: 240 });
  }, [active, opacity, reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <RAnimated.View style={[styles.inicio3HeroProgressDot, animatedStyle]} />;
}

function Inicio3HeroPager({
  top,
  height,
  shadowStyle,
  reduceMotion,
}: {
  top: number;
  height: number;
  shadowStyle: object;
  reduceMotion: boolean;
}) {
  const router = useRouter();
  const { data: configuredHero } = useGetHeroSessionSlides({
    query: { queryKey: ["hero-session-slides"], staleTime: 60_000, refetchOnMount: "always" },
  });
  const [cachedSlides, setCachedSlides] = useState<HeroSessionSlide[] | null>(null);
  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(INICIO3_SLIDES_CACHE_KEY)
      .then((raw) => {
        if (!raw || !mounted) return;
        const parsed: unknown = JSON.parse(raw);
        if (!parsed || typeof parsed !== "object" || !("slides" in parsed) || !Array.isArray(parsed.slides)) return;
        const slides = parsed.slides;
        if (slides.every((slide) => slide && typeof slide === "object"
          && [2, 3, 4].includes(slide.position)
          && typeof slide.title === "string"
          && typeof slide.imageUrl === "string")) {
          setCachedSlides(slides as HeroSessionSlide[]);
        }
      })
      .catch((error) => console.warn("No se pudo leer el caché de slides del hero", error));
    return () => { mounted = false; };
  }, []);
  useEffect(() => {
    if (!configuredHero) return;
    setCachedSlides(configuredHero.slides ?? []);
    AsyncStorage.setItem(INICIO3_SLIDES_CACHE_KEY, JSON.stringify(configuredHero))
      .catch((error) => console.warn("No se pudo guardar el caché de slides del hero", error));
  }, [configuredHero]);
  const { isPremium } = usePremium();
  const { playSession } = usePlayerBrowse();
  const { openCategory } = useCategoryOverlay();
  const { openForSession } = useAmbientalDuration();
  const { openMixer } = useMixerPanel();
  const { version: catalogVersion } = useCatalog();
  const effectiveHero = useEffectiveHero(INICIO3_HERO_FALLBACK);
  const [slideWidth, setSlideWidth] = useState(
    Dimensions.get("window").width - GRID_PAD * 2,
  );
  const [todayMediaActive, setTodayMediaActive] = useState(true);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const settledSlideIndexRef = useRef(0);
  const activeSlideIndexRef = useRef(0);
  const todayMediaActiveRef = useRef(true);
  const slidePressStartXRef = useRef<number | null>(null);
  const onPagerScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const delta = offsetX - settledSlideIndexRef.current * slideWidth;
    const nextIndex = Math.max(0, Math.min(
      pagerSlides.length - 1,
      settledSlideIndexRef.current + (Math.abs(delta) > 1 ? Math.sign(delta) : 0),
    ));
    if (nextIndex !== activeSlideIndexRef.current) {
      activeSlideIndexRef.current = nextIndex;
      setActiveSlideIndex(nextIndex);
    }
    const nextActive = offsetX <= 1;
    if (nextActive === todayMediaActiveRef.current) return;
    todayMediaActiveRef.current = nextActive;
    setTodayMediaActive(nextActive);
  };
  const pagerSlides = useMemo(() => {
    const availableSlides = configuredHero?.slides ?? cachedSlides;
    if (!availableSlides) return INICIO3_PAGER_SLIDES;
    const configuredByPosition = new Map(
      availableSlides.map((slide: HeroSessionSlide) => [slide.position, slide]),
    );
    return [2, 3, 4].reduce<Inicio3PagerSlide[]>((slides, position) => {
      const configured = configuredByPosition.get(position as 2 | 3 | 4);
      const imageUrl = configured?.imageUrl ?? configured?.imageObjectPath;
      if (!configured || configured.enabled === false || !imageUrl) return slides;
      slides.push({
        id: `slide-${configured.position}`,
        image: { uri: absoluteMediaUrl(imageUrl) },
        title: configured.title,
        description: configured.description,
        actionLabel: configured.actionLabel,
        categoryId: configured.categoryId,
        categoryLabel: configured.categoryLabel,
        pillLabel: configured.pillLabel,
        sessionId: configured.sessionId,
        skipDetail: configured.skipDetail,
        skipMiniPlayer: configured.skipMiniPlayer,
        isPremiumSession: configured.isPremium,
        destinationType: configured.destinationType ?? "session",
        destinationId: configured.destinationId,
        destinationParentId: configured.destinationParentId,
        destinationSource: (configured as HeroSessionSlide & {
          destinationSource?: HeroDestinationSource;
        }).destinationSource,
      });
      return slides;
    }, [...INICIO3_PAGER_SLIDES]);
  }, [catalogVersion, configuredHero?.slides, cachedSlides]);
  const openSlide = useCallback((item: (typeof pagerSlides)[number]) => {
    if (item.id === "today") {
      router.push({ pathname: "/inspiracion-diaria", params: { entry: "today" } });
      return;
    }
    const destinationType = item.destinationType ?? "session";
    if (destinationType !== "session") {
      const destinationId = item.destinationId;
      const parentId = item.destinationParentId;
      switch (destinationType) {
        case "category":
          if (destinationId) openCategory(`/category/${encodeURIComponent(destinationId)}`);
          return;
        case "category-internal":
          if (destinationId && parentId) {
            const sourceQuery = item.destinationSource === "editorial" ? "?source=editorial" : "";
            const tagRoute = parentId === "music" || parentId === "musica"
              ? `/music-tag/${encodeURIComponent(destinationId)}${sourceQuery}`
              : `/category-tag/${encodeURIComponent(parentId)}/${encodeURIComponent(destinationId)}${sourceQuery}`;
            openCategory(tagRoute);
          }
          return;
        case "sleep":
          router.push("/(tabs)/descanzo" as never);
          return;
        case "sleep-internal":
          if (destinationId) openCategory(`/sleep-tag/${encodeURIComponent(destinationId)}`);
          return;
        case "sounds":
          router.push("/(tabs)/sonidos" as never);
          return;
        case "sounds-internal":
          if (destinationId) openCategory(`/sound-tag/${encodeURIComponent(destinationId)}`);
          return;
        case "mixer":
          openMixer();
          router.push("/(tabs)/musica" as never);
          return;
        case "topics":
          router.push(
            destinationId
              ? `/tag/${encodeURIComponent(destinationId)}`
              : "/todas-las-tematicas" as never,
          );
          return;
        case "topics-internal":
          if (destinationId && parentId) {
            router.push(buildOtherThemeInternalRoute(parentId, destinationId) as never);
          }
          return;
     }
    }
    // Legacy slides did not have destinationType and remain session links.
    if (!item.sessionId && !item.destinationId) return;
    const sessionId = item.destinationId ?? item.sessionId;
    if (!sessionId) return;
     const session = getSessionById(sessionId);
    if (!session) return;
    if (session.isPremium && !isPremium) {
      openPremiumPlans();
    } else if (openForSession(session)) {
      return;
    } else if (session.skipMiniPlayer) {
      playSession(session);
    } else {
      const skipDetailCategories = ["sonidos-ancestrales", "musica-sonidos"];
      const goToPlayer = session.skipDetail !== false
        && (session.skipDetail === true || skipDetailCategories.includes(session.categoryId ?? ""));
      if (!goToPlayer) {
        openCategory(`/session/${session.id}`);
        return;
      }
      playSession(session);
      router.push("/player" as never);
    }
   }, [isPremium, openCategory, openForSession, openMixer, playSession, router]);
  const handleSlidePress = useCallback((
    item: (typeof pagerSlides)[number],
    event: GestureResponderEvent,
  ) => {
    const startX = slidePressStartXRef.current;
    slidePressStartXRef.current = null;
    if (startX !== null && Math.abs(event.nativeEvent.pageX - startX) > 8) return;
    openSlide(item);
  }, [openSlide]);

  return (
    <RAnimated.View
      style={[
        styles.inicio2HeroStaticImageFrame,
        styles.inicio3HeroStaticImageFrame,
        { top, height, bottom: undefined },
      ]}
      testID="inicio3-hero-pager"
    >
      <RAnimated.View style={[styles.inicio3HeroBackShadow, shadowStyle]}>
        <LinearGradient
          colors={[
            "rgba(0,0,0,0)",
            "rgba(0,0,0,0.14)",
            "rgba(0,0,0,0.14)",
            "rgba(0,0,0,0)",
          ]}
          locations={[0, 0.14, 0.86, 1]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
      </RAnimated.View>
      <View
        style={[StyleSheet.absoluteFill, styles.inicio3HeroImageClip]}
        onLayout={(event) => {
          const measuredWidth = Math.round(event.nativeEvent.layout.width);
          if (measuredWidth > 0 && measuredWidth !== slideWidth) {
            setSlideWidth(measuredWidth);
            settledSlideIndexRef.current = 0;
            activeSlideIndexRef.current = 0;
            setActiveSlideIndex(0);
          }
        }}
      >
        <FlatList
          key={`inicio3-pager-${slideWidth}`}
          data={pagerSlides}
          horizontal
          pagingEnabled
          snapToInterval={slideWidth}
          snapToAlignment="start"
          decelerationRate="fast"
          disableIntervalMomentum
          bounces={false}
          alwaysBounceHorizontal={false}
          overScrollMode="never"
          showsHorizontalScrollIndicator={false}
          onScroll={onPagerScroll}
          onMomentumScrollEnd={(e) => {
            const index = Math.round(e.nativeEvent.contentOffset.x / slideWidth);
            const settledIndex = Math.max(0, Math.min(index, pagerSlides.length - 1));
            settledSlideIndexRef.current = settledIndex;
            activeSlideIndexRef.current = settledIndex;
            setActiveSlideIndex(settledIndex);
          }}
          scrollEventThrottle={16}
          keyExtractor={(item) => item.id}
          getItemLayout={(_, index) => ({ length: slideWidth, offset: slideWidth * index, index })}
          renderItem={({ item, index }) => (
            <View style={[styles.inicio3HeroSlide, { width: slideWidth }]}>
              <Pressable
                style={StyleSheet.absoluteFill}
                onPressIn={(event) => {
                  slidePressStartXRef.current = event.nativeEvent.pageX;
                }}
                onPress={(event) => handleSlidePress(item, event)}
                accessibilityRole="button"
                accessibilityLabel={item.id === "today" ? effectiveHero.title || "Sabiduría diaria" : item.title || "Sabiduría diaria"}
                testID={`inicio3-hero-slide-${index + 1}`}
              >
                {item.id === "today" ? (
                  <Inicio3HeroMedia
                    active={todayMediaActive}
                    effectiveHero={effectiveHero}
                    reduceMotion={reduceMotion}
                  />
                ) : (
                  <View style={StyleSheet.absoluteFill}>
                    <ExpoImage source={item.image} contentFit="cover" cachePolicy="memory-disk" style={styles.inicio2HeroImage} />
                    <View style={styles.inicio3HeroSlideOverlay} />
                  </View>
                )}

                <View style={[StyleSheet.absoluteFill, styles.inicio3HeroCopy]} pointerEvents="box-none">
                  {item.id === "today" ? (
                    <Inicio3HeroTitle title={effectiveHero.title} boldRanges={effectiveHero.titleBoldRanges} />
                  ) : (
                    <>
                      {item.pillLabel ? <View style={styles.inicio2HeroCategory}>
                        <SessionCategoryPill
                          categoryId={item.categoryId ?? ""}
                          label={item.pillLabel}
                          inline
                          style={styles.inicio3HeroCategoryPill}
                          textStyle={styles.inicio3HeroCategoryPillText}
                        />
                      </View> : null}
                      <Text style={[styles.inicio2HeroTitle, styles.inicio2HeroStaticTitle, styles.inicio3HeroTitle]}>
                        {item.title}
                      </Text>
                      {item.description ? (
                        <Text style={styles.inicio3HeroDescription} numberOfLines={3}>
                          {item.description}
                        </Text>
                      ) : null}
                    </>
                  )}
                  <View style={styles.inicio3HeroReadMore}>
                    <Text style={styles.inicio3HeroReadMoreText}>{item.id === "today" ? "Leer más" : item.actionLabel ?? "Escuchar"}</Text>
                  </View>
                </View>
              </Pressable>
            </View>
          )}
        />
        <View style={styles.inicio3HeroProgressContainer} pointerEvents="none">
          <View style={styles.inicio3HeroProgressBackdrop}>
            {pagerSlides.map((slide, index) => (
              <Inicio3HeroProgressDot
                key={slide.id}
                active={index === Math.min(activeSlideIndex, pagerSlides.length - 1)}
                reduceMotion={reduceMotion}
              />
            ))}
          </View>
        </View>
      </View>
      <HeroCornerBorder width={slideWidth} height={height} />
    </RAnimated.View>
  );
}

const Inicio2HeroStatic = React.memo(function Inicio2HeroStatic({
  topInset,
  isPremium,
  giftScale,
  onOpenDrawer,
  onOpenProfile,
  onOpenMoodPicker,
  isInicio3,
  scrollY,
}: {
  topInset: number;
  isPremium: boolean;
  giftScale: Animated.Value;
  onOpenDrawer: () => void;
  onOpenProfile: () => void;
  onOpenMoodPicker: () => void;
  isInicio3?: boolean;
  scrollY?: SharedValue<number>;
}) {
  const router = useRouter();
  const { currentStreak } = useStreak();
  const weekBlink = useRef(new Animated.Value(1)).current;
  const weekPressRunning = useRef(false);
  useEffect(() => () => {
    weekBlink.stopAnimation();
    weekPressRunning.current = false;
  }, [weekBlink]);
  const handleWeekPress = useCallback(() => {
    if (weekPressRunning.current) return;
    weekPressRunning.current = true;
    weekBlink.stopAnimation();
    weekBlink.setValue(1);
    Animated.sequence([
      Animated.timing(weekBlink, { toValue: 0.55, duration: 70, useNativeDriver: true }),
      Animated.timing(weekBlink, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start(({ finished }) => {
      weekPressRunning.current = false;
      if (finished) onOpenProfile();
    });
  }, [weekBlink, onOpenProfile]);
  const { user: clerkUser } = useUser();
  const { username } = useUserProfile();
  const avatarSource = useCurrentUserAvatarSource();
  const displayName =
    username
    || clerkUser?.firstName
    || clerkUser?.fullName
    || clerkUser?.username
    || "Explorador";
  const initial = displayName.charAt(0).toUpperCase();
  const greeting = useGreeting();
  const reduceMotion = useReducedMotion();
  const fallbackScrollY = useSharedValue(0);
  const effectiveScrollY = scrollY ?? fallbackScrollY;
  // El hero reserva su alto en el flujo, así que moverlo desplaza también el contenido siguiente.
  const inicio3WeekShift = 2;
  const inicio3WeekDownshift = 33;
  const inicio3ProfileHeaderLift = 0;
  const inicio3HeroShift = 10 - 70 - 25;
  const inicio3HeroDownshift = 70;
  const inicio3HeroTopTrim = 25 + 80;
  const inicio3HeroHeight =
    (INICIO2_HERO_HEIGHT + 184 - (topInset + 286) - 52 + 60 + 32) / 2 + 60 + 120 + 25 + 15 - 40;
  const inicio3HeroLayoutTop =
    topInset +
    165 -
    INICIO3_VERTICAL_LIFT +
    12 +
    inicio3WeekShift +
    inicio3HeroShift +
    inicio3HeroDownshift;
  const inicio3HeroTop = inicio3HeroLayoutTop - 19;
  const { drawerProgress: identityDrawerProgress } = useDrawerMotion();
  const identityDrawerStyle = useAnimatedStyle(() => ({
    opacity: isInicio3 ? 1 - Math.max(0, Math.min(1, identityDrawerProgress.value)) : 1,
  }));
  const slowHeaderStyle = useAnimatedStyle(() => {
    if (!isInicio3 || reduceMotion) return { transform: [{ translateY: 0 }] };
    const y = Math.max(0, effectiveScrollY.value);
    return { transform: [{ translateY: y * 0.52 }] };
  }, [isInicio3, reduceMotion]);
  const heroShadowStyle = useAnimatedStyle(() => {
    if (!isInicio3) return { opacity: 0 };
    const y = Math.max(0, effectiveScrollY.value);
    return { opacity: reduceMotion ? (y > 1 ? 1 : 0) : Math.min(1, y / 28) };
  }, [isInicio3, reduceMotion]);

  return (
    <View
      style={[
        styles.inicio2Hero,
        isInicio3 && styles.inicio3HeroLowered,
        isInicio3 && {
          height: inicio3HeroLayoutTop + inicio3HeroHeight + 16,
        },
      ]}
      testID="inicio2-hero-static"
      accessibilityLabel="Contenido destacado"
    >
      {isInicio3 ? (
        <Inicio3HeroPager
          top={inicio3HeroTop - 61 + inicio3HeroTopTrim}
          height={inicio3HeroHeight + 59 - inicio3HeroTopTrim}
          shadowStyle={heroShadowStyle}
          reduceMotion={reduceMotion}
        />
      ) : (
        <RAnimated.View
          pointerEvents="none"
          style={[
            styles.inicio2HeroStaticImageFrame,
            {
              top: topInset + 66,
              bottom: 18,
            },
          ]}
        >
          <View style={StyleSheet.absoluteFill}>
            <Image
              source={INICIO3_HERO_FALLBACK}
              resizeMode="cover"
              style={styles.inicio2HeroImage}
            />
          </View>
        </RAnimated.View>
      )}

      <RAnimated.View
        pointerEvents="box-none"
        style={[
          styles.inicio2HeroActions,
          {
            paddingTop:
              topInset
              + 8
              + (isInicio3
                ? 10 - INICIO3_VERTICAL_LIFT - inicio3ProfileHeaderLift
                : 0),
          },
          isInicio3 && styles.inicio3HeroActionsEdge,
          isInicio3 && slowHeaderStyle,
        ]}
      >
        <RAnimated.View
          style={[
            styles.inicio2HeroProfileButton,
            isInicio3 && styles.inicio3HeroProfileLift,
            identityDrawerStyle,
          ]}
        >
          <View>
          <Pressable
            onPress={onOpenDrawer}
            hitSlop={10}
            style={styles.inicio2HeroAvatarButton}
            accessibilityRole="button"
            accessibilityLabel="Abrir menú"
            testID="inicio2-avatar-open-drawer"
          >
            {avatarSource ? (
              <ExpoImage
                source={avatarSource}
                style={styles.inicio2HeroAvatar}
                contentFit="cover"
              />
            ) : (
              <View
                style={styles.inicio2HeroAvatarFallback}
              >
                <Text style={styles.inicio2HeroAvatarInitial}>{initial}</Text>
              </View>
            )}
          </Pressable>
          </View>
          <View
            style={[
              styles.inicio2HeroGreeting,
              isInicio3 && styles.inicio3HeroGreeting,
            ]}
          >
            <Pressable
              onPress={onOpenDrawer}
              hitSlop={isInicio3 ? { top: 8, left: 8, right: 8, bottom: 0 } : 8}
              accessibilityRole="button"
              accessibilityLabel="Abrir menú de perfil"
              testID="inicio2-open-drawer"
            >
            {!isInicio3 && (
              <Text style={styles.inicio2HeroGreetingLabel}>{greeting}</Text>
            )}
            <Text style={[styles.inicio2HeroGreetingName, isInicio3 && styles.inicio3HeroGreetingName]}>{displayName}</Text>
            </Pressable>
            {isInicio3 ? (
              <Pressable
                onPress={onOpenMoodPicker}
                hitSlop={{ top: 0, left: 8, right: 8, bottom: 8 }}
                accessibilityRole="button"
                accessibilityLabel="Abrir registro de ánimo"
                testID="inicio3-open-mood-register"
                style={({ pressed }) => [styles.inicio3MoodRegister, pressed && { opacity: 0.65 }]}
              >
                <Text style={styles.inicio3HeroDecree} numberOfLines={1}>Registro de ánimo</Text>
                <Feather name="chevron-down" size={13} color="#F4F4F4" />
              </Pressable>
            ) : null}
          </View>
        </RAnimated.View>

        <View
          style={[
            styles.inicio3HeroRightActions,
            isInicio3 && {
              position: "absolute",
              top: topInset + 2 - inicio3ProfileHeaderLift,
              right: GRID_PAD,
            },
          ]}
        >
          <Pressable
            onPress={onOpenProfile}
            onPressIn={() =>
              Animated.spring(giftScale, {
                toValue: 0.84,
                speed: 30,
                bounciness: 0,
                useNativeDriver: ND,
              }).start()
            }
            onPressOut={() =>
              Animated.spring(giftScale, {
                toValue: 1,
                speed: 8,
                bounciness: 16,
                useNativeDriver: ND,
              }).start()
            }
            hitSlop={12}
            style={[styles.inicio2HeroLotusButton, isInicio3 && styles.inicio3HeroLotusButton]}
            accessibilityRole="button"
            accessibilityLabel="Abrir Tu progreso"
            testID="inicio2-open-progress-control"
          >
            <Animated.View style={{ transform: [{ scale: giftScale }] }}>
              {isInicio3 ? (
                <View style={[styles.inicio3ProfileLotusContent, styles.inicio3HeroLotusSurface]}>
                  <Text style={styles.inicio3ProfileLotusCount}>{currentStreak}</Text>
                  <MaterialCommunityIcons name="spa" size={21} color="#F9F9F9" />
                </View>
              ) : (
                <Inicio2LotusStreak />
              )}
            </Animated.View>
          </Pressable>
        </View>
      </RAnimated.View>

      {isInicio3 && (
        <>
          <RAnimated.View
            style={[
              styles.inicio3StreakRow,
              { top: topInset + 68 - INICIO3_VERTICAL_LIFT + inicio3WeekShift - 12 + inicio3WeekDownshift },
              slowHeaderStyle,
            ]}
            testID="inicio3-streak-row"
          >
            <Pressable
              onPress={handleWeekPress}
              accessibilityRole="button"
              accessibilityLabel="Abrir Tu progreso semanal"
              testID="inicio3-week-progress-link"
            >
              <Animated.View style={{ opacity: weekBlink }}>
                <StreakWeekRow />
              </Animated.View>
            </Pressable>
          </RAnimated.View>
        </>
      )}

      {!isInicio3 && (
        <Pressable
          onPress={() => router.push({ pathname: "/inspiracion-diaria", params: { entry: "today" } })}
          style={[
            styles.inicio2HeroStaticCopy,
            {
              top: topInset + 66,
              bottom: 18,
            },
          ]}
        >
          <Text style={[
            styles.inicio2HeroTitle,
            styles.inicio2HeroStaticTitle,
          ]}>
            {"Aprendamos a conectar\ncon lo esencial"}
          </Text>
          <View
            style={styles.inicio2HeroStaticActionButton}
            accessibilityRole="button"
            accessibilityLabel="Descubrir"
            testID="inicio2-hero-action"
          >
            <Text style={styles.inicio2HeroActionButtonText}>Descubrir</Text>
          </View>
        </Pressable>
      )}
    </View>
  );
});

function InicioEmotionWidget({
  bottom,
  borderColor,
  plusBackgroundGradient,
  onOpenMoodPicker,
}: {
  bottom: number;
  borderColor?: string;
  plusBackgroundGradient?: readonly [string, string];
  onOpenMoodPicker: () => void;
}) {
  const { activeEvent, emotionWidgetOpacity } = useRoutineCompletionBanner();
  const { enabled, loaded } = useEmojiWidget();
  if (!loaded || !enabled) return null;
  return (
    <Animated.View
      testID="inicio-emotion-widget-fade"
      pointerEvents={activeEvent ? "none" : "auto"}
      accessibilityElementsHidden={!!activeEvent}
      importantForAccessibility={activeEvent ? "no-hide-descendants" : "auto"}
      style={[styles.inicio2HeroEmotionWidget, {
        right: 18,
        bottom: bottom - 4,
        transform: [{ scale: 63 / 67 }],
        opacity: emotionWidgetOpacity,
      }]}
    >
      <Pressable
        onPress={onOpenMoodPicker}
        accessibilityRole="button"
        accessibilityLabel="Agregar emoción"
        testID="inicio-add-emotion"
        style={({ pressed }) => [
          styles.inicio2HeroEmotionPressable,
          {
            backgroundColor: "transparent",
            opacity: pressed ? 0.82 : 1,
            borderWidth: borderColor ? 2 : 0,
            borderColor: borderColor ?? "transparent",
          },
        ]}
      >
        <BlurView
          pointerEvents="none"
          intensity={38}
          tint="light"
          experimentalBlurMethod="dimezisBlurView"
          style={styles.inicio2HeroEmotionGlass}
        />
        <Text style={styles.inicio2HeroEmotionEmoji}>😌</Text>
        <View style={styles.inicio2HeroEmotionAdd}>
          <LinearGradient
            pointerEvents="none"
            colors={plusBackgroundGradient ?? ["#532FA8", "#372FA8"]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <Text style={styles.inicio2HeroEmotionAddText}>+</Text>
        </View>
      </Pressable>
    </Animated.View>
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
export type InicioVariant = "original" | "copy" | "inicio3";

export default function HomeScreen2({
  variant = "original",
}: {
  variant?: InicioVariant;
} = {}) {
  const isInicio2 = variant === "copy" || variant === "inicio3";
  const sectionTitleSize = variant === "inicio3" ? 19 : 17;
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const {
    playSession,
    history,
    favorites,
    sessionProgress,
    getSessionProgress,
  } = usePlayerHome();
  const { previewFlow: previewStreakFlow } = useStreakCelebration();

  const todayKey = useDayRollover();

  const { isPremium } = usePremium();
  const { videos } = useVideos();
  const { resonadores } = useResonadores();
  const { playlists } = useFoldersPlaylists();
  const { presets, loadPreset, openSheet } = useMixerLibrary();
  const { openMixer } = useMixerPanel();
  const { openCategory } = useCategoryOverlay();
  const { openForSession } = useAmbientalDuration();
  const { openSheet: openEscenasSheet } = useAmbientPlayer();
  const { open: openDrawer, moodPickerRequest } = useHomeDrawer();
  const { theme: activeTheme, activeSceneId } = useSceneTheme();
  const handleOpenDrawer = useCallback(() => {
    openDrawer();
  }, [openDrawer]);
  const handleOpenProgress = useCallback(() => {
    router.push("/progreso" as never);
  }, []);
  const handledMoodPickerRequest = useRef(moodPickerRequest);
  useEffect(() => {
    if (variant !== "inicio3" || moodPickerRequest === handledMoodPickerRequest.current) return;
    handledMoodPickerRequest.current = moodPickerRequest;
    setMoodSheetVisible(true);
  }, [moodPickerRequest, variant]);

  const carouselViewAllColor = activeTheme.accent ?? colors.accent;
  // La tab bar flotante usa la misma separación inferior que su propio layout.
  // El widget queda 25 px por encima de la parte superior de esa barra.
  const tabBarBottomOffset =
    Platform.OS === "web" ? 2 : Math.max(3, insets.bottom - 15) - 1;
  const emotionWidgetBottom = tabBarBottomOffset + 68 + 25;
  const cardBg = "rgba(255,255,255,0.1)";
  const durationPillBg = cardBg;
  const recommendationSurfaceBg = cardBg;
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
  const handleOpenMoodPicker = useCallback(() => setMoodSheetVisible(true), []);
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
  }

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

  const { version: catalogVersion } = useCatalog();
  const { session: featuredMoment } =
    useFeaturedMoment();

  const [actionsSession, setActionsSession] = useState<Session | null>(null);
  const [recoOffset, setRecoOffset] = useState(0);
  const [previousDailyRecommendationIds, setPreviousDailyRecommendationIds] =
    useState<string[]>([]);

  const [progresoVisible, setProgresoVisible] = useState(false);
  const { rachaEnabled } = useRacha();
  const { intencionDiariaEnabled, escenasAnimadasEnabled } = useIntencionDiaria();
  const showAnimatedScene = !isInicio2 && !intencionDiariaEnabled && escenasAnimadasEnabled;

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

  // Recomendaciones diarias — selección estable durante el día local.
  // No depende del historial: escuchar una sesión no cambia las otras
  // recomendaciones hasta que cambie la fecha.
  const dailyRecommendationPool = React.useMemo(
    () => SESSIONS.filter((session) => !session.isPlaceholder),
    [catalogVersion],
  );
  const dailyRecommendations = React.useMemo<Session[]>(
    () => selectDailyRecommendations(
      dailyRecommendationPool,
      todayKey,
      recoOffset,
      previousDailyRecommendationIds,
    ),
    [
      dailyRecommendationPool,
      previousDailyRecommendationIds,
      recoOffset,
      todayKey,
    ],
  );
  const commitDailyRecommendations = React.useCallback(() => {
    setPreviousDailyRecommendationIds(
      dailyRecommendations.map((session) => session.id),
    );
    setRecoOffset((offset) => offset + 1);
  }, [dailyRecommendations]);

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
      if (s && s.categoryId !== "ambientales") result.push(s);
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
      openPremiumPlans();
      return;
    }
    if (openForSession(continueSession)) return;
    playSession(continueSession);
    if (!continueSession.skipMiniPlayer) {
      router.push("/player" as never);
    }
  }, [continueLocked, continueSession, openForSession, playSession]);

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

  const filteredListened = listenedRecently;

  const favoriteSessions = React.useMemo<Session[]>(() => {
    return favorites
      .map((id) => getSessionById(id))
      .filter((session): session is Session => session !== undefined)
      .filter((session) => session.categoryId !== "ambientales")
      .slice(0, 10);
  }, [catalogVersion, favorites]);

  const { data: popularData } = useGetPopularSessions(
    { limit: 30 },
    {
      query: {
        queryKey: getGetPopularSessionsQueryKey({ limit: 30 }),
        staleTime: 5 * 60_000,
      },
    },
  );
  const popularSessions = React.useMemo<Session[]>(() => {
    return (popularData?.sessions ?? [])
      .map((session) => getSessionById(session.id))
      .filter(
        (session): session is Session =>
          session !== undefined
          && !session.isPlaceholder
          && session.categoryId !== "ambientales",
      )
      .slice(0, 10);
  }, [catalogVersion, popularData]);


  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, 40);
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const searchOpenRef = useRef(false);
  const scrollYRef = useRef(0);
  const inicio3ScrollY = useSharedValue(0);
  const homeScrollRef = useRef<React.ElementRef<typeof RAnimated.ScrollView>>(null);

  const searchBtnAnim = useRef(new Animated.Value(0)).current;
  const giftScaleAnim = useRef(new Animated.Value(1)).current;

  const updateSearchBtnVisibility = useCallback(() => {
    const shouldShow = scrollYRef.current > 10 || searchOpenRef.current;
    Animated.timing(searchBtnAnim, {
      toValue: shouldShow ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [searchBtnAnim]);

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

      // Scroll-linked: imagen visible en y=0, desaparece a los 280px de scroll
      backdropAnim.setValue(Math.max(0, 1 - y / 280));
    },
    [backdropAnim],
  );
  const handleInicio3Scroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      inicio3ScrollY.value = Math.max(0, event.contentOffset.y);
    },
  });

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
  const homeSearchItems = useMemo(
    () =>
      SESSIONS.map((session) => {
        const author = session.guideId
          ? getGuide(session.guideId).name
          : getArtist(session.artistId).name;
        return {
          id: session.id,
          title: session.title,
          meta: session.categoryLabel,
          subtitle: author,
          searchText: [
            session.title,
            session.categoryLabel,
            session.subtitle ?? "",
            author,
          ].join(" "),
          image: session.image,
          duration: session.duration,
        };
      }),
    [catalogVersion],
  );

  const handleSelectSearchResult = useCallback(
    (s: Session) => {
      closeSearch();
      if (s.isPremium && !isPremium) {
        openPremiumPlans();
        return;
      }
      if (openForSession(s)) return;
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
    [closeSearch, isPremium, openCategory, openForSession, playSession],
  );
  // Compartido por los carruseles: mantiene estables las props de sus listas
  // virtualizadas cuando el reproductor actualiza progreso u otro estado de Inicio.
  const handleSessionCarouselPress = useCallback(
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
  const handleViewAllRecent = useCallback(() => {
    router.push("/historial" as never);
  }, []);
  const handleViewAllFavorites = useCallback(() => {
    openCategory("/favoritos-todos");
  }, [openCategory]);
  const inicio2SessionCarouselStyle = useMemo(
    () => ({ marginTop: 0, marginBottom: INICIO2_SECTION_GAP, paddingHorizontal: GRID_PAD }),
    [],
  );
  const originalSessionCarouselStyle = useMemo(
    () => ({ marginBottom: SECTION_GAP, paddingHorizontal: GRID_PAD }),
    [],
  );

  return (
    <DrawerEdgeGesture enabled={variant === "inicio3" && tabFocused && !immersive} top={topPad + 56}>
    <View
      testID={`inicio-${variant}`}
      style={[styles.root, { backgroundColor: activeTheme.gradient[activeTheme.gradient.length - 1] as string }]}
    >
      {/* ── Fondo degradado del tema ── */}
      <SceneThemeBackground />

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
            onPress={handleOpenDrawer}
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

        {/* Derecha: bandeja de notificaciones */}
        <Pressable
          hitSlop={8}
          style={({ pressed }) => [styles.homeNotificationsButton, { opacity: pressed ? 0.8 : 1, marginRight: 10 }]}
          onPress={() => router.push("/notificaciones" as never)}
          accessibilityRole="button"
          accessibilityLabel="Abrir notificaciones"
        >
          {Platform.OS === "ios" ? (
            <SymbolView name="bell.fill" tintColor="#FFFFFF" size={21} />
          ) : (
            <Feather name="bell" size={21} color="#FFFFFF" />
          )}
        </Pressable>
      </View>
      )}

      <RAnimated.ScrollView
        ref={homeScrollRef}
        style={styles.scroll}
        contentContainerStyle={{
          paddingBottom: 160 + bottomPad,
          paddingTop: isInicio2 ? 0 : topPad + 38,
        }}
        showsVerticalScrollIndicator={false}
        onScroll={
          variant === "inicio3"
            ? handleInicio3Scroll
            : handleMainScroll
        }
        keyboardShouldPersistTaps="handled"
        scrollEventThrottle={16}
      >
        {/* ── Slider místico Inicio 2 / escena o intención del Inicio original ── */}
        {isInicio2 ? (
          <>
            <Inicio2HeroStatic
              topInset={topPad}
              isPremium={isPremium}
              giftScale={giftScaleAnim}
              onOpenDrawer={handleOpenDrawer}
              onOpenProfile={handleOpenProgress}
              onOpenMoodPicker={handleOpenMoodPicker}
              isInicio3={variant === "inicio3"}
              scrollY={inicio3ScrollY}
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
        ) : null}

        {variant === "inicio3" && (
          <DailyRecommendationsSection
            sessions={dailyRecommendations}
            dayKey={todayKey}
            style={{ paddingHorizontal: GRID_PAD, marginTop: -6 }}
            inicio3Compact
            onRefreshRecommendations={commitDailyRecommendations}
          />
        )}

        <View style={isInicio2 && styles.inicio2ContentPanel}>
        {isInicio2 && variant !== "inicio3" && (
          <View
            style={[
              styles.inicio2ToolsSection,
              { marginTop: 21, marginBottom: INICIO2_SECTION_GAP - 11 },
            ]}
          >
            <ToolsGrid onOpenMoodPicker={() => setMoodSheetVisible(true)} />
          </View>
        )}
        {isInicio2 && variant !== "inicio3" && (
          <DailyRecommendationsSection
            sessions={dailyRecommendations}
            dayKey={todayKey}
            style={{ paddingHorizontal: GRID_PAD, marginTop: -11 }}
            onRefreshRecommendations={commitDailyRecommendations}
          />
        )}
        {isInicio2 && (
          <View
            style={{
              paddingHorizontal: GRID_PAD,
              marginTop: variant === "inicio3" ? -8 : 0,
              marginBottom: INICIO2_SECTION_GAP,
            }}
          >
            <Text style={[styles.sectionTitle, { fontSize: sectionTitleSize, marginBottom: 17 }]}>
              Para este momento
            </Text>
            {featuredMoment ? (
            <Pressable
              onPress={() => {
                if (featuredMoment.isPremium && !isPremium) {
                  openPremiumPlans();
                  return;
                }
                if (openForSession(featuredMoment)) return;
                if (featuredMoment.skipMiniPlayer) {
                  playSession(featuredMoment);
                  return;
                }
                if (featuredMoment.skipDetail) {
                  playSession(featuredMoment);
                  router.push("/player" as never);
                  return;
                }
                openCategory(`/session/${featuredMoment.id}`);
              }}
              accessibilityRole="button"
              accessibilityLabel={featuredMoment.title}
              style={({ pressed }) => ({ opacity: pressed ? 0.88 : 1 })}
            >
              <View style={styles.heroImageContainer}>
                <ExpoImage
                  source={featuredMoment.image}
                  style={styles.heroImage}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                />
                <PremiumBadge
                  session={featuredMoment}
                  size={22}
                  top={16}
                  left={16}
                />
                <SessionDurationBadge
                  label={featuredMoment.durationLabel}
                  showClock
                  whiteGlass
                  style={styles.featuredMomentDuration}
                />
              </View>
              {(() => {
                const guideIds = featuredMoment.guideIds?.length
                  ? featuredMoment.guideIds
                  : featuredMoment.guideId
                    ? [featuredMoment.guideId]
                    : [];
                const guide = guideIds
                  .map((id) => resonadores.find((profile) => profile.id === id) ?? getGuide(id))
                  .find(Boolean);
                const artist = featuredMoment.artistId ? getArtist(featuredMoment.artistId) : undefined;
                const defaultGuide = getGuide();
                const authorName = guide?.name ?? artist?.name ?? defaultGuide.name;
                const authorPhoto = guide?.photo ?? artist?.photo ?? defaultGuide.photo;
                return (
                  <View style={{ marginTop: 12, flexDirection: "row", alignItems: "center", gap: 10 }}>
                    {authorPhoto ? (
                      <ExpoImage
                        source={authorPhoto}
                        style={styles.heroAvatar}
                        contentFit="cover"
                        cachePolicy="memory-disk"
                      />
                    ) : (
                      <View style={[styles.heroAvatar, styles.heroAvatarFallback]}>
                        <Text style={styles.heroAvatarInitial}>
                          {authorName.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.heroMetaText,
                          { color: activeTheme.accent ?? colors.accent },
                        ]}
                        numberOfLines={1}
                      >
                        {featuredMoment.categoryLabel}
                      </Text>
                      <Text style={styles.heroTitle} numberOfLines={2}>{featuredMoment.title}</Text>
                      <Text
                        style={[
                          styles.heroAuthor,
                          { color: activeTheme.accent ?? colors.accent },
                        ]}
                        numberOfLines={1}
                      >
                        {authorName}
                      </Text>
                    </View>
                  </View>
                );
              })()}
            </Pressable>
            ) : null}
          </View>
        )}
        {variant === "inicio3" && isInicio2 && (
          <View style={styles.inicio3SectionSpacer} />
        )}
        {isInicio2 && (
          <SessionCarousel
            title="Sesiones recientes"
            sessions={filteredListened}
            isPremium={isPremium}
            onPress={handleSessionCarouselPress}
            style={inicio2SessionCarouselStyle}
            trailingPeek={20}
            cardWidth={variant === "inicio3" ? INICIO3_SESSION_CARD_WIDTH : undefined}
            allowOversizedCardWidth={variant === "inicio3"}
            squareTitleOnlyBelow
            sleepBelowMetadataStyle={variant === "inicio3" ? { marginTop: 5 } : undefined}
            titleSize={sectionTitleSize}
            titleSpacing={17}
            onViewAll={handleViewAllRecent}
            viewAllColor={carouselViewAllColor}
            eagerRender
          />
        )}
        {variant === "inicio3" && <View style={styles.inicio3SectionSpacer} />}
        {isInicio2 && (
          <SessionCarousel
            title="Mis favoritos"
            sessions={favoriteSessions}
            isPremium={isPremium}
            onPress={handleSessionCarouselPress}
            style={inicio2SessionCarouselStyle}
            trailingPeek={20}
            cardWidth={variant === "inicio3" ? INICIO3_SESSION_CARD_WIDTH : undefined}
            allowOversizedCardWidth={variant === "inicio3"}
            squareTitleAuthorBelow
            sleepBelowMetadataStyle={variant === "inicio3" ? { marginTop: 5 } : undefined}
            categoryGridPresentation
            whiteMetadataGlass
            showDurationClock
            durationBadgeStyle={{ top: "auto", bottom: 8, left: 8 }}
            titleSize={sectionTitleSize}
            titleSpacing={17}
            onViewAll={handleViewAllFavorites}
            viewAllColor={carouselViewAllColor}
          />
        )}
        {variant === "inicio3" && <View style={styles.inicio3SectionSpacer} />}
        {variant === "inicio3" && videos.length > 0 && (
          <View
            style={{
              marginHorizontal: GRID_PAD,
              marginBottom: INICIO2_SECTION_GAP,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 17,
              }}
            >
              <Text style={[styles.sectionTitle, { fontSize: sectionTitleSize, marginBottom: 0 }]}>
                Videos destacados
              </Text>
              <Pressable hitSlop={8} onPress={() => openCategory("/videos")}>
                <Text
                  style={{
                    fontFamily: "Manrope",
                    fontSize: 13,
                    fontWeight: "600",
                    color: carouselViewAllColor,
                  }}
                >
                  Ver todos
                </Text>
              </Pressable>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginHorizontal: -GRID_PAD }}
              contentContainerStyle={{
                paddingHorizontal: GRID_PAD,
                gap: CONTENT_CAROUSEL_GAP,
              }}
            >
              {videos.slice(0, 8).map((video) => (
                <VideoCard
                  key={video.id}
                  video={video}
                  width={INICIO3_VIDEO_CARD_WIDTH}
                  titleFontSize={14}
                  whiteDurationGlass
                />
              ))}
            </ScrollView>
          </View>
        )}
        {variant === "inicio3" && videos.length > 0 && (
          <View style={styles.inicio3SectionSpacer} />
        )}
        {isInicio2 && SHOW_CONTINUE_LISTENING && continueSession && (
          <View style={styles.continueSection} testID="inicio2-continue-listening">
            <Text style={[styles.sectionTitle, styles.continueSectionTitle, { fontSize: sectionTitleSize }]}>
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
                <Text style={[styles.continueKicker, { color: CARD_TEXT_ABOVE }]}>
                  {continueProgress > 0
                    ? `RETOMA · ${Math.round(continueProgress * 100)}% ESCUCHADO`
                    : "RETOMA DONDE LO DEJASTE"}
                </Text>
                <Text style={[styles.continueTitle, { color: colors.foreground }]} numberOfLines={2}>
                  {continueSession.title}
                </Text>
                <Text style={[styles.continueSub, { color: CARD_TEXT_BELOW }]} numberOfLines={1}>
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
        {variant === "inicio3" && SHOW_CONTINUE_LISTENING && continueSession && (
          <View style={styles.inicio3SectionSpacer} />
        )}
        {isInicio2 && variant !== "inicio3" && (
          <View style={{ paddingTop: INICIO2_SECTION_GAP }}>
            <SessionCarousel
              title="Populares"
              sessions={popularSessions}
              isPremium={isPremium}
              onPress={handleSessionCarouselPress}
              style={inicio2SessionCarouselStyle}
              presentation="editorial"
              disableAmbientalVariant
              sleepMetadataBelow
              categoryGridPresentation
              showCategoryLabelBelow
              whiteMetadataGlass
              showDurationClock
              sleepBelowMetadataStyle={{ marginTop: 3, transform: [{ translateX: 3 }] }}
              trailingPeek={20}
              cardBorderRadius={16}
              titleSize={17}
              hideCategoryAboveTitle
              durationBadgeStyle={{ top: "auto", bottom: 8, left: 8 }}
            />
          </View>
        )}
        {isInicio2 && (
          <View style={variant === "inicio3" ? styles.inicio3QuoteDividerWrap : undefined}>
            <DailyWisdomCard
              backgroundColor="rgba(0,0,0,0.25)"
              decorativeGradient={variant === "inicio3"}
              style={variant === "inicio3" ? { marginBottom: INICIO3_QUOTE_SECTION_GAP } : undefined}
            />
            {variant === "inicio3" && (
              <View
                pointerEvents="none"
                style={[styles.inicio3QuoteDivider, { bottom: (INICIO3_QUOTE_SECTION_GAP + (isPremium ? 0 : 20)) / 2 }]}
              />
            )}
          </View>
        )}
        {isInicio2 && (
          <AlmaCommunitySection
            titleSize={variant === "inicio3" ? 19 : 17}
            style={variant === "inicio3" ? { marginBottom: 28 + INICIO3_SECTION_EXTRA_GAP } : undefined}
          />
        )}
        {/* ── BANNER PREMIUM ── */}
        <View
          style={{
            marginTop: (variant === "inicio3" ? 0 : -25) - (isPremium ? 17 : 20),
            marginBottom: isInicio2
              ? INICIO2_SECTION_GAP + (variant === "inicio3" ? INICIO3_SECTION_EXTRA_GAP : 0)
              : SECTION_GAP,
          }}
        >
          <PremiumBanner />
        </View>
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
              <DurationExplorePill
                key={slot.label}
                onPress={() => openCategory(`/busqueda?tiempo=${encodeURIComponent(slot.label)}`)}
                label={slot.label}
                backgroundColor={durationPillBg}
              />
            ))}
          </ScrollView>
          </View>
        )}

        {/* ── ESCUCHADAS RECIENTEMENTE ── */}
        {!isInicio2 && (
          <SessionCarousel
            title="Sesiones recientes"
            sessions={filteredListened}
            isPremium={isPremium}
            onPress={handleSessionCarouselPress}
            style={originalSessionCarouselStyle}
            titleOffset={10}
            presentation="editorial"
            hideCategoryAboveTitle
            titleSize={17}
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
        </View>
      </RAnimated.ScrollView>

      <InicioEmotionWidget
        bottom={emotionWidgetBottom}
        plusBackgroundGradient={activeTheme.id === "natural" ? NATURAL_WIDGET_PLUS_GRADIENT : activeTheme.id === "cloudy" ? CLOUDY_WIDGET_PLUS_GRADIENT : undefined}
        onOpenMoodPicker={handleOpenMoodPicker}
      />
      </Animated.View>{/* fin contenido desvanecible */}

      <EscenasAnimSheet
        visible={!isInicio2 && animSheetOpen}
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

      <ContextSearchModal
        visible={searchOpen}
        onClose={closeSearch}
        items={homeSearchItems}
        placeholder="Buscar en Inicio..."
        emptyTitle="Encuentra lo que necesitas"
        emptySubtitle="Busca sesiones, sonidos y prácticas"
        scope="discover"
        onSelect={(item) => {
          const session = SESSIONS.find((candidate) => candidate.id === item.id);
          if (!session) return false;
          handleSelectSearchResult(session);
          return true;
        }}
      />

      {/* SceneAnimationModal lives at root (_layout.tsx) via SelectedSceneContext */}

      {/* Apertura progresiva del drawer desde el borde izquierdo seguro, bajo el header. */}

      {/* ── Modo inmersivo — animación centrada, fade in/out + pinch zoom ── */}
      {!isInicio2 && headerScene && immersiveRendered && tabFocused && (
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
    </DrawerEdgeGesture>
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
    backgroundColor: "transparent",
  },
  inicio3HeroLowered: {
    marginTop: 20,
  },
  inicio2ContentPanel: {
    position: "relative",
    zIndex: 1,
    elevation: 2,
    marginTop: -1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: "transparent",
  },
  inicio2ToolsSection: {
    marginBottom: INICIO2_SECTION_GAP,
    paddingHorizontal: GRID_PAD,
  },
  inicio2HeroImageLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  inicio2HeroSliderClip: {
    overflow: "hidden",
  },
  inicio2HeroStaticImageFrame: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 18,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
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
  inicio3HeroActionsEdge: {
    paddingHorizontal: GRID_PAD,
  },
  inicio2HeroProfileButton: {
    maxWidth: "76%",
    flexDirection: "row",
    alignItems: "center",
  },
  inicio3HeroProfileLift: {
    transform: [{ translateX: -2 }, { translateY: -4 }],
  },
  inicio2HeroAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  inicio2HeroAvatarButton: {
    position: "relative",
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
  inicio3HeroGreeting: {
    transform: [{ translateY: -1 }],
  },
  inicio2HeroGreetingLabel: {
    color: "#F4F4F4",
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
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "700",
    textShadowColor: "rgba(0,0,0,0.65)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  inicio3HeroGreetingName: {
    fontSize: 18,
    lineHeight: 23,
  },
  inicio3HeroDecree: {
    color: "#F4F4F4",
    fontFamily: "Manrope",
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "600",
    letterSpacing: 0.2,
    textShadowColor: "rgba(0,0,0,0.55)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  inicio3MoodRegister: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 5,
  },
  inicio2HeroLotusButton: {
    width: 62,
    height: 43,
    borderRadius: 21.5,
    alignItems: "center",
    justifyContent: "center",
  },
  inicio3HeroLotusButton: {
    width: "auto",
    minWidth: 62,
    alignItems: "flex-end",
    transform: [{ translateY: -2 }],
  },
  inicio2HeroLotusContent: {
    width: 62,
    height: 43,
    borderRadius: 21.5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  inicio3HeroLotusSurface: {
    height: 39,
    borderRadius: 19.5,
    backgroundColor: "rgba(0,0,0,0.16)",
    borderWidth: 0,
    borderColor: "transparent",
  },
  inicio3HeroRightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  inicio3ProfileLotusContent: {
    flexDirection: "row",
    gap: 6,
    minWidth: 62,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  inicio3ProfileLotusCount: {
    color: "#FFFFFF",
    fontFamily: "Manrope",
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
    transform: [{ translateY: 0.5 }],
  },
  inicio2HeroLotusCount: {
    minWidth: 13,
    color: "#FFFFFF",
    fontFamily: "Manrope",
    fontSize: 15,
    lineHeight: 18,
    fontWeight: "800",
    textAlign: "center",
    transform: [{ translateY: 2 }],
    textShadowColor: "rgba(0,0,0,0.9)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  inicio2HeroEmotionWidget: {
    width: 67,
    height: 67,
    borderRadius: 33.5,
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    zIndex: 25,
    elevation: 18,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
  },
  inicio2HeroEmotionEmoji: {
    fontSize: 31,
    lineHeight: 38,
  },
  inicio2HeroEmotionPressable: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 33.5,
    alignItems: "center",
    justifyContent: "center",
  },
  inicio2HeroEmotionGlass: {
    ...StyleSheet.absoluteFillObject,
    // Compensar la escala del widget: reducir solo el fondo 4 px visibles.
    top: 2 / (63 / 67),
    right: 2 / (63 / 67),
    bottom: 2 / (63 / 67),
    left: 2 / (63 / 67),
    borderRadius: (67 - 4 / (63 / 67)) / 2,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.10)",
  },
  inicio2HeroEmotionAdd: {
    position: "absolute",
    top: -4 + 1 / (63 / 67),
    left: -7 + 2 / (63 / 67),
    width: 28 - 4 / (63 / 67),
    height: 28 - 4 / (63 / 67),
    borderRadius: 14 - 2 / (63 / 67),
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  inicio2HeroEmotionAddText: {
    color: "#FFFFFF",
    fontFamily: "Manrope",
    fontSize: 22 - 4 / (63 / 67),
    lineHeight: 25 - 4 / (63 / 67),
    fontWeight: "600",
    transform: [{ translateY: 2 }],
  },
  inicio3HeroLotusCount: {
    color: "#F9F9F9",
  },
  inicioViewAllText: {
    color: "#067D74",
    fontFamily: "Manrope",
    fontSize: 13,
    fontWeight: "600",
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
  inicio2HeroStaticCopy: {
    position: "absolute",
    left: GRID_PAD,
    right: GRID_PAD,
    bottom: 18,
    zIndex: 10,
    alignItems: "flex-start",
    justifyContent: "center",
    paddingHorizontal: 0,
    paddingVertical: 20,
  },
  inicio2HeroTitle: {
    fontFamily: "Manrope",
    fontSize: 19,
    fontWeight: "700",
    lineHeight: 25,
    color: "#FFFFFF",
    textAlign: "left",
    textShadowColor: "rgba(0,0,0,0.62)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 5,
    transform: [{ translateY: 6 }],
  },
  inicio2HeroStaticTitle: {
    maxWidth: "76%",
    fontSize: 21,
    lineHeight: 26,
    textAlign: "left",
    transform: [],
  },
  inicio3StreakRow: {
    position: "absolute",
    left: GRID_PAD,
    right: GRID_PAD,
    zIndex: 12,
  },
  inicio3HeroStaticImageFrame: {
    left: GRID_PAD,
    right: GRID_PAD,
    borderTopLeftRadius: 21,
    borderTopRightRadius: 21,
    borderBottomLeftRadius: 21,
    borderBottomRightRadius: 21,
    overflow: "visible",
    zIndex: 20,
  },
  inicio3HeroImageClip: {
    borderRadius: 21,
    overflow: "hidden",
  },
  inicio3HeroBackShadow: {
    position: "absolute",
    top: -3,
    left: 5,
    right: 5,
    height: 42,
  },
  inicio3HeroCopy: {
    zIndex: 30,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  inicio3HeroTitle: {
    maxWidth: "86%",
    textAlign: "center",
    fontSize: 21,
    lineHeight: 33,
    fontWeight: "600",
  },
  inicio3HeroTitleBold: {
    fontWeight: "800",
  },
  inicio3HeroDescription: {
    maxWidth: "86%",
    marginTop: 8,
    color: "rgba(249,249,249,0.9)",
    fontFamily: "Manrope",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "500",
    textAlign: "center",
  },
  inicio3HeroReadMore: {
    alignSelf: "center",
    marginTop: 28,
    paddingVertical: 5,
    paddingHorizontal: 19.5,
    borderRadius: 24,
    backgroundColor: "#F9F9F9",
    overflow: "hidden",
  },
  inicio3HeroReadMoreText: {
    color: "#060A0F",
    fontFamily: "Manrope",
    fontSize: 12,
    fontWeight: "600",
  },
  inicio3HeroProgressContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 14,
    flexDirection: "row",
    justifyContent: "center",
    zIndex: 40,
  },
  inicio3HeroProgressBackdrop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  inicio3HeroProgressDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: "#FFF",
  },
  inicio3HeroSlide: {
    height: "100%",
    overflow: "hidden",
  },
  inicio3HeroSlideOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  inicio3HeroCategoryPillText: {
    fontSize: 9,
    fontWeight: "700",
  },
  inicio3HeroCategoryPill: {
    minHeight: 27,
    paddingLeft: 13,
    paddingRight: 13,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
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
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
    transform: [{ translateY: 15 }],
  },
  inicio2HeroStaticActionButton: {
    marginTop: 14,
    minWidth: 104,
    paddingHorizontal: 18,
    paddingVertical: 4,
    transform: [],
  },
  inicio2HeroActionButtonText: {
    fontFamily: "Manrope",
    fontSize: 13,
    fontWeight: "700",
    color: "#0D0A1E",
    textAlign: "center",
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
  homeNotificationsButton: {
    width: 43,
    height: 43,
    borderRadius: 21.5,
    borderWidth: 0,
    borderColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.16)",
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
    color: "#F4F4F4",
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
    backgroundColor: SECTION_DIVIDER_COLOR,
  },
  inicio3SectionSpacer: {
    opacity: 0,
    height: StyleSheet.hairlineWidth,
    marginHorizontal: GRID_PAD,
    marginTop: -24.5,
    marginBottom: 23.5 + INICIO3_SECTION_EXTRA_GAP,
    backgroundColor: SECTION_DIVIDER_COLOR,
  },
  inicio3QuoteDividerWrap: {
    position: "relative",
    // The preceding carousel/divider already supplies 53 - 1 + 5px and a hairline.
    // Add only the difference to the shared quote gap, including when videos are absent.
    paddingTop: SECTION_GAP - INICIO2_SECTION_GAP + 1,
  },
  inicio3QuoteDivider: {
    opacity: 0,
    position: "absolute",
    left: GRID_PAD,
    right: GRID_PAD,
    height: StyleSheet.hairlineWidth,
    backgroundColor: SECTION_DIVIDER_COLOR,
  },
  inicio3StandaloneDivider: {
    opacity: 0,
    height: StyleSheet.hairlineWidth,
    marginHorizontal: GRID_PAD,
    marginTop: 26,
    marginBottom: 26,
    backgroundColor: SECTION_DIVIDER_COLOR,
  },
  inicio3LowerSectionDivider: {
    opacity: 0,
    height: StyleSheet.hairlineWidth,
    marginHorizontal: GRID_PAD,
    marginTop: -22,
    marginBottom: 31,
    backgroundColor: SECTION_DIVIDER_COLOR,
  },
  sectionRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginBottom: 0,
  },
  sectionTitle: { fontFamily: "Manrope", fontSize: 17, fontWeight: "700", letterSpacing: 0.3, marginBottom: 17, color: "#FBFBFB" },
  inicio2SectionTitle: { fontSize: 17, marginBottom: 17 },
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
    backgroundColor: "rgba(181,211,255,0.057)",
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
  featuredMomentDuration: {
    position: "absolute",
    left: 12,
    bottom: 12,
  },
  heroMetaText: { fontFamily: "Manrope", fontSize: 11, lineHeight: 14, color: "#F4F4F4", marginBottom: 6 },
  heroTitle: { fontFamily: "Manrope", fontSize: 15, fontWeight: "600", lineHeight: 18, color: "#FBFBFB", marginBottom: 4 },
  heroAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: "rgba(181,211,255,0.057)" },
  heroAvatarFallback: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(190,150,80,0.28)",
  },
  heroAvatarInitial: {
    color: "#F9F9F9",
    fontFamily: "Manrope",
    fontSize: 17,
    fontWeight: "700",
  },
  heroAuthor: { fontFamily: "Manrope", fontSize: 11, color: "#F4F4F4", marginTop: 2 },
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
  durationPillPressable: {
    borderRadius: 20,
  },
  durPill: {
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 10,
    minWidth: 80,
    height: 42,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  inicio2DurPill: {
    borderRadius: 10,
    width: INICIO2_DURATION_PILL_WIDTH,
    minWidth: INICIO2_DURATION_PILL_WIDTH,
    height: 44,
    borderWidth: 0,
  },
  inicio2DurPillRow: {
    gap: INICIO2_DURATION_PILL_GAP,
    paddingRight: GRID_PAD,
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
  const { openForSession } = useAmbientalDuration();
  const showRecommendedSection = false;
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

      {showRecommendedSection && (
        <>
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
                      openPremiumPlans();
                      return;
                    }
                    if (openForSession(session)) return;
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
      )}
    </>
  );
}
