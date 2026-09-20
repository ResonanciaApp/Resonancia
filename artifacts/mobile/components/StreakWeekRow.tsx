import MaskedView from "@react-native-masked-view/masked-view";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useMemo } from "react";
import { StyleSheet, Text, View, type LayoutChangeEvent } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Reanimated, {
  cancelAnimation,
  runOnJS,
  type SharedValue,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { CinematicFadeSlide } from "@/components/CinematicFadeSlide";
import { useStreak } from "@/hooks/useStreak";

const DAY_INITIALS = ["L", "M", "X", "J", "V", "S", "D"];
const POSITIONED_DAY_GRADIENT = ["#D1B9F5", "#9B80C4", "#8168A5"] as const;

export function StreakWeekRow({
  animateEntrance = false,
  entranceReplayKey = "streak-week",
  entranceBaseDelay = 0,
  interactive = false,
}: {
  animateEntrance?: boolean;
  entranceReplayKey?: string | number;
  entranceBaseDelay?: number;
  interactive?: boolean;
} = {}) {
  const { weekFlags, todayIndex } = useStreak();

  if (interactive) {
    return <InteractiveWeekRow weekFlags={weekFlags} todayIndex={todayIndex} />;
  }

  return (
    <View style={styles.row}>
      {DAY_INITIALS.map((initial, index) => {
        const active = weekFlags[index];
        const isToday = todayIndex === index;
        const content = (
          <View key={`${initial}-${index}`} style={styles.dayWrapper}>
            <DayCircle active={active} isToday={isToday} />
            <Text style={styles.dayLabel}>{initial}</Text>
          </View>
        );

        if (!animateEntrance) return content;

        return (
          <CinematicFadeSlide
            key={`${initial}-${index}`}
            replayKey={`${entranceReplayKey}:${index}`}
            delay={entranceBaseDelay + index * 140}
            duration={1200}
            scaleFrom={0.9}
            translateYFrom={14}
          >
            {content}
          </CinematicFadeSlide>
        );
      })}
    </View>
  );
}

function DayCircle({ active, isToday }: { active: boolean; isToday: boolean }) {
  const circle = (
    <View style={styles.day}>
      {active ? (
        <Feather
          name="check"
          size={24}
          color="#FFFFFF"
          style={styles.checkMark}
        />
      ) : null}
    </View>
  );

  if (!isToday) return circle;

  return (
    <View style={styles.ringHost}>
      {circle}
      <MaskedView
        pointerEvents="none"
        style={StyleSheet.absoluteFill}
        maskElement={<View style={styles.ringMask} />}
      >
        <LinearGradient
          colors={POSITIONED_DAY_GRADIENT}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </MaskedView>
    </View>
  );
}

function InteractiveWeekRow({
  weekFlags,
  todayIndex,
}: {
  weekFlags: boolean[];
  todayIndex: number;
}) {
  const reducedMotion = useReducedMotion();
  const rowWidth = useSharedValue(1);
  const tapIndex = useSharedValue(-1);
  const tapPulse = useSharedValue(0);
  const holdIndex = useSharedValue(-1);
  const holdPulse = useSharedValue(0);
  const waveProgress = useSharedValue(-1);
  const waveEligible = useSharedValue(false);

  const fireHaptic = useCallback((kind: "tap" | "hold" | "wave") => {
    const style = kind === "hold"
      ? Haptics.ImpactFeedbackStyle.Medium
      : Haptics.ImpactFeedbackStyle.Light;
    void Haptics.impactAsync(style).catch(() => {});
  }, []);

  const pulseDay = useCallback((index: number) => {
    tapIndex.value = index;
    tapPulse.value = 0;
    tapPulse.value = withSequence(
      withTiming(-1, { duration: 75 }),
      withTiming(1, { duration: 145 }),
      withTiming(0, { duration: reducedMotion ? 180 : 520 }),
    );
    fireHaptic("tap");
  }, [fireHaptic, reducedMotion, tapIndex, tapPulse]);

  const gesture = useMemo(() => {
    const indexAtX = (x: number) => {
      "worklet";
      const width = Math.max(rowWidth.value, 1);
      return Math.max(0, Math.min(6, Math.floor((x / width) * 7)));
    };

    const tap = Gesture.Tap()
      .maxDistance(10)
      .onEnd((event, success) => {
        if (!success) return;
        tapIndex.value = indexAtX(event.x);
        tapPulse.value = 0;
        tapPulse.value = withSequence(
          withTiming(-1, { duration: 75 }),
          withTiming(1, { duration: 145 }),
          withTiming(0, { duration: reducedMotion ? 180 : 520 }),
        );
        runOnJS(fireHaptic)("tap");
      });

    const longPress = Gesture.LongPress()
      .enabled(!reducedMotion)
      .minDuration(460)
      .maxDistance(12)
      .onStart((event) => {
        holdIndex.value = indexAtX(event.x);
        holdPulse.value = 0.68;
        holdPulse.value = withRepeat(
          withSequence(
            withTiming(1, { duration: 620 }),
            withTiming(0.68, { duration: 760 }),
          ),
          -1,
          false,
        );
        runOnJS(fireHaptic)("hold");
      })
      .onFinalize(() => {
        cancelAnimation(holdPulse);
        holdPulse.value = withTiming(0, { duration: 260 });
        holdIndex.value = -1;
      });

    const wave = Gesture.Pan()
      .enabled(!reducedMotion)
      .activeOffsetX(12)
      .failOffsetY([-11, 11])
      .onBegin((event) => {
        waveEligible.value = event.x <= rowWidth.value / 7;
        waveProgress.value = -1;
      })
      .onUpdate((event) => {
        if (!waveEligible.value || event.translationX < 10) return;
        const width = Math.max(rowWidth.value, 1);
        waveProgress.value = Math.max(0, Math.min(6, (event.x / width) * 7 - 0.5));
      })
      .onEnd(() => {
        if (!waveEligible.value || waveProgress.value < 0) {
          waveProgress.value = -1;
          return;
        }
        const remaining = Math.max(0, 6 - waveProgress.value);
        waveProgress.value = withSequence(
          withTiming(6, { duration: 90 + remaining * 65 }),
          withDelay(220, withTiming(-1, { duration: 420 })),
        );
        runOnJS(fireHaptic)("wave");
      });

    return Gesture.Race(wave, longPress, tap);
  }, [
    fireHaptic,
    holdIndex,
    holdPulse,
    reducedMotion,
    rowWidth,
    tapIndex,
    tapPulse,
    waveEligible,
    waveProgress,
  ]);

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    rowWidth.value = Math.max(1, event.nativeEvent.layout.width);
  }, [rowWidth]);

  return (
    <GestureDetector gesture={gesture}>
      <View
        style={styles.row}
        onLayout={handleLayout}
        accessibilityLabel="Racha de esta semana. Desliza desde el lunes para animar los días."
      >
        {DAY_INITIALS.map((initial, index) => (
          <InteractiveDay
            key={`${initial}-${index}`}
            index={index}
            initial={initial}
            active={weekFlags[index]}
            isToday={todayIndex === index}
            tapIndex={tapIndex}
            tapPulse={tapPulse}
            holdIndex={holdIndex}
            holdPulse={holdPulse}
            waveProgress={waveProgress}
            reducedMotion={Boolean(reducedMotion)}
            onAccessibilityActivate={pulseDay}
          />
        ))}
      </View>
    </GestureDetector>
  );
}

function InteractiveDay({
  index,
  initial,
  active,
  isToday,
  tapIndex,
  tapPulse,
  holdIndex,
  holdPulse,
  waveProgress,
  reducedMotion,
  onAccessibilityActivate,
}: {
  index: number;
  initial: string;
  active: boolean;
  isToday: boolean;
  tapIndex: SharedValue<number>;
  tapPulse: SharedValue<number>;
  holdIndex: SharedValue<number>;
  holdPulse: SharedValue<number>;
  waveProgress: SharedValue<number>;
  reducedMotion: boolean;
  onAccessibilityActivate: (index: number) => void;
}) {
  const interaction = useAnimatedStyle(() => {
    const tap = tapIndex.value === index ? tapPulse.value : 0;
    const tapEnergy = Math.abs(tap);
    const holdDistance = Math.abs(holdIndex.value - index);
    const hold = holdIndex.value < 0
      ? 0
      : holdDistance === 0
        ? holdPulse.value
        : holdDistance === 1
          ? holdPulse.value * 0.28
          : 0;
    const waveDistance = waveProgress.value < 0 ? 99 : waveProgress.value - index;
    const wave = waveDistance < -1
      ? 0
      : waveDistance < 0
        ? 1 + waveDistance
        : Math.max(0, 1 - waveDistance * 0.18);
    const energy = Math.max(tapEnergy, hold, wave);
    const scale = tap < 0
      ? 1 + 0.055 * tap
      : 1 + 0.07 * Math.max(tap, hold, wave);

    return {
      transform: [
        { translateY: reducedMotion ? 0 : -3.5 * energy },
        { scale: reducedMotion ? 1 : scale },
      ],
    };
  });

  const glow = useAnimatedStyle(() => {
    const tap = tapIndex.value === index ? Math.abs(tapPulse.value) : 0;
    const holdDistance = Math.abs(holdIndex.value - index);
    const hold = holdIndex.value < 0
      ? 0
      : holdDistance === 0
        ? holdPulse.value
        : holdDistance === 1
          ? holdPulse.value * 0.3
          : 0;
    const waveDistance = waveProgress.value < 0 ? 99 : waveProgress.value - index;
    const wave = waveDistance < -1
      ? 0
      : waveDistance < 0
        ? 1 + waveDistance
        : Math.max(0, 1 - waveDistance * 0.2);
    const energy = Math.max(tap, hold, wave);

    return {
      opacity: 0.72 * energy,
      transform: [{ scale: 0.9 + 0.32 * energy }],
    };
  });

  return (
    <View
      style={styles.dayWrapper}
      accessible
      accessibilityRole="button"
      accessibilityLabel={`${initial}: ${active ? "día completado" : isToday ? "hoy" : "sin completar"}`}
      accessibilityHint="Toca dos veces para activar un pulso visual"
      accessibilityActions={[{ name: "activate", label: "Activar pulso" }]}
      onAccessibilityAction={(event) => {
        if (event.nativeEvent.actionName === "activate") onAccessibilityActivate(index);
      }}
    >
      <Reanimated.View style={[styles.dayMotion, interaction]}>
        <Reanimated.View pointerEvents="none" style={[styles.dayGlow, glow]} />
        <DayCircle active={active} isToday={isToday} />
      </Reanimated.View>
      <Text style={styles.dayLabel}>{initial}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dayWrapper: {
    alignItems: "center",
    gap: 5,
  },
  dayMotion: {
    width: 38,
    height: 38,
  },
  dayGlow: {
    position: "absolute",
    top: -5,
    right: -5,
    bottom: -5,
    left: -5,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(209,185,245,0.9)",
    backgroundColor: "rgba(190,150,80,0.16)",
  },
  day: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  ringHost: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  ringMask: {
    flex: 1,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: "#000000",
    backgroundColor: "transparent",
  },
  dayLabel: {
    color: "#FFFFFF",
    fontFamily: "Manrope",
    fontSize: 10,
    lineHeight: 13,
    fontWeight: "500",
    transform: [{ translateY: -1 }],
  },
  checkMark: {
    transform: [{ translateY: 1 }],
  },
});