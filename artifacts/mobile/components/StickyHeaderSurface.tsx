import React from "react";
import { Animated, Platform, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SessionBadgeGlass } from "@/components/SessionDurationBadge";

const webBackdropBlur = Platform.OS === "web"
  ? ({
      backdropFilter: "blur(18px)",
      WebkitBackdropFilter: "blur(18px)",
    } as const)
  : undefined;

/** Non-interactive frosted surface used behind compact mobile headers. */
export function StickyHeaderSurface({
  opacity,
  tint,
  showDivider = true,
  fadeBottom = false,
}: {
  opacity: Animated.AnimatedInterpolation<number> | Animated.Value | number;
  tint: string;
  showDivider?: boolean;
  fadeBottom?: boolean;
}) {
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFill,
        styles.surface,
        fadeBottom && styles.surfaceWithFade,
        webBackdropBlur,
        { opacity },
      ]}
    >
      <SessionBadgeGlass />
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.tint, { backgroundColor: tint }]} />
      {fadeBottom && (
        <LinearGradient
          pointerEvents="none"
          colors={[tint, "transparent"]}
          locations={[0, 1]}
          style={styles.bottomFade}
        />
      )}
      {showDivider && <View pointerEvents="none" style={styles.divider} />}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  surface: { overflow: "hidden" },
  surfaceWithFade: {
    overflow: "visible",
  },
  tint: { opacity: 0.85 },
  bottomFade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: -16,
    height: 20,
    opacity: 0.85,
  },
  divider: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
});