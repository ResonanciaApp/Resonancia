import { getThemeStyleId } from "@/config/scene-themes";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, type StyleProp, type ViewStyle } from "react-native";
import { useSceneTheme } from "@/context/SceneThemeContext";

const ROUTINE_GRADIENT = ["#477FBD", "#4A99BC"] as const;
const CLOUDY_ROUTINE_GRADIENT = ["#8247BD", "#6C4ABC"] as const;
const NATURAL_ROUTINE_GRADIENT = ["#61C278", "#52A365"] as const;
const FUEGO_ROUTINE_GRADIENT = ["#D58667", "#DA9983"] as const;

export function RoutineGradientFill({ style }: { style?: StyleProp<ViewStyle> }) {
  const { theme } = useSceneTheme();
  return (
    <LinearGradient
      pointerEvents="none"
      colors={theme.id === "fuego" ? FUEGO_ROUTINE_GRADIENT : theme.id === "natural" ? NATURAL_ROUTINE_GRADIENT : getThemeStyleId(theme.id) === "cloudy" ? CLOUDY_ROUTINE_GRADIENT : ROUTINE_GRADIENT}
      start={{ x: 0, y: 0.5 }}
      end={{ x: 1, y: 0.5 }}
      style={[StyleSheet.absoluteFillObject, style]}
    />
  );
}