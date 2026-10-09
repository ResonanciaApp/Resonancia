import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CinematicFadeSlide } from "@/components/CinematicFadeSlide";
import { GrowthLevelImage, GROWTH_BLOOM_ART_SIZE } from "@/components/GrowthJourney";
import { MEMBERSHIP_AURORA, STREAK_INFO_COLORS } from "@/constants/colors";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { useGrowth } from "@/context/GrowthContext";

const WHITE = STREAK_INFO_COLORS.foreground;
const GOLD = MEMBERSHIP_AURORA.premium.accent;
const DURATION = 1400;
const BASE_DELAY = 150;

const EXPLANATION =
  "Antes del primer día hay un momento de decisión. No necesitas hacer nada todavía: solo reconocer que quieres darte un espacio de calma y volver a él, a tu ritmo.";

export function GrowthStageDetail({
  onClose,
}: {
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { theme } = useSceneTheme();
  const { levels } = useGrowth();
  const level = levels.find(item => item.id === "intencion");
  React.useEffect(() => {
    if (!level) onClose();
  }, [level, onClose]);
  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, 40);
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const heroSize = GROWTH_BLOOM_ART_SIZE * 2;
  if (!level) return null;
  const dayLabel = level.startDay === level.endDay ? `${level.startDay} días` : `${level.startDay}–${level.endDay} días`;

  return (
    <LinearGradient
      testID="growth-stage-detail"
      colors={theme.gradient as unknown as [string, string, ...string[]]}
      locations={theme.gradientLocations as unknown as [number, number, ...number[]] | undefined}
      start={theme.gradientStart}
      end={theme.gradientEnd}
      style={styles.root}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        bounces
        alwaysBounceVertical
        overScrollMode="always"
        contentInsetAdjustmentBehavior="never"
        automaticallyAdjustContentInsets={false}
        testID="growth-stage-detail-scroll"
        contentContainerStyle={{ paddingTop: topPad + 70, paddingBottom: bottomPad + 28 }}
      >
        <CinematicFadeSlide
          active
          replayKey="hero"
          delay={0}
          duration={DURATION}
          style={styles.heroArt}
        >
          <GrowthLevelImage level={level} size={heroSize} />
        </CinematicFadeSlide>
        <CinematicFadeSlide active replayKey="stage" delay={BASE_DELAY} duration={DURATION}>
          <View testID="growth-stage-detail-title-block" style={styles.titleBlock}>
            <Text style={styles.stageName} accessibilityRole="header">{level.name}</Text>
            <View style={styles.dayPill}>
              <MaterialCommunityIcons name="spa" size={14} color={GOLD} />
              <Text style={styles.days}>{dayLabel}</Text>
            </View>
          </View>
        </CinematicFadeSlide>

        <CinematicFadeSlide active replayKey="copy" delay={BASE_DELAY + 700} duration={DURATION}>
          <View style={styles.copy}>
            <Text style={styles.quote}>{level.story}</Text>
            <View style={styles.rule} />
            <Text style={styles.explanation}>{EXPLANATION}</Text>
          </View>
        </CinematicFadeSlide>

      </ScrollView>
      <View testID="growth-stage-detail-fixed-header" style={[styles.header, { paddingTop: topPad + 8 }]}>
        <Pressable
          onPress={onClose}
          style={styles.headerButton}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Volver a Tu camino"
          testID="growth-stage-detail-close"
        >
          <Feather name="x" size={23} color={WHITE} />
        </Pressable>
        <View testID="growth-stage-detail-header-label" style={styles.headerLabel} accessibilityRole="header">
          <Text style={styles.headerLabelText}>Primera etapa</Text>
          <Text style={styles.headerLabelText}>Florecimiento</Text>
        </View>
        <View pointerEvents="none" style={styles.headerSpacer} />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { ...StyleSheet.absoluteFillObject },
  heroArt: { alignSelf: "center", marginBottom: 16 },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLabel: { flex: 1, alignItems: "center" },
  headerLabelText: { fontFamily: "Manrope", fontSize: 11, lineHeight: 14, fontWeight: "500", color: WHITE, textAlign: "center" },
  headerSpacer: { width: 43 },
  headerButton: {
    width: 43,
    height: 43,
    borderRadius: 21.5,
    borderWidth: 0,
    borderColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: STREAK_INFO_COLORS.navigationBackground,
  },
  titleBlock: { alignItems: "center", marginTop: 0, gap: 8 },
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
  copy: { paddingHorizontal: 28, alignItems: "center", marginTop: 15 },
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
});
