import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
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
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ProgressMirrorSections } from "@/components/ProgressMirrorSections";
import { CinematicFadeSlide } from "@/components/CinematicFadeSlide";
import { SessionBadgeGlass } from "@/components/SessionDurationBadge";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { useColors } from "@/hooks/useColors";
import { useStreak } from "@/hooks/useStreak";

export default function ProgresoScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { width: viewportWidth } = useWindowDimensions();
  const { theme } = useSceneTheme();
  const { weekFlags } = useStreak();
  const completedWeekDays = weekFlags.filter(Boolean).length;

  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, 40);
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const bgColors = theme.gradient as unknown as [string, string, ...string[]];
  const fadeColor = bgColors[0] || "#080910";
  const heroHeight = Math.min(410, Math.max(340, viewportWidth * 0.98));
  const fadeSolidStart = 1 - 55 / heroHeight;

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
          <CinematicFadeSlide
            replayKey="progress-hero-background"
            delay={0}
            duration={3000}
            scaleFrom={1.06}
            translateYFrom={0}
            style={StyleSheet.absoluteFill}
          >
            <Image
              source={require("@/assets/images/progreso-lotus-cosmic.jpg")}
              style={styles.heroLotus}
              contentFit="contain"
            />
          </CinematicFadeSlide>
          <LinearGradient
            colors={[
              withOpacity(fadeColor, 0),
              withOpacity(fadeColor, 0.3),
              fadeColor,
              fadeColor,
            ]}
            locations={[0.3, 0.7, fadeSolidStart, 1]}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          <View style={[styles.heroOverlay, { paddingTop: topPad + 80 }]}>
            <View style={styles.heroAnimatedContent}>
              <View style={styles.heroCopyOffset}>
                <CinematicFadeSlide
                  replayKey="progress-streak-count"
                  delay={1150}
                  duration={1200}
                  scaleFrom={0.9}
                  translateYFrom={14}
                >
                  <View style={styles.streakCountWrap}>
                    <View pointerEvents="none" style={styles.streakCountShadow} />
                    <View
                      style={styles.streakCountCircle}
                      accessibilityLabel={`${completedWeekDays} ${completedWeekDays === 1 ? "día" : "días"}`}
                    >
                      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
                        <SessionBadgeGlass showBlackTint={false} showWhiteTint />
                      </View>
                      <Text style={[styles.streakIntroCount, { color: colors.foreground }]}>
                        {completedWeekDays}
                      </Text>
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

        <LinearGradient colors={bgColors} style={styles.content}>
          <View style={styles.sectionsOffset}>
            <ProgressMirrorSections
              animateEntrance
              entranceReplayKey="progress-sections"
              entranceBaseDelay={900}
              showSectionBorders={false}
              sectionHorizontalPadding={20}
              sectionTopPadding={16}
              sectionBottomPadding={19}
              sectionVerticalPadding={16}
              sectionMarginBottom={20}
              canonicalVerticalInsets
              streakTitle="Tu progreso"
            />
          </View>
        </LinearGradient>
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
    backgroundColor: "rgba(0,0,0,0.28)",
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
    backgroundColor: "#080A28",
  },
  heroLotus: {
    ...StyleSheet.absoluteFillObject,
    transform: [{ scale: 1.52 }],
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
  streakCountShadow: {
    position: "absolute",
    bottom: -2,
    width: 52,
    height: 1,
    borderRadius: 0.5,
    backgroundColor: "rgba(0,0,0,0.01)",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.42,
    shadowRadius: 24,
    elevation: 3,
  },
  streakCountCircle: {
    width: 103,
    height: 103,
    borderRadius: 51.5,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  streakIntroCount: {
    fontFamily: "Manrope",
    fontSize: 55,
    lineHeight: 60,
    fontWeight: "800",
    letterSpacing: -0.5,
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
    transform: [{ translateY: 4 }],
  },
  streakIntroUnit: {
    fontFamily: "Manrope",
    fontSize: 9,
    lineHeight: 14,
    fontWeight: "800",
    letterSpacing: 0.9,
    textAlign: "center",
    textTransform: "uppercase",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
    transform: [{ translateY: -2 }],
  },
  streakIntroDescription: {
    color: "rgba(255,255,255,0.9)",
    fontFamily: "Manrope",
    fontSize: 13,
    lineHeight: 22,
    fontWeight: "500",
    marginTop: 14,
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

function withOpacity(color: string, opacity: number): string {
  const match = color.match(/^#([0-9a-f]{6})$/i);
  if (!match) return color;
  const alpha = Math.round(Math.max(0, Math.min(1, opacity)) * 255)
    .toString(16)
    .padStart(2, "0");
  return `#${match[1]}${alpha}`;
}