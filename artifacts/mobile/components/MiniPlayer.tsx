import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
  LayoutChangeEvent,
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

const MAX_PLAYER_WIDTH    = 438;
const STACK_SIZE          = 38;
const STACK_SHIFT         = 15;   // offset apilado (cerrado)
const SHIFT_OPEN          = 48;   // offset desplegado (se adapta si hay muchos sonidos)
const TEXT_MIN_WIDTH      = 52;   // umbral para ocultar texto
const CAROUSEL_THRESHOLD  = 4;    // a partir de 5 sonidos → modo carrusel deslizable
const CAROUSEL_THUMB_GAP  = 6;    // separación entre thumbnails en el carrusel

const GRAD_COLORS: [string, string] = ["#2A153D", "#3C1D58"];
const MIX_BG      = "#3d304e";
const PILL_BORDER = "rgba(110,80,200,0.5)";
const BORDER_R    = 12;

export function MiniPlayer() {
  const { currentSession, isPlaying, progress, pauseResume } = usePlayer();
  const {
    activeSounds,
    isPlaying: mixPlaying,
    togglePlay,
    presets,
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

  // Evita que el Pressable padre interprete el touchEnd de un scroll
  // en el carrusel como un tap (que colapsaría el carrusel).
  const scrollingRef  = useRef(false);
  const scrollTimer   = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onCarouselScrollStart = () => {
    if (scrollTimer.current) clearTimeout(scrollTimer.current);
    scrollingRef.current = true;
  };
  const onCarouselScrollEnd = () => {
    // Resetear con delay para que el onPress del Pressable ya haya evaluado
    scrollTimer.current = setTimeout(() => { scrollingRef.current = false; }, 250);
  };

  const toggleStack = () => {
    if (scrollingRef.current) return;   // ignorar press tras scroll
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

  // ── Visibilidad del texto ─────────────────────────────────────
  // Bug original: al montar con el 1er sonido rowWidthRef=0 → available<0 →
  // texto oculto. Fix: función compartida que tanto onRowLayout como el
  // useEffect llaman; si rowWidth=0 (layout aún no medido) no hace nada.
  const textOpacity = useRef(new Animated.Value(1)).current;
  const rowWidthRef = useRef(0);

  const updateTextOpacity = useCallback(
    (rowW: number, n: number, isOpen: boolean) => {
      if (rowW === 0 || n === 0) return;
      const isCarousel = n > CAROUSEL_THRESHOLD;
      let stackW: number;
      if (isCarousel && isOpen) {
        // carrusel abierto: ocupa casi todo el ancho
        stackW = Math.max(80, rowW - 86);
      } else if (!isCarousel && isOpen && n > 1) {
        // spread abierto: usar shiftOpen real (mismo cálculo que el JSX)
        const shiftOpen = Math.min(SHIFT_OPEN, Math.floor((260 - STACK_SIZE) / (n - 1)));
        stackW = STACK_SIZE + (n - 1) * shiftOpen;
      } else {
        // apilado (cerrado) — cualquier modo
        stackW = STACK_SIZE + Math.max(0, n - 1) * STACK_SHIFT;
      }
      const available = rowW - stackW - 86;
      Animated.timing(textOpacity, {
        toValue: available >= TEXT_MIN_WIDTH ? 1 : 0,
        duration: 120,
        useNativeDriver: true,
      }).start();
    },
    [textOpacity],
  );

  // onRowLayout dispara en el primer render → llama updateTextOpacity con el
  // ancho real, corrigiendo el estado incorrecto que dejó el efecto inicial.
  const onRowLayout = useCallback(
    (e: LayoutChangeEvent) => {
      const w = e.nativeEvent.layout.width;
      rowWidthRef.current = w;
      updateTextOpacity(w, activeSounds.length, stackOpen);
    },
    [activeSounds.length, stackOpen, updateTextOpacity],
  );

  useEffect(() => {
    updateTextOpacity(rowWidthRef.current, activeSounds.length, stackOpen);
  }, [activeSounds.length, stackOpen, updateTextOpacity]);

  if (!currentSession && !mixActive) return null;

  // ── Modo mezcla ───────────────────────────────────────────────
  if (mixActive) {
    const n = activeSounds.length;

    // Nombre del preset cargado (si existe) o "Tu mezcla"
    const presetName = loadedPresetId
      ? presets.find((p) => p.id === loadedPresetId)?.name
      : null;
    const title = presetName || "Tu mezcla";

    // ¿Modo carrusel deslizable? (más de CAROUSEL_THRESHOLD sonidos)
    const isCarouselMode = n > CAROUSEL_THRESHOLD;
    // Ancho disponible para el carrusel = fila total − padding − gap − botón play
    const carouselOpenWidth = Math.max(80, rowWidthRef.current - 86);

    // Offset adaptativo al desplegar (solo en modo spread)
    const shiftOpen = (!isCarouselMode && n > 1)
      ? Math.min(SHIFT_OPEN, Math.floor((260 - STACK_SIZE) / (n - 1)))
      : 0;

    // Ancho del stack según modo y estado (apilado / desplegado)
    const stackWidthStacked = STACK_SIZE + Math.max(0, n - 1) * STACK_SHIFT;
    const stackWidthOpen    = isCarouselMode
      ? carouselOpenWidth
      : STACK_SIZE + Math.max(0, n - 1) * shiftOpen;
    const animatedStackWidth = stackOpenAnim.interpolate({
      inputRange:  [0, 1],
      outputRange: [stackWidthStacked, stackWidthOpen],
    });

    const handleOpen = () =>
      loadedPresetId?.startsWith("community-")
        ? router.push("/(tabs)/musica" as never)
        : openSheet();

    return (
      <View style={styles.mixOuter}>
        {/* ── Píldora "Abrir" — SOBRE la card ── */}
        <View style={styles.pillRow}>
          <Pressable
            onPress={handleOpen}
            style={styles.openPill}
            accessibilityRole="button"
            accessibilityLabel="Abrir Tu Mezcla"
          >
            <Feather name="chevron-up" size={15} color="#FFFFFF" />
          </Pressable>
        </View>

        {/* ── Card del miniplayer ── */}
        <View style={styles.wrapper}>
          <View style={[StyleSheet.absoluteFill, { backgroundColor: MIX_BG }]} />

          <View style={styles.mixRow} onLayout={onRowLayout}>
            {/* Stack: Pressable envuelve el Animated.View para que el
                área táctil coincida exactamente con el ancho animado.
                Los thumbs son position:absolute dentro del Animated.View
                (no del Pressable) para que rendericen correctamente. */}
            <Pressable
              onPress={toggleStack}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel={stackOpen ? "Colapsar" : "Desplegar sonidos"}
            >
              <Animated.View style={[styles.stackArea, { width: animatedStackWidth }]}>

                {/* ── Modo carrusel: scroll horizontal (>6 sonidos, abierto) ── */}
                {isCarouselMode && stackOpen ? (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.carouselScroll}
                    contentContainerStyle={styles.carouselContent}
                    onScrollBeginDrag={onCarouselScrollStart}
                    onScrollEndDrag={onCarouselScrollEnd}
                    onMomentumScrollEnd={onCarouselScrollEnd}
                  >
                    {activeSounds.map((s) => {
                      const image = getSoundImage(s.id);
                      return (
                        <View key={s.id} style={styles.carouselThumb}>
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
                        </View>
                      );
                    })}
                  </ScrollView>
                ) : (
                  /* ── Modo spread: posición animada (≤6 sonidos) ── */
                  activeSounds.map((s, i) => {
                    const leftAnim = stackOpenAnim.interpolate({
                      inputRange:  [0, 1],
                      outputRange: [i * STACK_SHIFT, i * shiftOpen],
                    });
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
                  })
                )}

              </Animated.View>
            </Pressable>

            {/* Texto: "Tu mezcla" + cantidad de sonidos.
                La opacidad se actualiza en el useEffect de activeSounds.length,
                sin esperar al ciclo de layout. */}
            <Animated.View
              style={[styles.textBlock, { opacity: textOpacity }]}
            >
              <Text style={styles.mixTitle} numberOfLines={1}>{title}</Text>
              <Text style={styles.mixSub} numberOfLines={1}>
                {n} {n === 1 ? "sonido" : "sonidos"}
              </Text>
            </Animated.View>

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

  // ── Card ──────────────────────────────────────────────────────
  wrapper: {
    borderRadius: BORDER_R,
    overflow: "hidden",
    maxWidth: MAX_PLAYER_WIDTH,
    width: "100%",
  },

  // ── Fila de mezcla ────────────────────────────────────────────
  mixRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 12,
    paddingRight: 10,
    paddingVertical: 10,
    gap: 10,
  },

  // ── Stack de thumbnails ───────────────────────────────────────
  // Ancho controlado por animatedStackWidth (Animated.View, no Pressable)
  stackArea: {
    height: STACK_SIZE,
    // Sin overflow:hidden para que el de-stack pueda salir del área
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

  // ── Carrusel deslizable (>6 sonidos, abierto) ─────────────────
  carouselScroll: {
    width: "100%",
    height: STACK_SIZE,
  },
  carouselContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: CAROUSEL_THUMB_GAP,
    paddingRight: 4,
  },
  carouselThumb: {
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

  // ── Texto dinámico (Tu mezcla + cantidad) ─────────────────────
  // flex:1 → ocupa el espacio sobrante entre stack y play.
  // Cuando el stack crece y lo "empuja", onLayout detecta que el
  // ancho cayó por debajo de TEXT_MIN_WIDTH y textOpacity → 0.
  textBlock: {
    flex: 1,
    minWidth: 0,
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
