import React, { useEffect, useRef, useState } from "react";
import { Animated, Dimensions, StyleSheet } from "react-native";

import { useDrawer } from "@/context/DrawerContext";
import { BackOverrideProvider } from "@/context/BackOverrideContext";
import { DURATION, easeOutCubic } from "@/constants/motion";

// Importamos las pantallas como componentes reutilizables
import DiarioScreen from "@/app/diario";
import AmigosScreen from "@/app/amigos";
import GruposScreen from "@/app/grupos";
import HistorialScreen from "@/app/historial";
import FavoritosTodosScreen from "@/app/favoritos-todos";
import MisSesionesScreen from "@/app/mis-sesiones";

const W = Dimensions.get("window").width;

const SCREENS: Record<string, React.ComponentType> = {
  "/diario": DiarioScreen,
  "/amigos": AmigosScreen,
  "/grupos": GruposScreen,
  "/historial": HistorialScreen,
  "/favoritos-todos": FavoritosTodosScreen,
  "/mis-sesiones": MisSesionesScreen,
};

/**
 * Overlay genérico: desliza de derecha a izquierda SOBRE el drawer.
 * Cada pantalla recibe BackOverrideContext para que su botón ← cierre el overlay.
 */
export function DrawerScreenOverlay() {
  const { overlayRoute, closeOverlay } = useDrawer();
  const [rendered, setRendered] = useState(false);
  const [activeRoute, setActiveRoute] = useState<string | null>(null);
  const slideAnim = useRef(new Animated.Value(W)).current;

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
    <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateX: slideAnim }] }]}>
      <BackOverrideProvider onBack={closeOverlay}>
        <Screen />
      </BackOverrideProvider>
    </Animated.View>
  );
}
