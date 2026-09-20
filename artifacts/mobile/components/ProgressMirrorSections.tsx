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
  streakContentTranslateY = 0,
  sectionHorizontalPadding,
  sectionTopPadding,
  sectionBottomPadding,
  sectionVerticalPadding,
  canonicalVerticalInsets = false,
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
  streakContentTranslateY?: number;
  sectionHorizontalPadding?: number;
  sectionTopPadding?: number;
  sectionBottomPadding?: number;
  sectionVerticalPadding?: number;
  canonicalVerticalInsets?: boolean;
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
            sectionHorizontalPadding !== undefined && {
              paddingHorizontal: sectionHorizontalPadding,
            },
            sectionTopPadding !== undefined && {
              paddingTop: sectionTopPadding,
            },
            sectionBottomPadding !== undefined && {
              paddingBottom: sectionBottomPadding,
            },
          ]}
          accessibilityRole={onStreakTitlePress ? "button" : undefined}
          accessibilityLabel={onStreakTitlePress ? `Abrir ${streakTitle ?? "progreso"}` : undefined}
        >
          <View
            style={streakContentTranslateY
              ? { transform: [{ translateY: streakContentTranslateY }] }
              : undefined}
          >
          {streakTitle ? (
            <ContentEntrance
              animated={animateEntrance}
              replayKey={`${entranceReplayKey}:streak-title`}
              delay={entranceBaseDelay + 420}
            >
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
            </ContentEntrance>
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
                    entranceBaseDelay={entranceBaseDelay + 650}
                  />
                </Animated.View>
              </Pressable>
              <ContentEntrance
                animated={animateEntrance}
                replayKey={`${entranceReplayKey}:streak-divider`}
                delay={entranceBaseDelay + 1720}
              >
                <View style={styles.sectionDivider} />
              </ContentEntrance>
            </>
          ) : null}
          <View style={[styles.statsValues, styles.statsValuesNoTitle]}>
            <View style={styles.statEntranceSlot}>
              <ContentEntrance
                animated={animateEntrance}
                replayKey={`${entranceReplayKey}:streak-current`}
                delay={
                  entranceBaseDelay +
                  (showPersonalStats ? 1460 : showStreakWeek ? 1920 : 650)
                }
              >
              <Stat
                icon={<MaterialCommunityIcons name="spa" size={18} color="#F9F9F9" />}
                value={currentStreak}
                label="RACHA ACTUAL"
                accent={accent}
                onPress={onStreakTitlePress}
                edgeAligned={canonicalVerticalInsets}
              />
              </ContentEntrance>
            </View>
            <ContentEntrance
              animated={animateEntrance}
              replayKey={`${entranceReplayKey}:streak-divider-stat`}
              delay={
                entranceBaseDelay +
                (showPersonalStats ? 1610 : showStreakWeek ? 2070 : 800)
              }
            >
              <View style={styles.statDivider} />
            </ContentEntrance>
            <View style={styles.statEntranceSlot}>
              <ContentEntrance
                animated={animateEntrance}
                replayKey={`${entranceReplayKey}:streak-longest`}
                delay={
                  entranceBaseDelay +
                  (showPersonalStats ? 1610 : showStreakWeek ? 2070 : 800)
                }
              >
              <Stat
                icon={<MaterialCommunityIcons name="spa" size={18} color="#BE9650" />}
                value={maxStreak}
                label="RACHA MÁS LARGA"
                accent={accent}
                onPress={onStreakTitlePress}
                edgeAligned={canonicalVerticalInsets}
              />
              </ContentEntrance>
            </View>
          </View>
          </View>
        </Pressable>
      </SectionEntrance>

      {showPersonalStats ? (
        <SectionEntrance
          animated={animateEntrance}
          replayKey={`${entranceReplayKey}:personal`}
          delay={entranceBaseDelay + 500}
        >
          <View
            style={[
              styles.personalStatsSection,
              !showSectionBorders && styles.borderlessSection,
              sectionHorizontalPadding !== undefined && {
                paddingHorizontal: sectionHorizontalPadding,
              },
              sectionVerticalPadding !== undefined && {
                paddingVertical: sectionVerticalPadding,
              },
            ]}
          >
            <ContentEntrance
              animated={animateEntrance}
              replayKey={`${entranceReplayKey}:personal-header`}
              delay={entranceBaseDelay + 920}
            >
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
            </ContentEntrance>
            <View style={styles.statsValues}>
              <View style={styles.statEntranceSlot}>
                <ContentEntrance
                  animated={animateEntrance}
                  replayKey={`${entranceReplayKey}:personal-minutes`}
                  delay={entranceBaseDelay + 1160}
                >
                <Stat
                  icon={<Feather name="clock" size={18} color="#F9F9F9" />}
                  value={personalStats.totalMinutes}
                  label="MINUTOS TOTALES"
                  accent={accent}
                  edgeAligned={canonicalVerticalInsets}
                />
                </ContentEntrance>
              </View>
              <ContentEntrance
                animated={animateEntrance}
                replayKey={`${entranceReplayKey}:personal-divider-stat`}
                delay={entranceBaseDelay + 1310}
              >
                <View style={styles.statDivider} />
              </ContentEntrance>
              <View style={styles.statEntranceSlot}>
                <ContentEntrance
                  animated={animateEntrance}
                  replayKey={`${entranceReplayKey}:personal-days`}
                  delay={entranceBaseDelay + 1310}
                >
                <Stat
                  icon={<Feather name="calendar" size={18} color="#F9F9F9" />}
                  value={personalStats.activeDays}
                  label="DÍAS ACTIVOS"
                  accent={accent}
                  edgeAligned={canonicalVerticalInsets}
                />
                </ContentEntrance>
              </View>
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
            cardHorizontalPadding={sectionHorizontalPadding}
            cardVerticalPadding={sectionVerticalPadding}
            canonicalVerticalInsets={canonicalVerticalInsets}
            animateEntrance={animateEntrance}
            entranceReplayKey={`${entranceReplayKey}:calendar-content`}
            entranceBaseDelay={entranceBaseDelay + (showPersonalStats ? 1450 : 950)}
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
      duration={1100}
      scaleFrom={0.985}
      translateYFrom={12}
    >
      {children}
    </CinematicFadeSlide>
  );
}

function ContentEntrance({
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
      duration={1200}
      scaleFrom={0.97}
      translateYFrom={14}
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
  edgeAligned = false,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  accent: string;
  onPress?: () => void;
  edgeAligned?: boolean;
}) {
  const statIcon = <View style={styles.statIcon}>{icon}</View>;
  const content = (
    <>
      {statIcon}
      <View style={[styles.statCopy, edgeAligned && styles.statCopyEdgeAligned]}>
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
    fontSize: 16,
    fontWeight: "600",
  },
  streakViewAll: {
    fontFamily: "Manrope",
    fontSize: 12,
    fontWeight: "400",
    transform: [{ translateX: -2 }, { translateY: 2 }],
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
    fontSize: 16,
    fontWeight: "600",
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
  statEntranceSlot: {
    flex: 1,
    minWidth: 0,
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
  statCopyEdgeAligned: { alignSelf: "flex-end" },
  statDivider: {
    width: 1,
    height: 42,
    marginHorizontal: 10,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  statValue: {
    color: "#F9F9F9",
    fontFamily: "Manrope",
    fontSize: 20,
    fontWeight: "600",
  },
  statLabel: {
    fontFamily: "Manrope",
    fontSize: 9,
    lineHeight: 12,
    letterSpacing: 0.35,
    marginTop: 2,
  },
});