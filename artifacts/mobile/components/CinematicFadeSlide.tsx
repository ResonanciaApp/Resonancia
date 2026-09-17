import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useReducedMotion } from "react-native-reanimated";

type Props = {
  active?: boolean;
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  replayKey: string | number;
  style?: StyleProp<ViewStyle>;
  translateYFrom?: number;
};

/**
 * Entrada contemplativa basada en InvitarSheet:
 * opacity 0→1 + translateY positivo→0, sin rebote.
 */
export function CinematicFadeSlide({
  active = true,
  children,
  delay = 0,
  duration = 3000,
  replayKey,
  style,
  translateYFrom = 35,
}: Props) {
  const reduceMotion = useReducedMotion();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(translateYFrom)).current;
  const [isAvailable, setIsAvailable] = useState(Boolean(reduceMotion));

  useEffect(() => {
    opacity.stopAnimation();
    translateY.stopAnimation();

    if (reduceMotion) {
      opacity.setValue(1);
      translateY.setValue(0);
      setIsAvailable(true);
      return;
    }

    if (!active) {
      opacity.setValue(0);
      translateY.setValue(translateYFrom);
      setIsAvailable(false);
      return;
    }

    opacity.setValue(0);
    translateY.setValue(translateYFrom);
    setIsAvailable(delay === 0);
    const availabilityTimer = setTimeout(() => setIsAvailable(true), delay);

    const animation = Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        delay,
        duration,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        delay,
        duration,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);

    animation.start();
    return () => {
      clearTimeout(availabilityTimer);
      animation.stop();
    };
  }, [
    active,
    delay,
    duration,
    opacity,
    reduceMotion,
    replayKey,
    translateY,
    translateYFrom,
  ]);

  return (
    <Animated.View
      accessibilityElementsHidden={!isAvailable}
      importantForAccessibility={isAvailable ? "auto" : "no-hide-descendants"}
      pointerEvents={isAvailable ? "auto" : "none"}
      style={[style, { opacity, transform: [{ translateY }] }]}
    >
      {children}
    </Animated.View>
  );
}