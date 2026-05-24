import AsyncStorage from "@react-native-async-storage/async-storage";
import { Audio } from "expo-av";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

export type SceneId = "universo" | "naturaleza" | "bosque" | "lluvia" | "viento";

export type AmbientScene = {
  id: SceneId;
  label: string;
  colors: readonly [string, string];
  icon: string;
  image: number;
};

export const AMBIENT_SCENES: AmbientScene[] = [
  {
    id: "universo",
    label: "Universo",
    colors: ["#1A0A3C", "#6B3FA0"] as const,
    icon: "star",
    image: require("@/assets/images/ambient/universo.jpg"),
  },
  {
    id: "naturaleza",
    label: "Naturaleza",
    colors: ["#1A5C2A", "#6AB46D"] as const,
    icon: "sun",
    image: require("@/assets/images/ambient/naturaleza.jpg"),
  },
  {
    id: "bosque",
    label: "Bosque",
    colors: ["#1C3A1C", "#4A7A4A"] as const,
    icon: "feather",
    image: require("@/assets/images/ambient/bosque.jpg"),
  },
  {
    id: "lluvia",
    label: "Lluvia",
    colors: ["#2C3E50", "#7F8C8D"] as const,
    icon: "cloud-rain",
    image: require("@/assets/images/ambient/lluvia.jpg"),
  },
  {
    id: "viento",
    label: "Viento",
    colors: ["#6E8FA8", "#C5D9E8"] as const,
    icon: "wind",
    image: require("@/assets/images/ambient/viento.jpg"),
  },
];

// ── Audio sources per scene ───────────────────────────────────────────────────
const SCENE_AUDIO: Record<SceneId, unknown> = {
  universo:   require("@/assets/audio/pad_la.mp3"),
  naturaleza: require("@/assets/audio/pajaros_ambiente.mp3"),
  bosque:     require("@/assets/audio/riachuelo_pajaros.wav"),
  lluvia:     require("@/assets/audio/riachuelo_stream.mp3"),   // → replace with lluvia.mp3
  viento:     require("@/assets/audio/pajaros_ambiente.mp3"),   // → replace with viento.mp3
};

type AmbientCtx = {
  currentScene: AmbientScene;
  isPlaying: boolean;
  isMuted: boolean;
  setScene: (id: SceneId) => Promise<void>;
  togglePlayback: () => Promise<void>;
  stopAmbient: () => Promise<void>;
  startAmbient: () => Promise<void>;
};

const AmbientContext = createContext<AmbientCtx | null>(null);

const STORAGE_KEY = "@ambient_scene";

export function AmbientPlayerProvider({ children }: { children: React.ReactNode }) {
  const [currentSceneId, setCurrentSceneId] = useState<SceneId>("universo");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);
  // Track the scene that is actually loaded in the sound object
  const loadedSceneRef = useRef<SceneId | null>(null);

  const currentScene = AMBIENT_SCENES.find((s) => s.id === currentSceneId)!;

  const unload = useCallback(async () => {
    if (soundRef.current) {
      try { await soundRef.current.stopAsync(); } catch {}
      try { await soundRef.current.unloadAsync(); } catch {}
      soundRef.current = null;
      loadedSceneRef.current = null;
    }
  }, []);

  const loadAndPlay = useCallback(async (sceneId: SceneId) => {
    await unload();
    try {
      const { sound } = await Audio.Sound.createAsync(
        SCENE_AUDIO[sceneId] as Parameters<typeof Audio.Sound.createAsync>[0],
        { shouldPlay: true, isLooping: true, volume: 0.65 }
      );
      soundRef.current = sound;
      loadedSceneRef.current = sceneId;
    } catch (e) {
      console.warn("[Ambient] load failed:", e);
    }
  }, [unload]);

  // Load saved scene preference (no auto-start — caller triggers startAmbient)
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((val) => {
      if (val && AMBIENT_SCENES.find((s) => s.id === val)) {
        setCurrentSceneId(val as SceneId);
      }
    });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      soundRef.current?.unloadAsync().catch(() => {});
    };
  }, []);

  const setScene = useCallback(async (id: SceneId) => {
    setCurrentSceneId(id);
    await AsyncStorage.setItem(STORAGE_KEY, id);
    if (isPlaying && !isMuted) {
      await loadAndPlay(id);
    }
  }, [isPlaying, isMuted, loadAndPlay]);

  const togglePlayback = useCallback(async () => {
    if (!isPlaying) {
      setIsPlaying(true);
      setIsMuted(false);
      await loadAndPlay(currentSceneId);
    } else if (!isMuted) {
      setIsMuted(true);
      try { await soundRef.current?.pauseAsync(); } catch {}
    } else {
      setIsMuted(false);
      try { await soundRef.current?.playAsync(); } catch {}
    }
  }, [isPlaying, isMuted, currentSceneId, loadAndPlay]);

  const stopAmbient = useCallback(async () => {
    if (!isPlaying) return;
    setIsPlaying(false);
    setIsMuted(false);
    await unload();
  }, [isPlaying, unload]);

  // Call once when the home screen mounts (after onboarding)
  const startAmbient = useCallback(async () => {
    if (isPlaying) return; // already running
    setIsPlaying(true);
    setIsMuted(false);
    await loadAndPlay(currentSceneId);
  }, [isPlaying, currentSceneId, loadAndPlay]);

  return (
    <AmbientContext.Provider
      value={{ currentScene, isPlaying, isMuted, setScene, togglePlayback, stopAmbient, startAmbient }}
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
