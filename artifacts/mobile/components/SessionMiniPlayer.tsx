import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Svg, { Path, Rect } from "react-native-svg";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { usePlayer } from "@/context/PlayerContext";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { sessionMiniPlayerEvents } from "@/lib/miniPlayerEvents";

const SCREEN_H = Dimensions.get("window").height;
const PLAYER_H = 64;

interface Props {
  bottomOffset: number;
  topOffset: number;
  /** Oculta la barra sin desmontar (mantiene viva la suscripción al evento). */
  suppressed?: boolean;
}

export function SessionMiniPlayer({ bottomOffset, topOffset, suppressed }: Props) {
  // Misma lógica que DormirMiniPlayer al colapsar desde expanded:
  // el mini player arranca justo debajo del logo Pulso (topOffset + 56)
  // y desciende hasta su posición en reposo (bottom: bottomOffset).
  // delta = (topOffset + 56) − (SCREEN_H − bottomOffset − PLAYER_H)
  const startY = topOffset + 56 + PLAYER_H + bottomOffset - SCREEN_H;

  const { currentSession, isPlaying, pauseResume, stop, progress } = usePlayer();
  const { activeSceneId } = useSceneTheme();
  const bgColor = activeSceneId === "tibet" ? "#160f28" : "rgba(0,0,0,0.40)";

  const opacity    = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(startY)).current;
  const closingRef = useRef(false);
  const visibleRef = useRef(false);
  const [visible, setVisible]   = useState(false);

  // Disparo del evento "minimizar desde el reproductor"
  useEffect(() => {
    const unsub = sessionMiniPlayerEvents.subscribe((from) => {
      if (closingRef.current) return;
      // Ya visible (ej: volver de /player abierto desde esta barra) → no re-animar.
      if (visibleRef.current) return;
      visibleRef.current = true;
      setVisible(true);
      opacity.setValue(0);
      // "bottom": entra desde abajo con fade (patrón DormirMiniPlayer);
      // "top": cae desde arriba (minimizar desde el reproductor).
      translateY.setValue(from === "bottom" ? 80 : startY);
      Animated.parallel([
        Animated.timing(opacity,    { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start();
    });
    return unsub;
  }, [startY]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sesión termina de forma natural → ocultar
  useEffect(() => {
    if (!currentSession && visible) animateOut(() => {});
  }, [currentSession]); // eslint-disable-line react-hooks/exhaustive-deps

  const animateOut = (onDone: () => void) => {
    if (closingRef.current) return;
    closingRef.current = true;
    Animated.parallel([
      Animated.timing(opacity,    { toValue: 0, duration: 300, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 80, duration: 300, useNativeDriver: true }),
    ]).start(() => {
      visibleRef.current = false;
      setVisible(false);
      closingRef.current = false;
      onDone();
    });
  };

  const handleClose = () => animateOut(() => stop());

  if (!visible || !currentSession || suppressed) return null;

  return (
    <Pressable
      onPress={() => router.push("/player" as never)}
      style={[styles.wrapper, { bottom: bottomOffset + 5 }]}
    >
      <Animated.View
        style={[
          styles.container,
          { backgroundColor: bgColor, opacity, transform: [{ translateY }] },
        ]}
      >
        <Image
          source={currentSession.image as any}
          style={styles.img}
          resizeMode="cover"
        />

        <Pressable
          onPress={(e) => { e.stopPropagation(); pauseResume(); }}
          style={styles.playBtn}
          hitSlop={8}
        >
          <Svg width={26} height={26} viewBox="0 0 48 48">
            {isPlaying ? (
              <>
                <Rect x="7"  y="5" width="12" height="36" rx="5" ry="5" fill="white" />
                <Rect x="27" y="5" width="12" height="36" rx="5" ry="5" fill="white" />
              </>
            ) : (
              <Path d="M 13.2 7.1 Q 8 4 8 10 L 8 36 Q 8 42 13.2 38.9 L 34.8 26.1 Q 40 23 34.8 19.9 Z" fill="white" />
            )}
          </Svg>
        </Pressable>

        <View style={{ flex: 1 }}>
          <Text style={styles.title} numberOfLines={1}>
            {currentSession.title}
          </Text>
          <Text style={styles.sub} numberOfLines={1}>
            {currentSession.categoryLabel}
          </Text>
        </View>

        <Pressable
          onPress={(e) => { e.stopPropagation(); handleClose(); }}
          hitSlop={10}
          style={{ paddingRight: 16 }}
        >
          <Feather name="x" size={20} color="#ffffff" style={{ opacity: 0.6 }} />
        </Pressable>

        {/* ── Barra de progreso ───────────────────────────────────── */}
        <View style={styles.progressTrack} pointerEvents="none">
          <View style={[styles.progressFill, { width: `${Math.min(1, Math.max(0, progress)) * 100}%` as any }]} />
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 0,
    right: 0,
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    height: PLAYER_H,
    overflow: "hidden",
  },
  img: {
    width: 60,
    height: PLAYER_H,
  },
  playBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontFamily: "Manrope",
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255,255,255,0.92)",
    marginBottom: 2,
  },
  sub: {
    fontFamily: "Manrope",
    fontSize: 12,
    color: "rgba(255,255,255,0.48)",
  },
  progressTrack: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 3,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  progressFill: {
    height: 3,
    backgroundColor: "rgba(255,255,255,0.85)",
    borderRadius: 1,
  },
});
