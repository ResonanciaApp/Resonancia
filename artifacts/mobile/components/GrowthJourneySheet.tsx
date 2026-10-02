import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useEffect, useState } from "react";
import {
  Animated,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GrowthJourney } from "@/components/GrowthJourney";
import { GrowthJourneyHelpSheet } from "@/components/GrowthJourneyHelpSheet";
import { NAVIGATION_HELP_ICON_COLOR } from "@/constants/colors";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { useColors } from "@/hooks/useColors";
import { useGrowthJourneySheetMotion } from "@/hooks/useGrowthJourneySheetMotion";

// Former intro: icon (45 + 56), paragraph top (20), divider (30 + 1 + 29).
// Retain its measured height minus the requested rise, keeping the timeline in flow.
const FORMER_INTRO_FIXED_HEIGHT = 181;
const FIRST_STAGE_RISE = 184;
const FIRST_STAGE_DROP = 60;

export function GrowthJourneySheet({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { theme } = useSceneTheme();
  const sheetHeight = Math.min(
    height - 8,
    Math.max(400, height - Math.max(insets.top, Platform.OS === "web" ? 40 : 0) - 12),
  );
  const { rendered, sheetY, backdropOpacity } = useGrowthJourneySheetMotion(visible, sheetHeight);
  const [helpVisible, setHelpVisible] = useState(false);
  const [descriptionHeight, setDescriptionHeight] = useState(69);
  const closeHelp = useCallback(() => setHelpVisible(false), []);
  useEffect(() => {
    if (!visible) closeHelp();
  }, [visible, closeHelp]);

  if (!rendered) return null;

  return (
    <Modal
      visible={rendered}
      transparent
      animationType="none"
      onRequestClose={helpVisible ? closeHelp : onClose}
      statusBarTranslucent
    >
      <View style={styles.modalRoot}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityLabel="Cerrar camino de crecimiento"
        >
          <Animated.View
            style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: backdropOpacity }]}
          />
        </Pressable>
        <Animated.View
          style={[
            styles.sheet,
            {
              height: sheetHeight,
              backgroundColor: theme.gradient[0],
              paddingBottom: Math.max(insets.bottom, 16),
              transform: [{ translateY: sheetY }],
            },
          ]}
          accessibilityViewIsModal
          accessibilityElementsHidden={helpVisible}
          importantForAccessibility={helpVisible ? "no-hide-descendants" : "auto"}
        >
          <LinearGradient
            pointerEvents="none"
            colors={theme.gradient as unknown as [string, string, ...string[]]}
            locations={theme.gradientLocations as unknown as [number, number, ...number[]] | undefined}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.handle} />
          <View style={styles.header}>
            <Pressable
              onPress={onClose}
              style={styles.closeButton}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Cerrar"
              testID="growth-journey-close"
            >
              <Feather name="x" size={22} color={colors.foreground} />
            </Pressable>
            <Text style={[styles.title, { color: colors.foreground }]}>Tu camino</Text>
            <Pressable
              onPress={() => setHelpVisible(true)}
              style={styles.closeButton}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Información de Tu camino"
              testID="growth-journey-help"
            >
              <Text style={[styles.questionMark, { color: NAVIGATION_HELP_ICON_COLOR }]}>?</Text>
            </Pressable>
          </View>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingTop: FORMER_INTRO_FIXED_HEIGHT + descriptionHeight - FIRST_STAGE_RISE + FIRST_STAGE_DROP },
            ]}
            showsVerticalScrollIndicator={false}
          >
            <GrowthJourney />
          </ScrollView>
        </Animated.View>
        <GrowthJourneyHelpSheet
          visible={visible && helpVisible}
          onClose={closeHelp}
          onDescriptionLayout={setDescriptionHeight}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: { flex: 1 },
  backdrop: { backgroundColor: "#000000" },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: "hidden",
    zIndex: 2,
    elevation: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.28,
    shadowRadius: 18,
  },
  handle: {
    alignSelf: "center",
    width: 48,
    height: 5,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.28)",
    marginTop: 12,
    marginBottom: 8,
  },
  header: {
    height: 48,
    marginHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: { fontFamily: "Manrope", fontSize: 20, lineHeight: 42, fontWeight: "700" },
  questionMark: { fontFamily: "Manrope", fontSize: 24, lineHeight: 30, fontWeight: "500" },
  closeButton: {
    width: 43,
    height: 43,
    borderRadius: 21.5,
    backgroundColor: "rgba(0,0,0,0.28)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 32 },
});