import { Feather } from "@expo/vector-icons";
import React from "react";
import { Animated, StyleSheet } from "react-native";

export const WALL_PLUS_HALO_SIZES = [44, 34, 24] as const;
const HALO_COLORS = [
  "rgba(255, 255, 255, 0.06)",
  "rgba(255, 255, 255, 0.10)",
  "rgba(255, 255, 255, 0.15)",
] as const;

// Shared artwork for the real wall control and its locked achievement preview.
// The real control owns the animation; the disabled preview stays still.
export function ReflectionWallPlusIcon({
  size = 43,
  spin,
  haloValues,
  expanded = false,
}: {
  size?: number;
  spin?: Animated.Value;
  haloValues?: readonly Animated.Value[];
  expanded?: boolean;
}) {
  return (
    <>
      {WALL_PLUS_HALO_SIZES.map((diameter, index) => {
        const value = haloValues?.[index];
        return (
          <Animated.View
            key={diameter}
            pointerEvents="none"
            style={[
              styles.halo,
              {
                width: diameter,
                height: diameter,
                borderRadius: diameter / 2,
                top: (size - diameter) / 2,
                left: (size - diameter) / 2,
                backgroundColor: HALO_COLORS[index],
                opacity: value ?? 1,
                ...(value ? {
                  transform: [{ scale: value.interpolate(
                    index === WALL_PLUS_HALO_SIZES.length - 1 && !expanded
                      ? { inputRange: [0, 0.88, 1], outputRange: [0.1, 1.07, 1] }
                      : { inputRange: [0, 1], outputRange: [0.1, 1] },
                  ) }],
                } : {}),
              },
            ]}
          />
        );
      })}
      <Animated.View
        collapsable={false}
        style={[
          styles.plusGlyph,
          spin && { transform: [{ rotate: spin.interpolate({
            inputRange: [-300, 0, 300],
            outputRange: ["-300deg", "0deg", "300deg"],
          }) }] },
        ]}
      >
        <Feather name="plus" size={25} color="#E5F7FF" />
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  halo: { position: "absolute" },
  plusGlyph: { width: 28, height: 28, alignItems: "center", justifyContent: "center" },
});