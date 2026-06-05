import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
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

import { usePlayer } from "@/context/PlayerContext";
import { useMixer } from "@/context/MixerContext";
import { getSoundImage } from "@/config/sound-images";
import { useColors } from "@/hooks/useColors";

const MAX_PLAYER_WIDTH = 430;
const STACK_SIZE = 38;
const STACK_SHIFT = 15;
const MAX_STACK = 3;

function formatElapsed(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function MiniPlayer() {
  const { currentSession, isPlaying, progress, pauseResume, stop } = usePlayer();
  const {
    activeSounds,
    isPlaying: mixPlaying,
    togglePlay,
    stopAll,
    presets,
    loadedPresetId,
    openSheet,
  } = useMixer();
  // Track if the mix was ever played (to distinguish "never started" from "paused")
  const everPlayedRef = useRef(false);
  if (mixPlaying) everPlayedRef.current = true;
  const colors = useColors();

  const isIOS = Platform.OS === "ios";
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
      {isIOS ? (
        <BlurView intensity={80} tint="dark" style={[StyleSheet.absoluteFill, { borderRadius: 18 }]} />
      ) : Platform.OS === "web" ? (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(6,10,15,0.94)", borderRadius: 18 }]} />
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.card, borderRadius: 18 }]} />
      )}
      <LinearGradient
        colors={["rgba(100,140,210,0.08)", "rgba(6,10,15,0.4)"]}
        style={[StyleSheet.absoluteFill, { borderRadius: 18 }]}
      />
      <View style={[styles.border, { borderColor: "rgba(100,140,210,0.2)" }]} />
      {children}
    </Pressable>
  );

  // ── Modo mezcla: diseño Insight Timer ─────────────────────────
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
        {/* Flecha arriba — indica que abre el editor ampliado */}
        <View style={styles.upArrow}>
          <Feather name="chevron-up" size={20} color={colors.mutedForeground} />
        </View>

        {/* Miniaturas apiladas con animación de entrada */}
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
                  <Image
                    source={image}
                    style={styles.stackThumbInner}
                    resizeMode="cover"
                  />
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
            {/* Título + conteo */}
            <View style={styles.info}>
              <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={1}>
                {title}
              </Text>
              <Text style={[styles.sub, { color: colors.mutedForeground }]} numberOfLines={1}>
                {count} {count === 1 ? "sonido" : "sonidos"}
              </Text>
            </View>
            {/* Timer de reproducción */}
            <Text style={[styles.timerText, { color: colors.foreground }]}>
              {formatElapsed(elapsed)}
            </Text>
          </>
        ) : (
          /* TERMINAR — visible solo cuando está pausado */
          <View style={{ flex: 1 }} />
          <Pressable
            onPress={(e) => { e.stopPropagation(); stopAll(); everPlayedRef.current = false; }}
            style={[styles.terminarBtn, { marginRight: 10 }]}
            accessibilityRole="button"
            accessibilityLabel="Terminar mezcla"
          >
            <Text style={styles.terminarText}>TERMINAR</Text>
          </Pressable>
        )}

        {/* Play / pausa */}
        <Pressable
          onPress={(e) => { e.stopPropagation(); togglePlay(); }}
          style={styles.playPauseBtn}
          accessibilityRole="button"
          accessibilityLabel={mixPlaying ? "Pausar mezcla" : "Reproducir mezcla"}
        >
          <Feather
            name={mixPlaying ? "pause" : "play"}
            size={20}
            color={colors.foreground}
          />
        </Pressable>
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

  // ── Modo sesión (sin cambios) ─────────────────────────────────
  return shell(
    <>
      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            { width: `${progress * 100}%`, backgroundColor: colors.primary },
          ]}
        />
      </View>

      <View style={styles.row}>
        <Image source={currentSession!.image} style={styles.art} resizeMode="cover" />
        <View style={styles.info}>
          <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={1}>
            {currentSession!.title}
          </Text>
          <Text style={[styles.sub, { color: colors.mutedForeground }]} numberOfLines={1}>
            {currentSession!.categoryLabel} · {currentSession!.durationLabel}
          </Text>
        </View>
        <Pressable
          onPress={(e) => { e.stopPropagation(); pauseResume(); }}
          style={[styles.btn, { backgroundColor: colors.primary }]}
        >
          <Feather name={isPlaying ? "pause" : "play"} size={18} color={colors.primaryForeground} />
        </Pressable>
        <Pressable
          onPress={(e) => { e.stopPropagation(); stop(); }}
          style={styles.closeBtn}
        >
          <Feather name="x" size={18} color={colors.mutedForeground} />
        </Pressable>
      </View>
    </>,
    () => router.push("/player" as never),
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 16,
    borderRadius: 18,
    overflow: "hidden",
    maxWidth: MAX_PLAYER_WIDTH,
    width: "100%",
    alignSelf: "center",
  },
  border: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    borderRadius: 18,
  },

  // ── Sesión ───────────────────────────────────────────────────
  progressBar: {
    height: 2,
    backgroundColor: "rgba(100,140,210,0.15)",
  },
  progressFill: {
    height: 2,
    borderRadius: 1,
  },

  // ── Fila compartida ──────────────────────────────────────────
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
    borderRadius: 10,
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
  closeBtn: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Mezcla (Insight Timer layout) ────────────────────────────
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
    backgroundColor: "rgba(100,140,210,0.18)",
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

  // ── TERMINAR (pausado) ────────────────────────────────────────
  terminarBtn: {
    alignItems: "center",
    justifyContent: "center",
  },
  terminarText: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    color: "#090F17",
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 7,
  },
});
