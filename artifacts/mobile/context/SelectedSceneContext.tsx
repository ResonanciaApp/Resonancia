import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { SceneAnimation } from "@workspace/api-client-react";

const BG_SCENE_KEY = "@resonance_bg_scene";

interface SelectedSceneCtx {
  selectedScene: SceneAnimation | null;
  setSelectedScene: (s: SceneAnimation | null) => void;
  bgScene: SceneAnimation | null;
  setBgScene: (s: SceneAnimation | null) => void;
}

const Ctx = createContext<SelectedSceneCtx>({
  selectedScene: null,
  setSelectedScene: () => {},
  bgScene: null,
  setBgScene: () => {},
});

export function SelectedSceneProvider({ children }: { children: React.ReactNode }) {
  const [selectedScene, setSelectedScene] = useState<SceneAnimation | null>(null);
  const [bgScene, setBgSceneState] = useState<SceneAnimation | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(BG_SCENE_KEY).then((raw) => {
      if (raw) {
        try {
          setBgSceneState(JSON.parse(raw) as SceneAnimation);
        } catch {
          // corrupted — ignore
        }
      }
    });
  }, []);

  const setBgScene = (s: SceneAnimation | null) => {
    setBgSceneState(s);
    if (s == null) {
      AsyncStorage.removeItem(BG_SCENE_KEY).catch(() => {});
    } else {
      AsyncStorage.setItem(BG_SCENE_KEY, JSON.stringify(s)).catch(() => {});
    }
  };

  return (
    <Ctx.Provider value={{ selectedScene, setSelectedScene, bgScene, setBgScene }}>
      {children}
    </Ctx.Provider>
  );
}

export function useSelectedScene() {
  return useContext(Ctx);
}
