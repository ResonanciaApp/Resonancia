import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useMemo } from "react";
import {
  Animated, PanResponder, Pressable, ScrollView, StyleSheet, Text,
  useWindowDimensions, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GrowthJourneyExplanationSheet } from "@/components/GrowthJourneyExplanationSheet";
import { GROWTH_MAP_HEIGHT, GrowthJourneyMap } from "@/components/GrowthJourneyMap";
import { getThemeStyleId } from "@/config/scene-themes";
import { CLOUDY_GROWTH_STAGE_LABEL_COLOR, POSITIONED_DAY_GRADIENT } from "@/constants/colors";

import { useSceneTheme } from "@/context/SceneThemeContext";
import { useColors } from "@/hooks/useColors";
import { useJourneyInfoContent } from "@/hooks/useJourneyInfoContent";
import { GROWTH_SHEET_SPRING, useGrowthJourneySheetMotion } from "@/hooks/useGrowthJourneySheetMotion";

/** An in-tree sheet: shares Tu camino's native Modal instead of nesting Modals. */
export function GrowthJourneyHelpSheet({
  visible, onClose, explanationVisible = false, onOpenExplanation, onCloseExplanation,
}: {
  visible: boolean;
  onClose: () => void;
  explanationVisible?: boolean;
  onOpenExplanation?: () => void;
  onCloseExplanation?: () => void;
}) {
  const showExplanation = visible && explanationVisible;
  const { height, width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { theme } = useSceneTheme();
  const colors = useColors();
  const explanation = useJourneyInfoContent(visible);
  const universeColor = theme.id === "natural" ? "#E5FFDB"
    : getThemeStyleId(theme.id) === "cloudy" ? CLOUDY_GROWTH_STAGE_LABEL_COLOR
    : POSITIONED_DAY_GRADIENT[0];
  // Sheet sizing kept from the previous layout so the map position is unchanged.
  const sheetHeight = Math.min(
    height - insets.top - 12,
    44 + 56 + 45 + GROWTH_MAP_HEIGHT + 28 + 10 + Math.max(insets.bottom, 16),
  );
  const { rendered, sheetY, backdropOpacity } = useGrowthJourneySheetMotion(visible, sheetHeight);
  const pan = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, gesture) =>
      visible && !showExplanation && gesture.dy > 6 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
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
  }), [visible, showExplanation, sheetHeight, sheetY, onClose]);

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
        accessibilityViewIsModal={rendered && !showExplanation}
        accessibilityElementsHidden={showExplanation}
        importantForAccessibility={showExplanation ? "no-hide-descendants" : "auto"}
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
          <Pressable
            testID="growth-help-explanation-open"
            onPress={() => { if (visible) onOpenExplanation?.(); }}
            disabled={!onOpenExplanation}
            style={styles.infoButton}
            accessibilityRole="button"
            accessibilityLabel="¿Qué es El recorrido?"
          >
            <Text testID="growth-help-explanation-open-icon" style={[styles.infoGlyph, { color: colors.foreground }]}>?</Text>
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
        </ScrollView>
      </Animated.View>
      <GrowthJourneyExplanationSheet
        visible={showExplanation}
        onClose={() => onCloseExplanation?.()}
        title={explanation.title}
        description={explanation.description}
      />
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
  infoButton: { position: "absolute", top: 6.5, right: 20, width: 43, height: 43, borderRadius: 21.5, borderWidth: 0, backgroundColor: "rgba(0,0,0,0.16)", alignItems: "center", justifyContent: "center" },
  infoGlyph: { fontFamily: "Manrope", fontSize: 20, lineHeight: 24, fontWeight: "700" },
  mapTitle: { position: "absolute", top: 16, left: 64, right: 64, textAlign: "center", fontFamily: "Manrope", fontSize: 20, lineHeight: 24, fontWeight: "700" },
  mapSubtitle: { position: "absolute", top: 45, left: 64, right: 64, textAlign: "center", fontFamily: "Manrope", fontSize: 10, lineHeight: 13, fontWeight: "700", letterSpacing: 1.2 },
  closeButton: { position: "absolute", top: 6.5, left: 20, width: 43, height: 43, borderRadius: 21.5, borderWidth: 0, backgroundColor: "rgba(0,0,0,0.16)", alignItems: "center", justifyContent: "center" },
});