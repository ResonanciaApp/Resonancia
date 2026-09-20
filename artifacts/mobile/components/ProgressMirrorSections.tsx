import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useMemo, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";

import { HistorialCalendar } from "@/components/HistorialCalendar";
import { CinematicFadeSlide } from "@/components/CinematicFadeSlide";
import { StreakWeekRow } from "@/components/StreakWeekRow";
import { usePlayer } from "@/context/PlayerContext";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { useDayRollover } from "@/hooks/useDayRollover";
import { useStreak } from "@/hooks/useStreak";
import { useColors } from "@/hooks/useColors";
import { computeActiveDays, computeMaxStreak } from "@/utils/stats";

const SECTION_BACKGROUND = "rgba(0,0,0,0.28)";

export function ProgressMirrorSections({
  showSectionBorders = true,
  showPersonalStats = true,
  showCalendar = true,
  animateEntrance = false,
  entranceReplayKey = "progress-mirror",
  entranceBaseDelay = 0,
  streakTitle,
  onStreakTitlePress,
  showStreakWeek = true,
  showStreakViewAll = false,
}: {
  showSectionBorders?: boolean;
  showPersonalStats?: boolean;
  showCalendar?: boolean;
  animateEntrance?: boolean;
  entranceReplayKey?: string | number;
  entranceBaseDelay?: number;
  streakTitle?: string;
  onStreakTitlePress?: () => void;
  showStreakWeek?: boolean;
  showStreakViewAll?: boolean;
}) {
  const colors = useColors();
  const { theme } = useSceneTheme();
  const { statEvents } = usePlayer();
  const { currentStreak } = useStreak();
  const todayKey = useDayRollover();
  const [statsRangeDays, setStatsRangeDays] = useState<7 | 30 | 90>(30);
  const [statsFilterOpen, setStatsFilterOpen] = useState(false);
  const weekBlink = useRef(new Animated.Value(1)).current;
  const streakPressRunning = useRef(false);
  const accent = theme.accent ?? colors.accent;
  const maxStreak = useMemo(() => computeMaxStreak(statEvents), [statEvents]);
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

  const handleWeekPress = () => {
    if (!onStreakTitlePress || streakPressRunning.current) return;
    streakPressRunning.current = true;
    weekBlink.stopAnimation();
    weekBlink.setValue(1);
    Animated.sequence([
      Animated.timing(weekBlink, {
        toValue: 0.55,
        duration: 70,
        useNativeDriver: true,
      }),
      Animated.timing(weekBlink, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      streakPressRunning.current = false;
      onStreakTitlePress();
    });
  };

  return (
    <>
      <SectionEntrance
        animated={animateEntrance}
        replayKey={`${entranceReplayKey}:streak`}
        delay={entranceBaseDelay}
      >
        <Pressable
          onPress={onStreakTitlePress}
          disabled={!onStreakTitlePress}
          style={[
            styles.streakSection,
            streakTitle && styles.titledStreakSection,
            !showSectionBorders && styles.borderlessSection,
          ]}
          accessibilityRole={onStreakTitlePress ? "button" : undefined}
          accessibilityLabel={onStreakTitlePress ? `Abrir ${streakTitle ?? "progreso"}` : undefined}
        >
          {streakTitle ? (
            <View style={styles.streakTitleRow}>
              <Text style={[styles.streakTitle, { color: colors.foreground }]}>
                {streakTitle}
              </Text>
              {showStreakViewAll && onStreakTitlePress ? (
                <Pressable
                  onPress={(event) => {
                    event.stopPropagation();
                    onStreakTitlePress();
                  }}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Ver todo Tu progreso"
                >
                  <Text style={[styles.streakViewAll, { color: accent }]}>Ver todo</Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}
          {showStreakWeek ? (
            <>
              <Pressable
                onPress={(event) => {
                  event.stopPropagation();
                  handleWeekPress();
                }}
                accessibilityRole="button"
                accessibilityLabel="Abrir Tu progreso semanal"
              >
                <Animated.View style={{ opacity: weekBlink }}>
                  <StreakWeekRow
                    animateEntrance={animateEntrance}
                    entranceReplayKey={`${entranceReplayKey}:week`}
                    entranceBaseDelay={entranceBaseDelay + 250}
                  />
                </Animated.View>
              </Pressable>
              <View style={styles.sectionDivider} />
            </>
          ) : null}
          <View style={[styles.statsValues, styles.statsValuesNoTitle]}>
            <Stat
              icon={<MaterialCommunityIcons name="spa" size={20} color="#F9F9F9" />}
              value={currentStreak}
              label="RACHA ACTUAL"
              accent={accent}
              onPress={onStreakTitlePress}
            />
            <View style={styles.statDivider} />
            <Stat
              icon={<MaterialCommunityIcons name="spa" size={20} color="#BE9650" />}
              value={maxStreak}
              label="RACHA MÁS LARGA"
              accent={accent}
              onPress={onStreakTitlePress}
            />
          </View>
        </Pressable>
      </SectionEntrance>

      {showPersonalStats ? (
        <SectionEntrance
          animated={animateEntrance}
          replayKey={`${entranceReplayKey}:personal`}
          delay={entranceBaseDelay + 500}
        >
          <View style={[styles.personalStatsSection, !showSectionBorders && styles.borderlessSection]}>
            <View style={styles.personalStatsHeader}>
              <Text style={[styles.personalStatsTitle, { color: colors.foreground }]}>
                Estadísticas personales
              </Text>
              <View style={styles.filterControl}>
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
        </SectionEntrance>
      ) : null}

      {showCalendar ? (
        <SectionEntrance
          animated={animateEntrance}
          replayKey={`${entranceReplayKey}:calendar`}
          delay={entranceBaseDelay + (showPersonalStats ? 1000 : 500)}
        >
          <HistorialCalendar
            embedded
            outlined={showSectionBorders}
            backgroundColor={SECTION_BACKGROUND}
          />
        </SectionEntrance>
      ) : null}
    </>
  );
}

function SectionEntrance({
  animated,
  children,
  delay,
  replayKey,
}: {
  animated: boolean;
  children: React.ReactNode;
  delay: number;
  replayKey: string | number;
}) {
  if (!animated) return <>{children}</>;

  return (
    <CinematicFadeSlide
      replayKey={replayKey}
      delay={delay}
      duration={3000}
    >
      {children}
    </CinematicFadeSlide>
  );
}

function Stat({
  icon,
  value,
  label,
  accent,
  onPress,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  accent: string;
  onPress?: () => void;
}) {
  const statIcon = <View style={styles.statIcon}>{icon}</View>;
  const content = (
    <>
      {statIcon}
      <View style={styles.statCopy}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={[styles.statLabel, { color: accent }]}>{label}</Text>
      </View>
    </>
  );
  if (!onPress) return <View style={styles.statItem}>{content}</View>;
  return (
    <Pressable
      style={styles.statItem}
      onPress={(event) => {
        event.stopPropagation();
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value}. Abrir Tu progreso`}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  streakSection: {
    borderRadius: 19,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: SECTION_BACKGROUND,
    paddingHorizontal: 16,
    paddingTop: 17,
    paddingBottom: 16,
    marginBottom: 12,
  },
  titledStreakSection: {
    paddingTop: 20,
  },
  streakTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  streakTitle: {
    fontFamily: "Manrope",
    fontSize: 18,
    fontWeight: "600",
  },
  streakViewAll: {
    fontFamily: "Manrope",
    fontSize: 12,
    fontWeight: "400",
  },
  sectionDivider: {
    height: 1,
    width: "100%",
    marginVertical: 16,
    backgroundColor: "rgba(255,255,255,0.07)",
  },
  personalStatsSection: {
    borderRadius: 19,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: SECTION_BACKGROUND,
    padding: 16,
    marginBottom: 12,
  },
  borderlessSection: {
    borderWidth: 0,
  },
  personalStatsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  personalStatsTitle: {
    fontFamily: "Manrope",
    fontSize: 17,
    fontWeight: "700",
  },
  filterTrigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 1,
  },
  filterControl: {
    position: "relative",
    alignItems: "flex-end",
    zIndex: 2,
  },
  filterMenu: {
    position: "absolute",
    top: 24,
    right: 0,
    minWidth: 148,
    borderRadius: 12,
    overflow: "hidden",
    zIndex: 3,
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