import { useEffect, useMemo, useRef, useState } from "react";
import { AccessibilityInfo, Animated, Easing } from "react-native";
import { createDurationTransition, type DurationPhase } from "@/lib/ambiental-duration-transition";

export function useAmbientalDurationTransition() {
  const [phase, setPhase] = useState<DurationPhase>("presets");
  const reducedMotion = useRef(false);
  const baselineHeight = useRef(0);
  const startButtonLayout = useRef<{ y: number; height: number } | null>(null);
  const titleLayout = useRef<{ y: number; height: number } | null>(null);
  const [values] = useState(() => ({
    scales: Array.from({ length: 4 }, () => new Animated.Value(1)),
    circleOpacities: Array.from({ length: 4 }, () => new Animated.Value(1)),
    sheetHeight: new Animated.Value(320),
    startShift: new Animated.Value(0),
    manualOpacity: new Animated.Value(0),
  }));
  const transition = useMemo(() => createDurationTransition({
    values,
    timing: (value, config) => Animated.timing(value, config),
    onPhase: setPhase,
    shrinkEasing: Easing.in(Easing.cubic),
    expandEasing: Easing.inOut(Easing.quad),
  }), [values]);

  useEffect(() => {
    let mounted = true;
    let preferenceVersion = 0;
    const apply = (enabled: boolean) => {
      reducedMotion.current = enabled;
      if (enabled) transition.finishImmediately();
    };
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", enabled => {
      preferenceVersion++;
      apply(enabled);
    });
    AccessibilityInfo.isReduceMotionEnabled().then(enabled => {
      if (mounted && preferenceVersion === 0) apply(enabled);
    }).catch(error => console.warn("[ambiental-duration] Reduce motion lookup failed", error));
    return () => {
      mounted = false;
      subscription.remove();
      transition.cancel();
    };
  }, [transition]);

  return { phase, values, transition, baselineHeight, startButtonLayout, titleLayout, reducedMotion };
}