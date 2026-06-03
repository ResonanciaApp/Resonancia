import { Feather } from "@expo/vector-icons";
import React from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { usePlayer } from "@/context/PlayerContext";
import { usePremium } from "@/context/PremiumContext";
import { useColors } from "@/hooks/useColors";
import { FREE_TIMER_MAX_MINUTES, showPremiumGate } from "@/lib/premiumGate";

// ─── Timer options ────────────────────────────────────────────────────────────

const TIMER_OPTS: { label: string; value: number | null }[] = [
  { label: "Apagado", value: null },
  { label: "10 minutos", value: 10 },
  { label: "20 minutos", value: 20 },
  { label: "30 minutos", value: 30 },
  { label: "45 minutos", value: 45 },
  { label: "1 hora", value: 60 },
  { label: "2 horas", value: 120 },
];

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function TimerSheet({ visible, onClose }: Props) {
  const colors = useColors();
  const { sleepTimerRemaining, setSleepTimer } = usePlayer();
  const { isPremium } = usePremium();
  const insets = useSafeAreaInsets();

  const activeMinutes =
    sleepTimerRemaining === null ? null : Math.ceil(sleepTimerRemaining / 60);

  const handleSelect = (value: number | null) => {
    if (value !== null && value > FREE_TIMER_MAX_MINUTES && !isPremium) {
      onClose();
      showPremiumGate(
        `El temporizador gratuito llega hasta ${FREE_TIMER_MAX_MINUTES} minutos. Hazte Premium para dormir con hasta 8 horas.`,
      );
      return;
    }
    setSleepTimer(value);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Backdrop */}
      <Pressable style={styles.backdrop} onPress={onClose} />

      {/* Sheet */}
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
        {/* Handle */}
        <View style={styles.handle} />

        {/* Header */}
        <View style={styles.headerRow}>
          <Feather name="clock" size={18} color={colors.foreground} style={{ marginRight: 8 }} />
          <Text style={[styles.title, { color: colors.foreground }]}>Temporizador</Text>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Feather name="x" size={20} color={colors.mutedForeground} />
          </Pressable>
        </View>

        {/* Description */}
        <Text style={[styles.description, { color: colors.mutedForeground }]}>
          Cuando termina el temporizador, la reproducción se detiene
          y el teléfono puede bloquearse automáticamente.
        </Text>

        {/* Options */}
        <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
          {TIMER_OPTS.map(({ label, value }, idx) => {
            const isActive = value === null
              ? sleepTimerRemaining === null
              : activeMinutes === value;
            const locked =
              value !== null && value > FREE_TIMER_MAX_MINUTES && !isPremium;
            return (
              <Pressable
                key={idx}
                onPress={() => handleSelect(value)}
                style={({ pressed }) => [
                  styles.optRow,
                  { opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <Text style={[
                  styles.optLabel,
                  { color: isActive ? colors.primary : locked ? colors.mutedForeground : colors.foreground },
                ]}>
                  {label}
                </Text>
                {isActive ? (
                  <Feather name="check" size={18} color={colors.primary} />
                ) : locked ? (
                  <Feather name="lock" size={15} color={colors.mutedForeground} />
                ) : null}
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  sheet: {
    backgroundColor: "#151A23",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 12,
    maxHeight: "75%",
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignSelf: "center",
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  title: {
    flex: 1,
    fontSize: 17,
    fontWeight: "700",
  },
  closeBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  description: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 16,
  },
  optRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.07)",
  },
  optLabel: {
    fontSize: 16,
  },
});
