import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import React, { useCallback, useRef, useState } from "react";
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { getTabBarGlassOverlay, TAB_PILL_BLUR_INTENSITY, TAB_PILL_BLUR_TINT } from "@/constants/tab-bar";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { CONFIRMATION_ENTRY_DELAY_MS } from "@/constants/confirmation-banner";

const ENTRY_DISTANCE = 86;
const ENTRY_DURATION = 380;
const HOLD_DURATION = 1800;
const EXIT_DURATION = 320;

export function ReflectionSavedBanner({
  trigger,
  bottom,
  onPress,
}: {
  trigger: number;
  bottom: number;
  onPress: () => void;
}) {
  const { activeSceneId } = useSceneTheme();
  const glassOverlay = getTabBarGlassOverlay(activeSceneId);
  const [visible, setVisible] = useState(false);
  const shownTriggerRef = useRef(0);
  const translateY = useRef(new Animated.Value(ENTRY_DISTANCE)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const entryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useFocusEffect(useCallback(() => {
    if (trigger <= 0 || shownTriggerRef.current === trigger) return;
    if (entryTimerRef.current) clearTimeout(entryTimerRef.current);
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    translateY.stopAnimation();
    opacity.stopAnimation();
    translateY.setValue(ENTRY_DISTANCE);
    opacity.setValue(0);
    setVisible(false);

    const entryAnimation = Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: ENTRY_DURATION,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: ENTRY_DURATION,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);
    entryTimerRef.current = setTimeout(() => {
      entryTimerRef.current = null;
      shownTriggerRef.current = trigger;
      setVisible(true);
      if (Platform.OS !== "web") {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch((error) => {
          console.warn("No se pudo activar la vibración del aviso del muro", error);
        });
      }
      entryAnimation.start(({ finished }) => {
        if (!finished) return;
        holdTimerRef.current = setTimeout(() => {
          holdTimerRef.current = null;
          Animated.parallel([
            Animated.timing(translateY, {
              toValue: ENTRY_DISTANCE,
              duration: EXIT_DURATION,
              easing: Easing.in(Easing.cubic),
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0,
              duration: EXIT_DURATION,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
          ]).start(({ finished: exited }) => {
            if (exited) setVisible(false);
          });
        }, HOLD_DURATION);
      });
    }, CONFIRMATION_ENTRY_DELAY_MS);

    return () => {
      setVisible(false);
      if (entryTimerRef.current) {
        clearTimeout(entryTimerRef.current);
        entryTimerRef.current = null;
      }
      if (holdTimerRef.current) {
        clearTimeout(holdTimerRef.current);
        holdTimerRef.current = null;
      }
      translateY.stopAnimation();
      opacity.stopAnimation();
    };
  }, [opacity, translateY, trigger]));

  if (!visible) return null;

  const handlePress = () => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    translateY.stopAnimation();
    opacity.stopAnimation();
    setVisible(false);
    onPress();
  };

  return (
    <Animated.View style={[styles.banner, { bottom, opacity, transform: [{ translateY }] }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Ver mensaje registrado en muro"
        onPress={handlePress}
        style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}
      >
        <View pointerEvents="none" style={styles.glassSurface}>
          <BlurView
            pointerEvents="none"
            tint={TAB_PILL_BLUR_TINT}
            intensity={TAB_PILL_BLUR_INTENSITY}
            experimentalBlurMethod="dimezisBlurView"
            style={StyleSheet.absoluteFill}
          />
          <View
            pointerEvents="none"
            style={[StyleSheet.absoluteFill, { backgroundColor: glassOverlay }]}
          />
        </View>
        <View style={styles.titleRow}>
          <View style={styles.checkSurface}>
            <Feather name="check" size={17} color="#F9F9F9" />
          </View>
          <Text style={styles.title}>Mensaje registrado</Text>
        </View>
        <Text style={styles.action}>Ver</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: "absolute",
    left: 36.5,
    right: 36.5,
    height: 56,
    borderRadius: 28,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.10)",
    shadowColor: "#000000",
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -3 },
    zIndex: 40,
  },
  pressable: {
    flex: 1,
    borderRadius: 28,
    paddingHorizontal: 17,
    flexDirection: "row",
    alignItems: "center",
  },
  pressed: { opacity: 0.6 },
  glassSurface: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 28,
    overflow: "hidden",
  },
  titleRow: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  checkSurface: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.10)",
    alignItems: "center",
    justifyContent: "center",
  },
  title: { color: "#F9F9F9", fontFamily: "Manrope", fontSize: 14, fontWeight: "700" },
  action: { color: "#F9F9F9", fontFamily: "Manrope", fontSize: 13, fontWeight: "700" },
});