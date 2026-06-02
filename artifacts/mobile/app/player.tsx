import { Feather } from "@expo/vector-icons";
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

import { GlowRing } from "@/components/GlowRing";
import { SacredBackground } from "@/components/SacredBackground";
import { usePlayer } from "@/context/PlayerContext";
import { getArtist } from "@/data/artists";
import { CATEGORIES } from "@/data/categories";
import { useColors } from "@/hooks/useColors";

const { width } = Dimensions.get("window");
const ART_SIZE = width * 0.72;

/** Darken a hex color toward black. `amount` is 0..1 (1 = black). */
function darkenHex(hex: string, amount: number): string {
  const h = hex.replace("#", "");
  if (h.length !== 6) return hex;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const k = Math.max(0, Math.min(1, 1 - amount));
  const toHex = (n: number) => Math.round(n * k).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function BreathingPulse({ isPlaying }: { isPlaying: boolean }) {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (isPlaying) {
      scale.value = withRepeat(
        withTiming(1.12, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    } else {
      cancelAnimation(scale);
      scale.value = withTiming(1, { duration: 800 });
    }
    return () => cancelAnimation(scale);
  }, [isPlaying]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[
        {
          width: ART_SIZE + 40,
          height: ART_SIZE + 40,
          borderRadius: (ART_SIZE + 40) / 2,
          position: "absolute",
          backgroundColor: "rgba(182,149,95,0.05)",
          borderWidth: 1,
          borderColor: "rgba(182,149,95,0.15)",
        },
        animStyle,
      ]}
    />
  );
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

  // ── All hooks before early return ────────────────────────────────────────
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


  const handleVoiceGrant = useCallback(
    (e: GestureResponderEvent) => {
      voiceTrackRef.current?.measure((_x, _y, _w, _h, px) => {
        voiceTrackPageX.current = px;
        const vol = Math.max(0, Math.min(1, (e.nativeEvent.pageX - px) / voiceTrackWidth.current));
        setVoiceVolume(vol);
      });
    },
    [setVoiceVolume]
  );

  const handleVoiceMove = useCallback(
    (e: GestureResponderEvent) => {
      const vol = Math.max(0, Math.min(1, (e.nativeEvent.pageX - voiceTrackPageX.current) / voiceTrackWidth.current));
      setVoiceVolume(vol);
    },
    [setVoiceVolume]
  );

  const handleAmbientGrant = useCallback(
    (e: GestureResponderEvent) => {
      ambientTrackRef.current?.measure((_x, _y, _w, _h, px) => {
        ambientTrackPageX.current = px;
        const vol = Math.max(0, Math.min(1, (e.nativeEvent.pageX - px) / ambientTrackWidth.current));
        setAmbientVolume(vol);
      });
    },
    [setAmbientVolume]
  );

  const handleAmbientMove = useCallback(
    (e: GestureResponderEvent) => {
      const vol = Math.max(0, Math.min(1, (e.nativeEvent.pageX - ambientTrackPageX.current) / ambientTrackWidth.current));
      setAmbientVolume(vol);
    },
    [setAmbientVolume]
  );

  const handleSelectTimer = useCallback(
    (minutes: number | null) => {
      setSelectedTimerMinutes(minutes);
      setSleepTimer(minutes);
    },
    [setSleepTimer]
  );

  useEffect(() => {
    if (sleepTimerRemaining === null && selectedTimerMinutes !== null) {
      setSelectedTimerMinutes(null);
    }
  }, [sleepTimerRemaining]);

  useEffect(() => {
    if (!isSeekingRef.current) {
      // Smoothly animate to the new audio position over the polling interval
      // (~500ms) so the bar moves continuously instead of jumping every tick.
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
  const handleProgressGrant = useCallback(
    (e: GestureResponderEvent) => {
      isSeekingRef.current = true;
      const p = Math.max(0, Math.min(1, (e.nativeEvent.pageX - progressBarPageX.current) / progressBarWidthShared.value));
      progressShared.value = p;
    },
    [progressShared, progressBarWidthShared]
  );

  const handleProgressMove = useCallback(
    (e: GestureResponderEvent) => {
      const p = Math.max(0, Math.min(1, (e.nativeEvent.pageX - progressBarPageX.current) / progressBarWidthShared.value));
      progressShared.value = p;
    },
    [progressShared, progressBarWidthShared]
  );

  const handleProgressRelease = useCallback(
    (e: GestureResponderEvent) => {
      const p = Math.max(0, Math.min(1, (e.nativeEvent.pageX - progressBarPageX.current) / progressBarWidthShared.value));
      progressShared.value = p;
      seekTo(p);
      // Keep ignoring context progress updates for a short window so a stale
      // poll (reporting the old audio position before setPositionAsync took
      // effect) can't snap the bar back.
      setTimeout(() => {
        isSeekingRef.current = false;
      }, 700);
    },
    [progressShared, progressBarWidthShared, seekTo]
  );
  // ─────────────────────────────────────────────────────────────────────────

  const topPad = Platform.OS === "web" ? 20 : 12;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  if (!currentSession) {
    return (
      <View
        style={[
          styles.root,
          { backgroundColor: colors.background, justifyContent: "center", alignItems: "center" },
        ]}
      >
        <Feather name="music" size={40} color={colors.border} />
        <Text style={[styles.noSession, { color: colors.mutedForeground }]}>No hay sesión activa</Text>
        <Pressable onPress={() => router.back()} style={[styles.backBtnSolo, { borderColor: colors.border }]}>
          <Text style={{ color: colors.mutedForeground }}>Volver</Text>
        </Pressable>
      </View>
    );
  }

  const isMusicaYSonidos = currentSession.categoryId === "musica-sonidos";
  // Solo los "Sonidos Naturaleza" son loops con duración elegida por el usuario.
  // "Música Ambient" / "Música Enteógena" son pistas con duración fija.
  const isLoopSession = isMusicaYSonidos && currentSession.soundTag === "Sonidos Naturaleza";
  // Música Ambient / Enteógena llevan crédito de artista (default Resonancia).
  const showArtist =
    isMusicaYSonidos &&
    (currentSession.soundTag === "Música Ambient" || currentSession.soundTag === "Música Enteógena");
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

  // Fondo derivado de la categoría (mismo cálculo que session/[id].tsx)
  // para que el reproductor herede el color de cada categoría.
  const playerCategory = CATEGORIES.find((c) => c.id === currentSession.categoryId);
  let playerBg: string;
  if (playerCategory?.id === "sonidos-ancestrales") {
    playerBg = colors.background;
  } else {
    const baseHex =
      playerCategory?.id === "sabiduria-dia"
        ? "#3E260A"
        : playerCategory?.gradient[1] ?? colors.background;
    playerBg = darkenHex(baseHex, 0.6);
  }

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

  return (
    <View style={[styles.root, { backgroundColor: playerBg }]}>
      <StatusBar hidden />
      <ExpoImage
        source={currentSession.image as any}
        style={[StyleSheet.absoluteFill, { opacity: 0.12 }]}
        contentFit="cover"
        blurRadius={20}
      />
      <LinearGradient
        colors={[playerBg, "transparent", playerBg]}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView showsVerticalScrollIndicator={false} bounces={false} contentContainerStyle={[styles.scrollContent, { paddingTop: topPad + 8 }]}>
        {/* Art + Glow */}
        <View style={styles.artSection}>
          <GlowRing size={ART_SIZE + 80} color="rgba(182,149,95,0.12)" delay={0} duration={4000} />
          <GlowRing size={ART_SIZE + 120} color="rgba(182,149,95,0.07)" delay={700} duration={4000} />
          <BreathingPulse isPlaying={isPlaying} />
          <View style={[styles.artFrame, { borderColor: "rgba(182,149,95,0.25)" }]}>
            <ExpoImage
              source={currentSession.image as any}
              style={styles.artImage}
              contentFit="cover"
              placeholder={BLUR_PLACEHOLDER}
              transition={IMAGE_TRANSITION}
            />
            <LinearGradient
              colors={["transparent", "rgba(24,17,12,0.4)"]}
              style={[StyleSheet.absoluteFill, { borderRadius: ART_SIZE / 2 }]}
            />
          </View>
        </View>

        {/* Info */}
        <View style={styles.infoSection}>
          <Text style={[styles.category, { color: colors.accent }]}>
            {showArtist ? currentSession.soundTag : currentSession.categoryLabel}
          </Text>
          <Text style={[styles.sessionTitle, { color: colors.foreground }]}>{currentSession.title}</Text>
          {!showArtist && (
            <Text style={[styles.sessionSub, { color: colors.mutedForeground }]}>{currentSession.subtitle}</Text>
          )}
          {showArtist && (
            <Pressable
              onPress={() => router.push(`/artista/${artist.id}` as never)}
              style={styles.artistRow}
              hitSlop={6}
            >
              <Feather name="user" size={12} color={colors.foreground} />
              <Text style={[styles.artistText, { color: colors.foreground }]}>
                Artista: <Text style={{ color: colors.accent }}>{artist.name}</Text>
              </Text>
              {artist.certified && <Feather name="check-circle" size={12} color={colors.accent} />}
            </Pressable>
          )}
          {isLoopSession && (
            <View style={styles.durationChip}>
              <Feather name="clock" size={11} color="#A8D49F" />
              <Text style={styles.durationChipText}>
                Apagar en {formatRemaining(Math.max(0, totalSeconds - elapsed))}
              </Text>
            </View>
          )}
        </View>

        {/* Progress */}
        <View style={styles.progressSection}>
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
            <View style={[styles.progressBg, { backgroundColor: colors.secondary }]}>
              <Animated.View
                style={[styles.progressFill, fillAnimStyle, { backgroundColor: colors.primary }]}
              />
              <Animated.View
                style={[styles.progressThumb, thumbAnimStyle, { backgroundColor: colors.primary }]}
              />
            </View>
          </View>
          <View style={styles.timeRow}>
            <Text style={[styles.timeText, { color: colors.mutedForeground }]}>{formatTime(elapsed)}</Text>
            <Text style={[styles.timeText, { color: colors.mutedForeground }]}>-{formatTime(remaining)}</Text>
          </View>
        </View>

        {/* Controls */}
        <View style={[styles.controlsWrapper, { paddingBottom: 8 }]}>
          {Platform.OS !== "web" ? (
            <BlurView intensity={18} tint="dark" style={StyleSheet.absoluteFill} />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(24,17,12,0.55)" }]} />
          )}
          <View style={styles.controls}>
            <Pressable onPress={skipBackward} style={styles.controlSide}>
              <Feather name="skip-back" size={24} color={colors.foreground} />
              <Text style={[styles.skipLabel, { color: colors.mutedForeground }]}>10s</Text>
            </Pressable>

            <View style={styles.playOuter}>
              <View style={[styles.playRing, { borderColor: "rgba(182,149,95,0.25)" }]} />
              <Pressable
                onPress={handlePlayPause}
                disabled={isLoading}
                style={[styles.playButton, { backgroundColor: colors.primary, opacity: isLoading ? 0.7 : 1 }]}
              >
                {isLoading ? (
                  <Feather name="loader" size={32} color={colors.primaryForeground} />
                ) : (
                  <Feather
                    name={isPlaying ? "pause" : "play"}
                    size={32}
                    color={colors.primaryForeground}
                    style={isPlaying ? undefined : { paddingLeft: 4 }}
                  />
                )}
              </Pressable>
            </View>

            <Pressable onPress={skipForward} style={styles.controlSide}>
              <Feather name="skip-forward" size={24} color={colors.foreground} />
              <Text style={[styles.skipLabel, { color: colors.mutedForeground }]}>10s</Text>
            </Pressable>
          </View>
        </View>

        {/* Voice slider — for sessions with guided voice track */}
        {hasVoiceTrack && (
          <View style={[styles.sliderSection, { paddingHorizontal: 32, marginTop: 20, marginBottom: 8 }]}>
            <View style={styles.sliderHeader}>
              <Feather name="mic" size={13} color={colors.mutedForeground} />
              <Text style={[styles.sliderLabel, { color: colors.mutedForeground }]}>Voz guiada</Text>
              <Text style={[styles.sliderPercent, { color: colors.accent }]}>
                {Math.round(voiceVolume * 100)}%
              </Text>
            </View>
            <View
              ref={voiceTrackRef}
              style={styles.sliderHitArea}
              onLayout={(e: LayoutChangeEvent) => {
                voiceTrackWidth.current = e.nativeEvent.layout.width;
              }}
              onStartShouldSetResponder={() => true}
              onMoveShouldSetResponder={() => true}
              onResponderGrant={handleVoiceGrant}
              onResponderMove={handleVoiceMove}
            >
              <View style={[styles.sliderTrack, { backgroundColor: colors.secondary }]}>
                <View
                  pointerEvents="none"
                  style={[styles.sliderFill, { width: `${voiceVolume * 100}%`, backgroundColor: colors.accent }]}
                />
                <View
                  pointerEvents="none"
                  style={[styles.sliderThumb, { left: `${voiceVolume * 100}%`, backgroundColor: colors.accent }]}
                />
              </View>
            </View>
            <View style={styles.sliderHints}>
              <Text style={[styles.sliderHintText, { color: colors.mutedForeground }]}>Sin voz</Text>
              <Text style={[styles.sliderHintText, { color: colors.mutedForeground }]}>Máximo</Text>
            </View>
          </View>
        )}

        {/* Ambient slider — for sessions with layered ambient track */}
        {hasAmbientTrack && (
          <View style={[styles.sliderSection, { paddingHorizontal: 32, marginTop: 20, marginBottom: 8 }]}>
            <View style={styles.sliderHeader}>
              {!isMusicaYSonidos && (
                <Feather name="wind" size={13} color={colors.mutedForeground} />
              )}
              <Text style={[styles.sliderLabel, { color: colors.mutedForeground }]}>
                {isMusicaYSonidos ? "Sonidos Ambiente" : "Pájaros"}
              </Text>
              <Text style={[styles.sliderPercent, { color: colors.accent }]}>
                {Math.round(ambientVolume * 100)}%
              </Text>
            </View>
            <View
              ref={ambientTrackRef}
              style={styles.sliderHitArea}
              onLayout={(e: LayoutChangeEvent) => {
                ambientTrackWidth.current = e.nativeEvent.layout.width;
              }}
              onStartShouldSetResponder={() => true}
              onMoveShouldSetResponder={() => true}
              onResponderGrant={handleAmbientGrant}
              onResponderMove={handleAmbientMove}
            >
              <View style={[styles.sliderTrack, { backgroundColor: colors.secondary }]}>
                <View
                  pointerEvents="none"
                  style={[styles.sliderFill, { width: `${ambientVolume * 100}%`, backgroundColor: colors.primary }]}
                />
                <View
                  pointerEvents="none"
                  style={[styles.sliderThumb, { left: `${ambientVolume * 100}%`, backgroundColor: colors.primary }]}
                />
              </View>
            </View>
            <View style={styles.sliderHints}>
              <Text style={[styles.sliderHintText, { color: colors.mutedForeground }]}>
                {isMusicaYSonidos ? "Sin ambiente" : "Sin pájaros"}
              </Text>
              <Text style={[styles.sliderHintText, { color: colors.mutedForeground }]}>Máximo</Text>
            </View>
          </View>
        )}

        {/* Sleep Timer — at the bottom, hidden para loops (usan el picker de duración) */}
        {!isLoopSession && (
          <View style={[styles.timerSection, { paddingTop: 24, marginTop: 8 }]}>
            <View style={styles.timerHeader}>
              <Feather name="moon" size={13} color={colors.mutedForeground} />
              <Text style={[styles.timerLabel, { color: colors.mutedForeground }]}>Apagar en</Text>
              {sleepTimerRemaining !== null && (
                <Text style={[styles.timerCountdown, { color: colors.accent }]}>
                  · {formatRemaining(sleepTimerRemaining)}
                </Text>
              )}
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.timerChips}
            >
              {TIMER_OPTIONS.map((opt) => {
                const selected = opt.minutes === selectedTimerMinutes;
                return (
                  <Pressable
                    key={String(opt.minutes)}
                    onPress={() => handleSelectTimer(opt.minutes)}
                    style={[
                      styles.timerChip,
                      {
                        backgroundColor: selected ? colors.primary : "rgba(182,149,95,0.08)",
                        borderColor: selected ? colors.primary : "rgba(182,149,95,0.2)",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.timerChipText,
                        { color: selected ? colors.primaryForeground : colors.mutedForeground },
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        )}

        <View style={{ paddingBottom: bottomPad + 20 }} />
      </ScrollView>

      {/* Floating top buttons */}
      <Pressable
        onPress={() => {
          stop();
          router.back();
        }}
        style={[styles.floatingBtn, { top: topPad + 8, left: 16 }]}
        hitSlop={12}
      >
        <Feather name="x" size={26} color={colors.foreground} />
      </Pressable>
      <Pressable
        onPress={() => {
          toggleFavorite(currentSession.id);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }}
        style={[styles.floatingBtn, { top: topPad + 8, right: 16 }]}
        hitSlop={12}
      >
        <Feather name="heart" size={22} color={fav ? colors.primary : colors.mutedForeground} />
      </Pressable>
      <Pressable
        onPress={handleShare}
        style={[styles.floatingBtn, { top: topPad + 8, right: 64 }]}
        hitSlop={12}
      >
        <Feather name="share-2" size={21} color={colors.mutedForeground} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  iconBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  floatingBtn: {
    position: "absolute",
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  navCenter: {
    flex: 1,
    alignItems: "center",
  },
  navLabel: {
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: "700",
  },
  scrollContent: {
    flexGrow: 1,
  },
  artSection: {
    alignItems: "center",
    justifyContent: "center",
    height: ART_SIZE + 120,
    overflow: "visible",
  },
  artFrame: {
    width: ART_SIZE,
    height: ART_SIZE,
    borderRadius: ART_SIZE / 2,
    borderWidth: 1.5,
    overflow: "hidden",
  },
  artImage: {
    width: ART_SIZE,
    height: ART_SIZE,
    borderRadius: ART_SIZE / 2,
  },
  infoSection: {
    alignItems: "center",
    paddingHorizontal: 32,
    marginBottom: 24,
  },
  category: {
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: "700",
    marginBottom: 6,
    textTransform: "uppercase",
  },
  sessionTitle: {
    fontSize: 26,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  sessionSub: {
    fontSize: 14,
    textAlign: "center",
  },
  artistRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 8,
  },
  artistText: {
    fontSize: 13,
    fontWeight: "600",
  },
  durationChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(160,200,140,0.12)",
    borderWidth: 1,
    borderColor: "rgba(160,200,140,0.25)",
  },
  durationChipText: {
    color: "#E8F5E0",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  progressSection: {
    paddingHorizontal: 32,
    marginBottom: 20,
  },
  progressTrack: {
    paddingVertical: 10,
  },
  progressBg: {
    height: 3,
    borderRadius: 2,
    overflow: "visible",
    position: "relative",
  },
  progressFill: {
    height: 3,
    borderRadius: 2,
  },
  progressThumb: {
    position: "absolute",
    top: -5,
    width: 14,
    height: 14,
    borderRadius: 7,
    marginLeft: -7,
  },
  timeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  timeText: {
    fontSize: 12,
  },
  controlsWrapper: {
    overflow: "hidden",
    borderTopWidth: 1,
    borderTopColor: "rgba(182,149,95,0.12)",
    paddingTop: 20,
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 32,
    paddingHorizontal: 32,
    marginBottom: 16,
  },
  controlSide: {
    alignItems: "center",
    gap: 4,
  },
  skipLabel: {
    fontSize: 10,
    letterSpacing: 0.5,
  },
  playOuter: {
    alignItems: "center",
    justifyContent: "center",
  },
  playRing: {
    position: "absolute",
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 1.5,
  },
  playButton: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#B6955F",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },

  // Generic slider styles (voice / ambient)
  sliderSection: {},
  sliderHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },
  sliderLabel: {
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    flex: 1,
  },
  sliderPercent: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  sliderHitArea: {
    height: 44,
    justifyContent: "center",
    overflow: "visible",
  },
  sliderTrack: {
    height: 6,
    borderRadius: 3,
    overflow: "visible",
    position: "relative",
  },
  sliderFill: {
    height: 6,
    borderRadius: 3,
  },
  sliderThumb: {
    position: "absolute",
    top: -6,
    width: 18,
    height: 18,
    borderRadius: 9,
    marginLeft: -9,
  },
  sliderHints: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  sliderHintText: {
    fontSize: 10,
    letterSpacing: 0.3,
  },

  // Sleep timer
  timerSection: {
    paddingHorizontal: 32,
    marginBottom: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(182,149,95,0.1)",
  },
  timerHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  timerLabel: {
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  timerCountdown: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  timerChips: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 2,
  },
  timerChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  timerChipText: {
    fontSize: 13,
    fontWeight: "600",
  },

  noSession: {
    fontSize: 16,
    marginTop: 16,
    marginBottom: 24,
  },
  backBtnSolo: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
});
