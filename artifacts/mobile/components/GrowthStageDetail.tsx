import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CinematicFadeSlide } from "@/components/CinematicFadeSlide";
import { GrowthLevelImage } from "@/components/GrowthJourney";
import { MEMBERSHIP_AURORA, STREAK_INFO_COLORS } from "@/constants/colors";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { growthLevels } from "@/data/growthLevels";

const WHITE = STREAK_INFO_COLORS.foreground;
const GOLD = MEMBERSHIP_AURORA.premium.accent;
const DURATION = 1400;
const BASE_DELAY = 150;

const level = growthLevels[0];
const EYEBROW = "PRIMERA ETAPA";
const DAY_LABEL = "0 días";
const EXPLANATION =
  "Antes del primer día hay un momento de decisión. No necesitas hacer nada todavía: solo reconocer que quieres darte un espacio de calma y volver a él, a tu ritmo.";
const AFFIRMATION = "Elegir comenzar ya es parte de tu práctica.";

export function GrowthStageDetail({
  onClose,
  onHelp,
  helpVisible = false,
}: {
  onClose: () => void;
  onHelp: () => void;
  helpVisible?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const { theme } = useSceneTheme();
  const { width } = useWindowDimensions();
  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, 40);
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const heroSize = Math.round(width);

  return (
    <LinearGradient
      testID="growth-stage-detail"
      colors={theme.gradient as unknown as [string, string, ...string[]]}
      locations={theme.gradientLocations as unknown as [number, number, ...number[]] | undefined}
      start={theme.gradientStart}
      end={theme.gradientEnd}
      style={styles.root}
      pointerEvents={helpVisible ? "none" : "auto"}
      accessibilityElementsHidden={helpVisible}
      importantForAccessibility={helpVisible ? "no-hide-descendants" : "auto"}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        bounces
        alwaysBounceVertical
        overScrollMode="always"
        contentInsetAdjustmentBehavior="never"
        automaticallyAdjustContentInsets={false}
        testID="growth-stage-detail-scroll"
        contentContainerStyle={{ paddingBottom: bottomPad + 28 }}
      >
        <View style={[styles.header, { paddingTop: topPad + 8 }]}>
          <Pressable
            onPress={onClose}
            disabled={helpVisible}
            style={styles.headerButton}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Volver a Tu camino"
            testID="growth-stage-detail-close"
          >
            <Feather name="x" size={23} color={WHITE} />
          </Pressable>
          <View style={styles.titleWrap}>
            <Text style={styles.eyebrow}>{EYEBROW}</Text>
            <MaterialCommunityIcons name="spa" size={18} color={GOLD} style={styles.lotus} />
          </View>
          <Pressable
            onPress={onHelp}
            disabled={helpVisible}
            style={styles.headerButton}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Ayuda"
            testID="growth-stage-detail-help"
          >
            <Text style={styles.questionMark}>?</Text>
          </Pressable>
        </View>

        <CinematicFadeSlide active replayKey="stage" delay={BASE_DELAY} duration={DURATION}>
          <View style={styles.titleBlock}>
            <Text style={styles.stageName} accessibilityRole="header">{level.name}</Text>
            <View style={styles.dayPill}>
              <MaterialCommunityIcons name="spa" size={14} color={GOLD} />
              <Text style={styles.days}>{DAY_LABEL}</Text>
            </View>
          </View>
        </CinematicFadeSlide>

        <CinematicFadeSlide active replayKey="hero" delay={BASE_DELAY + 300} duration={DURATION}>
          <MaskedView
            style={{ width: heroSize, height: heroSize, marginTop: 8 }}
            maskElement={
              <LinearGradient
                colors={["#FFFFFF00", "#FFFFFF", "#FFFFFF", "#FFFFFF00"]}
                locations={[0, 0.12, 0.72, 1]}
                style={StyleSheet.absoluteFill}
              />
            }
          >
            <View style={{ width: heroSize, height: heroSize }}>
              <GrowthLevelImage level={level} size={heroSize} />
            </View>
          </MaskedView>
        </CinematicFadeSlide>

        <CinematicFadeSlide active replayKey="copy" delay={BASE_DELAY + 700} duration={DURATION}>
          <View style={styles.copy}>
            <Text style={styles.quote}>{level.story}</Text>
            <View style={styles.rule} />
            <Text style={styles.explanation}>{EXPLANATION}</Text>
          </View>
        </CinematicFadeSlide>

        <CinematicFadeSlide active replayKey="aff" delay={BASE_DELAY + 1000} duration={DURATION}>
          <View style={styles.affirmation} accessible accessibilityLabel={AFFIRMATION}>
            <View style={styles.affirmationIcon}>
              <MaterialCommunityIcons name="spa" size={18} color={GOLD} />
            </View>
            <Text style={styles.affirmationText}>{AFFIRMATION}</Text>
          </View>
        </CinematicFadeSlide>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { ...StyleSheet.absoluteFillObject },
  header: {
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerButton: {
    width: 43,
    height: 43,
    borderRadius: 21.5,
    borderWidth: 1,
    borderColor: STREAK_INFO_COLORS.navigationBorder,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: STREAK_INFO_COLORS.navigationBackground,
  },
  titleWrap: { flex: 1, alignItems: "center", marginHorizontal: 8, gap: 4 },
  questionMark: { fontFamily: "Manrope", fontSize: 24, lineHeight: 30, fontWeight: "500", color: WHITE },
  eyebrow: {
    fontFamily: "Manrope",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
    color: STREAK_INFO_COLORS.subtitle,
    textAlign: "center",
  },
  lotus: { lineHeight: 18, includeFontPadding: false },
  titleBlock: { alignItems: "center", marginTop: 22, gap: 14 },
  stageName: {
    fontFamily: "CormorantGaramond",
    fontSize: 44,
    lineHeight: 50,
    color: STREAK_INFO_COLORS.pageTitle,
    textAlign: "center",
  },
  dayPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 18,
    backgroundColor: "rgba(151,128,231,0.20)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
  days: { fontFamily: "Manrope", fontSize: 14, fontWeight: "600", color: WHITE },
  copy: { paddingHorizontal: 28, alignItems: "center", marginTop: -28 },
  quote: {
    fontFamily: "CormorantGaramond",
    fontSize: 27,
    lineHeight: 33,
    color: WHITE,
    textAlign: "center",
  },
  rule: { width: 44, height: 2, backgroundColor: GOLD, marginVertical: 18, borderRadius: 1 },
  explanation: {
    fontFamily: "Manrope",
    fontSize: 15,
    lineHeight: 23,
    color: STREAK_INFO_COLORS.subtitle,
    textAlign: "center",
  },
  affirmation: {
    marginHorizontal: 20,
    marginTop: 44,
    paddingTop: 30,
    paddingBottom: 26,
    paddingHorizontal: 24,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: STREAK_INFO_COLORS.cardBackground,
    alignItems: "center",
  },
  affirmationIcon: {
    position: "absolute",
    top: -17,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: STREAK_INFO_COLORS.fallbackBackground,
  },
  affirmationText: {
    fontFamily: "CormorantGaramond",
    fontStyle: "italic",
    fontSize: 22,
    lineHeight: 29,
    color: GOLD,
    textAlign: "center",
  },
});
