import { getThemeStyleId } from "@/config/scene-themes";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, type StyleProp, type ViewStyle } from "react-native";
import { useSceneTheme } from "@/context/SceneThemeContext";

export function LibraryCreationBackground({ style }: { style?: StyleProp<ViewStyle> }) {
  const { theme } = useSceneTheme();
  if (getThemeStyleId(theme.id) !== "cloudy") return null;
  return (
    <LinearGradient
      colors={theme.gradient.slice(0, 4) as [string, string, string, string]}
      locations={[0, 1 / 3, 2 / 3, 1]}
      start={theme.gradientStart}
      end={theme.gradientEnd}
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, style]}
    />
  );
}
