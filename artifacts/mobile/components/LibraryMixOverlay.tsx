import React, { Suspense, useEffect, useRef, useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { Animated, BackHandler, Dimensions, StyleSheet } from "react-native";

import { BackOverrideProvider } from "@/context/BackOverrideContext";
import { useDrawerDestinations } from "@/context/DrawerContext";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { DURATION, easeOutCubic } from "@/constants/motion";

const W = Dimensions.get("window").width;
const MixDetail = React.lazy(() => import("@/app/mi-mezcla/[id]"));

/** El detalle de una mezcla se desliza sobre Biblioteca sin cambiar su tab ni cerrar el drawer. */
export function LibraryMixOverlay() {
  const { libraryMixId, closeLibraryMix } = useDrawerDestinations();
  const { theme } = useSceneTheme();
  const [activeId, setActiveId] = useState<string | null>(null);
  const slideAnim = useRef(new Animated.Value(W)).current;
  const transitionToken = useRef(0);

  useEffect(() => {
    const token = ++transitionToken.current;
    slideAnim.stopAnimation();
    if (libraryMixId) {
      setActiveId(libraryMixId);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: DURATION.DRAWER,
        easing: easeOutCubic,
        useNativeDriver: true,
      }).start();
    } else if (activeId) {
      Animated.timing(slideAnim, {
        toValue: W,
        duration: DURATION.DRAWER,
        easing: easeOutCubic,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished && token === transitionToken.current) setActiveId(null);
      });
    }
    // activeId changes only when the requested mix changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [libraryMixId]);

  useEffect(() => {
    if (!activeId) return;
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      closeLibraryMix();
      return true;
    });
    return () => subscription.remove();
  }, [activeId, closeLibraryMix]);

  if (!activeId) return null;

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, {
        backgroundColor: theme.gradient[0],
        transform: [{ translateX: slideAnim }],
      }]}
    >
      <BackOverrideProvider onBack={closeLibraryMix}>
        <Suspense fallback={<LinearGradient style={StyleSheet.absoluteFill} colors={theme.gradient} />}>
          <MixDetail id={activeId} />
        </Suspense>
      </BackOverrideProvider>
    </Animated.View>
  );
}