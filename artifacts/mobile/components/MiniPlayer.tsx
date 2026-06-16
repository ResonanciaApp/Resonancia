import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
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

const MAX_PLAYER_WIDTH = 438;
const STACK_SIZE = 38;
const STACK_SHIFT      = 15;  // offset apilado
const STACK_SHIFT_OPEN = 48;  // offset desplegado (se adapta si hay muchos sonidos)

const GRAD_COLORS: [string, string] = ["#2A153D", "#3C1D58"];
const MIX_BG  = "#3d304e";
const BORDER_R = 12;

export function MiniPlayer() {
  const { currentSession, isPlaying, progress, pauseResume } = usePlayer();
  const {
    activeSounds,
    isPlaying: mixPlaying,
    togglePlay,
    loadedPresetId,
    openSheet,
  } = useMixer();

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
          Animated.timing(val, { toValue: 0, duration: 0,    useNativeDriver: true }),
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
    if (!mixActive) {
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
      Animated.spring(anim, { toValue: 1, useNativeDriver: true, damping: 14, stiffness: 220 }).start();
    }
    return animsRef.current.get(id)!;
  }

  if (!currentSession && !mixActive) return null;

  // ── Modo mezcla ───────────────────────────────────────────────
  if (mixActive) {
    const n = activeSounds.length;

    // Offset adaptativo al desplegar: nunca supera el ancho disponible
    // (~250 px para el stack: 320 total − 44 play − 12 gap − 24 padding)
    const shiftOpen = n > 1
      ? Math.min(STACK_SHIFT_OPEN, Math.floor((250 - STACK_SIZE) / (n - 1)))
      : 0;

    const handleOpen = () =>
      loadedPresetId?.startsWith("community-")
        ? router.push("/(tabs)/musica" as never)
        : openSheet();

    return (
      <View style={styles.wrapper}>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: MIX_BG }]} />

        <View style={styles.mixRow}>
          {/* Stack — tap → de-stackear; nunca abre la hoja */}
          <Pressable
            onPress={toggleStack}
            hitSlop={6}
            style={styles.stackArea}
            accessibilityRole="button"
            accessibilityLabel={stackOpen ? "Colapsar imágenes" : "Ver imágenes de sonidos"}
          >
            {/* Los thumbnails son position:absolute, por eso el área de click
                necesita tener height explícito */}
            {activeSounds.map((s, i) => {
              const entryAnim = getAnim(s.id);
              const image     = getSoundImage(s.id);
              const leftAnim  = stackOpenAnim.interpolate({
                inputRange:  [0, 1],
                outputRange: [i * STACK_SHIFT, i * shiftOpen],
              });
              return (
                <Animated.View
                  key={s.id}
                  style={[styles.stackThumb, { left: leftAnim, zIndex: i }]}
                >
                  <Animated.View style={[styles.stackThumbInner, {
                    transform: [{ scale: entryAnim }],
                    opacity: entryAnim,
                  }]}>
                    {image ? (
                      <Image source={image} style={StyleSheet.absoluteFill} resizeMode="cover" />
                    ) : (
                      <View style={[StyleSheet.absoluteFill, styles.stackFallback]}>
                        <Feather name="music" size={14} color={colors.primary} />
                      </View>
                    )}
                  </Animated.View>
                </Animated.View>
              );
            })}
          </Pressable>

          {/* Columna derecha: flecha ↑ + play apilados verticalmente */}
          <View style={styles.rightCol}>
            {/* Flecha — única forma de abrir Tu Mezcla */}
            <Pressable
              onPress={handleOpen}
              hitSlop={8}
              style={styles.openArrow}
              accessibilityRole="button"
              accessibilityLabel="Abrir Tu Mezcla"
            >
              <Feather name="chevron-up" size={17} color={colors.mutedForeground} />
            </Pressable>

            {/* Play / Pause */}
            <View style={styles.waveWrap}>
              {[wave1, wave2].map((w, idx) => (
                <Animated.View key={idx} pointerEvents="none" style={[styles.wave, styles.waveMix, {
                  opacity:   w.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 0.60, 0] }),
                  transform: [{ scale: w.interpolate({ inputRange: [0, 1], outputRange: [1, 2.2] }) }],
                }]} />
              ))}
              <Pressable onPress={togglePlay} style={styles.playPauseBtn}>
                <View style={mixPlaying ? undefined : styles.playIconNudge}>
                  <Feather name={mixPlaying ? "pause" : "play"} size={22} color="#FFFFFF" />
                </View>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    );
  }

  // ── Modo sesión ───────────────────────────────────────────────
  return (
    <Pressable onPress={() => router.push("/player" as never)} style={styles.wrapper}>
      <LinearGradient
        colors={GRAD_COLORS}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
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
        <View style={styles.waveWrap}>
          {[wave1, wave2].map((w, idx) => (
            <Animated.View key={idx} pointerEvents="none" style={[styles.wave, styles.waveSession, {
              opacity:   w.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 0.22, 0] }),
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
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>
    </Pressable>
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

  // ── Mezcla — layout ───────────────────────────────────────────
  mixRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 12,
    paddingRight: 10,
    paddingVertical: 10,
    gap: 10,
  },
  // Área del stack: flex:1, altura fija = thumbnails. Los thumbs son
  // position:absolute dentro de este contenedor.
  stackArea: {
    flex: 1,
    height: STACK_SIZE,
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
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Columna derecha: flecha + play ────────────────────────────
  rightCol: {
    alignItems: "center",
    gap: 5,
  },
  openArrow: {
    width: 44,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Play/Pause ────────────────────────────────────────────────
  playPauseBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  playIconNudge: { marginLeft: 2 },
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

  // ── Sesión — layout ───────────────────────────────────────────
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 13,
    gap: 10,
  },
  art: { width: 44, height: 44, borderRadius: 8 },
  info: { flex: 1 },
  title: { fontSize: 14, fontWeight: "600", marginBottom: 2 },
  sub:   { fontSize: 11 },
  btn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  progressBar: {
    height: 2,
    backgroundColor: "rgba(61,14,22,0.40)",
  },
  progressFill: {
    height: 2,
    backgroundColor: "#D6AD5F",
    borderRadius: 1,
  },
});
