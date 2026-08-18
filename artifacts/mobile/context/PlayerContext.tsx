import {
  type AudioPlayer,
  type AudioStatus,
  createAudioPlayer,
  setAudioModeAsync,
} from "expo-audio";
import { AppState, type AppStateStatus, Image } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AMBIENT_MAP, AUDIO_MAP, LOOP_SESSIONS, VOICE_MAP } from "@/config/audio-map";
import { bpmAudioEngine } from "@/lib/bpmAudioEngine";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { type Session, SESSIONS, getSessionById, getSessionsByCategory } from "@/data/sessions";

/** Categorías cuya cola implícita auto-avanza al azar al terminar una sesión
 *  (Música y Sesiones — Tarea #191). */
const RANDOM_ADVANCE_CATEGORIES = new Set(["musica-sonidos", "sonidos-ancestrales"]);
import {
  registerSessionStopper,
  stopMixPlayback,
  stopSoundPlayback,
  stopChatPlayback,
} from "@/context/audioBridge";
import { useAuth } from "@/context/AuthContext";
import { usePremium } from "@/context/PremiumContext";
import { syncActivity } from "@/lib/cloudSync";
import { sessionMiniPlayerEvents } from "@/lib/miniPlayerEvents";
import { FREE_FAVORITES_LIMIT, FREE_TIMER_MAX_MINUTES, showPremiumGate } from "@/lib/premiumGate";
import { sendHeartbeat } from "@/lib/communityApi";
import { getArtist } from "@/data/artists";

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
  /** Whether the session reached its natural/scheduled end (vs stopped early).
   *  Optional for backward-compat with events stored before this field existed. */
  completed?: boolean;
  playedAt: string;
}

type PlayerContextType = {
  currentSession: Session | null;
  /** Si la sesión actual proviene de una cola de playlist, sus IDs en orden original */
  activePlaylistIds: string[] | null;
  /** true cuando la cola es implícita (lista/categoría de origen, estilo Calm):
   *  prev/next disponibles, pero sin shuffle ni auto-avance al terminar. */
  queueImplicit: boolean;
  /** En cola implícita de Música/Sesiones: al terminar la sesión comienza otra
   *  de la misma categoría al azar. El icono de aleatorio del reproductor lo alterna. */
  queueRandom: boolean;
  toggleQueueRandom: () => void;
  /** Si está en modo aleatorio dentro de la playlist */
  shuffleMode: boolean;
  /** Reproduce una sesión registrando la cola de la playlist (habilita prev/next en el reproductor) */
  playSessionInPlaylist: (session: Session, sessionIds: string[]) => void;
  /** Avanza a la siguiente sesión de la cola (respeta shuffle) */
  playlistNext: () => void;
  /** Retrocede a la sesión anterior de la cola (respeta shuffle) */
  playlistPrev: () => void;
  /** Alterna el modo aleatorio */
  toggleShuffle: () => void;
  isPlaying: boolean;
  progress: number;
  elapsed: number;
  actualDurationSeconds: number;
  isLoading: boolean;
  favorites: string[];
  history: HistoryEntry[];
  /** Play events for activity stats (week minutes, streak, top category) */
  statEvents: StatEvent[];
  /** Último evento registrado LOCALMENTE (nunca lo setea la hidratación ni el
   *  merge con la nube) — disparador confiable para la celebración de racha. */
  lastLocalStat: { event: StatEvent; seq: number } | null;
  /** Per-session saved progress (0-1), keyed by session id */
  sessionProgress: Record<string, number>;
  /** Get saved progress for a session id (0 if none) */
  getSessionProgress: (id: string) => number;
  /** Clear saved progress for a session id (for Reiniciar) */
  clearSessionProgress: (id: string) => void;
  isFavorite: (id: string) => boolean;
  toggleFavorite: (id: string) => void;
  playSession: (session: Session) => void;
  /** Play a looping session for a specific number of minutes */
  playSessionWithDuration: (session: Session, minutes: number) => void;
  /** true cuando la sesión actual es un loop infinito (suena hasta pausar/temporizador) */
  infiniteLoop: boolean;
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
  /** Whether the current session has a real main audio track (not voice-only / simulation) */
  hasRealAudio: boolean;
  /** Main audio track volume 0–1 */
  mainVolume: number;
  /** Set main audio track volume 0–1 */
  setMainVolume: (volume: number) => void;
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
/** Marca de que este dispositivo ya hizo la sincronización inicial con la nube */
const CLOUD_SYNCED_KEY = "@resonance_cloud_synced";
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
  const [infiniteLoop, setInfiniteLoop] = useState(false);
  const infiniteLoopRef = useRef(false);
  infiniteLoopRef.current = infiniteLoop;
  const [isLoading, setIsLoading] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [statEvents, setStatEvents] = useState<StatEvent[]>([]);
  const [lastLocalStat, setLastLocalStat] = useState<{ event: StatEvent; seq: number } | null>(null);
  const [sessionProgress, setSessionProgress] = useState<Record<string, number>>({});
  const [sleepTimerRemaining, setSleepTimerRemaining] = useState<number | null>(null);
  const defaultSleepMinutesRef = useRef<number | null>(null);
  const isPremiumRef = useRef(false);

  // ── Sincronización con la nube (offline-first) ──────────────────────────────
  const { isSignedIn } = useAuth();
  /** True una vez que la actividad local terminó de hidratar desde AsyncStorage */
  const [localLoaded, setLocalLoaded] = useState(false);
  /** Evita re-sincronizar en cada render mientras dura la sesión de la app */
  const syncedRef = useRef(false);

  /** Last persisted progress per session id — to throttle AsyncStorage writes */
  const lastSavedProgressRef = useRef<Record<string, number>>({});
  /** Latest in-memory progress map — for use inside async callbacks */
  const sessionProgressRef = useRef<Record<string, number>>({});

  const [mainVolume, setMainVolumeState] = useState(1.0);
  const [voiceVolume, setVoiceVolumeState] = useState(0.8);
  const [ambientVolume, setAmbientVolumeState] = useState(0.7);

  // ── Cola de playlist (prev / next / shuffle) ─────────────────────────────
  const [activePlaylistIds, setActivePlaylistIds] = useState<string[] | null>(null);
  const [queueImplicit, setQueueImplicit] = useState(false);
  const queueImplicitRef = useRef(false);
  queueImplicitRef.current = queueImplicit;
  // Auto-avance aleatorio al terminar (solo cola implícita de Música/Sesiones)
  const [queueRandom, setQueueRandom] = useState(true);
  const queueRandomRef = useRef(true);
  queueRandomRef.current = queueRandom;
  const toggleQueueRandom = useCallback(() => setQueueRandom((p) => !p), []);
  const [shuffleMode, setShuffleMode] = useState(false);
  /** Orden en que se reproducen las sesiones (original o barajado) */
  const playOrderRef = useRef<string[]>([]);
  /** Índice actual dentro de playOrderRef */
  const playIndexRef = useRef<number>(0);
  const shuffleModeRef = useRef(false);
  shuffleModeRef.current = shuffleMode;
  /** Referencia estable a la función de avance automático (usada en didJustFinish) */
  const playlistAutoAdvanceRef = useRef<() => void>(() => {});
  /** Generación de reproducción: se incrementa cada vez que arranca/para una
   *  sesión. El auto-avance diferido (600 ms) solo dispara si la generación no
   *  cambió — evita el doble salto si el usuario tocó siguiente/anterior o
   *  cambió de sesión durante la espera. */
  const autoAdvanceGenRef = useRef(0);
  const scheduleAutoAdvance = useCallback(() => {
    const gen = autoAdvanceGenRef.current;
    // Pequeño delay para que la stat se asiente antes de iniciar la nueva sesión.
    setTimeout(() => {
      if (gen === autoAdvanceGenRef.current) playlistAutoAdvanceRef.current();
    }, 600);
  }, []);

  const mainVolumeRef = useRef(1.0);
  mainVolumeRef.current = mainVolume;

  // ── expo-audio players (main + simultaneous voice/ambient layers) ─────────────
  const mainPlayerRef = useRef<AudioPlayer | null>(null);
  const voicePlayerRef = useRef<AudioPlayer | null>(null);
  const ambientPlayerRef = useRef<AudioPlayer | null>(null);
  const statusSubRef = useRef<{ remove: () => void } | null>(null);

  const simIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sleepIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  /** Timestamp (ms) en que expira el sleep timer; null si no hay timer activo.
   *  Permite computar el tiempo restante real con Date.now() aunque el setInterval
   *  se haya throttleado o congelado con la pantalla bloqueada. */
  const sleepEndTimeRef = useRef<number | null>(null);

  // ── Loop gapless (Música y Sonidos / Sonidos Naturaleza) ────────────────────
  // El audio de las sesiones en loop suena por el motor nativo gapless
  // (bpmAudioEngine / react-native-audio-api): AudioBufferSourceNode con loop
  // por buffer.duration → empalme exacto, sin crossfade JS. El main player de
  // expo-audio queda como ancla MUDA (volume 0, loop nativo) para conservar
  // Now Playing / pantalla de bloqueo, sleep timer en background y el mirror
  // de play/pause del sistema — expo-audio sigue siendo el dueño único de la
  // AVAudioSession.
  /** True when the current session plays as a gapless engine loop */
  const loopCrossfadeRef = useRef(false);
  /** Voz activa del motor para la sesión en loop (null = motor no disponible) */
  const loopEngineRef = useRef<{ key: string; asset: number } | null>(null);
  /** True cuando el motor NO está disponible y el main suena audible (fallback) */
  const loopFallbackRef = useRef(false);

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
  /** True when the active session reached its natural/scheduled end — consumed by recordStat */
  const statCompletedRef = useRef(false);
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
    let cancelled = false;
    async function hydrate() {
      await Promise.all([
        AsyncStorage.getItem(FAVORITES_KEY).then((val) => {
          if (val && !cancelled) setFavorites(JSON.parse(val));
        }),
        AsyncStorage.getItem(HISTORY_KEY).then((val) => {
          if (!val || cancelled) return;
          const parsed: HistoryEntry[] = JSON.parse(val);
          const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
          const filtered = parsed.filter((e) => new Date(e.playedAt).getTime() > cutoff);
          if (filtered.length !== parsed.length) {
            AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(filtered));
          }
          setHistory(filtered);
        }),
        AsyncStorage.getItem(SESSION_PROGRESS_KEY).then((val) => {
          if (!val || cancelled) return;
          try {
            const parsed: Record<string, number> = JSON.parse(val);
            sessionProgressRef.current = parsed;
            lastSavedProgressRef.current = { ...parsed };
            setSessionProgress(parsed);
          } catch (_) {}
        }),
        AsyncStorage.getItem("@resonance_settings").then((val) => {
          if (!val || cancelled) return;
          try {
            const { defaultSleepMinutes } = JSON.parse(val);
            if (typeof defaultSleepMinutes === "number" || defaultSleepMinutes === null) {
              defaultSleepMinutesRef.current = defaultSleepMinutes ?? null;
            }
          } catch (_) {}
        }),
        AsyncStorage.getItem(STATS_KEY).then((val) => {
          if (!val || cancelled) return;
          try {
            const parsed: StatEvent[] = JSON.parse(val);
            const cutoff = Date.now() - STATS_RETENTION_DAYS * 24 * 60 * 60 * 1000;
            const filtered = parsed.filter((e) => new Date(e.playedAt).getTime() > cutoff);
            if (filtered.length !== parsed.length) {
              AsyncStorage.setItem(STATS_KEY, JSON.stringify(filtered)).catch(() => {});
            }
            setStatEvents(filtered);
          } catch (_) {}
        }),
      ]);
      if (!cancelled) setLocalLoaded(true);
    }
    hydrate();
    return () => {
      cancelled = true;
    };
  }, []);

  // ── Merge bidireccional con la nube cuando hay cuenta ───────────────────────
  // Corre una vez por sesión de la app: empuja lo local y trae lo del server,
  // de modo que estadísticas, favoritos y progreso sobrevivan a reinstalar la
  // app o cambiar de dispositivo. Si no hay cuenta, todo sigue siendo local.
  useEffect(() => {
    if (!isSignedIn) {
      // Al cerrar sesión permitimos re-sincronizar en el próximo login y, por
      // seguridad, limpiamos la marca para que el próximo login haga la unión
      // de recuperación (no un reemplazo autoritativo con datos ajenos).
      syncedRef.current = false;
      AsyncStorage.removeItem(CLOUD_SYNCED_KEY).catch(() => {});
      return;
    }
    if (!localLoaded || syncedRef.current) return;
    syncedRef.current = true;

    let cancelled = false;
    (async () => {
      try {
        const firstSync = (await AsyncStorage.getItem(CLOUD_SYNCED_KEY)) === null;
        const merged = await syncActivity(
          {
            statEvents,
            favorites,
            progress: sessionProgressRef.current,
          },
          { firstSync },
        );
        if (cancelled) return;

        setStatEvents(merged.statEvents);
        AsyncStorage.setItem(STATS_KEY, JSON.stringify(merged.statEvents)).catch(() => {});

        setFavorites(merged.favorites);
        AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(merged.favorites)).catch(() => {});

        sessionProgressRef.current = merged.progress;
        lastSavedProgressRef.current = { ...merged.progress };
        setSessionProgress(merged.progress);
        persistProgressMap(merged.progress);

        // Recuperar el historial tras reinstalar / estrenar dispositivo. El
        // historial no se sincroniza como tal: es derivable de los eventos de
        // reproducción que ya volvieron de la nube. Solo cuando la recuperación
        // de firstSync tuvo éxito (luego lo local es autoritativo). Se fusiona
        // con el estado MÁS RECIENTE (update funcional) para no pisar reproducciones
        // ocurridas mientras la sync estaba en vuelo, conservando la entrada con
        // playedAt más reciente por sesión.
        if (firstSync && merged.recovered) {
          setHistory((prev) => {
            const byId = new Map<string, HistoryEntry>();
            const consider = (h: HistoryEntry) => {
              const existing = byId.get(h.sessionId);
              if (!existing || new Date(h.playedAt) > new Date(existing.playedAt)) {
                byId.set(h.sessionId, h);
              }
            };
            for (const e of merged.statEvents) {
              consider({ sessionId: e.sessionId, playedAt: e.playedAt });
            }
            for (const h of prev) consider(h);
            const mergedHistory = Array.from(byId.values())
              .sort((a, b) => new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime())
              .slice(0, HISTORY_LIMIT);
            AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(mergedHistory)).catch(() => {});
            return mergedHistory;
          });
        }

        if (merged.recovered) {
          // Marca: a partir de ahora lo local es autoritativo en este dispositivo.
          AsyncStorage.setItem(CLOUD_SYNCED_KEY, "1").catch(() => {});
        } else {
          // Primer arranque sin lecturas exitosas (offline): NO marcamos como
          // sincronizado para reintentar firstSync en el próximo arranque y no
          // sobrescribir la nube con un local vacío.
          syncedRef.current = false;
        }
      } catch {
        // Reintentamos en el próximo arranque
        if (!cancelled) syncedRef.current = false;
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn, localLoaded]);

  /** Clear saved progress for a single session id */
  const clearSessionProgress = useCallback((id: string) => {
    const next = { ...sessionProgressRef.current };
    delete next[id];
    sessionProgressRef.current = next;
    setSessionProgress(next);
    persistProgressMap(next);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Persist a specific progress map to AsyncStorage (fire-and-forget) */
  const persistProgressMap = useCallback((map: Record<string, number>) => {
    AsyncStorage.setItem(SESSION_PROGRESS_KEY, JSON.stringify(map)).catch(() => {});
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

  // ── Loop engine pause/resume (mirror del play/pause del sistema) ─────────────
  // Un AudioBufferSourceNode no se puede pausar: pausar = stop (fade corto) y
  // reanudar = volver a arrancar el loop desde 0 — irrelevante para texturas
  // ambientales en loop. Resume vive en un ref para leer siempre el volumen
  // vigente sin re-crear el status handler.
  const pauseLoopEngine = () => {
    const v = loopEngineRef.current;
    if (v) {
      try { bpmAudioEngine.stop(v.key); } catch (_) {}
    }
  };
  const resumeLoopEngineRef = useRef<() => void>(() => {});
  resumeLoopEngineRef.current = () => {
    const v = loopEngineRef.current;
    if (v) void bpmAudioEngine.playLoopAsset(v.key, v.asset, mainVolumeRef.current);
  };
  // El ancla muda (main.loop=true con un asset corto) reporta un micro
  // playing=false cada vez que el loop nativo da la vuelta. Sin filtro, el
  // mirror lo trata como pausa del usuario → apaga el motor gapless y lo
  // re-arranca (hueco audible + botón parpadeando). Debounce: solo es pausa
  // real si playing sigue en false pasado un instante.
  const loopPauseDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const anchorPlayingRef = useRef(false);
  const clearLoopPauseDebounce = () => {
    if (loopPauseDebounceRef.current) {
      clearTimeout(loopPauseDebounceRef.current);
      loopPauseDebounceRef.current = null;
    }
  };

  // ── Main player status handler (referenced via ref to stay current) ───────────
  const handleMainStatus = useCallback(
    (status: AudioStatus) => {
      if (!status.isLoaded) return;

      // ── Enforcement del sleep timer en background ──────────────────────────
      // El setInterval de JS se congela con la pantalla bloqueada, pero este
      // listener se sigue ejecutando en background gracias a UIBackgroundModes:
      // ["audio"]. Por eso chequeamos aquí la expiración real con Date.now().
      const sleepEndTs = sleepEndTimeRef.current;
      if (sleepEndTs != null && Date.now() >= sleepEndTs) {
        sleepEndTimeRef.current = null;
        if (sleepIntervalRef.current) {
          clearInterval(sleepIntervalRef.current);
          sleepIntervalRef.current = null;
        }
        // Poner remaining a 0 dispara el useEffect de expiración existente,
        // que ya maneja el teardown completo (flush stats, stop audio, etc.)
        // sin necesitar referencias a funciones potencialmente stale.
        setSleepTimerRemaining(0);
        return;
      }

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
      anchorPlayingRef.current = status.playing;
      if (status.playing !== lastPlayingRef.current) {
        // Modo motor gapless: filtrar el micro playing=false que emite el
        // ancla muda al dar la vuelta su loop nativo. Solo aplicamos la pausa
        // si persiste (pausa real desde lock-screen / sistema).
        if (
          loopCrossfadeRef.current &&
          !loopFallbackRef.current &&
          !status.playing
        ) {
          if (loopPauseDebounceRef.current == null) {
            loopPauseDebounceRef.current = setTimeout(() => {
              loopPauseDebounceRef.current = null;
              if (!loopCrossfadeRef.current) return;
              if (anchorPlayingRef.current) return; // fue un parpadeo del loop
              if (!lastPlayingRef.current) return; // ya pausado por otra vía
              lastPlayingRef.current = false;
              voicePlayerRef.current?.pause();
              ambientPlayerRef.current?.pause();
              pauseLoopEngine();
              if (!switchingRef.current) setIsPlaying(false);
            }, 700);
          }
          return;
        }
        clearLoopPauseDebounce();
        if (
          loopCrossfadeRef.current &&
          status.playing &&
          lastPlayingRef.current
        ) {
          // playing volvió a true antes del debounce: parpadeo del loop, nada
          // que hacer (el motor nunca se detuvo).
          return;
        }
        lastPlayingRef.current = status.playing;
        if (status.playing) {
          if (voiceActiveRef.current) voicePlayerRef.current?.play();
          if (ambientActiveRef.current) ambientPlayerRef.current?.play();
          if (loopCrossfadeRef.current) resumeLoopEngineRef.current();
        } else {
          voicePlayerRef.current?.pause();
          ambientPlayerRef.current?.pause();
          if (loopCrossfadeRef.current) pauseLoopEngine();
        }
        // While switching sessions we manage isPlaying manually — ignore stale toggles
        if (!switchingRef.current) setIsPlaying(status.playing);
      }

      // Loop/duration sessions (incl. crossfade loops) are driven by the session
      // countdown interval, not the audio position. The audio loops underneath
      // (seamlessly via crossfade); the progress bar tracks the chosen session
      // length so it advances monotonically and never resets per loop cycle.
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
        statCompletedRef.current = true;
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
        // Auto-avance a la siguiente sesión si hay cola de playlist activa.
        scheduleAutoAdvance();
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

  /** Lazily create the second crossfade layer (B). Its gain is driven by the
   * loop-fade interval, so it does not need its own status listener. */
  /** Stop the gapless engine loop voice (if any) and clear the loop flags */
  const teardownLoopCrossfade = () => {
    clearLoopPauseDebounce();
    loopCrossfadeRef.current = false;
    loopFallbackRef.current = false;
    const v = loopEngineRef.current;
    loopEngineRef.current = null;
    if (v) {
      try { bpmAudioEngine.stop(v.key); } catch (_) {}
    }
  };

  /** Pause the optional layers and mark them inactive */
  const teardownLayers = useCallback(() => {
    voicePlayerRef.current?.pause();
    ambientPlayerRef.current?.pause();
    voiceActiveRef.current = false;
    ambientActiveRef.current = false;
    teardownLoopCrossfade();
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
      teardownLoopCrossfade();
      clearSleepInterval();
    };
  }, []);

  // ── Sleep timer tick ────────────────────────────────────────────────────────
  // Arranca/para el interval de UI según isPlaying y si el timer está activo.
  // El tick recalcula el restante con Date.now() (no decrementa ciegamente),
  // de modo que si el interval se throttlea en background, al despertar vuelve
  // a mostrar el valor correcto sin acumular error. La pausa real en background
  // la garantiza el listener nativo de playbackStatusUpdate (ver abajo).
  useEffect(() => {
    clearSleepInterval();
    if (!isPlaying || sleepTimerRemaining === null) return;

    sleepIntervalRef.current = setInterval(() => {
      const endTs = sleepEndTimeRef.current;
      if (endTs == null) return;
      const remaining = Math.ceil((endTs - Date.now()) / 1000);
      setSleepTimerRemaining(remaining <= 0 ? 0 : remaining);
    }, 1000);

    return () => clearSleepInterval();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, sleepTimerRemaining !== null]);

  // When countdown hits 0 — stop audio
  useEffect(() => {
    if (sleepTimerRemaining !== 0) return;
    clearSleepInterval();
    sleepEndTimeRef.current = null;
    setSleepTimerRemaining(null);
    // The scheduled timer elapsed → count it as a completed listen.
    statCompletedRef.current = true;
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
  // ── AppState: cuando la app vuelve al frente, corregir el restante ──────────
  // setInterval se throttlea en background/pantalla bloqueada. Al reanudar,
  // recalculamos el tiempo restante real con sleepEndTimeRef y paramos si expiró.
  useEffect(() => {
    const handleAppState = (nextState: AppStateStatus) => {
      if (nextState !== "active") return;
      const endTs = sleepEndTimeRef.current;
      if (endTs == null) return;
      const remaining = Math.ceil((endTs - Date.now()) / 1000);
      if (remaining <= 0) {
        // Expiró mientras estaba en background: disparar expiración
        if (sleepIntervalRef.current) {
          clearInterval(sleepIntervalRef.current);
          sleepIntervalRef.current = null;
        }
        sleepEndTimeRef.current = null;
        setSleepTimerRemaining(0); // dispara el useEffect de expiración
      } else {
        setSleepTimerRemaining(remaining); // corregir UI con el restante real
      }
    };
    const sub = AppState.addEventListener("change", handleAppState);
    return () => sub.remove();
  }, []);
  // ────────────────────────────────────────────────────────────────────────────

  /** Solo detiene el interval de UI. NO borra sleepEndTimeRef: la hora de
   *  término debe sobrevivir a los re-arranques del interval (pausa/reanudar,
   *  re-render del effect) o el timer nunca expira. El deadline se borra
   *  explícitamente al expirar, en stop() y al cancelar el timer. */
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
          // Llegó al final → cuenta como sesión COMPLETADA (día activo + hitos)
          statCompletedRef.current = true;
          flushActiveStatRef.current();
          // Mismo auto-avance que el audio real (sesiones sin pista de audio).
          scheduleAutoAdvance();
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
    // Consume the completion marker regardless of whether we end up recording,
    // so it never leaks into the next session's event.
    const completed = statCompletedRef.current;
    statCompletedRef.current = false;
    if (secondsListened < STAT_MIN_SECONDS) return;
    const event: StatEvent = {
      sessionId: session.id,
      categoryId: session.categoryId,
      categoryLabel: session.categoryLabel,
      minutes: Math.max(1, Math.round(secondsListened / 60)),
      completed,
      playedAt: new Date().toISOString(),
    };
    setStatEvents((prev) => {
      const updated = [event, ...prev].slice(0, STATS_LIMIT);
      AsyncStorage.setItem(STATS_KEY, JSON.stringify(updated)).catch(() => {});
      return updated;
    });
    setLastLocalStat((prev) => ({ event, seq: (prev?.seq ?? 0) + 1 }));
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

  // ── Community heartbeat: report listening activity every 60 s ────────────
  useEffect(() => {
    if (!isPlaying || !currentSession) return;
    const artist = getArtist(currentSession.artistId);
    const payload = {
      sessionId: currentSession.id,
      sessionName: currentSession.title,
      artistName: artist.name,
      category: currentSession.categoryLabel ?? currentSession.categoryId ?? "",
    };
    void sendHeartbeat("session_play", payload);
    const id = setInterval(() => void sendHeartbeat("session_play", payload), 60_000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, currentSession?.id]);

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

  // ── Helpers de cola de playlist ──────────────────────────────────────────
  /** Baraja un arreglo y pone el elemento con id `currentId` primero. */
  function buildShuffledOrder(ids: string[], currentId: string): string[] {
    const rest = ids.filter((id) => id !== currentId).sort(() => Math.random() - 0.5);
    return [currentId, ...rest];
  }

  /** Avanza (o retrocede) en la cola y arranca la siguiente sesión. */
  const advancePlaylist = useCallback(
    (direction: 1 | -1) => {
      // Cola implícita: reconstruirla al momento de navegar desde el catálogo
      // vigente (la hidratación muta SESSIONS in-place y añade sesiones de DB;
      // una cola armada antes quedaría desactualizada).
      if (queueImplicitRef.current) {
        const cur = currentSessionRef.current;
        if (cur) {
          const ids = getSessionsByCategory(cur.categoryId).map((s) => s.id);
          if (ids.length > 1) {
            playOrderRef.current = ids;
            playIndexRef.current = Math.max(0, ids.indexOf(cur.id));
            setActivePlaylistIds(ids);
          }
        }
      }
      const order = playOrderRef.current;
      if (!order.length) return;
      const next = (playIndexRef.current + direction + order.length) % order.length;
      playIndexRef.current = next;
      const session = getSessionById(order[next]);
      if (!session) return;
      // Llamar playSession internamente SIN limpiar la cola: lo hacemos con un
      // flag que el propio playSession comprueba.
      inPlaylistAdvanceRef.current = true;
      void playSessionRef.current(session);
    },
    [],
  );
  const inPlaylistAdvanceRef = useRef(false);

  /** Al terminar una sesión de Música/Sesiones: arranca otra de la misma
   *  categoría elegida al azar (nunca la misma que acaba de sonar). */
  const advancePlaylistRandom = useCallback(() => {
    const cur = currentSessionRef.current;
    if (!cur) return;
    const full = getSessionsByCategory(cur.categoryId).map((s) => s.id);
    const others = full.filter((id) => id !== cur.id);
    if (!others.length) return;
    const nextId = others[Math.floor(Math.random() * others.length)];
    const session = getSessionById(nextId);
    if (!session) return;
    playOrderRef.current = full;
    playIndexRef.current = Math.max(0, full.indexOf(nextId));
    setActivePlaylistIds(full);
    inPlaylistAdvanceRef.current = true;
    void playSessionRef.current(session);
  }, []);

  // Exponer el avance automático para didJustFinish
  useEffect(() => {
    playlistAutoAdvanceRef.current = () => {
      if (!activePlaylistIds) return;
      if (!queueImplicitRef.current) {
        // Playlist explícita: avance secuencial (respeta shuffle propio).
        advancePlaylist(1);
        return;
      }
      // Cola implícita: solo Música y Sesiones auto-avanzan, y al azar.
      const cur = currentSessionRef.current;
      if (
        cur &&
        queueRandomRef.current &&
        RANDOM_ADVANCE_CATEGORIES.has(cur.categoryId)
      ) {
        advancePlaylistRandom();
      }
    };
  }, [activePlaylistIds, advancePlaylist, advancePlaylistRandom]);

  const playlistNext = useCallback(() => advancePlaylist(1), [advancePlaylist]);
  const playlistPrev = useCallback(() => advancePlaylist(-1), [advancePlaylist]);

  const toggleShuffle = useCallback(() => {
    setShuffleMode((prev) => {
      const next = !prev;
      const currentId = playOrderRef.current[playIndexRef.current];
      if (next) {
        // Activar: barajar a partir de la sesión actual
        const original = activePlaylistIds ?? [];
        const shuffled = buildShuffledOrder(original, currentId);
        playOrderRef.current = shuffled;
        playIndexRef.current = 0;
      } else {
        // Desactivar: volver al orden original y localizar la sesión actual
        const original = activePlaylistIds ?? [];
        playOrderRef.current = original;
        playIndexRef.current = Math.max(0, original.indexOf(currentId));
      }
      return next;
    });
  }, [activePlaylistIds]);

  const playSessionInPlaylist = useCallback((session: Session, sessionIds: string[]) => {
    // Registrar la cola y el índice ANTES de llamar a playSession.
    // playSession detectará inPlaylistAdvanceRef = false → registra la cola nueva.
    setActivePlaylistIds(sessionIds);
    setQueueImplicit(false);
    queueImplicitRef.current = false;
    const idx = sessionIds.indexOf(session.id);
    if (shuffleModeRef.current) {
      const shuffled = buildShuffledOrder(sessionIds, session.id);
      playOrderRef.current = shuffled;
      playIndexRef.current = 0;
    } else {
      playOrderRef.current = sessionIds;
      playIndexRef.current = Math.max(0, idx);
    }
    inPlaylistAdvanceRef.current = true; // no limpiar la cola en playSession
    void playSessionRef.current(session);
  }, []);

  /** Referencia estable a playSession para usarla dentro de advancePlaylist
   *  sin crear dependencias circulares de useCallback. */
  const playSessionRef = useRef<(s: Session) => Promise<void>>(async () => {});

  /** Referencia estable a playSessionWithDuration (definida más abajo) para
   *  que playSession pueda delegar las sesiones en loop sin dependencia circular. */
  const playSessionWithDurationRef = useRef<(s: Session, minutes: number) => void>(() => {});

  const playSession = useCallback(
    async (session: Session) => {
      // Invalida cualquier auto-avance diferido pendiente (evita doble salto).
      autoAdvanceGenRef.current += 1;
      // Si NO venimos de un avance interno, limpiar la cola de playlist y
      // registrar la cola implícita (estilo Calm): para sesiones que no son
      // meditaciones, prev/next navegan por las sesiones de su categoría.
      if (!inPlaylistAdvanceRef.current) {
        setShuffleMode(false);
        const contextIds =
          session.categoryId !== "meditaciones-guiadas"
            ? getSessionsByCategory(session.categoryId).map((s) => s.id)
            : [];
        if (contextIds.length > 1 && contextIds.includes(session.id)) {
          setActivePlaylistIds(contextIds);
          setQueueImplicit(true);
          queueImplicitRef.current = true;
          setQueueRandom(true);
          queueRandomRef.current = true;
          playOrderRef.current = contextIds;
          playIndexRef.current = contextIds.indexOf(session.id);
        } else {
          setActivePlaylistIds(null);
          setQueueImplicit(false);
          queueImplicitRef.current = false;
          playOrderRef.current = [];
          playIndexRef.current = 0;
        }
      }
      inPlaylistAdvanceRef.current = false;
      // Las sesiones en loop (Sonidos Naturaleza) SIEMPRE van por el camino de
      // loop: audio gapless por el motor, con duración INFINITA — suenan hasta
      // que el usuario pause, cambie de sesión o salte el temporizador.
      if (LOOP_SESSIONS.has(session.id)) {
        playSessionWithDurationRef.current(session, Infinity);
        return;
      }
      setInfiniteLoop(false);
      // Sesión, mezcla, sonido de Descanso y audio de chat son mutuamente excluyentes.
      stopMixPlayback();
      stopSoundPlayback();
      stopChatPlayback();
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
      // Sesiones "pasar directo al miniplayer": mostrar la barra flotante
      // (SessionMiniPlayer) de inmediato en la pantalla donde se tocó.
      if (session.skipMiniPlayer) {
        sessionMiniPlayerEvents.triggerShow("bottom");
      }
      const savedProgress = sessionProgressRef.current[session.id] ?? 0;
      const resumeFraction =
        savedProgress > 0 && savedProgress < COMPLETED_THRESHOLD ? savedProgress : 0;
      setProgress(resumeFraction);
      setElapsed(0);
      setActualDurationSeconds(session.duration * 60);
      void addToHistory(session);
      startStatTracking(session);

      const audioFile = AUDIO_MAP[session.id] ?? (session.audioUri ? { uri: session.audioUri } : undefined);

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
          main.volume = mainVolumeRef.current;
          main.play();

          // Voice track plays simultaneously with the main track
          const voiceFile = VOICE_MAP[session.id] ?? (session.voiceUri ? { uri: session.voiceUri } : undefined);
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
            const capped =
              !isPremiumRef.current &&
              defaultSleepMinutesRef.current > FREE_TIMER_MAX_MINUTES
                ? FREE_TIMER_MAX_MINUTES
                : defaultSleepMinutesRef.current;
            sleepEndTimeRef.current = Date.now() + capped * 60 * 1000;
            setSleepTimerRemaining(capped * 60);
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
        // ── Sesión sin AUDIO_MAP: cargar solo la voz si existe (ej: Meditaciones) ──
        const voiceOnlyFile = VOICE_MAP[session.id] ?? (session.voiceUri ? { uri: session.voiceUri } : undefined);
        hasRealAudioRef.current = false;
        switchingRef.current = false;
        lockScreenPendingRef.current = null;
        if (voiceOnlyFile) {
          try {
            await setAudioModeAsync({
              playsInSilentMode: true,
              shouldPlayInBackground: true,
              interruptionMode: "doNotMix",
            });
            const voice = ensureVoicePlayer();
            voice.loop = false;
            voice.replace(voiceOnlyFile);
            voice.volume = voiceVolumeRef.current;
            voice.play();
            voiceActiveRef.current = true;
            ambientActiveRef.current = false;
          } catch (err) {
            console.warn("[RESONANCE] Voice-only load failed:", err);
            voiceActiveRef.current = false;
          }
          startSimulation(session);
          if (defaultSleepMinutesRef.current !== null) {
            const capped =
              !isPremiumRef.current && defaultSleepMinutesRef.current > FREE_TIMER_MAX_MINUTES
                ? FREE_TIMER_MAX_MINUTES
                : defaultSleepMinutesRef.current;
            sleepEndTimeRef.current = Date.now() + capped * 60 * 1000;
            setSleepTimerRemaining(capped * 60);
          }
        } else {
          startSimulation(session);
        }
      }
    },
    [addToHistory, flushActiveStat, startStatTracking, markPlayStarted, ensureMainPlayer, ensureVoicePlayer, teardownLayers],
  );

  // Mantener la ref de playSession actualizada (usada por advancePlaylist).
  playSessionRef.current = playSession;

  /** Play a looping ambient/nature session for a chosen number of minutes */
  const playSessionWithDuration = useCallback(
    async (session: Session, minutes: number) => {
      // Sesión, mezcla, sonido de Descanso y audio de chat son mutuamente excluyentes.
      stopMixPlayback();
      stopSoundPlayback();
      stopChatPlayback();
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

      // minutes = Infinity → loop infinito: suena hasta pausar / cambiar de
      // sesión / temporizador de sueño. Sin auto-apagado ni barra de progreso.
      const infinite = !Number.isFinite(minutes);
      const totalSeconds = infinite ? Infinity : minutes * 60;
      const sessionOverride: Session = infinite
        ? { ...session, durationLabel: "∞" }
        : {
            ...session,
            duration: minutes,
            durationLabel: `${minutes} min`,
          };

      setInfiniteLoop(infinite);
      setCurrentSession(sessionOverride);
      setProgress(0);
      setElapsed(0);
      setActualDurationSeconds(infinite ? 0 : totalSeconds);
      void addToHistory(session);
      startStatTracking(sessionOverride);

      // Igual que el path normal: si no hay asset bundleado, usar el audio
      // subido al servidor (audioUri). Los loops con URI remota degradan al
      // loop nativo audible del main (el motor requiere asset bundleado).
      const audioFile =
        AUDIO_MAP[session.id] ?? (session.audioUri ? { uri: session.audioUri } : undefined);
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
          const ambientFile = AMBIENT_MAP[session.id];

          if (isLoopSession) {
            // ── Loop gapless por el motor nativo (bpmAudioEngine) ──
            // El audio audible sale del motor (AudioBufferSourceNode con loop
            // por buffer.duration → empalme exacto, sin hueco ni crossfade JS).
            // El main player de expo-audio suena MUDO (volume 0, loop nativo):
            // es el ancla de Now Playing / pantalla de bloqueo, del sleep timer
            // en background y del mirror de play/pause del sistema.
            loopCrossfadeRef.current = true;
            loopEngineRef.current = null;
            loopFallbackRef.current = false;

            main.loop = true;
            main.replace(audioFile);
            main.volume = 0; // ancla muda: el audio audible sale del motor
            main.play();

            const engineKey = `session:${session.id}`;
            void (async () => {
              const ok = await bpmAudioEngine.init();
              // La sesión pudo cambiar/cerrarse mientras el motor iniciaba.
              if (!loopCrossfadeRef.current || currentSessionRef.current?.id !== session.id) return;
              if (ok && typeof audioFile === "number") {
                loopEngineRef.current = { key: engineKey, asset: audioFile };
                if (lastPlayingRef.current) {
                  void bpmAudioEngine.playLoopAsset(engineKey, audioFile, mainVolumeRef.current);
                }
              } else {
                // Motor no disponible (web / Expo Go / dev client viejo):
                // degradar al loop nativo audible del main (empalme perceptible
                // pero funcional). Sin fallback de crossfade JS — eliminado.
                loopFallbackRef.current = true;
                try {
                  if (mainPlayerRef.current?.isLoaded) {
                    mainPlayerRef.current.volume = mainVolumeRef.current;
                  }
                } catch (_) {}
              }
            })();

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
            switchingRef.current = false;

            // La barra refleja la duración elegida de la sesión (monótona, sin
            // saltos por vuelta del loop). El audio sigue en loop por debajo con
            // crossfade; este intervalo cuenta el tiempo de sesión y auto-apaga.
            simIntervalRef.current = setInterval(() => {
              setElapsed((prev) => {
                // Congelar el conteo cuando está en pausa (in-app o lock-screen)
                if (!lastPlayingRef.current) return prev;
                const next = prev + 1;
                const sId = currentSessionRef.current?.id;
                if (infinite) return next; // loop infinito: sin auto-apagado ni progreso
                if (next >= totalSeconds) {
                  clearSim();
                  teardownPlayback();
                  teardownLoopCrossfade();
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
          } else {
            // ── Sesión de duración fija sin loop (sin crossfade) ──
            main.loop = false;
            main.replace(audioFile);
            main.volume = mainVolumeRef.current;
            main.play();

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
            // Progress is interval-driven (no position attribution risk), so the
            // switch guard can be released immediately to let lock-screen toggles reflect in the UI
            switchingRef.current = false;

            // Drive progress with a countdown interval
            simIntervalRef.current = setInterval(() => {
              setElapsed((prev) => {
                // Congelar el conteo cuando está en pausa (in-app o lock-screen)
                if (!lastPlayingRef.current) return prev;
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
          }
        } catch (err) {
          console.warn("[RESONANCE] Loop audio load failed:", err);
          // Apagar cualquier arranque parcial (incl. voz del motor pendiente o
          // ya sonando y el ancla muda) antes de caer a la simulación.
          teardownLayers();
          try { mainPlayerRef.current?.pause(); } catch (_) {}
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
  // Mantener la referencia estable que usa playSession para delegar loops.
  playSessionWithDurationRef.current = playSessionWithDuration;

  const pauseResume = useCallback(async () => {
    if (hasRealAudioRef.current && mainPlayerRef.current?.isLoaded) {
      const main = mainPlayerRef.current;
      if (main.playing) {
        main.pause();
        if (voiceActiveRef.current) voicePlayerRef.current?.pause();
        if (ambientActiveRef.current) ambientPlayerRef.current?.pause();
        if (loopCrossfadeRef.current) pauseLoopEngine();
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
        if (loopCrossfadeRef.current) resumeLoopEngineRef.current();
        lastPlayingRef.current = true;
        setIsPlaying(true);
      }
    } else {
      // Simulación (sin main player) — también sincronizar voice-only
      if (isPlaying) {
        clearSim();
        if (voiceActiveRef.current) voicePlayerRef.current?.pause();
        setIsPlaying(false);
      } else if (currentSession) {
        startSimulation(currentSession);
        if (voiceActiveRef.current) voicePlayerRef.current?.play();
      }
    }
  }, [currentSession, isPlaying, saveSessionProgress]);

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
    autoAdvanceGenRef.current += 1;
    sleepEndTimeRef.current = null;
    setSleepTimerRemaining(null);
    setCurrentSession(null);
    setIsPlaying(false);
    setProgress(0);
    setElapsed(0);
    setActualDurationSeconds(0);
    setInfiniteLoop(false);
    // Al detener no queda nada sonando: limpiar también la cola de navegación.
    setActivePlaylistIds(null);
    setQueueImplicit(false);
    queueImplicitRef.current = false;
    setShuffleMode(false);
    playOrderRef.current = [];
    playIndexRef.current = 0;
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
      // Loop infinito: no hay línea de tiempo — el seek no tiene sentido.
      if (infiniteLoopRef.current) return;
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
        // Sesiones de loop con crossfade: el seek mueve la posición de la sesión
        // (barra + tiempo); el audio sigue en loop por debajo sin cortes. El
        // intervalo de conteo continúa desde el nuevo elapsed.
        const posSeconds = clamped * actualDurationSeconds;
        setElapsed(Math.floor(posSeconds));
      }
    },
    [currentSession, actualDurationSeconds],
  );

  const setSleepTimer = useCallback((minutes: number | null) => {
    clearSleepInterval();
    if (minutes === null) {
      sleepEndTimeRef.current = null;
      setSleepTimerRemaining(null);
      return;
    }
    sleepEndTimeRef.current = Date.now() + minutes * 60 * 1000;
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

  const setMainVolume = useCallback((volume: number) => {
    const clamped = Math.max(0, Math.min(1, volume));
    setMainVolumeState(clamped);
    // Sesión en loop por el motor: el volumen vive en la voz del motor y el
    // main player debe seguir MUDO (es solo el ancla de pantalla de bloqueo).
    // Cubre también la ventana de init/decode (voz aún no creada): el ancla no
    // debe des-mutearse salvo en el fallback confirmado sin motor.
    if (loopCrossfadeRef.current && !loopFallbackRef.current) {
      const v = loopEngineRef.current;
      if (v) {
        try { bpmAudioEngine.setVolume(v.key, clamped); } catch (_) {}
      }
      // Si la voz aún no existe, playLoopAsset arrancará con mainVolumeRef
      // actualizado (el resume lee mainVolumeRef.current).
      return;
    }
    if (mainPlayerRef.current?.isLoaded) {
      try { mainPlayerRef.current.volume = clamped; } catch (_) {}
    }
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

  const { isPremium } = usePremium();

  useEffect(() => {
    isPremiumRef.current = isPremium;
  }, [isPremium]);

  const toggleFavorite = useCallback(
    async (id: string) => {
      const isAdding = !favorites.includes(id);
      if (isAdding && !isPremium && favorites.length >= FREE_FAVORITES_LIMIT) {
        showPremiumGate(
          `Como usuario gratuito puedes guardar hasta ${FREE_FAVORITES_LIMIT} favoritos. Hazte Premium para guardar sesiones sin límite.`,
        );
        return;
      }
      const updated = isAdding
        ? [id, ...favorites]
        : favorites.filter((f) => f !== id);
      setFavorites(updated);
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
    },
    [favorites, isPremium]
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
        lastLocalStat,
        sessionProgress,
        getSessionProgress,
        isFavorite,
        toggleFavorite,
        clearSessionProgress,
        activePlaylistIds,
        queueImplicit,
        queueRandom,
        toggleQueueRandom,
        shuffleMode,
        playSessionInPlaylist,
        playlistNext,
        playlistPrev,
        toggleShuffle,
        playSession,
        playSessionWithDuration,
        infiniteLoop,
        pauseResume,
        stop,
        seekTo,
        sleepTimerRemaining,
        setSleepTimer,
        updateDefaultSleepTimer,
        clearHistory,
        hasRealAudio: !!(currentSession && (AUDIO_MAP[currentSession.id] || currentSession.audioUri)),
        mainVolume,
        setMainVolume,
        hasVoiceTrack: !!(VOICE_MAP[currentSession?.id ?? ""] || currentSession?.voiceUri),
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
