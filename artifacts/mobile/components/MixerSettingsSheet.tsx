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
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { SOUND_TAGS, type SoundTagId } from "@/data/sounds";
import {
  MIXER_BG_PALETTES,
  DEFAULT_MIXER_BG_PALETTE,
  type MixerBgPaletteId,
} from "@/data/mixer-bg-palettes";

type Props = {
  visible: boolean;
  onClose: () => void;
  tagFilters: SoundTagId[];
  onToggleTag: (t: SoundTagId) => void;
  bgPaletteId: MixerBgPaletteId;
  onBgPaletteChange: (id: MixerBgPaletteId) => void;
  onClear: () => void;
  bgColor?: string;
};

const PRIMARY = "#dad4ec";
const SWATCH_SIZE = 34;

const c = {
  fg:         "rgba(255,255,255,0.9)",
  mutedDim:   "rgba(255,255,255,0.6)",
  chipBg:     "rgba(255,255,255,0.03)",
  chipBorder: "rgba(80,42,247,0.07)",
  chipSel:    "rgba(190,150,80,0.22)",
};

export function MixerSettingsSheet({
  visible,
  onClose,
  tagFilters,
  onToggleTag,
  bgPaletteId,
  onBgPaletteChange,
  onClear,
  bgColor = "#340D1A",
}: Props) {
  const insets = useSafeAreaInsets();

  const hasFilters = tagFilters.length > 0 || bgPaletteId !== DEFAULT_MIXER_BG_PALETTE;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.root}>
        <View
          style={[
            styles.sheet,
            { paddingTop: insets.top + 14, paddingBottom: insets.bottom + 16, backgroundColor: bgColor },
          ]}
        >
          {/* ── Header: X + título en la misma fila ── */}
          <View style={styles.headerRow}>
            <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={8}>
              <Text style={[styles.closeX, { color: c.mutedDim }]}>✕</Text>
            </Pressable>
            <Text style={[styles.title, { color: c.fg }]}>Filtros</Text>
            <View style={styles.closePlaceholder} />
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 8 }}>
            {/* ── Tema (día y noche) — swatches circulares chicos ── */}
            <Text style={[styles.sectionTitle, { color: c.fg }]}>Tema</Text>
            <View style={styles.swatchRow}>
              {MIXER_BG_PALETTES.map((p) => {
                const sel = bgPaletteId === p.id;
                return (
                  <Pressable
                    key={p.id}
                    onPress={() => onBgPaletteChange(p.id)}
                    style={styles.swatchItem}
                    hitSlop={6}
                  >
                    <LinearGradient
                      colors={p.colors}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={[styles.swatchCircle, sel && styles.swatchCircleSel]}
                    >
                      {sel && (
                        <Text style={[styles.swatchCheck, { color: p.id === "noche" ? "#FFFFFF" : "#5C1A1A" }]}>✓</Text>
                      )}
                    </LinearGradient>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6 }}>
                      <MaterialCommunityIcons
                        name={p.id === "arena" ? "white-balance-sunny" : "moon-waning-crescent"}
                        size={11}
                        color={sel ? PRIMARY : c.mutedDim}
                      />
                      <Text
                        style={[styles.swatchLabel, { color: sel ? PRIMARY : c.mutedDim }, sel && styles.swatchLabelSel]}
                        numberOfLines={1}
                      >
                        {p.label}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>

            {/* ── Etiquetas ── */}
            <Text style={[styles.sectionTitle, { color: c.fg, marginTop: 26 }]}>Etiquetas</Text>
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
              Limpiar filtros
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#340D1A",
  },
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
    fontFamily: "Manrope",
    fontSize: 16,
  },
  closePlaceholder: {
    width: 32,
  },
  title: {
    fontFamily: "Manrope",
    flex: 1,
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },
  sectionTitle: {
    fontFamily: "Manrope",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 12,
  },
  swatchRow: {
    flexDirection: "row",
    gap: 22,
  },
  swatchItem: {
    alignItems: "center",
  },
  swatchCircle: {
    width: SWATCH_SIZE,
    height: SWATCH_SIZE,
    borderRadius: SWATCH_SIZE / 2,
    borderWidth: 2,
    borderColor: "rgba(0,0,0,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  swatchCircleSel: {
    borderColor: PRIMARY,
  },
  swatchCheck: {
    fontFamily: "Manrope",
    fontSize: 14,
    fontWeight: "900",
  },
  swatchLabel: {
    fontFamily: "Manrope",
    fontSize: 11,
    fontWeight: "500",
  },
  swatchLabelSel: {
    fontFamily: "Manrope",
    fontWeight: "700",
  },
  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    height: 32,
    paddingHorizontal: 13,
    borderRadius: 999,
    borderWidth: 1,
    gap: 5,
  },
  chipText: {
    fontFamily: "Manrope",
    fontSize: 14,
    fontWeight: "450" as any,
    letterSpacing: 0.3,
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
    fontFamily: "Manrope",
    fontSize: 15,
    fontWeight: "700",
    color: "#0B0F14",
  },
});
