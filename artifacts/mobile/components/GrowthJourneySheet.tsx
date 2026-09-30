import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
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
import { useSceneTheme } from "@/context/SceneThemeContext";
import { ascentLevels, growthLevels } from "@/data/growthLevels";
import { useColors } from "@/hooks/useColors";

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
  const travel = height + 80;
  const [rendered, setRendered] = useState(visible);
  const sheetY = useRef(new Animated.Value(travel)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    sheetY.stopAnimation();
    backdropOpacity.stopAnimation();
    if (visible) {
      setRendered(true);
      sheetY.setValue(travel);
      backdropOpacity.setValue(0);
      const frame = requestAnimationFrame(() => {
        Animated.parallel([
          Animated.spring(sheetY, {
            toValue: 0,
            tension: 55,
            friction: 8,
            useNativeDriver: true,
          }),
          Animated.timing(backdropOpacity, {
            toValue: 0.62,
            duration: 500,
            useNativeDriver: true,
          }),
        ]).start();
      });
      return () => {
        cancelAnimationFrame(frame);
        sheetY.stopAnimation();
        backdropOpacity.stopAnimation();
      };
    }

    const exit = Animated.parallel([
      Animated.timing(sheetY, {
        toValue: travel,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 460,
        useNativeDriver: true,
      }),
    ]);
    exit.start(({ finished }) => {
      if (finished) setRendered(false);
    });
    return () => exit.stop();
  }, [visible, travel, sheetY, backdropOpacity]);

  if (!rendered) return null;

  return (
    <Modal
      visible={rendered}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.modalRoot}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityLabel="Cerrar camino de crecimiento"
        >
          <Animated.View
            style={[StyleSheet.absoluteFill, { backgroundColor: "#000000", opacity: backdropOpacity }]}
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
        >
          <LinearGradient
            pointerEvents="none"
            colors={theme.gradient as unknown as [string, string, ...string[]]}
            locations={theme.gradientLocations as unknown as [number, number, ...number[]] | undefined}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.handle} />
          <View style={styles.header}>
            <View style={styles.headerSpacer} />
            <Text style={[styles.title, { color: colors.foreground }]}>Tu camino</Text>
            <Pressable
              onPress={onClose}
              style={styles.closeButton}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Cerrar"
            >
              <Feather name="x" size={24} color={colors.foreground} />
            </Pressable>
          </View>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <GrowthJourney visibleStep={5 + growthLevels.length + ascentLevels.length} />
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: { flex: 1 },
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
  headerSpacer: { width: 38 },
  title: { fontFamily: "Manrope", fontSize: 18, fontWeight: "600" },
  closeButton: { width: 38, height: 38, alignItems: "center", justifyContent: "center" },
  scroll: { flex: 1 },
  scrollContent: { paddingTop: 37, paddingBottom: 32 },
});