import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useState,
} from "react";

export type SceneId =
  | "tibet"
  | "profundo"
  | "indigo";

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
];

type AmbientCtx = {
  currentScene: AmbientScene;
  isPlaying: boolean;
  isMuted: boolean;
  volume: number;
  setVolume: (v: number) => void;
  setScene: (id: SceneId) => Promise<void>;
  togglePlayback: () => Promise<void>;
  stopAmbient: () => Promise<void>;
  startAmbient: () => Promise<void>;
  isSheetOpen: boolean;
  openSheet: () => void;
  closeSheet: () => void;
  sleepTimerRemaining: number | null;
  setSleepTimer: (minutes: number | null) => void;
};

const AmbientContext = createContext<AmbientCtx | null>(null);

const STORAGE_KEY = "@ambient_scene";

export function AmbientPlayerProvider({ children }: { children: React.ReactNode }) {
  const [currentSceneId, setCurrentSceneId] = useState<SceneId>("tibet");
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const currentScene = AMBIENT_SCENES.find((s) => s.id === currentSceneId)!;

  const setScene = useCallback(async (id: SceneId) => {
    setCurrentSceneId(id);
    await AsyncStorage.setItem(STORAGE_KEY, id);
  }, []);

  // El sonido ambiente de Escenas fue retirado (ya no se usa).
  // Las funciones de audio son no-ops para no romper los componentes
  // que aún referencian el contexto (AmbientWidget, EscenasSheet).
  const noop = useCallback(async () => {}, []);

  const openSheet = useCallback(() => setIsSheetOpen(true), []);
  const closeSheet = useCallback(() => setIsSheetOpen(false), []);

  return (
    <AmbientContext.Provider
      value={{
        currentScene,
        isPlaying: false,
        isMuted: false,
        volume: 0,
        setVolume: noop,
        setScene,
        togglePlayback: noop,
        stopAmbient: noop,
        startAmbient: noop,
        isSheetOpen,
        openSheet,
        closeSheet,
        sleepTimerRemaining: null,
        setSleepTimer: noop,
      }}
    >
      {children}
    </AmbientContext.Provider>
  );
}

export function useAmbientPlayer() {
  const ctx = useContext(AmbientContext);
  if (!ctx) throw new Error("useAmbientPlayer must be inside AmbientPlayerProvider");
  return ctx;
}
