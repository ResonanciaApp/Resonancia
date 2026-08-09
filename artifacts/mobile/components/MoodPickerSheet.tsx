import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import { GoldGradientFill } from "@/components/GoldGradient";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useSceneTheme } from "@/context/SceneThemeContext";
import { MOODS, type MoodId } from "@/data/moods";

type Props = {
  visible: boolean;
  onClose: () => void;
  onSelect?: (moodId: MoodId) => void;
};

export function MoodPickerSheet({ visible, onClose, onSelect }: Props) {
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<MoodId | null>(null);
  const { theme } = useSceneTheme();

  function handleContinue() {
    if (!selected) return;
    if (onSelect) {
      onSelect(selected);
      setSelected(null);
      onClose();
    } else {
      onClose();
      setSelected(null);
      router.push(`/estado-animo/${selected}` as never);
    }
  }

  function handleClose() {
    setSelected(null);
    onClose();
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.container}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose}>
          <View style={[StyleSheet.absoluteFill, styles.backdrop]} />
        </Pressable>

        <LinearGradient
          colors={theme.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]}
        >
        <View style={styles.handle} />

        <Pressable onPress={handleClose} style={styles.closeBtn} hitSlop={8}>
          <Text style={styles.closeX}>✕</Text>
        </Pressable>

        <Text style={styles.title}>Expresa tu emoción</Text>

        <View style={styles.grid}>
          {MOODS.map((mood) => {
            const isSelected = selected === mood.id;
            return (
              <Pressable
                key={mood.id}
                onPress={() => setSelected(mood.id)}
                style={({ pressed }) => [
                  styles.card,
                  isSelected && styles.cardSelected,
                  { opacity: pressed ? 0.8 : 1 },
                ]}
              >
                <Text style={styles.emoji}>{mood.emoji}</Text>
                <Text style={[styles.cardLabel, isSelected && styles.cardLabelSelected]}>
                  {mood.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          onPress={handleContinue}
          disabled={!selected}
          style={({ pressed }) => [
            styles.continueBtn,
            !selected && styles.continueBtnDisabled,
            { opacity: pressed ? 0.85 : 1 },
          ]}
        >
          {selected && <GoldGradientFill />}
          <Text style={[styles.continueBtnText, !selected && styles.continueBtnTextDisabled]}>
            Continuar
          </Text>
        </Pressable>
        </LinearGradient>
      </View>
    </Modal>
  );
}

const PRIMARY = "#F9F9F9";
const FG = "#EDE1D3";
const MUTED = "rgba(237,225,211,0.40)";
const CARD_BG = "rgba(255,255,255,0.05)";
const CARD_BORDER = "rgba(255,255,255,0.08)";
const CARD_SELECTED_BG = "rgba(190,150,80,0.18)";
const CARD_SELECTED_BORDER = "#F9F9F9";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    backgroundColor: "rgba(0,0,0,0.65)",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignSelf: "center",
    marginBottom: 12,
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
    fontFamily: "Manrope",
    fontSize: 16,
    color: MUTED,
  },
  title: {
    fontFamily: "Manrope",
    fontSize: 22,
    fontWeight: "700",
    color: FG,
    textAlign: "center",
    marginBottom: 24,
    marginTop: 4,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "space-between",
    marginBottom: 28,
  },
  card: {
    width: "30%",
    height: 96,
    borderRadius: 14,
    backgroundColor: CARD_BG,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column",
  },
  cardSelected: {
    backgroundColor: CARD_SELECTED_BG,
  },
  emoji: {
    fontFamily: "Manrope",
    fontSize: 28,
    lineHeight: 34,
    textAlign: "center",
    marginBottom: 4,
  },
  cardLabel: {
    fontFamily: "Manrope",
    fontSize: 12,
    fontWeight: "500",
    color: MUTED,
    textAlign: "center",
  },
  cardLabelSelected: {
    fontFamily: "Manrope",
    color: PRIMARY,
    fontWeight: "700",
  },
  continueBtn: {
    overflow: "hidden",
    borderRadius: 40,
    paddingVertical: 15,
    alignItems: "center",
  },
  continueBtnDisabled: {
    backgroundColor: "rgba(190,150,80,0.20)",
  },
  continueBtnText: {
    fontFamily: "Manrope",
    fontSize: 16,
    fontWeight: "700",
    color: "#0B0F14",
  },
  continueBtnTextDisabled: {
    color: MUTED,
  },
});
