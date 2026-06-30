import { Feather } from "@expo/vector-icons";
import React, { useRef } from "react";
import { Animated, Easing, Pressable, StyleSheet } from "react-native";

interface BackPillProps {
  onPress: () => void;
  style?: object;
  color?: string;
  size?: number;
  hitSlop?: number;
}

export function BackPill({ onPress, style, color = "#fff", size = 22, hitSlop = 10 }: BackPillProps) {
  const scale = useRef(new Animated.Value(1)).current;

  function handlePressIn() {
    Animated.timing(scale, {
      toValue: 0.97,
      duration: 120,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }

  function handlePressOut() {
    Animated.timing(scale, {
      toValue: 1,
      duration: 180,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
    onPress();
  }

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        hitSlop={hitSlop}
        style={[styles.base, style]}
      >
        <Feather name="arrow-left" size={size} color={color} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },
});
