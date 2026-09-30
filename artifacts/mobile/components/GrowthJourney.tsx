import { Feather } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
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

export function GrowthLevelPreviewCard({ onPress }: { onPress: () => void }) {
  const colors = useColors();
  const level = growthLevels[0];
  const dayLabel = level.startDay === level.endDay
    ? `${level.startDay} días`
    : `${level.startDay}–${level.endDay} días`;

  return (
    <Pressable
      onPress={onPress}
      style={styles.previewCard}
      accessibilityRole="button"
      accessibilityLabel={`Nivel 0, ${level.name}. Abrir camino de crecimiento`}
      testID="growth-level-zero-preview"
    >
      <View style={styles.previewArt}>
        <GrowthLevelImage level={level} status="current" />
      </View>
      <View style={styles.previewCopy}>
        <Text style={[styles.eyebrow, { color: GROWTH_COLORS.line }]}>NIVEL 0</Text>
        <Text style={[styles.name, { color: colors.foreground }]}>{level.name}</Text>
        <View style={[styles.dayPill, styles.currentPill]}>
          <Text style={[styles.days, { color: colors.foreground }]}>{dayLabel}</Text>
        </View>
        <Text style={[styles.previewStory, { color: colors.mutedForeground }]}>
          {level.story}
        </Text>
      </View>
      <Feather name="chevron-right" size={18} color={colors.foreground} />
    </Pressable>
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
    // La ilustración no depende de que termine la secuencia de entrada.
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
}: {
  eyebrow: string;
  title: string;
  eyebrowVisible: boolean;
  titleVisible: boolean;
  second?: boolean;
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
    <View style={[styles.sectionHeading, second && styles.secondStageHeading]}>
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

export function GrowthJourney({
  visibleStep,
}: {
  visibleStep: number;
}) {
  const reduceMotion = useReducedMotion();
  const [animatedStep, setAnimatedStep] = useState(-1);
  const [ascentExpanded, setAscentExpanded] = useState(false);
  const sequenceEnd = ascentExpanded ? visibleStep : 5 + growthLevels.length;
  const playedStep = reduceMotion ? sequenceEnd : animatedStep;
  // Visual preview: Intención is the only active level until progression is enabled.

  useEffect(() => {
    if (reduceMotion || animatedStep >= sequenceEnd) return;
    const timer = setTimeout(
      () => setAnimatedStep((current) => Math.min(current + 1, sequenceEnd)),
      animatedStep < 0 ? 0 : CHAIN_STEP_MS,
    );
    return () => clearTimeout(timer);
  }, [animatedStep, reduceMotion, sequenceEnd]);

  return (
    <View style={styles.section}>
      <GrowthStageHeading
        eyebrow="PRIMERA ETAPA"
        title="Florecimiento"
        eyebrowVisible={playedStep >= 0}
        titleVisible={playedStep >= 1}
      />
      <View style={styles.timeline}>
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
      <View style={styles.stageGap} pointerEvents="none" />
      <GrowthStageHeading
        eyebrow="SEGUNDA ETAPA"
        title="El ascenso"
        eyebrowVisible={playedStep >= 3 + growthLevels.length}
        titleVisible={playedStep >= 4 + growthLevels.length}
        second
      />
      <Pressable
        onPress={() => setAscentExpanded((expanded) => !expanded)}
        style={styles.ascentToggle}
        accessibilityRole="button"
        accessibilityLabel={ascentExpanded ? "Ocultar niveles de El ascenso" : "Próximamente, mostrar niveles de El ascenso"}
        accessibilityState={{ expanded: ascentExpanded }}
        testID="growth-ascent-toggle"
      >
        <Text style={styles.ascentToggleText}>{ascentExpanded ? "Ocultar niveles" : "Próximamente"}</Text>
        <Feather name={ascentExpanded ? "chevron-up" : "chevron-down"} size={16} color={GROWTH_COLORS.line} />
      </Pressable>
      {ascentExpanded && (
        <View style={styles.timeline}>
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
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  previewCard: {
    marginHorizontal: 16,
    paddingHorizontal: 14,
    paddingVertical: 16,
    minHeight: 148,
    borderRadius: 19,
    backgroundColor: "rgba(0,0,0,0.22)",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  previewArt: { width: 100, height: 100 },
  previewCopy: { flex: 1, minWidth: 0 },
  previewStory: { fontFamily: "Manrope", fontSize: 11, lineHeight: 16 },
  section: {
    marginHorizontal: 16,
    paddingBottom: 12,
  },
  sectionHeading: { alignItems: "center", marginBottom: 8 },
  secondStageHeading: { marginBottom: 0 },
  stageGap: { height: 73 },
  ascentToggle: {
    alignSelf: "center",
    marginTop: 18,
    marginBottom: 10,
    paddingHorizontal: 18,
    height: 36,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0,0,0,0.22)",
    borderWidth: 1,
    borderColor: GROWTH_COLORS.inactiveLine,
  },
  ascentToggleText: {
    fontFamily: "Manrope",
    fontSize: 12,
    fontWeight: "600",
    color: GROWTH_COLORS.line,
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