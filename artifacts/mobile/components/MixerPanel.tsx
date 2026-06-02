/**
 * MixerPanel — barra compacta de la mezcla activa.
 * ─────────────────────────────────────────────────────────────────
 * Usada en pantallas apiladas (fuera de las tabs) como
 * app/mezclas/[category].tsx, donde NO está la barra flotante global.
 *
 * Muestra un resumen de la mezcla activa con play/pausa; al tocarla
 * abre el editor en hoja inferior (MixerSheet). Si no hay sonidos
 * activos, no renderiza nada.
 * ─────────────────────────────────────────────────────────────────
 */
import { Feather } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { MAX_ACTIVE_SOUNDS, useMixer } from "@/context/MixerContext";
import { type MixSound, getSoundById } from "@/data/sounds";
import { useColors } from "@/hooks/useColors";

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
    <Pressable
      onPress={openSheet}
      style={[styles.bar, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <Pressable
        onPress={(e) => {
          e.stopPropagation();
          togglePlay();
        }}
        hitSlop={8}
        style={[styles.playBtn, { backgroundColor: colors.primary }]}
      >
        <Feather name={isPlaying ? "pause" : "play"} size={18} color={colors.primaryForeground} />
      </Pressable>

      <View style={styles.info}>
        <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={1}>
          {loadedPreset?.name ?? "Tu mezcla"} · {activeMix.length}/{MAX_ACTIVE_SOUNDS}
        </Text>
        <Text style={[styles.sub, { color: colors.mutedForeground }]} numberOfLines={1}>
          {names}
        </Text>
      </View>

      <View style={[styles.editBtn, { borderColor: colors.border }]}>
        <Feather name="sliders" size={16} color={colors.accent} />
        <Text style={[styles.editText, { color: colors.accent }]}>Editar</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    marginBottom: 24,
  },
  playBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  info: { flex: 1 },
  title: { fontSize: 14, fontWeight: "700", letterSpacing: 0.3 },
  sub: { fontSize: 12, marginTop: 2 },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  editText: { fontSize: 13, fontWeight: "600" },
});
