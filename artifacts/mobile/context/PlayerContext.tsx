import { Audio, AVPlaybackStatus } from "expo-av";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AUDIO_MAP } from "@/config/audio-map";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { type Session } from "@/data/sessions";

type PlayerContextType = {
  currentSession: Session | null;
  isPlaying: boolean;
  progress: number;
  elapsed: number;
  isLoading: boolean;
  favorites: string[];
  isFavorite: (id: string) => boolean;
  toggleFavorite: (id: string) => void;
  playSession: (session: Session) => void;
  pauseResume: () => void;
  stop: () => void;
  seekTo: (progress: number) => void;
};

const PlayerContext = createContext<PlayerContextType | null>(null);

const FAVORITES_KEY = "@resonance_favorites";

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);

  // Real audio (expo-av)
  const soundRef = useRef<Audio.Sound | null>(null);
  // Simulation fallback (when no audioFile)
  const simIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load favorites from storage on mount
  useEffect(() => {
    AsyncStorage.getItem(FAVORITES_KEY).then((val) => {
      if (val) setFavorites(JSON.parse(val));
    });
  }, []);

  // Configure audio session once
  useEffect(() => {
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
    });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      unloadSound();
      clearSim();
    };
  }, []);

  const unloadSound = async () => {
    if (soundRef.current) {
      try {
        await soundRef.current.unloadAsync();
      } catch (_) {}
      soundRef.current = null;
    }
  };

  const clearSim = () => {
    if (simIntervalRef.current) {
      clearInterval(simIntervalRef.current);
      simIntervalRef.current = null;
    }
  };

  const onPlaybackStatusUpdate = useCallback(
    (status: AVPlaybackStatus) => {
      if (!status.isLoaded) return;
      const dur = status.durationMillis ?? 1;
      const pos = status.positionMillis ?? 0;
      setProgress(pos / dur);
      setElapsed(Math.floor(pos / 1000));
      setIsPlaying(status.isPlaying);
      if (status.didJustFinish) {
        setIsPlaying(false);
        setProgress(1);
      }
    },
    []
  );

  const playSession = useCallback(
    async (session: Session) => {
      // Stop anything currently playing
      await unloadSound();
      clearSim();

      setCurrentSession(session);
      setProgress(0);
      setElapsed(0);

      const audioFile = AUDIO_MAP[session.id];

      if (audioFile) {
        // ── Real audio via expo-av ──────────────────────────────────────────
        setIsLoading(true);
        try {
          const { sound } = await Audio.Sound.createAsync(
            audioFile,
            { shouldPlay: true, progressUpdateIntervalMillis: 500 },
            onPlaybackStatusUpdate
          );
          soundRef.current = sound;
          setIsPlaying(true);
        } catch (err) {
          console.warn("[RESONANCE] Audio load failed:", err);
          startSimulation(session);
        } finally {
          setIsLoading(false);
        }
      } else {
        // ── Simulation mode (no file attached yet) ─────────────────────────
        startSimulation(session);
      }
    },
    [onPlaybackStatusUpdate]
  );

  const startSimulation = (session: Session) => {
    const totalSeconds = session.duration * 60;
    setIsPlaying(true);
    simIntervalRef.current = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 1;
        if (next >= totalSeconds) {
          clearSim();
          setIsPlaying(false);
          setProgress(1);
          return totalSeconds;
        }
        setProgress(next / totalSeconds);
        return next;
      });
    }, 1000);
  };

  const pauseResume = useCallback(async () => {
    if (soundRef.current) {
      const status = await soundRef.current.getStatusAsync();
      if (!status.isLoaded) return;
      if (status.isPlaying) {
        await soundRef.current.pauseAsync();
        setIsPlaying(false);
      } else {
        await soundRef.current.playAsync();
        setIsPlaying(true);
      }
    } else {
      // Simulation mode toggle
      setIsPlaying((prev) => {
        if (prev) {
          clearSim();
        } else if (currentSession) {
          startSimulation(currentSession);
        }
        return !prev;
      });
    }
  }, [currentSession]);

  const stop = useCallback(async () => {
    await unloadSound();
    clearSim();
    setCurrentSession(null);
    setIsPlaying(false);
    setProgress(0);
    setElapsed(0);
  }, []);

  const seekTo = useCallback(
    async (p: number) => {
      const clamped = Math.max(0, Math.min(1, p));
      setProgress(clamped);
      if (currentSession) {
        const posMs = clamped * currentSession.duration * 60 * 1000;
        setElapsed(Math.floor(posMs / 1000));
        if (soundRef.current) {
          try {
            await soundRef.current.setPositionAsync(posMs);
          } catch (_) {}
        }
      }
    },
    [currentSession]
  );

  const toggleFavorite = useCallback(
    async (id: string) => {
      const updated = favorites.includes(id)
        ? favorites.filter((f) => f !== id)
        : [...favorites, id];
      setFavorites(updated);
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
    },
    [favorites]
  );

  const isFavorite = useCallback(
    (id: string) => favorites.includes(id),
    [favorites]
  );

  return (
    <PlayerContext.Provider
      value={{
        currentSession,
        isPlaying,
        progress,
        elapsed,
        isLoading,
        favorites,
        isFavorite,
        toggleFavorite,
        playSession,
        pauseResume,
        stop,
        seekTo,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used within PlayerProvider");
  return ctx;
}
