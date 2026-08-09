import React, { useEffect, useRef, useState, Suspense } from "react";
import { Animated, Dimensions, StyleSheet, View } from "react-native";

import { useCategoryOverlay } from "@/context/CategoryOverlayContext";
import { BackOverrideProvider } from "@/context/BackOverrideContext";
import { DURATION, easeOutCubic } from "@/constants/motion";
import { useSceneTheme } from "@/context/SceneThemeContext";

const W = Dimensions.get("window").width;

// Importaciones lazy: cada screen se convierte en un split-bundle separado,
// lo que evita que el heap de Metro se llene al bundear las ~1800 dependencias
// de cada pantalla dentro del bundle principal.
const SCREENS: Record<string, React.LazyExoticComponent<React.ComponentType>> = {
  "/category/meditaciones-guiadas": React.lazy(() => import("@/app/category/meditaciones-guiadas")),
  "/category/sonidos-ancestrales":  React.lazy(() => import("@/app/category/sonidos-ancestrales")),
  "/category/musica-sonidos":       React.lazy(() => import("@/app/category/musica-sonidos")),
  "/(tabs)/descanzo":               React.lazy(() => import("@/app/(tabs)/descanzo")),
};

/**
 * Overlay de categorías: desliza de derecha a izquierda SOBRE las tabs.
 * El botón ← de cada pantalla cierra el overlay en vez de navegar en el router.
 */
export function CategoryOverlay() {
  const { categoryRoute, closeCategory } = useCategoryOverlay();
  const { theme: sceneTheme } = useSceneTheme();
  const [rendered, setRendered] = useState(false);
  const [activeRoute, setActiveRoute] = useState<string | null>(null);
  const slideAnim = useRef(new Animated.Value(W)).current;

  // Pre-cargar todos los módulos en segundo plano al montar el componente.
  // Así Metro compila los split-bundles antes de que el usuario los abra,
  // eliminando el delay de 3 s que aparece si se compilan bajo demanda.
  useEffect(() => {
    void Promise.all([
      import("@/app/category/meditaciones-guiadas"),
      import("@/app/category/sonidos-ancestrales"),
      import("@/app/category/musica-sonidos"),
      import("@/app/(tabs)/descanzo"),
    ]);
  }, []);

  useEffect(() => {
    if (categoryRoute) {
      setActiveRoute(categoryRoute);
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
  }, [categoryRoute]);

  if (!rendered || !activeRoute) return null;

  const Screen = SCREENS[activeRoute];
  if (!Screen) return null;

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFill,
        { backgroundColor: sceneTheme.solid, transform: [{ translateX: slideAnim }] },
      ]}
    >
      <BackOverrideProvider onBack={closeCategory}>
        <Suspense fallback={<View style={[StyleSheet.absoluteFill, { backgroundColor: sceneTheme.solid }]} />}>
          <Screen />
        </Suspense>
      </BackOverrideProvider>
    </Animated.View>
  );
}
