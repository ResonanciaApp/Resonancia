/**
 * InmersivoMixerModal — versión Modal del modo inmersivo.
 * Controlado por MixerContext (inmersivoOpen / inmersivoPresetId).
 * Sin navegación Expo Router → sin flash de pantalla al abrir/cerrar.
 */
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Modal,
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
import { CreationCoverPreviewDirect } from "@/components/CreationCoverPreview";
import { Dimensions } from "react-native";

const CONTROLS_TIMEOUT = 2000;

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

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");
const GEO_BG_SIZE = Math.max(SCREEN_W, SCREEN_H) * 1.05;

export function InmersivoContent() {
  const insets = useSafeAreaInsets();
  const {
    activeSounds, isPlaying, togglePlay,
    sleepTimerRemaining, setSleepTimer,
    inmersivoPresetId, closeImmersivo,
    inmersivoGeoBgCreation,
  } = useMixer();

  const bgPreset =
    GRADIENT_PRESETS.find((p) => p.id === inmersivoPresetId) ??
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

  const controlsOpacity = useRef(new Animated.Value(0)).current;
  const hideTimer        = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showControls = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    Animated.timing(controlsOpacity, { toValue: 1, duration: 280, useNativeDriver: true }).start();
    hideTimer.current = setTimeout(() => {
      setTimerPanelOpen((open) => {
        if (!open) {
          Animated.timing(controlsOpacity, { toValue: 0, duration: 700, useNativeDriver: true }).start();
        }
        return open;
      });
    }, CONTROLS_TIMEOUT);
  }, [controlsOpacity]);

  // Hint intro: entra a los 700 ms, visible 2 s, luego desvanece
  const introOpacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const tIn = setTimeout(() => {
      Animated.timing(introOpacity, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }, 700);
    const tOut = setTimeout(() => {
      Animated.timing(introOpacity, { toValue: 0, duration: 600, useNativeDriver: true }).start();
    }, 700 + 2000);
    return () => {
      clearTimeout(tIn);
      clearTimeout(tOut);
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

  const soundNames = activeSounds
    .map((s) => getSoundById(s.id)?.name ?? s.id)
    .slice(0, 5);

  const handleBack = useCallback(() => {
    closeImmersivo();
  }, [closeImmersivo]);

  return (
    <TouchableWithoutFeedback onPress={() => { if (timerPanelOpen) closeTimerPanel(); else showControls(); }}>
      <View style={styles.root}>
        <StatusBar hidden />

        {inmersivoGeoBgCreation ? (
          <Animated.View
            style={[StyleSheet.absoluteFill, { alignItems: "center", justifyContent: "center", transform: [{ scale: breathScale }] }]}
            pointerEvents="none"
          >
            <CreationCoverPreviewDirect creation={inmersivoGeoBgCreation} size={GEO_BG_SIZE} />
          </Animated.View>
        ) : (
          <>
            <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ scale: breathScale }] }]}>
              {bgPreset.image ? (
                <Image source={bgPreset.image} style={StyleSheet.absoluteFill} contentFit="cover" transition={600} />
              ) : (
                <LinearGradient
                  colors={bgPreset.isLight ? ["#362a46", "#22112a", "#362a46"] : [...bgPreset.colors]}
                  start={{ x: 0.5, y: 0 }}
                  end={{ x: 0.5, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
              )}
            </Animated.View>
            {bgPreset.image && bgPreset.imageOverlay && (
              <View style={[StyleSheet.absoluteFill, { backgroundColor: bgPreset.imageOverlay }]} pointerEvents="none" />
            )}
          </>
        )}

        {/* Hint intro — 2s visible luego desvanece */}
        <Animated.View style={[styles.introHint, { opacity: introOpacity }]} pointerEvents="none">
          <Text style={styles.introHintText}>
            Para una mejor experiencia reproduce con audífonos o parlantes
          </Text>
        </Animated.View>

        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.20)", "transparent"]}
          locations={[0, 0.5, 1]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />

        <Animated.View style={[styles.controlsLayer, { opacity: controlsOpacity }]} pointerEvents="box-none">
          <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
            <Pressable onPress={handleBack} style={styles.iconBtn} hitSlop={14}>
              <Feather name="chevron-down" size={26} color="rgba(255,255,255,0.85)" />
            </Pressable>
            <View style={{ flex: 1 }} />
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

          <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
            <Pressable onPress={togglePlay} style={styles.playBtn} hitSlop={12}>
              <MaterialCommunityIcons
                name={isPlaying ? "pause" : "play"}
                size={42}
                color="rgba(255,255,255,0.90)"
              />
            </Pressable>

            {soundNames.length > 0 && (
              <View style={styles.soundsRow}>
                {soundNames.map((name) => (
                  <View key={name} style={[styles.soundPill, { backgroundColor: bgPreset.colors[0] + "40", borderColor: bgPreset.colors[0] + "66" }]}>
                    <Text style={styles.soundPillText} numberOfLines={1}>{name}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </Animated.View>

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
              <View style={styles.timerPanelHeader}>
                <MaterialCommunityIcons name="clock-outline" size={16} color="#E9C46A" />
                <Text style={styles.timerPanelTitle}>Temporizador de sueño</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.timerOptionsRow}>
                {TIMER_OPTIONS.map((opt) => {
                  const activeMins = sleepTimerRemaining != null ? Math.round(sleepTimerRemaining / 60) : null;
                  const isSel = activeMins != null && Math.abs(activeMins - opt.minutes) < 1;
                  return (
                    <Pressable
                      key={opt.minutes}
                      onPress={() => handleTimerOption(opt.minutes)}
                      style={[styles.timerOpt, isSel && styles.timerOptSel]}
                    >
                      <Text style={[styles.timerOptText, isSel && styles.timerOptTextSel]}>{opt.label}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
              {sleepTimerRemaining != null && (
                <View style={styles.timerCountdownRow}>
                  <View style={styles.timerCountdownBadge}>
                    <MaterialCommunityIcons name="clock-check" size={13} color="#E9C46A" />
                    <Text style={styles.timerCountdownText}>Apaga en {formatTimer(sleepTimerRemaining)}</Text>
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

export function InmersivoMixerModal() {
  const { inmersivoOpen } = useMixer();
  return (
    <Modal visible={inmersivoOpen} animationType="none" statusBarTranslucent transparent={false}>
      <InmersivoContent />
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#1B060F" },
  introHint: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  introHintText: {
    color: "rgba(255,255,255,0.70)",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 28,
    letterSpacing: 0.2,
  },
  controlsLayer: { ...StyleSheet.absoluteFillObject, justifyContent: "space-between" },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20 },
  iconBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.22)", borderRadius: 22 },
  timerBadge: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(0,0,0,0.28)", borderRadius: 16, paddingHorizontal: 11, paddingVertical: 7, borderWidth: 1, borderColor: "rgba(255,255,255,0.10)" },
  timerBadgeActive: { backgroundColor: "rgba(212,175,55,0.12)", borderColor: "rgba(212,175,55,0.30)" },
  timerText: { color: "rgba(255,255,255,0.65)", fontSize: 12, fontWeight: "600", fontVariant: ["tabular-nums"] },
  timerTextActive: { color: "#E9C46A" },
  footer: { alignItems: "center", gap: 14, paddingHorizontal: 20 },
  soundsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, justifyContent: "center" },
  soundPill: { backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: "rgba(255,255,255,0.10)" },
  soundPillText: { color: "rgba(255,255,255,0.60)", fontSize: 10, fontWeight: "500" },
  playBtn: { width: 72, height: 72, borderRadius: 36, backgroundColor: "rgba(0,0,0,0.25)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.14)" },
  timerPanel: { position: "absolute", right: 12, left: 12, backgroundColor: "rgba(12,6,10,0.92)", borderRadius: 18, borderWidth: 1, borderColor: "rgba(212,175,55,0.18)", overflow: "hidden", paddingBottom: 4 },
  timerPanelHeader: { flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10 },
  timerPanelTitle: { fontSize: 13, fontWeight: "700", color: "rgba(255,255,255,0.80)", letterSpacing: 0.3 },
  timerOptionsRow: { flexDirection: "row", gap: 8, paddingHorizontal: 14, paddingBottom: 12 },
  timerOpt: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.07)", borderWidth: 1, borderColor: "rgba(255,255,255,0.10)" },
  timerOptSel: { backgroundColor: "rgba(212,175,55,0.16)", borderColor: "rgba(212,175,55,0.40)" },
  timerOptText: { fontSize: 13, fontWeight: "600", color: "rgba(255,255,255,0.65)" },
  timerOptTextSel: { color: "#E9C46A" },
  timerCountdownRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, paddingBottom: 14, paddingTop: 2, gap: 8 },
  timerCountdownBadge: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(212,175,55,0.10)", borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5 },
  timerCountdownText: { fontSize: 12, fontWeight: "600", color: "#E9C46A", fontVariant: ["tabular-nums"] },
  timerCancelBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 5 },
  timerCancelText: { fontSize: 12, color: "rgba(255,255,255,0.45)", fontWeight: "500" },
});
