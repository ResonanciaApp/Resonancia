/**
 * MixerPanel — barra compacta de la mezcla activa.
 * ─────────────────────────────────────────────────────────────────
 * Usada en pantallas apiladas (fuera de las tabs) como
 * app/mezclas/[category].tsx, donde NO está la barra flotante global.
 *
 * Mismo estilo visual que el MiniPlayer (glassmorphism dorado).
 * Stack de imágenes de los sonidos activos + botón Editar.
 * ─────────────────────────────────────────────────────────────────
 */
import { Feather } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { Image, Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { getSoundImage } from "@/config/sound-images";
import { MAX_ACTIVE_SOUNDS, useMixer } from "@/context/MixerContext";
import { type MixSound, getSoundById } from "@/data/sounds";
import { useColors } from "@/hooks/useColors";

const isIOS = Platform.OS === "ios";

const STACK_SIZE = 36;
const STACK_SHIFT = 14;
const MAX_STACK = 3;

export function MixerPanel() {
  const colors = useColors();
  const {
    activeSounds,
    isPlaying,
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

  const visible = activeMix.slice(-MAX_STACK);
  const stackWidth = STACK_SIZE + Math.max(0, visible.length - 1) * STACK_SHIFT;
  const count = activeMix.length;
  const title = loadedPreset?.name ?? "Tu mezcla";

  return (
    <Pressable onPress={openSheet} style={styles.wrapper}>
      {/* Fondo */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: "#212543", borderRadius: 18 }]} />
      <View style={styles.border} />

      {/* Contenido */}
      <View style={styles.row}>
        {/* Stack de imágenes */}
        <View style={[styles.stackWrap, { width: stackWidth }]}>
          {visible.map((x, i) => {
            const img = getSoundImage(x.sound.id);
            return (
              <View key={x.sound.id} style={[styles.stackThumb, { left: i * STACK_SHIFT, zIndex: i }]}>
                {img ? (
                  <Image source={img} style={styles.stackThumbImg} resizeMode="cover" />
                ) : (
                  <View style={[styles.stackThumbImg, { backgroundColor: "rgba(212,175,55,0.18)" }]}>
                    <Feather name="music" size={12} color={colors.primary} />
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Info */}
        <View style={styles.info}>
          <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={1}>
            {title}
          </Text>
          <View style={styles.metaRow}>
            {isPlaying && <Feather name="bar-chart-2" size={11} color={colors.primary} style={{ marginRight: 3 }} />}
            <Text style={[styles.sub, { color: isPlaying ? colors.primary : colors.mutedForeground }]} numberOfLines={1}>
              {count}/{MAX_ACTIVE_SOUNDS} sonidos
            </Text>
          </View>
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
    borderColor: "rgba(212,175,55,0.20)",
    borderRadius: 18,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },

  // ── Stack ──────────────────────────────────────────────────────
  stackWrap: {
    height: STACK_SIZE,
    position: "relative",
    flexShrink: 0,
  },
  stackThumb: {
    position: "absolute",
    width: STACK_SIZE,
    height: STACK_SIZE,
    borderRadius: 8,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.35,
    shadowRadius: 2,
    elevation: 2,
  },
  stackThumbImg: {
    width: STACK_SIZE,
    height: STACK_SIZE,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Info ───────────────────────────────────────────────────────
  info: { flex: 1, minWidth: 0 },
  title: { fontSize: 14, fontWeight: "700", letterSpacing: 0.2 },
  metaRow: { flexDirection: "row", alignItems: "center", marginTop: 2 },
  sub: { fontSize: 12 },

  // ── Editar ─────────────────────────────────────────────────────
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
});
