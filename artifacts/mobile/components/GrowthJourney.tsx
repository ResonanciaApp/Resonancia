import { Image } from "expo-image";
import React, { useEffect } from "react";
import { StyleSheet, Text, View, type LayoutChangeEvent } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { MEMBERSHIP_AURORA, POSITIONED_DAY_GRADIENT } from "@/constants/colors";
import { growthLevels, growthLevelIndex, type GrowthLevel } from "@/data/growthLevels";
import { useColors } from "@/hooks/useColors";

export const GROWTH_ROW_HEIGHT = 205;

const GROWTH_COLORS = {
  line: POSITIONED_DAY_GRADIENT[0],
  current: MEMBERSHIP_AURORA.premium.accent,
  muted: "rgba(196,194,222,0.8)",
  inactiveLine: "rgba(174,161,237,0.28)",
  card: "rgba(0,0,0,0.20)",
} as const;

type Status = "unlocked" | "current" | "locked";

function GrowthLevelImage({
  level,
  status,
}: {
  level: GrowthLevel;
  status: Status;
}) {
  // All eight local PNGs have a baked-in radial alpha fade. The translucent
  // pixels reveal the actual screen background rather than a tinted rectangle.
  return (
    <View style={[styles.imageWrap, status === "locked" && styles.lockedImage]} importantForAccessibility="no">
      <Image
        source={level.image}
        contentFit="contain"
        style={styles.levelImage}
        accessibilityElementsHidden
        importantForAccessibility="no"
      />
    </View>
  );
}

function GrowthRow({
  level,
  index,
  status,
  visible,
  unlock,
}: {
  level: GrowthLevel;
  index: number;
  status: Status;
  visible: boolean;
  unlock: boolean;
}) {
  const colors = useColors();
  const reduceMotion = useReducedMotion();
  const entrance = useSharedValue(reduceMotion ? 1 : 0);
  const textEntrance = useSharedValue(reduceMotion ? 1 : 0);
  const lineLight = useSharedValue(status === "unlocked" ? 1 : 0);
  const pulse = useSharedValue(0);

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

  useEffect(() => {
    lineLight.value = reduceMotion
      ? (status === "unlocked" ? 1 : 0)
      : withTiming(status === "unlocked" ? 1 : 0, { duration: 750 });
  }, [lineLight, reduceMotion, status]);

  useEffect(() => {
    if (!unlock || !visible || reduceMotion) return;
    pulse.value = withDelay(
      120,
      withSequence(
        withTiming(1, { duration: 340, easing: Easing.out(Easing.cubic) }),
        withTiming(0, { duration: 400, easing: Easing.inOut(Easing.quad) }),
      ),
    );
  }, [pulse, reduceMotion, unlock, visible]);

  const imageEntranceStyle = useAnimatedStyle(() => ({
    opacity: entrance.value,
    transform: [
      { translateY: (1 - entrance.value) * 16 },
      { scale: 0.94 + entrance.value * 0.06 + pulse.value * 0.035 },
    ],
  }));
  const copyEntranceStyle = useAnimatedStyle(() => ({
    opacity: textEntrance.value,
    transform: [{ translateY: (1 - textEntrance.value) * 9 }],
  }));
  const litLineStyle = useAnimatedStyle(() => ({ opacity: lineLight.value }));
  const nodeStyle = useAnimatedStyle(() => ({
    opacity: entrance.value,
    transform: [{ scale: 1 + pulse.value * 0.22 }],
  }));

  return (
    <View
      style={styles.row}
      accessible
      accessibilityLabel={`Nivel ${index + 1}, ${level.name}, ${level.startDay} a ${level.endDay} días de práctica, ${status === "current" ? "nivel actual" : status === "unlocked" ? "desbloqueado" : "por desbloquear"}. ${level.story}`}
    >
      {index < growthLevels.length - 1 && (
        <>
          <View style={styles.lineBase} pointerEvents="none" />
          <Animated.View
            style={[styles.lineLit, { backgroundColor: GROWTH_COLORS.line }, litLineStyle]}
            pointerEvents="none"
          />
        </>
      )}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.node,
          {
            borderColor: status === "locked" ? GROWTH_COLORS.inactiveLine
              : status === "current" ? GROWTH_COLORS.current : GROWTH_COLORS.line,
            backgroundColor: status === "current" ? GROWTH_COLORS.current : GROWTH_COLORS.card,
            shadowColor: status === "current" ? GROWTH_COLORS.current : GROWTH_COLORS.line,
            shadowOpacity: status === "locked" ? 0 : status === "current" ? 0.8 : 0.3,
          },
          nodeStyle,
        ]}
      />
      <Animated.View
        style={[
          styles.art,
          index % 2 === 0 ? styles.artOdd : styles.artEven,
          imageEntranceStyle,
        ]}
      >
        <GrowthLevelImage level={level} status={status} />
      </Animated.View>
      <Animated.View style={[styles.copy, copyEntranceStyle]}>
        <Text style={[styles.eyebrow, { color: status === "locked" ? GROWTH_COLORS.muted : GROWTH_COLORS.line }]}>
          NIVEL {index + 1}
        </Text>
        <Text style={[styles.name, { color: status === "locked" ? GROWTH_COLORS.muted : colors.foreground }]}>
          {level.name}
        </Text>
        <View style={[styles.dayPill, status === "current" && styles.currentPill]}>
          <Text style={[styles.days, { color: status === "locked" ? GROWTH_COLORS.muted : colors.foreground }]}>
            {level.startDay}–{level.endDay} días
          </Text>
        </View>
        <Text style={[styles.story, { color: status === "locked" ? GROWTH_COLORS.muted : colors.mutedForeground }]}>
          {level.story}
        </Text>
      </Animated.View>
    </View>
  );
}

export function GrowthJourney({
  totalActiveDays,
  visibleThrough,
  unlockedIndex,
  onLayout,
  onTimelineLayout,
}: {
  totalActiveDays: number;
  visibleThrough: number;
  unlockedIndex: number;
  onLayout: (event: LayoutChangeEvent) => void;
  onTimelineLayout: (event: LayoutChangeEvent) => void;
}) {
  const colors = useColors();
  const reduceMotion = useReducedMotion();
  const current = growthLevelIndex(totalActiveDays);

  return (
    <View style={styles.section} onLayout={onLayout}>
      <Text style={[styles.title, { color: colors.foreground }]}>Tu camino de crecimiento</Text>
      <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
        Cada 7 días de práctica alcanzas un nuevo nivel y tu semilla se transforma.
      </Text>
      <View style={styles.timeline} onLayout={onTimelineLayout}>
        {growthLevels.map((level, index) => (
          <GrowthRow
            key={level.id}
            level={level}
            index={index}
            status={index < current ? "unlocked" : index === current ? "current" : "locked"}
            visible={reduceMotion || index <= visibleThrough}
            unlock={index === unlockedIndex}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginHorizontal: 16,
    marginTop: 4,
    backgroundColor: GROWTH_COLORS.card,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.055)",
    borderRadius: 22,
    paddingHorizontal: 13,
    paddingTop: 22,
    paddingBottom: 12,
    overflow: "hidden",
  },
  title: {
    fontFamily: "Manrope",
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
    paddingHorizontal: 8,
  },
  subtitle: {
    fontFamily: "Manrope",
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    marginTop: 7,
    marginBottom: 24,
    paddingHorizontal: 13,
  },
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
  lineLit: {
    position: "absolute",
    left: 9,
    top: GROWTH_ROW_HEIGHT / 2,
    width: 2,
    height: GROWTH_ROW_HEIGHT,
  },
  node: {
    position: "absolute",
    left: 1,
    top: GROWTH_ROW_HEIGHT / 2 - 8,
    width: 18,
    height: 18,
    borderWidth: 2,
    borderRadius: 9,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 8,
    elevation: 3,
    zIndex: 2,
  },
  art: {
    position: "absolute",
    left: 17,
    top: 24,
    width: 153,
    height: 153,
  },
  artOdd: { left: 14 },
  artEven: { left: 21 },
  imageWrap: { flex: 1 },
  levelImage: { width: "100%", height: "100%" },
  lockedImage: { opacity: 0.44 },
  copy: {
    marginLeft: 151,
    flex: 1,
    justifyContent: "center",
    paddingRight: 1,
  },
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