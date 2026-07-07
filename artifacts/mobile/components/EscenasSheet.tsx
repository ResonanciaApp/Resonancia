/**
 * EscenasSheet — panel de "Escenas" (sonido ambiente) en pantalla completa.
 * ─────────────────────────────────────────────────────────────────
 * Flujo de selección:
 *   1. Presionar una card → se achica (spring) mientras el dedo está apoyado.
 *   2. Al soltar → abre modal fullscreen de la escena + empieza el audio.
 *   3. En fullscreen: ajustar volumen, temporizador; botón "Elegir esta escena".
 *   4. Al confirmar: cierra fullscreen → vuelve a EscenasSheet → cambia tema
 *      con fade-in de 450ms → auto-cierra EscenasSheet 900ms después.
 *   5. Al cancelar (X): revierte audio a la escena anterior.
 * ─────────────────────────────────────────────────────────────────
 */
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import React, { useLayoutEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { VolumeSlider } from "@/components/VolumeSlider";
import { AMBIENT_SCENES, useAmbientPlayer, type SceneId } from "@/context/AmbientPlayerContext";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { DURATION, easeOutCubic } from "@/constants/motion";

const WARM = {
  border: "rgba(61,14,22,0.40)",
  divider: "rgba(255,255,255,0.055)",
} as const;

const TIMER_OPTIONS: Array<{ label: string; value: number | null }> = [
  { label: "Sin límite", value: null },
  { label: "15 minutos", value: 15 },
  { label: "30 minutos", value: 30 },
  { label: "45 minutos", value: 45 },
  { label: "60 minutos", value: 60 },
  { label: "90 minutos", value: 90 },
];

const SCREEN_W = Dimensions.get("window").width;
const SCREEN_H = Dimensions.get("window").height;
const SHEET_H_PAD = 24;
const CARD_GAP = 14;
const CARD_W = Math.floor((SCREEN_W - SHEET_H_PAD * 2) / 2.5) + 20 - 25;
const CARD_H = Math.floor(CARD_W * 1.55) + 40 + 30;

export function EscenasSheet() {
  const insets = useSafeAreaInsets();
  const { theme, setActiveSceneWithFade } = useSceneTheme();
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
  const timerMinutes = sleepTimerRemaining == null
    ? null
    : (TIMER_OPTIONS.find((o) => o.value != null && Math.abs(o.value * 60 - sleepTimerRemaining) <= 90)?.value ?? null);

  // ── Sheet entrance animation ─────────────────────────────────────────────
  const sheetEnterY = useRef(new Animated.Value(SCREEN_H)).current;

  useLayoutEffect(() => {
    if (isSheetOpen) {
      sheetEnterY.setValue(SCREEN_H);
      Animated.timing(sheetEnterY, {
        toValue: 0,
        duration: DURATION.SHEET_OPEN,
        easing: easeOutCubic,
        useNativeDriver: true,
      }).start();
    } else {
      sheetEnterY.setValue(SCREEN_H);
      setTimerOpen(false);
      setPreviewScene(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSheetOpen]);

  // ── Per-card scale animations (press feedback) ───────────────────────────
  const scaleAnims = useRef<Record<string, Animated.Value>>(
    Object.fromEntries(AMBIENT_SCENES.map((s) => [s.id, new Animated.Value(1)]))
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

  // ── Fullscreen preview ───────────────────────────────────────────────────
  const [previewScene, setPreviewScene] = useState<(typeof AMBIENT_SCENES)[0] | null>(null);
  const prevSceneIdRef = useRef<SceneId | null>(null);
  // Slide animation for the preview modal
  const previewSlideY = useRef(new Animated.Value(SCREEN_H)).current;
  const [previewVisible, setPreviewVisible] = useState(false);

  const openPreview = (scene: typeof AMBIENT_SCENES[0]) => {
    // Save current scene so we can revert if user cancels
    prevSceneIdRef.current = currentScene.id;
    setPreviewScene(scene);
    setPreviewVisible(true);
    previewSlideY.setValue(SCREEN_H);
    Animated.timing(previewSlideY, {
      toValue: 0,
      duration: 380,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
    // Start audio for this scene immediately
    setScene(scene.id);
    startAmbient();
  };

  const closePreviewWithSlide = (onDone?: () => void) => {
    Animated.timing(previewSlideY, {
      toValue: SCREEN_H,
      duration: 300,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setPreviewVisible(false);
      setPreviewScene(null);
      onDone?.();
    });
  };

  const handleCancelPreview = () => {
    // Revert to previous scene audio
    const prev = prevSceneIdRef.current;
    if (prev && prev !== previewScene?.id) {
      setScene(prev);
    }
    closePreviewWithSlide();
  };

  const handleConfirmScene = (id: SceneId) => {
    closePreviewWithSlide(() => {
      // Back in EscenasSheet — apply theme with 450ms fade-in
      setActiveSceneWithFade(id);
      // Auto-close EscenasSheet after 900ms so user sees the transition
      setTimeout(() => closeSheet(), 900);
    });
  };

  const soundOn = isPlaying && !isMuted;

  return (
    <>
      {/* ── Main Escenas Sheet ────────────────────────────────────────────── */}
      <Modal
        visible={isSheetOpen}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={closeSheet}
      >
        <Animated.View
          style={[
            styles.sheet,
            { transform: [{ translateY: sheetEnterY }] },
          ]}
        >
          <LinearGradient
            colors={theme.gradient}
            style={StyleSheet.absoluteFill}
          />
          <View style={{ paddingTop: Math.max(insets.top, 20), paddingBottom: Math.max(insets.bottom, 20), flex: 1 }}>
            <Pressable style={styles.closeBtn} onPress={closeSheet} hitSlop={10}>
              <Feather name="x" size={30} color="#FFFFFF" />
            </Pressable>
            <Text style={styles.title}>Escenas</Text>

            {/* Volumen de la escena */}
            <View style={styles.volumeRow}>
              <Feather name="volume-1" size={16} color="rgba(255,255,255,0.55)" />
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
              <Feather name="volume-2" size={16} color="rgba(255,255,255,0.55)" />
            </View>

            {/* Timer */}
            <Pressable style={styles.controlRow} onPress={() => setTimerOpen((v) => !v)}>
              <Feather name="clock" size={18} color="rgba(255,255,255,0.65)" style={styles.controlIcon} />
              <Text style={styles.controlLabel}>Reproducir sonidos fuera de la aplicación</Text>
              <View style={styles.timerTrigger}>
                <Text style={styles.timerTriggerLabel}>
                  {(TIMER_OPTIONS.find((o) => o.value === timerMinutes)?.label ?? "Sin límite").toUpperCase()}
                </Text>
                <Feather name={timerOpen ? "chevron-up" : "chevron-down"} size={16} color="rgba(255,255,255,0.65)" />
              </View>
            </Pressable>
            {timerOpen && (
              <View style={styles.timerDropdown}>
                {TIMER_OPTIONS.map((opt) => {
                  const active = timerMinutes === opt.value;
                  return (
                    <Pressable
                      key={String(opt.value)}
                      onPress={() => { setSleepTimer(opt.value); setTimerOpen(false); }}
                      style={[styles.timerDropItem, active && styles.timerDropItemActive]}
                    >
                      <Text style={[styles.timerDropItemText, active && styles.timerDropItemTextActive]}>
                        {opt.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}

            <View style={styles.divider} />

            <View style={styles.sceneTitleRow}>
              <MaterialCommunityIcons name="spa" size={18} color="#F4F4F4" />
              <Text style={styles.sceneTitle}>Escenas</Text>
            </View>

            {/* Carousel de escenas */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.carousel}
              decelerationRate="fast"
              snapToInterval={CARD_W + CARD_GAP}
              snapToAlignment="start"
            >
              {AMBIENT_SCENES.map((scene) => {
                const active = scene.id === currentScene.id;
                return (
                  <Pressable
                    key={scene.id}
                    style={styles.cardWrap}
                    onPressIn={() => handlePressIn(scene.id)}
                    onPressOut={() => handlePressOut(scene.id)}
                    onPress={() => openPreview(scene)}
                  >
                    <Animated.View
                      style={[
                        styles.card,
                        { borderColor: active ? "rgba(255,255,255,0.9)" : WARM.border },
                        { transform: [{ scale: scaleAnims[scene.id] }] },
                      ]}
                    >
                      <Image source={scene.image} style={StyleSheet.absoluteFill} contentFit="cover" />
                      {active && soundOn ? (
                        <View style={styles.playingBadge}>
                          <Feather name="volume-2" size={12} color="#D4AF37" />
                        </View>
                      ) : null}
                    </Animated.View>
                    <Text style={[styles.cardLabel, active && styles.cardLabelActive]} numberOfLines={1}>
                      {scene.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </Animated.View>
      </Modal>

      {/* ── Fullscreen Preview Modal ──────────────────────────────────────── */}
      <Modal
        visible={previewVisible}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={handleCancelPreview}
      >
        <Animated.View
          style={[styles.previewRoot, { transform: [{ translateY: previewSlideY }] }]}
        >
          {previewScene && (
            <>
              {/* Fondo: imagen de la escena */}
              <Image
                source={previewScene.image}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
              />
              {/* Degradado oscuro encima de la imagen */}
              <LinearGradient
                colors={["rgba(0,0,0,0.55)", "rgba(0,0,0,0.72)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={StyleSheet.absoluteFill}
              />

              {/* Top row */}
              <View style={[styles.previewTop, { paddingTop: Math.max(insets.top, 20) + 12 }]}>
                <Pressable onPress={handleCancelPreview} hitSlop={14} style={styles.previewIconBtn}>
                  <Feather name="x" size={22} color="#FFF" />
                </Pressable>
                <Text style={styles.previewTitle}>{previewScene.label}</Text>
                <View style={styles.previewIconBtn} />
              </View>

              {/* Contenido scrollable */}
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[
                  styles.previewScroll,
                  { paddingBottom: insets.bottom + 120 },
                ]}
              >
                {/* Volumen */}
                <View style={styles.previewSection}>
                  <View style={styles.previewSectionHeader}>
                    <Feather name="volume-2" size={16} color="rgba(255,255,255,0.7)" />
                    <Text style={styles.previewSectionLabel}>Volumen de la escena</Text>
                  </View>
                  <View style={styles.previewSliderRow}>
                    <Feather name="volume-1" size={14} color="rgba(255,255,255,0.45)" />
                    <View style={{ flex: 1 }}>
                      <VolumeSlider
                        value={volume}
                        onChange={setVolume}
                        color="#FFFFFF"
                        trackColor="rgba(255,255,255,0.35)"
                        thickness={6}
                        showThumb={false}
                        fillOpacity={1}
                      />
                    </View>
                    <Feather name="volume-2" size={14} color="rgba(255,255,255,0.45)" />
                  </View>
                </View>

                <View style={styles.previewDivider} />

                {/* Timer */}
                <Pressable
                  style={styles.previewSection}
                  onPress={() => setTimerOpen((v) => !v)}
                >
                  <View style={styles.previewSectionHeader}>
                    <Feather name="clock" size={16} color="rgba(255,255,255,0.7)" />
                    <Text style={styles.previewSectionLabel}>Reproducir fuera de la app</Text>
                    <View style={styles.timerTrigger}>
                      <Text style={[styles.timerTriggerLabel, { color: "rgba(255,255,255,0.65)" }]}>
                        {(TIMER_OPTIONS.find((o) => o.value === timerMinutes)?.label ?? "Sin límite").toUpperCase()}
                      </Text>
                      <Feather name={timerOpen ? "chevron-up" : "chevron-down"} size={14} color="rgba(255,255,255,0.65)" />
                    </View>
                  </View>
                </Pressable>
                {timerOpen && (
                  <View style={[styles.timerDropdown, { marginHorizontal: 0, marginBottom: 8 }]}>
                    {TIMER_OPTIONS.map((opt) => {
                      const active = timerMinutes === opt.value;
                      return (
                        <Pressable
                          key={String(opt.value)}
                          onPress={() => { setSleepTimer(opt.value); setTimerOpen(false); }}
                          style={[styles.timerDropItem, active && styles.timerDropItemActive]}
                        >
                          <Text style={[styles.timerDropItemText, active && styles.timerDropItemTextActive]}>
                            {opt.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              </ScrollView>

              {/* CTA button — absoluto en el fondo */}
              <View style={[styles.previewBottom, { paddingBottom: insets.bottom + 32 }]}>
                <Pressable
                  style={({ pressed }) => [
                    styles.ctaBtn,
                    previewScene.id === currentScene.id && styles.ctaBtnActive,
                    { opacity: pressed ? 0.85 : 1 },
                  ]}
                  onPress={() => handleConfirmScene(previewScene.id)}
                >
                  {previewScene.id === currentScene.id && (
                    <Feather name="check" size={16} color={theme.gradient[0]} style={{ marginRight: 6 }} />
                  )}
                  <Text style={[
                    styles.ctaBtnText,
                    previewScene.id === currentScene.id && { color: theme.gradient[0] },
                  ]}>
                    {previewScene.id === currentScene.id ? "Escena activa" : "Elegir esta escena"}
                  </Text>
                </Pressable>
              </View>
            </>
          )}
        </Animated.View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  // ── Main sheet ────────────────────────────────────────────────────────────
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    paddingHorizontal: SHEET_H_PAD,
  },
  closeBtn: {
    alignSelf: "flex-start",
    width: 43,
    height: 43,
    borderRadius: 21.5,
    backgroundColor: "rgba(0,0,0,0.20)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 25,
    fontWeight: "600",
    color: "#e8e8e8",
    textAlign: "center",
    marginBottom: 24,
  },
  volumeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 18,
  },
  sliderWrap: {
    flex: 1,
  },
  controlRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 10,
  },
  controlIcon: {
    width: 20,
  },
  controlLabel: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: "500",
    color: "#e8e8e8",
  },
  timerTrigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  timerTriggerLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(255,255,255,0.65)",
    letterSpacing: 0.3,
  },
  timerDropdown: {
    backgroundColor: "rgba(255,255,255,0.055)",
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 4,
  },
  timerDropItem: {
    paddingVertical: 13,
    paddingHorizontal: 18,
    alignItems: "center",
  },
  timerDropItemActive: {
    backgroundColor: "rgba(212,175,55,0.18)",
  },
  timerDropItemText: {
    fontSize: 14,
    fontWeight: "500",
    color: "rgba(242,231,228,0.75)",
  },
  timerDropItemTextActive: {
    color: "#D4AF37",
    fontWeight: "700",
  },
  divider: {
    height: 1,
    backgroundColor: WARM.divider,
    marginVertical: 14,
  },
  sceneTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 20,
  },
  sceneTitle: {
    fontSize: 16,
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
    borderRadius: 25,
    borderWidth: 1,
    overflow: "hidden",
    backgroundColor: "#111",
  },
  cardLabel: {
    marginTop: 8,
    fontSize: 12,
    color: "rgba(255,255,255,0.75)",
  },
  cardLabelActive: {
    color: "rgba(255,255,255,0.95)",
    fontWeight: "600",
  },
  playingBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.45)",
    borderRadius: 10,
    padding: 3,
  },

  // ── Fullscreen preview ────────────────────────────────────────────────────
  previewRoot: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "#000",
  },
  previewTop: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  previewIconBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.35)",
    borderRadius: 20,
  },
  previewTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "700",
    color: "#FFF",
    letterSpacing: 0.3,
  },
  previewScroll: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  previewSection: {
    paddingVertical: 16,
  },
  previewSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
  },
  previewSectionLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255,255,255,0.85)",
  },
  previewSliderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  previewDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255,255,255,0.12)",
    marginVertical: 4,
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
    borderRadius: 50,
    paddingVertical: 16,
    paddingHorizontal: 32,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  ctaBtnActive: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.6)",
  },
  ctaBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1A22",
    letterSpacing: 0.2,
  },
});
