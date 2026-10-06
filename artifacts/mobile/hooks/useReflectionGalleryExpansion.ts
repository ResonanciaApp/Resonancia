import { useCallback, useEffect, useRef, useState } from "react";
import { AccessibilityInfo } from "react-native";
import { cancelAnimation, Easing, ReduceMotion, useSharedValue, withTiming } from "react-native-reanimated";
import { SHEET_EXPAND_MS } from "@/lib/ambiental-duration-transition";
import { REFLECTION_GALLERY_EXPANSION } from "@/lib/reflection-gallery-layout";

export function useReflectionGalleryExpansion() {
  const [expanded, setExpanded] = useState(false);
  const targetExpanded = useRef(false);
  const reducedMotion = useRef(false);
  const heightReduction = useSharedValue(0);

  const toggle = useCallback(() => {
    const next = !targetExpanded.current;
    targetExpanded.current = next;
    setExpanded(next);
    // Reanimated starts replacements at the current value, including mid-flight reversals.
    heightReduction.value = withTiming(next ? REFLECTION_GALLERY_EXPANSION : 0, {
      duration: SHEET_EXPAND_MS,
      easing: Easing.inOut(Easing.quad),
      reduceMotion: reducedMotion.current ? ReduceMotion.Always : ReduceMotion.System,
    });
  }, [heightReduction]);

  useEffect(() => {
    let mounted = true;
    let preferenceVersion = 0;
    const apply = (enabled: boolean) => {
      reducedMotion.current = enabled;
      if (enabled) {
        cancelAnimation(heightReduction);
        heightReduction.value = targetExpanded.current ? REFLECTION_GALLERY_EXPANSION : 0;
      }
    };
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", enabled => {
      preferenceVersion++;
      apply(enabled);
    });
    AccessibilityInfo.isReduceMotionEnabled().then(enabled => {
      if (mounted && preferenceVersion === 0) apply(enabled);
    }).catch(error => console.warn("[reflection-gallery] Reduce motion lookup failed", error));
    return () => {
      mounted = false;
      subscription.remove();
      cancelAnimation(heightReduction);
    };
  }, [heightReduction]);

  return { expanded, toggle, heightReduction };
}
