import React from "react";
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";

import { useColors } from "@/hooks/useColors";

/** Informational only: scoring and persistence are not enabled. */
export function CreativityPointsSection({ style, onInfoPress }: { style?: StyleProp<ViewStyle>; onInfoPress: () => void }) {
  const colors = useColors();

  return (
    <Pressable
      testID="profile-creativity-points"
      style={[styles.card, style]}
      onPress={onInfoPress}
      accessible
      accessibilityRole="button"
      accessibilityLabel="Información sobre puntos creatividad"
    >
      <View pointerEvents="none" style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]}>
          Puntos creatividad
        </Text>
      </View>
      <View pointerEvents="none" style={styles.progressRow}>
        <View
          testID="creativity-points-bar"
          accessibilityRole="progressbar"
          accessibilityLabel="Puntos creatividad"
          accessibilityValue={{ min: 0, max: 100, now: 0, text: "0 de 100 puntos" }}
          style={styles.track}
        >
          <View pointerEvents="none" style={styles.marker} />
        </View>
        <Text testID="creativity-points-value" style={[styles.value, { color: colors.foreground }]}>
          <Text style={{ color: colors.accent }}>0</Text>/100
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "rgba(0,0,0,0.16)",
    borderRadius: 19,
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  header: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 25 },
  title: { flex: 1, fontFamily: "Manrope", fontSize: 16, fontWeight: "600" },
  progressRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 14 },
  track: {
    flex: 1,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(255,255,255,0.08)",
    justifyContent: "center",
  },
  marker: { width: 16, height: 16, borderRadius: 8, marginLeft: 3, backgroundColor: "#F9F9F9" },
  value: { fontFamily: "Manrope", fontSize: 13, fontWeight: "600", flexShrink: 0 },
});