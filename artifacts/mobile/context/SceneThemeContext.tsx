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

/**
 * Lee la Escena guardada en AsyncStorage antes del primer render, para que
 * `SceneThemeProvider` pueda arrancar ya con el tema correcto (evita el
 * flash del tema por defecto en cold start). El caller (root layout) debe
 * esperar esta promesa antes de ocultar el splash screen.
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
  /** Escena inicial ya resuelta (ver `loadPersistedSceneId`). Evita el flash de re-hidratación. */
  initialSceneId?: SceneId;
}) {
  const [activeSceneId, setActiveSceneId] = useState<SceneId>(initialSceneId ?? DEFAULT_THEME_ID);

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
