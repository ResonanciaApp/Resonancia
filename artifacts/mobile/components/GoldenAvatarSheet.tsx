import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getThemeStyleId, SCENE_THEMES } from "@/config/scene-themes";
import { useSceneTheme } from "@/context/SceneThemeContext";
import type { useGrowthJourneySheetMotion } from "@/hooks/useGrowthJourneySheetMotion";

/** Shares the avatar picker's native Modal, so dismissing it preserves the grid. */
export function GoldenAvatarSheet({ motion, onClose }: {
  motion: ReturnType<typeof useGrowthJourneySheetMotion>;
  onClose: () => void;
}) {
  const { theme } = useSceneTheme();
  const insets = useSafeAreaInsets();
  if (!motion.rendered) return null;
  const cloudy = getThemeStyleId(theme.id) === "cloudy";
  // Same gradient and backdrop motion as Dormir → Vuelve a ti.
  const gradient = getThemeStyleId(theme.id) === "indigo2"
    ? [SCENE_THEMES.tibet.gradient[1], SCENE_THEMES.tibet.gradient[2]] as const
    : cloudy
      ? [theme.gradient[0], theme.gradient[1], theme.gradient[2], theme.gradient[3]] as const
      : [theme.gradient[1], theme.gradient[2]] as const;
  const buttonBackground = cloudy || theme.id === "natural" ? "rgba(0,0,0,0.19)" : "rgba(0,0,0,0.16)";
  return (
    <View style={styles.root} testID="golden-avatar-overlay" accessibilityViewIsModal>
      <Animated.View pointerEvents="none" style={[styles.backdrop, { opacity: motion.backdropOpacity }]} />
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityRole="button" accessibilityLabel="Cerrar Avatar dorado" testID="golden-avatar-backdrop-close" />
      <Animated.View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 18) + 18, transform: [{ translateY: motion.sheetY }] }]}>
        <LinearGradient
          colors={gradient}
          locations={cloudy ? [0, 1 / 3, 2 / 3, 1] : undefined}
          start={cloudy ? theme.gradientStart : undefined}
          end={cloudy ? theme.gradientEnd : undefined}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <View style={styles.handle} />
        <View style={styles.heading}>
          <Text style={styles.title} accessibilityRole="header">Avatar dorado</Text>
          <Pressable onPress={onClose} style={[styles.close, { backgroundColor: buttonBackground }]} accessibilityRole="button" accessibilityLabel="Cerrar Avatar dorado" testID="golden-avatar-close" hitSlop={8}>
            <Feather name="x" size={22} color="#F9F9F9" />
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { ...StyleSheet.absoluteFillObject, justifyContent: "flex-end" },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "#000000" },
  sheet: { minHeight: 240, maxHeight: "92%", overflow: "hidden", borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingHorizontal: 24, paddingTop: 12 },
  handle: { alignSelf: "center", width: 56, height: 5, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.48)", marginBottom: 16 },
  heading: { minHeight: 43, justifyContent: "center" },
  title: { fontFamily: "Manrope", fontSize: 24, fontWeight: "700", color: "#F9F9F9", paddingRight: 55 },
  close: { position: "absolute", right: 0, width: 43, height: 43, borderRadius: 21.5, alignItems: "center", justifyContent: "center" },
});
