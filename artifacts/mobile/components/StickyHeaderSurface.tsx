import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Animated, Platform, StyleSheet, View } from "react-native";
import { SessionBadgeGlass } from "@/components/SessionDurationBadge";

const webBackdropBlur = Platform.OS === "web"
  ? ({
      backdropFilter: "blur(18px)",
      WebkitBackdropFilter: "blur(18px)",
    } as const)
  : undefined;

const strongWebBackdropBlur = Platform.OS === "web"
  ? ({
      backdropFilter: "blur(36px)",
      WebkitBackdropFilter: "blur(36px)",
    } as const)
  : undefined;

/** Non-interactive frosted surface used behind compact mobile headers. */
export function StickyHeaderSurface({
  opacity,
  tint,
  showTint = true,
  showDivider = true,
  blurIntensity,
  showBlackTint = true,
  strongBlur = false,
  fadeBottom = false,
}: {
  opacity: Animated.AnimatedInterpolation<number> | Animated.Value | number;
  tint: string;
  showTint?: boolean;
  showDivider?: boolean;
  blurIntensity?: number;
  showBlackTint?: boolean;
  strongBlur?: boolean;
  fadeBottom?: boolean;
}) {
  const glass = (
    <>
      <SessionBadgeGlass intensity={blurIntensity} showBlackTint={showBlackTint} />
      {showTint && (
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.tint, { backgroundColor: tint }]} />
      )}
      {showDivider && <View pointerEvents="none" style={styles.divider} />}
    </>
  );

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFill,
        styles.surface,
        strongBlur ? strongWebBackdropBlur : webBackdropBlur,
        fadeBottom && styles.fadeBottomExtension,
        { opacity },
      ]}
    >
      {fadeBottom ? (
        <MaskedView
          style={styles.maskedGlass}
          maskElement={
            <LinearGradient
              colors={["#000000", "#000000", "transparent"]}
              locations={[0, 0.78, 1]}
              style={StyleSheet.absoluteFill}
            />
          }
        >
          {glass}
        </MaskedView>
      ) : (
        glass
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  surface: { overflow: "hidden" },
  fadeBottomExtension: { bottom: -22 },
  maskedGlass: { flex: 1 },
  tint: { opacity: 0.85 },
  divider: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
});