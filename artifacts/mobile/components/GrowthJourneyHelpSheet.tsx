import { LinearGradient } from "expo-linear-gradient";
import React, { useMemo } from "react";
import {
  Animated, PanResponder, Pressable, ScrollView, StyleSheet,
  useWindowDimensions, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GROWTH_MAP_HEIGHT, GrowthJourneyMap } from "@/components/GrowthJourneyMap";

import { useSceneTheme } from "@/context/SceneThemeContext";
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
  // Raised from height / 2 so the 330pt map plus handle fits legibly.
  const sheetHeight = Math.min(height * 0.8, GROWTH_MAP_HEIGHT + 44 + 32 + Math.max(insets.bottom, 16));
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

  // Keep the hidden sheet laid out so its paragraph also measures the former
  // intro at the same width/font scale, preserving the requested stage shift.
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
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <GrowthJourneyMap width={Math.min(width, 520) - 32} />
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
  content: { flexGrow: 1, justifyContent: "center", alignItems: "center", paddingVertical: 16 },
});