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

import { MOODS, type MoodId } from "@/data/moods";
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
  moodFilter: MoodId | null;
  onMoodChange: (m: MoodId | null) => void;
  tagFilters: SoundTagId[];
  onToggleTag: (t: SoundTagId) => void;
  bgPaletteId: MixerBgPaletteId;
  onBgPaletteChange: (id: MixerBgPaletteId) => void;
  onClear: () => void;
};

export function MixerSettingsSheet({
  visible,
  onClose,
  moodFilter,
  onMoodChange,
  tagFilters,
  onToggleTag,
  bgPaletteId,
  onBgPaletteChange,
  onClear,
}: Props) {
  const insets = useSafeAreaInsets();

  // El fondo del sheet refleja la paleta elegida (regla: elegir fondo cambia
  // también el fondo de Ajustes del Mezclador).
  const sheetGradient = getMixerBgPalette(bgPaletteId).colors;

  const hasFilters =
    moodFilter !== null ||
    tagFilters.length > 0 ||
    bgPaletteId !== DEFAULT_MIXER_BG_PALETTE;

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

          <Pressable onPress={onClose} style={[styles.closeBtn, { top: insets.top + 10 }]} hitSlop={8}>
            <Text style={styles.closeX}>✕</Text>
          </Pressable>

          <Text style={[styles.title, { marginTop: insets.top + 36 }]}>Ajustes del Mezclador</Text>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 8 }}
          >
            {/* ── ¿Cómo te sientes? ── */}
            <Text style={styles.sectionTitle}>¿Cómo te sientes?</Text>
            <Text style={styles.sectionHint}>
              Mostramos los sonidos afines a tu ánimo.
            </Text>
            <View style={styles.chipWrap}>
              {MOODS.map((mood) => {
                const sel = moodFilter === mood.id;
                return (
                  <Pressable
                    key={mood.id}
                    onPress={() => onMoodChange(sel ? null : mood.id)}
                    style={({ pressed }) => [
                      styles.chip,
                      sel && styles.chipSel,
                      { opacity: pressed ? 0.8 : 1 },
                    ]}
                  >
                    <Text style={styles.chipEmoji}>{mood.emoji}</Text>
                    <Text style={[styles.chipText, sel && styles.chipTextSel]}>
                      {mood.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* ── Etiquetas ── */}
            <Text style={[styles.sectionTitle, { marginTop: 22 }]}>Etiquetas</Text>
            <Text style={styles.sectionHint}>
              Combiná varias para afinar la búsqueda.
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
                      sel && styles.chipSel,
                      { opacity: pressed ? 0.8 : 1 },
                    ]}
                  >
                    <Text style={[styles.chipText, sel && styles.chipTextSel]}>
                      {tag.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* ── Color de fondo ── */}
            <Text style={[styles.sectionTitle, { marginTop: 22 }]}>
              Color de fondo
            </Text>
            <Text style={styles.sectionHint}>
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
                  <Pressable
                    key={p.id}
                    onPress={() => onBgPaletteChange(p.id)}
                    style={styles.paletteItem}
                  >
                    <LinearGradient
                      colors={p.colors}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={[styles.swatch, sel && styles.swatchSel]}
                    >
                      {sel && <Text style={styles.swatchCheck}>✓</Text>}
                    </LinearGradient>
                    <Text
                      style={[styles.swatchLabel, sel && styles.swatchLabelSel]}
                      numberOfLines={1}
                    >
                      {p.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
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
            <Text
              style={[
                styles.clearBtnText,
                !hasFilters && styles.clearBtnTextDisabled,
              ]}
            >
              Limpiar filtros
            </Text>
          </Pressable>
        </LinearGradient>
    </Modal>
  );
}

const PRIMARY = "#BE9650";
const FG = "rgba(255,255,255,0.9)";
const MUTED = "rgba(255,255,255,0.9)";
const MUTED_DIM = "rgba(255,255,255,0.6)";
const CHIP_BG = "rgba(255,255,255,0.07)";
const CHIP_BORDER = "rgba(255,255,255,0.18)";
const CHIP_SEL_BG = "rgba(190,150,80,0.22)";

const styles = StyleSheet.create({
  sheet: {
    flex: 1,
    paddingHorizontal: 20,
  },
  closeBtn: {
    position: "absolute",
    top: 20,
    left: 20,
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  closeX: {
    fontSize: 16,
    color: MUTED,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: FG,
    textAlign: "center",
    marginBottom: 18,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: FG,
    marginBottom: 2,
  },
  sectionHint: {
    fontSize: 12,
    color: MUTED_DIM,
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
    backgroundColor: CHIP_BG,
    borderWidth: 1.5,
    borderColor: CHIP_BORDER,
    gap: 5,
  },
  chipSel: {
    backgroundColor: CHIP_SEL_BG,
    borderColor: PRIMARY,
  },
  chipEmoji: {
    fontSize: 14,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "500",
    color: MUTED,
  },
  chipTextSel: {
    color: PRIMARY,
    fontWeight: "700",
  },
  paletteRow: {
    flexDirection: "row",
    gap: 14,
    paddingRight: 4,
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
    color: MUTED_DIM,
    marginTop: 6,
    textAlign: "center",
  },
  swatchLabelSel: {
    color: PRIMARY,
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
  clearBtnTextDisabled: {
    color: MUTED_DIM,
  },
});
