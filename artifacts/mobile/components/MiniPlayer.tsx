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
const STACK_SIZE  = 38;
const STACK_SHIFT = 15;        // offset apilado (cerrado)
const SHIFT_OPEN  = 48;        // offset desplegado (se adapta si hay muchos sonidos)

const GRAD_COLORS: [string, string] = ["#2A153D", "#3C1D58"];
const MIX_BG      = "#3d304e";
const PILL_BORDER = "rgba(110,80,200,0.5)"; // violeta noche
const BORDER_R    = 12;

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

  // ── Modo mezcla ───────────────────────────────────────────────
  if (mixActive) {
    const n = activeSounds.length;

    // Offset adaptativo al desplegar
    const shiftOpen = n > 1
      ? Math.min(SHIFT_OPEN, Math.floor((260 - STACK_SIZE) / (n - 1)))
      : 0;

    const handleOpen = () =>
      loadedPresetId?.startsWith("community-")
        ? router.push("/(tabs)/musica" as never)
        : openSheet();

    return (
      // Contenedor externo: pildora arriba + card abajo
      <View style={styles.mixOuter}>

        {/* ── Píldora "Abrir" — SOBRE la card ── */}
        <View style={styles.pillRow}>
          <Pressable onPress={handleOpen} style={styles.openPill} accessibilityRole="button" accessibilityLabel="Abrir Tu Mezcla">
            <Text style={styles.openPillText}>Abrir</Text>
            <Feather name="chevron-up" size={13} color="#FFFFFF" />
          </Pressable>
        </View>

        {/* ── Card del miniplayer ── */}
        <View style={styles.wrapper}>
          <View style={[StyleSheet.absoluteFill, { backgroundColor: MIX_BG }]} />

          <View style={styles.mixRow}>
            {/* Stack de thumbnails
                Usamos un View como contenedor (no Pressable) para que los hijos
                position:absolute rendericen correctamente, y ponemos un Pressable
                absoluteFill encima como área de toque. */}
            <View style={styles.stackArea}>
              {activeSounds.map((s, i) => {
                // Capa exterior: left animado (useNativeDriver: false)
                const leftAnim = stackOpenAnim.interpolate({
                  inputRange:  [0, 1],
                  outputRange: [i * STACK_SHIFT, i * shiftOpen],
                });
                // Capa interior: scale + opacity de entrada (useNativeDriver: true)
                const entryAnim = getAnim(s.id);
                const image = getSoundImage(s.id);

                return (
                  <Animated.View
                    key={s.id}
                    style={[styles.stackThumb, { left: leftAnim, zIndex: i }]}
                  >
                    <Animated.View
                      style={{
                        width: STACK_SIZE,
                        height: STACK_SIZE,
                        borderRadius: 9,
                        overflow: "hidden",
                        transform: [{ scale: entryAnim }],
                        opacity: entryAnim,
                      }}
                    >
                      {image ? (
                        <Image
                          source={image}
                          style={{ width: STACK_SIZE, height: STACK_SIZE }}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={styles.stackFallback}>
                          <Feather name="music" size={14} color={colors.primary} />
                        </View>
                      )}
                    </Animated.View>
                  </Animated.View>
                );
              })}

              {/* Overlay táctil encima de los thumbnails — de-stackea al tocar */}
              <Pressable
                onPress={toggleStack}
                style={StyleSheet.absoluteFill}
                hitSlop={6}
                accessibilityRole="button"
                accessibilityLabel={stackOpen ? "Colapsar" : "Desplegar sonidos"}
              />
            </View>

            {/* Botón play/pause */}
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
  // ── Contenedor raíz de mezcla (pildora + card) ────────────────
  mixOuter: {
    maxWidth: MAX_PLAYER_WIDTH,
    width: "100%",
    alignSelf: "center",
    gap: 6,
  },

  // ── Píldora "Abrir" ───────────────────────────────────────────
  pillRow: {
    alignItems: "flex-end",
    paddingRight: 4,
  },
  openPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: MIX_BG,
    borderWidth: 1,
    borderColor: PILL_BORDER,
  },
  openPillText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.2,
  },

  // ── Card compartida ───────────────────────────────────────────
  wrapper: {
    borderRadius: BORDER_R,
    overflow: "hidden",
    maxWidth: MAX_PLAYER_WIDTH,
    width: "100%",
  },

  // ── Layout de la fila de mezcla ───────────────────────────────
  mixRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 12,
    paddingRight: 10,
    paddingVertical: 10,
    gap: 10,
  },

  // ── Área del stack: View (no Pressable) para que los hijos
  //    position:absolute rendericen correctamente ────────────────
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
  stackFallback: {
    width: STACK_SIZE,
    height: STACK_SIZE,
    borderRadius: 9,
    backgroundColor: "rgba(212,175,55,0.18)",
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

  // ── Sesión ────────────────────────────────────────────────────
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 13,
    gap: 10,
  },
  art:  { width: 44, height: 44, borderRadius: 8 },
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
