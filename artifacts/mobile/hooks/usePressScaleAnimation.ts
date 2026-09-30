import { useCallback, useEffect, useRef } from "react";
import { Animated } from "react-native";

/** Shared press feedback for recommendations and the Profile Intención pill. */
export function usePressScaleAnimation() {
  const scale = useRef(new Animated.Value(1)).current;
  const animatePress = useCallback((pressed: boolean) => {
    scale.stopAnimation();
    if (pressed) {
      Animated.timing(scale, {
        toValue: 0.97,
        duration: 90,
        useNativeDriver: true,
      }).start();
      return;
    }
    Animated.spring(scale, {
      toValue: 1,
      tension: 180,
      friction: 14,
      useNativeDriver: true,
    }).start();
  }, [scale]);

  useEffect(() => () => scale.stopAnimation(), [scale]);
  return { scale, animatePress };
}