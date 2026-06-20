/**
 * SimplePersonalizeSheet — hoja de personalización para perfiles expansor/resonador.
 * Paleta de colores de fondo + toggle de geometría sagrada.
 */
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Modal, Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { BG_GRADIENTS } from "@/data/geometrix-creations";

const HOME_COLORS: readonly [string, string] = ["#2E0510", "#160108"];
const GOLD = "#D4AF37";

interface Props {
  visible: boolean;
  onClose: () => void;
  selectedBgId: string | null;
  onSelectBg: (id: string | null) => void;
  geoActive: boolean;
  onToggleGeo: (v: boolean) => void;
}

export function SimplePersonalizeSheet({
  visible,
  onClose,
  selectedBgId,
  onSelectBg,
  geoActive,
  onToggleGeo,
}: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.backdrop} onPress={onClose} />

      <View style={styles.sheet}>
        <LinearGradient
          colors={["#2E0510", "#1B060F"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {/* Handle */}
        <View style={styles.handle} />

        {/* Header */}
        <View style={styles.headerRow}>
          <Text style={styles.title}>Personalizar</Text>
          <Pressable onPress={onClose} hitSlop={12} style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}>
            <Feather name="x" size={20} color="rgba(250,240,238,0.6)" />
          </Pressable>
        </View>

        {/* ── Color de fondo ── */}
        <Text style={styles.sectionLabel}>Color de fondo</Text>
        <View style={styles.swatchRow}>
          {/* Por defecto */}
          <Pressable
            onPress={() => onSelectBg(null)}
            style={[styles.swatch, selectedBgId === null && styles.swatchOn]}
          >
            <LinearGradient
              colors={[HOME_COLORS[0], HOME_COLORS[1]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.swatchGrad}
            />
            {selectedBgId === null && (
              <View style={styles.swatchCheck}>
                <Feather name="check" size={11} color={GOLD} />
              </View>
            )}
          </Pressable>

          {BG_GRADIENTS.map((gr) => (
            <Pressable
              key={gr.id}
              onPress={() => onSelectBg(gr.id)}
              style={[styles.swatch, selectedBgId === gr.id && styles.swatchOn]}
            >
              <LinearGradient
                colors={[gr.colors[0], gr.colors[1]]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.swatchGrad}
              />
              {selectedBgId === gr.id && (
                <View style={styles.swatchCheck}>
                  <Feather name="check" size={11} color={GOLD} />
                </View>
              )}
            </Pressable>
          ))}
        </View>

        {/* ── Geometría sagrada ── */}
        <Text style={[styles.sectionLabel, { marginTop: 24 }]}>Geometría sagrada</Text>
        <View style={styles.geoRow}>
          <View style={styles.geoLeft}>
            <Feather name="feather" size={16} color={GOLD} />
            <View>
              <Text style={styles.geoLabel}>Formas en el fondo</Text>
              <Text style={styles.geoSub}>Animaciones sutiles de geometría</Text>
            </View>
          </View>
          <Switch
            value={geoActive}
            onValueChange={onToggleGeo}
            trackColor={{ false: "#3D0E16", true: "#4A0C0C" }}
            thumbColor={geoActive ? GOLD : "rgba(250,240,238,0.45)"}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 22,
    paddingBottom: 44,
    overflow: "hidden",
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(212,175,55,0.3)",
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 4,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FAF0EE",
    letterSpacing: 0.3,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(212,175,55,0.75)",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 14,
  },
  swatchRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  swatch: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "transparent",
  },
  swatchOn: {
    borderColor: GOLD,
  },
  swatchGrad: {
    ...StyleSheet.absoluteFillObject,
  },
  swatchCheck: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  geoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(212,175,55,0.12)",
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  geoLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  geoLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FAF0EE",
  },
  geoSub: {
    fontSize: 11,
    color: "rgba(250,240,238,0.45)",
    marginTop: 2,
  },
});
