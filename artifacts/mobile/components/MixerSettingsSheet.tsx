import React from "react";
import { GoldGradientFill } from "@/components/GoldGradient";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

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

function sheetColors(bgPaletteId: MixerBgPaletteId) {
  const dark = bgPaletteId === "noche";
  return {
    fg:         dark ? "rgba(255,255,255,0.9)"  : "rgba(20,10,5,0.88)",
    mutedDim:   dark ? "rgba(255,255,255,0.6)"  : "rgba(20,10,5,0.5)",
    chipBg:     dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)",
    chipBorder: dark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.12)",
    chipSel:    dark ? "rgba(190,150,80,0.22)"  : "rgba(190,150,80,0.18)",
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

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <LinearGradient
        colors={sheetGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[styles.sheet, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 16 }]}
      >
        {/* ── Header: X + título en la misma fila ── */}
        <View style={[styles.headerRow, { marginTop: insets.top + 2 }]}>
          <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={8}>
            <Text style={[styles.closeX, { color: c.mutedDim }]}>✕</Text>
          </Pressable>
          <Text style={[styles.title, { color: c.fg }]}>
            {mode === "palette" ? "Paleta de color" : "Filtros"}
          </Text>
          <View style={styles.closePlaceholder} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 8 }}>

          {/* ── Escenas (paleta de color) ── */}
          {mode === "palette" && (
            <>
              <Text style={[styles.sectionTitle, { color: c.fg }]}>Escenas</Text>
              <Text style={[styles.sectionHint, { color: c.mutedDim }]}>
                Tono del área de sonidos (no afecta la cabecera).
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.paletteRow}
              >
                {MIXER_BG_PALETTES.map((p) => {
                  const sel = bgPaletteId === p.id;
                  return (
                    <Pressable key={p.id} onPress={() => handleEscenaChange(p.id)} style={styles.paletteItem}>
                      <LinearGradient
                        colors={p.colors}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={[styles.swatch, sel && styles.swatchSel]}
                      >
                        {sel && <Text style={styles.swatchCheck}>✓</Text>}
                      </LinearGradient>
                      <Text
                        style={[styles.swatchLabel, { color: sel ? PRIMARY : c.mutedDim }, sel && styles.swatchLabelSel]}
                        numberOfLines={1}
                      >
                        {p.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </>
          )}

          {/* ── Etiquetas (filtros) ── */}
          {mode === "filters" && (
            <>
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
            </>
          )}

        </ScrollView>

        {/* ── Limpiar filtros ── */}
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
            {mode === "palette" ? "Restablecer color" : "Limpiar filtros"}
          </Text>
        </Pressable>
      </LinearGradient>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: {
    flex: 1,
    paddingHorizontal: 20,
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
  paletteRow: {
    flexDirection: "row",
    gap: 14,
    paddingRight: 4,
    marginBottom: 4,
  },
  paletteItem: {
    width: 64,
    alignItems: "center",
  },
  swatch: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "rgba(0,0,0,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  swatchSel: {
    borderColor: PRIMARY,
  },
  swatchCheck: {
    fontSize: 18,
    fontWeight: "900",
    color: "#1B060F",
  },
  swatchLabel: {
    fontSize: 10,
    marginTop: 6,
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
