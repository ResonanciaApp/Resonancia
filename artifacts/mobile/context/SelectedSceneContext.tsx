import React, { createContext, useContext, useState } from "react";
import type { SceneAnimation } from "@workspace/api-client-react";

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
  const [bgScene, setBgScene] = useState<SceneAnimation | null>(null);
  return (
    <Ctx.Provider value={{ selectedScene, setSelectedScene, bgScene, setBgScene }}>
      {children}
    </Ctx.Provider>
  );
}

export function useSelectedScene() {
  return useContext(Ctx);
}
