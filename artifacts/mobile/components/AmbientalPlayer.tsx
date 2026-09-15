import { Feather, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Alert,
  Animated,
  BackHandler,
  Image,
  type ImageSourcePropType,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path, Rect } from "react-native-svg";

import { useNotifications } from "@/context/NotificationsContext";
import { type MixPreset, useMixer } from "@/context/MixerContext";
import { usePlayer } from "@/context/PlayerContext";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { getMixImage } from "@/config/mix-images";
import type { Session } from "@/data/sessions";

const FADE_DURATION = 450;
const AUTO_HIDE_DELAY = 4000;
const SLIDE_DURATION = 400;
const SLIDE_OFFSET = 900;

type Props = {
  visible: boolean;
  session: Session | null;
  mix?: MixPreset | null;
  initialMinutes: number;
  onClose: () => void;
};

function formatCountdown(seconds: number) {
  const safeSeconds = Math.max(0, Math.ceil(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

export function AmbientalPlayer({
  visible,
  session,
  mix = null,
  initialMinutes,
  onClose,
}: Props) {
  const insets = useSafeAreaInsets();
  const { theme } = useSceneTheme();
  const { unreadCount } = useNotifications();
  const {
    currentSession,
    isPlaying,
    isLoading,
    pauseResume,
    sleepTimerRemaining,
    stop,
  } = usePlayer();
  const {
    loadedPresetId,
    isPlaying: isMixPlaying,
    sleepTimerRemaining: mixTimerRemaining,
    togglePlay: toggleMixPlay,
    stopAll: stopMix,
  } = useMixer();
  const isMixMode = mix !== null;
  const playbackId = isMixMode ? loadedPresetId : currentSession?.id ?? null;
  const targetId = isMixMode ? mix.id : session?.id ?? null;
  const playbackIsPlaying = isMixMode ? isMixPlaying : isPlaying;
  const playbackIsLoading = isMixMode ? false : isLoading;
  const playbackTimerRemaining = isMixMode
    ? mixTimerRemaining
    : sleepTimerRemaining;

  // ── Slide-in/out animation ────────────────────────────────────────────────
  const [rendered, setRendered] = useState(false);
  const slideAnim = useRef(new Animated.Value(SLIDE_OFFSET)).current;

  // ── UI auto-hide animation ────────────────────────────────────────────────
  const uiOpacity = useRef(new Animated.Value(1)).current;
  const uiVisibleRef = useRef(true);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearHideTimer = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  const scheduleHide = useCallback(() => {
    clearHideTimer();
    hideTimerRef.current = setTimeout(() => {
      uiVisibleRef.current = false;
      Animated.timing(uiOpacity, {
        toValue: 0,
        duration: FADE_DURATION,
        useNativeDriver: true,
      }).start();
    }, AUTO_HIDE_DELAY);
  }, [clearHideTimer, uiOpacity]);

  const showUI = useCallback(() => {
    uiVisibleRef.current = true;
    Animated.timing(uiOpacity, {
      toValue: 1,
      duration: FADE_DURATION,
      useNativeDriver: true,
    }).start(() => scheduleHide());
  }, [uiOpacity, scheduleHide]);

  const handleScreenTap = useCallback(() => {
    if (!uiVisibleRef.current) {
      showUI();
    } else {
      scheduleHide();
    }
  }, [showUI, scheduleHide]);

  // ── Slide lifecycle ───────────────────────────────────────────────────────
  useEffect(() => {
    if (visible) {
      uiOpacity.setValue(1);
      uiVisibleRef.current = true;
      clearHideTimer();
      setRendered(true);
      slideAnim.stopAnimation();
      slideAnim.setValue(SLIDE_OFFSET);
      requestAnimationFrame(() => {
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: SLIDE_DURATION,
          useNativeDriver: true,
        }).start(({ finished }) => {
          if (finished) scheduleHide();
        });
      });
    } else {
      clearHideTimer();
      uiOpacity.setValue(1);
      uiVisibleRef.current = true;
      if (!rendered) return;
      slideAnim.stopAnimation();
      Animated.timing(slideAnim, {
        toValue: SLIDE_OFFSET,
        duration: SLIDE_DURATION,
        useNativeDriver: true,
      }).start(() => {
        setRendered(false);
        slideAnim.setValue(SLIDE_OFFSET);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // ── Session ownership tracking ────────────────────────────────────────────
  const matchedSessionRef = useRef(false);
  const ownsPlaybackRef = useRef(false);
  const playbackIdRef = useRef<string | null>(null);
  playbackIdRef.current = playbackId;

  useEffect(() => {
    if (!visible) {
      matchedSessionRef.current = false;
      ownsPlaybackRef.current = false;
      return;
    }
    if (targetId !== null && playbackId === targetId) {
      matchedSessionRef.current = true;
      ownsPlaybackRef.current = true;
    } else if (matchedSessionRef.current) {
      ownsPlaybackRef.current = false;
    }
  }, [playbackId, targetId, visible]);

  useEffect(() => {
    if (!visible || !matchedSessionRef.current) return;
    const sessionChanged = playbackId === null || playbackId !== targetId;
    const timerFinished =
      playbackTimerRemaining === null &&
      !playbackIsPlaying &&
      !playbackIsLoading;
    if (sessionChanged) {
      ownsPlaybackRef.current = false;
      onClose();
      return;
    }
    if (timerFinished) {
      ownsPlaybackRef.current = false;
      if (isMixMode) stopMix();
      else void stop();
      onClose();
    }
  }, [
    isMixMode,
    onClose,
    playbackId,
    playbackIsLoading,
    playbackIsPlaying,
    playbackTimerRemaining,
    stop,
    stopMix,
    targetId,
    visible,
  ]);

  // ── Android back button ───────────────────────────────────────────────────
  const confirmExitRef = useRef<() => void>(() => undefined);

  const confirmExit = useCallback(() => {
    clearHideTimer();
    const ownerPlaybackId = targetId;
    Alert.alert(
      "¿Estás seguro/a de que quieres salir?",
      "Si sales, no podrás continuar desde donde lo dejaste.",
      [
        {
          text: "Sí",
          style: "destructive",
          onPress: () => {
            const stillOwnsPlayback =
              ownsPlaybackRef.current &&
              ownerPlaybackId !== null &&
              playbackIdRef.current === ownerPlaybackId;
            ownsPlaybackRef.current = false;
            if (stillOwnsPlayback) {
              if (isMixMode) stopMix();
              else void stop();
            }
            onClose();
          },
        },
        { text: "No", style: "cancel", onPress: scheduleHide },
      ],
    );
  }, [
    clearHideTimer,
    isMixMode,
    onClose,
    scheduleHide,
    stop,
    stopMix,
    targetId,
  ]);

  confirmExitRef.current = confirmExit;

  useEffect(() => {
    if (!rendered) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      confirmExitRef.current();
      return true;
    });
    return () => sub.remove();
  }, [rendered]);

  // ── Render ────────────────────────────────────────────────────────────────
  const handlePlayPause = useCallback(() => {
    if (playbackId !== targetId || playbackIsLoading) return;
    if (isMixMode) toggleMixPlay();
    else void pauseResume();
  }, [
    isMixMode,
    pauseResume,
    playbackId,
    playbackIsLoading,
    targetId,
    toggleMixPlay,
  ]);

  // Keep the current source during the exit animation, but reset it when a new
  // target opens so a mix can never inherit an earlier session image.
  const activeImage: ImageSourcePropType | null = isMixMode
    ? mix.coverUri
      ? { uri: mix.coverUri }
      : mix.image
        ? (getMixImage(mix.image) ?? null)
        : null
    : session?.image ?? null;
  const lastImageRef = useRef<ImageSourcePropType | null>(null);
  if (visible) lastImageRef.current = activeImage;
  const displayImage = visible ? activeImage : lastImageRef.current;

  const countdown =
    playbackTimerRemaining ?? Math.max(0, initialMinutes * 60);

  if (!rendered) return null;

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <StatusBar hidden={visible} />
      <Animated.View
        style={[styles.root, { transform: [{ translateY: slideAnim }] }]}
      >
        <LinearGradient
          colors={theme.gradient}
          locations={theme.gradientLocations}
          style={StyleSheet.absoluteFill}
        />

        {displayImage && (
          <>
            <Image
              source={displayImage}
              style={[
                styles.fullscreenImage,
                isMixMode && styles.mixFullscreenImage,
              ]}
              resizeMode="cover"
              accessibilityIgnoresInvertColors
            />
            <View pointerEvents="none" style={styles.imageOverlay} />
          </>
        )}

        <TouchableWithoutFeedback onPress={handleScreenTap} accessible={false}>
          <View style={StyleSheet.absoluteFill} />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[styles.uiLayer, { opacity: uiOpacity }]}
          pointerEvents="box-none"
        >
          <View style={[styles.header, { top: Math.max(insets.top, 18) + 4 }]}>
            <Pressable
              onPress={confirmExit}
              style={({ pressed }) => [
                styles.ghostPill,
                pressed && styles.buttonPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Cerrar reproductor"
              hitSlop={8}
            >
              <Feather name="x" size={22} color="#FFFFFF" />
            </Pressable>

            <Text style={styles.headerTitle}>Contador</Text>

            <View
              style={styles.ghostPill}
              accessible={false}
              importantForAccessibility="no"
            >
              <Ionicons name="notifications" size={20} color="#FFFFFF" />
              {unreadCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.countdownContainer} pointerEvents="none">
            <Text
              style={styles.countdown}
              accessibilityRole="timer"
              accessibilityLabel={`${formatCountdown(countdown)} restantes`}
              testID="ambiental-player-countdown"
            >
              {formatCountdown(countdown)}
            </Text>
          </View>

          <View
            style={[
              styles.controlsContainer,
              { bottom: Math.max(insets.bottom, 24) + 64 },
            ]}
            pointerEvents="box-none"
          >
            <Pressable
              onPress={handlePlayPause}
              disabled={playbackIsLoading || playbackId !== targetId}
              style={({ pressed }) => [
                styles.ghostPillLarge,
                pressed && styles.buttonPressed,
                (playbackIsLoading || playbackId !== targetId) &&
                  styles.buttonDisabled,
              ]}
              accessibilityRole="button"
              accessibilityLabel={
                playbackIsPlaying ? "Pausar" : "Reproducir"
              }
              testID="ambiental-player-play-pause"
            >
              {playbackIsPlaying ? (
                <Svg width={33} height={33} viewBox="0 0 46 46">
                  <Rect x="8"  y="6" width="11" height="34" rx="4" fill="#FFFFFF" />
                  <Rect x="27" y="6" width="11" height="34" rx="4" fill="#FFFFFF" />
                </Svg>
              ) : (
                <Svg width={33} height={33} viewBox="0 0 46 46">
                  <Path
                    d="M 13.2 7.1 Q 8 4 8 10 L 8 36 Q 8 42 13.2 38.9 L 34.8 26.1 Q 40 23 34.8 19.9 Z"
                    fill="#FFFFFF"
                  />
                </Svg>
              )}
            </Pressable>

            <Pressable
              onPress={confirmExit}
              style={({ pressed }) => [
                styles.ghostPillLarge,
                pressed && styles.buttonPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={
                isMixMode ? "Detener mezcla" : "Detener sesión"
              }
              testID="ambiental-player-stop"
            >
              <Svg width={31} height={31} viewBox="0 0 24 24">
                <Rect x="4" y="4" width="16" height="16" rx="1.5" fill="#FFFFFF" />
              </Svg>
            </Pressable>
          </View>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const GHOST_BG = "rgba(255,255,255,0.18)";
const GHOST_BORDER = "rgba(255,255,255,0.30)";

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    elevation: 99,
  },
  root: {
    flex: 1,
  },
  fullscreenImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  mixFullscreenImage: {
    transform: [{ scale: 1.12 }],
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.42)",
  },
  uiLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  header: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  ghostPill: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: GHOST_BG,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: GHOST_BORDER,
  },
  ghostPillLarge: {
    width: 98,
    height: 98,
    borderRadius: 49,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: GHOST_BG,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: GHOST_BORDER,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontFamily: "Manrope",
    fontSize: 16,
    fontWeight: "600",
  },
  notificationBadge: {
    position: "absolute",
    top: 4,
    right: 3,
    minWidth: 15,
    height: 15,
    paddingHorizontal: 3,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#BE9650",
  },
  notificationBadgeText: {
    color: "#FFFFFF",
    fontFamily: "Manrope",
    fontSize: 8,
    fontWeight: "800",
    lineHeight: 10,
  },
  countdownContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  countdown: {
    color: "#FFFFFF",
    fontFamily: "Manrope",
    fontSize: 64,
    fontWeight: "500",
    letterSpacing: 2,
    fontVariant: ["tabular-nums"],
  },
  controlsContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 22,
  },
  buttonPressed: {
    opacity: 0.72,
    transform: [{ scale: 0.97 }],
  },
  buttonDisabled: {
    opacity: 0.45,
  },
});
