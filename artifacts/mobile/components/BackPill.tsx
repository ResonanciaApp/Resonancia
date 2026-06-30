import { Feather } from "@expo/vector-icons";
import React, { useRef } from "react";
import { Animated, Pressable, StyleSheet } from "react-native";
import { DURATION, motionTiming } from "@/constants/motion";

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
      ...motionTiming(DURATION.BUTTON_PRESS),
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  }

  function handlePressOut() {
    Animated.timing(scale, {
      ...motionTiming(DURATION.BUTTON_RELEASE),
      toValue: 1,
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
