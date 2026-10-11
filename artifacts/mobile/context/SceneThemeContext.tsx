import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

import { DEFAULT_THEME_ID, SCENE_THEME_STORAGE_KEY, SCENE_THEMES, isVisualThemeId, type SceneTheme, type ThemeSceneId, type VisualThemeId } from "@/config/scene-themes";
import { brightenThemeColor, useBrightness } from "@/context/BrightnessContext";
import { CardCaptionColorContext } from "@/context/CardCaptionColorContext";
import { getCardTextBelowColor } from "@/constants/colors";

type SceneThemeCtx = {
  activeSceneId: ThemeSceneId;
  theme: SceneTheme;
  setActiveScene: (id: VisualThemeId) => void;
};

const SceneThemeContext = createContext<SceneThemeCtx | null>(null);
// Native writes can complete asynchronously; serialize choices so the last tap wins.
let pendingThemeWrite: Promise<void> = Promise.resolve();

/** La elección visual es independiente de la escena sonora. */
export async function loadPersistedSceneId(): Promise<VisualThemeId> {
  await pendingThemeWrite;
  try {
    const saved = await AsyncStorage.getItem(SCENE_THEME_STORAGE_KEY);
    if (isVisualThemeId(saved)) return saved;
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
    pendingThemeWrite = pendingThemeWrite.then(() => AsyncStorage.setItem(SCENE_THEME_STORAGE_KEY, id)).catch((error) => {
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
  return (
    <SceneThemeContext.Provider value={value}>
      <CardCaptionColorContext.Provider value={getCardTextBelowColor(activeSceneId)}>
        {children}
      </CardCaptionColorContext.Provider>
    </SceneThemeContext.Provider>
  );
}

export function useSceneTheme() {
  const ctx = useContext(SceneThemeContext);
  if (!ctx) throw new Error("useSceneTheme must be inside SceneThemeProvider");
  return ctx;
}

/** Safe for themed primitives rendered above the provider (e.g. error UI). */
export function useSceneThemeOptional() {
  return useContext(SceneThemeContext);
}