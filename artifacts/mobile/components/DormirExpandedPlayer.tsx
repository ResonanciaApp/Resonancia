import React, { useEffect } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { Image as ExpoImage } from "expo-image";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import Svg, { Path, Rect } from "react-native-svg";
import type { DescansoSound } from "@/data/descanso-sounds";
import { BLUR_PLACEHOLDER, IMAGE_TRANSITION } from "@/constants/imagePlaceholder";

const { height: SCREEN_H } = Dimensions.get("window");

interface Props {
  sound: DescansoSound;
  isPlaying: boolean;
  isLoading?: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  onCollapse: () => void;
  onStop: () => void;
  bottomInset: number;
  topInset: number;
}

export function DormirExpandedPlayer({
  sound,
  isPlaying,
  isLoading,
  isExpanded,
  onToggle,
  onCollapse,
  onStop,
  bottomInset,
  topInset,
}: Props) {
  // ── Animación deslizante de entrada/salida ──────────────────────────────
  const slideY = useSharedValue(SCREEN_H);
  const opacity = useSharedValue(0);

  useEffect(() => {
    slideY.value = withTiming(isExpanded ? 0 : SCREEN_H, { duration: 300, easing: Easing.out(Easing.cubic) });
    opacity.value = withTiming(isExpanded ? 1 : 0, { duration: 300 });
  }, [isExpanded]); // eslint-disable-line react-hooks/exhaustive-deps

  const rootStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: slideY.value }],
    opacity: opacity.value,
  }));

  // ── Ken Burns — igual que player.tsx ───────────────────────────────────
  const kenBurns = useSharedValue(1);
  useEffect(() => {
    if (isPlaying) {
      kenBurns.value = withRepeat(
        withTiming(1.07, { duration: 28000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      );
    } else {
      cancelAnimation(kenBurns);
      kenBurns.value = withTiming(1, { duration: 2000, easing: Easing.out(Easing.ease) });
    }
    return () => cancelAnimation(kenBurns);
  }, [isPlaying]); // eslint-disable-line react-hooks/exhaustive-deps

  const kenBurnsStyle = useAnimatedStyle(() => ({
    transform: [{ scale: kenBurns.value }],
  }));

  const categoryLabel =
    sound.categoryId === "binaural" ? "SONIDOS BINAURALES" : "AMBIENTALES";

  return (
    <Animated.View
      pointerEvents={isExpanded ? "box-none" : "none"}
      style={[styles.root, rootStyle]}
    >
      {isExpanded && <StatusBar hidden />}

      {/* ── Imagen de fondo con Ken Burns ─────────────────────────────── */}
      <View style={[StyleSheet.absoluteFill, styles.heroContainer]}>
        <Animated.View style={[StyleSheet.absoluteFill, kenBurnsStyle]}>
          <ExpoImage
            source={sound.image as any}
            style={StyleSheet.absoluteFill as object}
            contentFit="cover"
            placeholder={BLUR_PLACEHOLDER}
            transition={IMAGE_TRANSITION}
          />
        </Animated.View>
      </View>

      {/* ── Overlay oscuro ─────────────────────────────────────────────── */}
      <View style={[StyleSheet.absoluteFill, styles.darkOverlay]} pointerEvents="none" />

      {/* ── Botón superior: colapsar ───────────────────────────────────── */}
      <View style={[styles.topRow, { paddingTop: topInset + 8 }]} pointerEvents="box-none">
        <Pressable
          onPress={onCollapse}
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
        {/* Placeholder para mantener simetría con player.tsx */}
        <View style={styles.topCircleBtn} pointerEvents="none" />
      </View>

      {/* ── Contenido principal ────────────────────────────────────────── */}
      <View
        style={[
          styles.mainContent,
          { paddingTop: topInset + 68, paddingBottom: bottomInset + 12 },
        ]}
        pointerEvents="box-none"
      >
        {/* Categoría */}
        <Text style={styles.authorLabel}>{categoryLabel}</Text>

        {/* Título */}
        <Text style={styles.titleText} numberOfLines={3}>
          {sound.label}
        </Text>

        {/* Spacer */}
        <View style={{ flex: 1 }} />

        {/* ── Fila de controles: play/pause · stop ─────────────────── */}
        <View style={styles.controlsRow}>
          {/* Hueco izquierdo (simetría con player.tsx) */}
          <View style={styles.ctrlBtn} />

          {/* Hueco para skip-back (invisible, simetría) */}
          <View style={styles.ctrlBtn} />

          {/* Play / Pause */}
          <Pressable
            onPress={onToggle}
            style={styles.playBtn}
            hitSlop={4}
          >
            {isLoading ? (
              <ActivityIndicator size="large" color="#FBFBFB" />
            ) : isPlaying ? (
              <Svg width={36} height={36} viewBox="0 0 46 46">
                <Rect x="7"  y="5" width="12" height="36" rx="5" ry="5" fill="white" />
                <Rect x="27" y="5" width="12" height="36" rx="5" ry="5" fill="white" />
              </Svg>
            ) : (
              <Svg width={36} height={36} viewBox="0 0 46 46">
                <Path
                  d="M 13.2 7.1 Q 8 4 8 10 L 8 36 Q 8 42 13.2 38.9 L 34.8 26.1 Q 40 23 34.8 19.9 Z"
                  fill="white"
                />
              </Svg>
            )}
          </Pressable>

          {/* Hueco para skip-fwd (invisible, simetría) */}
          <View style={styles.ctrlBtn} />

          {/* Stop — mismo cuadrado que player.tsx */}
          <Pressable
            onPress={() => { onCollapse(); onStop(); }}
            style={styles.ctrlBtn}
            hitSlop={10}
          >
            <Svg width={22} height={22} viewBox="0 0 24 24">
              <Rect x="4" y="4" width="16" height="16" rx="3" ry="3" fill="rgba(255,255,255,0.88)" />
            </Svg>
          </Pressable>
        </View>

        {/* Sin barra de progreso (loop infinito) */}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 90,
  },
  heroContainer: {
    overflow: "hidden",
  },
  darkOverlay: {
    backgroundColor: "rgba(0,0,0,0.45)",
  },
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
  mainContent: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 28,
    flexDirection: "column",
  },
  authorLabel: {
    fontFamily: "Manrope",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2.2,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.42)",
    marginBottom: 8,
    textAlign: "center",
  },
  titleText: {
    fontFamily: "Manrope",
    fontSize: 25,
    fontWeight: "800",
    color: "#FBFBFB",
    letterSpacing: 0.1,
    textAlign: "center",
    marginBottom: 10,
  },
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
});
