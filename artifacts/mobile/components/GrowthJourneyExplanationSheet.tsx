import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getThemeStyleId, SCENE_THEMES, type SceneTheme } from "@/config/scene-themes";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { useColors } from "@/hooks/useColors";
import {
  JOURNEY_EXPLANATION_SHEET_HEIGHT, useJourneyExplanationSheetMotion,
} from "@/hooks/useJourneyExplanationSheetMotion";

type Theme = Pick<SceneTheme, "id" | "gradient" | "gradientStart" | "gradientEnd">;

/** Same per-theme colors as AmbientalDurationSheet. */
export function getExplanationSheetColors(theme: Theme) {
  const style = getThemeStyleId(theme.id);
  const cloudy = style === "cloudy";
  const gradient: [string, string, ...string[]] = cloudy
    ? [theme.gradient[0], theme.gradient[1], theme.gradient[2], theme.gradient[3]]
    : style === "indigo2"
      ? [SCENE_THEMES.tibet.gradient[1], SCENE_THEMES.tibet.gradient[2]]
      : [theme.gradient[1], theme.gradient[2]];
  return {
    gradient,
    locations: cloudy ? [0, 1 / 3, 2 / 3, 1] as [number, number, ...number[]] : undefined,
    start: cloudy ? theme.gradientStart : undefined,
    end: cloudy ? theme.gradientEnd : undefined,
  };
}

/** In-tree sheet rendered inside El recorrido — shares Tu camino's native Modal host. */
export function GrowthJourneyExplanationSheet({
  visible, onClose, title, description,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  description: string;
}) {
  const insets = useSafeAreaInsets();
  const { theme } = useSceneTheme();
  const colors = useColors();
  const { rendered, sheetY, backdropOpacity } = useJourneyExplanationSheetMotion(visible);
  const sheetColors = getExplanationSheetColors(theme);

  return (
    <View
      testID="growth-explanation-overlay"
      style={[StyleSheet.absoluteFill, styles.overlay, { opacity: rendered ? 1 : 0 }]}
      pointerEvents={rendered ? "auto" : "none"}
      accessibilityElementsHidden={!rendered}
      importantForAccessibility={rendered ? "auto" : "no-hide-descendants"}
    >
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Cerrar explicación de El recorrido"
        testID="growth-explanation-backdrop"
      >
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: backdropOpacity }]} />
      </Pressable>
      <Animated.View
        testID="growth-explanation-sheet"
        accessibilityViewIsModal={rendered}
        style={[styles.sheet, {
          height: JOURNEY_EXPLANATION_SHEET_HEIGHT,
          paddingBottom: Math.max(insets.bottom, 16),
          backgroundColor: sheetColors.gradient[0],
          transform: [{ translateY: sheetY }],
        }]}
      >
        <LinearGradient
          testID="growth-explanation-gradient"
          pointerEvents="none"
          colors={sheetColors.gradient}
          locations={sheetColors.locations}
          start={sheetColors.start}
          end={sheetColors.end}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.handle} />
        <View style={styles.header}>
          <Pressable
            testID="growth-explanation-close"
            onPress={onClose}
            style={styles.closeButton}
            accessibilityRole="button"
            accessibilityLabel="Cerrar explicación"
          >
            <Feather name="x" size={20} color={colors.foreground} />
          </Pressable>
          <Text testID="growth-map-explanation-title" accessibilityRole="header" style={[styles.title, { color: colors.foreground }]} numberOfLines={2}>
            {title}
          </Text>
        </View>
        <ScrollView
          testID="growth-explanation-scroll"
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator
        >
          {description.split(/\n\s*\n/).map((paragraph, index) => (
            <Text key={index} testID={`growth-map-explanation-paragraph-${index}`} style={[styles.text, { color: colors.foreground }]}>
              {paragraph}
            </Text>
          ))}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { zIndex: 5, elevation: 20 },
  backdrop: { backgroundColor: "#000000" },
  sheet: {
    position: "absolute", left: 0, right: 0, bottom: 0,
    borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: "hidden",
    elevation: 12, shadowColor: "#000", shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.28, shadowRadius: 18,
  },
  handle: {
    alignSelf: "center", width: 48, height: 5, borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.24)", marginTop: 13,
  },
  header: { height: 56, justifyContent: "center" },
  title: { marginHorizontal: 64, textAlign: "center", fontFamily: "Manrope", fontSize: 18, lineHeight: 24, fontWeight: "700" },
  closeButton: {
    position: "absolute", left: 20, top: 6.5, width: 43, height: 43, borderRadius: 21.5,
    backgroundColor: "rgba(0,0,0,0.16)", alignItems: "center", justifyContent: "center",
  },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 28, paddingTop: 6, paddingBottom: 12, gap: 12 },
  text: { fontFamily: "Manrope", fontSize: 14, lineHeight: 21, textAlign: "left", opacity: 0.85 },
});
