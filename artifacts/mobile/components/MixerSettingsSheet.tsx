import React from "react";
import { GoldGradientFill } from "@/components/GoldGradient";
import {
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { SOUND_TAGS, type SoundTagId } from "@/data/sounds";
import {
  MIXER_BG_PALETTES,
  DEFAULT_MIXER_BG_PALETTE,
  getMixerBgPalette,
  type MixerBgPaletteId,
} from "@/data/mixer-bg-palettes";

type Props = {
  visible: boolean;
  onClose: () => void;
  /** "palette" → solo paleta de color (Escenas); "filters" → solo filtros (Etiquetas). */
  mode: "palette" | "filters";
  moodFilter: null;
  onMoodChange: (m: null) => void;
  tagFilters: SoundTagId[];
  onToggleTag: (t: SoundTagId) => void;
  bgPaletteId: MixerBgPaletteId;
  onBgPaletteChange: (id: MixerBgPaletteId) => void;
  onClear: () => void;
};

const PRIMARY = "#BE9650";

function sheetColors(_bgPaletteId: MixerBgPaletteId) {
  // El sheet siempre tiene fondo oscuro (#1B060F), así que los textos siempre claros.
  return {
    fg:         "rgba(255,255,255,0.9)",
    mutedDim:   "rgba(255,255,255,0.6)",
    chipBg:     "rgba(255,255,255,0.07)",
    chipBorder: "rgba(255,255,255,0.18)",
    chipSel:    "rgba(190,150,80,0.22)",
  };
}

export function MixerSettingsSheet({
  visible,
  onClose,
  mode,
  tagFilters,
  onToggleTag,
  bgPaletteId,
  onBgPaletteChange,
  onClear,
}: Props) {
  const insets = useSafeAreaInsets();
  const sheetGradient = getMixerBgPalette(bgPaletteId).colors;
  const c = sheetColors(bgPaletteId);

  const hasFilters =
    mode === "palette"
      ? bgPaletteId !== DEFAULT_MIXER_BG_PALETTE
      : tagFilters.length > 0;

  function handleEscenaChange(id: MixerBgPaletteId) {
    onBgPaletteChange(id);
  }

  const screenH = Dimensions.get("window").height;
  const sheetSizing =
    mode === "palette"
      ? { height: screenH * 0.36 }
      : { maxHeight: screenH * 0.85 };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.root}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View
          style={[styles.sheet, sheetSizing, { paddingBottom: insets.bottom + 16, backgroundColor: "#1B060F" }]}
        >
          {/* ── Header: X + título en la misma fila ── */}
          <View style={styles.headerRow}>
            <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={8}>
              <Text style={[styles.closeX, { color: c.mutedDim }]}>✕</Text>
            </Pressable>
            <Text style={[styles.title, { color: c.fg }]}>
              {mode === "palette" ? "Color de fondo" : "Filtros"}
            </Text>
            <View style={styles.closePlaceholder} />
          </View>

          {/* ── Escenas (paleta de color) — grilla de 2 columnas ── */}
          {mode === "palette" ? (
            <View style={styles.paletteBody}>
              <View style={styles.paletteGrid}>
                {MIXER_BG_PALETTES.map((p) => {
                  const sel = bgPaletteId === p.id;
                  return (
                    <Pressable key={p.id} onPress={() => handleEscenaChange(p.id)} style={styles.paletteGridItem}>
                      <LinearGradient
                        colors={p.colors}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={[styles.swatchBig, sel && styles.swatchSel]}
                      >
                        {sel && (
                          <Text style={[styles.swatchCheck, { color: p.id === "noche" ? "#FFFFFF" : "#5C1A1A" }]}>✓</Text>
                        )}
                      </LinearGradient>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginTop: 6 }}>
                        <MaterialCommunityIcons
                          name={p.id === "arena" ? "white-balance-sunny" : "moon-waning-crescent"}
                          size={13}
                          color={sel ? PRIMARY : c.mutedDim}
                        />
                        <Text
                          style={[styles.swatchLabelBig, { color: sel ? PRIMARY : c.mutedDim, marginTop: 0 }, sel && styles.swatchLabelSel]}
                          numberOfLines={1}
                        >
                          {p.label}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 8 }}>
              <Text style={[styles.sectionTitle, { color: c.fg }]}>Etiquetas</Text>
              <Text style={[styles.sectionHint, { color: c.mutedDim }]}>
                Combina varias para afinar la búsqueda.
              </Text>
              <View style={styles.chipWrap}>
                {SOUND_TAGS.map((tag) => {
                  const sel = tagFilters.includes(tag.id);
                  return (
                    <Pressable
                      key={tag.id}
                      onPress={() => onToggleTag(tag.id)}
                      style={({ pressed }) => [
                        styles.chip,
                        {
                          backgroundColor: sel ? c.chipSel : c.chipBg,
                          borderColor: sel ? PRIMARY : c.chipBorder,
                          opacity: pressed ? 0.8 : 1,
                        },
                      ]}
                    >
                      <Text style={[styles.chipText, { color: sel ? PRIMARY : c.fg, fontWeight: sel ? "700" : "500" }]}>
                        {tag.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
          )}

          {/* ── Limpiar filtros (solo en modo filtros) ── */}
          {mode === "filters" && (
            <Pressable
              onPress={onClear}
              disabled={!hasFilters}
              style={({ pressed }) => [
                styles.clearBtn,
                !hasFilters && styles.clearBtnDisabled,
                { opacity: pressed ? 0.85 : 1 },
              ]}
            >
              {hasFilters && <GoldGradientFill />}
              <Text style={[styles.clearBtnText, !hasFilters && { color: c.mutedDim }]}>
                Limpiar filtros
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  sheet: {
    paddingHorizontal: 20,
    paddingTop: 14,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: "hidden",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },
  closeBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  closeX: {
    fontSize: 16,
  },
  closePlaceholder: {
    width: 32,
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 2,
  },
  sectionHint: {
    fontSize: 12,
    marginBottom: 12,
  },
  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1.5,
    gap: 5,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "500",
  },
  paletteBody: {},
  paletteGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    rowGap: 16,
    marginTop: 4,
  },
  paletteGridItem: {
    flex: 1,
    alignItems: "center",
  },
  swatchBig: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "rgba(0,0,0,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  swatchSel: {
    borderColor: PRIMARY,
  },
  swatchCheck: {
    fontSize: 26,
    fontWeight: "900",
    color: "#1B060F",
  },
  swatchLabelBig: {
    fontSize: 14,
    fontWeight: "500",
    marginTop: 10,
    textAlign: "center",
  },
  swatchLabelSel: {
    fontWeight: "700",
  },
  clearBtn: {
    marginTop: 16,
    overflow: "hidden",
    borderRadius: 40,
    paddingVertical: 14,
    alignItems: "center",
  },
  clearBtnDisabled: {
    backgroundColor: "rgba(190,150,80,0.18)",
  },
  clearBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0B0F14",
  },
});
