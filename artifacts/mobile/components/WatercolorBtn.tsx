/**
 * WatercolorBtn — ícono de acuarela (pluma dorada) para personalizar el perfil.
 * Visible para todos: opaco para premium, atenuado para users gratuitos.
 */
import { Feather } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

const GOLD = "#D4AF37";

interface Props {
  isPremium: boolean;
  onPress: () => void;
  size?: number;
}

export function WatercolorBtn({ isPremium, onPress, size = 18 }: Props) {
  const glow = useSharedValue(0);

  const glowStyle = useAnimatedStyle(() => ({ opacity: glow.value }));

  function handlePress() {
    if (!isPremium) return;
    glow.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.quad) });
    setTimeout(() => {
      glow.value = withTiming(0, { duration: 600, easing: Easing.in(Easing.quad) });
    }, 400);
    onPress();
  }

  return (
    <Pressable
      onPress={handlePress}
      hitSlop={10}
      style={[styles.btn, { opacity: isPremium ? 1 : 0.32 }]}
    >
      <Animated.View pointerEvents="none" style={[styles.glow, glowStyle]} />
      <Feather name="feather" size={size} color={GOLD} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  glow: {
    position: "absolute",
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "transparent",
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 0,
  },
});
