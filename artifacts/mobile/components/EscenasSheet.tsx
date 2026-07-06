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
 * interruptor para apagar el sonido sin cerrar el panel.
 * ─────────────────────────────────────────────────────────────────
 */
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import React, { useLayoutEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Modal,
  PanResponder,
  Pressable,
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
} as const;

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
  } = useAmbientPlayer();

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

        <View style={styles.grid}>
          {AMBIENT_SCENES.map((scene) => {
            const active = scene.id === currentScene.id;
            return (
              <Pressable
                key={scene.id}
                style={[
                  styles.card,
                  { backgroundColor: active ? WARM.cardActive : WARM.card, borderColor: active ? WARM.borderActive : WARM.border },
                ]}
                onPress={() => handleSelectScene(scene.id)}
              >
                <Image source={scene.image} style={styles.cardImage} contentFit="cover" />
                <Text style={[styles.cardLabel, active && styles.cardLabelActive]} numberOfLines={1}>
                  {scene.label}
                </Text>
                {active && soundOn ? (
                  <View style={styles.playingBadge}>
                    <Feather name="volume-2" size={12} color="#D4AF37" />
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>

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
      </Animated.View>
    </Modal>
  );
}

const CARD_SIZE = (Dimensions.get("window").width - 24 * 2 - 12 * 2) / 3;

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
    paddingHorizontal: 24,
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
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  card: {
    width: CARD_SIZE,
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
    alignItems: "center",
    paddingBottom: 8,
  },
  cardImage: {
    width: "100%",
    height: CARD_SIZE * 0.8,
  },
  cardLabel: {
    marginTop: 6,
    fontSize: 12,
    color: "rgba(255,255,255,0.75)",
  },
  cardLabelActive: {
    color: "#D4AF37",
    fontWeight: "600",
  },
  playingBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "rgba(0,0,0,0.45)",
    borderRadius: 10,
    padding: 3,
  },
  volumeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  sliderWrap: {
    flex: 1,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(61,14,22,0.40)",
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
});
