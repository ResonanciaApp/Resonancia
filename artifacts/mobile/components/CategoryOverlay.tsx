import React, { useEffect, useRef, useState, Suspense } from "react";
import { Animated, Dimensions, StyleSheet, View } from "react-native";

import { useCategoryOverlay } from "@/context/CategoryOverlayContext";
import { BackOverrideProvider } from "@/context/BackOverrideContext";
import { DURATION, easeOutCubic } from "@/constants/motion";
import { useSceneTheme } from "@/context/SceneThemeContext";

// ─── Descanzo: import EAGER (es ruta de tab, no de root) ──────────────────────
// Las rutas de tab son split-bundles de Expo Router. Si se lazy-importan con
// React.lazy, SceneThemeContext.tsx se evalúa DOS VECES (una en el bundle
// principal, otra en el split-bundle), creando dos objetos createContext
// distintos → proveedor y consumidor no coinciden → crash.
// Importarlo de forma eager lo incluye en el bundle principal desde el inicio
// (el tamaño es manejable, ~400 módulos) y evita la doble evaluación.
import DescanzoScreen from "@/app/(tabs)/descanzo";

// ─── Pantallas de categoría root-level: React.lazy es seguro ─────────────────
// Estas viven en app/category/ (rutas root, no tab). Expo Router no las
// empaqueta como split-bundles de tab, así que React.lazy crea UN SOLO
// bundle sin duplicar SceneThemeContext.
const LazyMeditaciones = React.lazy(() => import("@/app/category/meditaciones-guiadas"));
const LazySonidos      = React.lazy(() => import("@/app/category/sonidos-ancestrales"));
const LazyMusica       = React.lazy(() => import("@/app/category/musica-sonidos"));

const W = Dimensions.get("window").width;

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

  // Pre-cargar las 3 pantallas root-level de forma secuencial con pausa.
  // Así Metro compila un split-bundle a la vez sin saturar el heap.
  // Descanzo NO se precarga porque ya está en el bundle principal (eager).
  useEffect(() => {
    const delay = (ms: number) => new Promise(r => setTimeout(r, ms));
    void (async () => {
      await import("@/app/category/meditaciones-guiadas");
      await delay(3000);
      await import("@/app/category/sonidos-ancestrales");
      await delay(3000);
      await import("@/app/category/musica-sonidos");
    })();
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

  // Resolver el componente según la ruta activa.
  // Descanzo: eager import → sin Suspense necesario.
  // Categorías: React.lazy → envueltas en Suspense.
  const isDescanzo = activeRoute === "/(tabs)/descanzo";
  let ResolvedScreen: React.ComponentType | null = null;
  if (!isDescanzo) {
    if (activeRoute === "/category/meditaciones-guiadas") ResolvedScreen = LazyMeditaciones;
    else if (activeRoute === "/category/sonidos-ancestrales") ResolvedScreen = LazySonidos;
    else if (activeRoute === "/category/musica-sonidos") ResolvedScreen = LazyMusica;
    if (!ResolvedScreen) return null;
  }

  const bg = sceneTheme.solid;
  const Screen = ResolvedScreen;

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFill,
        { backgroundColor: bg, transform: [{ translateX: slideAnim }] },
      ]}
    >
      <BackOverrideProvider onBack={closeCategory}>
        {isDescanzo ? (
          <DescanzoScreen />
        ) : Screen ? (
          <Suspense fallback={<View style={[StyleSheet.absoluteFill, { backgroundColor: bg }]} />}>
            <Screen />
          </Suspense>
        ) : null}
      </BackOverrideProvider>
    </Animated.View>
  );
}
