/**
 * SceneThemeContext — tema visual global activo.
 * ─────────────────────────────────────────────────────────────────
 * Independiente del audio de AmbientPlayerContext: el audio ambiente
 * SIEMPRE arranca en "naturaleza" al abrir la app, pero el TEMA VISUAL
 * sí se persiste entre sesiones.
 * ─────────────────────────────────────────────────────────────────
 * `setActiveSceneWithFade(id)` — transición "zen" sin flash:
 *   1. Fondo VIEJO queda visible (activeSceneId no cambia todavía).
 *   2. Overlay con colores NUEVOS monta a opacidad 0.
 *   3. SceneThemeTransitionOverlay arranca el fade-IN (0 → 1) en
 *      useLayoutEffect, garantizando que el overlay está pintado.
 *   4. Al llegar a opacidad 1 (colores nuevos cubren todo):
 *      - activeSceneId cambia → fondo adopta los nuevos colores.
 *      - Overlay se desmonta (opacidad 1 → invisible porque ya no existe).
 *   → Sin flash, sin colores viejos que destellan, transición suave.
 * ─────────────────────────────────────────────────────────────────
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
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
  /** Cambia el tema con fade-in zen (sin flash). */
  setActiveSceneWithFade: (id: SceneId) => void;
  /**
   * Colores del overlay de transición (colores NUEVOS durante el fade-in).
   * null = no hay transición en curso.
   */
  overlayColors: readonly [string, string, ...string[]] | null;
  /** Opacidad animada del overlay (0 → 1 durante la transición). */
  overlayOpacity: Animated.Value;
  /**
   * Aplica el tema pendiente y limpia el overlay.
   * Llamado por SceneThemeTransitionOverlay al completar la animación.
   */
  commitFade: () => void;
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
  // Colores del NUEVO tema que se está revelando (overlay fade-in)
  const [overlayColors, setOverlayColors] = useState<readonly [string, string, ...string[]] | null>(null);
  // Stable ref — never re-created, mutated in place by Animated
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  // ID pendiente de aplicar (se aplica al terminar el fade, no antes)
  const pendingSceneId = useRef<SceneId | null>(null);

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

  /** Aplica el tema pendiente y desmonta el overlay — llamado al final del fade. */
  const commitFade = useCallback(() => {
    const id = pendingSceneId.current;
    pendingSceneId.current = null;
    if (id) {
      setActiveSceneId(id);
      AsyncStorage.setItem(SCENE_THEME_STORAGE_KEY, id).catch(() => {});
    }
    setOverlayColors(null);
  }, []);

  const setActiveSceneWithFade = useCallback(
    (id: SceneId) => {
      if (id === activeSceneId) return; // ya es el tema activo
      // Detener cualquier animación previa
      overlayOpacity.stopAnimation();
      // Preparar overlay con colores NUEVOS, empezando invisible
      const newGradient = (SCENE_THEMES[id] ?? SCENE_THEMES[DEFAULT_THEME_ID]).gradient;
      overlayOpacity.setValue(0);
      pendingSceneId.current = id;
      // Montar overlay — la animación la arranca SceneThemeTransitionOverlay
      // en su useLayoutEffect (garantiza que está pintado antes de animar)
      setOverlayColors(newGradient);
    },
    [activeSceneId, overlayOpacity],
  );

  const theme = SCENE_THEMES[activeSceneId] ?? SCENE_THEMES[DEFAULT_THEME_ID];

  const value = useMemo(
    () => ({
      activeSceneId,
      theme,
      setActiveScene,
      setActiveSceneWithFade,
      overlayColors,
      overlayOpacity,
      commitFade,
    }),
    [activeSceneId, theme, setActiveScene, setActiveSceneWithFade, overlayColors, overlayOpacity, commitFade],
  );

  return <SceneThemeContext.Provider value={value}>{children}</SceneThemeContext.Provider>;
}

export function useSceneTheme() {
  const ctx = useContext(SceneThemeContext);
  if (!ctx) throw new Error("useSceneTheme must be inside SceneThemeProvider");
  return ctx;
}

/**
 * Overlay de transición zen. Montar en el root layout Y dentro de cada Modal
 * que use temas de Escena (los Modals de RN flotan sobre el árbol principal).
 *
 * Muestra los colores NUEVOS que se van revelando (fade 0 → 1).
 * Al completar, aplica el tema real y se desmonta — sin flash.
 */
export function SceneThemeTransitionOverlay() {
  const { overlayColors, overlayOpacity, commitFade } = useSceneTheme();

  useLayoutEffect(() => {
    if (!overlayColors) return;
    // Overlay pintado con colores nuevos a opacidad 0 → revelarlo suavemente
    Animated.timing(overlayOpacity, {
      toValue: 1,
      duration: 280,
      useNativeDriver: true,
    }).start(({ finished }) => {
      // Al llegar a opacidad 1 (nuevos colores cubren todo), aplicar tema real
      // y desmontar overlay — sin salto visual porque los colores coinciden.
      if (finished) commitFade();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overlayColors]);

  if (!overlayColors) return null;
  return (
    <Animated.View
      style={[StyleSheet.absoluteFillObject, { opacity: overlayOpacity, zIndex: 9999 }]}
      pointerEvents="none"
    >
      <LinearGradient
        colors={[...overlayColors] as [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
    </Animated.View>
  );
}
