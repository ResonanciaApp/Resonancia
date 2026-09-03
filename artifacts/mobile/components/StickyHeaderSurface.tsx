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
  bottomFadeHeight = 0,
}: {
  opacity: Animated.AnimatedInterpolation<number> | Animated.Value | number;
  tint: string;
  showDivider?: boolean;
  bottomFadeHeight?: number;
}) {
  return (
    <Animated.View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, styles.surface, webBackdropBlur, { opacity }]}
    >
      <View style={[StyleSheet.absoluteFill, bottomFadeHeight > 0 && { bottom: bottomFadeHeight }]}>
        <SessionBadgeGlass />
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.tint, { backgroundColor: tint }]} />
      </View>
      {bottomFadeHeight > 0 && (
        <LinearGradient
          pointerEvents="none"
          colors={[tint, "transparent"]}
          style={[styles.bottomFade, { height: bottomFadeHeight, opacity: 0.85 }]}
        />
      )}
      {showDivider && <View pointerEvents="none" style={styles.divider} />}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  surface: { overflow: "hidden" },
  tint: { opacity: 0.85 },
  bottomFade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
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