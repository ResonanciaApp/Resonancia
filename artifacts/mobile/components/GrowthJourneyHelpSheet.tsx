import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useMemo } from "react";
import {
  Animated, PanResponder, Pressable, ScrollView, StyleSheet, Text,
  useWindowDimensions, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GROWTH_MAP_HEIGHT, GrowthJourneyMap } from "@/components/GrowthJourneyMap";
import { getThemeStyleId } from "@/config/scene-themes";
import { CLOUDY_GROWTH_STAGE_LABEL_COLOR, POSITIONED_DAY_GRADIENT } from "@/constants/colors";

import { useSceneTheme } from "@/context/SceneThemeContext";
import { useColors } from "@/hooks/useColors";
import { useJourneyInfoContent } from "@/hooks/useJourneyInfoContent";
import { GROWTH_SHEET_SPRING, useGrowthJourneySheetMotion } from "@/hooks/useGrowthJourneySheetMotion";

/** An in-tree sheet: shares Tu camino's native Modal instead of nesting Modals. */
export function GrowthJourneyHelpSheet({
  visible, onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { height, width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { theme } = useSceneTheme();
  const colors = useColors();
  const explanation = useJourneyInfoContent(visible);
  const universeColor = theme.id === "natural" ? "#E5FFDB"
    : getThemeStyleId(theme.id) === "cloudy" ? CLOUDY_GROWTH_STAGE_LABEL_COLOR
    : POSITIONED_DAY_GRADIENT[0];
  // End the initial scroll viewport 10px into the explanation background.
  const sheetHeight = Math.min(
    height - insets.top - 12,
    44 + 56 + 45 + GROWTH_MAP_HEIGHT + 28 + 10 + Math.max(insets.bottom, 16),
  );
  const { rendered, sheetY, backdropOpacity } = useGrowthJourneySheetMotion(visible, sheetHeight);
  const pan = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, gesture) =>
      visible && gesture.dy > 6 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
    onPanResponderGrant: () => sheetY.stopAnimation(),
    onPanResponderMove: (_, gesture) => sheetY.setValue(Math.max(0, gesture.dy)),
    onPanResponderRelease: (_, gesture) => {
      if (gesture.dy > Math.min(80, sheetHeight * 0.2) || (gesture.dy > 8 && gesture.vy > 0.5)) {
        onClose();
      } else {
        Animated.spring(sheetY, { toValue: 0, ...GROWTH_SHEET_SPRING }).start();
      }
    },
    onPanResponderTerminate: () => {
      if (visible) Animated.spring(sheetY, { toValue: 0, ...GROWTH_SHEET_SPRING }).start();
    },
  }), [visible, sheetHeight, sheetY, onClose]);

  return (
    <View
      style={[StyleSheet.absoluteFill, styles.overlay, { opacity: rendered ? 1 : 0 }]}
      pointerEvents={rendered ? "auto" : "none"}
      accessibilityElementsHidden={!rendered}
      importantForAccessibility={rendered ? "auto" : "no-hide-descendants"}
    >
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Cerrar información de Tu camino"
        testID="growth-help-backdrop"
      >
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: backdropOpacity }]}
        />
      </Pressable>
      <Animated.View
        style={[
          styles.sheet,
          {
            height: sheetHeight,
            paddingBottom: Math.max(insets.bottom, 16),
            backgroundColor: theme.gradient[0],
            transform: [{ translateY: sheetY }],
          },
        ]}
        accessibilityViewIsModal={rendered}
        testID="growth-help-sheet"
      >
        <LinearGradient
          pointerEvents="none"
          colors={theme.gradient as unknown as [string, string, ...string[]]}
          locations={theme.gradientLocations as unknown as [number, number, ...number[]] | undefined}
          style={StyleSheet.absoluteFill}
        />
        <View {...pan.panHandlers}>
          <Pressable
            onPress={onClose}
            style={styles.handleTouchArea}
            accessibilityRole="button"
            accessibilityLabel="Cerrar información; también puedes arrastrar hacia abajo"
            testID="growth-help-handle"
          >
            <View style={styles.handle} />
          </Pressable>
        </View>
        <View testID="growth-map-header" style={styles.mapHeader}>
          <Text testID="growth-map-title" style={[styles.mapTitle, { color: colors.foreground }]}>
            El recorrido
          </Text>
          <Text testID="growth-map-subtitle" style={[styles.mapSubtitle, { color: universeColor }]}>
            PRIMER UNIVERSO
          </Text>
          <Pressable
            testID="growth-help-close"
            onPress={onClose}
            style={styles.closeButton}
            accessibilityRole="button"
            accessibilityLabel="Cerrar El recorrido"
          >
            <Feather testID="growth-help-close-icon" name="x" size={22} color={colors.foreground} />
          </Pressable>
        </View>
        <ScrollView
          testID="growth-map-scroll"
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View testID="growth-map-section" style={styles.mapSection}>
            <GrowthJourneyMap width={Math.min(width, 520) - 12} />
          </View>
          <View testID="growth-map-explanation" style={[styles.explanation, {
            backgroundColor: getThemeStyleId(theme.id) === "cloudy"
              ? "rgba(0,0,0,0.19)" : "rgba(0,0,0,0.16)",
          }]}>
            <Text testID="growth-map-explanation-title" accessibilityRole="header" style={[styles.explanationTitle, { color: colors.foreground }]}>
              {explanation.title}
            </Text>
            {explanation.description.split(/\n\s*\n/).map((paragraph, index) => (
              <Text key={index} testID={`growth-map-explanation-paragraph-${index}`} style={[styles.explanationText, { color: colors.foreground }]}>
                {paragraph}
              </Text>
            ))}
          </View>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { zIndex: 3, elevation: 13 },
  backdrop: { backgroundColor: "#000000" },
  sheet: {
    position: "absolute", left: 0, right: 0, bottom: 0,
    borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: "hidden",
    elevation: 12, shadowColor: "#000", shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.28, shadowRadius: 18,
  },
  handleTouchArea: { height: 44, alignItems: "center", justifyContent: "center" },
  handle: {
    width: 48, height: 5, borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.28)",
  },
  scroll: { flex: 1 },
  content: { flexGrow: 1, justifyContent: "flex-start", alignItems: "center", paddingBottom: 16 },
  mapHeader: { height: 56 },
  mapSection: { paddingTop: 45 },
  explanation: { alignSelf: "stretch", marginHorizontal: 16, paddingHorizontal: 24, marginTop: 28, paddingTop: 31, paddingBottom: 16, borderRadius: 20, gap: 12 },
  explanationTitle: { fontFamily: "Manrope", fontSize: 18, lineHeight: 24, fontWeight: "700", textAlign: "center", marginBottom: 15 },
  explanationText: { fontFamily: "Manrope", fontSize: 14, lineHeight: 21, textAlign: "left", opacity: 0.85 },
  mapTitle: { position: "absolute", top: 16, left: 64, right: 64, textAlign: "center", fontFamily: "Manrope", fontSize: 20, lineHeight: 24, fontWeight: "700" },
  mapSubtitle: { position: "absolute", top: 45, left: 64, right: 64, textAlign: "center", fontFamily: "Manrope", fontSize: 10, lineHeight: 13, fontWeight: "700", letterSpacing: 1.2 },
  closeButton: { position: "absolute", top: 6.5, left: 20, width: 43, height: 43, borderRadius: 21.5, borderWidth: 0, backgroundColor: "rgba(0,0,0,0.16)", alignItems: "center", justifyContent: "center" },
});