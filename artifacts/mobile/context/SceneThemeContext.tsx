/**
 * SceneThemeContext — tema visual global activo.
 * ─────────────────────────────────────────────────────────────────
 * Independiente del audio de AmbientPlayerContext: el audio ambiente
 * SIEMPRE arranca en "universo" al abrir la app (por seguridad de la
 * sesión nativa, ver comentario en AmbientPlayerContext), pero el TEMA
 * VISUAL sí se persiste tal cual entre sesiones (requisito de esta
 * tarea). Por eso vive en su propio contexto + su propia clave de
 * AsyncStorage, aunque ambos comparten el mismo set de ids (SceneId) y
 * se actualizan juntos cuando el usuario elige una Escena en el panel.
 * ─────────────────────────────────────────────────────────────────
 * `setActiveSceneWithFade(id)` — cambia el tema con un fade-in de 450ms:
 * monta un overlay con los colores VIEJOS a opacidad 1, aplica el tema
 * nuevo detrás, y desvanece el overlay → el nuevo tema aparece suavemente.
 * Usar `<SceneThemeTransitionOverlay />` en el root layout para el overlay.
 * ─────────────────────────────────────────────────────────────────
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Animated, StyleSheet } from "react-native";

import type { SceneId } from "@/context/AmbientPlayerContext";
import {
  DEFAULT_THEME_ID,
  SCENE_THEME_STORAGE_KEY,
  SCENE_THEMES,
  type SceneTheme,
} from "@/config/scene-themes";

type SceneThemeCtx = {
  activeSceneId: SceneId;
  theme: SceneTheme;
  setActiveScene: (id: SceneId) => void;
  /** Cambia el tema con un fade-in de 450ms. */
  setActiveSceneWithFade: (id: SceneId) => void;
  /** Colores del overlay de transición (tema ANTERIOR durante el fade). null = no hay transición. */
  overlayColors: readonly [string, string] | null;
  /** Opacidad animada del overlay (1 → 0 durante la transición). */
  overlayOpacity: Animated.Value;
};

const SceneThemeContext = createContext<SceneThemeCtx | null>(null);

/**
 * Lee la Escena guardada en AsyncStorage antes del primer render.
 */
export async function loadPersistedSceneId(): Promise<SceneId> {
  try {
    const saved = await AsyncStorage.getItem(SCENE_THEME_STORAGE_KEY);
    if (saved && saved in SCENE_THEMES) return saved as SceneId;
  } catch {
    // ignore — usa el default
  }
  return DEFAULT_THEME_ID;
}

export function SceneThemeProvider({
  children,
  initialSceneId,
}: {
  children: React.ReactNode;
  initialSceneId?: SceneId;
}) {
  const [activeSceneId, setActiveSceneId] = useState<SceneId>(initialSceneId ?? DEFAULT_THEME_ID);
  const [overlayColors, setOverlayColors] = useState<readonly [string, string] | null>(null);
  // Stable ref — never re-created, mutated in place by Animated
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (initialSceneId) return;
    AsyncStorage.getItem(SCENE_THEME_STORAGE_KEY)
      .then((saved) => {
        if (saved && saved in SCENE_THEMES) {
          setActiveSceneId(saved as SceneId);
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setActiveScene = useCallback((id: SceneId) => {
    setActiveSceneId(id);
    AsyncStorage.setItem(SCENE_THEME_STORAGE_KEY, id).catch(() => {});
  }, []);

  const setActiveSceneWithFade = useCallback((id: SceneId) => {
    // Capture current gradient BEFORE updating state
    const currentGradient = (SCENE_THEMES[activeSceneId] ?? SCENE_THEMES[DEFAULT_THEME_ID]).gradient;
    // Mount overlay at full opacity with OLD colors
    setOverlayColors(currentGradient);
    overlayOpacity.setValue(1);
    // Apply new theme immediately behind the overlay
    setActiveSceneId(id);
    AsyncStorage.setItem(SCENE_THEME_STORAGE_KEY, id).catch(() => {});
    // Fade out overlay → new theme becomes visible
    Animated.timing(overlayOpacity, {
      toValue: 0,
      duration: 400,
      useNativeDriver: true,
    }).start(() => setOverlayColors(null));
  }, [activeSceneId, overlayOpacity]);

  const theme = SCENE_THEMES[activeSceneId] ?? SCENE_THEMES[DEFAULT_THEME_ID];

  const value = useMemo(
    () => ({ activeSceneId, theme, setActiveScene, setActiveSceneWithFade, overlayColors, overlayOpacity }),
    [activeSceneId, theme, setActiveScene, setActiveSceneWithFade, overlayColors, overlayOpacity],
  );

  return <SceneThemeContext.Provider value={value}>{children}</SceneThemeContext.Provider>;
}

export function useSceneTheme() {
  const ctx = useContext(SceneThemeContext);
  if (!ctx) throw new Error("useSceneTheme must be inside SceneThemeProvider");
  return ctx;
}

/**
 * Overlay de transición de tema. Montar en el root layout (dentro de SceneThemeProvider).
 * Renderiza el degradado del tema ANTERIOR con opacidad 1→0 durante el fade.
 */
export function SceneThemeTransitionOverlay() {
  const { overlayColors, overlayOpacity } = useSceneTheme();
  if (!overlayColors) return null;
  return (
    <Animated.View
      style={[StyleSheet.absoluteFillObject, { opacity: overlayOpacity, zIndex: 9999 }]}
      pointerEvents="none"
    >
      <LinearGradient
        colors={[...overlayColors] as [string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
    </Animated.View>
  );
}
