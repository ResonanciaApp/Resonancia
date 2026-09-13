import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { HistorialCalendar } from "@/components/HistorialCalendar";
import { usePlayer } from "@/context/PlayerContext";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { useDayRollover } from "@/hooks/useDayRollover";
import { useStreak } from "@/hooks/useStreak";
import { useColors } from "@/hooks/useColors";
import { computeActiveDays, computeMaxStreak } from "@/utils/stats";

const SECTION_BACKGROUND = "rgba(0,0,0,0.28)";

function brightenColor(hex: string, pct: number): string {
  const value = hex.replace("#", "");
  if (!/^[0-9a-f]{6}$/i.test(value)) return hex;
  const channels = [0, 2, 4].map((offset) =>
    Number.parseInt(value.slice(offset, offset + 2), 16),
  );
  return `rgb(${channels
    .map((channel) => Math.round(channel + (255 - channel) * (pct / 100)))
    .join(",")})`;
}

export function ProgressMirrorSections({
  showSectionBorders = true,
}: {
  showSectionBorders?: boolean;
}) {
  const colors = useColors();
  const { theme } = useSceneTheme();
  const { statEvents } = usePlayer();
  const { currentStreak, weekFlags, todayIndex } = useStreak();
  const todayKey = useDayRollover();
  const [statsRangeDays, setStatsRangeDays] = useState<7 | 30 | 90>(30);
  const [statsFilterOpen, setStatsFilterOpen] = useState(false);
  const accent = theme.accent ?? colors.accent;
  const maxStreak = useMemo(() => computeMaxStreak(statEvents), [statEvents]);
  const streakGradient = useMemo(
    () =>
      theme.gradient.map((color) =>
        brightenColor(color, 20),
      ) as unknown as [string, string, ...string[]],
    [theme.gradient],
  );
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
    <>
      <View style={[styles.streakSection, !showSectionBorders && styles.borderlessSection]}>
        <View style={styles.streakRow}>
          {["L", "M", "X", "J", "V", "S", "D"].map((initial, index) => {
            const active = weekFlags[index];
            const isToday = todayIndex === index;
            return (
              <View key={`${initial}-${index}`} style={styles.streakDayWrapper}>
                {active ? (
                  <LinearGradient
                    colors={streakGradient}
                    locations={theme.gradientLocations}
                    style={[styles.streakDay, styles.streakDayActive]}
                  >
                    <Feather name="check" size={22} color="#F9F9F9" />
                  </LinearGradient>
                ) : (
                  <View style={[styles.streakDay, isToday && styles.streakDayActive]} />
                )}
                <Text style={styles.streakDayLabel}>{initial}</Text>
              </View>
            );
          })}
        </View>
        <View style={styles.sectionDivider} />
        <View style={[styles.statsValues, styles.statsValuesNoTitle]}>
          <Stat
            icon={<MaterialCommunityIcons name="spa" size={20} color="#F9F9F9" />}
            value={currentStreak}
            label="RACHA ACTUAL"
            accent={accent}
          />
          <View style={styles.statDivider} />
          <Stat
            icon={<MaterialCommunityIcons name="spa" size={20} color="#BE9650" />}
            value={maxStreak}
            label="RACHA MÁS LARGA"
            accent={accent}
          />
        </View>
      </View>

      <View style={[styles.personalStatsSection, !showSectionBorders && styles.borderlessSection]}>
        <View style={styles.personalStatsHeader}>
          <Text style={[styles.personalStatsTitle, { color: colors.foreground }]}>
            Estadísticas personales
          </Text>
          <Pressable
            onPress={() => setStatsFilterOpen((open) => !open)}
            style={styles.filterTrigger}
            accessibilityRole="button"
            accessibilityLabel="Elegir filtro de días"
            accessibilityState={{ expanded: statsFilterOpen }}
          >
            <Text style={[styles.filterText, { color: accent }]}>
              Últimos {statsRangeDays} días
            </Text>
            <Feather name="chevron-down" size={17} color={accent} />
          </Pressable>
          {statsFilterOpen && (
            <View style={[styles.filterMenu, { backgroundColor: theme.gradient[0] }]}>
              {([7, 30, 90] as const).map((days) => (
                <Pressable
                  key={days}
                  onPress={() => {
                    setStatsRangeDays(days);
                    setStatsFilterOpen(false);
                  }}
                  style={[
                    styles.filterOption,
                    statsRangeDays === days && styles.filterOptionSelected,
                  ]}
                >
                  <Text style={[styles.filterText, { color: accent }]}>
                    Últimos {days} días
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>
        <View style={styles.statsValues}>
          <Stat
            icon={<Feather name="clock" size={20} color="#F9F9F9" />}
            value={personalStats.totalMinutes}
            label="MINUTOS TOTALES"
            accent={accent}
          />
          <View style={styles.statDivider} />
          <Stat
            icon={<Feather name="calendar" size={20} color="#F9F9F9" />}
            value={personalStats.activeDays}
            label="DÍAS ACTIVOS"
            accent={accent}
          />
        </View>
      </View>

      <HistorialCalendar
        embedded
        outlined={showSectionBorders}
        backgroundColor={SECTION_BACKGROUND}
      />
    </>
  );
}

function Stat({
  icon,
  value,
  label,
  accent,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  accent: string;
}) {
  return (
    <View style={styles.statItem}>
      <View style={styles.statIcon}>{icon}</View>
      <View style={styles.statCopy}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={[styles.statLabel, { color: accent }]}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  streakSection: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: SECTION_BACKGROUND,
    paddingHorizontal: 16,
    paddingTop: 17,
    paddingBottom: 16,
  },
  streakRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  streakDayWrapper: { alignItems: "center", gap: 6 },
  streakDay: {
    width: 37,
    height: 37,
    borderRadius: 18.5,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  streakDayActive: {
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.45)",
  },
  streakDayLabel: {
    color: "#F9F9F9",
    fontFamily: "Manrope",
    fontSize: 11,
    fontWeight: "500",
  },
  sectionDivider: {
    height: 1,
    width: "100%",
    marginVertical: 16,
    backgroundColor: "rgba(255,255,255,0.07)",
  },
  personalStatsSection: {
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: SECTION_BACKGROUND,
    padding: 16,
    marginTop: 12,
    marginBottom: 12,
  },
  borderlessSection: {
    borderWidth: 0,
  },
  personalStatsHeader: { gap: 7 },
  personalStatsTitle: {
    fontFamily: "Manrope",
    fontSize: 17,
    fontWeight: "700",
  },
  filterTrigger: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 4,
    paddingVertical: 1,
  },
  filterMenu: {
    alignSelf: "flex-start",
    minWidth: 148,
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 1,
  },
  filterOption: { paddingHorizontal: 12, paddingVertical: 9 },
  filterOptionSelected: { backgroundColor: "rgba(152,93,212,0.16)" },
  filterText: {
    fontFamily: "Manrope",
    fontSize: 11,
    fontWeight: "700",
  },
  statsValues: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 18,
  },
  statsValuesNoTitle: { marginTop: 0 },
  statItem: {
    flex: 1,
    minWidth: 0,
    minHeight: 46,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  statIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  statCopy: { flex: 1, minWidth: 0 },
  statDivider: {
    width: 1,
    height: 42,
    marginHorizontal: 10,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  statValue: {
    color: "#F9F9F9",
    fontFamily: "Manrope",
    fontSize: 22,
    fontWeight: "600",
  },
  statLabel: {
    fontFamily: "Manrope",
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 0.35,
    marginTop: 2,
  },
});