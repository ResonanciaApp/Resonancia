import React, { useEffect, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";

import { MEMBERSHIP_AURORA, POSITIONED_DAY_GRADIENT } from "@/constants/colors";
import { ascentLevels, growthLevels, type GrowthLevel } from "@/data/growthLevels";
import { useColors } from "@/hooks/useColors";

export const GROWTH_ROW_HEIGHT = 205;
const CHAIN_STEP_MS = 220;

const GROWTH_COLORS = {
  line: POSITIONED_DAY_GRADIENT[0],
  current: MEMBERSHIP_AURORA.premium.accent,
  muted: "rgba(196,194,222,0.8)",
  inactiveLine: "rgba(174,161,237,0.28)",
} as const;

type Status = "current" | "locked";

function GrowthLevelImage({
  level,
  status,
}: {
  level: GrowthLevel;
  status: Status;
}) {
  return (
    <View style={[styles.imageWrap, status === "locked" && styles.lockedImage]} importantForAccessibility="no">
      <Image
        source={level.image}
        resizeMode="cover"
        style={styles.levelImage}
        onError={(event) => console.warn(`[GrowthJourney] No se pudo cargar ${level.id}: ${event.nativeEvent.error}`)}
        accessibilityElementsHidden
        importantForAccessibility="no"
      />
    </View>
  );
}

function GrowthRow({
  level,
  number,
  hasNext,
  status,
  visible,
}: {
  level: GrowthLevel;
  number: number;
  hasNext: boolean;
  status: Status;
  visible: boolean;
}) {
  const colors = useColors();
  const reduceMotion = useReducedMotion();
  const dayLabel = level.startDay === level.endDay
    ? `${level.startDay} días`
    : `${level.startDay}–${level.endDay} días`;
  const entrance = useSharedValue(reduceMotion ? 1 : 0);
  const textEntrance = useSharedValue(reduceMotion ? 1 : 0);

  useEffect(() => {
    if (!visible) return;
    if (reduceMotion) {
      entrance.value = 1;
      textEntrance.value = 1;
    } else {
      entrance.value = withTiming(1, { duration: 650, easing: Easing.out(Easing.cubic) });
      textEntrance.value = withDelay(190, withTiming(1, { duration: 560 }));
    }
  }, [entrance, textEntrance, reduceMotion, visible]);

  const imageEntranceStyle = useAnimatedStyle(() => ({
    // Keep the illustration visible even when a native ScrollView delays (or
    // skips) a visibility callback. Entrance motion should never gate content.
    opacity: 0.8 + entrance.value * 0.2,
    transform: [
      { translateY: (1 - entrance.value) * 16 },
      { scale: 0.94 + entrance.value * 0.06 },
    ],
  }));
  const copyEntranceStyle = useAnimatedStyle(() => ({
    opacity: 0.8 + textEntrance.value * 0.2,
    transform: [{ translateY: (1 - textEntrance.value) * 9 }],
  }));
  const nodeEntranceStyle = useAnimatedStyle(() => ({
    opacity: 0.35 + entrance.value * 0.65,
    transform: [{ scale: 0.8 + entrance.value * 0.2 }],
  }));
  const lineEntranceStyle = useAnimatedStyle(() => ({
    opacity: 0.35 + entrance.value * 0.65,
  }));
  return (
    <View
      style={styles.row}
      accessible
      accessibilityLabel={`Nivel ${number}, ${level.name}, ${dayLabel} de práctica, ${status === "current" ? "nivel actual" : "por desbloquear"}. ${level.story}`}
    >
      {hasNext && (
        <Animated.View style={[styles.lineBase, lineEntranceStyle]} pointerEvents="none" />
      )}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.node,
          {
            borderWidth: status === "current" ? 2 : 0,
            borderColor: GROWTH_COLORS.current,
            backgroundColor: status === "current" ? GROWTH_COLORS.current : GROWTH_COLORS.inactiveLine,
            shadowColor: GROWTH_COLORS.current,
            shadowOpacity: status === "current" ? 0.8 : 0,
          },
          nodeEntranceStyle,
        ]}
      />
      <Animated.View
        style={[
          styles.art,
          imageEntranceStyle,
        ]}
      >
        <GrowthLevelImage level={level} status={status} />
      </Animated.View>
      <Animated.View style={[styles.copy, status === "locked" && styles.lockedCopy, copyEntranceStyle]}>
        <Text style={[styles.eyebrow, { color: status === "locked" ? GROWTH_COLORS.muted : GROWTH_COLORS.line }]}>
          NIVEL {number}
        </Text>
        <Text style={[styles.name, { color: status === "locked" ? GROWTH_COLORS.muted : colors.foreground }]}>
          {level.name}
        </Text>
        <View style={[styles.dayPill, status === "current" && styles.currentPill]}>
          <Text style={[styles.days, { color: status === "locked" ? GROWTH_COLORS.muted : colors.foreground }]}>
            {dayLabel}
          </Text>
        </View>
        <Text style={[styles.story, { color: status === "locked" ? GROWTH_COLORS.muted : colors.mutedForeground }]}>
          {level.story}
        </Text>
      </Animated.View>
    </View>
  );
}

function GrowthStageHeading({
  eyebrow,
  title,
  eyebrowVisible,
  titleVisible,
  second,
  onLayout,
}: {
  eyebrow: string;
  title: string;
  eyebrowVisible: boolean;
  titleVisible: boolean;
  second?: boolean;
  onLayout?: (event: LayoutChangeEvent) => void;
}) {
  const colors = useColors();
  const reduceMotion = useReducedMotion();
  const eyebrowProgress = useSharedValue(reduceMotion ? 1 : 0);
  const titleProgress = useSharedValue(reduceMotion ? 1 : 0);

  useEffect(() => {
    if (eyebrowVisible) {
      eyebrowProgress.value = reduceMotion ? 1 : withTiming(1, {
        duration: 520,
        easing: Easing.out(Easing.cubic),
      });
    }
  }, [eyebrowProgress, eyebrowVisible, reduceMotion]);
  useEffect(() => {
    if (titleVisible) {
      titleProgress.value = reduceMotion ? 1 : withTiming(1, {
        duration: 520,
        easing: Easing.out(Easing.cubic),
      });
    }
  }, [titleProgress, titleVisible, reduceMotion]);

  const eyebrowEntrance = useAnimatedStyle(() => ({
    opacity: eyebrowProgress.value,
    transform: [{ translateY: (1 - eyebrowProgress.value) * 11 }],
  }));
  const titleEntrance = useAnimatedStyle(() => ({
    opacity: titleProgress.value,
    transform: [{ translateY: (1 - titleProgress.value) * 11 }],
  }));

  return (
    <View
      style={[styles.sectionHeading, second && styles.secondStageHeading]}
      onLayout={onLayout}
    >
      <Animated.Text style={[styles.sectionEyebrow, eyebrowEntrance]}>{eyebrow}</Animated.Text>
      <Animated.Text
        style={[styles.sectionTitle, { color: colors.foreground }, titleEntrance]}
        accessibilityRole="header"
      >
        {title}
      </Animated.Text>
    </View>
  );
}

function UpcomingPrompt({ visible, onPress }: { visible: boolean; onPress: () => void }) {
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(reduceMotion ? 1 : 0);

  useEffect(() => {
    if (visible) {
      progress.value = reduceMotion ? 1 : withTiming(1, {
        duration: 520,
        easing: Easing.out(Easing.cubic),
      });
    }
  }, [progress, reduceMotion, visible]);

  const entrance = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * 11 }],
  }));

  return (
    <Animated.View style={entrance}>
      <Pressable
        onPress={onPress}
        style={styles.upcomingButton}
        accessibilityRole="button"
        accessibilityLabel="Próximamente. Mostrar los niveles de El ascenso"
        accessibilityState={{ expanded: false }}
        testID="growth-ascent-reveal"
      >
        <Text style={styles.upcomingText}>Próximamente...</Text>
      </Pressable>
    </Animated.View>
  );
}

export function GrowthJourney({
  visibleStep,
  onLayout,
  onTimelineLayout,
  onSecondDividerLayout,
  onSecondHeadingLayout,
  onSecondTimelineLayout,
}: {
  visibleStep: number;
  onLayout: (event: LayoutChangeEvent) => void;
  onTimelineLayout: (event: LayoutChangeEvent) => void;
  onSecondDividerLayout: (event: LayoutChangeEvent) => void;
  onSecondHeadingLayout: (event: LayoutChangeEvent) => void;
  onSecondTimelineLayout: (event: LayoutChangeEvent) => void;
}) {
  const reduceMotion = useReducedMotion();
  const [animatedStep, setAnimatedStep] = useState(-1);
  const [ascentExpanded, setAscentExpanded] = useState(false);
  const playedStep = reduceMotion ? visibleStep : animatedStep;
  const dividerVisible = playedStep >= 2 + growthLevels.length;
  const dividerProgress = useSharedValue(reduceMotion ? 1 : 0);
  // Visual preview: Intención is the only active level until progression is enabled.

  useEffect(() => {
    if (reduceMotion || animatedStep >= visibleStep) return;
    const timer = setTimeout(
      () => setAnimatedStep((current) => Math.min(current + 1, visibleStep)),
      animatedStep < 0 ? 0 : CHAIN_STEP_MS,
    );
    return () => clearTimeout(timer);
  }, [animatedStep, reduceMotion, visibleStep]);

  useEffect(() => {
    if (dividerVisible) {
      dividerProgress.value = reduceMotion ? 1 : withTiming(1, { duration: 520 });
    }
  }, [dividerProgress, dividerVisible, reduceMotion]);

  const dividerEntrance = useAnimatedStyle(() => ({
    opacity: dividerProgress.value,
  }));

  return (
    <View style={styles.section} onLayout={onLayout}>
      <GrowthStageHeading
        eyebrow="PRIMERA ETAPA"
        title="Florecimiento"
        eyebrowVisible={playedStep >= 0}
        titleVisible={playedStep >= 1}
      />
      <View style={styles.timeline} onLayout={onTimelineLayout}>
        {growthLevels.map((level, index) => (
          <GrowthRow
            key={level.id}
            level={level}
            number={index}
            hasNext={index < growthLevels.length - 1}
            status={index === 0 ? "current" : "locked"}
            visible={playedStep >= 2 + index}
          />
        ))}
      </View>
      <View style={styles.stageDividerGap} onLayout={onSecondDividerLayout} pointerEvents="none">
        <Animated.View style={[styles.stageDivider, dividerEntrance]} />
      </View>
      <GrowthStageHeading
        eyebrow="SEGUNDA ETAPA"
        title="El ascenso"
        eyebrowVisible={playedStep >= 3 + growthLevels.length}
        titleVisible={playedStep >= 4 + growthLevels.length}
        second
        onLayout={onSecondHeadingLayout}
      />
      {ascentExpanded ? (
        <View style={styles.timeline} onLayout={onSecondTimelineLayout}>
          {ascentLevels.map((level, index) => (
            <GrowthRow
              key={level.id}
              level={level}
              number={index + 1}
              hasNext={index < ascentLevels.length - 1}
              status="locked"
              visible={playedStep >= 6 + growthLevels.length + index}
            />
          ))}
        </View>
      ) : (
        <UpcomingPrompt
          visible={playedStep >= 5 + growthLevels.length}
          onPress={() => setAscentExpanded(true)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginHorizontal: 16,
    paddingBottom: 12,
  },
  sectionHeading: { alignItems: "center", marginBottom: 8 },
  secondStageHeading: { marginBottom: 0 },
  stageDividerGap: { height: 73, justifyContent: "center", marginHorizontal: 20 },
  stageDivider: { height: 1, backgroundColor: "rgba(255,255,255,0.05)" },
  upcomingButton: { alignSelf: "center", minHeight: 48, justifyContent: "center", paddingHorizontal: 16 },
  upcomingText: {
    fontFamily: "Manrope",
    fontSize: 14,
    fontWeight: "600",
    color: GROWTH_COLORS.line,
    textDecorationLine: "underline",
  },
  sectionEyebrow: {
    fontFamily: "Manrope",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
    color: GROWTH_COLORS.line,
    marginBottom: 5,
  },
  sectionTitle: { fontFamily: "Manrope", fontSize: 23, fontWeight: "700", lineHeight: 30 },
  timeline: { position: "relative" },
  row: { height: GROWTH_ROW_HEIGHT, position: "relative", justifyContent: "center" },
  lineBase: {
    position: "absolute",
    left: 9,
    top: GROWTH_ROW_HEIGHT / 2,
    width: 2,
    height: GROWTH_ROW_HEIGHT,
    backgroundColor: GROWTH_COLORS.inactiveLine,
  },
  node: {
    position: "absolute",
    left: 1,
    top: GROWTH_ROW_HEIGHT / 2 - 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 8,
    elevation: 3,
    zIndex: 2,
  },
  art: {
    position: "absolute",
    left: 25,
    top: 34,
    width: 133,
    height: 133,
  },
  imageWrap: { flex: 1, borderRadius: 67, overflow: "hidden" },
  levelImage: { width: "100%", height: "100%" },
  lockedImage: { opacity: 0.44 },
  copy: {
    marginLeft: 166,
    flex: 1,
    justifyContent: "center",
    paddingRight: 1,
  },
  lockedCopy: { opacity: 0.55 },
  eyebrow: {
    fontFamily: "Manrope",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.55,
    marginBottom: 4,
  },
  name: { fontFamily: "Manrope", fontSize: 15, fontWeight: "700", lineHeight: 20 },
  dayPill: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(151,128,231,0.20)",
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 4,
    marginTop: 5,
    marginBottom: 7,
  },
  currentPill: { backgroundColor: "rgba(231,185,92,0.18)" },
  days: { fontFamily: "Manrope", fontSize: 10, fontWeight: "600" },
  story: { fontFamily: "Manrope", fontSize: 11, lineHeight: 16 },
});