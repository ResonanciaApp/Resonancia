import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ProgressMirrorSections } from "@/components/ProgressMirrorSections";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { useColors } from "@/hooks/useColors";
import { useStreak } from "@/hooks/useStreak";

export default function ProgresoScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { theme } = useSceneTheme();
  const { weekFlags } = useStreak();
  const completedWeekDays = weekFlags.filter(Boolean).length;

  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, 40);
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <LinearGradient
      style={styles.root}
      colors={theme.gradient as unknown as [string, string, ...string[]]}
      locations={theme.gradientLocations as unknown as [number, number, ...number[]] | undefined}
    >
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <View style={[styles.header, { paddingTop: topPad }]}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Volver"
        >
          <Feather name="arrow-left" size={23} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Tu progreso</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: bottomPad + 32 },
        ]}
      >
        <View style={styles.streakIntro}>
          <Text style={[styles.streakIntroCount, { color: colors.foreground }]}>
            {completedWeekDays} {completedWeekDays === 1 ? "Día de racha" : "Días de racha"}
          </Text>
          <Text style={styles.streakIntroDescription}>
            Medita al menos 3 días a la semana y transforma tu vida
          </Text>
          <View
            style={styles.streakProgressBars}
            accessibilityRole="progressbar"
            accessibilityLabel={`${completedWeekDays} de 3 días de práctica semanal`}
            accessibilityValue={{
              min: 0,
              max: 3,
              now: Math.min(completedWeekDays, 3),
            }}
          >
            {[0, 1, 2].map((index) =>
              index < completedWeekDays ? (
                <View
                  key={index}
                  style={[
                    styles.streakProgressBarActive,
                    { backgroundColor: theme.accent ?? colors.accent },
                  ]}
                />
              ) : (
                <View key={index} style={styles.streakProgressBarInactive} />
              ),
            )}
          </View>
        </View>
        <ProgressMirrorSections />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    minHeight: 96,
    paddingHorizontal: 20,
    paddingBottom: 15,
    flexDirection: "row",
    alignItems: "flex-end",
  },
  backButton: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    fontFamily: "Manrope",
    fontSize: 20,
    lineHeight: 42,
    fontWeight: "700",
    textAlign: "center",
  },
  headerSpacer: { width: 42, height: 42 },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  streakIntro: {
    marginBottom: 16,
  },
  streakIntroCount: {
    fontFamily: "Manrope",
    fontSize: 24,
    lineHeight: 31,
    fontWeight: "700",
  },
  streakIntroDescription: {
    color: "rgba(249,249,249,0.78)",
    fontFamily: "Manrope",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  streakProgressBars: {
    flexDirection: "row",
    gap: 8,
    marginTop: 14,
  },
  streakProgressBarActive: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  streakProgressBarInactive: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.16)",
  },
  streakSection: {
    borderRadius: 18,
    padding: 16,
    marginBottom: 15,
  },
  personalStatsSection: {
    borderRadius: 18,
    padding: 16,
    marginBottom: 15,
  },
  personalStatsHeader: { gap: 7 },
  personalStatsTitle: {
    fontFamily: "Manrope",
    fontSize: 17,
    fontWeight: "700",
  },
  statsFilterTrigger: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 4,
    paddingVertical: 1,
  },
  statsFilterMenu: {
    alignSelf: "flex-start",
    minWidth: 148,
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 1,
  },
  statsFilterOption: {
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  statsFilterOptionSelected: {
    backgroundColor: "rgba(152,93,212,0.16)",
  },
  statsFilterText: {
    fontFamily: "Manrope",
    fontSize: 11,
    fontWeight: "700",
  },
  personalStatsValues: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 18,
  },
  personalStatsValuesNoTitle: { marginTop: 0 },
  personalStatItem: {
    flex: 1,
    minWidth: 0,
    minHeight: 46,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  personalStatIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  personalStatCopy: { flex: 1, minWidth: 0 },
  personalStatDivider: {
    width: 1,
    height: 42,
    marginHorizontal: 10,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  personalStatValue: {
    fontFamily: "Manrope",
    fontSize: 22,
    fontWeight: "600",
  },
  personalStatLabel: {
    fontFamily: "Manrope",
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 0.35,
    marginTop: 2,
  },
  streakStatsDivider: {
    height: 1,
    width: "100%",
    marginVertical: 16,
    backgroundColor: "rgba(255,255,255,0.07)",
  },
});