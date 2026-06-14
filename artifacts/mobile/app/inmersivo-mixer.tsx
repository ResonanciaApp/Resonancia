/**
 * InmersivoMixer — pantalla full-screen del Mezclador.
 * Muestra el fondo elegido (degradado animado), mensajes que rotan con
 * fade-in/out, e indicadores de los sonidos activos. Los controles se
 * auto-ocultan a los 3 s de inactividad y reaparecen al tocar la pantalla.
 */
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Pressable,
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

const CONTROLS_TIMEOUT = 3500;
const MSG_DISPLAY_MS   = 14000;
const MSG_FADE_MS      = 900;

function formatTimer(s: number | null): string {
  if (s == null) return "";
  const total = Math.max(0, Math.floor(s));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const sec = total % 60;
  const p = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${p(m)}:${p(sec)}` : `${m}:${p(sec)}`;
}

export default function InmersivoMixerScreen() {
  const insets = useSafeAreaInsets();
  const { activeSounds, isPlaying, togglePlay, sleepTimerRemaining } = useMixer();
  const params = useLocalSearchParams<{ bgPresetId?: string; packId?: string }>();

  // ── Fondo ─────────────────────────────────────────────────────────────────
  const bgPreset =
    GRADIENT_PRESETS.find((p) => p.id === params.bgPresetId) ??
    GRADIENT_PRESETS.find((p) => p.id === DEFAULT_BG_PRESET_ID)!;

  // Respiración: zoom lento del fondo (scale)
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
  const [packId, setPackId]     = useState(params.packId ?? DEFAULT_MESSAGE_PACK_ID);
  const [msgIdx, setMsgIdx]     = useState(0);
  const msgOpacity = useRef(new Animated.Value(1)).current;

  const activePack = MESSAGE_PACKS.find((p) => p.id === packId) ?? MESSAGE_PACKS[0]!;

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

  // Resetear idx al cambiar de pack
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
      Animated.timing(controlsOpacity, { toValue: 0, duration: 700, useNativeDriver: true }).start();
    }, CONTROLS_TIMEOUT);
  }, [controlsOpacity]);

  useEffect(() => {
    showControls();
    return () => { if (hideTimer.current) clearTimeout(hideTimer.current); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Sonidos activos ────────────────────────────────────────────────────────
  const soundNames = activeSounds
    .map((s) => getSoundById(s.id)?.name ?? s.id)
    .slice(0, 5);

  return (
    <TouchableWithoutFeedback onPress={showControls}>
      <View style={styles.root}>
        <StatusBar hidden />

        {/* Fondo con respiración */}
        <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ scale: breathScale }] }]}>
          <LinearGradient
            colors={[...bgPreset.colors]}
            start={{ x: 0.3, y: 0 }}
            end={{ x: 0.7, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>

        {/* Velo oscuro central para legibilidad del texto */}
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.18)", "transparent"]}
          locations={[0, 0.5, 1]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />

        {/* ── Controles (auto-ocultan) ── */}
        <Animated.View style={[styles.controlsLayer, { opacity: controlsOpacity }]} pointerEvents="box-none">

          {/* Header */}
          <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
            <Pressable onPress={() => router.back()} style={styles.iconBtn} hitSlop={14}>
              <Feather name="chevron-down" size={26} color="rgba(255,255,255,0.85)" />
            </Pressable>
            <View style={{ flex: 1 }} />
            {sleepTimerRemaining != null && (
              <View style={styles.timerBadge}>
                <MaterialCommunityIcons name="clock-outline" size={13} color="rgba(255,255,255,0.7)" />
                <Text style={styles.timerText}>{formatTimer(sleepTimerRemaining)}</Text>
              </View>
            )}
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

      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#1B060F" },

  controlsLayer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "space-between",
  },

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
    backgroundColor: "rgba(0,0,0,0.20)",
    borderRadius: 22,
  },
  timerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,0,0,0.28)",
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  timerText: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 12,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },

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
});
