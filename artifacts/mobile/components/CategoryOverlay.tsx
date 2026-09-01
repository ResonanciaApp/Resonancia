import React, { useEffect, useRef, useState, Suspense } from "react";
import { BackHandler, ActivityIndicator, Animated, Dimensions, StyleSheet, View } from "react-native";

import { useCategoryOverlay, type OverlayEntry } from "@/context/CategoryOverlayContext";
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

// ─── Pantallas root-level: React.lazy es seguro ───────────────────────────────
// Estas viven en app/ (rutas root, no tab). Expo Router no las empaqueta como
// split-bundles de tab, así que React.lazy crea UN SOLO bundle sin duplicar
// SceneThemeContext.
const LazyMeditaciones = React.lazy(() => import("@/app/category/meditaciones-guiadas"));
const LazySonidos      = React.lazy(() => import("@/app/category/sonidos-ancestrales"));
const LazyMusica       = React.lazy(() => import("@/app/category/musica-sonidos"));
const LazyCategory      = React.lazy(() => import("@/app/category/[id]"));
const LazySessionDetail = React.lazy(() => import("@/app/session/[id]"));
const LazyMezcla        = React.lazy(() => import("@/app/mezcla/[id]"));
const LazyTema          = React.lazy(() => import("@/app/tema/[id]"));
const LazyChakra        = React.lazy(() => import("@/app/chakra/[id]"));
const LazyBusqueda      = React.lazy(() => import("@/app/busqueda"));
const LazyTag           = React.lazy(() => import("@/app/tag/[id]"));
const LazyTodasTematicas = React.lazy(() => import("@/app/todas-las-tematicas"));
const LazyVideos        = React.lazy(() => import("@/app/videos"));
const LazyFavoritos     = React.lazy(() => import("@/app/favoritos-todos"));
const LazyPlaylist      = React.lazy(() => import("@/app/playlist/[id]"));
const LazySleepTag      = React.lazy(() => import("@/app/sleep-tag/[id]"));
const LazySoundTag      = React.lazy(() => import("@/app/sound-tag/[id]"));

const W = Dimensions.get("window").width;

/** Resuelve la ruta de un overlay a su pantalla (con id si es parametrizada). */
function resolveRoute(route: string): { node: React.ReactNode; eager: boolean; defer?: boolean } | null {
  if (route === "/(tabs)/descanzo") return { node: <DescanzoScreen />, eager: true };
  if (route === "/category/meditaciones-guiadas") return { node: <LazyMeditaciones />, eager: false };
  if (route === "/category/sonidos-ancestrales") return { node: <LazySonidos />, eager: false };
  if (route === "/category/musica-sonidos") return { node: <LazyMusica />, eager: false };
  const category = route.match(/^\/category\/(.+)$/);
  if (category) {
    return {
      node: <LazyCategory categoryId={decodeURIComponent(category[1])} />,
      eager: false,
    };
  }
  const b = route.match(/^\/busqueda(?:\?tiempo=(.+))?$/);
  if (b) return { node: <LazyBusqueda tiempo={b[1] ? decodeURIComponent(b[1]) : undefined} />, eager: false };
  if (route === "/todas-las-tematicas") return { node: <LazyTodasTematicas />, eager: false };
  if (route === "/videos") return { node: <LazyVideos />, eager: false };
  if (route === "/favoritos-todos") return { node: <LazyFavoritos />, eager: false };
  const p = route.match(/^\/playlist\/(.+)$/);
  if (p) return { node: <LazyPlaylist id={decodeURIComponent(p[1])} />, eager: false };
  const m = route.match(/^\/(session|mezcla|tema|chakra|tag|sleep-tag|sound-tag)\/(.+)$/);
  if (m) {
    const id = decodeURIComponent(m[2]);
    // defer: la pantalla de sesión es muy pesada de renderizar; si se monta
    // durante el slide de entrada, retrasa el arranque de la animación y el
    // parallax de Inicio corre solo. Se monta al terminar el deslizamiento.
    if (m[1] === "session") return { node: <LazySessionDetail id={id} />, eager: false, defer: true };
    if (m[1] === "mezcla") return { node: <LazyMezcla id={id} />, eager: false };
    if (m[1] === "tema") return { node: <LazyTema id={id} />, eager: false };
    if (m[1] === "chakra") return { node: <LazyChakra id={id} />, eager: false };
    // TagScreen resuelve tanto params de Expo Router como props del overlay y
    // realiza su propia decodificación. Conservar aquí el segmento codificado
    // evita un segundo decodeURIComponent que crashea con slugs que contienen %.
    if (m[1] === "tag") return { node: <LazyTag id={m[2]} />, eager: false };
    if (m[1] === "sleep-tag") return { node: <LazySleepTag id={id} />, eager: false };
    if (m[1] === "sound-tag") return { node: <LazySoundTag id={id} />, eager: false };
  }
  return null;
}

type LayerState = OverlayEntry & { closing: boolean; depth: number };

const PARALLAX_SHIFT = -56;

/** Una capa del overlay: desliza al entrar y al salir. */
function OverlayLayer({
  layer,
  bg,
  onBack,
  onClosed,
  parallaxAnim,
}: {
  layer: LayerState;
  bg: string;
  onBack: () => void;
  onClosed: (key: number) => void;
  parallaxAnim: Animated.Value;
}) {
  const slideAnim = useRef(new Animated.Value(W)).current;

  useEffect(() => {
    slideAnim.stopAnimation();
    Animated.timing(slideAnim, {
      toValue: layer.closing ? W : 0,
      duration: DURATION.DRAWER,
      easing: easeOutCubic,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished && layer.closing) onClosed(layer.key);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layer.closing]);

  const resolved = resolveRoute(layer.route);

  // Rutas "defer": el panel entra deslizando vacío (junto con el parallax) y
  // el contenido pesado se monta recién al terminar la animación de entrada.
  const [contentReady, setContentReady] = useState(!resolved?.defer);
  useEffect(() => {
    if (contentReady) return;
    const t = setTimeout(() => setContentReady(true), DURATION.DRAWER + 30);
    return () => clearTimeout(t);
  }, [contentReady]);

  if (!resolved) return null;

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFill,
        {
          backgroundColor: bg,
          transform: [{
            translateX: Animated.add(
              slideAnim,
              // Parallax: esta capa se corre cuando entra otra encima.
              parallaxAnim.interpolate({
                inputRange: [layer.depth + 1, layer.depth + 2],
                outputRange: [0, PARALLAX_SHIFT],
                extrapolate: "clamp",
              }),
            ),
          }],
        },
      ]}
    >
      <BackOverrideProvider onBack={onBack}>
        {!contentReady ? (
          <View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: bg, alignItems: "center", justifyContent: "center" },
            ]}
          >
            <ActivityIndicator size="large" color="#BE9650" />
          </View>
        ) : resolved.eager ? (
          resolved.node
        ) : (
          <Suspense
            fallback={
              <View
                style={[
                  StyleSheet.absoluteFill,
                  { backgroundColor: bg, alignItems: "center", justifyContent: "center" },
                ]}
              >
                <ActivityIndicator size="large" color="#BE9650" />
              </View>
            }
          >
            {resolved.node}
          </Suspense>
        )}
      </BackOverrideProvider>
    </Animated.View>
  );
}

/**
 * Overlay de categorías y detalles: desliza de derecha a izquierda SOBRE las
 * tabs (debajo del tab bar, que queda siempre visible). Soporta una pila de
 * pantallas (p.ej. categoría → detalle de sesión).
 * El botón ← de cada pantalla cierra su capa en vez de navegar en el router.
 */
export function CategoryOverlay() {
  const { stack, closeCategory, parallaxAnim } = useCategoryOverlay();

  // Botón físico "atrás" (Android): con paneles abiertos, cierra el de arriba
  // en vez de actuar sobre el stack del router.
  useEffect(() => {
    if (stack.length === 0) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      closeCategory();
      return true;
    });
    return () => sub.remove();
  }, [stack.length, closeCategory]);
  const { theme: sceneTheme } = useSceneTheme();
  const [layers, setLayers] = useState<LayerState[]>([]);

  // Pre-cargar las 3 pantallas de categoría de forma secuencial con pausa.
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
      // Detalle de sesión: sin precarga, su split-bundle se compila justo
      // durante el slide de entrada y traba el parallax de Inicio.
      await delay(3000);
      await import("@/app/session/[id]");
    })();
  }, []);

  // Sincronizar la pila del contexto con las capas locales (para poder animar
  // la salida antes de desmontar).
  useEffect(() => {
    setLayers((prev) => {
      const liveKeys = new Set(stack.map((e) => e.key));
      const next: LayerState[] = prev.map((l) =>
        liveKeys.has(l.key) ? l : { ...l, closing: true },
      );
      for (let i = 0; i < stack.length; i++) {
        const e = stack[i];
        if (!next.some((l) => l.key === e.key)) next.push({ ...e, closing: false, depth: i });
      }
      return next;
    });
  }, [stack]);

  const handleClosed = React.useCallback((key: number) => {
    setLayers((prev) => prev.filter((l) => l.key !== key));
  }, []);

  if (!layers.length) return null;

  const bg = sceneTheme.solid;

  return (
    <>
      {layers.map((layer) => (
        <OverlayLayer
          key={layer.key}
          layer={layer}
          bg={bg}
          onBack={closeCategory}
          onClosed={handleClosed}
          parallaxAnim={parallaxAnim}
        />
      ))}
    </>
  );
}
