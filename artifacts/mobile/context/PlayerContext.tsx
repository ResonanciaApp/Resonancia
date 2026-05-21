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
  /** Real duration in seconds from the audio file (or session.duration * 60 in simulation mode) */
  actualDurationSeconds: number;
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
  const [actualDurationSeconds, setActualDurationSeconds] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);

  // Real audio (expo-av)
  const soundRef = useRef<Audio.Sound | null>(null);
  // Simulation fallback (when no audioFile)
  const simIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(FAVORITES_KEY).then((val) => {
      if (val) setFavorites(JSON.parse(val));
    });
  }, []);

  useEffect(() => {
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
    });
  }, []);

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

  const onPlaybackStatusUpdate = useCallback((status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;
    const durMs = status.durationMillis ?? 0;
    const posMs = status.positionMillis ?? 0;

    // Always keep actual duration up to date from the real file
    if (durMs > 0) {
      setActualDurationSeconds(Math.floor(durMs / 1000));
      setProgress(posMs / durMs);
    }
    setElapsed(Math.floor(posMs / 1000));
    setIsPlaying(status.isPlaying);

    if (status.didJustFinish) {
      setIsPlaying(false);
      setProgress(1);
    }
  }, []);

  const startSimulation = (session: Session) => {
    const totalSeconds = session.duration * 60;
    setActualDurationSeconds(totalSeconds);
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

  const playSession = useCallback(
    async (session: Session) => {
      await unloadSound();
      clearSim();

      setCurrentSession(session);
      setProgress(0);
      setElapsed(0);
      // Optimistically set declared duration; real value overwrites once loaded
      setActualDurationSeconds(session.duration * 60);

      const audioFile = AUDIO_MAP[session.id];

      if (audioFile) {
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
        startSimulation(session);
      }
    },
    [onPlaybackStatusUpdate]
  );

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
    setActualDurationSeconds(0);
  }, []);

  const seekTo = useCallback(
    async (p: number) => {
      const clamped = Math.max(0, Math.min(1, p));
      setProgress(clamped);
      if (soundRef.current) {
        // Use real file duration for seeking
        const status = await soundRef.current.getStatusAsync();
        if (status.isLoaded && status.durationMillis) {
          const posMs = clamped * status.durationMillis;
          setElapsed(Math.floor(posMs / 1000));
          try {
            await soundRef.current.setPositionAsync(posMs);
          } catch (_) {}
        }
      } else if (currentSession) {
        // Simulation: use actualDurationSeconds
        const posSeconds = clamped * actualDurationSeconds;
        setElapsed(Math.floor(posSeconds));
      }
    },
    [currentSession, actualDurationSeconds]
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
        actualDurationSeconds,
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
