import React from "react";
import { Animated, StyleSheet, View } from "react-native";
import { SessionBadgeGlass } from "@/components/SessionDurationBadge";

/** Non-interactive frosted surface used behind compact mobile headers. */
export function StickyHeaderSurface({
  opacity,
  tint,
}: {
  opacity: Animated.AnimatedInterpolation<number> | Animated.Value | number;
  tint: string;
}) {
  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.surface, { opacity }]}>
      <SessionBadgeGlass />
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.tint, { backgroundColor: tint }]} />
      <View pointerEvents="none" style={styles.divider} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  surface: { overflow: "hidden" },
  tint: { opacity: 0.85 },
  divider: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.10)",
  },
});