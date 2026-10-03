import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { SCENE_THEMES, type ThemeSceneId, type VisualThemeId } from "@/config/scene-themes";
import { brightenThemeColor } from "@/context/BrightnessContext";

type Props = {
  activeId: ThemeSceneId;
  onSelect: (id: VisualThemeId) => void;
  accent: string;
  brightMode: boolean;
};

const SETTINGS_THEME_IDS = ["indigo2", "cloudy"] as const;

export function VisualThemeSwatches({ activeId, onSelect, accent, brightMode }: Props) {
  return (
    <View style={styles.options} accessibilityRole="radiogroup" accessibilityLabel="Tema visual">
      {SETTINGS_THEME_IDS.map((id) => {
        const theme = SCENE_THEMES[id];
        const selected = id === activeId;
        const label = id === "indigo2" ? "Índigo 2" : theme.label;
        const gradient = brightMode
          ? theme.gradient.map(brightenThemeColor) as unknown as typeof theme.gradient
          : theme.gradient;
        return (
          <Pressable
            key={id}
            testID={`visual-theme-${id}`}
            accessibilityRole="radio"
            accessibilityLabel={label}
            accessibilityState={{ checked: selected }}
            onPress={() => onSelect(id)}
            hitSlop={5}
            style={({ pressed }) => [
              styles.option,
              { borderColor: selected ? accent : "rgba(255,255,255,0.16)", opacity: pressed ? 0.75 : 1 },
            ]}
          >
            <LinearGradient
              colors={gradient}
              locations={theme.gradientLocations}
              start={theme.gradientStart}
              end={theme.gradientEnd}
              style={styles.swatch}
              pointerEvents="none"
            />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  options: { flexDirection: "row", gap: 12, alignItems: "center", flexShrink: 0 },
  option: { width: 38, height: 38, borderWidth: 1, borderRadius: 19, overflow: "hidden" },
  swatch: { ...StyleSheet.absoluteFillObject, borderRadius: 19, alignItems: "center", justifyContent: "center" },
});