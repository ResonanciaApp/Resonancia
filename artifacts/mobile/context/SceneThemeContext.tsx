/**
 * SceneThemeContext — tema visual global activo (Task #82).
 * ─────────────────────────────────────────────────────────────────
 * Independiente del audio de AmbientPlayerContext: el audio ambiente
 * SIEMPRE arranca en "universo" al abrir la app (por seguridad de la
 * sesión nativa, ver comentario en AmbientPlayerContext), pero el TEMA
 * VISUAL sí se persiste tal cual entre sesiones (requisito de esta
 * tarea). Por eso vive en su propio contexto + su propia clave de
 * AsyncStorage, aunque ambos comparten el mismo set de ids (SceneId) y
 * se actualizan juntos cuando el usuario elige una Escena en el panel.
 * ─────────────────────────────────────────────────────────────────
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

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
};

const SceneThemeContext = createContext<SceneThemeCtx | null>(null);

export function SceneThemeProvider({ children }: { children: React.ReactNode }) {
  const [activeSceneId, setActiveSceneId] = useState<SceneId>(DEFAULT_THEME_ID);

  useEffect(() => {
    AsyncStorage.getItem(SCENE_THEME_STORAGE_KEY)
      .then((saved) => {
        if (saved && saved in SCENE_THEMES) {
          setActiveSceneId(saved as SceneId);
        }
      })
      .catch(() => {});
  }, []);

  const setActiveScene = useCallback((id: SceneId) => {
    setActiveSceneId(id);
    AsyncStorage.setItem(SCENE_THEME_STORAGE_KEY, id).catch(() => {});
  }, []);

  const theme = SCENE_THEMES[activeSceneId] ?? SCENE_THEMES[DEFAULT_THEME_ID];

  const value = useMemo(
    () => ({ activeSceneId, theme, setActiveScene }),
    [activeSceneId, theme, setActiveScene],
  );

  return <SceneThemeContext.Provider value={value}>{children}</SceneThemeContext.Provider>;
}

export function useSceneTheme() {
  const ctx = useContext(SceneThemeContext);
  if (!ctx) throw new Error("useSceneTheme must be inside SceneThemeProvider");
  return ctx;
}
