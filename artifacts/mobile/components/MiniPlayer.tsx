import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { LinearGradient } from "expo-linear-gradient";

import { usePlayer } from "@/context/PlayerContext";
import { useMixer } from "@/context/MixerContext";
import { getSoundImage } from "@/config/sound-images";
import { useColors } from "@/hooks/useColors";

const MAX_PLAYER_WIDTH = 438;
const STACK_SIZE = 38;
const STACK_SHIFT = 15;
const STACK_SHIFT_OPEN = 48;
const SLIDER_THRESHOLD = 4; // 4+ sonidos → modo slider

const GRAD_COLORS: [string, string] = ["#2A153D", "#3C1D58"];
const MIX_BG = "#3d304e";
const BORDER_R = 12;

function formatElapsed(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function MiniPlayer() {
  const { currentSession, isPlaying, progress, pauseResume } = usePlayer();
  const {
    activeSounds,
    isPlaying: mixPlaying,
    togglePlay,
    stopAll,
    presets,
    loadedPresetId,
    openSheet,
  } = useMixer();
  const everPlayedRef = useRef(false);
  if (mixPlaying) everPlayedRef.current = true;
  const colors = useColors();

  // ── Ondas sutiles ──────────────────────────────────────────────
  const wave1 = useRef(new Animated.Value(0)).current;
  const wave2 = useRef(new Animated.Value(0)).current;
  const activeIsPlaying = currentSession ? isPlaying : mixPlaying;

  useEffect(() => {
    const makeLoop = (val: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(val, { toValue: 1, duration: 1800, useNativeDriver: true }),
          Animated.timing(val, { toValue: 0, duration: 0, useNativeDriver: true }),
        ])
      );
    if (activeIsPlaying) {
      const a1 = makeLoop(wave1, 0);
      const a2 = makeLoop(wave2, 700);
      a1.start(); a2.start();
      return () => { a1.stop(); a2.stop(); wave1.setValue(0); wave2.setValue(0); };
    } else {
      wave1.setValue(0); wave2.setValue(0);
    }
  }, [activeIsPlaying, wave1, wave2]);

  const mixActive = !currentSession && activeSounds.length > 0;

  // ── Timer de reproducción (solo mezcla) ──────────────────────
  const [elapsed, setElapsed] = useState(0);
  const elapsedRef = useRef(0);

  // ── De-stack de thumbnails ─────────────────────────────────────
  const [stackOpen, setStackOpen] = useState(false);
  const stackOpenAnim = useRef(new Animated.Value(0)).current;

  const toggleStack = () => {
    const next = !stackOpen;
    setStackOpen(next);
    Animated.spring(stackOpenAnim, {
      toValue: next ? 1 : 0,
      useNativeDriver: false,
      damping: 16,
      stiffness: 220,
    }).start();
  };

  useEffect(() => {
    if (!mixPlaying) return;
    const id = setInterval(() => {
      elapsedRef.current += 1;
      setElapsed(elapsedRef.current);
    }, 1000);
    return () => clearInterval(id);
  }, [mixPlaying]);

  useEffect(() => {
    if (!mixActive) {
      elapsedRef.current = 0;
      setElapsed(0);
      animsRef.current.clear();
      setStackOpen(false);
      stackOpenAnim.setValue(0);
    }
  }, [mixActive, stackOpenAnim]);

  // ── Animaciones de entrada por sonido ─────────────────────────
  const animsRef = useRef<Map<string, Animated.Value>>(new Map());

  function getAnim(id: string): Animated.Value {
    if (!animsRef.current.has(id)) {
      const anim = new Animated.Value(0);
      animsRef.current.set(id, anim);
      Animated.spring(anim, {
        toValue: 1,
        useNativeDriver: true,
        damping: 14,
        stiffness: 220,
      }).start();
    }
    return animsRef.current.get(id)!;
  }

  if (!currentSession && !mixActive) return null;

  const shell = (children: React.ReactNode, onPress: () => void, mixMode = false) => (
    <Pressable onPress={onPress} style={styles.wrapper}>
      {mixMode ? (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: MIX_BG }]} />
      ) : (
        <LinearGradient
          colors={GRAD_COLORS}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      )}
      {children}
    </Pressable>
  );

  // ── Modo mezcla ───────────────────────────────────────────────
  if (mixActive) {
    const useSlider = activeSounds.length >= SLIDER_THRESHOLD;

    // Cálculo de ancho animado para el modo stack (< SLIDER_THRESHOLD)
    const stackWidthStacked = STACK_SIZE + Math.max(0, activeSounds.length - 1) * STACK_SHIFT;
    const stackWidthOpen   = STACK_SIZE + Math.max(0, activeSounds.length - 1) * STACK_SHIFT_OPEN;
    const animatedStackWidth = stackOpenAnim.interpolate({
      inputRange:  [0, 1],
      outputRange: [stackWidthStacked, stackWidthOpen],
    });

    return shell(
      <View style={styles.row}>
        <View style={styles.upArrow}>
          <Feather name="chevron-up" size={20} color={colors.mutedForeground} />
        </View>

        {useSlider ? (
          // ── Modo slider: scroll horizontal cuando hay 4+ sonidos ──
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.sliderWrap}
            contentContainerStyle={styles.sliderContent}
          >
            {activeSounds.map((s) => {
              const entryAnim = getAnim(s.id);
              const image = getSoundImage(s.id);
              return (
                <Animated.View
                  key={s.id}
                  style={[
                    styles.sliderThumb,
                    { transform: [{ scale: entryAnim }], opacity: entryAnim },
                  ]}
                >
                  {image ? (
                    <Image source={image} style={styles.sliderThumbInner} resizeMode="cover" />
                  ) : (
                    <View style={[styles.sliderThumbInner, styles.stackFallback]}>
                      <Feather name="music" size={14} color={colors.primary} />
                    </View>
                  )}
                </Animated.View>
              );
            })}
          </ScrollView>
        ) : (
          // ── Modo stack: de-stack animado cuando hay < 4 sonidos ──
          <>
            <Pressable
              onPress={(e) => { e.stopPropagation(); toggleStack(); }}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={stackOpen ? "Colapsar imágenes" : "Ver imágenes de sonidos"}
            >
              <Animated.View style={[styles.stackWrap, { width: animatedStackWidth }]}>
                {activeSounds.map((s, i) => {
                  const entryAnim = getAnim(s.id);
                  const image = getSoundImage(s.id);
                  const leftAnim = stackOpenAnim.interpolate({
                    inputRange:  [0, 1],
                    outputRange: [i * STACK_SHIFT, i * STACK_SHIFT_OPEN],
                  });
                  return (
                    <Animated.View
                      key={s.id}
                      style={[styles.stackThumb, { left: leftAnim, zIndex: i }]}
                    >
                      <Animated.View
                        style={{
                          width: STACK_SIZE,
                          height: STACK_SIZE,
                          transform: [{ scale: entryAnim }],
                          opacity: entryAnim,
                        }}
                      >
                        {image ? (
                          <Image source={image} style={styles.stackThumbInner} resizeMode="cover" />
                        ) : (
                          <View style={[styles.stackThumbInner, styles.stackFallback]}>
                            <Feather name="music" size={14} color={colors.primary} />
                          </View>
                        )}
                      </Animated.View>
                    </Animated.View>
                  );
                })}
              </Animated.View>
            </Pressable>
            <View style={{ flex: 1 }} />
          </>
        )}

        {/* Botón play/pause */}
        <View style={styles.waveWrap}>
          {[wave1, wave2].map((w, i) => (
            <Animated.View key={i} pointerEvents="none" style={[styles.wave, styles.waveMix, {
              opacity: w.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 0.60, 0] }),
              transform: [{ scale: w.interpolate({ inputRange: [0, 1], outputRange: [1, 2.2] }) }],
            }]} />
          ))}
          <Pressable
            onPress={(e) => { e.stopPropagation(); togglePlay(); }}
            style={styles.playPauseBtn}
          >
            {/* marginLeft: 2 compensa el offset visual del glifo "play" (el triángulo tiene más espacio a la izquierda) */}
            <View style={mixPlaying ? undefined : styles.playIconNudge}>
              <Feather
                name={mixPlaying ? "pause" : "play"}
                size={22}
                color="#FFFFFF"
              />
            </View>
          </Pressable>
        </View>
      </View>,
      () => {
        if (loadedPresetId?.startsWith("community-")) {
          router.push("/(tabs)/musica" as never);
        } else {
          openSheet();
        }
      },
      true,
    );
  }

  // ── Modo sesión ───────────────────────────────────────────────
  return shell(
    <>
      {/* Fila principal */}
      <View style={styles.row}>
        <Image source={currentSession!.image} style={styles.art} resizeMode="cover" />
        <View style={styles.info}>
          <Text style={[styles.title, { color: "#FFFFFF" }]} numberOfLines={1}>
            {currentSession!.title}
          </Text>
          <Text style={[styles.sub, { color: "rgba(255,255,255,0.55)" }]} numberOfLines={1}>
            {currentSession!.categoryLabel} · {currentSession!.durationLabel}
          </Text>
        </View>
        {/* Solo botón Play/Pause */}
        <View style={styles.waveWrap}>
          {[wave1, wave2].map((w, i) => (
            <Animated.View key={i} pointerEvents="none" style={[styles.wave, styles.waveSession, {
              opacity: w.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 0.22, 0] }),
              transform: [{ scale: w.interpolate({ inputRange: [0, 1], outputRange: [1, 1.8] }) }],
            }]} />
          ))}
          <Pressable
            onPress={(e) => { e.stopPropagation(); pauseResume(); }}
            style={[styles.btn, { backgroundColor: "rgba(255,255,255,0.15)" }]}
          >
            <Feather name={isPlaying ? "pause" : "play"} size={18} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>

      {/* Barra de progreso — ABAJO */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>
    </>,
    () => router.push("/player" as never),
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: BORDER_R,
    overflow: "hidden",
    maxWidth: MAX_PLAYER_WIDTH,
    width: "100%",
    alignSelf: "center",
  },

  // ── Sesión ────────────────────────────────────────────────────
  progressBar: {
    height: 2,
    backgroundColor: "rgba(61,14,22,0.40)",
  },
  progressFill: {
    height: 2,
    backgroundColor: "#D6AD5F",
    borderRadius: 1,
  },

  // ── Fila compartida ───────────────────────────────────────────
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 13,
    gap: 10,
  },
  art: {
    width: 44,
    height: 44,
    borderRadius: 8,
  },
  info: { flex: 1 },
  title: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  sub: { fontSize: 11 },
  btn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Mezcla — stack ────────────────────────────────────────────
  upArrow: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  stackWrap: {
    height: STACK_SIZE,
    position: "relative",
  },
  stackThumb: {
    position: "absolute",
    width: STACK_SIZE,
    height: STACK_SIZE,
    borderRadius: 9,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.35,
    shadowRadius: 3,
    elevation: 3,
  },
  stackThumbInner: {
    width: STACK_SIZE,
    height: STACK_SIZE,
    borderRadius: 9,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  stackFallback: {
    backgroundColor: "rgba(212,175,55,0.18)",
  },

  // ── Mezcla — slider ───────────────────────────────────────────
  sliderWrap: {
    flex: 1,
  },
  sliderContent: {
    alignItems: "center",
    gap: 6,
    paddingRight: 2,
  },
  sliderThumb: {
    width: STACK_SIZE,
    height: STACK_SIZE,
    borderRadius: 9,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.30,
    shadowRadius: 3,
    elevation: 3,
  },
  sliderThumbInner: {
    width: STACK_SIZE,
    height: STACK_SIZE,
    borderRadius: 9,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Play/Pause ────────────────────────────────────────────────
  timerText: {
    fontSize: 14,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
    letterSpacing: 0.5,
  },
  playPauseBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  playIconNudge: {
    marginLeft: 2,
  },
  waveWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  wave: {
    position: "absolute",
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  waveSession: { width: 38, height: 38 },
  waveMix:    { width: 44, height: 44 },
  terminarBtn: {
    alignItems: "center",
    justifyContent: "center",
  },
  terminarText: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    color: "#1B060F",
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 3,
  },
});
