import React, { createContext, useContext, useMemo } from "react";

import { SCENE_THEMES, type SceneTheme } from "@/config/scene-themes";
import type { SceneId } from "@/context/AmbientPlayerContext";
import { brightenThemeColor, useBrightness } from "@/context/BrightnessContext";

type SceneThemeCtx = {
  activeSceneId: SceneId;
  theme: SceneTheme;
};

const SceneThemeContext = createContext<SceneThemeCtx | null>(null);

/** El aspecto visual ya no depende de la escena sonora. */
export function SceneThemeProvider({ children }: { children: React.ReactNode }) {
  const { brightMode } = useBrightness();
  const theme = useMemo<SceneTheme>(() => {
    const base = SCENE_THEMES.indigo2;
    if (!brightMode) return base;
    return {
      ...base,
      solid: brightenThemeColor(base.solid),
      gradient: base.gradient.map(brightenThemeColor) as unknown as SceneTheme["gradient"],
    };
  }, [brightMode]);

  const value = useMemo<SceneThemeCtx>(() => ({ activeSceneId: "indigo2", theme }), [theme]);
  return <SceneThemeContext.Provider value={value}>{children}</SceneThemeContext.Provider>;
}

export function useSceneTheme() {
  const ctx = useContext(SceneThemeContext);
  if (!ctx) throw new Error("useSceneTheme must be inside SceneThemeProvider");
  return ctx;
}