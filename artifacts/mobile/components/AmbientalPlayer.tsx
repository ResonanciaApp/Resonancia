import { Feather, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useEffect, useRef } from "react";
import {
  Alert,
  Image,
  Modal,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path, Rect } from "react-native-svg";

import { useNotifications } from "@/context/NotificationsContext";
import { usePlayer } from "@/context/PlayerContext";
import { useSceneTheme } from "@/context/SceneThemeContext";
import type { Session } from "@/data/sessions";

type Props = {
  visible: boolean;
  session: Session | null;
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
  const matchedSessionRef = useRef(false);
  const ownsPlaybackRef = useRef(false);
  const currentSessionIdRef = useRef<string | null>(null);
  currentSessionIdRef.current = currentSession?.id ?? null;

  useEffect(() => {
    if (!visible) {
      matchedSessionRef.current = false;
      ownsPlaybackRef.current = false;
      return;
    }
    if (session && currentSession?.id === session.id) {
      matchedSessionRef.current = true;
      ownsPlaybackRef.current = true;
    } else if (matchedSessionRef.current) {
      ownsPlaybackRef.current = false;
    }
  }, [currentSession?.id, session, visible]);

  useEffect(() => {
    if (!visible || !matchedSessionRef.current) return;

    const sessionChanged =
      currentSession === null || currentSession.id !== session?.id;
    const timerFinished =
      sleepTimerRemaining === null && !isPlaying && !isLoading;

    if (sessionChanged) {
      ownsPlaybackRef.current = false;
      onClose();
      return;
    }

    if (timerFinished) {
      ownsPlaybackRef.current = false;
      void stop();
      onClose();
    }
  }, [
    currentSession,
    isLoading,
    isPlaying,
    onClose,
    session?.id,
    sleepTimerRemaining,
    stop,
    visible,
  ]);

  const confirmExit = useCallback(() => {
    const ownerSessionId = session?.id ?? null;
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
              ownerSessionId !== null &&
              currentSessionIdRef.current === ownerSessionId;
            ownsPlaybackRef.current = false;
            if (stillOwnsPlayback) {
              void stop();
            }
            onClose();
          },
        },
        {
          text: "No",
          style: "cancel",
        },
      ],
    );
  }, [onClose, session?.id, stop]);

  const handlePlayPause = useCallback(() => {
    if (!currentSession || isLoading) return;
    void pauseResume();
  }, [currentSession, isLoading, pauseResume]);

  const countdown =
    sleepTimerRemaining ?? Math.max(0, initialMinutes * 60);
  const sleepTabSurface =
    theme.id === "tibet"
      ? "rgba(0,0,0,0.15)"
      : theme.id === "indigo"
        ? "rgba(42,40,64,0.65)"
        : "rgba(255,255,255,0.05)";

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      statusBarTranslucent
      onRequestClose={confirmExit}
    >
      <StatusBar hidden />
      <LinearGradient
        colors={theme.gradient}
        locations={theme.gradientLocations}
        style={styles.root}
      >
        {session?.image && (
          <>
            <Image
              source={session.image}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
              accessibilityIgnoresInvertColors
            />
            <View
              pointerEvents="none"
              style={styles.imageOverlay}
            />
          </>
        )}
        <View
          style={[
            styles.header,
            { top: Math.max(insets.top, 18) + 4 },
          ]}
        >
          <Pressable
            onPress={confirmExit}
            style={({ pressed }) => [
              styles.headerButton,
              { backgroundColor: sleepTabSurface },
              pressed && styles.buttonPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Cerrar reproductor"
            hitSlop={8}
          >
            <Feather name="x" size={24} color="#FFFFFF" />
          </Pressable>

          <Text style={styles.headerTitle}>Contador</Text>

          <View
            style={[styles.headerButton, { backgroundColor: sleepTabSurface }]}
            accessible={false}
            importantForAccessibility="no"
            accessibilityLabel={
              unreadCount > 0
                ? `${unreadCount} notificaciones sin leer`
                : "Notificaciones"
            }
          >
            <Ionicons name="notifications" size={22} color="#FFFFFF" />
            {unreadCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {unreadCount > 9 ? "9+" : unreadCount}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.center}>
          <Text
            style={styles.countdown}
            accessibilityRole="timer"
            accessibilityLabel={`${formatCountdown(countdown)} restantes`}
            testID="ambiental-player-countdown"
          >
            {formatCountdown(countdown)}
          </Text>

          <View style={styles.controls}>
            <Pressable
              onPress={handlePlayPause}
              disabled={isLoading || !currentSession}
              style={({ pressed }) => [
                styles.controlButton,
                { backgroundColor: sleepTabSurface },
                pressed && styles.buttonPressed,
                (isLoading || !currentSession) && styles.buttonDisabled,
              ]}
              accessibilityRole="button"
              accessibilityLabel={isPlaying ? "Pausar" : "Reproducir"}
              testID="ambiental-player-play-pause"
            >
              {isPlaying ? (
                <Svg width={30} height={30} viewBox="0 0 46 46">
                  <Rect
                    x="8"
                    y="6"
                    width="11"
                    height="34"
                    rx="4"
                    fill="#FFFFFF"
                  />
                  <Rect
                    x="27"
                    y="6"
                    width="11"
                    height="34"
                    rx="4"
                    fill="#FFFFFF"
                  />
                </Svg>
              ) : (
                <Svg width={30} height={30} viewBox="0 0 46 46">
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
                styles.controlButton,
                { backgroundColor: sleepTabSurface },
                pressed && styles.buttonPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Detener sesión"
              testID="ambiental-player-stop"
            >
              <Svg width={29} height={29} viewBox="0 0 24 24">
                <Rect
                  x="4"
                  y="4"
                  width="16"
                  height="16"
                  rx="1.5"
                  fill="#FFFFFF"
                />
              </Svg>
            </Pressable>
          </View>
        </View>
      </LinearGradient>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.42)",
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
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.10)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.14)",
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
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  countdown: {
    color: "#FFFFFF",
    fontFamily: "Manrope",
    fontSize: 64,
    fontWeight: "500",
    letterSpacing: 2,
    fontVariant: ["tabular-nums"],
  },
  controls: {
    marginTop: 92,
    flexDirection: "row",
    alignItems: "center",
    gap: 22,
  },
  controlButton: {
    width: 78,
    height: 78,
    borderRadius: 39,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.10)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.14)",
  },
  buttonPressed: {
    opacity: 0.72,
    transform: [{ scale: 0.97 }],
  },
  buttonDisabled: {
    opacity: 0.45,
  },
});