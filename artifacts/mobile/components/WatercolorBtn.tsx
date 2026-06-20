/**
 * WatercolorBtn — ícono de personalización de perfil (dorado).
 * Visible para todos: opaco para premium, atenuado para users gratuitos.
 */
import { Image } from "expo-image";
import React from "react";
import { Pressable, StyleSheet } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

const GOLD = "#D4AF37";
const ICON = require("@/assets/images/personalize-icon.png") as number;

interface Props {
  isPremium: boolean;
  onPress: () => void;
  size?: number;
}

export function WatercolorBtn({ isPremium, onPress, size = 26 }: Props) {
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
      <Image source={ICON} style={{ width: size, height: size, tintColor: "rgba(255,255,255,0.9)" }} resizeMode="contain" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  glow: {
    position: "absolute",
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "transparent",
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 14,
    elevation: 0,
  },
});
