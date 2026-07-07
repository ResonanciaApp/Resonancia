/**
 * EscenasSheet — panel de "Escenas" (sonido ambiente).
 * ─────────────────────────────────────────────────────────────────
 * Flujo de selección:
 *   1. Presionar card → se achica (spring) mientras el dedo está apoyado.
 *   2. Soltar → preview fullscreen sube desde abajo (dentro del mismo Modal)
 *      + sonido de la escena arranca.
 *   3. En preview: ajustar volumen / temporizador; botón "Elegir esta escena".
 *   4. Confirmar → preview baja, vuelve al listado, tema cambia con fade 450ms,
 *      EscenasSheet se cierra solo 900ms después.
 *   5. Cancelar (X) → preview baja, audio revierte a escena anterior.
 *
 * NOTA DE ARQUITECTURA: se usa UN SOLO Modal para todo. Montar un segundo
 * Modal encima del primero no funciona en React Native (el segundo no se
 * muestra). El preview es un Animated.View absoluteFill dentro del mismo Modal.
 * ─────────────────────────────────────────────────────────────────
 */
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { VolumeSlider } from "@/components/VolumeSlider";
import { AMBIENT_SCENES, useAmbientPlayer, type SceneId } from "@/context/AmbientPlayerContext";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { DURATION, easeOutCubic } from "@/constants/motion";

const SCREEN_W = Dimensions.get("window").width;
const SCREEN_H = Dimensions.get("window").height;
const SHEET_H_PAD = 24;
const CARD_GAP = 14;
const CARD_W = Math.floor((SCREEN_W - SHEET_H_PAD * 2) / 2.5) - 15;
const CARD_H = Math.floor(CARD_W * 1.55) + 75;

const WARM_DIVIDER = "rgba(255,255,255,0.055)";

const TIMER_OPTIONS: Array<{ label: string; value: number | null }> = [
  { label: "Sin límite", value: null },
  { label: "15 minutos", value: 15 },
  { label: "30 minutos", value: 30 },
  { label: "45 minutos", value: 45 },
  { label: "60 minutos", value: 60 },
  { label: "90 minutos", value: 90 },
];

export function EscenasSheet() {
  const insets = useSafeAreaInsets();
  const { theme, setActiveSceneWithFade, overlayColors, overlayOpacity } = useSceneTheme();
  const {
    currentScene,
    isPlaying,
    isMuted,
    volume,
    setVolume,
    setScene,
    startAmbient,
    isSheetOpen,
    closeSheet,
    sleepTimerRemaining,
    setSleepTimer,
  } = useAmbientPlayer();

  const [timerOpen, setTimerOpen] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(false);
  // ID de la escena CONFIRMADA (la que muestra el borde blanco en el carrusel).
  // Se actualiza solo cuando el usuario presiona "Elegir escena", NO al abrir el preview.
  const [confirmedSceneId, setConfirmedSceneId] = useState<SceneId>(currentScene.id);
  const timerMinutes =
    sleepTimerRemaining == null
      ? null
      : (TIMER_OPTIONS.find(
          (o) => o.value != null && Math.abs(o.value * 60 - sleepTimerRemaining) <= 90,
        )?.value ?? null);

  // ── Sheet entrance / exit animations ─────────────────────────────────────
  const sheetEnterY = useRef(new Animated.Value(SCREEN_H)).current;

  /** Anima el sheet hacia abajo y luego llama a closeSheet(). */
  const handleClose = useCallback(() => {
    Animated.timing(sheetEnterY, {
      toValue: SCREEN_H,
      duration: 460,
      easing: easeOutCubic,
      useNativeDriver: true,
    }).start(() => closeSheet());
  }, [sheetEnterY, closeSheet]);

  useLayoutEffect(() => {
    if (isSheetOpen) {
      sheetEnterY.setValue(SCREEN_H);
      Animated.timing(sheetEnterY, {
        toValue: 0,
        duration: DURATION.SHEET_OPEN,
        easing: easeOutCubic,
        useNativeDriver: true,
      }).start();
      // Sincronizar el borde con la escena activa al abrir
      setConfirmedSceneId(currentScene.id);
    } else {
      // La animación de cierre ya llevó sheetEnterY a SCREEN_H; solo limpiar estado
      setTimerOpen(false);
      setPreviewScene(null);
      previewSlideY.setValue(SCREEN_H);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSheetOpen]);

  // ── Per-card scale animations ─────────────────────────────────────────────
  const scaleAnims = useRef<Record<string, Animated.Value>>(
    Object.fromEntries(AMBIENT_SCENES.map((s) => [s.id, new Animated.Value(1)])),
  ).current;

  const handlePressIn = (id: SceneId) => {
    Animated.spring(scaleAnims[id], {
      toValue: 0.91,
      useNativeDriver: true,
      speed: 60,
      bounciness: 0,
    }).start();
  };

  const handlePressOut = (id: SceneId) => {
    Animated.spring(scaleAnims[id], {
      toValue: 1,
      useNativeDriver: true,
      speed: 18,
      bounciness: 3,
    }).start();
  };

  // ── Fullscreen preview (dentro del mismo Modal) ───────────────────────────
  const [previewScene, setPreviewScene] = useState<(typeof AMBIENT_SCENES)[0] | null>(null);
  const prevSceneIdRef = useRef<SceneId | null>(null);
  const previewSlideY = useRef(new Animated.Value(SCREEN_H)).current;

  // Arrancar la animación DESPUÉS de que el Animated.View se monte
  useEffect(() => {
    if (!previewScene) return;
    Animated.timing(previewSlideY, {
      toValue: 0,
      duration: 380,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewScene]);

  const handleOpenPreview = (scene: (typeof AMBIENT_SCENES)[0]) => {
    prevSceneIdRef.current = currentScene.id;
    // Posicionar el preview fuera de pantalla antes de montarlo
    previewSlideY.setValue(SCREEN_H);
    setPreviewScene(scene);
    // Arrancar audio inmediatamente
    setScene(scene.id);
    startAmbient();
  };

  const closePreviewAnimated = (onDone?: () => void) => {
    Animated.timing(previewSlideY, {
      toValue: SCREEN_H,
      duration: 300,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setPreviewScene(null);
      previewSlideY.setValue(SCREEN_H);
      onDone?.();
    });
  };

  const handleCancelPreview = () => {
    // Revertir audio
    const prev = prevSceneIdRef.current;
    if (prev && prev !== previewScene?.id) {
      setScene(prev);
    }
    closePreviewAnimated();
  };

  const handleConfirmScene = (id: SceneId) => {
    setConfirmedSceneId(id);
    closePreviewAnimated(() => {
      // Volver al listado → aplicar fade del tema (el sheet queda abierto)
      setActiveSceneWithFade(id);
    });
  };

  const soundOn = isPlaying && !isMuted;

  return (
    <Modal
      visible={isSheetOpen}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      {/* ── Listado de escenas ──────────────────────────────────────────────── */}
      <Animated.View
        style={[styles.sheet, { transform: [{ translateY: sheetEnterY }] }]}
      >
        {/* Fondo fijo (tema actual — no cambia durante la transición) */}
        <LinearGradient colors={theme.gradient} style={StyleSheet.absoluteFill} />
        {/* Nuevo tema entrando detrás del contenido — el contenido NUNCA se tapa */}
        {overlayColors && (
          <Animated.View
            style={[StyleSheet.absoluteFill, { opacity: overlayOpacity }]}
            pointerEvents="none"
          >
            <LinearGradient
              colors={[...overlayColors] as [string, string]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        )}
        <View style={{ paddingTop: Math.max(insets.top, 20), paddingBottom: Math.max(insets.bottom, 20), flex: 1 }}>
          <Pressable style={styles.closeBtn} onPress={handleClose} hitSlop={10}>
            <Feather name="x" size={28} color="#FFFFFF" />
          </Pressable>
          <Text style={styles.title}>Escenas</Text>

          {/* Volumen */}
          <View style={styles.volumeRow}>
            <View style={styles.volumeLabelGroup}>
              <MaterialCommunityIcons name="spa" size={17} color="rgba(255,255,255,0.65)" style={styles.controlIcon} />
              <Text style={styles.controlLabel}>Volumen de la escena</Text>
            </View>
            <View style={styles.sliderGroup}>
              <Feather name="volume-x" size={13} color="rgba(255,255,255,0.45)" />
              <View style={styles.sliderWrap}>
                <VolumeSlider
                  value={volume}
                  onChange={setVolume}
                  color="#FFFFFF"
                  trackColor="rgba(255,255,255,0.6)"
                  thickness={7}
                  showThumb={false}
                  fillOpacity={1}
                />
              </View>
              <Feather name="volume-2" size={13} color="rgba(255,255,255,0.45)" />
            </View>
          </View>

          {/* Timer */}
          <Pressable style={styles.controlRow} onPress={() => setTimerOpen((v) => !v)}>
            <Feather name="clock" size={17} color="rgba(255,255,255,0.65)" style={styles.controlIcon} />
            <Text style={styles.controlLabel}>Reproducir sonidos fuera de la aplicación</Text>
            <View style={styles.timerTrigger}>
              <Text style={styles.timerTriggerLabel}>
                {(
                  TIMER_OPTIONS.find((o) => o.value === timerMinutes)?.label ?? "Sin límite"
                ).toUpperCase()}
              </Text>
              <Feather
                name={timerOpen ? "chevron-up" : "chevron-down"}
                size={14}
                color="rgba(255,255,255,0.55)"
              />
            </View>
          </Pressable>
          {timerOpen && (
            <View style={styles.timerDropdown}>
              {TIMER_OPTIONS.map((opt) => {
                const active = timerMinutes === opt.value;
                return (
                  <Pressable
                    key={String(opt.value)}
                    onPress={() => {
                      setSleepTimer(opt.value);
                      setTimerOpen(false);
                    }}
                    style={[styles.timerDropItem, active && styles.timerDropItemActive]}
                  >
                    <Text
                      style={[
                        styles.timerDropItemText,
                        active && styles.timerDropItemTextActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}

          {/* Video de la escena */}
          <View style={styles.controlRow}>
            <Feather name="video" size={17} color="rgba(255,255,255,0.65)" style={styles.controlIcon} />
            <Text style={styles.controlLabel}>Reproducir videos de la escena</Text>
            <Switch
              value={videoEnabled}
              onValueChange={setVideoEnabled}
              trackColor={{ false: "rgba(255,255,255,0.18)", true: "#D4AF37" }}
              thumbColor="#FFFFFF"
              ios_backgroundColor="rgba(255,255,255,0.18)"
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.sceneTitleRow}>
            <MaterialCommunityIcons name="spa" size={16} color="rgba(255,255,255,0.8)" />
            <Text style={styles.sceneTitle}>Escenas</Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.carousel}
            decelerationRate="fast"
            snapToInterval={CARD_W + CARD_GAP}
            snapToAlignment="start"
          >
            {AMBIENT_SCENES.map((scene) => {
              const active = scene.id === confirmedSceneId;
              return (
                <Pressable
                  key={scene.id}
                  style={styles.cardWrap}
                  onPressIn={() => handlePressIn(scene.id)}
                  onPressOut={() => handlePressOut(scene.id)}
                  onPress={() => handleOpenPreview(scene)}
                >
                  <Animated.View
                    style={[
                      styles.card,
                      active && styles.cardActive,
                      { transform: [{ scale: scaleAnims[scene.id] }] },
                    ]}
                  >
                    <Image
                      source={scene.image}
                      style={StyleSheet.absoluteFill}
                      contentFit="cover"
                    />
                    {active && soundOn ? (
                      <View style={styles.playingBadge}>
                        <Feather name="volume-2" size={11} color="#D4AF37" />
                      </View>
                    ) : null}
                  </Animated.View>
                  <Text
                    style={[styles.cardLabel, active && styles.cardLabelActive]}
                    numberOfLines={1}
                  >
                    {scene.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </Animated.View>

      {/* ── Preview fullscreen (mismo Modal, absoluteFill encima) ─────────── */}
      {previewScene != null && (
        <Animated.View
          style={[styles.previewRoot, { transform: [{ translateY: previewSlideY }] }]}
        >
          {/* Imagen de fondo */}
          <Image
            source={previewScene.image}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
          />
          {/* Degradado oscuro */}
          <LinearGradient
            colors={["rgba(0,0,0,0.52)", "rgba(0,0,0,0.78)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
          />

          {/* Top row */}
          <View style={[styles.previewTop, { paddingTop: Math.max(insets.top, 20) + 10 }]}>
            <Pressable onPress={handleCancelPreview} hitSlop={10} style={styles.previewIconBtn}>
              <Feather name="x" size={28} color="#FFF" />
            </Pressable>
            <Text style={styles.previewTitle}>{previewScene.label}</Text>
          </View>

          {/* CTA anclado al fondo */}
          <View style={[styles.previewBottom, { paddingBottom: insets.bottom + 32 }]}>
            <Pressable
              style={({ pressed }) => [styles.ctaBtn, { opacity: pressed ? 0.82 : 1 }]}
              onPress={() => handleConfirmScene(previewScene.id)}
            >
              <Text style={styles.ctaBtnText}>Elegir escena</Text>
            </Pressable>
          </View>
        </Animated.View>
      )}

    </Modal>
  );
}

const styles = StyleSheet.create({
  // ── Main sheet ─────────────────────────────────────────────────────────────
  sheet: {
    ...StyleSheet.absoluteFillObject,
    paddingHorizontal: SHEET_H_PAD,
  },
  closeBtn: {
    alignSelf: "flex-start",
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(0,0,0,0.22)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: "#e8e8e8",
    textAlign: "center",
    marginBottom: 22,
  },
  volumeRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    gap: 10,
  },
  volumeLabelGroup: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  sliderGroup: {
    width: 175,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  sliderWrap: { flex: 1 },
  controlRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    gap: 10,
  },
  controlIcon: { width: 20 },
  controlLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: "500",
    color: "rgba(242,231,228,0.8)",
  },
  timerTrigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  timerTriggerLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(255,255,255,0.6)",
    letterSpacing: 0.3,
  },
  timerDropdown: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 4,
  },
  timerDropItem: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    alignItems: "center",
  },
  timerDropItemActive: {
    backgroundColor: "rgba(212,175,55,0.18)",
  },
  timerDropItemText: {
    fontSize: 14,
    fontWeight: "500",
    color: "rgba(242,231,228,0.7)",
  },
  timerDropItemTextActive: {
    color: "#D4AF37",
    fontWeight: "700",
  },
  divider: {
    height: 1,
    backgroundColor: WARM_DIVIDER,
    marginVertical: 12,
  },
  sceneTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 18,
  },
  sceneTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#F4F4F4",
    letterSpacing: 0.2,
  },
  carousel: {
    flexDirection: "row",
    gap: CARD_GAP,
    paddingBottom: 4,
  },
  cardWrap: {
    width: CARD_W,
    alignItems: "center",
  },
  card: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(61,14,22,0.40)",
    overflow: "hidden",
    backgroundColor: "#111",
  },
  cardActive: {
    borderColor: "rgba(255,255,255,0.75)",
    borderWidth: 2,
  },
  cardLabel: {
    marginTop: 7,
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
  },
  cardLabelActive: {
    color: "#FFF",
    fontWeight: "600",
  },
  playingBadge: {
    position: "absolute",
    top: 7,
    right: 7,
    backgroundColor: "rgba(0,0,0,0.45)",
    borderRadius: 10,
    padding: 3,
  },

  // ── Fullscreen preview ──────────────────────────────────────────────────────
  previewRoot: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000",
  },
  previewTop: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  previewIconBtn: {
    width: 52,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.42)",
    borderRadius: 26,
  },
  previewTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 19,
    fontWeight: "700",
    color: "#FFF",
    letterSpacing: 0.3,
  },
  previewScroll: {
    paddingHorizontal: 24,
    paddingTop: 4,
  },
  previewSection: {
    paddingVertical: 14,
  },
  previewSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  previewSectionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255,255,255,0.82)",
  },
  previewSliderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  previewDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginVertical: 2,
  },
  previewBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  ctaBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 100,
    paddingVertical: 18,
    paddingHorizontal: 32,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 8,
  },
  ctaBtnActive: {},
  ctaBtnText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2D2D2D",
    letterSpacing: 0.15,
  },
});
