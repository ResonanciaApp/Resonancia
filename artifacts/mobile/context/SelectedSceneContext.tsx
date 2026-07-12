import React, { createContext, useContext, useState } from "react";
import type { SceneAnimation } from "@workspace/api-client-react";

interface SelectedSceneCtx {
  selectedScene: SceneAnimation | null;
  setSelectedScene: (s: SceneAnimation | null) => void;
}

const Ctx = createContext<SelectedSceneCtx>({
  selectedScene: null,
  setSelectedScene: () => {},
});

export function SelectedSceneProvider({ children }: { children: React.ReactNode }) {
  const [selectedScene, setSelectedScene] = useState<SceneAnimation | null>(null);
  return (
    <Ctx.Provider value={{ selectedScene, setSelectedScene }}>
      {children}
    </Ctx.Provider>
  );
}

export function useSelectedScene() {
  return useContext(Ctx);
}
