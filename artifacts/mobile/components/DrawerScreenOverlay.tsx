import React, { useEffect, useRef, useState, Suspense } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { Animated, Dimensions, StyleSheet, View } from "react-native";

import { useDrawer } from "@/context/DrawerContext";
import { BackOverrideProvider } from "@/context/BackOverrideContext";
import { DURATION, easeOutCubic } from "@/constants/motion";
import { useSceneTheme } from "@/context/SceneThemeContext";

const W = Dimensions.get("window").width;

// Lazy imports para evitar dependencia circular con las rutas de Expo Router
const SCREENS: Record<string, React.LazyExoticComponent<React.ComponentType>> = {
  "/diario":          React.lazy(() => import("@/app/diario")),
  "/amigos":          React.lazy(() => import("@/app/amigos")),
  "/grupos":          React.lazy(() => import("@/app/grupos")),
  "/historial":       React.lazy(() => import("@/app/historial")),
  "/favoritos-todos": React.lazy(() => import("@/app/favoritos-todos")),
  "/mis-sesiones":    React.lazy(() => import("@/app/mis-sesiones")),
  "/equipo":          React.lazy(() => import("@/app/equipo")),
};

/**
 * Overlay genérico: desliza de derecha a izquierda SOBRE el drawer.
 * Cada pantalla recibe BackOverrideContext para que su botón ← cierre el overlay.
 */
export function DrawerScreenOverlay() {
  const { overlayRoute, closeOverlay } = useDrawer();
  const { theme: sceneTheme } = useSceneTheme();
  const [rendered, setRendered] = useState(false);
  const [activeRoute, setActiveRoute] = useState<string | null>(null);
  const slideAnim = useRef(new Animated.Value(W)).current;

  // Pre-cargar todos los módulos al montar el componente para que cuando el
  // usuario toque un ítem del drawer el JS ya esté en caché y renderice
  // inmediatamente (sin pasar por el fallback de Suspense).
  useEffect(() => {
    void Promise.all([
      import("@/app/diario"),
      import("@/app/amigos"),
      import("@/app/grupos"),
      import("@/app/historial"),
      import("@/app/favoritos-todos"),
      import("@/app/mis-sesiones"),
      import("@/app/equipo"),
    ]);
  }, []);

  useEffect(() => {
    if (overlayRoute) {
      setActiveRoute(overlayRoute);
      setRendered(true);
      slideAnim.stopAnimation();
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: DURATION.DRAWER,
        easing: easeOutCubic,
        useNativeDriver: true,
      }).start();
    } else if (rendered) {
      slideAnim.stopAnimation();
      Animated.timing(slideAnim, {
        toValue: W,
        duration: DURATION.DRAWER,
        easing: easeOutCubic,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) {
          setRendered(false);
          setActiveRoute(null);
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overlayRoute]);

  if (!rendered || !activeRoute) return null;

  const Screen = SCREENS[activeRoute];
  if (!Screen) return null;

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFill,
        { backgroundColor: sceneTheme.gradient[0], transform: [{ translateX: slideAnim }] },
      ]}
    >
      <BackOverrideProvider onBack={closeOverlay}>
        <Suspense fallback={<LinearGradient style={StyleSheet.absoluteFill} colors={sceneTheme.gradient} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} />}>
          <Screen />
        </Suspense>
      </BackOverrideProvider>
    </Animated.View>
  );
}
