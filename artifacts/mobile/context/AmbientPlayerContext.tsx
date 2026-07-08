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
import { AppState, type AppStateStatus } from "react-native";

export type SceneId =
  | "profundo"
  | "tibet"
  | "naturaleza"
  | "musgo"
  | "zafiro"
  | "bosque"
  | "lluvia"
  | "nebulosa"
  | "viento"
  | "solaris";

export type AmbientScene = {
  id: SceneId;
  label: string;
  colors: readonly [string, string];
  icon: string;
  image: number;
};

export const AMBIENT_SCENES: AmbientScene[] = [
  {
    id: "profundo",
    label: "Profundo",
    colors: ["#0D1F1B", "#183A36"] as const,
    icon: "feather",
    image: require("@/assets/images/ambient/bosque.jpg"),
  },
  {
    id: "tibet",
    label: "Tibet",
    colors: ["#2A040F", "#19020A"] as const,
    icon: "star",
    image: require("@/assets/images/ambient/nebulosa.png"),
  },
  {
    id: "naturaleza",
    label: "Naturaleza",
    colors: ["#1A5C2A", "#6AB46D"] as const,
    icon: "sun",
    image: require("@/assets/images/ambient/naturaleza.jpg"),
  },
  {
    id: "musgo",
    label: "Musgo",
    colors: ["#28483E", "#101A16"] as const,
    icon: "feather",
    image: require("@/assets/images/ambient/musgo.png"),
  },
  {
    id: "zafiro",
    label: "Zafiro",
    colors: ["#156394", "#2E2F7F"] as const,
    icon: "star",
    image: require("@/assets/images/ambient/zafiro.png"),
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
    id: "nebulosa",
    label: "Nebulosa",
    colors: ["#351E62", "#113071"] as const,
    icon: "star",
    image: require("@/assets/images/ambient/nebulosa.png"),
  },
  {
    id: "viento",
    label: "Viento",
    colors: ["#6E8FA8", "#C5D9E8"] as const,
    icon: "wind",
    image: require("@/assets/images/ambient/viento.jpg"),
  },
  {
    id: "solaris",
    label: "Solaris",
    colors: ["#4C2245", "#2A1A2F"] as const,
    icon: "star",
    image: require("@/assets/images/ambient/nebulosa.png"),
  },
];

const DEFAULT_VOLUME = 0.49; // 0.65 − 25%
const FADE_STEPS = 25;
const FADE_MS = 1000;

async function fadeIn(sound: Audio.Sound, targetVolume: number) {
  const stepMs = FADE_MS / FADE_STEPS;
  for (let i = 1; i <= FADE_STEPS; i++) {
    await new Promise<void>((r) => setTimeout(r, stepMs));
    try { await sound.setVolumeAsync((i / FADE_STEPS) * targetVolume); } catch { break; }
  }
}

// ── Audio sources per scene ───────────────────────────────────────────────────
const SCENE_AUDIO: Record<SceneId, unknown> = {
  profundo:   require("@/assets/audio/riachuelo_pajaros.mp3"), // → replace with profundo.mp3
  tibet:      require("@/assets/audio/nebulosa_ambiente.mp3"), // → replace with tibet.mp3
  naturaleza: require("@/assets/audio/pajaros_ambiente.mp3"),
  musgo:      require("@/assets/audio/musgo_ambiente.mp3"),
  zafiro:     require("@/assets/audio/zafiro_ambiente.mp3"),
  bosque:     require("@/assets/audio/riachuelo_pajaros.mp3"),
  lluvia:     require("@/assets/audio/riachuelo_stream.mp3"),   // → replace with lluvia.mp3
  nebulosa:   require("@/assets/audio/nebulosa_ambiente.mp3"),
  viento:     require("@/assets/audio/pajaros_ambiente.mp3"),   // → replace with viento.mp3
  solaris:    require("@/assets/audio/nebulosa_ambiente.mp3"),  // → replace with solaris.mp3
};

type AmbientCtx = {
  currentScene: AmbientScene;
  isPlaying: boolean;
  isMuted: boolean;
  /** Volumen (0–1) de la escena activa. Independiente del Mezclador y de las sesiones. */
  volume: number;
  setVolume: (v: number) => void;
  setScene: (id: SceneId) => Promise<void>;
  togglePlayback: () => Promise<void>;
  stopAmbient: () => Promise<void>;
  startAmbient: () => Promise<void>;
  /** Panel "Escenas" (bottom sheet), montado globalmente en app/_layout.tsx. */
  isSheetOpen: boolean;
  openSheet: () => void;
  closeSheet: () => void;
  /** Temporizador para detener el sonido de escena automáticamente. Segundos restantes o null (sin límite). */
  sleepTimerRemaining: number | null;
  setSleepTimer: (minutes: number | null) => void;
};

const AmbientContext = createContext<AmbientCtx | null>(null);

const STORAGE_KEY = "@ambient_scene";

const DEFAULT_VOLUMES: Record<SceneId, number> = {
  profundo: DEFAULT_VOLUME,
  tibet: DEFAULT_VOLUME,
  naturaleza: DEFAULT_VOLUME,
  musgo: DEFAULT_VOLUME,
  zafiro: DEFAULT_VOLUME,
  bosque: DEFAULT_VOLUME,
  lluvia: DEFAULT_VOLUME,
  nebulosa: DEFAULT_VOLUME,
  viento: DEFAULT_VOLUME,
  solaris: DEFAULT_VOLUME,
};

export function AmbientPlayerProvider({ children }: { children: React.ReactNode }) {
  const [currentSceneId, setCurrentSceneId] = useState<SceneId>("profundo");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volumes, setVolumes] = useState<Record<SceneId, number>>(DEFAULT_VOLUMES);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [sleepTimerRemaining, setSleepTimerRemaining] = useState<number | null>(null);
  const sleepIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sleepEndTimeRef = useRef<number | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const loadedSceneRef = useRef<SceneId | null>(null);
  // Refs so callbacks can read latest state without re-creating
  const isPlayingRef = useRef(false);
  const isMutedRef = useRef(false);
  const currentSceneIdRef = useRef<SceneId>("profundo");
  const volumesRef = useRef<Record<SceneId, number>>(DEFAULT_VOLUMES);
  // expo-av session is configured lazily on first ambient use, never at launch.
  const sessionConfiguredRef = useRef(false);

  isPlayingRef.current = isPlaying;
  isMutedRef.current = isMuted;
  currentSceneIdRef.current = currentSceneId;
  volumesRef.current = volumes;

  const currentScene = AMBIENT_SCENES.find((s) => s.id === currentSceneId)!;
  const volume = volumes[currentSceneId];

  // Configure the expo-av audio session lazily — ONLY on first ambient use, never
  // at launch. Calling expo-av's Audio.setAudioModeAsync at startup races with the
  // expo-audio session setup (PlayerContext); under the New Architecture the
  // resulting native NSException is uncatchable and aborts the app (SIGABRT) ~1s
  // after launch. Wrapped in try/catch as an extra guard.
  const ensureAmbientSession = useCallback(async () => {
    if (sessionConfiguredRef.current) return;
    try {
      // staysActiveInBackground MUST be true: this expo-av session shares the single
      // native audio session with the expo-audio player. If it were false, locking
      // the screen would deactivate the whole session and cut off the main audio.
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
      });
      sessionConfiguredRef.current = true; // mark only after success → allow retry on failure
    } catch (e) {
      console.warn("[Ambient] setAudioMode failed:", e);
    }
  }, []);

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
    await ensureAmbientSession();
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
  }, [unload, ensureAmbientSession]);

  const loadAndPlay = useCallback(async (sceneId: SceneId) => {
    console.warn(`[Ambient] loadAndPlay scene=${sceneId} loaded=${loadedSceneRef.current}`);
    await ensureAmbientSession();
    const targetVolume = volumesRef.current[sceneId] ?? DEFAULT_VOLUME;
    if (loadedSceneRef.current !== sceneId) {
      await unload();
      try {
        const { sound } = await Audio.Sound.createAsync(
          SCENE_AUDIO[sceneId] as Parameters<typeof Audio.Sound.createAsync>[0],
          { shouldPlay: true, isLooping: true, volume: targetVolume }
        );
        soundRef.current = sound;
        loadedSceneRef.current = sceneId;
        console.warn(`[Ambient] playing new sound for ${sceneId}`);
      } catch (e) {
        console.warn("[Ambient] load failed:", e);
      }
    } else {
      // Already pre-loaded — play at its configured volume
      const sound = soundRef.current;
      if (sound) {
        try { await sound.setVolumeAsync(targetVolume); } catch {}
        try { await sound.playAsync(); } catch {}
        console.warn(`[Ambient] playing preloaded sound for ${sceneId}`);
      }
    }
  }, [unload, ensureAmbientSession]);

  /** Ajusta el volumen (0–1) de la escena activa. Se aplica en vivo si está sonando. */
  const setVolume = useCallback((v: number) => {
    const clamped = Math.max(0, Math.min(1, v));
    const sceneId = currentSceneIdRef.current;
    setVolumes((prev) => ({ ...prev, [sceneId]: clamped }));
    if (loadedSceneRef.current === sceneId && soundRef.current && isPlayingRef.current && !isMutedRef.current) {
      soundRef.current.setVolumeAsync(clamped).catch(() => {});
    }
  }, []);

  // On mount: set the initial scene state ONLY. We deliberately do NOT touch the
  // native audio session or load any expo-av sound at launch — doing so races with
  // the expo-audio session setup (PlayerContext) and, under the New Architecture, an
  // NSException from the audio TurboModule is uncatchable and aborts the app
  // (SIGABRT) ~1s after launch. The expo-av session + default scene are now loaded
  // lazily on first ambient use (ensureAmbientSession + preload/loadAndPlay).
  useEffect(() => {
    // Always start on "profundo" (first scene) — ignore saved preference on cold start.
    // User can still switch scenes during the session.
    AsyncStorage.setItem(STORAGE_KEY, "profundo").catch(() => {});
    setCurrentSceneId("profundo");

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

  const stopAmbientRef = useRef(stopAmbient);
  stopAmbientRef.current = stopAmbient;

  // Called from HomeScreen after onboarding — sound is already pre-loaded, plays instantly
  const startAmbient = useCallback(async () => {
    console.warn(`[Ambient] startAmbient called isPlaying=${isPlayingRef.current} scene=${currentSceneIdRef.current}`);
    if (isPlayingRef.current) return;
    setIsPlaying(true);
    setIsMuted(false);
    await loadAndPlay(currentSceneIdRef.current);
  }, [loadAndPlay]);

  const openSheet = useCallback(() => setIsSheetOpen(true), []);
  const closeSheet = useCallback(() => setIsSheetOpen(false), []);

  const clearSleepTimer = useCallback(() => {
    if (sleepIntervalRef.current) {
      clearInterval(sleepIntervalRef.current);
      sleepIntervalRef.current = null;
    }
    sleepEndTimeRef.current = null;
    setSleepTimerRemaining(null);
  }, []);

  /** "Reproducir sonidos fuera de la aplicación": temporizador que detiene el
   *  sonido de escena automáticamente tras N minutos (independiente del audio
   *  principal — sigue sonando en background hasta que el timer expira). */
  const setSleepTimer = useCallback((minutes: number | null) => {
    if (sleepIntervalRef.current) {
      clearInterval(sleepIntervalRef.current);
      sleepIntervalRef.current = null;
    }
    if (minutes == null) {
      sleepEndTimeRef.current = null;
      setSleepTimerRemaining(null);
      return;
    }
    const endTime = Date.now() + minutes * 60 * 1000;
    sleepEndTimeRef.current = endTime;
    setSleepTimerRemaining(minutes * 60);

    sleepIntervalRef.current = setInterval(() => {
      const endTs = sleepEndTimeRef.current;
      if (endTs == null) return;
      const remaining = Math.ceil((endTs - Date.now()) / 1000);
      if (remaining <= 0) {
        if (sleepIntervalRef.current) {
          clearInterval(sleepIntervalRef.current);
          sleepIntervalRef.current = null;
        }
        sleepEndTimeRef.current = null;
        setSleepTimerRemaining(null);
        stopAmbientRef.current();
      } else {
        setSleepTimerRemaining(remaining);
      }
    }, 1000);
  }, []);

  // setInterval se throttlea en background; al reanudar recalculamos con Date.now()
  useEffect(() => {
    const handleAppState = (nextState: AppStateStatus) => {
      if (nextState !== "active") return;
      const endTs = sleepEndTimeRef.current;
      if (endTs == null) return;
      const remaining = Math.ceil((endTs - Date.now()) / 1000);
      if (remaining <= 0) {
        clearSleepTimer();
        stopAmbientRef.current();
      } else {
        setSleepTimerRemaining(remaining);
      }
    };
    const sub = AppState.addEventListener("change", handleAppState);
    return () => sub.remove();
  }, [clearSleepTimer]);

  return (
    <AmbientContext.Provider
      value={{
        currentScene,
        isPlaying,
        isMuted,
        volume,
        setVolume,
        setScene,
        togglePlayback,
        stopAmbient,
        startAmbient,
        isSheetOpen,
        openSheet,
        closeSheet,
        sleepTimerRemaining,
        setSleepTimer,
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
