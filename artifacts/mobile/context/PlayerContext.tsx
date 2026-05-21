import AsyncStorage from "@react-native-async-storage/async-storage";
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
  const [favorites, setFavorites] = useState<string[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(FAVORITES_KEY).then((val) => {
      if (val) setFavorites(JSON.parse(val));
    });
  }, []);

  useEffect(() => {
    if (isPlaying && currentSession) {
      const totalSeconds = currentSession.duration * 60;
      intervalRef.current = setInterval(() => {
        setElapsed((prev) => {
          const next = prev + 1;
          if (next >= totalSeconds) {
            setIsPlaying(false);
            setProgress(1);
            return totalSeconds;
          }
          setProgress(next / totalSeconds);
          return next;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, currentSession]);

  const playSession = useCallback((session: Session) => {
    setCurrentSession(session);
    setIsPlaying(true);
    setProgress(0);
    setElapsed(0);
  }, []);

  const pauseResume = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  const stop = useCallback(() => {
    setCurrentSession(null);
    setIsPlaying(false);
    setProgress(0);
    setElapsed(0);
  }, []);

  const seekTo = useCallback((p: number) => {
    setProgress(p);
    if (currentSession) {
      setElapsed(Math.floor(p * currentSession.duration * 60));
    }
  }, [currentSession]);

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
