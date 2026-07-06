/**
 * EscenasSheet — panel de "Escenas" (sonido ambiente) en hoja inferior.
 * ─────────────────────────────────────────────────────────────────
 * Se monta UNA sola vez a nivel global (app/_layout.tsx) y se abre desde el
 * ícono de loto en Inicio. Mismo patrón de interacción que MixerSheet: Modal +
 * PanResponder para arrastrar hacia abajo y cerrar, slide-in desde abajo.
 *
 * Cada escena tiene su propio audio en loop (AmbientPlayerContext) + su propio
 * volumen. Cambiar de escena detiene la anterior y arranca la nueva. Cerrar el
 * panel NO detiene el audio — sigue sonando en segundo plano. Incluye un
 * interruptor para apagar el sonido sin cerrar el panel, y un temporizador
 * ("Reproducir sonidos fuera de la aplicación") que detiene el sonido
 * automáticamente tras N minutos.
 * ─────────────────────────────────────────────────────────────────
 */
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React, { useLayoutEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Modal,
  PanResponder,
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

const WARM = {
  handle: "rgba(255,255,255,0.25)",
  card: "rgba(74,12,12,0.08)",
  cardActive: "rgba(212,175,55,0.14)",
  border: "rgba(61,14,22,0.40)",
  borderActive: "rgba(212,175,55,0.55)",
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
const SHEET_H_PAD = 24;
const CARD_GAP = 14;
const CARD_W = Math.floor((SCREEN_W - SHEET_H_PAD * 2) / 2.5);
const CARD_H = Math.floor(CARD_W * 1.55);

export function EscenasSheet() {
  const insets = useSafeAreaInsets();
  const { theme, setActiveScene } = useSceneTheme();
  const {
    currentScene,
    isPlaying,
    isMuted,
    volume,
    setVolume,
    setScene,
    togglePlayback,
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

  const sheetEnterY = useRef(new Animated.Value(Dimensions.get("window").height)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => g.dy > 5,
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) sheetEnterY.setValue(g.dy);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > 80 || g.vy > 0.5) {
          closeSheet();
        } else {
          Animated.timing(sheetEnterY, {
            toValue: 0,
            duration: DURATION.PLAYER,
            easing: easeOutCubic,
            useNativeDriver: true,
          }).start();
        }
      },
    }),
  ).current;

  useLayoutEffect(() => {
    if (isSheetOpen) {
      sheetEnterY.setValue(Dimensions.get("window").height);
      backdropOpacity.setValue(0);
      Animated.timing(sheetEnterY, {
        toValue: 0,
        duration: DURATION.SHEET_OPEN,
        easing: easeOutCubic,
        useNativeDriver: true,
      }).start();
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 280,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start();
    } else {
      sheetEnterY.setValue(Dimensions.get("window").height);
      backdropOpacity.setValue(0);
      setTimerOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSheetOpen]);

  const soundOn = isPlaying && !isMuted;

  const handleSelectScene = (id: SceneId) => {
    setActiveScene(id);
    if (id === currentScene.id) return;
    setScene(id);
    if (!isPlaying) {
      startAmbient();
    }
  };

  return (
    <Modal
      visible={isSheetOpen}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={closeSheet}
    >
      <Pressable style={styles.backdrop} onPress={closeSheet}>
        <Animated.View style={[styles.backdropFill, { opacity: backdropOpacity }]} />
      </Pressable>
      <Animated.View
        style={[
          styles.sheet,
          { backgroundColor: theme.solid, paddingBottom: Math.max(insets.bottom, 20) },
          { transform: [{ translateY: sheetEnterY }] },
        ]}
      >
        <View {...panResponder.panHandlers}>
          <View style={[styles.handle, { backgroundColor: WARM.handle }]} />
          <Text style={styles.title}>Escenas</Text>
          <Text style={styles.subtitle}>Sonido ambiente de fondo</Text>
        </View>

        {/* Volumen de la escena — arriba de las cards */}
        <View style={styles.volumeRow}>
          <Feather name="volume-1" size={16} color="rgba(255,255,255,0.55)" />
          <View style={styles.sliderWrap}>
            <VolumeSlider
              value={volume}
              onChange={setVolume}
              color="#D4AF37"
              trackColor="rgba(61,14,22,0.40)"
            />
          </View>
          <Feather name="volume-2" size={16} color="rgba(255,255,255,0.55)" />
        </View>

        {/* Reproducir sonidos fuera de la aplicación — timer dropdown */}
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

        <View style={styles.toggleRow}>
          <View style={styles.toggleTextWrap}>
            <Text style={styles.toggleLabel}>Sonido de escena</Text>
            <Text style={styles.toggleHint}>{soundOn ? currentScene.label : "Apagado"}</Text>
          </View>
          <Switch
            value={soundOn}
            onValueChange={() => togglePlayback()}
            trackColor={{ false: "rgba(255,255,255,0.15)", true: "rgba(212,175,55,0.55)" }}
            thumbColor={soundOn ? "#D4AF37" : "#F4DAD5"}
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.sceneTitleRow}>
          <MaterialCommunityIcons name="spa" size={18} color="#F4F4F4" />
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
            const active = scene.id === currentScene.id;
            return (
              <Pressable
                key={scene.id}
                style={styles.cardWrap}
                onPress={() => handleSelectScene(scene.id)}
              >
                <View
                  style={[
                    styles.card,
                    { borderColor: active ? WARM.borderActive : WARM.border },
                  ]}
                >
                  <Image source={scene.image} style={StyleSheet.absoluteFill} contentFit="cover" />
                  {active ? (
                    <View style={styles.activeOverlay} pointerEvents="none">
                      <Feather name="check-circle" size={26} color="#D4AF37" />
                    </View>
                  ) : null}
                  {active && soundOn ? (
                    <View style={styles.playingBadge}>
                      <Feather name="volume-2" size={12} color="#D4AF37" />
                    </View>
                  ) : null}
                </View>
                <Text style={[styles.cardLabel, active && styles.cardLabelActive]} numberOfLines={1}>
                  {scene.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  backdropFill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: SHEET_H_PAD,
    paddingTop: 10,
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#F4DAD5",
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    color: "rgba(242,231,228,0.45)",
    marginBottom: 20,
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
    color: "#F4DAD5",
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
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  toggleTextWrap: {
    flexShrink: 1,
  },
  toggleLabel: {
    fontSize: 14,
    color: "#F4DAD5",
    fontWeight: "500",
  },
  toggleHint: {
    fontSize: 12,
    color: "rgba(242,231,228,0.45)",
    marginTop: 2,
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
  activeOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.28)",
    alignItems: "center",
    justifyContent: "center",
  },
  cardLabel: {
    marginTop: 8,
    fontSize: 12,
    color: "rgba(255,255,255,0.75)",
  },
  cardLabelActive: {
    color: "#D4AF37",
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
});
