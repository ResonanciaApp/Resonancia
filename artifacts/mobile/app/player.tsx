import { Feather, FontAwesome } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router, Stack, useLocalSearchParams } from "expo-router";
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
  Alert,
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
import { useSceneTheme } from "@/context/SceneThemeContext";
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
  const { anim } = useLocalSearchParams<{ anim?: string }>();
  const colors = useColors();
  const { theme } = useSceneTheme();
  const insets = useSafeAreaInsets();
  const {
    currentSession,
    isPlaying,
    isLoading,
    progress,
    elapsed,
    actualDurationSeconds,
    infiniteLoop,
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
    activePlaylistIds,
    queueImplicit,
    queueRandom,
    toggleQueueRandom,
    shuffleMode,
    playlistNext,
    playlistPrev,
    toggleShuffle,
  } = usePlayer();

  // En modo playlist los controles de ±15s y ajustes se reemplazan
  const isInPlaylist = !!activePlaylistIds?.length;

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
  const progressBarRef = useRef<View>(null);
  const progressBarPageX = useRef(0);
  const isSeekingRef = useRef(false);
  const progressShared = useSharedValue(0);
  const progressBarWidthShared = useSharedValue(0);
  const terminarOpacity = useRef(new RNAnimated.Value(0)).current;
  const uiOpacity = useRef(new RNAnimated.Value(1)).current;
  const [uiShown, setUiShown] = useState(true);

  const toggleUI = useCallback(() => {
    const next = !uiShown;
    setUiShown(next);
    RNAnimated.timing(uiOpacity, {
      toValue: next ? 1 : 0,
      duration: 280,
      easing: easeOutCubic,
      useNativeDriver: true,
    }).start();
  }, [uiShown, uiOpacity]);

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
      if (hasVoiceTrack) setVoiceVolume(vol);
    });
  }, [hasVoiceTrack, setVoiceVolume]);

  const handleSheetAmbMove = useCallback((e: GestureResponderEvent) => {
    const vol = Math.max(0, Math.min(1, (e.nativeEvent.pageX - ambSheetTrackPageX.current) / ambSheetTrackWidth.current));
    if (hasVoiceTrack) setVoiceVolume(vol);
  }, [hasVoiceTrack, setVoiceVolume]);

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

  const scaleHeart    = useRef(new RNAnimated.Value(1)).current;
  const scaleShare    = useRef(new RNAnimated.Value(1)).current;
  const scalePlaylist = useRef(new RNAnimated.Value(1)).current;
  const scaleTimer    = useRef(new RNAnimated.Value(1)).current;
  const [showTimerSheet, setShowTimerSheet] = useState(false);

  // ─────────────────────────────────────────────────────────────────────────
  const topPad = Platform.OS === "web" ? 20 : (insets.top || 12);
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  if (!currentSession) {
    return <View style={[styles.root, { backgroundColor: "transparent" }]} />;
  }

  const OPTIONS_CATEGORIES = ["sonidos-ancestrales", "musica-sonidos", "meditaciones-guiadas"];
  const isOptionsCategory = OPTIONS_CATEGORIES.includes(currentSession.categoryId);

  /* ── Icono izquierdo del reproductor por categoría (Tarea #191) ──
     Música/Sesiones → aleatorio (al terminar suena otra al azar);
     Meditaciones → icono de música que abre Sonido Ambiente directo;
     Dormir → espacio vacío (sin icono);
     resto → ajustes como antes. */
  const catId = currentSession.categoryId;
  const leftSlot =
    catId === "musica-sonidos" || catId === "sonidos-ancestrales" ? (
      <Pressable
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); toggleQueueRandom(); }}
        style={styles.ctrlBtn}
        hitSlop={10}
      >
        <Feather
          name="shuffle"
          size={22}
          color={queueRandom ? "#BE9650" : "rgba(255,255,255,0.88)"}
        />
      </Pressable>
    ) : catId === "meditaciones-guiadas" ? (
      <Pressable
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowAmbientPicker(true); }}
        style={styles.ctrlBtn}
        hitSlop={10}
      >
        <Feather name="music" size={22} color="rgba(255,255,255,0.88)" />
      </Pressable>
    ) : catId === "descanso" ? (
      <View style={styles.ctrlBtn} />
    ) : (
      <Pressable
        onPress={isOptionsCategory ? openSheet : undefined}
        style={styles.ctrlBtn}
        hitSlop={10}
      >
        <Feather
          name="sliders"
          size={22}
          color={isOptionsCategory ? "rgba(255,255,255,0.88)" : "rgba(255,255,255,0.28)"}
        />
      </Pressable>
    );

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
  const remaining = infiniteLoop ? Infinity : totalSeconds - elapsed;
  const fav = isFavorite(currentSession.id);
  const isPlaybackUnavailable = currentSession.isPlaceholder || !hasRealAudio;
  const playbackUnavailableLabel = currentSession.isPlaceholder
    ? "Contenido próximamente"
    : "Audio no disponible";

  const bounce = (sv: RNAnimated.Value) => {
    sv.setValue(1);
    RNAnimated.sequence([
      RNAnimated.timing(sv, { toValue: 1.25, duration: 120, useNativeDriver: true }),
      RNAnimated.spring(sv, { toValue: 1, friction: 3, tension: 140, useNativeDriver: true }),
    ]).start();
  };

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
    seekTo(Math.min(1, progress + 15 / totalSeconds));
  };

  const skipBackward = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    seekTo(Math.max(0, progress - 15 / totalSeconds));
  };

  const authorLabel = currentSession.guideId
    ? getGuide(currentSession.guideId).name
    : getArtist(currentSession.artistId).name;

  const authorPhoto = currentSession.guideId
    ? getGuide(currentSession.guideId).photo
    : getArtist(currentSession.artistId).photo;

  const authorProfilePath = currentSession.guideId
    ? `/guiador/${currentSession.guideId}`
    : `/artista/${currentSession.artistId}`;

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ animation: anim === "fade" ? "fade" : "slide_from_bottom", animationDuration: 300 }} />
      <StatusBar hidden />

      {/* ── Imagen de fondo con Ken Burns ────────────────────────────────── */}
      <View style={[styles.heroContainer, StyleSheet.absoluteFill]}>
        <Animated.View style={[StyleSheet.absoluteFill, kenBurnsStyle]}>
          <ExpoImage
            source={currentSession.image as any}
            style={StyleSheet.absoluteFill as object}
            contentFit="cover"
            placeholder={BLUR_PLACEHOLDER}
            transition={IMAGE_TRANSITION}
          />
        </Animated.View>
      </View>

      {/* ── Tap invisible para ocultar/mostrar UI ────────────────────────── */}
      <Pressable style={StyleSheet.absoluteFill} onPress={toggleUI} />

      {/* ── Toda la UI (se desvanece al tap) ─────────────────────────────── */}
      <RNAnimated.View
        style={[StyleSheet.absoluteFill, { opacity: uiOpacity }]}
        pointerEvents="box-none"
      >
        {/* Overlay oscuro */}
        <View style={[StyleSheet.absoluteFill, styles.darkOverlay]} pointerEvents="none" />

        {/* ── Botones top: chevron + descarga ─────────────────────────────── */}
        <View style={[styles.topRow, { paddingTop: topPad + 8 }]} pointerEvents="box-none">
          <Pressable
            onPress={() => {
              stop();
              router.back();
            }}
            style={styles.topCircleBtn}
            hitSlop={8}
          >
            {Platform.OS !== "web" ? (
              <BlurView intensity={22} tint="dark" style={StyleSheet.absoluteFill} />
            ) : (
              <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.38)" }]} />
            )}
            <Feather name="chevron-down" size={22} color="#FBFBFB" />
          </Pressable>

          <Pressable
            style={styles.topCircleBtn}
            hitSlop={8}
            onPress={() => Alert.alert("Próximamente", "La descarga estará disponible en una próxima versión.")}
          >
            {Platform.OS !== "web" ? (
              <BlurView intensity={22} tint="dark" style={StyleSheet.absoluteFill} />
            ) : (
              <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.38)" }]} />
            )}
            <Feather name="download-cloud" size={20} color="#FBFBFB" />
          </Pressable>
        </View>

        {/* ── Contenido principal ──────────────────────────────────────────── */}
        <View
          style={[styles.mainContent, { paddingTop: topPad + 68, paddingBottom: bottomPad + 12 }]}
          pointerEvents="box-none"
        >
          {/* Avatar autor */}
          {authorPhoto && (
            <Pressable
              onPress={() => router.push(authorProfilePath as never)}
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1, alignSelf: "center", marginBottom: 12 })}
              hitSlop={8}
            >
              <ExpoImage
                source={authorPhoto as never}
                style={{ width: 52, height: 52, borderRadius: 26 }}
                contentFit="cover"
              />
            </Pressable>
          )}

          {/* Título */}
          <Text style={styles.titleText} numberOfLines={3}>
            {currentSession.title}
          </Text>

          {/* Descripción del reproductor (opcional) */}
          {!!currentSession.playerDescription && (
            <Text style={styles.playerDesc} numberOfLines={3}>
              {currentSession.playerDescription}
            </Text>
          )}

          {/* Autor */}
          <View style={styles.authorSection}>
            <Text style={styles.authorLabel}>
              {currentSession.guideId ? "VOZ GUÍA" : "AUTOR(A)"}
            </Text>
            <Text style={styles.authorName}>{authorLabel}</Text>
          </View>

          {/* Spacer */}
          <View style={{ flex: 1 }} />

          {/* ── Fila de acciones ─────────────────────────────────────────── */}
          <View style={styles.actionRow}>
            <Pressable
              style={styles.actionBtn}
              onPress={() => {
                bounce(scaleHeart);
                toggleFavorite(currentSession.id);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              hitSlop={8}
            >
              <RNAnimated.View style={{ transform: [{ scale: scaleHeart }] }}>
                <FontAwesome name="heart" size={20} color={fav ? "#F9F9F9" : "rgba(255,255,255,0.92)"} />
              </RNAnimated.View>
            </Pressable>
            <Pressable
              style={styles.actionBtn}
              onPress={() => { bounce(scaleShare); handleShare(); }}
              hitSlop={8}
            >
              <RNAnimated.View style={{ transform: [{ scale: scaleShare }] }}>
                <Feather name="share" size={22} color="rgba(255,255,255,0.92)" />
              </RNAnimated.View>
            </Pressable>
            {/* Playlist: oculto en Meditaciones y Dormir (Tarea #193) */}
            {catId !== "meditaciones-guiadas" && catId !== "descanso" && (
              <Pressable
                style={styles.actionBtn}
                onPress={() => { bounce(scalePlaylist); setShowPlaylistSheet(true); }}
                hitSlop={8}
              >
                <RNAnimated.View style={{ transform: [{ scale: scalePlaylist }] }}>
                  <Feather name="list" size={22} color="rgba(255,255,255,0.92)" />
                </RNAnimated.View>
              </Pressable>
            )}
            {/* Temporizador (Tarea #193) */}
            <Pressable
              style={styles.actionBtn}
              onPress={() => {
                bounce(scaleTimer);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowTimerSheet(true);
              }}
              hitSlop={8}
            >
              <RNAnimated.View style={{ transform: [{ scale: scaleTimer }] }}>
                <Feather
                  name="clock"
                  size={22}
                  color={sleepTimerRemaining !== null ? "#BE9650" : "rgba(255,255,255,0.92)"}
                />
              </RNAnimated.View>
            </Pressable>
          </View>

          {isPlaybackUnavailable && (
            <View style={{ alignItems: "center", marginBottom: 16 }}>
              <Text style={{ color: "#F9F9F9", fontSize: 15, fontWeight: "700" }}>
                {playbackUnavailableLabel}
              </Text>
              <Text style={{ color: "rgba(255,255,255,0.72)", fontSize: 13, marginTop: 4, textAlign: "center" }}>
                {currentSession.isPlaceholder
                  ? "Esta sesión estará disponible cuando Casa del Cuenco publique el audio final."
                  : "No es posible reproducir esta sesión en este momento."}
              </Text>
            </View>
          )}

          {/* ── Fila de controles ─────────────────────────────────────────── */}
          <View style={styles.controlsRow}>
            {isInPlaylist ? (
              /* ── Modo cola: (shuffle|ajustes) · prev · play · next · stop ──
                 Playlist explícita → aleatorio; cola implícita (categoría,
                 estilo Calm) → botón de ajustes como en el modo normal. */
              <>
                {queueImplicit ? (
                  /* Cola implícita: icono izquierdo según categoría (Tarea #191) */
                  leftSlot
                ) : (
                  /* Aleatorio */
                  <Pressable
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); toggleShuffle(); }}
                    style={styles.ctrlBtn}
                    hitSlop={10}
                  >
                    <Feather
                      name="shuffle"
                      size={22}
                      color={shuffleMode ? "#BE9650" : "rgba(255,255,255,0.88)"}
                    />
                  </Pressable>
                )}

                {/* Sesión anterior */}
                <Pressable
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); playlistPrev(); }}
                  style={styles.ctrlBtn}
                  hitSlop={10}
                >
                  <Feather name="skip-back" size={28} color="rgba(255,255,255,0.90)" />
                </Pressable>

                {/* Play / Pause */}
                <Pressable
                  onPress={handlePlayPause}
                  disabled={isLoading || isPlaybackUnavailable}
                  style={[styles.playBtn, { opacity: isLoading || isPlaybackUnavailable ? 0.45 : 1 }]}
                  hitSlop={4}
                >
                  {isLoading ? (
                    <Feather name="loader" size={36} color="#FBFBFB" />
                  ) : isPlaying ? (
                    <Svg width={36} height={36} viewBox="0 0 46 46">
                      <Rect x="7"  y="5" width="12" height="36" rx="5" ry="5" fill="white" />
                      <Rect x="27" y="5" width="12" height="36" rx="5" ry="5" fill="white" />
                    </Svg>
                  ) : (
                    <Svg width={36} height={36} viewBox="0 0 46 46">
                      <Path d="M 13.2 7.1 Q 8 4 8 10 L 8 36 Q 8 42 13.2 38.9 L 34.8 26.1 Q 40 23 34.8 19.9 Z" fill="white" />
                    </Svg>
                  )}
                </Pressable>

                {/* Sesión siguiente */}
                <Pressable
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); playlistNext(); }}
                  style={styles.ctrlBtn}
                  hitSlop={10}
                >
                  <Feather name="skip-forward" size={28} color="rgba(255,255,255,0.90)" />
                </Pressable>

                {/* Stop */}
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    stop();
                    router.back();
                  }}
                  style={styles.ctrlBtn}
                  hitSlop={10}
                >
                  <Svg width={22} height={22} viewBox="0 0 24 24">
                    <Rect x="4" y="4" width="16" height="16" rx="3" ry="3" fill="rgba(255,255,255,0.88)" />
                  </Svg>
                </Pressable>
              </>
            ) : (
              /* ── Modo normal: icono por categoría · −15s · play · +15s · stop ── */
              <>
                {leftSlot}

                {/* Retroceder 15s (oculto en loop infinito: no hay línea de tiempo) */}
                <Pressable
                  onPress={skipBackward}
                  style={[styles.ctrlBtn, infiniteLoop && { opacity: 0 }]}
                  hitSlop={10}
                  disabled={infiniteLoop}
                >
                  <Feather name="rotate-ccw" size={26} color="rgba(255,255,255,0.90)" />
                  <Text style={styles.ctrlSkipLabel}>15</Text>
                </Pressable>

                {/* Play / Pause */}
                <Pressable
                  onPress={handlePlayPause}
                  disabled={isLoading || isPlaybackUnavailable}
                  style={[styles.playBtn, { opacity: isLoading || isPlaybackUnavailable ? 0.45 : 1 }]}
                  hitSlop={4}
                >
                  {isLoading ? (
                    <Feather name="loader" size={36} color="#FBFBFB" />
                  ) : isPlaying ? (
                    <Svg width={36} height={36} viewBox="0 0 46 46">
                      <Rect x="7"  y="5" width="12" height="36" rx="5" ry="5" fill="white" />
                      <Rect x="27" y="5" width="12" height="36" rx="5" ry="5" fill="white" />
                    </Svg>
                  ) : (
                    <Svg width={36} height={36} viewBox="0 0 46 46">
                      <Path d="M 13.2 7.1 Q 8 4 8 10 L 8 36 Q 8 42 13.2 38.9 L 34.8 26.1 Q 40 23 34.8 19.9 Z" fill="white" />
                    </Svg>
                  )}
                </Pressable>

                {/* Avanzar 15s (oculto en loop infinito) */}
                <Pressable
                  onPress={skipForward}
                  style={[styles.ctrlBtn, infiniteLoop && { opacity: 0 }]}
                  hitSlop={10}
                  disabled={infiniteLoop}
                >
                  <Feather name="rotate-cw" size={26} color="rgba(255,255,255,0.90)" />
                  <Text style={styles.ctrlSkipLabel}>15</Text>
                </Pressable>

                {/* Stop */}
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    stop();
                    router.back();
                  }}
                  style={styles.ctrlBtn}
                  hitSlop={10}
                >
                  <Svg width={22} height={22} viewBox="0 0 24 24">
                    <Rect x="4" y="4" width="16" height="16" rx="3" ry="3" fill="rgba(255,255,255,0.88)" />
                  </Svg>
                </Pressable>
              </>
            )}
          </View>

          {/* ── Barra de progreso (oculta en loops infinitos: no hay línea de tiempo) ── */}
          {!infiniteLoop && (
          <View
            ref={progressBarRef}
            style={styles.progressTrack}
            onLayout={(e: LayoutChangeEvent) => {
              progressBarWidthShared.value = e.nativeEvent.layout.width;
              progressBarRef.current?.measure((_x, _y, _w, _h, px) => {
                progressBarPageX.current = px;
              });
            }}
            onStartShouldSetResponder={() => !infiniteLoop}
            onMoveShouldSetResponder={() => !infiniteLoop}
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
          )}

          {/* Etiquetas de tiempo (ocultas en loops infinitos) */}
          {!infiniteLoop && (
          <View style={styles.timeLabels}>
            <Text style={styles.timeLabelText}>{formatTime(elapsed)}</Text>
            <Text style={styles.timeLabelText}>{formatTime(remaining)}</Text>
          </View>
          )}
        </View>
      </RNAnimated.View>

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
              colors={theme.id === "tibet" ? ["#2d1c52", "#1f2a62"] : [theme.gradient[0] as string, theme.gradient[0] as string]}
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
              {/* Track de voz guiada */}
              {hasVoiceTrack && (
                <View style={styles.optSliderItem}>
                  <View style={styles.optRow}>
                    <Feather
                      name="mic"
                      size={18}
                      color="#FBFBFB"
                      style={styles.optIcon}
                    />
                    <Text style={styles.optRowText}>Voz guiada</Text>
                    <Text style={styles.optRowBadge}>
                      {Math.round(voiceVolume * 100)}%
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
                        style={[styles.sliderFill, { width: `${voiceVolume * 100}%` as any, backgroundColor: "#F9F9F9" }]}
                      />
                      <View
                        pointerEvents="none"
                        style={[styles.sliderThumb, { left: `${voiceVolume * 100}%` as any, backgroundColor: "#F9F9F9" }]}
                      />
                    </View>
                  </View>
                </View>
              )}

              {/* Volumen principal */}
              {hasRealAudio && (
                <View style={styles.optSliderItem}>
                  <View style={styles.optRow}>
                    <Feather name="mic" size={18} color="#FBFBFB" style={styles.optIcon} />
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
                        style={[styles.sliderFill, { width: `${mainVolume * 100}%` as any, backgroundColor: "#F9F9F9" }]}
                      />
                      <View
                        pointerEvents="none"
                        style={[styles.sliderThumb, { left: `${mainVolume * 100}%` as any, backgroundColor: "#F9F9F9" }]}
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
                <Feather name="music" size={18} color="#FBFBFB" style={styles.optIcon} />
                <Text style={styles.optRowText}>Sonido ambiente</Text>
                {selectedAmbientSoundId && (
                  <Feather name="check-circle" size={15} color="#F9F9F9" style={{ marginRight: 6 }} />
                )}
                <Feather name="chevron-right" size={15} color="rgba(255,255,255,0.35)" />
              </Pressable>

              {/* Temporizador */}
              <Pressable
                style={styles.optRow}
                onPress={() => { closeSheet(); setTimeout(() => setShowTimerSheet(true), 300); }}
              >
                <Feather name="clock" size={18} color="#FBFBFB" style={styles.optIcon} />
                <Text style={styles.optRowText}>Temporizador</Text>
                {selectedTimerMinutes !== null && (
                  <Text style={styles.optRowBadge}>{selectedTimerMinutes} min</Text>
                )}
                <Feather name="chevron-right" size={15} color="rgba(255,255,255,0.35)" />
              </Pressable>

              {/* Descargar */}
              <Pressable
                style={styles.optRow}
                onPress={() => Alert.alert("Próximamente", "La descarga estará disponible en una próxima versión.")}
              >
                <Feather name="download" size={18} color="#FBFBFB" style={styles.optIcon} />
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
                <Feather name="heart" size={18} color={fav ? "#F9F9F9" : "#FBFBFB"} style={styles.optIcon} />
                <Text style={[styles.optRowText, fav && { color: "#F9F9F9" }]}>
                  {fav ? "En favoritos" : "Agregar a favoritos"}
                </Text>
                {fav && <Feather name="check" size={15} color="#F9F9F9" />}
              </Pressable>

              {/* Añadir a carpeta */}
              <Pressable
                style={styles.optRow}
                onPress={() => { closeSheet(); setTimeout(() => setShowFolderSheet(true), 300); }}
              >
                <Feather name="folder-plus" size={18} color="#FBFBFB" style={styles.optIcon} />
                <Text style={styles.optRowText}>Añadir a carpeta</Text>
                <Feather name="chevron-right" size={15} color="rgba(255,255,255,0.35)" />
              </Pressable>

              {/* Añadir a playlist */}
              <Pressable
                style={styles.optRow}
                onPress={() => { closeSheet(); setTimeout(() => setShowPlaylistSheet(true), 300); }}
              >
                <Feather name="list" size={18} color="#FBFBFB" style={styles.optIcon} />
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
                  <Feather name="user-plus" size={18} color="#FBFBFB" style={styles.optIcon} />
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

      {/* ── Temporizador Sheet (Tarea #193) ───────────────────────────────── */}
      <Modal
        visible={showTimerSheet}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTimerSheet(false)}
        statusBarTranslucent
      >
        <View style={[StyleSheet.absoluteFill, { justifyContent: "flex-end" }]} pointerEvents="box-none">
          <Pressable
            style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.45)" }]}
            onPress={() => setShowTimerSheet(false)}
          />
          <View style={[styles.timerSheet, { paddingBottom: bottomPad + 16 }]}>
            <LinearGradient
              colors={theme.id === "tibet" ? ["#2d1c52", "#1f2a62"] : [theme.gradient[0] as string, theme.gradient[0] as string]}
              style={[StyleSheet.absoluteFill, { borderTopLeftRadius: 24, borderTopRightRadius: 24 }]}
              pointerEvents="none"
            />
            <View style={styles.optHandle} />
            <View style={styles.timerSheetHeader}>
              <Feather name="clock" size={18} color="#FBFBFB" />
              <Text style={styles.timerSheetTitle}>Temporizador</Text>
              {sleepTimerRemaining !== null && (
                <Text style={styles.timerSheetRemaining}>{formatRemaining(sleepTimerRemaining)}</Text>
              )}
            </View>
            <View style={styles.timerChips}>
              {TIMER_OPTIONS.map((opt) => {
                const selected = selectedTimerMinutes === opt.minutes;
                return (
                  <Pressable
                    key={opt.label}
                    style={[styles.timerChip, selected && styles.timerChipSelected]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      handleSelectTimer(opt.minutes);
                    }}
                  >
                    <Text style={[styles.timerChipText, selected && styles.timerChipTextSelected]}>
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
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

  // Fondo
  heroContainer: {
    overflow: "hidden",
  },

  // Overlay oscuro (se desvanece con la UI)
  darkOverlay: {
    backgroundColor: "rgba(0,0,0,0.50)",
  },

  // Fila superior: chevron izq + descarga der
  topRow: {
    position: "absolute",
    top: 0,
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 20,
  },
  topCircleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },

  // Columna de contenido principal (ocupa toda la pantalla)
  mainContent: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 28,
    flexDirection: "column",
  },

  // Título grande centrado
  titleText: {
    fontFamily: "Manrope",
    fontSize: 25,
    fontWeight: "800",
    color: "#FBFBFB",
    letterSpacing: 0.1,
    textAlign: "center",
    marginBottom: 10,
  },

  // Descripción corta del reproductor
  playerDesc: {
    fontFamily: "Manrope",
    fontSize: 14,
    fontWeight: "400",
    color: "#F4F4F4",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 14,
  },

  // Sección autor/voz
  authorSection: {
    alignItems: "center",
    marginTop: 2,
  },
  authorLabel: {
    fontFamily: "Manrope",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2.2,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.42)",
    marginBottom: 3,
  },
  authorName: {
    fontFamily: "Manrope",
    fontSize: 15,
    fontWeight: "300",
    color: "rgba(255,255,255,0.88)",
    letterSpacing: 0.2,
  },

  // Fila de acciones (♥ compartir playlist)
  actionRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 36,
    marginBottom: 28,
  },
  actionBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "rgba(255,255,255,0.10)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },

  // Fila de controles (ajustes · back15 · play · fwd15 · stop)
  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
    marginBottom: 20,
  },
  ctrlBtn: {
    alignItems: "center",
    justifyContent: "center",
    width: 44,
    height: 44,
    gap: 2,
  },
  ctrlSkipLabel: {
    fontFamily: "Manrope",
    color: "rgba(255,255,255,0.75)",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  playBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.28)",
    alignItems: "center",
    justifyContent: "center",
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

  // Etiquetas tiempo
  timeLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  timeLabelText: {
    fontFamily: "Manrope",
    fontSize: 12,
    color: "#F4F4F4",
  },

  noSession: { fontFamily: "Manrope", fontSize: 16, marginTop: 16, marginBottom: 24 },
  backBtnSolo: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, borderWidth: 1 },

  // Sliders
  sliderSection: {},
  sliderHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 },
  sliderLabel: {
    fontFamily: "Manrope",
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    flex: 1,
    color: "rgba(255,255,255,0.50)",
  },
  sliderPercent: { fontFamily: "Manrope", fontSize: 11, fontWeight: "700", letterSpacing: 0.5, color: "rgba(255,255,255,0.80)" },
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
  timerLabel: { fontFamily: "Manrope", fontSize: 11, letterSpacing: 0.5, textTransform: "uppercase", color: "rgba(255,255,255,0.50)" },
  timerCountdown: { fontFamily: "Manrope", fontSize: 11, fontWeight: "700", letterSpacing: 0.5, color: "rgba(255,255,255,0.80)" },
  timerSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 10,
    paddingHorizontal: 20,
    overflow: "hidden",
  },
  timerSheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 14,
    marginBottom: 16,
  },
  timerSheetTitle: {
    fontFamily: "Manrope",
    fontSize: 16,
    fontWeight: "700",
    color: "#FBFBFB",
    flex: 1,
  },
  timerSheetRemaining: {
    fontFamily: "Manrope",
    fontSize: 14,
    fontWeight: "700",
    color: "#BE9650",
  },
  timerChips: { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingVertical: 2 },
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
  timerChipText: { fontFamily: "Manrope", fontSize: 13, fontWeight: "600", color: "#F4F4F4" },
  timerChipTextSelected: { color: "#FBFBFB" },

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
    fontFamily: "Manrope",
    fontSize: 15,
    fontWeight: "700",
    color: "#FBFBFB",
    lineHeight: 20,
    marginBottom: 3,
  },
  optSessionAuthor: {
    fontFamily: "Manrope",
    fontSize: 13,
    fontWeight: "300",
    color: "#F4F4F4",
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
    fontFamily: "Manrope",
    marginRight: 16,
    width: 22,
    textAlign: "center",
  },
  optRowText: {
    fontFamily: "Manrope",
    fontSize: 16,
    color: "#FBFBFB",
    flex: 1,
  },
  optRowBadge: {
    fontFamily: "Manrope",
    fontSize: 13,
    color: "rgba(255,255,255,0.50)",
    marginRight: 6,
  },
  optRowMuted: {
    fontFamily: "Manrope",
    fontSize: 12,
    color: "rgba(255,255,255,0.35)",
    fontStyle: "italic",
  },
  optSliderItem: {
    paddingBottom: 8,
  },
});
