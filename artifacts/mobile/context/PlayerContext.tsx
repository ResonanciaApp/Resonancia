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

export interface HistoryEntry {
  sessionId: string;
  playedAt: string;
}

type PlayerContextType = {
  currentSession: Session | null;
  isPlaying: boolean;
  progress: number;
  elapsed: number;
  actualDurationSeconds: number;
  isLoading: boolean;
  favorites: string[];
  history: HistoryEntry[];
  isFavorite: (id: string) => boolean;
  toggleFavorite: (id: string) => void;
  playSession: (session: Session) => void;
  pauseResume: () => void;
  stop: () => void;
  seekTo: (progress: number) => void;
  /** Remaining sleep timer seconds, or null if inactive */
  sleepTimerRemaining: number | null;
  /** Set timer to N minutes (null = cancel) */
  setSleepTimer: (minutes: number | null) => void;
  /** Wipe the full listening history */
  clearHistory: () => Promise<void>;
};

const PlayerContext = createContext<PlayerContextType | null>(null);

const FAVORITES_KEY = "@resonance_favorites";
const HISTORY_KEY = "@resonance_history";
const HISTORY_LIMIT = 50;

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [actualDurationSeconds, setActualDurationSeconds] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [sleepTimerRemaining, setSleepTimerRemaining] = useState<number | null>(null);

  const soundRef = useRef<Audio.Sound | null>(null);
  const simIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sleepIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Keep latest isPlaying in a ref so timer callbacks see the current value
  const isPlayingRef = useRef(false);
  isPlayingRef.current = isPlaying;

  useEffect(() => {
    AsyncStorage.getItem(FAVORITES_KEY).then((val) => {
      if (val) setFavorites(JSON.parse(val));
    });
    AsyncStorage.getItem(HISTORY_KEY).then((val) => {
      if (!val) return;
      const parsed: HistoryEntry[] = JSON.parse(val);
      const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
      const filtered = parsed.filter((e) => new Date(e.playedAt).getTime() > cutoff);
      if (filtered.length !== parsed.length) {
        AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(filtered));
      }
      setHistory(filtered);
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
      clearSleepInterval();
    };
  }, []);

  // ── Sleep timer tick ────────────────────────────────────────────────────────
  // Start/stop the countdown interval whenever playing state or timer active/inactive changes
  useEffect(() => {
    clearSleepInterval();
    if (!isPlaying || sleepTimerRemaining === null) return;

    sleepIntervalRef.current = setInterval(() => {
      setSleepTimerRemaining((prev) => {
        if (prev === null) return null;
        if (prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);

    return () => clearSleepInterval();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, sleepTimerRemaining !== null]);

  // When countdown hits 0 — stop audio
  useEffect(() => {
    if (sleepTimerRemaining !== 0) return;
    clearSleepInterval();
    setSleepTimerRemaining(null);
    // Stop audio without wiping the session from UI
    unloadSound();
    clearSim();
    setIsPlaying(false);
  }, [sleepTimerRemaining]);
  // ────────────────────────────────────────────────────────────────────────────

  const clearSleepInterval = () => {
    if (sleepIntervalRef.current) {
      clearInterval(sleepIntervalRef.current);
      sleepIntervalRef.current = null;
    }
  };

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

  const addToHistory = useCallback(async (session: Session) => {
    setHistory((prev) => {
      const filtered = prev.filter((e) => e.sessionId !== session.id);
      const updated = [
        { sessionId: session.id, playedAt: new Date().toISOString() },
        ...filtered,
      ].slice(0, HISTORY_LIMIT);
      AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const playSession = useCallback(
    async (session: Session) => {
      await unloadSound();
      clearSim();

      setCurrentSession(session);
      setProgress(0);
      setElapsed(0);
      setActualDurationSeconds(session.duration * 60);
      void addToHistory(session);

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
    clearSleepInterval();
    setSleepTimerRemaining(null);
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
        const status = await soundRef.current.getStatusAsync();
        if (status.isLoaded && status.durationMillis) {
          const posMs = clamped * status.durationMillis;
          setElapsed(Math.floor(posMs / 1000));
          try {
            await soundRef.current.setPositionAsync(posMs);
          } catch (_) {}
        }
      } else if (currentSession) {
        const posSeconds = clamped * actualDurationSeconds;
        setElapsed(Math.floor(posSeconds));
      }
    },
    [currentSession, actualDurationSeconds]
  );

  const setSleepTimer = useCallback((minutes: number | null) => {
    clearSleepInterval();
    if (minutes === null) {
      setSleepTimerRemaining(null);
      return;
    }
    setSleepTimerRemaining(minutes * 60);
  }, []);

  const clearHistory = useCallback(async () => {
    setHistory([]);
    await AsyncStorage.removeItem(HISTORY_KEY);
  }, []);

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
        history,
        isFavorite,
        toggleFavorite,
        playSession,
        pauseResume,
        stop,
        seekTo,
        sleepTimerRemaining,
        setSleepTimer,
        clearHistory,
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
