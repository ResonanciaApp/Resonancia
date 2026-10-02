import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SCENE_THEMES, VISUAL_THEME_IDS, type ThemeSceneId, type VisualThemeId } from "@/config/scene-themes";
import { brightenThemeColor } from "@/context/BrightnessContext";

type Props = {
  activeId: ThemeSceneId;
  onSelect: (id: VisualThemeId) => void;
  foreground: string;
  accent: string;
  brightMode: boolean;
};

export function VisualThemeSwatches({ activeId, onSelect, foreground, accent, brightMode }: Props) {
  return (
    <View style={styles.options} accessibilityRole="radiogroup" accessibilityLabel="Tema visual">
      {VISUAL_THEME_IDS.map((id) => {
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
            >
              {selected ? (
                <View style={styles.check}>
                  <Feather name="check" size={15} color="#F9F9F9" />
                </View>
              ) : null}
            </LinearGradient>
            <Text style={[styles.label, { color: selected ? accent : foreground }]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  options: { flexDirection: "row", gap: 10, paddingHorizontal: 16, paddingBottom: 16 },
  option: { flex: 1, minHeight: 80, padding: 7, borderWidth: 1, borderRadius: 12, alignItems: "center", gap: 7 },
  swatch: { width: "100%", height: 43, borderRadius: 7, overflow: "hidden", alignItems: "flex-end", justifyContent: "flex-end", padding: 4 },
  check: { width: 21, height: 21, borderRadius: 11, backgroundColor: "rgba(0,0,0,0.45)", alignItems: "center", justifyContent: "center" },
  label: { fontFamily: "Manrope", fontSize: 12, fontWeight: "600", textAlign: "center" },
});