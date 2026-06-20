import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Image as ExpoImage } from "expo-image";
import {
  Animated,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";

import { usePlayer } from "@/context/PlayerContext";
import { useMixer } from "@/context/MixerContext";
import { getSoundImage } from "@/config/sound-images";
import { useColors } from "@/hooks/useColors";

const MAX_PLAYER_WIDTH    = 438;
const STACK_SIZE          = 43;
const STACK_SHIFT         = 15;   // offset apilado (cerrado)
const CAROUSEL_THUMB_GAP  = 10;   // separación fija entre thumbnails en el carrusel
const CAROUSEL_MAX_OPEN_W = 280;  // techo para que el texto nunca desaparezca del todo

const GRAD_COLORS: [string, string] = ["#2A153D", "#3C1D58"];
const MIX_BG      = "rgba(0,0,0,0.85)";
const PILL_BORDER = "rgba(110,80,200,0.5)";
const BORDER_R    = 12;

type StackThumbItemProps = {
  image: ReturnType<typeof require> | undefined;
  style: object;
  onPress: () => void;
  onLongPress: () => void;
  primaryColor: string;
};

function StackThumbItem({ image, style, onPress, onLongPress, primaryColor }: StackThumbItemProps) {
  const opacity = useRef(new Animated.Value(image ? 0 : 1)).current;

  const handleLoad = () => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={[style, { opacity }]}>
      <Pressable
        onPress={onPress}
        onLongPress={onLongPress}
        delayLongPress={400}
        style={{ width: STACK_SIZE, height: STACK_SIZE }}
        accessibilityLabel="Sonido activo — presionar para colapsar, mantener para quitar"
      >
        {image ? (
          <ExpoImage
            source={image}
            style={{ width: STACK_SIZE, height: STACK_SIZE }}
            contentFit="cover"
            onLoad={handleLoad}
          />
        ) : (
          <View style={styles.stackFallback}>
            <Feather name="music" size={14} color={primaryColor} />
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

export function MiniPlayer() {
  const { currentSession, isPlaying, progress, pauseResume } = usePlayer();
  const {
    activeSounds,
    isPlaying: mixPlaying,
    togglePlay,
    presets,
    loadedPresetId,
    openSheet,
    removeSound,
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

  // ── De-stack / carrusel ────────────────────────────────────────
  // El área del stack anima su ANCHO: cerrado = stackWidthStacked,
  // abierto = CAROUSEL_OPEN_W. El textBlock (flex:1) se empuja
  // naturalmente cuando el área crece. Sin botón separado de colapso.

  const n = activeSounds.length;
  const stackWidthStacked = STACK_SIZE + Math.max(0, n - 1) * STACK_SHIFT;
  const stackWidthAnim = useRef(new Animated.Value(stackWidthStacked)).current;
  // openProgress: 0 = apilado, 1 = abierto — driver NATIVO (slide por translateX)
  const openProgress   = useRef(new Animated.Value(0)).current;
  // Cada thumb mueve (STACK_SIZE + gap - STACK_SHIFT) px por índice al abrirse
  const OPEN_DELTA = STACK_SIZE + CAROUSEL_THUMB_GAP - STACK_SHIFT; // 38+8-15 = 31

  const [stackOpen, setStackOpen] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  // Ancho real del contenido del carrusel (sin scroll si cabe, con scroll si excede)
  const carouselContentW = n * STACK_SIZE + Math.max(0, n - 1) * CAROUSEL_THUMB_GAP + 12;
  const carouselOpenW    = Math.min(carouselContentW, CAROUSEL_MAX_OPEN_W);

  const toggleStack = () => {
    const next = !stackOpen;
    // Al colapsar, devolver el scroll a 0 (sin animar) para que los thumbnails
    // apilados queden visibles de inmediato; si quedó scrolleado a la derecha,
    // el offset persistiría y mostraría espacio vacío.
    if (!next) scrollRef.current?.scrollTo({ x: 0, animated: false });
    setStackOpen(next);
    // stackWidthAnim usa JS driver (layout property); openProgress usa native driver (transform)
    Animated.spring(stackWidthAnim, {
      toValue: next ? carouselOpenW : stackWidthStacked,
      useNativeDriver: false, damping: 28, stiffness: 200, overshootClamping: true,
    }).start();
    Animated.spring(openProgress, {
      toValue: next ? 1 : 0,
      useNativeDriver: true, damping: 28, stiffness: 200, overshootClamping: true,
    }).start();
  };

  // Sincroniza el ancho cuando cambia n: cerrado → stacked, abierto → carousel
  useEffect(() => {
    // Si al quitar un sonido el carrusel quedó scrolleado más allá del nuevo
    // contenido, el offset persistiría mostrando espacio vacío → reset a 0.
    scrollRef.current?.scrollTo({ x: 0, animated: false });
    if (!stackOpen) {
      stackWidthAnim.setValue(stackWidthStacked);
    } else {
      Animated.spring(stackWidthAnim, {
        toValue: carouselOpenW,
        useNativeDriver: false,
        damping: 18,
        stiffness: 200,
      }).start();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n]);

  useEffect(() => {
    if (!mixActive) {
      setStackOpen(false);
      stackWidthAnim.setValue(0);
      openProgress.setValue(0);
    }
  }, [mixActive]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!currentSession && !mixActive) return null;

  // ── Modo mezcla ───────────────────────────────────────────────
  if (mixActive) {
    const n = activeSounds.length;

    const presetName = loadedPresetId
      ? presets.find((p) => p.id === loadedPresetId)?.name
      : null;
    const title = presetName || "Tu mezcla";

    // Ancho fijo del stack apilado en el row principal (nunca cambia)
    const stackWidthStacked = STACK_SIZE + Math.max(0, n - 1) * STACK_SHIFT;

    const handleOpen = () =>
      loadedPresetId?.startsWith("community-")
        ? router.push("/(tabs)/musica" as never)
        : openSheet();

    return (
      <View style={styles.mixOuter}>
        {/* ── Card del miniplayer ── */}
        <View style={styles.wrapper}>
          {/* Fondo glassmorphism */}
          <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(20,5,12,0.45)" }]} />

          {/* ── Row principal ── */}
          <View style={styles.mixRow}>

            {/* Flechita "Abrir" — extremo izquierdo */}
            <Pressable
              onPress={(e) => { e.stopPropagation(); handleOpen(); }}
              hitSlop={10}
              accessibilityLabel="Abrir mezclador"
              style={{ marginLeft: -3 }}
            >
              <Feather name="chevron-up" size={18} color="rgba(255,255,255,0.6)" />
            </Pressable>

            {/* Stack / carrusel — frame con ancho animado (JS driver) que clipea;
                cuando está abierto, un ScrollView horizontal permite deslizar
                entre los thumbnails si no caben todos en el ancho visible. */}
            <Animated.View style={[styles.stackArea, { width: stackWidthAnim }]}>
              <ScrollView
                ref={scrollRef}
                horizontal
                scrollEnabled={stackOpen}
                showsHorizontalScrollIndicator={false}
                style={styles.stackScroll}
                contentContainerStyle={{ width: carouselContentW, height: STACK_SIZE }}
              >
                {activeSounds.map((s, i) => {
                  const image      = getSoundImage(s.id);
                  const translateX = openProgress.interpolate({
                    inputRange:  [0, 1],
                    outputRange: [0, i * OPEN_DELTA],
                  });
                  return (
                    <StackThumbItem
                      key={s.id}
                      image={image}
                      style={[styles.stackThumb, { position: 'absolute', left: i * STACK_SHIFT, zIndex: i, transform: [{ translateX }] }]}
                      onPress={toggleStack}
                      onLongPress={() => removeSound(s.id)}
                      primaryColor={colors.primary}
                    />
                  );
                })}
              </ScrollView>
            </Animated.View>

            {/* Texto: flex:1, se empuja cuando el stack crece */}
            <View style={styles.textBlock}>
              <Text style={styles.mixTitle} numberOfLines={1}>{title}</Text>
              <Text style={styles.mixSub} numberOfLines={1}>
                {n} {n === 1 ? "sonido" : "sonidos"}
              </Text>
            </View>

            {/* Botón play/pause — siempre visible */}
            <View style={styles.waveWrap}>
              {[wave1, wave2].map((w, idx) => (
                <Animated.View key={idx} pointerEvents="none" style={[styles.wave, styles.waveMix, {
                  opacity:   w.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 0.28, 0] }),
                  transform: [{ scale: w.interpolate({ inputRange: [0, 1], outputRange: [1, 1.7] }) }],
                }]} />
              ))}
              <Pressable onPress={(e) => { e.stopPropagation(); togglePlay(); }} style={styles.playPauseBtn}>
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
  // ── Contenedor raíz de mezcla ─────────────────────────────────
  mixOuter: {
    maxWidth: MAX_PLAYER_WIDTH,
    width: "100%",
    alignSelf: "center",
    gap: 6,
  },

  // ── Píldora "Abrir" ───────────────────────────────────────────
  pillRow: {
    alignItems: "flex-end",
    paddingRight: 13,
    paddingTop: 2,
  },
  openPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: MIX_BG,
  },
  openPillText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.2,
  },

  // ── Card ──────────────────────────────────────────────────────
  wrapper: {
    overflow: "hidden",
    maxWidth: MAX_PLAYER_WIDTH,
    width: "100%",
    borderRadius: 10,
  },

  // ── Fila de mezcla ────────────────────────────────────────────
  mixRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 12,
    paddingRight: 10,
    paddingVertical: 13,
    gap: 10,
  },

  // ── Stack / carrusel: misma Animated.View, ancho animado ─────
  stackArea: {
    height: STACK_SIZE,
    overflow: "hidden",  // clip cuando el ancho crece/achica
  },
  stackScroll: {
    width: "100%",
    height: STACK_SIZE,
  },
  stackThumb: {
    width: STACK_SIZE,
    height: STACK_SIZE,
    borderRadius: 9,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
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

  // ── Texto dinámico (Tu mezcla + cantidad) ─────────────────────
  textBlock: {
    flex: 1,
    minWidth: 0,
    overflow: "hidden",
    justifyContent: "center",
  },
  mixTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 1,
  },
  mixSub: {
    fontSize: 11,
    color: "rgba(255,255,255,0.55)",
  },

  // ── Play/Pause ────────────────────────────────────────────────
  playPauseBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  playIconNudge: { marginLeft: 2 },
  waveWrap: {
    width: 44,
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
