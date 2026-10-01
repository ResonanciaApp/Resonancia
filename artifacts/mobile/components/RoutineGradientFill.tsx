import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, type StyleProp, type ViewStyle } from "react-native";

const ROUTINE_GRADIENT = ["#4265B5", "#477FBD", "#4A99BC", "#50AFB0"] as const;

export function RoutineGradientFill({ style }: { style?: StyleProp<ViewStyle> }) {
  return (
    <LinearGradient
      pointerEvents="none"
      colors={ROUTINE_GRADIENT}
      start={{ x: 0, y: 0.5 }}
      end={{ x: 1, y: 0.5 }}
      style={[StyleSheet.absoluteFillObject, style]}
    />
  );
}