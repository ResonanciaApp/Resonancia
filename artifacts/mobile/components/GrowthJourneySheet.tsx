import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GrowthJourney } from "@/components/GrowthJourney";
import { GrowthJourneyHelpSheet } from "@/components/GrowthJourneyHelpSheet";
import { NAVIGATION_HELP_ICON_COLOR } from "@/constants/colors";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { useColors } from "@/hooks/useColors";

// Former intro: icon (45 + 56), paragraph top (20), divider (30 + 1 + 29).
// Retain its measured height minus the requested rise, keeping the timeline in flow.
const FORMER_INTRO_FIXED_HEIGHT = 181;
const FIRST_STAGE_RISE = 184;
const FIRST_STAGE_DROP = 24;

export function GrowthJourneySheet({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { theme } = useSceneTheme();
  const scrollRef = useRef<ScrollView>(null);
  const [helpVisible, setHelpVisible] = useState(false);
  const [descriptionHeight, setDescriptionHeight] = useState(69);
  const closeHelp = useCallback(() => setHelpVisible(false), []);
  useEffect(() => {
    if (!visible) closeHelp();
    else scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [visible, closeHelp]);

  if (!visible) return null;

  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, 40);
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <Modal
      visible
      transparent={false}
      animationType="slide"
      onRequestClose={helpVisible ? closeHelp : onClose}
      statusBarTranslucent
      navigationBarTranslucent
      testID="growth-journey-modal"
    >
      <LinearGradient
        colors={theme.gradient as unknown as [string, string, ...string[]]}
        locations={theme.gradientLocations as unknown as [number, number, ...number[]] | undefined}
        start={theme.gradientStart}
        end={theme.gradientEnd}
        style={styles.modalRoot}
        testID="growth-journey-background"
      >
        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={{ paddingBottom: bottomPad + 32 }}
          showsVerticalScrollIndicator={false}
          bounces
          alwaysBounceVertical
          overScrollMode="always"
          contentInsetAdjustmentBehavior="never"
          automaticallyAdjustContentInsets={false}
          accessibilityViewIsModal
          accessibilityElementsHidden={helpVisible}
          importantForAccessibility={helpVisible ? "no-hide-descendants" : "auto"}
          testID="growth-journey-scroll"
        >
          <View style={[styles.header, { marginTop: topPad + 8 }]}>
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
          <View style={{ paddingTop: FORMER_INTRO_FIXED_HEIGHT + descriptionHeight - FIRST_STAGE_RISE + FIRST_STAGE_DROP }}>
            <GrowthJourney />
          </View>
        </ScrollView>
        <GrowthJourneyHelpSheet
          visible={visible && helpVisible}
          onClose={closeHelp}
          onDescriptionLayout={setDescriptionHeight}
        />
      </LinearGradient>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: { flex: 1 },
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
});