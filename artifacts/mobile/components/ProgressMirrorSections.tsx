import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useMemo, useRef, useState } from "react";
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
import { PREMIUM_STAR_GRADIENT, STREAK_HISTORY_INFO_ICON_COLOR } from "@/constants/colors";

const SECTION_BACKGROUND = "rgba(0,0,0,0.16)";
export const STREAK_WEEK_START_OFFSET_MS = 650;
const PERSONAL_STATS_HEADER_OFFSET_MS = 420;
const PERSONAL_STATS_MINUTES_OFFSET_MS = 660;
const PERSONAL_STATS_FINAL_OFFSET_MS = 810;
const CONTENT_ENTRANCE_DURATION_MS = 1200;
export function ProgressMirrorSections({
  showSectionBorders = true,
  showPersonalStats = true,
  showPersonalStatsTitle = true,
  showStreakSection = true,
  sectionBackgroundColor = SECTION_BACKGROUND,
  mergeStatsAndStreak = false,
  personalStatsFilterBelowTitle = false,
  personalStatsFilterColor,
  showCalendar = true,
  showCalendarCompletedCount = false,
  animateEntrance = false,
  animateWeekEntrance = animateEntrance,
  entranceReplayKey = "progress-mirror",
  entranceBaseDelay = 0,
  personalStatsEntranceOffsetMs,
  syncStreakStatsWithWeek = false,
  chainPersonalStatsAfterWeek = false,
  onPersonalStatsComplete,
  streakTitle,
  separateStreakHistory = false,
  centerStreakHistoryCopy = false,
  showStreakHistory = true,
  showStreakHistoryTitle = true,
  showStreakHistoryInfo = true,
  onStreakHistoryPress,
  afterStreakHistory,
  beforeCalendar,
  afterCalendar,
  weeklySectionBackgroundColor,
  weeklySectionHorizontalPadding,
  weeklySectionTitle,
  weeklySectionTitleHorizontalPadding,
  streakHistoryTopPadding,
  streakHistoryDividerOffsetY = 0,
  longestStreakLabel = "RACHA MÁS LARGA",
  longestStreakIconColor,
  secondaryTextColor,
  onStreakTitlePress,
  showStreakWeek = true,
  showStreakViewAll = false,
  streakContentTranslateY = 0,
  sectionHorizontalPadding,
  sectionTopPadding,
  sectionBottomPadding,
  sectionVerticalPadding,
  sectionMarginBottom,
  personalStatsMarginTop,
  streakMarginBottom,
  canonicalVerticalInsets = false,
  profileCalendarLayout = false,
  profileStreakIcons = false,
  calendarTextSizeAdjustment = 0,
  calendarDayTextSizeAdjustment = calendarTextSizeAdjustment,
}: {
  showSectionBorders?: boolean;
  showPersonalStats?: boolean;
  showPersonalStatsTitle?: boolean;
  showStreakSection?: boolean;
  sectionBackgroundColor?: string;
  mergeStatsAndStreak?: boolean;
  personalStatsFilterBelowTitle?: boolean;
  personalStatsFilterColor?: string;
  showCalendar?: boolean;
  showCalendarCompletedCount?: boolean;
  animateEntrance?: boolean;
  animateWeekEntrance?: boolean;
  entranceReplayKey?: string | number;
  entranceBaseDelay?: number;
  personalStatsEntranceOffsetMs?: number;
  syncStreakStatsWithWeek?: boolean;
  chainPersonalStatsAfterWeek?: boolean;
  onPersonalStatsComplete?: () => void;
  streakTitle?: string;
  separateStreakHistory?: boolean;
  centerStreakHistoryCopy?: boolean;
  showStreakHistory?: boolean;
  showStreakHistoryTitle?: boolean;
  showStreakHistoryInfo?: boolean;
  onStreakHistoryPress?: () => void;
  afterStreakHistory?: React.ReactNode;
  beforeCalendar?: React.ReactNode;
  afterCalendar?: React.ReactNode;
  weeklySectionBackgroundColor?: string;
  weeklySectionHorizontalPadding?: number;
  weeklySectionTitle?: string;
  weeklySectionTitleHorizontalPadding?: number;
  streakHistoryTopPadding?: number;
  streakHistoryDividerOffsetY?: number;
  longestStreakLabel?: string;
  longestStreakIconColor?: string;
  secondaryTextColor?: string;
  onStreakTitlePress?: () => void;
  showStreakWeek?: boolean;
  showStreakViewAll?: boolean;
  streakContentTranslateY?: number;
  sectionHorizontalPadding?: number;
  sectionTopPadding?: number;
  sectionBottomPadding?: number;
  sectionVerticalPadding?: number;
  sectionMarginBottom?: number;
  personalStatsMarginTop?: number;
  streakMarginBottom?: number;
  canonicalVerticalInsets?: boolean;
  profileCalendarLayout?: boolean;
  profileStreakIcons?: boolean;
  calendarTextSizeAdjustment?: number;
  calendarDayTextSizeAdjustment?: number;
}) {
  const colors = useColors();
  const { theme } = useSceneTheme();
  const { statEvents } = usePlayer();
  const { currentStreak, weekCount, completedWeeks } = useStreak();
  const todayKey = useDayRollover();
  const [statsRangeDays, setStatsRangeDays] = useState<7 | 30 | 90>(30);
  const [statsFilterOpen, setStatsFilterOpen] = useState(false);
  const [weekEntranceDone, setWeekEntranceDone] = useState(false);
  const onWeekEntranceComplete = useCallback(() => setWeekEntranceDone(true), []);
  const weekBlink = useRef(new Animated.Value(1)).current;
  const streakPressRunning = useRef(false);
  const accent = theme.accent ?? colors.accent;
  const filterColor = personalStatsFilterColor ?? accent;
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

  const synchronizedStreakDelay = syncStreakStatsWithWeek && showStreakWeek
    ? entranceBaseDelay + STREAK_WEEK_START_OFFSET_MS
    : null;
  const personalStatsEntranceDelay = chainPersonalStatsAfterWeek
    ? 0
    : entranceBaseDelay + (personalStatsEntranceOffsetMs ?? 500);

  const filterControl = (
    <View style={[
      styles.filterControl,
      (personalStatsFilterBelowTitle || mergeStatsAndStreak) && styles.filterControlStacked,
    ]}>
      <Pressable
        onPress={() => setStatsFilterOpen((open) => !open)}
        style={styles.filterTrigger}
        accessibilityRole="button"
        accessibilityLabel="Elegir filtro de días"
        accessibilityState={{ expanded: statsFilterOpen }}
      >
        <Text style={[styles.filterText, { color: filterColor }]}>
          Últimos {statsRangeDays} días
        </Text>
        <Feather name="chevron-down" size={17} color={filterColor} />
      </Pressable>
      {statsFilterOpen && (
        <View style={[
          styles.filterMenu,
          (personalStatsFilterBelowTitle || mergeStatsAndStreak) && styles.filterMenuStacked,
          mergeStatsAndStreak && styles.filterMenuInFlow,
          { backgroundColor: theme.gradient[0] },
        ]}>
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
              <Text style={[styles.filterText, { color: filterColor }]}>
                Últimos {days} días
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );

  const personalStatsContent = showPersonalStats ? (
    <View
      style={[
        styles.personalStatsSection,
        !showSectionBorders && styles.borderlessSection,
        !mergeStatsAndStreak && { backgroundColor: sectionBackgroundColor },
        sectionHorizontalPadding !== undefined && {
          paddingHorizontal: sectionHorizontalPadding,
        },
        sectionVerticalPadding !== undefined && {
          paddingVertical: sectionVerticalPadding,
        },
        sectionBottomPadding !== undefined && {
          paddingBottom: sectionBottomPadding,
        },
        sectionMarginBottom !== undefined && {
          marginBottom: sectionMarginBottom,
        },
        !mergeStatsAndStreak && personalStatsMarginTop !== undefined && {
          marginTop: personalStatsMarginTop,
        },
        mergeStatsAndStreak && styles.mergedInnerSection,
        mergeStatsAndStreak && styles.mergedPersonalStatsSection,
      ]}
    >
      <ContentEntrance
        animated={animateEntrance}
        replayKey={`${entranceReplayKey}:personal-header`}
        delay={personalStatsEntranceDelay + (chainPersonalStatsAfterWeek ? 0 : PERSONAL_STATS_HEADER_OFFSET_MS)}
      >
        <View style={[
          styles.personalStatsHeader,
          (personalStatsFilterBelowTitle || mergeStatsAndStreak) && styles.personalStatsHeaderStacked,
        ]}>
          {showPersonalStatsTitle && (
            <Text style={[styles.personalStatsTitle, { color: colors.foreground }]}>
              Mis estadísticas
            </Text>
          )}
          {filterControl}
        </View>
      </ContentEntrance>
      <View style={styles.statsValues}>
        <View style={styles.statEntranceSlot}>
          <ContentEntrance
            animated={animateEntrance}
            replayKey={`${entranceReplayKey}:personal-minutes`}
            delay={personalStatsEntranceDelay + PERSONAL_STATS_MINUTES_OFFSET_MS}
          >
            <Stat
              icon={<Feather name="clock" size={18} color="#F9F9F9" />}
              value={personalStats.totalMinutes}
              unit={mergeStatsAndStreak ? "min" : undefined}
              label="MINUTOS TOTALES"
              accent={accent}
              edgeAligned={canonicalVerticalInsets}
            />
          </ContentEntrance>
        </View>
        <ContentEntrance
          animated={animateEntrance}
          replayKey={`${entranceReplayKey}:personal-divider-stat`}
          delay={personalStatsEntranceDelay + PERSONAL_STATS_FINAL_OFFSET_MS}
        >
          <View style={styles.statDivider} />
        </ContentEntrance>
        <View style={styles.statEntranceSlot}>
          <ContentEntrance
            animated={animateEntrance}
            replayKey={`${entranceReplayKey}:personal-days`}
            delay={personalStatsEntranceDelay + PERSONAL_STATS_FINAL_OFFSET_MS}
            onComplete={onPersonalStatsComplete}
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
  ) : null;

  const streakWeekRow = showStreakWeek ? (
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
          animateEntrance={animateWeekEntrance}
          entranceReplayKey={`${entranceReplayKey}:week`}
          entranceBaseDelay={entranceBaseDelay + STREAK_WEEK_START_OFFSET_MS}
          onEntranceComplete={chainPersonalStatsAfterWeek ? onWeekEntranceComplete : undefined}
        />
      </Animated.View>
    </Pressable>
  ) : null;

  const historyIconSize = profileStreakIcons ? 21 : 18;
  const completedStreakIcon = (
    <Feather name="check-circle" size={historyIconSize} color="#F9F9F9" />
  );

  const longestHistoryStreakIcon = (
    <MaterialCommunityIcons name="image-filter-hdr" size={historyIconSize} color="#F9F9F9" />
  );

  const longestStreakIcon = longestStreakIconColor ? (
    <MaskedView maskElement={<MaterialCommunityIcons name="spa" size={historyIconSize} color="#FFFFFF" />}>
      <MaterialCommunityIcons
        name="spa"
        size={historyIconSize}
        color={longestStreakIconColor}
        style={[styles.goldenLotusIcon, { textShadowColor: `${longestStreakIconColor}CC` }]}
      />
    </MaskedView>
  ) : (
    <MaskedView maskElement={<MaterialCommunityIcons name="spa" size={historyIconSize} color="#FFFFFF" />}>
      <LinearGradient colors={PREMIUM_STAR_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}>
        <MaterialCommunityIcons name="spa" size={historyIconSize} color="transparent" />
      </LinearGradient>
    </MaskedView>
  );

  const StreakHistoryContainer = onStreakHistoryPress ? Pressable : View;
  const streakHistoryContent = separateStreakHistory ? (
    <StreakHistoryContainer
      testID="profile-streak-history"
      onPress={onStreakHistoryPress}
      accessibilityRole={onStreakHistoryPress ? "button" : undefined}
      accessibilityLabel={onStreakHistoryPress ? "Explicar los tipos de rachas" : undefined}
      style={[
        styles.streakSection,
        !showSectionBorders && styles.borderlessSection,
        {
          backgroundColor: sectionBackgroundColor,
          paddingHorizontal: sectionHorizontalPadding ?? 16,
          paddingTop: streakHistoryTopPadding ?? sectionTopPadding ?? 20,
          paddingBottom: sectionBottomPadding ?? 16,
          marginBottom: sectionMarginBottom ?? 12,
        },
      ]}
    >
      {(showStreakHistoryTitle || showStreakHistoryInfo) && (
      <View style={[styles.streakTitleRow, !showStreakHistoryTitle && { justifyContent: "flex-end" }]}>
        {showStreakHistoryTitle && (
          <Text style={[styles.streakTitle, { color: colors.foreground }]}>Historial de rachas</Text>
        )}
        {showStreakHistoryInfo && <Pressable
          testID="profile-streak-history-info"
          style={styles.streakHistoryInfo}
          disabled
          accessibilityRole="button"
          accessibilityLabel="Información de rachas, próximamente"
          accessibilityState={{ disabled: true }}
        >
          <Feather name="more-horizontal" size={20} color={STREAK_HISTORY_INFO_ICON_COLOR} />
        </Pressable>}
      </View>
      )}
      <View testID="profile-streak-history-weekly" style={[styles.statsValues, styles.statsValuesNoTitle]}>
        <View style={styles.statEntranceSlot}>
          <Stat
            iconBoxStyle={profileStreakIcons ? styles.profileStreakIconBox : undefined}
            icon={<MaterialCommunityIcons name="spa" size={historyIconSize} color="#F9F9F9" />}
            value={weekCount}
            label="RACHA ACTUAL"
            accent={accent}
            labelColor={secondaryTextColor}
            onPress={onStreakHistoryPress ? undefined : onStreakTitlePress}
            edgeAligned={canonicalVerticalInsets && !centerStreakHistoryCopy}
          />
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statEntranceSlot}>
          <Stat
            iconBoxStyle={profileStreakIcons ? styles.profileStreakIconBox : undefined}
            icon={longestStreakIcon}
            value={maxStreak}
            label={longestStreakLabel}
            accent={accent}
            labelColor={secondaryTextColor}
            onPress={onStreakHistoryPress ? undefined : onStreakTitlePress}
            edgeAligned={canonicalVerticalInsets && !centerStreakHistoryCopy}
          />
        </View>
      </View>
      <View
        testID="profile-streak-history-divider"
        style={[styles.sectionDivider, { transform: [{ translateY: streakHistoryDividerOffsetY }] }]}
      />
      <View style={[styles.statsValues, styles.statsValuesNoTitle]}>
        <View style={styles.statEntranceSlot}>
          <Stat
            iconBoxStyle={profileStreakIcons ? styles.profileStreakIconBox : undefined}
            icon={longestHistoryStreakIcon}
            value={maxStreak}
            label="RACHA MÁS LARGA"
            accent={accent}
            labelColor={secondaryTextColor}
            onPress={onStreakHistoryPress ? undefined : onStreakTitlePress}
            edgeAligned={canonicalVerticalInsets && !centerStreakHistoryCopy}
          />
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statEntranceSlot}>
          <Stat
            iconBoxStyle={profileStreakIcons ? styles.profileStreakIconBox : undefined}
            icon={completedStreakIcon}
            value={completedWeeks}
            label="RACHAS COMPLETADAS"
            accent={accent}
            labelColor={secondaryTextColor}
            onPress={onStreakHistoryPress ? undefined : onStreakTitlePress}
            edgeAligned={canonicalVerticalInsets && !centerStreakHistoryCopy}
          />
        </View>
      </View>
    </StreakHistoryContainer>
  ) : null;

  const displayedStreakTitle = separateStreakHistory ? weeklySectionTitle : streakTitle;
  const streakContent = (
        <View
          testID={separateStreakHistory ? "profile-weekly-progress" : undefined}
          style={[
            styles.streakSection,
            streakTitle && styles.titledStreakSection,
            !showSectionBorders && styles.borderlessSection,
            !mergeStatsAndStreak && { backgroundColor: sectionBackgroundColor },
            sectionHorizontalPadding !== undefined && {
              paddingHorizontal: sectionHorizontalPadding,
            },
            sectionTopPadding !== undefined && {
              paddingTop: sectionTopPadding,
            },
            sectionBottomPadding !== undefined && {
              paddingBottom: sectionBottomPadding,
            },
            sectionMarginBottom !== undefined && {
              marginBottom: sectionMarginBottom,
            },
            streakMarginBottom !== undefined && {
              marginBottom: streakMarginBottom,
            },
            mergeStatsAndStreak && styles.mergedInnerSection,
            weeklySectionBackgroundColor !== undefined && {
              backgroundColor: weeklySectionBackgroundColor,
            },
            weeklySectionHorizontalPadding !== undefined && {
              paddingHorizontal: weeklySectionHorizontalPadding,
            },
          ]}
        >
          <View
            style={streakContentTranslateY
              ? { transform: [{ translateY: streakContentTranslateY }] }
              : undefined}
          >
          {displayedStreakTitle ? (
            <ContentEntrance
              animated={animateEntrance}
              replayKey={`${entranceReplayKey}:streak-title`}
              delay={entranceBaseDelay + 420}
            >
              <View testID={separateStreakHistory ? "profile-weekly-title" : undefined} style={[
                styles.streakTitleRow,
                separateStreakHistory && weeklySectionHorizontalPadding === 0 && {
                  paddingHorizontal: sectionHorizontalPadding ?? 16,
                },
                weeklySectionTitleHorizontalPadding !== undefined && {
                  paddingHorizontal: weeklySectionTitleHorizontalPadding,
                },
              ]}>
                {onStreakTitlePress ? (
                  <Pressable
                    onPress={onStreakTitlePress}
                    accessibilityRole="button"
                    accessibilityLabel={`Abrir ${displayedStreakTitle}`}
                  >
                    <Text style={[styles.streakTitle, { color: colors.foreground }]}>
                      {displayedStreakTitle}
                    </Text>
                  </Pressable>
                ) : (
                  <Text style={[styles.streakTitle, { color: colors.foreground }]}>
                    {displayedStreakTitle}
                  </Text>
                )}
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
              {streakWeekRow}
              {!separateStreakHistory && <ContentEntrance
                animated={animateEntrance}
                replayKey={`${entranceReplayKey}:streak-divider`}
                delay={synchronizedStreakDelay ?? entranceBaseDelay + 1720}
              >
                <View style={styles.sectionDivider} />
              </ContentEntrance>}
            </>
          ) : null}
          {!separateStreakHistory && <View style={[styles.statsValues, styles.statsValuesNoTitle]}>
            <View style={styles.statEntranceSlot}>
              <ContentEntrance
                animated={animateEntrance}
                replayKey={`${entranceReplayKey}:streak-current`}
                delay={synchronizedStreakDelay ??
                  entranceBaseDelay + (showPersonalStats ? 1460 : showStreakWeek ? 1920 : 650)}
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
              delay={synchronizedStreakDelay ??
                entranceBaseDelay + (showPersonalStats ? 1610 : showStreakWeek ? 2070 : 800)}
            >
              <View style={styles.statDivider} />
            </ContentEntrance>
            <View style={styles.statEntranceSlot}>
              <ContentEntrance
                animated={animateEntrance}
                replayKey={`${entranceReplayKey}:streak-longest`}
                delay={synchronizedStreakDelay ??
                  entranceBaseDelay + (showPersonalStats ? 1610 : showStreakWeek ? 2070 : 800)}
              >
              <Stat
                 icon={longestStreakIcon}
                value={maxStreak}
                label={longestStreakLabel}
                accent={accent}
                onPress={onStreakTitlePress}
                edgeAligned={canonicalVerticalInsets}
              />
              </ContentEntrance>
            </View>
          </View>}
          </View>
        </View>
  );

  return (
    <>
      {showStreakSection && mergeStatsAndStreak && showPersonalStats ? (
        <SectionEntrance
          animated={animateEntrance}
          replayKey={`${entranceReplayKey}:combined-progress`}
          delay={entranceBaseDelay}
        >
          <View style={[styles.mergedSection, { backgroundColor: sectionBackgroundColor }, !showSectionBorders && styles.borderlessSection]}>
            {personalStatsContent}
            <View style={styles.mergedDivider} />
            {streakContent}
          </View>
        </SectionEntrance>
      ) : (
        <>
          {showStreakSection && (!separateStreakHistory || showStreakWeek) && <SectionEntrance
            animated={animateEntrance}
            replayKey={`${entranceReplayKey}:streak`}
            delay={entranceBaseDelay}
          >
            {streakContent}
          </SectionEntrance>}
          {showStreakSection && showStreakHistory && streakHistoryContent ? (
            <>
              <SectionEntrance
                animated={animateEntrance}
                replayKey={`${entranceReplayKey}:streak-history`}
                delay={entranceBaseDelay}
              >
                {streakHistoryContent}
              </SectionEntrance>
              {afterStreakHistory}
            </>
          ) : null}
          {showPersonalStats && (!chainPersonalStatsAfterWeek || !showStreakSection || !showStreakWeek || weekEntranceDone) ? (
            <SectionEntrance
              animated={animateEntrance}
              replayKey={`${entranceReplayKey}:personal`}
              delay={personalStatsEntranceDelay}
            >
              {personalStatsContent}
            </SectionEntrance>
          ) : null}
        </>
      )}

      {showCalendar ? (
        <>
        {beforeCalendar}
        <SectionEntrance
          animated={animateEntrance}
          replayKey={`${entranceReplayKey}:calendar`}
          delay={entranceBaseDelay + (showPersonalStats ? 1000 : 500)}
        >
          <HistorialCalendar
            embedded
            dayContentTextColor={secondaryTextColor}
            showCompletedSessionCount={showCalendarCompletedCount}
            outlined={showSectionBorders}
            backgroundColor={sectionBackgroundColor}
            cardHorizontalPadding={sectionHorizontalPadding}
            cardVerticalPadding={sectionVerticalPadding}
            canonicalVerticalInsets={canonicalVerticalInsets}
            profileCalendarLayout={profileCalendarLayout}
            calendarTextSizeAdjustment={calendarTextSizeAdjustment}
            calendarDayTextSizeAdjustment={calendarDayTextSizeAdjustment}
            animateEntrance={animateEntrance}
            entranceReplayKey={`${entranceReplayKey}:calendar-content`}
            entranceBaseDelay={entranceBaseDelay + (showPersonalStats ? 1450 : 950)}
          />
        </SectionEntrance>
        {afterCalendar}
        </>
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
  onComplete,
}: {
  animated: boolean;
  children: React.ReactNode;
  delay: number;
  replayKey: string | number;
  onComplete?: () => void;
}) {
  if (!animated) return <>{children}</>;

  return (
    <CinematicFadeSlide
      replayKey={replayKey}
      delay={delay}
      duration={CONTENT_ENTRANCE_DURATION_MS}
      scaleFrom={0.97}
      translateYFrom={14}
      onComplete={onComplete}
    >
      {children}
    </CinematicFadeSlide>
  );
}

function Stat({
  icon,
  value,
  unit,
  label,
  accent,
  labelColor,
  onPress,
  edgeAligned = false,
  iconBoxStyle,
}: {
  icon: React.ReactNode;
  value: number;
  unit?: string;
  label: string;
  accent: string;
  labelColor?: string;
  onPress?: () => void;
  edgeAligned?: boolean;
  iconBoxStyle?: object;
}) {
  const statIcon = <View style={[styles.statIcon, iconBoxStyle]}>{icon}</View>;
  const content = (
    <>
      {statIcon}
      <View style={[styles.statCopy, edgeAligned && styles.statCopyEdgeAligned]}>
        <Text style={styles.statValue}>{value}{unit ? ` ${unit}` : ""}</Text>
        <Text style={[styles.statLabel, { color: labelColor ?? accent }]}>{label}</Text>
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
  mergedSection: {
    borderRadius: 19,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: SECTION_BACKGROUND,
    marginBottom: 12,
  },
  mergedInnerSection: {
    borderRadius: 0,
    borderWidth: 0,
    backgroundColor: "transparent",
    marginBottom: 0,
  },
  mergedPersonalStatsSection: {
    paddingTop: 15,
    zIndex: 2,
  },
  mergedDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.05)",
    marginHorizontal: 20,
    transform: [{ translateY: 3 }],
  },
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
  streakHistoryInfo: { width: 24, height: 24, alignItems: "flex-end", justifyContent: "center" },
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
    backgroundColor: "rgba(255,255,255,0.05)",
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
    zIndex: 3,
  },
  personalStatsHeaderStacked: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 4,
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
  filterControlStacked: {
    alignItems: "flex-start",
    alignSelf: "flex-start",
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
  filterMenuStacked: {
    left: 0,
    right: undefined,
  },
  filterMenuInFlow: {
    position: "relative",
    top: 0,
    right: undefined,
    marginTop: 6,
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
  profileStreakIconBox: { backgroundColor: "transparent", transform: [{ translateY: -7 }] },
  goldenLotusIcon: {
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  statCopy: { flex: 1, minWidth: 0 },
  statCopyEdgeAligned: { alignSelf: "flex-end" },
  statDivider: {
    width: 1,
    height: 42,
    marginHorizontal: 10,
    backgroundColor: "rgba(255,255,255,0.05)",
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