/**
 * InmersivoMixer — pantalla full-screen del Mezclador.
 * Fondo: degradado animado o imagen de naturaleza (con overlay).
 * Mensajes rotan con crossfade. Controles auto-ocultan a los 3s.
 * Fase 3: timer de sueño configurable directamente desde aquí.
 */
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useMixer } from "@/context/MixerContext";
import { getSoundById } from "@/data/sounds";
import { GRADIENT_PRESETS, DEFAULT_BG_PRESET_ID } from "@/config/immersive-presets";
import { MESSAGE_PACKS, DEFAULT_MESSAGE_PACK_ID } from "@/data/immersive-messages";

// ── Constantes ──────────────────────────────────────────────────────────────
const CONTROLS_TIMEOUT = 3500;
const MSG_DISPLAY_MS   = 14000;
const MSG_FADE_MS      = 900;

// Opciones de timer: [label, minutos]
const TIMER_OPTIONS: Array<{ label: string; minutes: number }> = [
  { label: "5 min",  minutes: 5 },
  { label: "10 min", minutes: 10 },
  { label: "15 min", minutes: 15 },
  { label: "20 min", minutes: 20 },
  { label: "30 min", minutes: 30 },
  { label: "45 min", minutes: 45 },
  { label: "1 h",    minutes: 60 },
  { label: "90 min", minutes: 90 },
];

function formatTimer(s: number | null): string {
  if (s == null) return "";
  const total = Math.max(0, Math.floor(s));
  const h   = Math.floor(total / 3600);
  const m   = Math.floor((total % 3600) / 60);
  const sec = total % 60;
  const p   = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${p(m)}:${p(sec)}` : `${m}:${p(sec)}`;
}

// ── Componente ───────────────────────────────────────────────────────────────
export default function InmersivoMixerScreen() {
  const insets = useSafeAreaInsets();
  const { activeSounds, isPlaying, togglePlay, sleepTimerRemaining, setSleepTimer, openSheet } = useMixer();
  const params = useLocalSearchParams<{ bgPresetId?: string; packId?: string; returnMixer?: string }>();

  // ── Fondo ──────────────────────────────────────────────────────────────────
  const bgPreset =
    GRADIENT_PRESETS.find((p) => p.id === params.bgPresetId) ??
    GRADIENT_PRESETS.find((p) => p.id === DEFAULT_BG_PRESET_ID)!;

  const breathScale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(breathScale, { toValue: 1.10, duration: 18000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(breathScale, { toValue: 1,    duration: 18000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Mensajes ───────────────────────────────────────────────────────────────
  const [packId, setPackId] = useState(params.packId ?? DEFAULT_MESSAGE_PACK_ID);
  const [msgIdx, setMsgIdx] = useState(0);
  const msgOpacity = useRef(new Animated.Value(1)).current;
  const activePack = MESSAGE_PACKS.find((p) => p.id === packId) ?? MESSAGE_PACKS[0]!;

  const returnMixer = params.returnMixer;

  const advanceMsg = useCallback(() => {
    Animated.timing(msgOpacity, { toValue: 0, duration: MSG_FADE_MS, useNativeDriver: true }).start(() => {
      setMsgIdx((i) => (i + 1) % activePack.messages.length);
      Animated.timing(msgOpacity, { toValue: 1, duration: MSG_FADE_MS, useNativeDriver: true }).start();
    });
  }, [activePack.messages.length, msgOpacity]);

  useEffect(() => {
    const t = setInterval(advanceMsg, MSG_DISPLAY_MS);
    return () => clearInterval(t);
  }, [advanceMsg]);

  useEffect(() => {
    msgOpacity.setValue(0);
    setMsgIdx(0);
    Animated.timing(msgOpacity, { toValue: 1, duration: MSG_FADE_MS, useNativeDriver: true }).start();
  }, [packId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auto-ocultar controles ─────────────────────────────────────────────────
  const controlsOpacity = useRef(new Animated.Value(1)).current;
  const hideTimer        = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showControls = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    Animated.timing(controlsOpacity, { toValue: 1, duration: 280, useNativeDriver: true }).start();
    hideTimer.current = setTimeout(() => {
      // No ocultar si el panel de timer está abierto
      setTimerPanelOpen((open) => {
        if (!open) {
          Animated.timing(controlsOpacity, { toValue: 0, duration: 700, useNativeDriver: true }).start();
        }
        return open;
      });
    }, CONTROLS_TIMEOUT);
  }, [controlsOpacity]);

  useEffect(() => {
    showControls();
    return () => { if (hideTimer.current) clearTimeout(hideTimer.current); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Timer panel ────────────────────────────────────────────────────────────
  const [timerPanelOpen, setTimerPanelOpen] = useState(false);
  const timerPanelAnim = useRef(new Animated.Value(0)).current;

  const openTimerPanel = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setTimerPanelOpen(true);
    Animated.timing(timerPanelAnim, { toValue: 1, duration: 260, easing: Easing.out(Easing.ease), useNativeDriver: true }).start();
  }, [timerPanelAnim]);

  const closeTimerPanel = useCallback(() => {
    Animated.timing(timerPanelAnim, { toValue: 0, duration: 220, easing: Easing.in(Easing.ease), useNativeDriver: true }).start(() => {
      setTimerPanelOpen(false);
      showControls();
    });
  }, [timerPanelAnim, showControls]);

  const handleTimerOption = useCallback((minutes: number) => {
    setSleepTimer(minutes);
    closeTimerPanel();
  }, [setSleepTimer, closeTimerPanel]);

  const handleCancelTimer = useCallback(() => {
    setSleepTimer(null);
    closeTimerPanel();
  }, [setSleepTimer, closeTimerPanel]);

  const timerPanelTranslateY = timerPanelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-12, 0],
  });

  // ── Sonidos activos ────────────────────────────────────────────────────────
  const soundNames = activeSounds
    .map((s) => getSoundById(s.id)?.name ?? s.id)
    .slice(0, 5);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <TouchableWithoutFeedback onPress={() => { if (timerPanelOpen) closeTimerPanel(); else showControls(); }}>
      <View style={styles.root}>
        <StatusBar hidden />

        {/* ── Fondo ── */}
        <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ scale: breathScale }] }]}>
          {bgPreset.image ? (
            <Image
              source={bgPreset.image}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              transition={600}
            />
          ) : (
            <LinearGradient
              colors={[...bgPreset.colors]}
              start={{ x: 0.3, y: 0 }}
              end={{ x: 0.7, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          )}
        </Animated.View>

        {/* Overlay para imágenes (mejora legibilidad del texto) */}
        {bgPreset.image && bgPreset.imageOverlay && (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: bgPreset.imageOverlay }]} pointerEvents="none" />
        )}

        {/* Velo central de legibilidad */}
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.20)", "transparent"]}
          locations={[0, 0.5, 1]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />

        {/* ── Controles (auto-ocultan) ── */}
        <Animated.View style={[styles.controlsLayer, { opacity: controlsOpacity }]} pointerEvents="box-none">

          {/* Header */}
          <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
            <Pressable
              onPress={() => { router.back(); if (returnMixer === "1") openSheet(); }}
              style={styles.iconBtn}
              hitSlop={14}
            >
              <Feather name="chevron-down" size={26} color="rgba(255,255,255,0.85)" />
            </Pressable>

            <View style={{ flex: 1 }} />

            {/* Badge del timer — toca para abrir el panel */}
            <Pressable
              onPress={(e) => { e.stopPropagation(); openTimerPanel(); }}
              style={[styles.timerBadge, sleepTimerRemaining != null && styles.timerBadgeActive]}
              hitSlop={12}
            >
              <MaterialCommunityIcons
                name={sleepTimerRemaining != null ? "clock-check" : "clock-outline"}
                size={14}
                color={sleepTimerRemaining != null ? "#E9C46A" : "rgba(255,255,255,0.65)"}
              />
              <Text style={[styles.timerText, sleepTimerRemaining != null && styles.timerTextActive]}>
                {sleepTimerRemaining != null ? formatTimer(sleepTimerRemaining) : "Timer"}
              </Text>
              <MaterialCommunityIcons name="chevron-down" size={12} color="rgba(255,255,255,0.40)" />
            </Pressable>
          </View>

          {/* Footer */}
          <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>

            {/* Packs de mensajes */}
            <View style={styles.packRow}>
              {MESSAGE_PACKS.map((pack) => {
                const sel = pack.id === packId;
                return (
                  <Pressable
                    key={pack.id}
                    onPress={() => { showControls(); setPackId(pack.id); }}
                    style={[styles.packPill, sel && styles.packPillSel]}
                  >
                    <Text style={styles.packEmoji}>{pack.emoji}</Text>
                    {sel && <Text style={styles.packLabel}>{pack.label}</Text>}
                  </Pressable>
                );
              })}
            </View>

            {/* Sonidos activos */}
            {soundNames.length > 0 && (
              <View style={styles.soundsRow}>
                {soundNames.map((name) => (
                  <View key={name} style={styles.soundPill}>
                    <Text style={styles.soundPillText} numberOfLines={1}>{name}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Play/Pausa */}
            <Pressable onPress={togglePlay} style={styles.playBtn} hitSlop={12}>
              <MaterialCommunityIcons
                name={isPlaying ? "pause" : "play"}
                size={42}
                color="rgba(255,255,255,0.90)"
              />
            </Pressable>

          </View>
        </Animated.View>

        {/* ── Mensaje central (siempre visible) ── */}
        <View style={styles.msgCenter} pointerEvents="none">
          <Animated.Text style={[styles.msgText, { opacity: msgOpacity }]}>
            {activePack.messages[msgIdx]}
          </Animated.Text>
          <Animated.View style={[styles.msgDots, { opacity: msgOpacity }]}>
            {activePack.messages.map((_, i) => (
              <View
                key={i}
                style={[styles.msgDot, i === msgIdx && styles.msgDotActive]}
              />
            ))}
          </Animated.View>
        </View>

        {/* ── Panel Timer (Fase 3) ── */}
        {timerPanelOpen && (
          <Pressable style={StyleSheet.absoluteFill} onPress={closeTimerPanel}>
            <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.50)" }]} />
          </Pressable>
        )}
        {timerPanelOpen && (
          <Animated.View
            style={[
              styles.timerPanel,
              { top: insets.top + 60, opacity: timerPanelAnim, transform: [{ translateY: timerPanelTranslateY }] },
            ]}
            pointerEvents="box-none"
          >
            <Pressable onPress={(e) => e.stopPropagation()}>
              {/* Título */}
              <View style={styles.timerPanelHeader}>
                <MaterialCommunityIcons name="clock-outline" size={16} color="#E9C46A" />
                <Text style={styles.timerPanelTitle}>Temporizador de sueño</Text>
              </View>

              {/* Opciones */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.timerOptionsRow}
              >
                {TIMER_OPTIONS.map((opt) => {
                  const activeMins = sleepTimerRemaining != null
                    ? Math.round(sleepTimerRemaining / 60)
                    : null;
                  const isSel = activeMins != null && Math.abs(activeMins - opt.minutes) < 1;
                  return (
                    <Pressable
                      key={opt.minutes}
                      onPress={() => handleTimerOption(opt.minutes)}
                      style={[styles.timerOpt, isSel && styles.timerOptSel]}
                    >
                      <Text style={[styles.timerOptText, isSel && styles.timerOptTextSel]}>
                        {opt.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              {/* Countdown activo + cancelar */}
              {sleepTimerRemaining != null && (
                <View style={styles.timerCountdownRow}>
                  <View style={styles.timerCountdownBadge}>
                    <MaterialCommunityIcons name="clock-check" size={13} color="#E9C46A" />
                    <Text style={styles.timerCountdownText}>
                      Apaga en {formatTimer(sleepTimerRemaining)}
                    </Text>
                  </View>
                  <Pressable onPress={handleCancelTimer} style={styles.timerCancelBtn} hitSlop={8}>
                    <MaterialCommunityIcons name="close-circle" size={15} color="rgba(255,255,255,0.45)" />
                    <Text style={styles.timerCancelText}>Cancelar</Text>
                  </Pressable>
                </View>
              )}
            </Pressable>
          </Animated.View>
        )}

      </View>
    </TouchableWithoutFeedback>
  );
}

// ── Estilos ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#1B060F" },

  controlsLayer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "space-between",
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  iconBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.22)",
    borderRadius: 22,
  },
  timerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(0,0,0,0.28)",
    borderRadius: 16,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  timerBadgeActive: {
    backgroundColor: "rgba(212,175,55,0.12)",
    borderColor: "rgba(212,175,55,0.30)",
  },
  timerText: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 12,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
  timerTextActive: {
    color: "#E9C46A",
  },

  // Footer
  footer: {
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 20,
  },
  packRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  packPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.10)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  packPillSel: {
    backgroundColor: "rgba(212,175,55,0.18)",
    borderColor: "rgba(212,175,55,0.40)",
  },
  packEmoji: { fontSize: 14 },
  packLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#E9C46A",
    letterSpacing: 0.2,
  },
  soundsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    justifyContent: "center",
  },
  soundPill: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  soundPillText: {
    color: "rgba(255,255,255,0.60)",
    fontSize: 10,
    fontWeight: "500",
  },
  playBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(0,0,0,0.25)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },

  // Mensaje central
  msgCenter: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    gap: 20,
  },
  msgText: {
    fontSize: 22,
    fontWeight: "300",
    color: "rgba(255,255,255,0.88)",
    textAlign: "center",
    lineHeight: 34,
    letterSpacing: 0.4,
  },
  msgDots: {
    flexDirection: "row",
    gap: 6,
  },
  msgDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.22)",
  },
  msgDotActive: {
    backgroundColor: "rgba(212,175,55,0.70)",
    width: 14,
  },

  // Timer panel (Fase 3)
  timerPanel: {
    position: "absolute",
    right: 12,
    left: 12,
    backgroundColor: "rgba(12,6,10,0.92)",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.18)",
    overflow: "hidden",
    paddingBottom: 4,
  },
  timerPanelHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
  },
  timerPanelTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "rgba(255,255,255,0.80)",
    letterSpacing: 0.3,
  },
  timerOptionsRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 14,
    paddingBottom: 12,
  },
  timerOpt: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  timerOptSel: {
    backgroundColor: "rgba(212,175,55,0.16)",
    borderColor: "rgba(212,175,55,0.40)",
  },
  timerOptText: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(255,255,255,0.65)",
  },
  timerOptTextSel: {
    color: "#E9C46A",
  },
  timerCountdownRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingBottom: 14,
    paddingTop: 2,
    gap: 8,
  },
  timerCountdownBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(212,175,55,0.10)",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  timerCountdownText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#E9C46A",
    fontVariant: ["tabular-nums"],
  },
  timerCancelBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  timerCancelText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.45)",
    fontWeight: "500",
  },
});
