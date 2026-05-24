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

const TARGET_VOLUME = 0.49; // 0.65 − 25%
const FADE_STEPS = 25;
const FADE_MS = 1000;

async function fadeIn(sound: Audio.Sound) {
  const stepMs = FADE_MS / FADE_STEPS;
  for (let i = 1; i <= FADE_STEPS; i++) {
    await new Promise<void>((r) => setTimeout(r, stepMs));
    try { await sound.setVolumeAsync((i / FADE_STEPS) * TARGET_VOLUME); } catch { break; }
  }
}

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
  const loadedSceneRef = useRef<SceneId | null>(null);
  // Refs so callbacks can read latest state without re-creating
  const isPlayingRef = useRef(false);
  const isMutedRef = useRef(false);
  const currentSceneIdRef = useRef<SceneId>("universo");

  isPlayingRef.current = isPlaying;
  isMutedRef.current = isMuted;
  currentSceneIdRef.current = currentSceneId;

  const currentScene = AMBIENT_SCENES.find((s) => s.id === currentSceneId)!;

  const unload = useCallback(async () => {
    if (soundRef.current) {
      try { await soundRef.current.stopAsync(); } catch {}
      try { await soundRef.current.unloadAsync(); } catch {}
      soundRef.current = null;
      loadedSceneRef.current = null;
    }
  }, []);

  // Pre-load a scene without playing it yet (instant start later)
  const preload = useCallback(async (sceneId: SceneId) => {
    if (loadedSceneRef.current === sceneId) return; // already loaded
    await unload();
    try {
      const { sound } = await Audio.Sound.createAsync(
        SCENE_AUDIO[sceneId] as Parameters<typeof Audio.Sound.createAsync>[0],
        { shouldPlay: false, isLooping: true, volume: 0 }
      );
      soundRef.current = sound;
      loadedSceneRef.current = sceneId;
    } catch (e) {
      console.warn("[Ambient] preload failed:", e);
    }
  }, [unload]);

  const loadAndPlay = useCallback(async (sceneId: SceneId) => {
    console.warn(`[Ambient] loadAndPlay scene=${sceneId} loaded=${loadedSceneRef.current}`);
    if (loadedSceneRef.current !== sceneId) {
      await unload();
      try {
        const { sound } = await Audio.Sound.createAsync(
          SCENE_AUDIO[sceneId] as Parameters<typeof Audio.Sound.createAsync>[0],
          { shouldPlay: true, isLooping: true, volume: TARGET_VOLUME }
        );
        soundRef.current = sound;
        loadedSceneRef.current = sceneId;
        console.warn(`[Ambient] playing new sound for ${sceneId}`);
      } catch (e) {
        console.warn("[Ambient] load failed:", e);
      }
    } else {
      // Already pre-loaded — play at full volume
      const sound = soundRef.current;
      if (sound) {
        try { await sound.setVolumeAsync(TARGET_VOLUME); } catch {}
        try { await sound.playAsync(); } catch {}
        console.warn(`[Ambient] playing preloaded sound for ${sceneId}`);
      }
    }
  }, [unload]);

  // On mount: configure audio mode + pre-load the default scene immediately
  useEffect(() => {
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    }).catch(() => {});

    // Load saved scene preference then pre-load it
    AsyncStorage.getItem(STORAGE_KEY).then((val) => {
      const savedId = val && AMBIENT_SCENES.find((s) => s.id === val) ? (val as SceneId) : "universo";
      setCurrentSceneId(savedId);
      preload(savedId);
    });

    return () => {
      soundRef.current?.unloadAsync().catch(() => {});
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setScene = useCallback(async (id: SceneId) => {
    setCurrentSceneId(id);
    await AsyncStorage.setItem(STORAGE_KEY, id);
    if (isPlayingRef.current && !isMutedRef.current) {
      await loadAndPlay(id);
    } else {
      // Pre-load silently so next play is instant
      await preload(id);
    }
  }, [loadAndPlay, preload]);

  const togglePlayback = useCallback(async () => {
    if (!isPlayingRef.current) {
      setIsPlaying(true);
      setIsMuted(false);
      await loadAndPlay(currentSceneIdRef.current);
    } else if (!isMutedRef.current) {
      setIsMuted(true);
      try { await soundRef.current?.pauseAsync(); } catch {}
    } else {
      setIsMuted(false);
      try { await soundRef.current?.playAsync(); } catch {}
    }
  }, [loadAndPlay]);

  const stopAmbient = useCallback(async () => {
    if (!isPlayingRef.current) return;
    setIsPlaying(false);
    setIsMuted(false);
    await unload();
  }, [unload]);

  // Called from HomeScreen after onboarding — sound is already pre-loaded, plays instantly
  const startAmbient = useCallback(async () => {
    console.warn(`[Ambient] startAmbient called isPlaying=${isPlayingRef.current} scene=${currentSceneIdRef.current}`);
    if (isPlayingRef.current) return;
    setIsPlaying(true);
    setIsMuted(false);
    await loadAndPlay(currentSceneIdRef.current);
  }, [loadAndPlay]);

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
