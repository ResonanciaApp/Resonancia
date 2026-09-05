import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

export type SceneId =
  | "tibet"
  | "profundo"
  | "indigo"
  | "resonancia"
  | "indigo2";

export type AmbientScene = {
  id: SceneId;
  label: string;
  colors: readonly [string, string];
  icon: string;
  image: number;
};

export const AMBIENT_SCENES: AmbientScene[] = [
  {
    id: "tibet",
    label: "Universo",
    colors: ["#22131B", "#140C10"] as const,
    icon: "star",
    image: require("@/assets/images/ambient/tibet.png"),
  },
  {
    id: "profundo",
    label: "Profundo",
    colors: ["#1C1538", "#1A263D"] as const,
    icon: "moon",
    image: require("@/assets/images/ambient/profundo.jpg"),
  },
  {
    id: "indigo",
    label: "Índigo",
    colors: ["#2F1C4D", "#222C54"] as const,
    icon: "layers",
    image: require("@/assets/images/ambient/zafiro.png"),
  },
  {
    id: "resonancia",
    label: "Resonancia",
    colors: ["#2F1C4D", "#222C54"] as const,
    icon: "layers",
    image: require("@/assets/images/ambient/zafiro.png"),
  },
  {
    id: "indigo2",
    label: "Indigo 2",
    colors: ["#2F1C4D", "#222C54"] as const,
    icon: "layers",
    image: require("@/assets/images/ambient/zafiro.png"),
  },
];

type AmbientCtx = {
  currentScene: AmbientScene;
  setScene: (id: SceneId) => Promise<void>;
  isSheetOpen: boolean;
  openSheet: () => void;
  closeSheet: () => void;
};

const AmbientContext = createContext<AmbientCtx | null>(null);

const STORAGE_KEY = "@ambient_scene";

export function AmbientPlayerProvider({ children }: { children: React.ReactNode }) {
  const [currentSceneId, setCurrentSceneId] = useState<SceneId>("tibet");
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const currentScene = useMemo(
    () => AMBIENT_SCENES.find((scene) => scene.id === currentSceneId)!,
    [currentSceneId],
  );

  const setScene = useCallback(async (id: SceneId) => {
    setCurrentSceneId(id);
    await AsyncStorage.setItem(STORAGE_KEY, id);
  }, []);

  const openSheet = useCallback(() => setIsSheetOpen(true), []);
  const closeSheet = useCallback(() => setIsSheetOpen(false), []);

  const value = useMemo(
    () => ({
      currentScene,
      setScene,
      isSheetOpen,
      openSheet,
      closeSheet,
    }),
    [currentScene, setScene, isSheetOpen, openSheet, closeSheet],
  );

  return (
    <AmbientContext.Provider value={value}>
      {children}
    </AmbientContext.Provider>
  );
}

export function useAmbientPlayer() {
  const ctx = useContext(AmbientContext);
  if (!ctx) throw new Error("useAmbientPlayer must be inside AmbientPlayerProvider");
  return ctx;
}
