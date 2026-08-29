import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { MOODS, type MoodId } from "@/data/moods";

type Props = {
  visible: boolean;
  onClose: () => void;
  initialSelectedIds?: MoodId[];
  onSelect?: (moodIds: MoodId[]) => void;
};

export function MoodPickerSheet({
  visible,
  onClose,
  initialSelectedIds = [],
  onSelect,
}: Props) {
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<MoodId[]>(initialSelectedIds);
  const initialSelectionKey = initialSelectedIds.join("|");

  useEffect(() => {
    if (!visible) return;
    setSelected(
      initialSelectionKey
        ? (initialSelectionKey.split("|") as MoodId[])
        : [],
    );
  }, [visible, initialSelectionKey]);

  function handleContinue() {
    if (!selected.length) return;

    if (onSelect) {
      onSelect(selected);
      setSelected([]);
      onClose();
      return;
    }

    onClose();
    setSelected([]);
    router.push(`/estado-animo/${selected[0]}` as never);
  }

  function handleClose() {
    setSelected(initialSelectedIds);
    onClose();
  }

  function toggleMood(moodId: MoodId) {
    setSelected((current) =>
      current.includes(moodId)
        ? current.filter((id) => id !== moodId)
        : [...current, moodId],
    );
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
          colors={["#121127", "#0D0D17"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={[
            styles.sheet,
            {
              paddingTop: insets.top + 8,
              paddingBottom: insets.bottom + 16,
            },
          ]}
        >
          <View style={styles.handle} />

          <Pressable
            onPress={handleClose}
            style={styles.closeBtn}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Cerrar selector de emociones"
            testID="mood-picker-close"
          >
            <Text style={styles.closeX}>×</Text>
          </Pressable>

          <Text style={styles.title}>Por favor cuéntanos más sobre cómo te sientes</Text>
          <Text style={styles.subtitle}>Puedes elegir tantos como quieras</Text>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            style={styles.optionsScroll}
          >
            <View style={styles.grid}>
              {MOODS.map((mood) => {
                const isSelected = selected.includes(mood.id);
                return (
                  <Pressable
                    key={mood.id}
                    onPress={() => toggleMood(mood.id)}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: isSelected }}
                    accessibilityLabel={mood.label}
                    testID={`mood-option-${mood.id}`}
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
          </ScrollView>

          <Pressable
            onPress={handleContinue}
            disabled={!selected.length}
            accessibilityRole="button"
            accessibilityState={{ disabled: !selected.length }}
            testID="mood-picker-continue"
            style={({ pressed }) => [
              styles.continueBtn,
              !selected.length && styles.continueBtnDisabled,
              { opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Text style={[styles.continueBtnText, !selected.length && styles.continueBtnTextDisabled]}>
              Continuar
            </Text>
          </Pressable>
        </LinearGradient>
      </View>
    </Modal>
  );
}

const PRIMARY = "#F9F9F9";
const FG = "#F5F2F8";
const MUTED = "rgba(245,242,248,0.58)";
const CARD_BG = "rgba(255,255,255,0.20)";
const CARD_BORDER = "rgba(255,255,255,0.05)";
const CARD_SELECTED_BG = "rgba(139,92,246,0.24)";
const CARD_SELECTED_BORDER = "#8B5CF6";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    backgroundColor: "rgba(0,0,0,0.65)",
  },
  sheet: {
    maxHeight: "94%",
    minHeight: "88%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    overflow: "hidden",
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
    top: 24,
    left: 20,
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(20,16,30,0.82)",
  },
  closeX: {
    fontFamily: "Manrope",
    fontSize: 30,
    lineHeight: 32,
    fontWeight: "300",
    color: PRIMARY,
  },
  title: {
    fontFamily: "Manrope",
    fontSize: 16,
    fontWeight: "700",
    color: FG,
    marginTop: 30,
    marginBottom: 5,
    paddingRight: 8,
  },
  subtitle: {
    fontFamily: "Manrope",
    fontSize: 14,
    lineHeight: 20,
    color: MUTED,
    marginBottom: 17,
  },
  optionsScroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "space-between",
  },
  card: {
    width: "48%",
    minHeight: 75,
    borderRadius: 14,
    backgroundColor: CARD_BG,
    borderWidth: 1.5,
    borderColor: CARD_BORDER,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column",
    paddingHorizontal: 7,
    paddingVertical: 9,
  },
  cardSelected: {
    backgroundColor: CARD_SELECTED_BG,
    borderColor: CARD_SELECTED_BORDER,
  },
  emoji: {
    fontFamily: "Manrope",
    fontSize: 26,
    lineHeight: 31,
    textAlign: "center",
    marginBottom: 2,
  },
  cardLabel: {
    fontFamily: "Manrope",
    fontSize: 13,
    fontWeight: "500",
    color: "rgba(255,255,255,0.88)",
    textAlign: "center",
  },
  cardLabelSelected: {
    color: PRIMARY,
    fontWeight: "700",
  },
  continueBtn: {
    borderRadius: 40,
    minHeight: 58,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#8B5CF6",
  },
  continueBtnDisabled: {
    backgroundColor: "rgba(238,238,242,0.82)",
  },
  continueBtnText: {
    fontFamily: "Manrope",
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  continueBtnTextDisabled: {
    color: "rgba(30,28,38,0.55)",
  },
});