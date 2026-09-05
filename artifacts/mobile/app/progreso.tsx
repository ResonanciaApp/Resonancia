import MaskedView from "@react-native-masked-view/masked-view";
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
import { WIDGET_GREEN_SOLID } from "@/constants/colors";
import { isIndigoThemeId } from "@/config/scene-themes";

export default function ProgresoScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { statEvents } = usePlayer();
  const { activeSceneId, theme } = useSceneTheme();
  const { currentStreak, maxStreak, weekFlags, todayIndex } = useStreak();
  const todayKey = useDayRollover();
  const [statsRangeDays, setStatsRangeDays] = useState<7 | 30 | 90>(30);
  const [statsFilterOpen, setStatsFilterOpen] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, 40);
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const resourceBlockBackground = activeSceneId === "tibet"
    ? "rgba(0,0,0,0.15)"
    : isIndigoThemeId(activeSceneId)
      ? "rgba(181,211,255,0.045)"
      : activeSceneId === "indigo2"
        ? "rgba(255,255,255,0.025)"
        : "rgba(181,211,255,0.045)";
  const progressAccent = activeSceneId === "indigo2" ? colors.accent : "#AAAAC4";

  const personalStats = useMemo(() => {
    const rangeStart = new Date();
    rangeStart.setHours(0, 0, 0, 0);
    rangeStart.setDate(rangeStart.getDate() - (statsRangeDays - 1));
    const rangeStartTime = rangeStart.getTime();
    const now = Date.now();
    let totalMinutes = 0;
    let completedSessions = 0;

    for (const event of statEvents) {
      const playedAt = new Date(event.playedAt).getTime();
      if (!Number.isFinite(playedAt) || playedAt < rangeStartTime || playedAt > now) continue;
      totalMinutes += event.minutes;
      if (event.completed === true) completedSessions += 1;
    }

    return {
      totalMinutes: Math.round(totalMinutes),
      completedSessions,
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
            { backgroundColor: resourceBlockBackground },
          ]}
        >
          <View style={styles.streakHeadingRow}>
            <View style={styles.streakHeadingMain}>
              <View style={styles.streakLotusIcon}>
                <MaskedView
                  style={styles.streakLotusMask}
                  maskElement={<MaterialCommunityIcons name="spa" size={61} color="#000000" />}
                >
                  <LinearGradient
                    colors={["#CFCFCF", "#E3E3E3"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={StyleSheet.absoluteFill}
                  />
                </MaskedView>
              </View>
              <View style={styles.streakHeadingCopy}>
                <View style={styles.streakTitleRow}>
                  <Text style={[styles.streakCountText, { color: colors.foreground }]}>
                    {currentStreak}
                  </Text>
                  <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                    Días de racha
                  </Text>
                </View>
                <Text style={[styles.streakSubtitle, { color: progressAccent }]}>
                  Expande tu consciencia todos los días
                </Text>
              </View>
            </View>
          </View>

          <SonicStreakDays
            activeFlags={weekFlags}
            todayIndex={todayIndex}
            idPrefix="progress-screen-streak"
            daysMarginTop={4}
            circleSize={37}
            edgeAligned
            dayLabelColor={theme.accent ?? colors.primary}
            activeBorderColor={WIDGET_GREEN_SOLID}
            activeBorderWidth={2.9}
          />
        </View>

        <View
          style={[
            styles.personalStatsSection,
            { backgroundColor: resourceBlockBackground },
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
              <View style={[styles.statsFilterMenu, { backgroundColor: resourceBlockBackground }]}>
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
              <View style={styles.personalStatMetricRow}>
                <View style={styles.personalStatIcon}>
                  <MaterialCommunityIcons name="spa" size={22} color={WIDGET_GREEN_SOLID} />
                </View>
                <Text style={[styles.personalStatValue, { color: colors.foreground }]}>
                  {`${Math.floor(personalStats.totalMinutes / 60)}h ${personalStats.totalMinutes % 60}m`}
                </Text>
              </View>
              <Text style={[styles.personalStatLabel, { color: progressAccent }]}>
                TIEMPO DE{"\n"}BIENESTAR
              </Text>
            </View>
            <View style={styles.personalStatDivider} />
            <View style={styles.personalStatItem}>
              <View style={styles.personalStatMetricRow}>
                <View style={styles.personalStatIcon}>
                  <Feather name="clock" size={20} color={WIDGET_GREEN_SOLID} />
                </View>
                <Text style={[styles.personalStatValue, { color: colors.foreground }]}>
                  {personalStats.completedSessions}
                </Text>
              </View>
              <Text style={[styles.personalStatLabel, { color: progressAccent }]}>
                SESIONES{"\n"}COMPLETADAS
              </Text>
            </View>
            <View style={styles.personalStatDivider} />
            <View style={styles.personalStatItem}>
              <View style={styles.personalStatMetricRow}>
                <View style={styles.personalStatIcon}>
                  <Feather name="flag" size={20} color={WIDGET_GREEN_SOLID} />
                </View>
                <Text style={[styles.personalStatValue, { color: colors.foreground }]}>
                  {maxStreak} {maxStreak === 1 ? "día" : "días"}
                </Text>
              </View>
              <Text style={[styles.personalStatLabel, { color: progressAccent }]}>
                RACHA{"\n"}MÁXIMA
              </Text>
            </View>
          </View>
        </View>

        <HistorialCalendar embedded />
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
  streakHeadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 18,
  },
  streakHeadingMain: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  streakLotusIcon: {
    width: 61,
    height: 61,
    alignItems: "center",
    justifyContent: "center",
  },
  streakLotusMask: { width: 61, height: 61 },
  streakHeadingCopy: { flex: 1, gap: 1 },
  streakTitleRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  streakCountText: {
    fontFamily: "Manrope",
    fontSize: 21,
    fontWeight: "700",
  },
  sectionTitle: {
    fontFamily: "Manrope",
    fontSize: 19,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  streakSubtitle: {
    fontFamily: "Manrope",
    fontSize: 12,
    lineHeight: 17,
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
    alignItems: "flex-start",
    marginTop: 24,
  },
  personalStatItem: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    gap: 8,
  },
  personalStatMetricRow: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  personalStatIcon: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  personalStatDivider: {
    width: 1,
    height: 58,
    marginHorizontal: 4,
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
    lineHeight: 15,
    letterSpacing: 0.35,
    textAlign: "center",
  },
});