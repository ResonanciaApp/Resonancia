import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getThemeStyleId, SCENE_THEMES } from "@/config/scene-themes";
import { useSceneTheme } from "@/context/SceneThemeContext";
import type { useGrowthJourneySheetMotion } from "@/hooks/useGrowthJourneySheetMotion";

const HERO = 115.5;
// Static confetti pieces: [left%, top, size, rotate, color, round]
const CONFETTI: [number, number, number, number, string, boolean][] = [
  [8, 14, 10, 20, "#F5C84B", false], [20, 52, 6, 0, "#F9F9F9", true], [30, 6, 8, 45, "#E8A93A", false],
  [70, 8, 8, -30, "#F9F9F9", false], [82, 46, 10, 0, "#F5C84B", true], [92, 18, 6, 60, "#E8A93A", false],
  [14, 118, 7, -20, "#F5C84B", true], [86, 112, 8, 35, "#F9F9F9", false], [38, 150, 6, 0, "#E8A93A", true],
  [62, 148, 7, 50, "#F5C84B", false],
];

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
      <Animated.View style={[styles.sheet, { transform: [{ translateY: motion.sheetY }] }]}>
        <LinearGradient
          colors={gradient}
          locations={cloudy ? [0, 1 / 3, 2 / 3, 1] : undefined}
          start={cloudy ? theme.gradientStart : undefined}
          end={cloudy ? theme.gradientEnd : undefined}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <View style={styles.handle} />
        <View style={styles.header} testID="golden-avatar-header">
          <Text style={styles.title} accessibilityRole="header" testID="golden-avatar-title">Avatar dorado</Text>
          <Pressable onPress={onClose} style={[styles.close, { backgroundColor: buttonBackground }]} accessibilityRole="button" accessibilityLabel="Cerrar Avatar dorado" testID="golden-avatar-close" hitSlop={8}>
            <Feather name="x" size={22} color="#F9F9F9" />
          </Pressable>
        </View>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.body, { paddingBottom: Math.max(insets.bottom, 18) + 18 }]}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={styles.heroSlot}>
            <View pointerEvents="none" style={StyleSheet.absoluteFill} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" testID="golden-avatar-decorations">
              {CONFETTI.map(([l, t, s, r, c, round], i) => (
                <View key={i} style={{ position: "absolute", left: `${l}%`, top: t, width: s, height: round ? s : s * 1.8, borderRadius: round ? s / 2 : 2, backgroundColor: c, opacity: 0.85, transform: [{ rotate: `${r}deg` }] }} />
              ))}
              <View style={styles.halo} />
            </View>
            <View style={styles.hero} testID="golden-avatar-hero-circle">
              <Text style={styles.question} testID="golden-avatar-question" accessibilityLabel="Avatar misterioso">?</Text>
            </View>
          </View>
          <Text style={styles.description} testID="golden-avatar-description">
            Entre todos los avatares que puedes desbloquear hay un único avatar dorado: el avatar premiado.
          </Text>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { ...StyleSheet.absoluteFillObject, justifyContent: "flex-end" },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "#000000" },
  sheet: { position: "absolute", left: 0, right: 0, bottom: 0, height: "85%", overflow: "hidden", borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingHorizontal: 20 },
  handle: { alignSelf: "center", width: 36, height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.18)", marginTop: 10, marginBottom: 4 },
  header: { paddingTop: 20, minHeight: 63, flexDirection: "row", alignItems: "center", justifyContent: "center" },
  title: { flex: 1, fontFamily: "Manrope", fontSize: 16, fontWeight: "700", color: "#F9F9F9", textAlign: "center" },
  close: { position: "absolute", top: 20, left: 0, width: 43, height: 43, borderRadius: 21.5, alignItems: "center", justifyContent: "center" },
  scroll: { flex: 1 },
  body: { alignItems: "center", paddingTop: 10 },
  heroSlot: { width: "100%", height: 170, alignItems: "center", justifyContent: "center" },
  halo: { position: "absolute", alignSelf: "center", top: 27, width: 116, height: 116, borderRadius: 58, borderWidth: 14, borderColor: "rgba(245,200,75,0.18)" },
  hero: { width: HERO, height: HERO, borderRadius: HERO / 2, backgroundColor: "#000000", alignItems: "center", justifyContent: "center" },
  question: { fontFamily: "Manrope", fontSize: 56, fontWeight: "700", color: "#F9F9F9", includeFontPadding: false },
  description: { fontFamily: "Manrope", fontSize: 15, lineHeight: 22, fontWeight: "500", color: "#F9F9F9", textAlign: "center", marginTop: 20, paddingHorizontal: 12 },
});
