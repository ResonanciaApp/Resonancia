import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

import { DEFAULT_THEME_ID, SCENE_THEME_STORAGE_KEY, SCENE_THEMES, type SceneTheme, type VisualThemeId } from "@/config/scene-themes";
import type { SceneId } from "@/context/AmbientPlayerContext";
import { brightenThemeColor, useBrightness } from "@/context/BrightnessContext";

type SceneThemeCtx = {
  activeSceneId: SceneId;
  theme: SceneTheme;
  setActiveScene: (id: VisualThemeId) => void;
};

const SceneThemeContext = createContext<SceneThemeCtx | null>(null);

/** La elección visual es independiente de la escena sonora. */
export async function loadPersistedSceneId(): Promise<VisualThemeId> {
  try {
    const saved = await AsyncStorage.getItem(SCENE_THEME_STORAGE_KEY);
    if (saved === "tibet" || saved === "indigo2") return saved;
  } catch (error) {
    console.warn("[theme] No se pudo leer el tema guardado", error);
  }
  return DEFAULT_THEME_ID;
}

export function SceneThemeProvider({ children, initialSceneId = DEFAULT_THEME_ID }: {
  children: React.ReactNode;
  initialSceneId?: VisualThemeId;
}) {
  const { brightMode } = useBrightness();
  const [activeSceneId, setActiveSceneId] = useState<VisualThemeId>(initialSceneId);
  const setActiveScene = useCallback((id: VisualThemeId) => {
    setActiveSceneId(id);
    AsyncStorage.setItem(SCENE_THEME_STORAGE_KEY, id).catch((error) => {
      console.warn("[theme] No se pudo guardar el tema", error);
    });
  }, []);
  const theme = useMemo<SceneTheme>(() => {
    const base = SCENE_THEMES[activeSceneId];
    if (!brightMode) return base;
    return {
      ...base,
      solid: brightenThemeColor(base.solid),
      gradient: base.gradient.map(brightenThemeColor) as unknown as SceneTheme["gradient"],
    };
  }, [activeSceneId, brightMode]);

  const value = useMemo<SceneThemeCtx>(() => ({ activeSceneId, theme, setActiveScene }), [activeSceneId, theme, setActiveScene]);
  return <SceneThemeContext.Provider value={value}>{children}</SceneThemeContext.Provider>;
}

export function useSceneTheme() {
  const ctx = useContext(SceneThemeContext);
  if (!ctx) throw new Error("useSceneTheme must be inside SceneThemeProvider");
  return ctx;
}