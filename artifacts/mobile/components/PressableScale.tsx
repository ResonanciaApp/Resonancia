/**
 * PressableScale — botón con feedback de escala estándar del sistema de movimiento.
 *
 * Press-in : 100% → 97% en 120ms (easeOutCubic, sin rebote)
 * Press-out: 97%  → 100% en 180ms (easeOutCubic, sin rebote)
 *
 * Reemplaza Pressable + Animated.timing manual en componentes que necesitan
 * feedback táctil de escala consistente.
 *
 * @example
 *   <PressableScale onPress={handlePress} style={styles.card}>
 *     <Text>Tap me</Text>
 *   </PressableScale>
 */
import React, { useRef } from "react";
import {
  Animated,
  Pressable,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { DURATION, easeOutCubic } from "@/constants/motion";

interface PressableScaleProps extends PressableProps {
  children: React.ReactNode;
  /** Escala al presionar. Default: 0.97 */
  pressedScale?: number;
  /** Style aplicado al Animated.View contenedor */
  containerStyle?: StyleProp<ViewStyle>;
}

export function PressableScale({
  children,
  pressedScale = 0.97,
  containerStyle,
  style,
  onPressIn,
  onPressOut,
  ...rest
}: PressableScaleProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = (e: Parameters<NonNullable<PressableProps["onPressIn"]>>[0]) => {
    Animated.timing(scale, {
      toValue: pressedScale,
      duration: DURATION.BUTTON_PRESS,
      easing: easeOutCubic,
      useNativeDriver: true,
    }).start();
    onPressIn?.(e);
  };

  const handlePressOut = (e: Parameters<NonNullable<PressableProps["onPressOut"]>>[0]) => {
    Animated.timing(scale, {
      toValue: 1,
      duration: DURATION.BUTTON_RELEASE,
      easing: easeOutCubic,
      useNativeDriver: true,
    }).start();
    onPressOut?.(e);
  };

  return (
    <Animated.View style={[{ transform: [{ scale }] }, containerStyle]}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={style}
        {...rest}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}
