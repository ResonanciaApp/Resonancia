import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated as RNAnimated,
  Dimensions,
  Modal,
  Platform,
  Pressable,
  Share,
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
import { Feather, FontAwesome } from "@expo/vector-icons";
import Svg, { Path, Rect } from "react-native-svg";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { DescansoSound } from "@/data/descanso-sounds";
import { BLUR_PLACEHOLDER, IMAGE_TRANSITION } from "@/constants/imagePlaceholder";
import { useSceneTheme } from "@/context/SceneThemeContext";

const { height: SCREEN_H } = Dimensions.get("window");

const DORMIR_FAV_KEY = "@resonance_dormir_favorites";

const TIMER_OPTIONS: { label: string; minutes: number | null }[] = [
  { label: "Sin timer", minutes: null },
  { label: "5 min",    minutes: 5    },
  { label: "10 min",   minutes: 10   },
  { label: "20 min",   minutes: 20   },
  { label: "30 min",   minutes: 30   },
  { label: "50 min",   minutes: 50   },
];

interface Props {
  sound: DescansoSound;
  isPlaying: boolean;
  isLoading?: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  onCollapse: () => void;
  onStop: () => void;
  onPrev: () => void;
  onNext: () => void;
  timerMinutes: number | null;
  onSetTimer: (minutes: number | null) => void;
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
  onPrev,
  onNext,
  timerMinutes,
  onSetTimer,
  bottomInset,
  topInset,
}: Props) {
  const { theme } = useSceneTheme();

  // ── Favoritos ───────────────────────────────────────────────────────────
  const [isFav, setIsFav] = useState(false);
  const scaleHeart = useRef(new RNAnimated.Value(1)).current;

  useEffect(() => {
    AsyncStorage.getItem(DORMIR_FAV_KEY).then((raw) => {
      if (!raw) return;
      const ids: string[] = JSON.parse(raw);
      setIsFav(ids.includes(sound.id));
    });
  }, [sound.id]);

  const handleFav = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // bounce
    scaleHeart.setValue(1);
    RNAnimated.sequence([
      RNAnimated.timing(scaleHeart, { toValue: 1.25, duration: 120, useNativeDriver: true }),
      RNAnimated.spring(scaleHeart, { toValue: 1, friction: 3, tension: 140, useNativeDriver: true }),
    ]).start();
    const raw = await AsyncStorage.getItem(DORMIR_FAV_KEY);
    const ids: string[] = raw ? JSON.parse(raw) : [];
    const next = isFav ? ids.filter((id) => id !== sound.id) : [...ids, sound.id];
    await AsyncStorage.setItem(DORMIR_FAV_KEY, JSON.stringify(next));
    setIsFav(!isFav);
  }, [isFav, sound.id, scaleHeart]);

  // ── Compartir ───────────────────────────────────────────────────────────
  const handleShare = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Share.share({
      title: sound.label,
      message: `🎵 Estoy escuchando "${sound.label}" en RESONANCIA — meditación y sanación con sonido.`,
    });
  }, [sound.label]);

  // ── Timer sheet ─────────────────────────────────────────────────────────
  const [showTimer, setShowTimer] = useState(false);

  // ── Animación deslizante de entrada/salida ──────────────────────────────
  const slideY  = useSharedValue(SCREEN_H);
  const opacity = useSharedValue(0);

  useEffect(() => {
    slideY.value  = withTiming(isExpanded ? 0 : SCREEN_H, { duration: 300, easing: Easing.out(Easing.cubic) });
    opacity.value = withTiming(isExpanded ? 1 : 0, { duration: 300 });
  }, [isExpanded]); // eslint-disable-line react-hooks/exhaustive-deps

  const rootStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: slideY.value }],
    opacity: opacity.value,
  }));

  // ── Ken Burns ───────────────────────────────────────────────────────────
  const kenBurns = useSharedValue(1);
  useEffect(() => {
    if (isPlaying) {
      kenBurns.value = withRepeat(
        withTiming(1.07, { duration: 28000, easing: Easing.inOut(Easing.ease) }),
        -1, true,
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

  const timerActive = timerMinutes !== null && timerMinutes > 0;

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

      {/* ── Fila superior: colapsar (izq) + descarga (der) ───────────── */}
      <View style={[styles.topRow, { paddingTop: topInset + 8 }]} pointerEvents="box-none">
        <Pressable onPress={onCollapse} style={styles.topCircleBtn} hitSlop={8}>
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
        <Text style={styles.titleText} numberOfLines={3}>{sound.label}</Text>

        {/* Spacer */}
        <View style={{ flex: 1 }} />

        {/* ── Fila de acciones: ♥ · compartir · timer ────────────────── */}
        <View style={styles.actionRow}>
          {/* Favorito */}
          <Pressable style={styles.actionBtn} onPress={handleFav} hitSlop={8}>
            <RNAnimated.View style={{ transform: [{ scale: scaleHeart }] }}>
              <FontAwesome
                name="heart"
                size={20}
                color={isFav ? "#F9F9F9" : "rgba(255,255,255,0.92)"}
              />
            </RNAnimated.View>
          </Pressable>

          {/* Compartir */}
          <Pressable style={styles.actionBtn} onPress={handleShare} hitSlop={8}>
            <Feather name="share" size={22} color="rgba(255,255,255,0.92)" />
          </Pressable>

          {/* Temporizador */}
          <Pressable
            style={styles.actionBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowTimer(true);
            }}
            hitSlop={8}
          >
            <Feather
              name="clock"
              size={22}
              color={timerActive ? "#BE9650" : "rgba(255,255,255,0.92)"}
            />
          </Pressable>
        </View>

        {/* ── Fila de controles: prev · play/pause · next · stop ───────── */}
        <View style={styles.controlsRow}>
          {/* Placeholder izquierdo (simetría) */}
          <View style={styles.ctrlBtn} />

          {/* Anterior */}
          <Pressable
            style={styles.ctrlBtn}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPrev(); }}
            hitSlop={10}
          >
            <Feather name="skip-back" size={28} color="rgba(255,255,255,0.90)" />
          </Pressable>

          {/* Play / Pause */}
          <Pressable style={styles.playBtn} onPress={onToggle} hitSlop={4}>
            {isLoading ? (
              <ActivityIndicator size="large" color="#FBFBFB" />
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

          {/* Siguiente */}
          <Pressable
            style={styles.ctrlBtn}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onNext(); }}
            hitSlop={10}
          >
            <Feather name="skip-forward" size={28} color="rgba(255,255,255,0.90)" />
          </Pressable>

          {/* Stop — cuadrado igual que player.tsx */}
          <Pressable
            style={styles.ctrlBtn}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onCollapse(); onStop(); }}
            hitSlop={10}
          >
            <Svg width={22} height={22} viewBox="0 0 24 24">
              <Rect x="4" y="4" width="16" height="16" rx="3" ry="3" fill="rgba(255,255,255,0.88)" />
            </Svg>
          </Pressable>
        </View>

        {/* Sin barra de progreso — loop infinito */}
      </View>

      {/* ── Timer Sheet ────────────────────────────────────────────────── */}
      <Modal
        visible={showTimer}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTimer(false)}
        statusBarTranslucent
      >
        <View style={[StyleSheet.absoluteFill, { justifyContent: "flex-end" }]} pointerEvents="box-none">
          <Pressable
            style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.45)" }]}
            onPress={() => setShowTimer(false)}
          />
          <View style={[styles.timerSheet, { paddingBottom: bottomInset + 16 }]}>
            <LinearGradient
              colors={theme.id === "tibet" ? ["#2d1c52", "#1f2a62"] : [theme.gradient[0] as string, theme.gradient[0] as string]}
              style={[StyleSheet.absoluteFill, { borderTopLeftRadius: 24, borderTopRightRadius: 24 }]}
              pointerEvents="none"
            />
            {/* Handle */}
            <View style={styles.timerHandle} />
            <View style={styles.timerHeader}>
              <Feather name="clock" size={18} color="#FBFBFB" />
              <Text style={styles.timerTitle}>Temporizador</Text>
              {timerActive && (
                <Text style={styles.timerActive}>{timerMinutes} min</Text>
              )}
            </View>
            <View style={styles.timerChips}>
              {TIMER_OPTIONS.map((opt) => {
                const selected = timerMinutes === opt.minutes;
                return (
                  <Pressable
                    key={opt.label}
                    style={[styles.timerChip, selected && styles.timerChipSelected]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      onSetTimer(opt.minutes);
                      setShowTimer(false);
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
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 90,
  },
  heroContainer: { overflow: "hidden" },
  darkOverlay:   { backgroundColor: "rgba(0,0,0,0.45)" },

  topRow: {
    position: "absolute",
    top: 0, left: 16, right: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 20,
  },
  topCircleBtn: {
    width: 40, height: 40,
    borderRadius: 20,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },

  mainContent: {
    position: "absolute",
    top: 0, bottom: 0, left: 0, right: 0,
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

  actionRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 36,
    marginBottom: 28,
  },
  actionBtn: {
    width: 46, height: 46,
    borderRadius: 23,
    backgroundColor: "rgba(255,255,255,0.10)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
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
    width: 44, height: 44,
  },
  playBtn: {
    width: 68, height: 68,
    borderRadius: 34,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.28)",
    alignItems: "center",
    justifyContent: "center",
  },

  // Timer sheet
  timerSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 10,
    paddingHorizontal: 20,
    overflow: "hidden",
  },
  timerHandle: {
    width: 36, height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.22)",
    alignSelf: "center",
    marginBottom: 18,
  },
  timerHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 14,
    marginBottom: 16,
  },
  timerTitle: {
    fontFamily: "Manrope",
    fontSize: 16,
    fontWeight: "700",
    color: "#FBFBFB",
    flex: 1,
  },
  timerActive: {
    fontFamily: "Manrope",
    fontSize: 14,
    fontWeight: "700",
    color: "#BE9650",
  },
  timerChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingVertical: 2,
  },
  timerChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.20)",
  },
  timerChipSelected: {
    backgroundColor: "rgba(255,255,255,0.18)",
    borderColor: "rgba(255,255,255,0.45)",
  },
  timerChipText: {
    fontFamily: "Manrope",
    fontSize: 13,
    fontWeight: "600",
    color: "#F4F4F4",
  },
  timerChipTextSelected: { color: "#FBFBFB" },
});
