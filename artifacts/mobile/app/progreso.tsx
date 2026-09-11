import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
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

import { HistorialCalendar } from "@/components/HistorialCalendar";
import { SonicStreakDays } from "@/components/SonicStreakWave";
import { usePlayer } from "@/context/PlayerContext";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { useDayRollover } from "@/hooks/useDayRollover";
import { useStreak } from "@/hooks/useStreak";
import { useColors } from "@/hooks/useColors";
import { computeActiveDays } from "@/utils/stats";

export default function ProgresoScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { statEvents } = usePlayer();
  const { theme } = useSceneTheme();
  const { currentStreak, maxStreak, weekFlags, todayIndex } = useStreak();
  const todayKey = useDayRollover();
  const [statsRangeDays, setStatsRangeDays] = useState<7 | 30 | 90>(30);
  const [statsFilterOpen, setStatsFilterOpen] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, 40);
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const sectionBackground = "rgba(0,0,0,0.28)";
  const progressAccent = theme.accent ?? colors.accent;

  const personalStats = useMemo(() => {
    const rangeStart = new Date();
    rangeStart.setHours(0, 0, 0, 0);
    rangeStart.setDate(rangeStart.getDate() - (statsRangeDays - 1));
    const rangeStartTime = rangeStart.getTime();
    const now = Date.now();
    let totalMinutes = 0;
    const rangeEvents = [];

    for (const event of statEvents) {
      const playedAt = new Date(event.playedAt).getTime();
      if (!Number.isFinite(playedAt) || playedAt < rangeStartTime || playedAt > now) continue;
      rangeEvents.push(event);
      totalMinutes += event.minutes;
    }

    return {
      totalMinutes: Math.round(totalMinutes),
      activeDays: computeActiveDays(rangeEvents),
    };
  }, [statEvents, statsRangeDays, todayKey]);

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
        <View
          style={[
            styles.streakSection,
            { backgroundColor: sectionBackground },
          ]}
        >
          <SonicStreakDays
            activeFlags={weekFlags}
            todayIndex={todayIndex}
            edgeAligned
            daysMarginTop={0}
            activeBorderColor="#BE9650"
          />
          <View style={styles.streakStatsDivider} />
          <View style={[styles.personalStatsValues, styles.personalStatsValuesNoTitle]}>
            <View style={styles.personalStatItem}>
              <View style={styles.personalStatIcon}>
                <MaterialCommunityIcons name="spa" size={20} color="#F9F9F9" />
              </View>
              <View style={styles.personalStatCopy}>
                <Text style={[styles.personalStatValue, { color: colors.foreground }]}>
                  {currentStreak}
                </Text>
                <Text style={[styles.personalStatLabel, { color: progressAccent }]}>
                  RACHA ACTUAL
                </Text>
              </View>
            </View>
            <View style={styles.personalStatDivider} />
            <View style={styles.personalStatItem}>
              <View style={styles.personalStatIcon}>
                <MaterialCommunityIcons name="spa" size={20} color="#BE9650" />
              </View>
              <View style={styles.personalStatCopy}>
                <Text style={[styles.personalStatValue, { color: colors.foreground }]}>
                  {maxStreak}
                </Text>
                <Text style={[styles.personalStatLabel, { color: progressAccent }]}>
                  RACHA MÁS LARGA
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View
          style={[
            styles.personalStatsSection,
            { backgroundColor: sectionBackground },
          ]}
        >
          <View style={styles.personalStatsHeader}>
            <Text style={[styles.personalStatsTitle, { color: colors.foreground }]}>
              Estadísticas personales
            </Text>
            <Pressable
              onPress={() => setStatsFilterOpen((open) => !open)}
              style={styles.statsFilterTrigger}
              accessibilityRole="button"
              accessibilityLabel="Elegir filtro de días"
              accessibilityState={{ expanded: statsFilterOpen }}
            >
              <Text style={[styles.statsFilterText, { color: progressAccent }]}>
                Últimos {statsRangeDays} días
              </Text>
              <Feather name="chevron-down" size={17} color={progressAccent} />
            </Pressable>
            {statsFilterOpen && (
              <View style={[styles.statsFilterMenu, { backgroundColor: theme.gradient[0] }]}>
                {([7, 30, 90] as const).map((days) => (
                  <Pressable
                    key={days}
                    onPress={() => {
                      setStatsRangeDays(days);
                      setStatsFilterOpen(false);
                    }}
                    style={[
                      styles.statsFilterOption,
                      statsRangeDays === days && styles.statsFilterOptionSelected,
                    ]}
                  >
                    <Text style={[styles.statsFilterText, { color: progressAccent }]}>
                      Últimos {days} días
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          <View style={styles.personalStatsValues}>
            <View style={styles.personalStatItem}>
              <View style={styles.personalStatIcon}>
                <Feather name="clock" size={20} color="#F9F9F9" />
              </View>
              <View style={styles.personalStatCopy}>
                <Text style={[styles.personalStatValue, { color: colors.foreground }]}>
                  {personalStats.totalMinutes}
                </Text>
                <Text style={[styles.personalStatLabel, { color: progressAccent }]}>
                  MINUTOS TOTALES
                </Text>
              </View>
            </View>
            <View style={styles.personalStatDivider} />
            <View style={styles.personalStatItem}>
              <View style={styles.personalStatIcon}>
                <Feather name="calendar" size={20} color="#F9F9F9" />
              </View>
              <View style={styles.personalStatCopy}>
                <Text style={[styles.personalStatValue, { color: colors.foreground }]}>
                  {personalStats.activeDays}
                </Text>
                <Text style={[styles.personalStatLabel, { color: progressAccent }]}>
                  DÍAS ACTIVOS
                </Text>
              </View>
            </View>
          </View>
        </View>

        <HistorialCalendar embedded backgroundColor={sectionBackground} />
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