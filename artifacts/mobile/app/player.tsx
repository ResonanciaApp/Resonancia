import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Image as ExpoImage } from "expo-image";
import { BLUR_PLACEHOLDER, IMAGE_TRANSITION } from "@/constants/imagePlaceholder";
import {
  Dimensions,
  LayoutChangeEvent,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
} from "react-native";
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { usePlayer } from "@/context/PlayerContext";
import { usePremium } from "@/context/PremiumContext";
import { getNatureSounds } from "@/config/nature-base-map";
import Svg, { Path, Rect } from "react-native-svg";
import { getArtist } from "@/data/artists";
import { getGuide } from "@/data/guides";
import { useColors } from "@/hooks/useColors";
import { FREE_TIMER_MAX_MINUTES, showPremiumGate } from "@/lib/premiumGate";
import { useImageDominantColor } from "@/lib/useImageDominantColor";

const { width, height: SCREEN_HEIGHT } = Dimensions.get("window");
const HERO_HEIGHT = SCREEN_HEIGHT * 0.63 + 35;
const RATINGS_KEY = "@resonance_ratings";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function PlayerScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const {
    currentSession,
    isPlaying,
    isLoading,
    progress,
    elapsed,
    actualDurationSeconds,
    pauseResume,
    stop,
    isFavorite,
    toggleFavorite,
    seekTo,
    sleepTimerRemaining,
    setSleepTimer,
    hasVoiceTrack,
    voiceVolume,
    setVoiceVolume,
    hasAmbientTrack,
    ambientVolume,
    setAmbientVolume,
  } = usePlayer();

  // Refs para sliders y barra de progreso
  const voiceTrackWidth = useRef(0);
  const voiceTrackPageX = useRef(0);
  const voiceTrackRef = useRef<View>(null);
  const ambientTrackWidth = useRef(0);
  const ambientTrackPageX = useRef(0);
  const ambientTrackRef = useRef<View>(null);
  const progressBarRef = useRef<View>(null);
  const progressBarPageX = useRef(0);
  const isSeekingRef = useRef(false);
  const progressShared = useSharedValue(0);
  const progressBarWidthShared = useSharedValue(0);

  const [selectedTimerMinutes, setSelectedTimerMinutes] = useState<number | null>(null);
  const [rating, setRating] = useState(0);
  const [repeatMode, setRepeatMode] = useState(false);

  // Ken Burns — zoom suave mientras reproduce
  const kenBurns = useSharedValue(1);
  useEffect(() => {
    if (isPlaying) {
      kenBurns.value = withRepeat(
        withTiming(1.07, { duration: 28000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    } else {
      cancelAnimation(kenBurns);
      kenBurns.value = withTiming(1, { duration: 2000, easing: Easing.out(Easing.ease) });
    }
    return () => cancelAnimation(kenBurns);
  }, [isPlaying]);

  const kenBurnsStyle = useAnimatedStyle(() => ({
    transform: [{ scale: kenBurns.value }],
  }));

  useEffect(() => {
    const sid = currentSession?.id;
    if (!sid) return;
    AsyncStorage.getItem(RATINGS_KEY).then((val) => {
      if (!val) { setRating(0); return; }
      const map: Record<string, number> = JSON.parse(val);
      setRating(map[sid] ?? 0);
    });
  }, [currentSession?.id]);

  const handleRate = useCallback(async (stars: number) => {
    const sid = currentSession?.id;
    if (!sid) return;
    setRating(stars);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const val = await AsyncStorage.getItem(RATINGS_KEY);
    const map: Record<string, number> = val ? JSON.parse(val) : {};
    map[sid] = stars;
    await AsyncStorage.setItem(RATINGS_KEY, JSON.stringify(map));
  }, [currentSession?.id]);

  const handleVoiceGrant = useCallback((e: GestureResponderEvent) => {
    voiceTrackRef.current?.measure((_x, _y, _w, _h, px) => {
      voiceTrackPageX.current = px;
      const vol = Math.max(0, Math.min(1, (e.nativeEvent.pageX - px) / voiceTrackWidth.current));
      setVoiceVolume(vol);
    });
  }, [setVoiceVolume]);

  const handleVoiceMove = useCallback((e: GestureResponderEvent) => {
    const vol = Math.max(0, Math.min(1, (e.nativeEvent.pageX - voiceTrackPageX.current) / voiceTrackWidth.current));
    setVoiceVolume(vol);
  }, [setVoiceVolume]);

  const handleAmbientGrant = useCallback((e: GestureResponderEvent) => {
    ambientTrackRef.current?.measure((_x, _y, _w, _h, px) => {
      ambientTrackPageX.current = px;
      const vol = Math.max(0, Math.min(1, (e.nativeEvent.pageX - px) / ambientTrackWidth.current));
      setAmbientVolume(vol);
    });
  }, [setAmbientVolume]);

  const handleAmbientMove = useCallback((e: GestureResponderEvent) => {
    const vol = Math.max(0, Math.min(1, (e.nativeEvent.pageX - ambientTrackPageX.current) / ambientTrackWidth.current));
    setAmbientVolume(vol);
  }, [setAmbientVolume]);

  const { isPremium } = usePremium();

  const handleSelectTimer = useCallback((minutes: number | null) => {
    if (minutes !== null && minutes > FREE_TIMER_MAX_MINUTES && !isPremium) {
      showPremiumGate(
        `El temporizador gratuito llega hasta ${FREE_TIMER_MAX_MINUTES} minutos. Hazte Premium para dormir con hasta 8 horas.`
      );
      return;
    }
    setSelectedTimerMinutes(minutes);
    setSleepTimer(minutes);
  }, [setSleepTimer, isPremium]);

  useEffect(() => {
    if (sleepTimerRemaining === null && selectedTimerMinutes !== null) {
      setSelectedTimerMinutes(null);
    }
  }, [sleepTimerRemaining]);

  useEffect(() => {
    if (!isSeekingRef.current) {
      progressShared.value = withTiming(progress, {
        duration: 500,
        easing: Easing.linear,
      });
    }
  }, [progress, progressShared]);

  const fillAnimStyle = useAnimatedStyle(() => ({
    width: progressShared.value * progressBarWidthShared.value,
  }));

  const thumbAnimStyle = useAnimatedStyle(() => ({
    left: progressShared.value * progressBarWidthShared.value,
  }));

  const handleProgressGrant = useCallback((e: GestureResponderEvent) => {
    isSeekingRef.current = true;
    const p = Math.max(0, Math.min(1, (e.nativeEvent.pageX - progressBarPageX.current) / progressBarWidthShared.value));
    progressShared.value = p;
  }, [progressShared, progressBarWidthShared]);

  const handleProgressMove = useCallback((e: GestureResponderEvent) => {
    const p = Math.max(0, Math.min(1, (e.nativeEvent.pageX - progressBarPageX.current) / progressBarWidthShared.value));
    progressShared.value = p;
  }, [progressShared, progressBarWidthShared]);

  const handleProgressRelease = useCallback((e: GestureResponderEvent) => {
    const p = Math.max(0, Math.min(1, (e.nativeEvent.pageX - progressBarPageX.current) / progressBarWidthShared.value));
    progressShared.value = p;
    seekTo(p);
    setTimeout(() => { isSeekingRef.current = false; }, 700);
  }, [progressShared, progressBarWidthShared, seekTo]);

  // Color dominante extraído de la imagen de la sesión
  const imageColors = useImageDominantColor(currentSession?.image as any);

  // ─────────────────────────────────────────────────────────────────────────
  const topPad = Platform.OS === "web" ? 20 : (insets.top || 12);
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  if (!currentSession) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }]}>
        <Feather name="music" size={40} color={colors.border} />
        <Text style={[styles.noSession, { color: colors.mutedForeground }]}>No hay sesión activa</Text>
        <Pressable onPress={() => router.back()} style={[styles.backBtnSolo, { borderColor: colors.border }]}>
          <Text style={{ color: colors.mutedForeground }}>Volver</Text>
        </Pressable>
      </View>
    );
  }

  const isMusicaYSonidos = currentSession.categoryId === "musica-sonidos";
  const isNature = !!getNatureSounds(currentSession.id);
  const isLoopSession = isNature;
  const showArtist = isMusicaYSonidos &&
    (currentSession.soundTag === "Música Ambient" || currentSession.soundTag === "Música Enteógena");
  const isFixedMusic = showArtist;
  const artist = getArtist(currentSession.artistId);

  const TIMER_OPTIONS: { label: string; minutes: number | null }[] = [
    { label: "Sin timer", minutes: null },
    { label: "5 min", minutes: 5 },
    { label: "10 min", minutes: 10 },
    { label: "20 min", minutes: 20 },
    { label: "30 min", minutes: 30 },
    { label: "50 min", minutes: 50 },
  ];

  const formatRemaining = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const totalSeconds = actualDurationSeconds || currentSession.duration * 60;
  const remaining = totalSeconds - elapsed;
  const fav = isFavorite(currentSession.id);

  const { dominant: dominantColor, mid: midColor, dark: darkColor } = imageColors;

  const handlePlayPause = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    pauseResume();
  };

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Share.share({
      title: currentSession.title,
      message: `✨ Estoy escuchando "${currentSession.title}" en RESONANCIA — meditación y sanación con sonido. ¿Te unes?`,
    });
  };

  const skipForward = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    seekTo(Math.min(1, progress + 10 / totalSeconds));
  };

  const skipBackward = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    seekTo(Math.max(0, progress - 10 / totalSeconds));
  };

  const authorLabel = currentSession.guideId
    ? getGuide(currentSession.guideId).name
    : getArtist(currentSession.artistId).name;

  return (
    <View style={styles.root}>
      <StatusBar hidden />

      {/* Fondo dinámico degradado */}
      <LinearGradient
        colors={[dominantColor, midColor, darkColor]}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* ── Hero image con Ken Burns ──────────────────────────────────────── */}
      <View style={styles.heroContainer}>
        <Animated.View style={[{ width, height: HERO_HEIGHT }, kenBurnsStyle]}>
          <ExpoImage
            source={currentSession.image as any}
            style={{ width, height: HERO_HEIGHT }}
            contentFit="cover"
            placeholder={BLUR_PLACEHOLDER}
            transition={IMAGE_TRANSITION}
          />
        </Animated.View>

        {/* Degradado inferior: imagen → fondo dinámico */}
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.25)", dominantColor]}
          locations={[0.35, 0.70, 1]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />

      </View>

      {/* ── Controles de reproducción — centrados en pantalla ───────────── */}
      <View style={styles.heroControls} pointerEvents="box-none">
        <Pressable onPress={skipBackward} style={styles.skipBtn} hitSlop={8}>
          <Feather name="rotate-ccw" size={26} color="rgba(255,255,255,0.90)" />
          <Text style={styles.skipText}>10</Text>
        </Pressable>

        {/* Play/Pause — glass */}
        <Pressable
          onPress={handlePlayPause}
          disabled={isLoading}
          style={[styles.playBtnGlass, { opacity: isLoading ? 0.65 : 1 }]}
        >
          {Platform.OS !== "web" ? (
            <BlurView intensity={28} tint="light" style={StyleSheet.absoluteFill} />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(255,255,255,0.22)" }]} />
          )}
          {isLoading ? (
            <Feather name="loader" size={46} color="white" />
          ) : isPlaying ? (
            <Svg width={46} height={46} viewBox="0 0 46 46">
              <Rect x="7"  y="5" width="12" height="36" rx="5" ry="5" fill="white" />
              <Rect x="27" y="5" width="12" height="36" rx="5" ry="5" fill="white" />
            </Svg>
          ) : (
            <Svg width={46} height={46} viewBox="0 0 46 46">
              <Path
                d="M 13.2 7.1 Q 8 4 8 10 L 8 36 Q 8 42 13.2 38.9 L 34.8 26.1 Q 40 23 34.8 19.9 Z"
                fill="white"
              />
            </Svg>
          )}
        </Pressable>

        <Pressable onPress={skipForward} style={styles.skipBtn} hitSlop={8}>
          <Feather name="rotate-cw" size={26} color="rgba(255,255,255,0.90)" />
          <Text style={styles.skipText}>10</Text>
        </Pressable>
      </View>

      {/* ── Panel inferior ─────────────────────────────────────────────────── */}
      <ScrollView
        style={styles.bottomPanel}
        showsVerticalScrollIndicator={false}
        bounces={false}
        contentContainerStyle={{ flexGrow: 1, justifyContent: "flex-end", paddingBottom: bottomPad + 24 }}
      >
        {/* Tiempo grande + acciones */}
        <View style={styles.timeActionsRow}>
          <Text style={styles.timeDisplay}>{formatTime(remaining)}</Text>
          <View style={styles.actionIcons}>
            <Pressable
              onPress={() => setRepeatMode((r) => !r)}
              hitSlop={8}
            >
              <Feather
                name="repeat"
                size={20}
                color={repeatMode ? "white" : "rgba(255,255,255,0.75)"}
              />
            </Pressable>
            <Pressable
              onPress={() => {
                toggleFavorite(currentSession.id);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              hitSlop={8}
            >
              <Feather
                name="bookmark"
                size={20}
                color={fav ? "white" : "rgba(255,255,255,0.75)"}
              />
            </Pressable>
            <Pressable onPress={handleShare} hitSlop={8}>
              <Feather name="more-horizontal" size={20} color="rgba(255,255,255,0.75)" />
            </Pressable>
          </View>
        </View>

        {/* Barra de progreso */}
        <View
          ref={progressBarRef}
          style={styles.progressTrack}
          onLayout={(e: LayoutChangeEvent) => {
            progressBarWidthShared.value = e.nativeEvent.layout.width;
            progressBarRef.current?.measure((_x, _y, _w, _h, px) => {
              progressBarPageX.current = px;
            });
          }}
          onStartShouldSetResponder={() => true}
          onMoveShouldSetResponder={() => true}
          onResponderGrant={handleProgressGrant}
          onResponderMove={handleProgressMove}
          onResponderRelease={handleProgressRelease}
          onResponderTerminate={handleProgressRelease}
        >
          <View style={styles.progressBg}>
            <Animated.View style={[styles.progressFill, fillAnimStyle]} />
            <Animated.View style={[styles.progressThumb, thumbAnimStyle]} />
          </View>
        </View>

        {/* Etiquetas de tiempo */}
        <View style={styles.timeLabels}>
          <Text style={styles.timeLabelText}>{formatTime(elapsed)}</Text>
          <Text style={styles.timeLabelText}>-{formatTime(remaining)}</Text>
        </View>

        {/* Título */}
        <Text style={styles.titleText} numberOfLines={2}>{currentSession.title}</Text>
        <Text style={styles.authorText}>{authorLabel}</Text>

        {/* Slider voz guiada */}
        {hasVoiceTrack && (
          <View style={[styles.sliderSection, { marginTop: 28 }]}>
            <View style={styles.sliderHeader}>
              <Feather name="mic" size={13} color="rgba(255,255,255,0.5)" />
              <Text style={styles.sliderLabel}>Voz guiada</Text>
              <Text style={styles.sliderPercent}>{Math.round(voiceVolume * 100)}%</Text>
            </View>
            <View
              ref={voiceTrackRef}
              style={styles.sliderHitArea}
              onLayout={(e: LayoutChangeEvent) => { voiceTrackWidth.current = e.nativeEvent.layout.width; }}
              onStartShouldSetResponder={() => true}
              onMoveShouldSetResponder={() => true}
              onResponderGrant={handleVoiceGrant}
              onResponderMove={handleVoiceMove}
            >
              <View style={styles.sliderTrack}>
                <View pointerEvents="none" style={[styles.sliderFill, { width: `${voiceVolume * 100}%` as any }]} />
                <View pointerEvents="none" style={[styles.sliderThumb, { left: `${voiceVolume * 100}%` as any }]} />
              </View>
            </View>
          </View>
        )}

        {/* Slider ambiente */}
        {hasAmbientTrack && (
          <View style={[styles.sliderSection, { marginTop: 22 }]}>
            <View style={styles.sliderHeader}>
              <Feather name="wind" size={13} color="rgba(255,255,255,0.5)" />
              <Text style={styles.sliderLabel}>{isNature ? "Sonidos Ambiente" : "Pájaros"}</Text>
              <Text style={styles.sliderPercent}>{Math.round(ambientVolume * 100)}%</Text>
            </View>
            <View
              ref={ambientTrackRef}
              style={styles.sliderHitArea}
              onLayout={(e: LayoutChangeEvent) => { ambientTrackWidth.current = e.nativeEvent.layout.width; }}
              onStartShouldSetResponder={() => true}
              onMoveShouldSetResponder={() => true}
              onResponderGrant={handleAmbientGrant}
              onResponderMove={handleAmbientMove}
            >
              <View style={styles.sliderTrack}>
                <View pointerEvents="none" style={[styles.sliderFill, { width: `${ambientVolume * 100}%` as any }]} />
                <View pointerEvents="none" style={[styles.sliderThumb, { left: `${ambientVolume * 100}%` as any }]} />
              </View>
            </View>
          </View>
        )}

      </ScrollView>

      {/* ── Botones flotantes superiores ─────────────────────────────────── */}
      <Pressable
        onPress={() => { stop(); router.back(); }}
        style={[styles.topBtn, { top: topPad + 6, left: 16 }]}
        hitSlop={8}
      >
        {Platform.OS !== "web" ? (
          <BlurView intensity={22} tint="dark" style={StyleSheet.absoluteFill} />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.38)" }]} />
        )}
        <Feather name="x" size={20} color="white" />
      </Pressable>

      <Pressable
        onPress={handleShare}
        style={[styles.topBtn, { top: topPad + 6, right: 16 }]}
        hitSlop={8}
      >
        {Platform.OS !== "web" ? (
          <BlurView intensity={22} tint="dark" style={StyleSheet.absoluteFill} />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.38)" }]} />
        )}
        <Feather name="share" size={18} color="white" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  // Hero
  heroContainer: {
    width,
    height: HERO_HEIGHT,
    overflow: "hidden",
  },
  heroControls: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 44,
  },
  skipBtn: {
    alignItems: "center",
    gap: 3,
  },
  skipText: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  playBtnGlass: {
    width: 108,
    height: 108,
    borderRadius: 54,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.28)",
    backgroundColor: "rgba(255,255,255,0.12)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 10,
  },

  // Panel inferior
  bottomPanel: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 22,
  },
  timeActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  timeDisplay: {
    fontSize: 46,
    fontFamily: "OptimaBold",
    color: "white",
    letterSpacing: -1.5,
    lineHeight: 52,
  },
  actionIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    paddingBottom: 4,
  },

  // Barra de progreso
  progressTrack: {
    paddingVertical: 10,
  },
  progressBg: {
    height: 3,
    borderRadius: 2,
    overflow: "visible",
    position: "relative",
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  progressFill: {
    height: 3,
    borderRadius: 2,
    backgroundColor: "white",
  },
  progressThumb: {
    position: "absolute",
    top: -4,
    width: 11,
    height: 11,
    borderRadius: 6,
    marginLeft: -5.5,
    backgroundColor: "white",
  },

  timeLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
    marginBottom: 22,
  },
  timeLabelText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.55)",
  },

  titleText: {
    fontSize: 21,
    fontFamily: "OptimaBold",
    color: "white",
    letterSpacing: 0.2,
    marginBottom: 6,
  },
  authorText: {
    fontSize: 18,
    fontFamily: "Inter_400Regular",
    color: "white",
  },
  signature: {
    fontSize: 13,
    fontWeight: "700",
    color: "rgba(255,255,255,0.9)",
    letterSpacing: 5,
    marginTop: 10,
    marginBottom: 2,
  },

  durationChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.10)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.20)",
  },
  durationChipText: {
    color: "rgba(255,255,255,0.80)",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.3,
  },

  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    gap: 4,
  },
  starBtn: { padding: 4 },

  // Sliders
  sliderSection: {},
  sliderHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 },
  sliderLabel: {
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    flex: 1,
    color: "rgba(255,255,255,0.50)",
  },
  sliderPercent: { fontSize: 11, fontWeight: "700", letterSpacing: 0.5, color: "rgba(255,255,255,0.80)" },
  sliderHitArea: { height: 44, justifyContent: "center", overflow: "visible" },
  sliderTrack: {
    height: 4,
    borderRadius: 2,
    overflow: "visible",
    position: "relative",
    backgroundColor: "rgba(255,255,255,0.20)",
  },
  sliderFill: { height: 4, borderRadius: 2, backgroundColor: "white" },
  sliderThumb: {
    position: "absolute",
    top: -7,
    width: 18,
    height: 18,
    borderRadius: 9,
    marginLeft: -9,
    backgroundColor: "white",
  },

  // Sleep timer
  timerSection: { paddingTop: 28, marginTop: 8 },
  timerHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 },
  timerLabel: { fontSize: 11, letterSpacing: 0.5, textTransform: "uppercase", color: "rgba(255,255,255,0.50)" },
  timerCountdown: { fontSize: 11, fontWeight: "700", letterSpacing: 0.5, color: "rgba(255,255,255,0.80)" },
  timerChips: { flexDirection: "row", gap: 8, paddingVertical: 2 },
  timerChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.20)",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  timerChipSelected: {
    backgroundColor: "rgba(255,255,255,0.18)",
    borderColor: "rgba(255,255,255,0.45)",
  },
  timerChipText: { fontSize: 13, fontWeight: "600", color: "rgba(255,255,255,0.55)" },
  timerChipTextSelected: { color: "white" },

  // Floating top buttons
  topBtn: {
    position: "absolute",
    width: 38,
    height: 38,
    borderRadius: 19,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },

  noSession: { fontSize: 16, marginTop: 16, marginBottom: 24 },
  backBtnSolo: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, borderWidth: 1 },
});
