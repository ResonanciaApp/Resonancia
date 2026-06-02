/**
 * MixerPanel — barra compacta de la mezcla activa.
 * ─────────────────────────────────────────────────────────────────
 * Usada en pantallas apiladas (fuera de las tabs) como
 * app/mezclas/[category].tsx, donde NO está la barra flotante global.
 *
 * Mismo estilo visual que el MiniPlayer (glassmorphism dorado).
 * ─────────────────────────────────────────────────────────────────
 */
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import React, { useMemo } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { MAX_ACTIVE_SOUNDS, useMixer } from "@/context/MixerContext";
import { type MixSound, getSoundById } from "@/data/sounds";
import { useColors } from "@/hooks/useColors";

const isIOS = Platform.OS === "ios";

export function MixerPanel() {
  const colors = useColors();
  const {
    activeSounds,
    isPlaying,
    togglePlay,
    presets,
    loadedPresetId,
    openSheet,
  } = useMixer();

  const activeMix = useMemo(
    () =>
      activeSounds
        .map((a) => ({ active: a, sound: getSoundById(a.id) }))
        .filter((x): x is { active: typeof x.active; sound: MixSound } => !!x.sound),
    [activeSounds],
  );

  const loadedPreset = useMemo(
    () => (loadedPresetId ? presets.find((p) => p.id === loadedPresetId) : undefined),
    [loadedPresetId, presets],
  );

  if (activeMix.length === 0) return null;

  const names = activeMix.map((x) => x.sound.name).join(" · ");

  return (
    <Pressable onPress={openSheet} style={styles.wrapper}>
      {/* Fondo */}
      {isIOS ? (
        <BlurView intensity={80} tint="dark" style={[StyleSheet.absoluteFill, { borderRadius: 18 }]} />
      ) : Platform.OS === "web" ? (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(28,26,24,0.94)", borderRadius: 18 }]} />
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.card, borderRadius: 18 }]} />
      )}
      <LinearGradient
        colors={["rgba(182,149,95,0.08)", "rgba(60,36,21,0.4)"]}
        style={[StyleSheet.absoluteFill, { borderRadius: 18 }]}
      />
      <View style={styles.border} />

      {/* Contenido */}
      <View style={styles.row}>
        {/* Chevron — indica que abre el editor */}
        <View style={styles.chevron}>
          <Feather name="chevron-up" size={20} color={colors.mutedForeground} />
        </View>

        {/* Info */}
        <View style={styles.info}>
          <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={1}>
            {loadedPreset?.name ?? "Tu mezcla"} · {activeMix.length}/{MAX_ACTIVE_SOUNDS}
          </Text>
          <Text style={[styles.sub, { color: colors.mutedForeground }]} numberOfLines={1}>
            {names}
          </Text>
        </View>

        {/* Editar */}
        <Pressable
          onPress={(e) => { e.stopPropagation(); openSheet(); }}
          hitSlop={8}
          style={[styles.editBtn, { borderColor: colors.border }]}
        >
          <Feather name="sliders" size={15} color={colors.accent} />
          <Text style={[styles.editText, { color: colors.accent }]}>Editar</Text>
        </Pressable>

        {/* Play / pausa — sin círculo */}
        <Pressable
          onPress={(e) => { e.stopPropagation(); togglePlay(); }}
          hitSlop={8}
          style={styles.playBtn}
          accessibilityRole="button"
          accessibilityLabel={isPlaying ? "Pausar mezcla" : "Reproducir mezcla"}
        >
          <Feather
            name={isPlaying ? "pause" : "play"}
            size={20}
            color={colors.foreground}
            style={isPlaying ? undefined : { marginLeft: 2 }}
          />
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 18,
    overflow: "hidden",
    marginBottom: 24,
  },
  border: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    borderColor: "rgba(182,149,95,0.2)",
    borderRadius: 18,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 10,
  },
  chevron: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  info: { flex: 1 },
  title: { fontSize: 14, fontWeight: "700", letterSpacing: 0.3 },
  sub: { fontSize: 12, marginTop: 2 },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 11,
    borderWidth: 1,
  },
  editText: { fontSize: 12, fontWeight: "600" },
  playBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
});
