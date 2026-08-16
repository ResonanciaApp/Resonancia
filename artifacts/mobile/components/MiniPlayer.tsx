import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import Svg, { Path, Rect } from "react-native-svg";
import { Image as ExpoImage } from "expo-image";
import {
  Animated,
  Image,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { DURATION, easeOutCubic } from "@/constants/motion";

import { useSceneTheme } from "@/context/SceneThemeContext";
import { usePlayer } from "@/context/PlayerContext";
import { useMixer } from "@/context/MixerContext";
import { getSoundImage } from "@/config/sound-images";
import { REMOTE_SOUND_IMAGE_MAP } from "@/lib/remoteSoundMap";
import { useColors } from "@/hooks/useColors";
import { useMixerPanel } from "@/context/MixerPanelContext";

const MAX_PLAYER_WIDTH    = 438;
const STACK_SIZE          = 37;
const STACK_SHIFT         = 13;   // offset apilado (cerrado)
const CAROUSEL_THUMB_GAP  = 8;    // separación fija entre thumbnails en el carrusel
const CAROUSEL_MAX_OPEN_W = 280;  // techo para que el texto nunca desaparezca del todo
const MAX_STACK_LAYOUT_W  = STACK_SIZE + 6 * STACK_SHIFT; // 6 thumbs completos, 7mo se corta

const GRAD_COLORS: [string, string] = ["#160f28", "#160f28"];
const MIX_BG      = "rgba(0,0,0,0.85)";

type StackThumbItemProps = {
  image: ReturnType<typeof require> | string | undefined;
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
  const { activeSceneId } = useSceneTheme();
  const tibetTint = null;
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

  // ── Swipe-up en handle → abre la sheet ─────────────────────────
  const openSheetRef = useRef(openSheet);
  useEffect(() => { openSheetRef.current = openSheet; }, [openSheet]);

  const handlePan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder:  (_, g) => g.dy < -4,
      onPanResponderRelease: (_, g) => {
        if (Math.abs(g.dy) < 8) {
          openSheetRef.current();
        } else if (g.dy < -10) {
          openSheetRef.current();
        }
      },
    })
  ).current;

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

  // ── Entrada del miniplayer al activar el primer sonido ─────────
  const entryAnim     = useRef(new Animated.Value(0)).current;
  const prevMixActive = useRef(false);

  useEffect(() => {
    if (mixActive && !prevMixActive.current) {
      entryAnim.setValue(0);
      Animated.timing(entryAnim, {
        toValue: 1,
        duration: 380,
        easing: easeOutCubic,
        useNativeDriver: true,
      }).start();
    } else if (!mixActive) {
      entryAnim.setValue(0);
    }
    prevMixActive.current = mixActive;
  }, [mixActive]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── De-stack / carrusel ────────────────────────────────────────
  // El área del stack anima su ANCHO: cerrado = stackWidthStackedCap,
  // abierto = CAROUSEL_OPEN_W. El textBlock (flex:1) se empuja
  // naturalmente cuando el área crece. Sin botón separado de colapso.

  const n = activeSounds.length;
  // dynamicShift comprime el apilamiento para que TODOS los thumbnails quepan
  // dentro del ancho cap (MAX_STACK_LAYOUT_W), sin importar cuántos haya.
  const dynamicShift       = n <= 1 ? 0 : Math.min(STACK_SHIFT, (MAX_STACK_LAYOUT_W - STACK_SIZE) / (n - 1));
  const stackWidthStackedCap = STACK_SIZE + Math.max(0, n - 1) * dynamicShift + (n > 1 ? STACK_SHIFT : 0);

  // Ancho real del contenido del carrusel (sin scroll si cabe, con scroll si excede)
  const carouselContentW = n * STACK_SIZE + Math.max(0, n - 1) * CAROUSEL_THUMB_GAP + 12;
  const carouselOpenW    = Math.min(carouselContentW, CAROUSEL_MAX_OPEN_W);

  // Por defecto abierto (desestaqueado); el usuario puede tocar para apilar
  const stackWidthAnim = useRef(new Animated.Value(carouselOpenW)).current;
  // openProgress: 0 = apilado, 1 = abierto — driver NATIVO (slide por translateX)
  const openProgress   = useRef(new Animated.Value(1)).current;
  // Cada thumb viaja (STACK_SIZE + gap - dynamicShift) al abrirse
  const openDelta = STACK_SIZE + CAROUSEL_THUMB_GAP - dynamicShift;

  const [stackOpen, setStackOpen] = useState(true);
  const prevN = useRef(n);
  const scrollRef = useRef<ScrollView>(null);

  const toggleStack = () => {
    const next = !stackOpen;
    // Al colapsar, devolver el scroll a 0 (sin animar) para que los thumbnails
    // apilados queden visibles de inmediato; si quedó scrolleado a la derecha,
    // el offset persistiría y mostraría espacio vacío.
    if (!next) scrollRef.current?.scrollTo({ x: 0, animated: false });
    setStackOpen(next);
    // stackWidthAnim usa JS driver (layout property); openProgress usa native driver (transform)
    Animated.timing(stackWidthAnim, {
      toValue: next ? carouselOpenW : stackWidthStackedCap,
      useNativeDriver: false, duration: DURATION.PLAYER, easing: easeOutCubic,
    }).start();
    Animated.timing(openProgress, {
      toValue: next ? 1 : 0,
      useNativeDriver: true, duration: DURATION.PLAYER, easing: easeOutCubic,
    }).start();
  };

  // Sincroniza ancho del carrusel al cambiar n
  useEffect(() => {
    prevN.current = n;
    // Si al quitar un sonido el carrusel quedó scrolleado más allá del nuevo
    // contenido, el offset persistiría mostrando espacio vacío → reset a 0.
    scrollRef.current?.scrollTo({ x: 0, animated: false });
    if (!stackOpen) {
      // Apilado: mantener ancho apilado siempre (no expandir al agregar)
      stackWidthAnim.setValue(stackWidthStackedCap);
    } else {
      Animated.timing(stackWidthAnim, {
        toValue: carouselOpenW,
        useNativeDriver: false, duration: DURATION.PLAYER, easing: easeOutCubic,
      }).start();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n]);

  useEffect(() => {
    if (!mixActive) {
      setStackOpen(true);
      stackWidthAnim.setValue(0);
      openProgress.setValue(1);
    }
  }, [mixActive]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!currentSession && !mixActive) {
    // El miniplayer del Mezclador solo aparece con el primer sonido activo.
    return null;
  }

  // ── Modo mezcla ───────────────────────────────────────────────
  if (mixActive) {
    const presetName = loadedPresetId
      ? presets.find((p) => p.id === loadedPresetId)?.name
      : null;
    const title = presetName || "Tu mezcla";

    const handleOpen = () =>
      loadedPresetId?.startsWith("community-")
        ? router.push("/(tabs)/musica" as never)
        : openSheet();

    return (
      <Animated.View
        style={[
          styles.mixOuter,
          {
            opacity: entryAnim,
            transform: [{ translateY: entryAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
          },
        ]}
      >
        {/* ── Píldora glass: réplica del tab bar horizontal ── */}
        <View style={styles.mixPill}>
          {/* 1. Blur base (igual al tab bar) */}
          <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
          {/* 2. Tinte violeta base */}
          <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(29,11,77,0.15)" }]} pointerEvents="none" />
          {/* 3. Inner glow vertical */}
          <LinearGradient
            colors={["rgba(255,255,255,0.07)", "rgba(255,255,255,0)"]}
            start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          {/* Tinte Universo (igual al tab bar) */}
          {activeSceneId === "tibet" && (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(20,33,77,0.45)" }]} pointerEvents="none" />
          )}
          {tibetTint}

          {/* ── Row principal ── */}
          <View style={styles.mixRow}>

            {/* Chevron arriba — toca para abrir la sheet */}
            <Pressable onPress={() => openSheetRef.current()} hitSlop={8} style={styles.chevronLeft}>
              <Feather name="chevron-up" size={27} color="rgba(255,255,255,0.95)" />
            </Pressable>

            {/* Stack / carrusel — ancho animado + maxWidth para que nunca empuje el play */}
            <Animated.View style={[styles.stackArea, { width: stackWidthAnim, transform: [{ translateY: -2 }] }]}>
              <ScrollView
                ref={scrollRef}
                horizontal
                scrollEnabled={stackOpen}
                showsHorizontalScrollIndicator={false}
                style={styles.stackScroll}
                contentContainerStyle={{ width: carouselContentW, height: STACK_SIZE }}
              >
                {activeSounds.map((s, i) => {
                  const image      = getSoundImage(s.id) ?? REMOTE_SOUND_IMAGE_MAP[s.id];
                  const translateX = openProgress.interpolate({
                    inputRange:  [0, 1],
                    outputRange: [0, i * openDelta],
                  });
                  return (
                    <StackThumbItem
                      key={s.id}
                      image={image}
                      style={[styles.stackThumb, { position: 'absolute', left: i * dynamicShift, zIndex: n - 1 - i, transform: [{ translateX }] }]}
                      onPress={toggleStack}
                      onLongPress={() => removeSound(s.id)}
                      primaryColor={colors.primary}
                    />
                  );
                })}
              </ScrollView>
            </Animated.View>

            {/* Contador de sonidos — solo visible con los thumbnails apilados */}
            <Animated.Text
              pointerEvents="none"
              style={[
                styles.stackCount,
                { opacity: openProgress.interpolate({ inputRange: [0, 0.35, 1], outputRange: [1, 0, 0] }) },
              ]}
            >
              {n} {n === 1 ? "sonido" : "sonidos"}
            </Animated.Text>

            {/* Botón play/pause — absoluto a la derecha, nunca se empuja */}
            <View style={[styles.waveWrap, { position: "absolute", right: 25, zIndex: 2, transform: [{ translateY: -2 }] }]}>
              {[wave1, wave2].map((w, idx) => (
                <Animated.View key={idx} pointerEvents="none" style={[styles.wave, styles.waveMix, {
                  opacity:   w.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 0.28, 0] }),
                  transform: [{ scale: w.interpolate({ inputRange: [0, 1], outputRange: [1, 1.7] }) }],
                }]} />
              ))}
              <Pressable onPress={(e) => { e.stopPropagation(); togglePlay(); }} style={styles.playPauseBtn}>
                <Svg width={22} height={22} viewBox="0 0 48 48">
                  {mixPlaying ? (
                    <>
                      <Rect x="7"  y="5" width="12" height="36" rx="5" ry="5" fill="#F9F9F9" />
                      <Rect x="27" y="5" width="12" height="36" rx="5" ry="5" fill="#F9F9F9" />
                    </>
                  ) : (
                    <Path d="M 13.2 7.1 Q 8 4 8 10 L 8 36 Q 8 42 13.2 38.9 L 34.8 26.1 Q 40 23 34.8 19.9 Z" fill="#F9F9F9" />
                  )}
                </Svg>
              </Pressable>
            </View>
          </View>

        </View>
      </Animated.View>
    );
  }

  // ── Modo sesión ───────────────────────────────────────────────
  const handleSessionPress = () => {
    router.push("/player" as never);
  };

  return (
    <Pressable onPress={handleSessionPress} style={styles.wrapper}>
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
          <Text style={[styles.sub, { color: "#F4F4F4" }]} numberOfLines={1}>
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
            style={[styles.btn, { backgroundColor: "rgba(255,255,255,0.15)", transform: [{ translateY: -2 }] }]}
          >
            <Svg width={18} height={18} viewBox="0 0 48 48">
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.16,
    shadowRadius: 6,
    elevation: 6,
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
    fontFamily: "Manrope",
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.2,
  },

  // ── Handle ────────────────────────────────────────────────────
  handleHitArea: {
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    marginVertical: -6,
  },
  handle: {
    width: 36,
    height: 3,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.25)",
  },

  chevronLeft: {
    justifyContent: "center",
    alignItems: "center",
    marginRight: 2,
  },

  // ── Píldora de mezcla (réplica del tab bar: altura 68, radio 999) ──
  mixPill: {
    overflow: "hidden",
    maxWidth: MAX_PLAYER_WIDTH,
    width: "100%",
    height: 68,
    borderRadius: 999,
    justifyContent: "center",
  },

  // ── Card (modo sesión, sin cambios) ───────────────────────────
  wrapper: {
    overflow: "hidden",
    maxWidth: MAX_PLAYER_WIDTH,
    width: "100%",
    borderTopLeftRadius: 999,
    borderTopRightRadius: 999,
    borderBottomLeftRadius: 999,
    borderBottomRightRadius: 999,
  },

  // ── Fila de mezcla ────────────────────────────────────────────
  mixRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 12,
    paddingRight: 84,
    gap: 10,
  },

  // ── Stack / carrusel: ancho animado, overflow visible (≥6 thumbs pasan por detrás) ─
  stackArea: {
    height: STACK_SIZE,
    overflow: "visible",
  },
  stackCount: {
    marginLeft: 12,
    fontFamily: "Manrope",
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(255,255,255,0.85)",
    transform: [{ translateY: -2 }],
  },
  stackScroll: {
    width: "100%",
    height: STACK_SIZE,
  },
  stackThumb: {
    width: STACK_SIZE,
    height: STACK_SIZE,
    borderRadius: 8,
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
    borderRadius: 999,
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
    fontFamily: "Manrope",
    fontSize: 13,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 1,
  },
  mixSub: {
    fontFamily: "Manrope",
    fontSize: 11,
    color: "#F4F4F4",
  },

  // ── Play/Pause ────────────────────────────────────────────────
  playPauseBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#204d90",
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
  title: { fontFamily: "Manrope", fontSize: 14, fontWeight: "600", marginBottom: 2 },
  sub:   { fontFamily: "Manrope", fontSize: 11 },
  btn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  progressBar: {
    height: 3,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  progressFill: {
    height: 3,
    backgroundColor: "rgba(255,255,255,0.85)",
    borderRadius: 1,
  },
});
