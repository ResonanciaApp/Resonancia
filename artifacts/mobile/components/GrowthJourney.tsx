import React, { useEffect } from "react";
import { Image, StyleSheet, Text, View, type LayoutChangeEvent } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";

import { MEMBERSHIP_AURORA, POSITIONED_DAY_GRADIENT } from "@/constants/colors";
import { growthLevels, type GrowthLevel } from "@/data/growthLevels";
import { useColors } from "@/hooks/useColors";

export const GROWTH_ROW_HEIGHT = 205;

const GROWTH_COLORS = {
  line: POSITIONED_DAY_GRADIENT[0],
  current: MEMBERSHIP_AURORA.premium.accent,
  muted: "rgba(196,194,222,0.8)",
  inactiveLine: "rgba(174,161,237,0.28)",
  nodeFill: "rgba(0,0,0,0.20)",
} as const;

type Status = "current" | "locked";

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
        resizeMode="contain"
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
  index,
  status,
  visible,
}: {
  level: GrowthLevel;
  index: number;
  status: Status;
  visible: boolean;
}) {
  const colors = useColors();
  const reduceMotion = useReducedMotion();
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
  return (
    <View
      style={styles.row}
      accessible
      accessibilityLabel={`Nivel ${index + 1}, ${level.name}, ${level.startDay} a ${level.endDay} días de práctica, ${status === "current" ? "nivel actual" : "por desbloquear"}. ${level.story}`}
    >
      {index < growthLevels.length - 1 && (
        <View style={styles.lineBase} pointerEvents="none" />
      )}
      <View
        pointerEvents="none"
        style={[
          styles.node,
          {
            borderColor: status === "current" ? GROWTH_COLORS.current : GROWTH_COLORS.inactiveLine,
            backgroundColor: status === "current" ? GROWTH_COLORS.current : GROWTH_COLORS.nodeFill,
            shadowColor: GROWTH_COLORS.current,
            shadowOpacity: status === "current" ? 0.8 : 0,
          },
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
      <Animated.View style={[styles.copy, status === "locked" && styles.lockedCopy, copyEntranceStyle]}>
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
  visibleThrough,
  onLayout,
  onTimelineLayout,
}: {
  visibleThrough: number;
  onLayout: (event: LayoutChangeEvent) => void;
  onTimelineLayout: (event: LayoutChangeEvent) => void;
}) {
  const colors = useColors();
  const reduceMotion = useReducedMotion();
  // Visual preview: Semilla is the only active stage until progression is enabled.

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
            status={index === 0 ? "current" : "locked"}
            visible={reduceMotion || index <= visibleThrough}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginHorizontal: 16,
    marginTop: 18,
    paddingBottom: 12,
  },
  title: {
    fontFamily: "Manrope",
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
  },
  subtitle: {
    fontFamily: "Manrope",
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    marginTop: 7,
    marginBottom: 24,
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
    left: 7,
    top: 24,
    width: 153,
    height: 153,
  },
  artOdd: { left: 4 },
  artEven: { left: 11 },
  imageWrap: { flex: 1 },
  levelImage: { width: "100%", height: "100%" },
  lockedImage: { opacity: 0.44 },
  copy: {
    marginLeft: 151,
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