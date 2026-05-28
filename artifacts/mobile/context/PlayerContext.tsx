import { Audio, AVPlaybackStatus } from "expo-av";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AMBIENT_MAP, AUDIO_MAP, LOOP_SESSIONS, VOICE_MAP } from "@/config/audio-map";
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
  /** Per-session saved progress (0-1), keyed by session id */
  sessionProgress: Record<string, number>;
  /** Get saved progress for a session id (0 if none) */
  getSessionProgress: (id: string) => number;
  isFavorite: (id: string) => boolean;
  toggleFavorite: (id: string) => void;
  playSession: (session: Session) => void;
  /** Play a looping session for a specific number of minutes */
  playSessionWithDuration: (session: Session, minutes: number) => void;
  pauseResume: () => void;
  stop: () => void;
  seekTo: (progress: number) => void;
  /** Remaining sleep timer seconds, or null if inactive */
  sleepTimerRemaining: number | null;
  /** Set timer to N minutes (null = cancel) */
  setSleepTimer: (minutes: number | null) => void;
  /** Wipe the full listening history */
  clearHistory: () => Promise<void>;
  /** Whether the current session has a voice track */
  hasVoiceTrack: boolean;
  /** Voice track volume 0–1 */
  voiceVolume: number;
  /** Set voice track volume 0–1 */
  setVoiceVolume: (volume: number) => void;
  /** Whether the current session has an ambient sound layer (e.g. birds) */
  hasAmbientTrack: boolean;
  /** Ambient layer volume 0–1 */
  ambientVolume: number;
  /** Set ambient layer volume 0–1 */
  setAmbientVolume: (volume: number) => void;
};

const PlayerContext = createContext<PlayerContextType | null>(null);

const FAVORITES_KEY = "@resonance_favorites";
const HISTORY_KEY = "@resonance_history";
const SESSION_PROGRESS_KEY = "@resonance_session_progress";
const HISTORY_LIMIT = 50;
/** Progress >= this value is treated as "completed" and cleared */
const COMPLETED_THRESHOLD = 0.97;
/** Minimum delta before persisting progress to AsyncStorage */
const PROGRESS_SAVE_DELTA = 0.02;

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [actualDurationSeconds, setActualDurationSeconds] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [sessionProgress, setSessionProgress] = useState<Record<string, number>>({});
  const [sleepTimerRemaining, setSleepTimerRemaining] = useState<number | null>(null);

  /** Last persisted progress per session id — to throttle AsyncStorage writes */
  const lastSavedProgressRef = useRef<Record<string, number>>({});
  /** Latest in-memory progress map — for use inside async callbacks */
  const sessionProgressRef = useRef<Record<string, number>>({});

  const [voiceVolume, setVoiceVolumeState] = useState(0.8);
  const [ambientVolume, setAmbientVolumeState] = useState(0.7);

  const soundRef = useRef<Audio.Sound | null>(null);
  const voiceSoundRef = useRef<Audio.Sound | null>(null);
  const ambientSoundRef = useRef<Audio.Sound | null>(null);
  const simIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const preloadedRef = useRef<Map<string, Audio.Sound>>(new Map());
  const preloadedVoiceRef = useRef<Map<string, Audio.Sound>>(new Map());
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
    AsyncStorage.getItem(SESSION_PROGRESS_KEY).then((val) => {
      if (!val) return;
      try {
        const parsed: Record<string, number> = JSON.parse(val);
        sessionProgressRef.current = parsed;
        lastSavedProgressRef.current = { ...parsed };
        setSessionProgress(parsed);
      } catch (_) {}
    });
  }, []);

  /** Persist current progress map to AsyncStorage (fire-and-forget) */
  const persistProgress = useCallback(() => {
    AsyncStorage.setItem(
      SESSION_PROGRESS_KEY,
      JSON.stringify(sessionProgressRef.current),
    ).catch(() => {});
  }, []);

  /** Save progress for a session id; throttles writes by PROGRESS_SAVE_DELTA */
  const saveSessionProgress = useCallback(
    (id: string, p: number, opts?: { force?: boolean }) => {
      const clamped = Math.max(0, Math.min(1, p));
      if (clamped >= COMPLETED_THRESHOLD) {
        // Treat as completed → clear saved progress
        if (sessionProgressRef.current[id] !== undefined) {
          const next = { ...sessionProgressRef.current };
          delete next[id];
          sessionProgressRef.current = next;
          delete lastSavedProgressRef.current[id];
          setSessionProgress(next);
          persistProgress();
        }
        return;
      }
      const last = lastSavedProgressRef.current[id] ?? -1;
      if (!opts?.force && Math.abs(clamped - last) < PROGRESS_SAVE_DELTA) return;
      const next = { ...sessionProgressRef.current, [id]: clamped };
      sessionProgressRef.current = next;
      lastSavedProgressRef.current[id] = clamped;
      setSessionProgress(next);
      persistProgress();
    },
    [persistProgress],
  );

  const getSessionProgress = useCallback(
    (id: string) => sessionProgressRef.current[id] ?? 0,
    [],
  );

  useEffect(() => {
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: false,
    });
  }, []);

  useEffect(() => {
    return () => {
      unloadSound();
      unloadVoiceSound();
      clearSim();
      clearSleepInterval();
      preloadedRef.current.forEach((s) => s.unloadAsync().catch(() => {}));
      preloadedRef.current.clear();
      preloadedVoiceRef.current.forEach((s) => s.unloadAsync().catch(() => {}));
      preloadedVoiceRef.current.clear();
    };
  }, []);

  // ── Audio preloading ─────────────────────────────────────────────────────────
  // Preload all mapped audio files 1.5 s after mount so the first tap plays instantly
  useEffect(() => {
    let mounted = true;
    const timer = setTimeout(async () => {
      for (const [id, file] of Object.entries(AUDIO_MAP)) {
        if (!file || !mounted) break;
        try {
          const { sound } = await Audio.Sound.createAsync(file as any, { shouldPlay: false });
          if (mounted) preloadedRef.current.set(id, sound);
          else sound.unloadAsync().catch(() => {});
        } catch (_) {}
      }
      for (const [id, file] of Object.entries(VOICE_MAP)) {
        if (!file || !mounted) break;
        try {
          const { sound } = await Audio.Sound.createAsync(file as any, { shouldPlay: false });
          if (mounted) preloadedVoiceRef.current.set(id, sound);
          else sound.unloadAsync().catch(() => {});
        } catch (_) {}
      }
    }, 1500);
    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, []);
  // ────────────────────────────────────────────────────────────────────────────

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

  const unloadVoiceSound = async () => {
    if (voiceSoundRef.current) {
      try { await voiceSoundRef.current.unloadAsync(); } catch (_) {}
      voiceSoundRef.current = null;
    }
  };

  const unloadAmbientSound = async () => {
    if (ambientSoundRef.current) {
      try { await ambientSoundRef.current.unloadAsync(); } catch (_) {}
      ambientSoundRef.current = null;
    }
  };

  const unloadSound = async () => {
    await unloadVoiceSound();
    await unloadAmbientSound();
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

  /** Latest currentSession in a ref — for use inside playback callbacks */
  const currentSessionRef = useRef<Session | null>(null);
  currentSessionRef.current = currentSession;

  const onPlaybackStatusUpdate = useCallback(
    (status: AVPlaybackStatus) => {
      if (!status.isLoaded) return;
      const durMs = status.durationMillis ?? 0;
      const posMs = status.positionMillis ?? 0;

      if (durMs > 0) {
        setActualDurationSeconds(Math.floor(durMs / 1000));
        const p = posMs / durMs;
        setProgress(p);
        const sId = currentSessionRef.current?.id;
        if (sId) saveSessionProgress(sId, p);
      }
      setElapsed(Math.floor(posMs / 1000));
      setIsPlaying(status.isPlaying);

      if (status.didJustFinish) {
        setIsPlaying(false);
        setProgress(1);
        const sId = currentSessionRef.current?.id;
        if (sId) saveSessionProgress(sId, 1, { force: true });
      }
    },
    [saveSessionProgress],
  );

  const startSimulation = (session: Session) => {
    const totalSeconds = session.duration * 60;
    setActualDurationSeconds(totalSeconds);
    setIsPlaying(true);
    simIntervalRef.current = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 1;
        const sId = currentSessionRef.current?.id;
        if (next >= totalSeconds) {
          clearSim();
          setIsPlaying(false);
          setProgress(1);
          if (sId) saveSessionProgress(sId, 1, { force: true });
          return totalSeconds;
        }
        const p = next / totalSeconds;
        setProgress(p);
        if (sId) saveSessionProgress(sId, p);
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
      const savedProgress = sessionProgressRef.current[session.id] ?? 0;
      const resumeFraction =
        savedProgress > 0 && savedProgress < COMPLETED_THRESHOLD ? savedProgress : 0;
      setProgress(resumeFraction);
      setElapsed(0);
      setActualDurationSeconds(session.duration * 60);
      void addToHistory(session);

      const audioFile = AUDIO_MAP[session.id];

      if (audioFile) {
        setIsLoading(true);
        try {
          // Use preloaded sound if available, otherwise load fresh
          let sound: Audio.Sound;
          const preloaded = preloadedRef.current.get(session.id);
          if (preloaded) {
            preloadedRef.current.delete(session.id);
            sound = preloaded;
            sound.setOnPlaybackStatusUpdate(onPlaybackStatusUpdate);
            await sound.setPositionAsync(0);
            await sound.setStatusAsync({ shouldPlay: true, progressUpdateIntervalMillis: 500 });
          } else {
            const result = await Audio.Sound.createAsync(
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              audioFile as any,
              { shouldPlay: true, progressUpdateIntervalMillis: 500 },
              onPlaybackStatusUpdate
            );
            sound = result.sound;
          }
          soundRef.current = sound;

          // Resume from saved position
          if (resumeFraction > 0) {
            try {
              const status = await sound.getStatusAsync();
              if (status.isLoaded && status.durationMillis) {
                await sound.setPositionAsync(status.durationMillis * resumeFraction);
              }
            } catch (_) {}
          }

          // Load voice track if available (plays simultaneously)
          const voiceFile = VOICE_MAP[session.id];
          if (voiceFile) {
            try {
              let voiceSound: Audio.Sound;
              const preloadedVoice = preloadedVoiceRef.current.get(session.id);
              if (preloadedVoice) {
                preloadedVoiceRef.current.delete(session.id);
                voiceSound = preloadedVoice;
                await voiceSound.setPositionAsync(0);
                await voiceSound.setVolumeAsync(voiceVolume);
                await voiceSound.setStatusAsync({ shouldPlay: true, isLooping: false });
              } else {
                const result = await Audio.Sound.createAsync(
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  voiceFile as any,
                  { shouldPlay: true, volume: voiceVolume, isLooping: false }
                );
                voiceSound = result.sound;
              }
              voiceSoundRef.current = voiceSound;
            } catch (_) {}
          }

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

  /** Play a looping ambient/nature session for a chosen number of minutes */
  const playSessionWithDuration = useCallback(
    async (session: Session, minutes: number) => {
      await unloadSound();
      clearSim();

      const totalSeconds = minutes * 60;
      const sessionOverride: Session = {
        ...session,
        duration: minutes,
        durationLabel: `${minutes} min`,
      };

      setCurrentSession(sessionOverride);
      setProgress(0);
      setElapsed(0);
      setActualDurationSeconds(totalSeconds);
      void addToHistory(session);

      const audioFile = AUDIO_MAP[session.id];
      const isLoopSession = LOOP_SESSIONS.has(session.id);

      if (audioFile) {
        setIsLoading(true);
        try {
          let sound: Audio.Sound;
          const preloaded = preloadedRef.current.get(session.id);
          if (preloaded) {
            preloadedRef.current.delete(session.id);
            sound = preloaded;
            sound.setOnPlaybackStatusUpdate(null);
            await sound.setPositionAsync(0);
            await sound.setStatusAsync({ shouldPlay: true, isLooping: isLoopSession });
          } else {
            const result = await Audio.Sound.createAsync(
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              audioFile as any,
              { shouldPlay: true, isLooping: isLoopSession }
            );
            sound = result.sound;
          }
          soundRef.current = sound;

          // Load ambient layer (e.g. birds) if available
          const ambientFile = AMBIENT_MAP[session.id];
          if (ambientFile) {
            try {
              const { sound: ambientSound } = await Audio.Sound.createAsync(
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                ambientFile as any,
                { shouldPlay: true, isLooping: true, volume: ambientVolume }
              );
              ambientSoundRef.current = ambientSound;
            } catch (_) {}
          }

          setIsPlaying(true);

          // Drive progress with a countdown interval (audio loops indefinitely)
          simIntervalRef.current = setInterval(() => {
            setElapsed((prev) => {
              const next = prev + 1;
              const sId = currentSessionRef.current?.id;
              if (next >= totalSeconds) {
                clearSim();
                void sound.stopAsync().catch(() => {});
                void sound.unloadAsync().catch(() => {});
                soundRef.current = null;
                if (ambientSoundRef.current) {
                  void ambientSoundRef.current.stopAsync().catch(() => {});
                  void ambientSoundRef.current.unloadAsync().catch(() => {});
                  ambientSoundRef.current = null;
                }
                setIsPlaying(false);
                setProgress(1);
                if (sId) saveSessionProgress(sId, 1, { force: true });
                return totalSeconds;
              }
              const p = next / totalSeconds;
              setProgress(p);
              if (sId) saveSessionProgress(sId, p);
              return next;
            });
          }, 1000);
        } catch (err) {
          console.warn("[RESONANCE] Loop audio load failed:", err);
          startSimulation(sessionOverride);
        } finally {
          setIsLoading(false);
        }
      } else {
        startSimulation(sessionOverride);
      }
    },
    [addToHistory, ambientVolume]
  );

  const pauseResume = useCallback(async () => {
    if (soundRef.current) {
      const status = await soundRef.current.getStatusAsync();
      if (!status.isLoaded) return;
      if (status.isPlaying) {
        await soundRef.current.pauseAsync();
        if (voiceSoundRef.current) {
          try { await voiceSoundRef.current.pauseAsync(); } catch (_) {}
        }
        setIsPlaying(false);
        const sId = currentSessionRef.current?.id;
        if (sId && status.durationMillis) {
          saveSessionProgress(sId, (status.positionMillis ?? 0) / status.durationMillis, { force: true });
        }
      } else {
        await soundRef.current.playAsync();
        if (voiceSoundRef.current) {
          try { await voiceSoundRef.current.playAsync(); } catch (_) {}
        }
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
    // Force-save current progress before tearing down
    const sId = currentSessionRef.current?.id;
    if (sId && soundRef.current) {
      try {
        const status = await soundRef.current.getStatusAsync();
        if (status.isLoaded && status.durationMillis) {
          saveSessionProgress(sId, (status.positionMillis ?? 0) / status.durationMillis, { force: true });
        }
      } catch (_) {}
    } else if (sId && actualDurationSeconds > 0) {
      saveSessionProgress(sId, elapsed / actualDurationSeconds, { force: true });
    }
    await unloadSound();
    clearSim();
    clearSleepInterval();
    setSleepTimerRemaining(null);
    setCurrentSession(null);
    setIsPlaying(false);
    setProgress(0);
    setElapsed(0);
    setActualDurationSeconds(0);
  }, [saveSessionProgress, actualDurationSeconds, elapsed]);

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

  const setVoiceVolume = useCallback(async (volume: number) => {
    const clamped = Math.max(0, Math.min(1, volume));
    setVoiceVolumeState(clamped);
    if (voiceSoundRef.current) {
      try { await voiceSoundRef.current.setVolumeAsync(clamped); } catch (_) {}
    }
  }, []);

  const setAmbientVolume = useCallback(async (volume: number) => {
    const clamped = Math.max(0, Math.min(1, volume));
    setAmbientVolumeState(clamped);
    if (ambientSoundRef.current) {
      try { await ambientSoundRef.current.setVolumeAsync(clamped); } catch (_) {}
    }
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
        sessionProgress,
        getSessionProgress,
        isFavorite,
        toggleFavorite,
        playSession,
        playSessionWithDuration,
        pauseResume,
        stop,
        seekTo,
        sleepTimerRemaining,
        setSleepTimer,
        clearHistory,
        hasVoiceTrack: !!VOICE_MAP[currentSession?.id ?? ""],
        voiceVolume,
        setVoiceVolume,
        hasAmbientTrack: !!AMBIENT_MAP[currentSession?.id ?? ""],
        ambientVolume,
        setAmbientVolume,
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
