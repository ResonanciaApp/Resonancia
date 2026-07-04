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
  Animated as RNAnimated,
  Dimensions,
  LayoutChangeEvent,
  Modal,
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
import { DURATION, easeOutCubic, easeOutCubicRA } from "@/constants/motion";
import Animated, {
  Easing,
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { createAudioPlayer, type AudioPlayer } from "expo-audio";
import { SOUND_MAP } from "@/config/sound-map";
import { REMOTE_SOUND_MAP } from "@/lib/remoteSoundMap";
import { usePlayer } from "@/context/PlayerContext";
import { usePremium } from "@/context/PremiumContext";
import { getNatureSounds } from "@/config/nature-base-map";
import Svg, { Path, Rect } from "react-native-svg";
import { AddToPlaylistSheet } from "@/components/AddToPlaylistSheet";
import { AddToFolderSheet } from "@/components/AddToFolderSheet";
import { AmbientSoundPickerSheet } from "@/components/AmbientSoundPickerSheet";
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
    hasRealAudio,
    mainVolume,
    setMainVolume,
    hasVoiceTrack,
    voiceVolume,
    setVoiceVolume,
    hasAmbientTrack,
    ambientVolume,
    setAmbientVolume,
  } = usePlayer();

  // Options sheet
  const [showOptionsSheet, setShowOptionsSheet] = useState(false);
  const [showPlaylistSheet, setShowPlaylistSheet] = useState(false);
  const [showFolderSheet, setShowFolderSheet] = useState(false);
  const [showAmbientPicker, setShowAmbientPicker] = useState(false);
  const [selectedAmbientSoundId, setSelectedAmbientSoundId] = useState<string | null>(null);
  const [ambientOverlayVolume, setAmbientOverlayVolume] = useState(0.5);
  const ambientOverlayRef = useRef<AudioPlayer | null>(null);
  const sheetProgress = useSharedValue(0);
  const ambSheetTrackRef = useRef<View>(null);
  const ambSheetTrackWidth = useRef(0);
  const ambSheetTrackPageX = useRef(0);
  const mainVolSheetTrackRef = useRef<View>(null);
  const mainVolSheetTrackWidth = useRef(0);
  const mainVolSheetTrackPageX = useRef(0);

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
  const terminarOpacity = useRef(new RNAnimated.Value(0)).current;

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

  // ── Overlay ambient player ─────────────────────────────────────────────
  // Carga/reemplaza el sonido cuando cambia la selección
  useEffect(() => {
    if (!ambientOverlayRef.current) {
      ambientOverlayRef.current = createAudioPlayer(null);
    }
    const p = ambientOverlayRef.current;

    if (!selectedAmbientSoundId) {
      p.pause();
      return;
    }

    const file: Parameters<typeof p.replace>[0] | null =
      SOUND_MAP[selectedAmbientSoundId] ??
      (REMOTE_SOUND_MAP[selectedAmbientSoundId]
        ? { uri: REMOTE_SOUND_MAP[selectedAmbientSoundId] }
        : null);

    if (!file) {
      p.pause();
      return;
    }

    p.loop = true;
    p.volume = ambientOverlayVolume;
    p.replace(file);
    p.play();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAmbientSoundId]);

  // Sincroniza play/pause con el player principal (no depende de selectedAmbientSoundId:
  // el cambio de sonido ya arranca la reproducción desde el effect de carga)
  useEffect(() => {
    const p = ambientOverlayRef.current;
    if (!p || !selectedAmbientSoundId) return;
    if (isPlaying) p.play();
    else p.pause();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying]);

  // Sincroniza volumen
  useEffect(() => {
    if (ambientOverlayRef.current) {
      ambientOverlayRef.current.volume = ambientOverlayVolume;
    }
  }, [ambientOverlayVolume]);

  // Limpieza al desmontar
  useEffect(() => {
    return () => {
      try {
        ambientOverlayRef.current?.pause();
        ambientOverlayRef.current?.remove();
      } catch (_) {}
      ambientOverlayRef.current = null;
    };
  }, []);

  const sheetAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - sheetProgress.value) * 700 }],
  }));
  const backdropAnimStyle = useAnimatedStyle(() => ({
    opacity: sheetProgress.value * 0.72,
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
    if (showOptionsSheet) {
      sheetProgress.value = withTiming(1, { duration: DURATION.SHEET_OPEN, easing: easeOutCubicRA });
    }
  }, [showOptionsSheet]);

  const openSheet = useCallback(() => {
    sheetProgress.value = 0;
    setShowOptionsSheet(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const closeSheet = useCallback(() => {
    sheetProgress.value = withTiming(0, { duration: DURATION.SHEET_CLOSE, easing: easeOutCubicRA }, (finished) => {
      if (finished) runOnJS(setShowOptionsSheet)(false);
    });
  }, []);

  const handleSheetAmbGrant = useCallback((e: GestureResponderEvent) => {
    ambSheetTrackRef.current?.measure((_x, _y, _w, _h, px) => {
      ambSheetTrackPageX.current = px;
      const vol = Math.max(0, Math.min(1, (e.nativeEvent.pageX - px) / ambSheetTrackWidth.current));
      if (hasAmbientTrack) setAmbientVolume(vol);
      else if (hasVoiceTrack) setVoiceVolume(vol);
    });
  }, [hasAmbientTrack, hasVoiceTrack, setAmbientVolume, setVoiceVolume]);

  const handleSheetAmbMove = useCallback((e: GestureResponderEvent) => {
    const vol = Math.max(0, Math.min(1, (e.nativeEvent.pageX - ambSheetTrackPageX.current) / ambSheetTrackWidth.current));
    if (hasAmbientTrack) setAmbientVolume(vol);
    else if (hasVoiceTrack) setVoiceVolume(vol);
  }, [hasAmbientTrack, hasVoiceTrack, setAmbientVolume, setVoiceVolume]);

  const handleSheetMainVolGrant = useCallback((e: GestureResponderEvent) => {
    mainVolSheetTrackRef.current?.measure((_x, _y, _w, _h, px) => {
      mainVolSheetTrackPageX.current = px;
      const vol = Math.max(0, Math.min(1, (e.nativeEvent.pageX - px) / mainVolSheetTrackWidth.current));
      setMainVolume(vol);
    });
  }, [setMainVolume]);

  const handleSheetMainVolMove = useCallback((e: GestureResponderEvent) => {
    const vol = Math.max(0, Math.min(1, (e.nativeEvent.pageX - mainVolSheetTrackPageX.current) / mainVolSheetTrackWidth.current));
    setMainVolume(vol);
  }, [setMainVolume]);

  useEffect(() => {
    if (!isSeekingRef.current) {
      progressShared.value = withTiming(progress, {
        duration: 500,
        easing: Easing.linear,
      });
    }
  }, [progress, progressShared]);

  useEffect(() => {
    RNAnimated.timing(terminarOpacity, {
      toValue: isPlaying ? 0 : 1,
      duration: DURATION.PLAYER,
      easing: easeOutCubic,
      useNativeDriver: true,
    }).start();
  }, [isPlaying, terminarOpacity]);

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
    return <View style={[styles.root, { backgroundColor: "transparent" }]} />;
  }

  const OPTIONS_CATEGORIES = ["sonidos-ancestrales", "musica-sonidos", "meditaciones-guiadas"];
  const isOptionsCategory = OPTIONS_CATEGORIES.includes(currentSession.categoryId);

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

        {/* Degradado inferior: imagen → negro */}
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.35)", "#000000"]}
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
            <Feather name="loader" size={46} color="#e8e8e8" />
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
                size={24}
                color={repeatMode ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.95)"}
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
                name="heart"
                size={24}
                color={fav ? "#BE8744" : "rgba(255,255,255,0.95)"}
              />
            </Pressable>
            <Pressable onPress={isOptionsCategory ? openSheet : handleShare} hitSlop={8}>
              <Feather name="more-horizontal" size={24} color="rgba(255,255,255,0.95)" />
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

        {/* Título + autor, con botón Terminar superpuesto en pausa */}
        <View style={styles.titleAuthorWrapper}>
          <Text style={styles.titleText} numberOfLines={2}>
            {currentSession.title}
          </Text>
          <Text style={styles.authorText}>{authorLabel}</Text>

          <RNAnimated.View
            style={[{ position: "absolute", top: 0, bottom: 0, left: -5, right: -5 }, { opacity: terminarOpacity }]}
            pointerEvents={isPlaying ? "none" : "auto"}
          >
            <Pressable
              onPress={() => { stop(); router.back(); }}
              style={[styles.terminarBtn, StyleSheet.absoluteFill]}
            >
              <Text style={styles.terminarText}>{progress >= 1 ? "Continuar" : "Terminar"}</Text>
            </Pressable>
          </RNAnimated.View>
        </View>

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
        style={[
          styles.topBtn,
          { top: topPad + 6, left: 16 },
          !isPlaying && styles.topBtnExpanded,
        ]}
        hitSlop={8}
      >
        {Platform.OS !== "web" ? (
          <BlurView intensity={22} tint="dark" style={StyleSheet.absoluteFill} />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.38)" }]} />
        )}
        <Feather name="x" size={20} color="#e8e8e8" />
        {!isPlaying && (
          <Text style={styles.topBtnLabel}>Descartar</Text>
        )}
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
        <Feather name="share" size={18} color="#e8e8e8" />
      </Pressable>

      {/* ── Options Sheet ──────────────────────────────────────────────────── */}
      <Modal
        visible={showOptionsSheet}
        transparent
        animationType="none"
        onRequestClose={closeSheet}
        statusBarTranslucent
      >
        <View style={[StyleSheet.absoluteFill, { justifyContent: "flex-end" }]} pointerEvents="box-none">
          {/* Backdrop */}
          <Pressable style={StyleSheet.absoluteFill} onPress={closeSheet}>
            <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: "#000" }, backdropAnimStyle]} />
          </Pressable>

          {/* Sheet */}
          <Animated.View style={[styles.optSheet, { paddingBottom: bottomPad + 8 }, sheetAnimStyle]}>
            <LinearGradient
              colors={["#230610", "#16040A"]}
              locations={[0, 1]}
              style={[StyleSheet.absoluteFill, { borderTopLeftRadius: 24, borderTopRightRadius: 24 }]}
              pointerEvents="none"
            />
            {/* Handle */}
            <View style={styles.optHandle} />

            {/* Header: thumbnail + title + author */}
            <View style={styles.optHeader}>
              <ExpoImage
                source={currentSession.image as any}
                style={styles.optThumb}
                contentFit="cover"
                placeholder={BLUR_PLACEHOLDER}
              />
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={styles.optSessionTitle} numberOfLines={2}>{currentSession.title}</Text>
                <Text style={styles.optSessionAuthor}>{authorLabel}</Text>
              </View>
            </View>

            <View style={styles.optDivider} />

            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
              {/* Track principal / voz / ambiente */}
              {(hasVoiceTrack || hasAmbientTrack) && (
                <View style={styles.optSliderItem}>
                  <View style={styles.optRow}>
                    <Feather
                      name={hasVoiceTrack && !hasAmbientTrack ? "mic" : "volume-2"}
                      size={18}
                      color="#e8e8e8"
                      style={styles.optIcon}
                    />
                    <Text style={styles.optRowText}>
                      {hasVoiceTrack && !hasAmbientTrack ? "Voz guiada" : "Ambiente"}
                    </Text>
                    <Text style={styles.optRowBadge}>
                      {Math.round((hasAmbientTrack ? ambientVolume : voiceVolume) * 100)}%
                    </Text>
                  </View>
                  <View
                    ref={ambSheetTrackRef}
                    style={[styles.sliderHitArea, { marginHorizontal: 20, marginTop: 2 }]}
                    onLayout={(e: LayoutChangeEvent) => { ambSheetTrackWidth.current = e.nativeEvent.layout.width; }}
                    onStartShouldSetResponder={() => true}
                    onMoveShouldSetResponder={() => true}
                    onResponderGrant={handleSheetAmbGrant}
                    onResponderMove={handleSheetAmbMove}
                  >
                    <View style={styles.sliderTrack}>
                      <View
                        pointerEvents="none"
                        style={[styles.sliderFill, { width: `${(hasAmbientTrack ? ambientVolume : voiceVolume) * 100}%` as any, backgroundColor: "#BE8744" }]}
                      />
                      <View
                        pointerEvents="none"
                        style={[styles.sliderThumb, { left: `${(hasAmbientTrack ? ambientVolume : voiceVolume) * 100}%` as any, backgroundColor: "#BE8744" }]}
                      />
                    </View>
                  </View>
                </View>
              )}

              {/* Volumen principal */}
              {hasRealAudio && (
                <View style={styles.optSliderItem}>
                  <View style={styles.optRow}>
                    <Feather name="mic" size={18} color="#e8e8e8" style={styles.optIcon} />
                    <Text style={styles.optRowText}>Voz guía</Text>
                    <Text style={styles.optRowBadge}>{Math.round(mainVolume * 100)}%</Text>
                  </View>
                  <View
                    ref={mainVolSheetTrackRef}
                    style={[styles.sliderHitArea, { marginHorizontal: 20, marginTop: 2 }]}
                    onLayout={(e: LayoutChangeEvent) => { mainVolSheetTrackWidth.current = e.nativeEvent.layout.width; }}
                    onStartShouldSetResponder={() => true}
                    onMoveShouldSetResponder={() => true}
                    onResponderGrant={handleSheetMainVolGrant}
                    onResponderMove={handleSheetMainVolMove}
                  >
                    <View style={styles.sliderTrack}>
                      <View
                        pointerEvents="none"
                        style={[styles.sliderFill, { width: `${mainVolume * 100}%` as any, backgroundColor: "#BE8744" }]}
                      />
                      <View
                        pointerEvents="none"
                        style={[styles.sliderThumb, { left: `${mainVolume * 100}%` as any, backgroundColor: "#BE8744" }]}
                      />
                    </View>
                  </View>
                </View>
              )}

              {/* Sonido ambiente */}
              <Pressable
                style={styles.optRow}
                onPress={() => { closeSheet(); setTimeout(() => setShowAmbientPicker(true), 300); }}
              >
                <Feather name="music" size={18} color="#e8e8e8" style={styles.optIcon} />
                <Text style={styles.optRowText}>Sonido ambiente</Text>
                {selectedAmbientSoundId && (
                  <Feather name="check-circle" size={15} color="#BE8744" style={{ marginRight: 6 }} />
                )}
                <Feather name="chevron-right" size={15} color="rgba(255,255,255,0.35)" />
              </Pressable>

              {/* Temporizador */}
              <Pressable style={styles.optRow} onPress={closeSheet}>
                <Feather name="clock" size={18} color="#e8e8e8" style={styles.optIcon} />
                <Text style={styles.optRowText}>Temporizador</Text>
                {selectedTimerMinutes !== null && (
                  <Text style={styles.optRowBadge}>{selectedTimerMinutes} min</Text>
                )}
                <Feather name="chevron-right" size={15} color="rgba(255,255,255,0.35)" />
              </Pressable>

              {/* Descargar */}
              <Pressable style={styles.optRow}>
                <Feather name="download" size={18} color="#e8e8e8" style={styles.optIcon} />
                <Text style={styles.optRowText}>Descargar</Text>
                <Feather name="chevron-right" size={15} color="rgba(255,255,255,0.35)" />
              </Pressable>

              {/* Agregar a favoritos */}
              <Pressable
                style={styles.optRow}
                onPress={() => {
                  toggleFavorite(currentSession.id);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Feather name="heart" size={18} color={fav ? "#BE8744" : "#e8e8e8"} style={styles.optIcon} />
                <Text style={[styles.optRowText, fav && { color: "#BE8744" }]}>
                  {fav ? "En favoritos" : "Agregar a favoritos"}
                </Text>
                {fav && <Feather name="check" size={15} color="#BE8744" />}
              </Pressable>

              {/* Añadir a carpeta */}
              <Pressable
                style={styles.optRow}
                onPress={() => { closeSheet(); setTimeout(() => setShowFolderSheet(true), 300); }}
              >
                <Feather name="folder-plus" size={18} color="#e8e8e8" style={styles.optIcon} />
                <Text style={styles.optRowText}>Añadir a carpeta</Text>
                <Feather name="chevron-right" size={15} color="rgba(255,255,255,0.35)" />
              </Pressable>

              {/* Añadir a playlist */}
              <Pressable
                style={styles.optRow}
                onPress={() => { closeSheet(); setTimeout(() => setShowPlaylistSheet(true), 300); }}
              >
                <Feather name="list" size={18} color="#e8e8e8" style={styles.optIcon} />
                <Text style={styles.optRowText}>Añadir a playlist</Text>
                <Feather name="chevron-right" size={15} color="rgba(255,255,255,0.35)" />
              </Pressable>

              {/* Seguir al voz guía */}
              {currentSession.guideId && (
                <Pressable
                  style={styles.optRow}
                  onPress={() => {
                    closeSheet();
                    router.push(`/guiador/${currentSession.guideId}` as any);
                  }}
                >
                  <Feather name="user-plus" size={18} color="#e8e8e8" style={styles.optIcon} />
                  <Text style={styles.optRowText}>Seguir al voz guía</Text>
                  <Feather name="chevron-right" size={15} color="rgba(255,255,255,0.35)" />
                </Pressable>
              )}

              {/* Separador */}
              <View style={[styles.optDivider, { marginTop: 8 }]} />

              {/* Informar un problema */}
              <Pressable style={styles.optRow}>
                <Feather name="alert-circle" size={18} color="rgba(255,255,255,0.5)" style={styles.optIcon} />
                <Text style={[styles.optRowText, { color: "rgba(255,255,255,0.5)" }]}>Informar un problema</Text>
                <Feather name="chevron-right" size={15} color="rgba(255,255,255,0.25)" />
              </Pressable>
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>

      {/* ── Playlist Sheet ─────────────────────────────────────────────────── */}
      {currentSession && (
        <AddToPlaylistSheet
          visible={showPlaylistSheet}
          sessionId={currentSession.id}
          onClose={() => setShowPlaylistSheet(false)}
        />
      )}

      {/* ── Folder Sheet ───────────────────────────────────────────────────── */}
      {currentSession && (
        <AddToFolderSheet
          visible={showFolderSheet}
          sessionId={currentSession.id}
          onClose={() => setShowFolderSheet(false)}
        />
      )}

      {/* ── Ambient Sound Picker ───────────────────────────────────────────── */}
      <AmbientSoundPickerSheet
        visible={showAmbientPicker}
        selectedSoundId={selectedAmbientSoundId}
        session={currentSession ? { title: currentSession.title, image: currentSession.image } : undefined}
        onClose={() => setShowAmbientPicker(false)}
        initialStep={selectedAmbientSoundId ? "controles" : "pick"}
        initialSessionVolume={mainVolume}
        initialAmbientVolume={ambientOverlayVolume}
        onPreviewStart={(id) => setSelectedAmbientSoundId(id)}
        onSessionVolumeChange={(vol) => setMainVolume(vol)}
        onAmbientVolumeChange={(vol) => {
          setAmbientOverlayVolume(vol);
          if (ambientOverlayRef.current) ambientOverlayRef.current.volume = vol;
        }}
        onSelect={(id, vol, sessVol) => {
          setSelectedAmbientSoundId(id);
          setAmbientOverlayVolume(vol);
          setMainVolume(sessVol);
        }}
        onRemoveConfirm={() => {
          setSelectedAmbientSoundId(null);
          setShowAmbientPicker(false);
        }}
      />
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
    backgroundColor: "#000000",
  },
  timeActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  timeDisplay: {
    fontSize: 46,
    fontFamily: "OptimaRegular",
    color: "#e8e8e8",
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
    fontSize: 20,
    fontWeight: "800",
    color: "#e8e8e8",
    letterSpacing: 0.2,
    marginBottom: 6,
  },
  authorText: {
    fontSize: 15,
    fontWeight: "300",
    color: "#e8e8e8",
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
  timerChipTextSelected: { color: "#e8e8e8" },

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
  topBtnExpanded: {
    width: "auto" as any,
    paddingHorizontal: 14,
    flexDirection: "row",
    gap: 6,
  },
  topBtnLabel: {
    color: "#e8e8e8",
    fontSize: 15,
    fontWeight: "600",
  },
  titleAuthorWrapper: {
    position: "relative",
  },
  terminarBtn: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  terminarText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.3,
  },

  noSession: { fontSize: 16, marginTop: 16, marginBottom: 24 },
  backBtnSolo: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, borderWidth: 1 },

  // Options sheet
  optSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
    paddingTop: 10,
    maxHeight: "85%",
  },
  optHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.22)",
    alignSelf: "center",
    marginBottom: 18,
  },
  optHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  optThumb: {
    width: 73,
    height: 73,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  optSessionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#e8e8e8",
    lineHeight: 20,
    marginBottom: 3,
  },
  optSessionAuthor: {
    fontSize: 13,
    fontWeight: "300",
    color: "rgba(255,255,255,0.60)",
  },
  optDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginHorizontal: 20,
    marginBottom: 4,
  },
  optRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  optIcon: {
    marginRight: 16,
    width: 22,
    textAlign: "center",
  },
  optRowText: {
    fontSize: 16,
    color: "#e8e8e8",
    flex: 1,
  },
  optRowBadge: {
    fontSize: 13,
    color: "rgba(255,255,255,0.50)",
    marginRight: 6,
  },
  optRowMuted: {
    fontSize: 12,
    color: "rgba(255,255,255,0.35)",
    fontStyle: "italic",
  },
  optSliderItem: {
    paddingBottom: 8,
  },
});
