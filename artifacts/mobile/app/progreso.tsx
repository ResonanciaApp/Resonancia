import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useMemo } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from "react-native-svg";
import Animated, {
  cancelAnimation,
  Easing,
  type SharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";

import { ProgressMirrorSections } from "@/components/ProgressMirrorSections";
import { CinematicFadeSlide } from "@/components/CinematicFadeSlide";
import { getPositionedDayGradient } from "@/components/StreakWeekRow";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { useColors } from "@/hooks/useColors";
import { useStreak } from "@/hooks/useStreak";

const DESCRIPTION_SHIFT = 18;
const RING_SIZE = 131;
const RING_STROKE = 9;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
const RING_ENTRANCE_DELAY = 1150;
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function StreakCountDigit({
  day,
  lastDay,
  progress,
  color,
}: {
  day: number;
  lastDay: number;
  progress: SharedValue<number>;
  color: string;
}) {
  const fadeStyle = useAnimatedStyle(() => {
    const value = progress.value;
    const fadeIn = day === 0 ? 1 : Math.max(0, Math.min(1, (value - day + 0.25) / 0.25));
    const fadeOut = day === lastDay ? 1 : Math.max(0, Math.min(1, (day + 0.7 - value) / 0.2));
    return { opacity: Math.min(fadeIn, fadeOut) };
  }, [day, lastDay]);

  return (
    <Animated.Text
      accessible={false}
      importantForAccessibility="no"
      style={[styles.streakIntroCount, styles.streakDigit, { color }, fadeStyle]}
    >
      {day}
    </Animated.Text>
  );
}

export default function ProgresoScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { width: viewportWidth } = useWindowDimensions();
  const { theme } = useSceneTheme();
  const { weekFlags } = useStreak();
  const completedWeekDays = weekFlags.filter(Boolean).length;
  const ringGradient = useMemo(() => getPositionedDayGradient(theme.gradient), [theme.gradient]);
  const reduceMotion = useReducedMotion();
  const animatedDays = useSharedValue(reduceMotion ? completedWeekDays : 0);
  const ringProps = useAnimatedProps(() => ({
    strokeDashoffset: RING_CIRCUMFERENCE *
      (1 - Math.max(0, Math.min(1, (reduceMotion ? completedWeekDays : animatedDays.value) / 7))),
  }));

  useFocusEffect(useCallback(() => {
    cancelAnimation(animatedDays);
    if (reduceMotion || completedWeekDays === 0) {
      animatedDays.value = completedWeekDays;
    } else {
      animatedDays.value = 0;
      animatedDays.value = withDelay(
        RING_ENTRANCE_DELAY,
        withTiming(completedWeekDays, {
          duration: Math.max(1000, completedWeekDays * 300),
          easing: Easing.linear,
        }),
      );
    }
    return () => cancelAnimation(animatedDays);
  }, [animatedDays, completedWeekDays, reduceMotion]));

  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, 40);
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const bgColors = theme.gradient as unknown as [string, string, ...string[]];
  const heroHeight = Math.min(410, Math.max(340, viewportWidth * 0.98)) - 75 + DESCRIPTION_SHIFT;

  return (
    <LinearGradient
      style={styles.root}
      colors={bgColors}
      locations={theme.gradientLocations as unknown as [number, number, ...number[]] | undefined}
    >
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomPad + 32 }}
        bounces={false}
      >
        <View style={[styles.header, { paddingTop: topPad + 8 }]}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={10}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Volver"
          >
            <Feather
              name="chevron-left"
              size={28}
              color={colors.foreground}
              style={styles.backChevron}
            />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Tu progreso</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={[styles.heroContainer, { width: viewportWidth, height: heroHeight }]}>
          <View style={[styles.heroOverlay, { paddingTop: topPad + 5 }]}>
            <View style={styles.heroAnimatedContent}>
              <View style={styles.heroCopyOffset}>
                <CinematicFadeSlide
                  replayKey="progress-streak-count"
                  delay={RING_ENTRANCE_DELAY}
                  duration={1200}
                  scaleFrom={0.9}
                  translateYFrom={14}
                >
                  <View style={styles.streakCountWrap}>
                    {completedWeekDays > 0 && (
                      <Svg
                        pointerEvents="none"
                        width={RING_SIZE}
                        height={RING_SIZE}
                        style={styles.streakProgressRing}
                      >
                        <Defs>
                          <SvgLinearGradient id="positioned-day-progress" x1="0%" y1="0%" x2="0%" y2="100%">
                            {ringGradient.map((color, index) => (
                              <Stop
                                key={index}
                                offset={`${(theme.gradientLocations?.[index] ?? index / (ringGradient.length - 1)) * 100}%`}
                                stopColor={color}
                              />
                            ))}
                          </SvgLinearGradient>
                        </Defs>
                        <Circle
                          cx={RING_SIZE / 2}
                          cy={RING_SIZE / 2}
                          r={RING_RADIUS}
                          stroke="rgba(255,255,255,0.16)"
                          strokeWidth={RING_STROKE}
                          fill="none"
                        />
                        <AnimatedCircle
                          animatedProps={ringProps}
                          cx={RING_SIZE / 2}
                          cy={RING_SIZE / 2}
                          r={RING_RADIUS}
                          stroke="url(#positioned-day-progress)"
                          strokeWidth={RING_STROKE}
                          strokeLinecap="round"
                          fill="none"
                          strokeDasharray={`${RING_CIRCUMFERENCE} ${RING_CIRCUMFERENCE}`}
                          strokeDashoffset={RING_CIRCUMFERENCE}
                          transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
                        />
                      </Svg>
                    )}
                    <View
                      style={styles.streakCountCircle}
                      accessible
                      accessibilityLabel={`${completedWeekDays} ${completedWeekDays === 1 ? "día" : "días"}`}
                    >
                      {reduceMotion ? (
                        <Text style={[styles.streakIntroCount, { color: colors.foreground }]}>
                          {completedWeekDays}
                        </Text>
                      ) : (
                        <View style={styles.streakDigitSlot}>
                          {Array.from({ length: completedWeekDays + 1 }, (_, day) => (
                            <StreakCountDigit
                              key={day}
                              day={day}
                              lastDay={completedWeekDays}
                              progress={animatedDays}
                              color={colors.foreground}
                            />
                          ))}
                        </View>
                      )}
                      <Text style={[styles.streakIntroUnit, { color: colors.foreground }]}>Días</Text>
                    </View>
                  </View>
                </CinematicFadeSlide>
                <CinematicFadeSlide
                  replayKey="progress-intro-description"
                  delay={200}
                  duration={3000}
                  style={styles.heroAnimatedContent}
                >
                  <Text style={styles.streakIntroDescription}>
                    Medita al menos 3 días a la semana y transforma todos los aspectos de tu vida
                  </Text>
                </CinematicFadeSlide>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.sectionsOffset}>
            <ProgressMirrorSections
              animateEntrance
              entranceReplayKey="progress-sections"
              entranceBaseDelay={900}
              showSectionBorders={false}
              showPersonalStats={false}
              showCalendar={false}
              sectionBackgroundColor="rgba(0,0,0,0.2)"
              sectionHorizontalPadding={20}
              sectionTopPadding={16}
              sectionBottomPadding={19}
              sectionMarginBottom={20}
              canonicalVerticalInsets
            />
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: 20,
    paddingBottom: 15,
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: "transparent",
  },
  backButton: {
    width: 43,
    height: 43,
    borderRadius: 21.5,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "rgba(0,0,0,0.22)",
    alignItems: "center",
    justifyContent: "center",
  },
  backChevron: {
    transform: [{ translateX: -1 }],
  },
  headerTitle: {
    flex: 1,
    fontFamily: "Manrope",
    fontSize: 20,
    lineHeight: 42,
    fontWeight: "700",
    textAlign: "center",
  },
  headerSpacer: { width: 43, height: 43 },
  heroContainer: {
    position: "relative",
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
    alignItems: "center",
    paddingHorizontal: 20,
    transform: [{ translateY: -55 }],
  },
  heroAnimatedContent: {
    width: "100%",
    alignItems: "center",
  },
  heroCopyOffset: {
    width: "100%",
    alignItems: "center",
    transform: [{ translateY: 155 }],
  },
  content: {
    paddingHorizontal: 16,
    marginTop: -55,
    paddingTop: 12,
  },
  sectionsOffset: {
    marginTop: 95,
    position: "relative",
  },
  introDivider: {
    position: "absolute",
    top: -24,
    left: 0,
    right: 0,
  },
  introDividerLine: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  streakCountWrap: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  streakProgressRing: {
    position: "absolute",
    top: -9,
    left: -9,
  },
  streakCountCircle: {
    width: 113,
    height: 113,
    borderRadius: 56.5,
    backgroundColor: "rgba(255,255,255,0.1)",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  streakIntroCount: {
    fontFamily: "Manrope",
    fontSize: 53,
    lineHeight: 60,
    fontWeight: "800",
    letterSpacing: -0.5,
    textAlign: "center",
    transform: [{ translateY: 4 }],
  },
  streakDigitSlot: {
    width: 64,
    height: 60,
  },
  streakDigit: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
  streakIntroUnit: {
    fontFamily: "Manrope",
    fontSize: 9,
    lineHeight: 14,
    fontWeight: "800",
    letterSpacing: 0.9,
    textAlign: "center",
    textTransform: "uppercase",
    transform: [{ translateY: -2 }],
  },
  streakIntroDescription: {
    color: "rgba(255,255,255,0.9)",
    fontFamily: "Manrope",
    fontSize: 13,
    lineHeight: 22,
    fontWeight: "500",
    marginTop: 14 + DESCRIPTION_SHIFT,
    textAlign: "center",
    maxWidth: "85%",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
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