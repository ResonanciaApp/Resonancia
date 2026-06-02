import {
  type AudioPlayer,
  type AudioStatus,
  createAudioPlayer,
  setAudioModeAsync,
} from "expo-audio";
import { Image } from "react-native";
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
import {
  registerSessionStopper,
  stopMixPlayback,
} from "@/context/audioBridge";

export interface HistoryEntry {
  sessionId: string;
  playedAt: string;
}

/** A single play event used to derive activity stats (week minutes, streak, top category) */
export interface StatEvent {
  sessionId: string;
  categoryId: string;
  categoryLabel: string;
  minutes: number;
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
  /** Play events for activity stats (week minutes, streak, top category) */
  statEvents: StatEvent[];
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
  /** Update the default sleep timer preference (no aplica inmediatamente) */
  updateDefaultSleepTimer: (minutes: number | null) => void;
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
const STATS_KEY = "@resonance_stats";
const HISTORY_LIMIT = 50;
/** Keep stat events for this many days (older ones are pruned on load) */
const STATS_RETENTION_DAYS = 180;
/** Cap stored stat events to avoid unbounded growth */
const STATS_LIMIT = 600;
/** Minimum listened seconds before a stat event is recorded (ignores accidental taps) */
const STAT_MIN_SECONDS = 30;
/** Progress >= this value is treated as "completed" and cleared */
const COMPLETED_THRESHOLD = 0.97;
/** Minimum delta before persisting progress to AsyncStorage */
const PROGRESS_SAVE_DELTA = 0.02;

/** Resolve a bundled session image to a URI usable as lock screen artwork.
 *  expo-audio downloads this URL asynchronously (URLSession) and adds it to the
 *  Now Playing info once fetched. A failing download is harmless — the Now Playing
 *  entry is registered independently from the artwork — so we pass the URL through
 *  as-is. In dev, Metro serves a URL with a second "?" (".../foo.jpg?platform=ios
 *  &hash=..."); Swift's URL(string:) accepts it and the asset loads fine. */
function resolveArtworkUrl(session: Session): string | undefined {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const uri = Image.resolveAssetSource(session.image as any)?.uri;
    return uri || undefined;
  } catch (_) {
    return undefined;
  }
}

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [actualDurationSeconds, setActualDurationSeconds] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [statEvents, setStatEvents] = useState<StatEvent[]>([]);
  const [sessionProgress, setSessionProgress] = useState<Record<string, number>>({});
  const [sleepTimerRemaining, setSleepTimerRemaining] = useState<number | null>(null);
  const defaultSleepMinutesRef = useRef<number | null>(null);

  /** Last persisted progress per session id — to throttle AsyncStorage writes */
  const lastSavedProgressRef = useRef<Record<string, number>>({});
  /** Latest in-memory progress map — for use inside async callbacks */
  const sessionProgressRef = useRef<Record<string, number>>({});

  const [voiceVolume, setVoiceVolumeState] = useState(0.8);
  const [ambientVolume, setAmbientVolumeState] = useState(0.7);

  // ── expo-audio players (main + simultaneous voice/ambient layers) ─────────────
  const mainPlayerRef = useRef<AudioPlayer | null>(null);
  const voicePlayerRef = useRef<AudioPlayer | null>(null);
  const ambientPlayerRef = useRef<AudioPlayer | null>(null);
  const statusSubRef = useRef<{ remove: () => void } | null>(null);

  const simIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sleepIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /** True when the current session is backed by a real audio file (vs simulation) */
  const hasRealAudioRef = useRef(false);
  /** True for looping/duration-based sessions (progress driven by interval, not audio position) */
  const loopModeRef = useRef(false);
  /** Whether voice/ambient layers are active for the current session */
  const voiceActiveRef = useRef(false);
  const ambientActiveRef = useRef(false);
  /** Pending resume seek fraction, applied once the main track reports its duration */
  const pendingSeekRef = useRef<number | null>(null);
  /** Last known playing state of the main player — to mirror lock-screen play/pause onto layers */
  const lastPlayingRef = useRef(false);
  /** True while switching sessions — suppresses stale status events from the prior track */
  const switchingRef = useRef(false);

  // Keep latest isPlaying in a ref so timer callbacks see the current value
  const isPlayingRef = useRef(false);
  isPlayingRef.current = isPlaying;

  /** Session currently accruing real listen time (flushed to statEvents on end) */
  const statTrackerRef = useRef<Session | null>(null);
  /** Wall-clock accumulator of seconds actually played for the tracked session (seek-proof) */
  const listenedSecondsRef = useRef(0);
  /** Timestamp (ms) when the current play chunk started, or null while paused */
  const playStartRef = useRef<number | null>(null);
  /** Stable wrapper so completion handlers defined earlier can flush stats */
  const flushActiveStatRef = useRef<() => void>(() => {});

  // Keep latest volumes in refs for use inside async setup
  const voiceVolumeRef = useRef(voiceVolume);
  voiceVolumeRef.current = voiceVolume;
  const ambientVolumeRef = useRef(ambientVolume);
  ambientVolumeRef.current = ambientVolume;

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
    AsyncStorage.getItem("@resonance_settings").then((val) => {
      if (!val) return;
      try {
        const { defaultSleepMinutes } = JSON.parse(val);
        if (typeof defaultSleepMinutes === "number" || defaultSleepMinutes === null) {
          defaultSleepMinutesRef.current = defaultSleepMinutes ?? null;
        }
      } catch (_) {}
    });
    AsyncStorage.getItem(STATS_KEY).then((val) => {
      if (!val) return;
      try {
        const parsed: StatEvent[] = JSON.parse(val);
        const cutoff = Date.now() - STATS_RETENTION_DAYS * 24 * 60 * 60 * 1000;
        const filtered = parsed.filter((e) => new Date(e.playedAt).getTime() > cutoff);
        if (filtered.length !== parsed.length) {
          AsyncStorage.setItem(STATS_KEY, JSON.stringify(filtered)).catch(() => {});
        }
        setStatEvents(filtered);
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

  // NOTE: No configuramos la sesión de audio al montar. Hacerlo durante la
  // ventana de arranque (app aún no completamente en primer plano) hace que el
  // método nativo void del TurboModule lance una NSException no atrapable →
  // crash SIGABRT al abrir en iOS. La sesión se configura de forma diferida
  // (lazy) justo antes de la primera reproducción en playSession /
  // playSessionWithDuration, cuando la app ya está activa.

  /** Latest currentSession in a ref — for use inside playback callbacks */
  const currentSessionRef = useRef<Session | null>(null);
  currentSessionRef.current = currentSession;

  /**
   * Lock-screen / Now Playing activation se posterga hasta que el track cargó con
   * una duración válida. Si se llama justo tras replace() el AVPlayerItem aún no
   * cargó → player.duration = NaN, y iOS descarta TODA la entrada de Now Playing
   * ("Sin Reproducción"). Guardamos la sesión pendiente acá y disparamos la
   * activación desde handleMainStatus en el primer status cargado (duration > 0).
   */
  const lockScreenPendingRef = useRef<{
    session: Session;
    withSeek: boolean;
  } | null>(null);
  const activateLockScreenRef = useRef<
    ((session: Session, withSeek: boolean) => void) | null
  >(null);

  // ── Main player status handler (referenced via ref to stay current) ───────────
  const handleMainStatus = useCallback(
    (status: AudioStatus) => {
      if (!status.isLoaded) return;

      // Clear loading once the track is ready
      setIsLoading(false);

      // Activar lock-screen / Now Playing recién cuando el track tiene una
      // duración real. Hacerlo antes (justo tras replace()) escribe NaN en
      // MPNowPlayingInfoCenter y iOS descarta toda la entrada → "Sin Reproducción".
      if (lockScreenPendingRef.current && (status.duration ?? 0) > 0) {
        const pending = lockScreenPendingRef.current;
        lockScreenPendingRef.current = null;
        activateLockScreenRef.current?.(pending.session, pending.withSeek);
      }

      // Mirror lock-screen / system play-pause onto the simultaneous layers
      if (status.playing !== lastPlayingRef.current) {
        lastPlayingRef.current = status.playing;
        if (status.playing) {
          if (voiceActiveRef.current) voicePlayerRef.current?.play();
          if (ambientActiveRef.current) ambientPlayerRef.current?.play();
        } else {
          voicePlayerRef.current?.pause();
          ambientPlayerRef.current?.pause();
        }
        // While switching sessions we manage isPlaying manually — ignore stale toggles
        if (!switchingRef.current) setIsPlaying(status.playing);
      }

      // Loop/duration sessions are driven by the countdown interval, not audio position
      if (loopModeRef.current) return;

      const dur = status.duration ?? 0;
      const pos = status.currentTime ?? 0;

      // Apply a pending resume seek once we know the real duration, then skip the
      // rest of this tick so the pre-seek position is never persisted
      if (pendingSeekRef.current != null) {
        if (dur > 0) {
          const target = pendingSeekRef.current * dur;
          pendingSeekRef.current = null;
          switchingRef.current = false;
          setActualDurationSeconds(Math.floor(dur));
          mainPlayerRef.current?.seekTo(target).catch(() => {});
        }
        return;
      }

      // Skip the first tick after a session switch so the previous track's
      // position is never attributed to the new session
      if (switchingRef.current) {
        switchingRef.current = false;
        if (dur > 0) setActualDurationSeconds(Math.floor(dur));
        return;
      }

      if (dur > 0) {
        setActualDurationSeconds(Math.floor(dur));
        const p = pos / dur;
        setProgress(p);
        const sId = currentSessionRef.current?.id;
        if (sId) saveSessionProgress(sId, p);
      }
      setElapsed(Math.floor(pos));

      if (status.didJustFinish) {
        flushActiveStatRef.current();
        setIsPlaying(false);
        lastPlayingRef.current = false;
        voiceActiveRef.current = false;
        ambientActiveRef.current = false;
        voicePlayerRef.current?.pause();
        ambientPlayerRef.current?.pause();
        setProgress(1);
        const sId = currentSessionRef.current?.id;
        if (sId) saveSessionProgress(sId, 1, { force: true });
      }
    },
    [saveSessionProgress],
  );

  const handleMainStatusRef = useRef(handleMainStatus);
  handleMainStatusRef.current = handleMainStatus;

  /** Lazily create the persistent main player + attach its status listener */
  const ensureMainPlayer = useCallback((): AudioPlayer => {
    if (!mainPlayerRef.current) {
      const player = createAudioPlayer(null, { updateInterval: 500 });
      statusSubRef.current = player.addListener("playbackStatusUpdate", (s) =>
        handleMainStatusRef.current(s),
      );
      mainPlayerRef.current = player;
    }
    return mainPlayerRef.current;
  }, []);

  const ensureVoicePlayer = useCallback((): AudioPlayer => {
    if (!voicePlayerRef.current) {
      voicePlayerRef.current = createAudioPlayer(null);
    }
    return voicePlayerRef.current;
  }, []);

  const ensureAmbientPlayer = useCallback((): AudioPlayer => {
    if (!ambientPlayerRef.current) {
      ambientPlayerRef.current = createAudioPlayer(null);
    }
    return ambientPlayerRef.current;
  }, []);

  /** Pause the optional layers and mark them inactive */
  const teardownLayers = useCallback(() => {
    voicePlayerRef.current?.pause();
    ambientPlayerRef.current?.pause();
    voiceActiveRef.current = false;
    ambientActiveRef.current = false;
  }, []);

  /** Pause everything and clear the lock-screen now-playing info */
  const teardownPlayback = useCallback(() => {
    // Drop any not-yet-fired lock-screen activation so a late status update
    // can't re-register stale Now Playing info after stop / loop end.
    lockScreenPendingRef.current = null;
    try {
      mainPlayerRef.current?.pause();
      mainPlayerRef.current?.clearLockScreenControls();
    } catch (_) {}
    voicePlayerRef.current?.pause();
    ambientPlayerRef.current?.pause();
  }, []);

  useEffect(() => {
    return () => {
      flushActiveStatRef.current();
      statusSubRef.current?.remove();
      try { mainPlayerRef.current?.remove(); } catch (_) {}
      try { voicePlayerRef.current?.remove(); } catch (_) {}
      try { ambientPlayerRef.current?.remove(); } catch (_) {}
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
    flushActiveStatRef.current();
    // Stop audio without wiping the session from UI
    teardownPlayback();
    clearSim();
    loopModeRef.current = false;
    hasRealAudioRef.current = false;
    lastPlayingRef.current = false;
    teardownLayers();
    setIsPlaying(false);
  }, [sleepTimerRemaining, teardownPlayback, teardownLayers]);
  // ────────────────────────────────────────────────────────────────────────────

  const clearSleepInterval = () => {
    if (sleepIntervalRef.current) {
      clearInterval(sleepIntervalRef.current);
      sleepIntervalRef.current = null;
    }
  };

  const clearSim = () => {
    if (simIntervalRef.current) {
      clearInterval(simIntervalRef.current);
      simIntervalRef.current = null;
    }
  };

  const startSimulation = (session: Session) => {
    const totalSeconds = session.duration * 60;
    setActualDurationSeconds(totalSeconds);
    setIsPlaying(true);
    if (statTrackerRef.current && playStartRef.current === null) {
      playStartRef.current = Date.now();
    }
    simIntervalRef.current = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 1;
        const sId = currentSessionRef.current?.id;
        if (next >= totalSeconds) {
          clearSim();
          setIsPlaying(false);
          setProgress(1);
          if (sId) saveSessionProgress(sId, 1, { force: true });
          flushActiveStatRef.current();
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
    const playedAt = new Date().toISOString();
    setHistory((prev) => {
      const filtered = prev.filter((e) => e.sessionId !== session.id);
      const updated = [
        { sessionId: session.id, playedAt },
        ...filtered,
      ].slice(0, HISTORY_LIMIT);
      AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  /** Append a StatEvent reflecting minutes actually listened (ignores very short plays) */
  const recordStat = useCallback((session: Session, secondsListened: number) => {
    if (secondsListened < STAT_MIN_SECONDS) return;
    const event: StatEvent = {
      sessionId: session.id,
      categoryId: session.categoryId,
      categoryLabel: session.categoryLabel,
      minutes: Math.max(1, Math.round(secondsListened / 60)),
      playedAt: new Date().toISOString(),
    };
    setStatEvents((prev) => {
      const updated = [event, ...prev].slice(0, STATS_LIMIT);
      AsyncStorage.setItem(STATS_KEY, JSON.stringify(updated)).catch(() => {});
      return updated;
    });
  }, []);

  /** Close the current play chunk into the accumulator (no-op while paused) */
  const accumulateListened = useCallback(() => {
    if (playStartRef.current !== null) {
      listenedSecondsRef.current += (Date.now() - playStartRef.current) / 1000;
      playStartRef.current = null;
    }
  }, []);

  /** Begin tracking a session: init the accumulator but do NOT start the clock yet
   *  (the clock starts at the confirmed-play moment via markPlayStarted / the isPlaying effect,
   *  so buffering/setup/switch-gap time is not counted as listened). */
  const startStatTracking = useCallback((session: Session) => {
    statTrackerRef.current = session;
    listenedSecondsRef.current = 0;
    playStartRef.current = null;
  }, []);

  /** Start the listen-time clock at the moment playback actually begins (idempotent).
   *  Covers the session-switch path where isPlaying stays true so the effect never fires. */
  const markPlayStarted = useCallback(() => {
    if (statTrackerRef.current && playStartRef.current === null) {
      playStartRef.current = Date.now();
    }
  }, []);

  /** Flush the tracked session's accumulated listen time, then clear the tracker (idempotent) */
  const flushActiveStat = useCallback(() => {
    const session = statTrackerRef.current;
    if (!session) return;
    accumulateListened();
    const seconds = listenedSecondsRef.current;
    statTrackerRef.current = null;
    listenedSecondsRef.current = 0;
    playStartRef.current = null;
    recordStat(session, seconds);
  }, [recordStat, accumulateListened]);
  flushActiveStatRef.current = flushActiveStat;

  // Drive the listen-time accumulator from play/pause transitions (seek-proof)
  useEffect(() => {
    if (!statTrackerRef.current) return;
    if (isPlaying) {
      if (playStartRef.current === null) playStartRef.current = Date.now();
    } else {
      accumulateListened();
    }
  }, [isPlaying, accumulateListened]);

  /** Configure lock-screen now-playing info for the current session */
  const activateLockScreen = useCallback(
    (session: Session, withSeek: boolean) => {
      const player = mainPlayerRef.current;
      const art = resolveArtworkUrl(session);
      try {
        player?.setActiveForLockScreen(
          true,
          {
            title: session.title,
            artist: session.subtitle || session.categoryLabel,
            albumTitle: "RESONANCIA",
            artworkUrl: art,
          },
          { showSeekForward: withSeek, showSeekBackward: withSeek },
        );
      } catch (e) {
        console.warn("[RESONANCE] setActiveForLockScreen failed:", e);
      }
    },
    [],
  );
  activateLockScreenRef.current = activateLockScreen;

  const playSession = useCallback(
    async (session: Session) => {
      // Sesión y mezcla son mutuamente excluyentes (comparten Now Playing).
      stopMixPlayback();
      flushActiveStat();
      clearSim();
      teardownLayers();
      loopModeRef.current = false;
      switchingRef.current = true;
      // Stop the previous track immediately so its status events don't bleed into the new session
      try {
        mainPlayerRef.current?.pause();
      } catch {
        // ignore
      }
      lastPlayingRef.current = false;
      pendingSeekRef.current = null;

      setCurrentSession(session);
      const savedProgress = sessionProgressRef.current[session.id] ?? 0;
      const resumeFraction =
        savedProgress > 0 && savedProgress < COMPLETED_THRESHOLD ? savedProgress : 0;
      setProgress(resumeFraction);
      setElapsed(0);
      setActualDurationSeconds(session.duration * 60);
      void addToHistory(session);
      startStatTracking(session);

      const audioFile = AUDIO_MAP[session.id];

      if (audioFile) {
        setIsLoading(true);
        hasRealAudioRef.current = true;
        try {
          await setAudioModeAsync({
            playsInSilentMode: true,
            shouldPlayInBackground: true,
            // doNotMix = foco de audio exclusivo. Imprescindible para que iOS
            // convierta la app en la "app de Now Playing" y muestre los controles
            // en pantalla bloqueada / Centro de Control. Con el default
            // (mixWithOthers) iOS no muestra nada ("Sin Reproducción").
            interruptionMode: "doNotMix",
          });

          const main = ensureMainPlayer();
          main.loop = false;
          pendingSeekRef.current = resumeFraction > 0 ? resumeFraction : null;
          main.replace(audioFile);
          main.volume = 1;
          main.play();

          // Voice track plays simultaneously with the main track
          const voiceFile = VOICE_MAP[session.id];
          if (voiceFile) {
            const voice = ensureVoicePlayer();
            voice.loop = false;
            voice.replace(voiceFile);
            voice.volume = voiceVolumeRef.current;
            voice.play();
            voiceActiveRef.current = true;
          } else {
            voiceActiveRef.current = false;
            voicePlayerRef.current?.pause();
          }
          ambientActiveRef.current = false;

          lockScreenPendingRef.current = { session, withSeek: true };
          lastPlayingRef.current = true;
          setIsPlaying(true);
          markPlayStarted();
          // Aplicar timer por defecto al iniciar una nueva sesión
          if (defaultSleepMinutesRef.current !== null) {
            setSleepTimerRemaining(defaultSleepMinutesRef.current * 60);
          }
        } catch (err) {
          console.warn("[RESONANCE] Audio load failed:", err);
          hasRealAudioRef.current = false;
          switchingRef.current = false;
          lockScreenPendingRef.current = null;
          startSimulation(session);
        } finally {
          setIsLoading(false);
        }
      } else {
        hasRealAudioRef.current = false;
        switchingRef.current = false;
        lockScreenPendingRef.current = null;
        startSimulation(session);
      }
    },
    [addToHistory, flushActiveStat, startStatTracking, markPlayStarted, ensureMainPlayer, ensureVoicePlayer, teardownLayers],
  );

  /** Play a looping ambient/nature session for a chosen number of minutes */
  const playSessionWithDuration = useCallback(
    async (session: Session, minutes: number) => {
      // Sesión y mezcla son mutuamente excluyentes (comparten Now Playing).
      stopMixPlayback();
      flushActiveStat();
      clearSim();
      teardownLayers();
      loopModeRef.current = true;
      switchingRef.current = true;
      try {
        mainPlayerRef.current?.pause();
      } catch {
        // ignore
      }
      lastPlayingRef.current = false;
      pendingSeekRef.current = null;

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
      startStatTracking(sessionOverride);

      const audioFile = AUDIO_MAP[session.id];
      const isLoopSession = LOOP_SESSIONS.has(session.id);

      if (audioFile) {
        setIsLoading(true);
        hasRealAudioRef.current = true;
        loopModeRef.current = true;
        try {
          await setAudioModeAsync({
            playsInSilentMode: true,
            shouldPlayInBackground: true,
            // doNotMix = foco de audio exclusivo. Imprescindible para que iOS
            // convierta la app en la "app de Now Playing" y muestre los controles
            // en pantalla bloqueada / Centro de Control. Con el default
            // (mixWithOthers) iOS no muestra nada ("Sin Reproducción").
            interruptionMode: "doNotMix",
          });

          const main = ensureMainPlayer();
          main.loop = isLoopSession;
          main.replace(audioFile);
          main.volume = 1;
          main.play();

          // Ambient layer (e.g. birds) loops under the main track
          const ambientFile = AMBIENT_MAP[session.id];
          if (ambientFile) {
            const ambient = ensureAmbientPlayer();
            ambient.loop = true;
            ambient.replace(ambientFile);
            ambient.volume = ambientVolumeRef.current;
            ambient.play();
            ambientActiveRef.current = true;
          } else {
            ambientActiveRef.current = false;
            ambientPlayerRef.current?.pause();
          }
          voiceActiveRef.current = false;

          lockScreenPendingRef.current = {
            session: sessionOverride,
            withSeek: false,
          };
          lastPlayingRef.current = true;
          setIsPlaying(true);
          markPlayStarted();
          // Loop progress is interval-driven (no position attribution risk), so the
          // switch guard can be released immediately to let lock-screen toggles reflect in the UI
          switchingRef.current = false;

          // Drive progress with a countdown interval (audio loops indefinitely)
          simIntervalRef.current = setInterval(() => {
            setElapsed((prev) => {
              const next = prev + 1;
              const sId = currentSessionRef.current?.id;
              if (next >= totalSeconds) {
                clearSim();
                teardownPlayback();
                ambientActiveRef.current = false;
                loopModeRef.current = false;
                hasRealAudioRef.current = false;
                lastPlayingRef.current = false;
                setIsPlaying(false);
                setProgress(1);
                if (sId) saveSessionProgress(sId, 1, { force: true });
                flushActiveStatRef.current();
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
          hasRealAudioRef.current = false;
          loopModeRef.current = false;
          switchingRef.current = false;
          lockScreenPendingRef.current = null;
          startSimulation(sessionOverride);
        } finally {
          setIsLoading(false);
        }
      } else {
        hasRealAudioRef.current = false;
        loopModeRef.current = false;
        switchingRef.current = false;
        lockScreenPendingRef.current = null;
        startSimulation(sessionOverride);
      }
    },
    [
      addToHistory,
      flushActiveStat,
      startStatTracking,
      markPlayStarted,
      ensureMainPlayer,
      ensureAmbientPlayer,
      teardownLayers,
      teardownPlayback,
      saveSessionProgress,
    ],
  );

  const pauseResume = useCallback(async () => {
    if (hasRealAudioRef.current && mainPlayerRef.current?.isLoaded) {
      const main = mainPlayerRef.current;
      if (main.playing) {
        main.pause();
        if (voiceActiveRef.current) voicePlayerRef.current?.pause();
        if (ambientActiveRef.current) ambientPlayerRef.current?.pause();
        lastPlayingRef.current = false;
        setIsPlaying(false);
        const sId = currentSessionRef.current?.id;
        if (sId && !loopModeRef.current && main.duration > 0) {
          saveSessionProgress(sId, main.currentTime / main.duration, { force: true });
        }
      } else {
        main.play();
        if (voiceActiveRef.current) voicePlayerRef.current?.play();
        if (ambientActiveRef.current) ambientPlayerRef.current?.play();
        lastPlayingRef.current = true;
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
  }, [currentSession, saveSessionProgress]);

  const stop = useCallback(async () => {
    flushActiveStat();
    // Force-save current progress before tearing down
    const sId = currentSessionRef.current?.id;
    if (
      sId &&
      hasRealAudioRef.current &&
      !loopModeRef.current &&
      mainPlayerRef.current?.isLoaded &&
      mainPlayerRef.current.duration > 0
    ) {
      saveSessionProgress(
        sId,
        mainPlayerRef.current.currentTime / mainPlayerRef.current.duration,
        { force: true },
      );
    } else if (sId && actualDurationSeconds > 0) {
      saveSessionProgress(sId, elapsed / actualDurationSeconds, { force: true });
    }
    teardownPlayback();
    teardownLayers();
    clearSim();
    clearSleepInterval();
    loopModeRef.current = false;
    hasRealAudioRef.current = false;
    lastPlayingRef.current = false;
    switchingRef.current = false;
    pendingSeekRef.current = null;
    setSleepTimerRemaining(null);
    setCurrentSession(null);
    setIsPlaying(false);
    setProgress(0);
    setElapsed(0);
    setActualDurationSeconds(0);
  }, [saveSessionProgress, actualDurationSeconds, elapsed, flushActiveStat, teardownPlayback, teardownLayers]);

  // ── Registrar la sesión como "stoppable" por la mezcla ────────────
  // (MixerContext llama stopSessionPlayback() al iniciar una mezcla)
  const stopRef = useRef(stop);
  stopRef.current = stop;
  useEffect(() => {
    registerSessionStopper(() => {
      void stopRef.current();
    });
    return () => registerSessionStopper(null);
  }, []);

  const seekTo = useCallback(
    async (p: number) => {
      const clamped = Math.max(0, Math.min(1, p));
      setProgress(clamped);
      if (
        hasRealAudioRef.current &&
        !loopModeRef.current &&
        mainPlayerRef.current?.isLoaded &&
        mainPlayerRef.current.duration > 0
      ) {
        const posSeconds = clamped * mainPlayerRef.current.duration;
        setElapsed(Math.floor(posSeconds));
        try {
          await mainPlayerRef.current.seekTo(posSeconds);
        } catch (_) {}
      } else if (currentSession) {
        const posSeconds = clamped * actualDurationSeconds;
        setElapsed(Math.floor(posSeconds));
      }
    },
    [currentSession, actualDurationSeconds],
  );

  const setSleepTimer = useCallback((minutes: number | null) => {
    clearSleepInterval();
    if (minutes === null) {
      setSleepTimerRemaining(null);
      return;
    }
    setSleepTimerRemaining(minutes * 60);
  }, []);

  const updateDefaultSleepTimer = useCallback((minutes: number | null) => {
    defaultSleepMinutesRef.current = minutes;
  }, []);

  const clearHistory = useCallback(async () => {
    statTrackerRef.current = null;
    setHistory([]);
    setStatEvents([]);
    await AsyncStorage.multiRemove([HISTORY_KEY, STATS_KEY]);
  }, []);

  const setVoiceVolume = useCallback((volume: number) => {
    const clamped = Math.max(0, Math.min(1, volume));
    setVoiceVolumeState(clamped);
    if (voicePlayerRef.current) {
      try { voicePlayerRef.current.volume = clamped; } catch (_) {}
    }
  }, []);

  const setAmbientVolume = useCallback((volume: number) => {
    const clamped = Math.max(0, Math.min(1, volume));
    setAmbientVolumeState(clamped);
    if (ambientPlayerRef.current) {
      try { ambientPlayerRef.current.volume = clamped; } catch (_) {}
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
        statEvents,
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
        updateDefaultSleepTimer,
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
