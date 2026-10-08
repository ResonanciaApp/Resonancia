import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useMemo } from "react";
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
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from "react-native-svg";
import { ProgressMirrorSections } from "@/components/ProgressMirrorSections";
import { getPositionedDayGradient } from "@/components/StreakWeekRow";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { useColors } from "@/hooks/useColors";
import { useStreak } from "@/hooks/useStreak";

const COUNT_SIZE = 100;
const RING_SIZE = 118;
const RING_STROKE = 9;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

export default function ProgresoScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { theme } = useSceneTheme();
  const { weekFlags } = useStreak();
  const completedWeekDays = weekFlags.filter(Boolean).length;
  const ringGradient = useMemo(() => getPositionedDayGradient(theme.gradient), [theme.gradient]);
  const ringOffset = RING_CIRCUMFERENCE * (1 - completedWeekDays / 7);

  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, 40);
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const bgColors = theme.gradient as unknown as [string, string, ...string[]];

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
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Tu progreso semanal</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={[styles.heroContainer, { paddingTop: topPad + 90 }]}>
                <View style={styles.heroContent}>
                  <Text style={styles.streakIntroDescription} testID="progress-intro-description">
                    Medita al menos 3 días a la semana y transforma todos los aspectos de tu vida
                  </Text>
                </View>
                <View style={styles.heroContent}>
                  <View
                    style={[styles.streakCountWrap, completedWeekDays > 0 && styles.streakCountWithRing]}
                    testID="progress-day-counter"
                  >
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
                        <Circle
                          cx={RING_SIZE / 2}
                          cy={RING_SIZE / 2}
                          r={RING_RADIUS}
                          stroke="url(#positioned-day-progress)"
                          strokeWidth={RING_STROKE}
                          strokeLinecap="round"
                          fill="none"
                          strokeDasharray={`${RING_CIRCUMFERENCE} ${RING_CIRCUMFERENCE}`}
                          strokeDashoffset={ringOffset}
                          transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
                        />
                      </Svg>
                    )}
                    <View
                      style={styles.streakCountCircle}
                      testID="progress-days-background"
                      accessible
                      accessibilityLabel={`${completedWeekDays} ${completedWeekDays === 1 ? "día" : "días"}`}
                    >
                      <Text style={[styles.streakIntroCount, { color: colors.foreground }]}>
                        {completedWeekDays}
                      </Text>
                      <Text style={[styles.streakIntroUnit, { color: colors.foreground }]}>Días</Text>
                    </View>
                  </View>
                </View>
        </View>

            <View style={styles.content}>
                <ProgressMirrorSections
                  animateEntrance={false}
                  animateWeekEntrance={false}
                  entranceReplayKey="progress-sections"
                  entranceBaseDelay={0}
                  showSectionBorders={false}
                  showPersonalStats={false}
                  showCalendar={false}
                  showStreakHistory={false}
                  separateStreakHistory
                  weeklySectionBackgroundColor="transparent"
                  weeklySectionHorizontalPadding={0}
                  sectionBackgroundColor="rgba(0,0,0,0.16)"
                  sectionHorizontalPadding={20}
                  sectionTopPadding={0}
                  sectionBottomPadding={0}
                  sectionMarginBottom={0}
                  streakMarginBottom={0}
                />
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
    borderWidth: 0,
    borderColor: "transparent",
    backgroundColor: "rgba(0,0,0,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  backChevron: {
    transform: [{ translateX: -1 }],
  },
  headerTitle: {
    flex: 1,
    fontFamily: "Manrope",
    fontSize: 18,
    lineHeight: 42,
    fontWeight: "700",
    textAlign: "center",
  },
  headerSpacer: { width: 43, height: 43 },
  heroContainer: {
    alignItems: "center",
    paddingHorizontal: 20,
  },
  heroContent: {
    width: "100%",
    alignItems: "center",
  },
  content: {
    paddingHorizontal: 16,
    marginTop: 15,
  },
  streakCountWrap: {
    position: "relative",
    width: COUNT_SIZE,
    height: COUNT_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  streakCountWithRing: { width: RING_SIZE, height: RING_SIZE },
  streakProgressRing: {
    position: "absolute",
    top: 0,
    left: 0,
  },
  streakCountCircle: {
    width: COUNT_SIZE,
    height: COUNT_SIZE,
    borderRadius: COUNT_SIZE / 2,
    backgroundColor: "rgba(255,255,255,0.1)",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  streakIntroCount: {
    fontFamily: "Manrope",
    fontSize: 46,
    lineHeight: 53,
    fontWeight: "800",
    letterSpacing: -0.5,
    textAlign: "center",
    transform: [{ translateY: 4 }],
  },
  streakDigitSlot: {
    width: 64,
    height: 53,
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
    marginBottom: 16,
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