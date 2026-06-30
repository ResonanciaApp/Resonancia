import { Feather } from "@expo/vector-icons";
import React from "react";
import { View, StyleSheet } from "react-native";
import { PressableScale } from "@/components/PressableScale";

interface BackPillProps {
  onPress: () => void;
  style?: object;
  color?: string;
  size?: number;
  hitSlop?: number;
  bgColor?: string;
}

export function BackPill({ onPress, style, color = "#fff", size = 22, hitSlop = 10, bgColor }: BackPillProps) {
  return (
    <PressableScale onPress={onPress} containerStyle={style} hitSlop={hitSlop}>
      <View style={[styles.base, bgColor ? { backgroundColor: bgColor, borderRadius: 19 } : undefined]}>
        <Feather name="arrow-left" size={size} color={color} />
      </View>
    </PressableScale>
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
