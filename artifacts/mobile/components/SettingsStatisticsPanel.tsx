import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useEffect, useRef } from "react";
import {
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ProgressMirrorSections } from "@/components/ProgressMirrorSections";
import { DURATION, easeOutCubic } from "@/constants/motion";
import { useSceneTheme } from "@/context/SceneThemeContext";

/** Native modal host keeps this window above both settings routes and drawer overlays. */
export function SettingsStatisticsPanel({ onClose }: { onClose: () => void }) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { theme } = useSceneTheme();
  const translateX = useRef(new Animated.Value(width)).current;
  const closing = useRef(false);

  useEffect(() => () => translateX.stopAnimation(), [translateX]);

  const open = useCallback(() => {
    if (closing.current) return;
    Animated.timing(translateX, {
      toValue: 0,
      duration: DURATION.DRAWER,
      easing: easeOutCubic,
      useNativeDriver: true,
    }).start();
  }, [translateX]);

  const close = useCallback(() => {
    if (closing.current) return;
    closing.current = true;
    translateX.stopAnimation();
    Animated.timing(translateX, {
      toValue: width,
      duration: DURATION.DRAWER,
      easing: easeOutCubic,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) onClose();
    });
  }, [onClose, translateX, width]);

  return (
    <Modal
      visible
      transparent
      animationType="none"
      onShow={open}
      onRequestClose={close}
      statusBarTranslucent
    >
      <View style={styles.host}>
        <Animated.View
          testID="settings-statistics-panel"
          accessibilityViewIsModal
          style={[
            styles.panel,
            { backgroundColor: theme.solid, transform: [{ translateX }] },
          ]}
        >
          <LinearGradient
            colors={theme.gradient}
            locations={theme.gradientLocations}
            start={theme.gradientStart}
            end={theme.gradientEnd}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          <View style={[styles.header, { paddingTop: Math.max(insets.top, 40) + 8 }]}>
            <Pressable
              onPress={close}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Volver a Configuración y ajustes"
              style={styles.backButton}
            >
              <Feather name="chevron-left" size={28} color="#F9F9F9" />
            </Pressable>
            <Text accessibilityRole="header" style={styles.title}>Mis estadísticas</Text>
            <View style={styles.headerSpacer} />
          </View>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
          >
            <ProgressMirrorSections
              showPersonalStats
              showPersonalStatsTitle={false}
              showStreakSection={false}
              showCalendar={false}
              showSectionBorders={false}
              personalStatsFilterBelowTitle
              sectionBackgroundColor="rgba(0,0,0,0.16)"
              sectionHorizontalPadding={20}
              sectionVerticalPadding={16}
              sectionMarginBottom={0}
            />
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  host: { flex: 1 },
  panel: { ...StyleSheet.absoluteFillObject },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backButton: {
    width: 43,
    height: 43,
    borderRadius: 21.5,
    backgroundColor: "rgba(0,0,0,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerSpacer: { width: 43 },
  title: { fontFamily: "Manrope", fontSize: 18, fontWeight: "600", color: "#F9F9F9" },
  content: { paddingTop: 8, paddingHorizontal: 20 },
});