import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { LinearGradient } from "expo-linear-gradient";

import { usePlayer } from "@/context/PlayerContext";
import { useMixer } from "@/context/MixerContext";
import { getSoundImage } from "@/config/sound-images";
import { useColors } from "@/hooks/useColors";

const MAX_PLAYER_WIDTH = 430;
const STACK_SIZE = 38;
const STACK_SHIFT = 15;
const MAX_STACK = 3;

const GRAD_COLORS: [string, string] = ["#2A153D", "#3C1D58"];
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
    }
  }, [mixActive]);

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

  const shell = (children: React.ReactNode, onPress: () => void) => (
    <Pressable onPress={onPress} style={styles.wrapper}>
      <LinearGradient
        colors={GRAD_COLORS}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {children}
    </Pressable>
  );

  // ── Modo mezcla ───────────────────────────────────────────────
  if (mixActive) {
    const presetName = loadedPresetId
      ? presets.find((p) => p.id === loadedPresetId)?.name
      : null;
    const title = presetName || "Mi mezcla";
    const count = activeSounds.length;
    const visible = activeSounds.slice(-MAX_STACK);
    const stackWidth = STACK_SIZE + Math.max(0, visible.length - 1) * STACK_SHIFT;

    return shell(
      <View style={styles.row}>
        <View style={styles.upArrow}>
          <Feather name="chevron-up" size={20} color={colors.mutedForeground} />
        </View>

        <View style={[styles.stackWrap, { width: stackWidth }]}>
          {visible.map((s, i) => {
            const anim = getAnim(s.id);
            const image = getSoundImage(s.id);
            return (
              <Animated.View
                key={s.id}
                style={[
                  styles.stackThumb,
                  { left: i * STACK_SHIFT, zIndex: i },
                  { transform: [{ scale: anim }], opacity: anim },
                ]}
              >
                {image ? (
                  <Image source={image} style={styles.stackThumbInner} resizeMode="cover" />
                ) : (
                  <View style={[styles.stackThumbInner, styles.stackFallback]}>
                    <Feather name="music" size={14} color={colors.primary} />
                  </View>
                )}
              </Animated.View>
            );
          })}
        </View>

        {mixPlaying ? (
          <>
            <View style={styles.info}>
              <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={1}>
                {title}
              </Text>
              <Text style={[styles.sub, { color: colors.mutedForeground }]} numberOfLines={1}>
                {count} {count === 1 ? "sonido" : "sonidos"}
              </Text>
            </View>
          </>
        ) : (
          <>
            <View style={{ flex: 1 }} />
            <Pressable
              onPress={(e) => { e.stopPropagation(); stopAll(); everPlayedRef.current = false; }}
              style={[styles.terminarBtn, { marginRight: 10 }]}
            >
              <Text style={styles.terminarText}>TERMINAR</Text>
            </Pressable>
          </>
        )}

        <View style={styles.waveWrap}>
          {[wave1, wave2].map((w, i) => (
            <Animated.View key={i} pointerEvents="none" style={[styles.wave, styles.waveMix, {
              opacity: w.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 0.20, 0] }),
              transform: [{ scale: w.interpolate({ inputRange: [0, 1], outputRange: [1, 1.8] }) }],
            }]} />
          ))}
          <Pressable
            onPress={(e) => { e.stopPropagation(); togglePlay(); }}
            style={styles.playPauseBtn}
          >
            <Feather name={mixPlaying ? "pause" : "play"} size={20} color={colors.foreground} />
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
    marginHorizontal: 10,
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
    paddingVertical: 10,
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

  // ── Mezcla ────────────────────────────────────────────────────
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
  timerText: {
    fontSize: 14,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
    letterSpacing: 0.5,
  },
  playPauseBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
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
  waveMix:    { width: 32, height: 32 },
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
    paddingHorizontal: 16,
    paddingVertical: 7,
  },
});
