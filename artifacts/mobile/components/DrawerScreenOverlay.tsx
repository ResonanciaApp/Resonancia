import React, { useEffect, useRef, useState, Suspense } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { Animated, BackHandler, Dimensions, StyleSheet, View } from "react-native";

import { useDrawer } from "@/context/DrawerContext";
import { BackOverrideProvider } from "@/context/BackOverrideContext";
import { DURATION, easeOutCubic } from "@/constants/motion";
import { useSceneTheme } from "@/context/SceneThemeContext";

const W = Dimensions.get("window").width;
const SHARED_DRAWER_ROUTES = new Set([
  "/historial",
  "/favoritos-todos",
  "/diario",
  "/descargas",
  "/notificaciones",
  "/amigos",
  "/grupos",
  "/membresia",
]);

// Lazy imports para evitar dependencia circular con las rutas de Expo Router
const SCREENS: Record<string, React.LazyExoticComponent<React.ComponentType>> = {
  "/diario":          React.lazy(() => import("@/app/diario")),
  "/amigos":          React.lazy(() => import("@/app/amigos")),
  "/grupos":          React.lazy(() => import("@/app/grupos")),
  "/historial":       React.lazy(() => import("@/app/historial")),
  "/favoritos-todos": React.lazy(() => import("@/app/favoritos-todos")),
  "/mis-sesiones":    React.lazy(() => import("@/app/mis-sesiones")),
  "/equipo":          React.lazy(() => import("@/app/equipo")),
  "/descargas":       React.lazy(() => import("@/app/descargas")),
  "/notificaciones":  React.lazy(() => import("@/app/notificaciones")),
  "/membresia":       React.lazy(() => import("@/app/membresia")),
};

/**
 * Overlay genérico: desliza de derecha a izquierda SOBRE el drawer.
 * Cada pantalla recibe BackOverrideContext para que su botón ← cierre el overlay.
 */
export function DrawerScreenOverlay() {
  const {
    overlayRoute,
    closeOverlay,
    overlayOpenedFromDrawer,
    acknowledgeDestinationReady,
    destinationRequest,
  } = useDrawer();
  const [mountKey, setMountKey] = useState(0);
  const { theme: sceneTheme } = useSceneTheme();
  const [rendered, setRendered] = useState(false);
  const [activeRoute, setActiveRoute] = useState<string | null>(null);
  const slideAnim = useRef(new Animated.Value(W)).current;
  const transitionToken = useRef(0);
  const afterCloseRef = useRef<(() => void) | null>(null);

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
      import("@/app/descargas"),
      import("@/app/notificaciones"),
      import("@/app/membresia"),
    ]);
  }, []);

  useEffect(() => {
    const token = ++transitionToken.current;
    slideAnim.stopAnimation();
    if (overlayRoute) {
      afterCloseRef.current = null;
      setActiveRoute(overlayRoute);
      setRendered(true);
      if (overlayOpenedFromDrawer && SHARED_DRAWER_ROUTES.has(overlayRoute)) {
        // Origen drawer: se monta ya en su sitio dentro de la superficie
        // frontal, sin entrada lateral propia. El drawer cierra al confirmar layout.
        slideAnim.setValue(0);
        setMountKey((key) => key + 1);
      } else {
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: DURATION.DRAWER,
          easing: easeOutCubic,
          useNativeDriver: true,
        }).start();
      }
    } else if (rendered) {
      Animated.timing(slideAnim, {
        toValue: W,
        duration: DURATION.DRAWER,
        easing: easeOutCubic,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished && token === transitionToken.current) {
          setRendered(false);
          setActiveRoute(null);
          const afterClose = afterCloseRef.current;
          afterCloseRef.current = null;
          afterClose?.();
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overlayRoute]);

  const closeAfterAnimation = React.useCallback((callback: () => void) => {
    afterCloseRef.current = callback;
    closeOverlay();
  }, [closeOverlay]);

  useEffect(() => {
    if (!rendered) return;
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      closeOverlay();
      return true;
    });
    return () => subscription.remove();
  }, [closeOverlay, rendered]);

  if (!rendered || !activeRoute) return null;

  const Screen = SCREENS[activeRoute];
  if (!Screen) return null;

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFill,
        {
          backgroundColor: sceneTheme.gradient[0],
          transform: [{ translateX: slideAnim }],
        },
      ]}
    >
      <BackOverrideProvider onBack={closeOverlay} onBackAfterClose={closeAfterAnimation}>
        <Suspense fallback={<LinearGradient style={StyleSheet.absoluteFill} colors={sceneTheme.gradient} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} />}>
          {/* onLayout solo ocurre cuando el modulo lazy ya resolvio: confirmacion real. */}
          <View
            key={mountKey}
            style={styles.fill}
          >
            <Screen />
            <View
              key={destinationRequest}
              collapsable={false}
              pointerEvents="none"
              style={{ position: "absolute", width: 1, height: 1 }}
              onLayout={() => acknowledgeDestinationReady("layout", activeRoute)}
            />
          </View>
        </Suspense>
      </BackOverrideProvider>
    </Animated.View>
  );
}

const styles = StyleSheet.create({ fill: { flex: 1 } });
