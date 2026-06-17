import { type AudioPlayer, createAudioPlayer, setAudioModeAsync } from "expo-audio";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppState, type AppStateStatus, Image, Platform } from "react-native";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { SOUND_MAP } from "@/config/sound-map";
import { REMOTE_SOUND_MAP } from "@/lib/remoteSoundMap";
import { bpmAudioEngine } from "@/lib/bpmAudioEngine";
import { getSoundById } from "@/data/sounds";
import { getMixImage } from "@/config/mix-images";
import type { MixCategory } from "@/data/mix-categories";
import {
  registerMixStopper,
  stopSessionPlayback,
} from "@/context/audioBridge";

/** Resuelve un asset (`require(...)`) a un URL usable como carátula.
 *  En nativo `require` devuelve un id numérico → `Image.resolveAssetSource`.
 *  En web (react-native-web) `resolveAssetSource` no existe y el `require`
 *  ya es un string o `{ uri }` / `{ default }`. Se cubren ambos casos. */
function assetToUri(mod: unknown): string | undefined {
  if (!mod) return undefined;
  if (typeof mod === "string") return mod;
  if (typeof mod === "object") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const m = mod as any;
    if (typeof m.uri === "string") return m.uri;
    if (typeof m.default === "string") return m.default;
    if (m.default && typeof m.default.uri === "string") return m.default.uri;
  }
  if (typeof Image.resolveAssetSource === "function") {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return Image.resolveAssetSource(mod as any)?.uri;
    } catch (_) {
      /* sin uri */
    }
  }
  return undefined;
}

/** Carátula por defecto del Now Playing / pantalla bloqueada cuando la mezcla
 *  no tiene una imagen propia asignada (ej: sonidos sueltos sin preset guardado).
 *  Usamos el logo cuadrado de la app. expo-audio descarga el URL async. */
const DEFAULT_MIX_ARTWORK_URL = assetToUri(
  require("@/assets/images/logo-cdc-square.png"),
);

/** Resuelve la imagen elegida al guardar la mezcla (key de la galería) a un
 *  URL usable como carátula. Cae al logo de la app si no hay imagen. */
function resolveMixArtworkUrl(imageKey?: string): string | undefined {
  const source = getMixImage(imageKey);
  if (source) {
    const uri = assetToUri(source);
    if (uri) return uri;
  }
  return DEFAULT_MIX_ARTWORK_URL;
}

/** Máximo de sonidos sonando a la vez (CPU/batería en móviles normales) */
export const MAX_ACTIVE_SOUNDS = 10;
/**
 * Cuántos sonidos apagados se mantienen CARGADOS en memoria (pausados+muteados)
 * para que volver a activarlos sea instantáneo (sin esperar el decode del mp3).
 * Al superar el tope se descarta el más viejo de verdad (libera memoria).
 */
const IDLE_CACHE_MAX = 12;
const PRESETS_KEY = "@resonance_mixer_presets";
const DEFAULT_VOLUME = 0.7;

/** Las dos capas del mismo sonido que se crossfadean entre sí (ver MixerContext). */
type SoundPlayers = { a: AudioPlayer; b: AudioPlayer; resetFade?: () => void; clearBFade?: () => void };

export type ActiveSound = {
  id: string;
  volume: number;
};
export type MixPreset = {
  id: string;
  name: string;
  description?: string;
  /** Key de la galería de imágenes (config/mix-images.ts), ej: "lluvia". */
  image?: string;
  /** URI de foto del carrete (mayor prioridad que image). */
  coverUri?: string;
  /** ID de geometría de la biblioteca Geometrix. */
  coverGeometryId?: string;
  /** ID de creación del usuario (Geometrix). Máxima prioridad visual. */
  coverCreationId?: string;
  category: MixCategory;
  sounds: ActiveSound[];
  createdAt: string;
  /** ID de la mezcla compartida en la comunidad (si el autor la compartió). */
  sharedId?: number;
  /** Marcada como favorita por el usuario. */
  favorited?: boolean;
};

export type SaveMixInput = {
  name: string;
  description?: string;
  image?: string;
  coverUri?: string;
  coverGeometryId?: string;
  coverCreationId?: string;
  category: MixCategory;
};

export type MixMetaUpdate = Partial<Pick<MixPreset, "name" | "description" | "image" | "coverUri" | "coverGeometryId" | "coverCreationId">>;

type MixerContextType = {
  activeSounds: ActiveSound[];
  isActive: (id: string) => boolean;
  getVolume: (id: string) => number;
  /** Activa/desactiva un sonido. Devuelve false si se alcanzó el máximo. */
  toggleSound: (id: string) => boolean;
  setVolume: (id: string, volume: number) => void;
  removeSound: (id: string) => void;
  /** Reordena la mezcla activa (cosmético: el orden no afecta el audio). */
  moveSound: (id: string, direction: "up" | "down") => void;
  isPlaying: boolean;
  togglePlay: () => void;
  stopAll: () => void;
  presets: MixPreset[];
  savePreset: (input: SaveMixInput) => void;
  /** Sobrescribe un preset existente con la mezcla activa + metadatos. */
  updatePreset: (id: string, input: SaveMixInput) => void;
  /** Actualiza solo los metadatos (nombre/descripción/portada) sin cambiar los sonidos. */
  updatePresetMeta: (id: string, meta: MixMetaUpdate) => void;
  /** Clona un preset existente con un nuevo id y nombre "(copia)". */
  duplicatePreset: (id: string) => void;
  loadPreset: (preset: MixPreset) => void;
  deletePreset: (id: string) => void;
  /** Marca/desmarca un preset local como compartido en la comunidad. */
  setPresetShared: (id: string, sharedId: number | null) => void;
  /** Alterna el favorito de un preset. */
  togglePresetFavorite: (id: string) => void;
  /** Guarda directamente un preset completo (con sus sonidos) como favorito local. */
  importPreset: (preset: MixPreset) => void;
  /** ID del preset cargado actualmente (null si la mezcla activa no proviene de uno guardado o fue modificada). */
  loadedPresetId: string | null;
  /**
   * BPM activo de la mezcla (cuando hay sonidos rítmicos mezclados).
   * null = sin ritmos (libre). Al activar el primer sonido BPM se fija;
   * se libera cuando se quitan todos los sonidos de categoría "bpm".
   */
  activeBpm: number | null;
  sleepTimerRemaining: number | null;
  setSleepTimer: (minutes: number | null) => void;
  /** Volumen master (0-1) aplicado a todos los sonidos activos. */
  masterVolume: number;
  setMasterVolume: (v: number) => void;
  /** Si el editor en hoja inferior (MixerSheet) está abierto. */
  isSheetOpen: boolean;
  openSheet: () => void;
  closeSheet: () => void;
  /** Vista inmersiva (pantalla completa sobre todo) */
  inmersivoOpen: boolean;
  inmersivoPresetId: string | null;
  openImmersivo: (presetId: string) => void;
  closeImmersivo: () => void;
};

const MixerContext = createContext<MixerContextType | null>(null);

export function MixerProvider({ children }: { children: React.ReactNode }) {
  const [activeSounds, setActiveSounds] = useState<ActiveSound[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [presets, setPresets] = useState<MixPreset[]>([]);
  const [sleepTimerRemaining, setSleepTimerRemaining] = useState<number | null>(null);
  const [loadedPresetId, setLoadedPresetId] = useState<string | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [masterVolume, setMasterVolumeSt] = useState(1.0);
  const masterVolumeRef = useRef(1.0);

  const setMasterVolume = useCallback((v: number) => {
    const clamped = Math.max(0, Math.min(1, v));
    masterVolumeRef.current = clamped;
    bpmAudioEngine.setMasterVolume(clamped);
    setMasterVolumeSt(clamped);
  }, []);

  /**
   * Dos capas (a/b) del MISMO sonido por id, para el crossfade del loop. Las dos
   * suenan en loop nativo desfasadas media vuelta: cuando una llega a su corte
   * (volumen 0) la otra está en su pico, así el empalme es imperceptible. La capa
   * `a` es además el ancla del lock-screen (siempre playing=true).
   */
  const playersRef = useRef<Map<string, SoundPlayers>>(new Map());
  /**
   * Caché de sonidos APAGADOS pero todavía cargados (pausados+muteados). Al
   * apagar un sonido lo "estacionamos" acá en vez de destruirlo, así volver a
   * activarlo es instantáneo (no hay que decodificar el mp3 de nuevo). Sus subs
   * del crossfade siguen en loopSubsRef; el guard del listener los ignora porque
   * el par ya no está en playersRef. Capado a IDLE_CACHE_MAX (LRU por inserción).
   */
  const idlePlayersRef = useRef<Map<string, SoundPlayers>>(new Map());
  /** Subscripciones de status (fade) por sonido: una por capa. */
  const loopSubsRef = useRef<Map<string, { remove: () => void }[]>>(new Map());
  /** Fades de apagado en curso por sonido (para cancelarlos al reanudar). */
  const parkFadeRef = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map());
  /**
   * Volumen "objetivo" elegido por el usuario para cada sonido. El volumen REAL
   * del player se modula con un fade en los bordes del loop (ver createPlayerFor),
   * así que la fuente de verdad del nivel deseado vive acá, no en player.volume.
   */
  const baseVolumesRef = useRef<Map<string, number>>(new Map());
  /** RAF del fade-out de audio en curso (lo cancela una nueva llamada a stopAll). */
  const fadeRafRef = useRef<number | null>(null);
  /**
   * Teardown (pause+remove) de los players del fade-out en curso. Si una nueva
   * llamada a stopAll cancela ese fade, hay que ejecutarlo YA: esos players ya
   * fueron desacoplados de los refs, así que nadie más los apagaría → quedarían
   * sonando huérfanos a volumen parcial.
   */
  const fadeTeardownRef = useRef<(() => void) | null>(null);
  const sleepIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── BPM clock ─────────────────────────────────────────────────────────────
  const [activeBpm, setActiveBpm] = useState<number | null>(null);
  /** Date.now() de cuando arrancó el primer sonido BPM. */
  const bpmClockRef = useRef<number | null>(null);
  /** Espejo de activeBpm para leer sincrónicamente en callbacks. */
  const bpmValueRef = useRef<number | null>(null);
  /** Handle del próximo tick del reloj maestro BPM (seekTo(0) en el borde). */
  const bpmTickRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Fase (ms dentro del loop) en que se pausó la mezcla, para re-anclar al reanudar. */
  const bpmPausePhaseRef = useRef<number | null>(null);
  /** Función del tick (ref estable para la recursión del setTimeout). */
  const bpmTickFnRef = useRef<() => void>(() => {});
  /**
   * Sistema que reproduce la familia BPM actual. Se fija con el PRIMER sonido
   * BPM y se mantiene hasta que se quitan todos (así todas las capas comparten
   * reloj y quedan en fase). "engine" = react-native-audio-api (gapless nativo);
   * "expo" = reloj maestro + expo-audio (fallback si el motor no está listo).
   */
  const bpmSystemRef = useRef<"engine" | "expo" | null>(null);

  const activeSoundsRef = useRef<ActiveSound[]>([]);
  activeSoundsRef.current = activeSounds;
  const isPlayingRef = useRef(false);
  isPlayingRef.current = isPlaying;
  const presetsRef = useRef<MixPreset[]>([]);
  presetsRef.current = presets;
  const loadedPresetIdRef = useRef<string | null>(null);
  loadedPresetIdRef.current = loadedPresetId;
  /** Timestamp (ms) en que expira el sleep timer; null si no hay timer activo. */
  const sleepEndTimeRef = useRef<number | null>(null);
  /**
   * Hasta este timestamp (ms) ignoramos el listener del lock screen.
   * Se activa tras llamar applyPlaying para que los status updates propios
   * (play/pause de nuestros propios players) no reboten de vuelta al mixer.
   */
  const ignoreLockUntilRef = useRef(0);
  /**
   * Timeout pendiente de propagar un playing:false desde el lock screen.
   * Filtra los falsos negativos del loop restart (el audio llega al final,
   * status.playing baja unos frames, y vuelve a subir al reiniciar el loop).
   */
  const playingFalseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Lock-screen / Now Playing ─────────────────────────────────────
  /** Player que "posee" los controles de pantalla bloqueada (uno solo a la vez). */
  const lockOwnerRef = useRef<AudioPlayer | null>(null);
  /**
   * Si el owner actual ya reportó playing=true al menos una vez. Mientras sea
   * false, un playing=false es solo el estado "cargando" (el item todavía no
   * arrancó), NO una pausa del usuario → no debe pausar la mezcla. Se resetea
   * cada vez que cambia el owner.
   */
  const lockOwnerHasPlayedRef = useRef(false);
  /** Suscripción al status del owner (para reflejar play/pausa remoto). */
  const lockSubRef = useRef<{ remove: () => void } | null>(null);
  /** Activación postergada hasta que el track tenga duración válida (evita NaN). */
  const lockPendingRef = useRef(false);

  /** Detiene el reloj maestro de loops BPM. */
  const stopBpmScheduler = useCallback(() => {
    if (bpmTickRef.current) {
      clearTimeout(bpmTickRef.current);
      bpmTickRef.current = null;
    }
  }, []);

  /**
   * Reloj maestro DETERMINISTA de los loops rítmicos. En vez de depender de
   * status.currentTime (que llega tarde / poco frecuente → el loop se pasaba del
   * final musical y dejaba el hueco de ~1 s), un único timer alineado a
   * bpmClockRef hace seekTo(0) de TODOS los players BPM activos a la vez, justo
   * en cada borde de compás (t0 + n·loopMs). Garantiza loop SIN hueco Y que las
   * capas queden bloqueadas en fase entre sí, sin importar cuándo se sumaron. El
   * buffer de 0.5 s del archivo absorbe el jitter del timer (el player nunca
   * toca el fin del archivo → nunca se dispara el corte nativo).
   */
  const startBpmScheduler = useCallback(() => {
    stopBpmScheduler();
    const bpm = bpmValueRef.current;
    const t0 = bpmClockRef.current;
    if (bpm === null || t0 === null) return;
    const loopMs = (60 / bpm) * 8 * 1000;
    const elapsed = Date.now() - t0;
    const nextIdx = Math.floor(elapsed / loopMs) + 1;
    let delay = t0 + nextIdx * loopMs - Date.now();
    if (delay < 8) delay += loopMs;
    bpmTickRef.current = setTimeout(() => bpmTickFnRef.current(), delay);
  }, [stopBpmScheduler]);

  // El tick vive en un ref para que el setTimeout recursivo siempre llame a la
  // última versión (cierra sobre los refs, que siempre están al día).
  bpmTickFnRef.current = () => {
    // Borde de compás: rebobinar TODOS los players BPM a su posición de fase.
    const bpm = bpmValueRef.current;
    const loopSec = bpm !== null ? (60 / bpm) * 8 : 0;
    playersRef.current.forEach((pair, id) => {
      if (getSoundById(id)?.bpm === undefined) return;
      try {
        void pair.a.seekTo(0);
      } catch {
        /* ignore */
      }
      // Auto-sanador: si por un tick perdido el player llegó al fin y paró,
      // play() lo revive (es no-op si ya está sonando).
      try {
        if (isPlayingRef.current) pair.a.play();
      } catch {
        /* ignore */
      }
    });
    startBpmScheduler(); // reprogramar el próximo borde
  };

  /** Reproduce/pausa todos los players de la mezcla y actualiza el estado. */
  const applyPlaying = useCallback((next: boolean) => {
    // Suprimir el listener del lock screen por 1 s para que los status updates
    // que disparan nuestros propios play/pause no reboten de vuelta.
    ignoreLockUntilRef.current = Date.now() + 1000;
    // Cancelar cualquier debounce de pausa pendiente originado en lock screen.
    if (playingFalseTimerRef.current) {
      clearTimeout(playingFalseTimerRef.current);
      playingFalseTimerRef.current = null;
    }
    isPlayingRef.current = next; // sincrónico: el listener del lock screen lo lee
    playersRef.current.forEach((pair) => {
      try {
        if (next) {
          pair.a.play();
          pair.b.play();
        } else {
          pair.a.pause();
          pair.b.pause();
        }
      } catch {
        // ignore
      }
    });

    // ── Motor BPM (react-native-audio-api): pausar/reanudar en fase ────────
    if (bpmSystemRef.current === "engine") {
      if (next) void bpmAudioEngine.resume();
      else void bpmAudioEngine.suspend();
    }

    // ── Reloj maestro BPM: pausar/reanudar manteniendo la fase ─────────────
    if (bpmValueRef.current !== null && bpmClockRef.current !== null) {
      const loopMs = (60 / bpmValueRef.current) * 8 * 1000;
      if (next) {
        // Reanudar: re-anclar el reloj a la fase guardada para que los players
        // (que retoman desde donde quedaron) sigan bloqueados en sincronía.
        if (bpmPausePhaseRef.current !== null) {
          const phase = bpmPausePhaseRef.current;
          bpmClockRef.current = Date.now() - phase;
          const loopSec = loopMs / 1000;
          playersRef.current.forEach((pair, id) => {
            if (getSoundById(id)?.bpm === undefined) return;
            try {
              void pair.a.seekTo(((phase / 1000) % loopSec + loopSec) % loopSec);
            } catch {
              /* ignore */
            }
          });
          bpmPausePhaseRef.current = null;
        }
        startBpmScheduler();
      } else {
        // Pausar: guardar la fase actual del loop y frenar el scheduler.
        bpmPausePhaseRef.current =
          (Date.now() - bpmClockRef.current) % loopMs;
        stopBpmScheduler();
      }
    }

    setIsPlaying(next);
  }, [startBpmScheduler, stopBpmScheduler]);
  const applyPlayingRef = useRef(applyPlaying);
  applyPlayingRef.current = applyPlaying;
  /** Wrapper estable de stopAll para registrarlo en el coordinador de audio. */
  const stopAllRef = useRef<() => void>(() => {});

  const lockMetadata = useCallback(() => {
    const loadedId = loadedPresetIdRef.current;
    const preset = loadedId ? presetsRef.current.find((p) => p.id === loadedId) : null;
    return {
      title: preset?.name || "Mi mezcla",
      artist: "Mezcla de sonidos",
      albumTitle: "RESONANCIA",
      artworkUrl: resolveMixArtworkUrl(preset?.image),
    };
  }, []);

  const clearLockScreen = useCallback(() => {
    lockPendingRef.current = false;
    if (lockSubRef.current) {
      try {
        lockSubRef.current.remove();
      } catch {
        // ignore
      }
      lockSubRef.current = null;
    }
    const owner = lockOwnerRef.current;
    lockOwnerRef.current = null;
    try {
      owner?.clearLockScreenControls();
    } catch {
      // ignore
    }
  }, []);

  /**
   * (Re)apunta los controles de pantalla bloqueada al primer player activo.
   * La mezcla son varios loops sin una pista "principal", así que designamos
   * uno como ancla del Now Playing. Si el ancla deja de existir (se quitó ese
   * sonido), se transfiere al siguiente. Si no queda ninguno, se limpia.
   */
  const syncLockScreen = useCallback(() => {
    // El ancla del Now Playing es la capa `a` del primer sonido (siempre suena).
    const firstPair = playersRef.current.values().next().value as SoundPlayers | undefined;
    const first = firstPair?.a;
    if (!first) {
      clearLockScreen();
      return;
    }
    // Mismo owner → solo refrescar metadata (ej. cambió el nombre del preset).
    if (lockOwnerRef.current === first) {
      try {
        first.updateLockScreenMetadata(lockMetadata());
      } catch {
        // ignore
      }
      return;
    }
    // Transferir ownership a un nuevo player ancla.
    if (lockSubRef.current) {
      try {
        lockSubRef.current.remove();
      } catch {
        // ignore
      }
      lockSubRef.current = null;
    }
    const prev = lockOwnerRef.current;
    if (prev) {
      try {
        prev.clearLockScreenControls();
      } catch {
        // ignore
      }
    }
    lockOwnerRef.current = first;
    lockOwnerHasPlayedRef.current = false;
    lockPendingRef.current = true;
    lockSubRef.current = first.addListener("playbackStatusUpdate", (status) => {
      // ── Enforcement del sleep timer en background ──────────────────
      // El setInterval de JS se congela con la pantalla bloqueada, así que
      // el timer no dispararía la pausa. Pero este listener SÍ se sigue
      // ejecutando en background (lo maneja el motor de audio nativo, que
      // sigue activo por UIBackgroundModes: ["audio"]). Por eso chequeamos
      // aquí la expiración con Date.now(): se respeta aunque el interval no corra.
      const endTs = sleepEndTimeRef.current;
      if (endTs != null && Date.now() >= endTs) {
        sleepEndTimeRef.current = null;
        if (sleepIntervalRef.current) {
          clearInterval(sleepIntervalRef.current);
          sleepIntervalRef.current = null;
        }
        setSleepTimerRemaining(null);
        applyPlayingRef.current(false);
        return;
      }
      // Activar recién cuando hay duración válida: tras replace() el item aún
      // no cargó → duration NaN, e iOS descarta TODA la entrada de Now Playing.
      if (lockPendingRef.current && (status.duration ?? 0) > 0) {
        lockPendingRef.current = false;
        try {
          first.setActiveForLockScreen(true, lockMetadata(), {
            showSeekForward: false,
            showSeekBackward: false,
          });
        } catch {
          // ignore
        }
      }
      // Reflejar play/pausa remoto (botones de la pantalla bloqueada) sobre
      // TODA la mezcla, con dos guards:
      // 1. ignoreLockUntilRef: ventana de 1 s tras applyPlaying para ignorar
      //    los status updates que disparan nuestros propios play/pause (evita
      //    el flicker del botón al tocar Reproducir/Pausar en la hoja).
      // 2. playingFalseTimerRef: debounce de 350 ms para playing:false, porque
      //    cuando el audio en loop llega al final del archivo y reinicia,
      //    status.playing baja unos frames → sin el debounce pausaría todo.
      // En cuanto el owner reporta playing=true: marcar que ya arrancó y
      // CANCELAR cualquier debounce de pausa pendiente. Esto corre siempre
      // (sin importar isPlayingRef), porque el playing=true inicial coincide
      // con isPlayingRef=true y no entraría en la rama de "cambio" de abajo —
      // sin esto, el playing=false de "cargando" deja un timer que pausa todo.
      if (status.playing === true) {
        lockOwnerHasPlayedRef.current = true;
        if (playingFalseTimerRef.current) {
          clearTimeout(playingFalseTimerRef.current);
          playingFalseTimerRef.current = null;
        }
      }
      if (typeof status.playing === "boolean" && status.playing !== isPlayingRef.current) {
        if (Date.now() < ignoreLockUntilRef.current) return;
        // Frontera del loop: el track terminó un ciclo y reinicia. NO es una
        // acción del usuario → ignorar para no pausar toda la mezcla.
        if (status.didJustFinish) return;
        if (!status.playing) {
          // Ignorar el playing=false inicial mientras el owner todavía no
          // arrancó (item cargando): NO es una pausa real. Solo lo es si ya
          // estuvo sonando alguna vez.
          if (!lockOwnerHasPlayedRef.current) return;
          if (playingFalseTimerRef.current) clearTimeout(playingFalseTimerRef.current);
          playingFalseTimerRef.current = setTimeout(() => {
            playingFalseTimerRef.current = null;
            if (!isPlayingRef.current) return; // ya pausado por otra vía
            applyPlayingRef.current(false);
          }, 350);
        } else {
          applyPlayingRef.current(true);
        }
      }
    });
  }, [clearLockScreen, lockMetadata]);

  // ── Cargar presets guardados ──────────────────────────────────────
  useEffect(() => {
    AsyncStorage.getItem(PRESETS_KEY).then((val) => {
      if (!val) return;
      try {
        const parsed = JSON.parse(val) as MixPreset[];
        // Migración: mezclas viejas sin categoría → "dormir"; la categoría
        // "trabajar" fue removida → se reasigna a "dormir" (Para Dormir).
        const migrated = parsed.map((p) => ({
          ...p,
          category: !p.category || p.category === "trabajar" ? "dormir" : p.category,
        }));
        setPresets(migrated);
      } catch {
        // ignore corrupt data
      }
    });
  }, []);

  const persistPresets = useCallback((next: MixPreset[]) => {
    setPresets(next);
    AsyncStorage.setItem(PRESETS_KEY, JSON.stringify(next)).catch(() => {});
  }, []);

  const ensureAudioMode = useCallback(async () => {
    try {
      await setAudioModeAsync({
        playsInSilentMode: true,
        shouldPlayInBackground: true,
        // doNotMix = foco de audio exclusivo. Imprescindible para que iOS
        // convierta la app en la "app de Now Playing" y muestre los controles
        // en pantalla bloqueada. Con el default (mixWithOthers) no aparece nada.
        interruptionMode: "doNotMix",
      });
    } catch {
      // ignore
    }
  }, []);

  // Pre-calentar la sesión de audio al montar el provider. ensureAudioMode es
  // async; en toggleSound se llama sin await (`void`), así que en arranque en
  // frío el primer play() puede correr ANTES de que iOS configure la sesión y
  // el primer sonido sale en SILENCIO. Configurándola acá (mucho antes de que
  // el usuario toque un sonido) la sesión ya está lista en el primer tap.
  useEffect(() => {
    void (async () => {
      await ensureAudioMode();
      await bpmAudioEngine.init();
    })();
  }, [ensureAudioMode]);

  const createPlayerFor = useCallback((id: string, volume: number): SoundPlayers | null => {
    const file: Parameters<AudioPlayer["replace"]>[0] | null =
      SOUND_MAP[id] ?? (REMOTE_SOUND_MAP[id] ? { uri: REMOTE_SOUND_MAP[id] } : null);
    if (!file) return null;
    try {
      baseVolumesRef.current.set(id, volume);

      // ── Loops BPM: ganancia constante + loop por RELOJ MAESTRO ────────────
      // Dos motivos para NO usar el crossfade de dos capas en los drums:
      //   1) gain=|sin(π·pos/dur)| vale 0 en pos=0 → silenciaría el primer beat.
      //   2) las dos capas van desfasadas dur/2 → sonarían beats DISTINTOS a la
      //      vez (golpes fantasma). El crossfade sirve para texturas continuas,
      //      no para ritmo.
      //
      // Y NO se puede usar el loop NATIVO (a.loop=true): expo-audio reinicia el
      // loop esperando AVPlayerItemDidPlayToEndTime y recién ahí hace seek(0)+
      // play() → SIEMPRE deja un hueco audible en el empalme. Para ritmo ese
      // hueco arruina el groove.
      //
      // Solución (ver startBpmScheduler): loop=false y un ÚNICO reloj maestro
      // determinista (timer alineado a bpmClockRef) hace seekTo(0) de TODOS los
      // players BPM a la vez en cada borde de compás. No depende de
      // status.currentTime (que llegaba tarde → dejaba el hueco). El archivo trae
      // 0.5 s de silencio extra al final (buffer) que absorbe el jitter del timer
      // para que el player nunca toque el fin del archivo. Acá el player solo se
      // crea y arranca; el wrap y la sincronía entre capas los hace el scheduler.
      // El listener queda SOLO para sincronizar el volumen master.
      const soundBpm = getSoundById(id)?.bpm;
      const isBpmLoop = soundBpm !== undefined;
      if (isBpmLoop) {
        const a = createAudioPlayer(null, { updateInterval: 200 });
        a.loop = false; // el loop lo maneja el reloj maestro, NO el nativo
        a.replace(file);
        a.volume = 0; // arranca mudo; se rampa abajo para evitar el click de arranque
        const b = createAudioPlayer(null, { updateInterval: 200 });
        b.loop = false;
        b.volume = 0;
        const pair: SoundPlayers = { a, b };
        playersRef.current.set(id, pair);
        const sub = a.addListener("playbackStatusUpdate", () => {
          const cur = playersRef.current.get(id);
          if (!cur || cur.a !== a) return;
          // Sincronizar volumen si cambió el master.
          const base = baseVolumesRef.current.get(id) ?? volume;
          const target = base * masterVolumeRef.current;
          if (Math.abs(a.volume - target) > 0.004) {
            try { a.volume = target; } catch { /* ignore */ }
          }
        });
        loopSubsRef.current.set(id, [sub]);
        a.play();
        // Fade-in de 80 ms para el BPM expo-fallback (evita el "tac" de arranque).
        const _bpmTarget = volume * masterVolumeRef.current;
        let _bpmStep = 0;
        const _bpmRamp = setInterval(() => {
          _bpmStep++;
          const cur = playersRef.current.get(id);
          if (!cur || cur.a !== a || _bpmStep >= 8) {
            clearInterval(_bpmRamp);
            if (cur?.a === a) { try { a.volume = _bpmTarget; } catch { /* ignore */ } }
            return;
          }
          try { a.volume = (_bpmStep / 8) * _bpmTarget; } catch { /* ignore */ }
        }, 10); // 8 pasos × 10 ms = 80 ms
        return pair;
      }

      // ── Sonidos con ESTRUCTURA (binaurales): loop nativo de UNA sola capa ──
      // El crossfade de dos capas desfasadas dur/2 (más abajo) es INAUDIBLE para
      // texturas continuas (lluvia, bosque, tonos puros): potencia constante. Pero
      // para contenido con estructura audible —el PULSO de un binaural, una melodía
      // o un ritmo— las dos copias suenan desalineadas en el tiempo y se percibe un
      // ECO (el mismo sonido repetido en otra "pista"). Para estos sonidos usamos
      // UNA sola capa en loop nativo: sin segunda capa no hay con qué solaparse, así
      // que no hay eco. El empalme del loop nativo puede dejar un micro-corte cada
      // vuelta, pero es mucho menos molesto que el eco y los binaurales están
      // pensados para repetirse de forma continua mientras estén activos.
      const isSingleLoop = getSoundById(id)?.category === "binaural";
      if (isSingleLoop) {
        const STARTUP_FADE_MS = 350;
        const a = createAudioPlayer(null, { updateInterval: 200 });
        a.loop = true; // loop nativo: una sola capa, sin crossfade
        a.replace(file);
        a.volume = 0; // arranca mudo; el fade-in lo sube (evita el click de arranque)
        const b = createAudioPlayer(null, { updateInterval: 1000 }); // dummy: nunca suena
        b.loop = false;
        b.volume = 0;
        const pair: SoundPlayers = { a, b };
        // Fade-in suave a 60 fps, reutilizado en el arranque y en la reanudación
        // (resumePlayer llama resetFade). El listener no toca el volumen mientras
        // este intervalo corre (evita que un tick lento pise el fade → "tac").
        let fadeIv: ReturnType<typeof setInterval> | null = null;
        const startFadeIn = () => {
          if (fadeIv) clearInterval(fadeIv);
          const t0 = Date.now();
          fadeIv = setInterval(() => {
            const cur = playersRef.current.get(id);
            if (!cur || cur.a !== a) { if (fadeIv) clearInterval(fadeIv); fadeIv = null; return; }
            const k = Math.min(1, (Date.now() - t0) / STARTUP_FADE_MS);
            const base = baseVolumesRef.current.get(id) ?? volume;
            try { a.volume = base * k * masterVolumeRef.current; } catch { /* ignore */ }
            if (k >= 1) { if (fadeIv) clearInterval(fadeIv); fadeIv = null; }
          }, 16);
        };
        pair.resetFade = () => { startFadeIn(); };
        pair.clearBFade = () => { if (fadeIv) { clearInterval(fadeIv); fadeIv = null; } };
        // Registrar ANTES de play() (el guard del listener compara identidad).
        playersRef.current.set(id, pair);
        const sub = a.addListener("playbackStatusUpdate", () => {
          const cur = playersRef.current.get(id);
          if (!cur || cur.a !== a) return; // player viejo o estacionado
          if (fadeIv !== null) return; // el fade-in es el único que escribe el volumen mientras corre
          // Mantener el volumen objetivo (sigue cambios de master / del slider).
          const base = baseVolumesRef.current.get(id) ?? volume;
          const target = base * masterVolumeRef.current;
          if (Math.abs(a.volume - target) > 0.004) {
            try { a.volume = target; } catch { /* ignore */ }
          }
        });
        loopSubsRef.current.set(id, [sub]);
        a.play();
        startFadeIn();
        return pair;
      }

      // ── Crossfade del loop con DOS capas ─────────────────────────────────
      // Un solo audio no puede solaparse consigo mismo, así que el corte del
      // loop nativo siempre se nota (aunque se le haga un dip de volumen).
      // Solución: dos copias del mismo sonido en loop nativo, desfasadas media
      // vuelta. A cada una se le aplica un gain = |sin(pi * pos/dur)| según su
      // propia posición. Como están desfasadas dur/2, sus fases cumplen
      // gainA² + gainB² = sin² + cos² = 1 → crossfade de POTENCIA CONSTANTE:
      // cuando una capa llega a su corte (gain 0) la otra está en su pico, y la
      // suma percibida no varía. El empalme queda imperceptible.
      //
      // Importante: las dos capas NUNCA paran (loop nativo) → status.playing
      // siempre true → no dispara el guard de pausa del lock-screen ni hace
      // falta reiniciar a mano. updateInterval bajo (120 ms) para que el gain
      // varíe de forma continua. El listener sigue corriendo en background.
      const makeLayer = () => {
        const p = createAudioPlayer(null, { updateInterval: 120 });
        p.loop = true;
        p.replace(file);
        p.volume = 0; // arranca en 0; el gain del crossfade lo sube
        return p;
      };
      const a = makeLayer();
      const b = makeLayer();
      const pair: SoundPlayers = {
        a,
        b,
        resetFade: () => {
          fadeState.audibleStart = 0;
          // Al reanudar, B ya está en posición → bEntryFrac=1 inmediato
          // (el fade de reanudación lo maneja startup, no bEntry).
          bEntryFrac = 1;
          if (bFadeTimer) { clearInterval(bFadeTimer); bFadeTimer = null; }
        },
        clearBFade: () => {
          if (bFadeTimer) { clearInterval(bFadeTimer); bFadeTimer = null; }
        },
      };

      // ── Crossfade simétrico (robusto) ────────────────────────────────────
      // AMBAS capas usan SIEMPRE el gain = |sin(pi*pos/dur)|. En el borde del
      // loop de cualquiera de las dos su gain vale 0, así que el corte del loop
      // nativo SIEMPRE ocurre a volumen 0 → es inaudible, sin importar el estado
      // de la otra capa. La capa B va desfasada dur/2 (gainA²+gainB²=1, potencia
      // constante) y cubre el valle de A, y viceversa.
      //
      // ARRANQUE FUERTE: se SIEMBRA la capa B en el pico del seno (aPos+dur/2)
      // apenas se conoce la duración, así desde el primer instante hay una capa a
      // gain~1 mientras A sube desde su valle. Sin esto, A sola tarda varios
      // segundos en oírse (bosque ~28s: recién al 70% a los 7s).
      //
      // El seed se REINTENTA hasta CONFIRMAR que el seek aterrizó (en iOS un
      // seekTo se puede ignorar). Hasta confirmar, B queda muteada — pero como los
      // reintentos pasan en pos baja (gain~0) son inaudibles igual. Recién al
      // confirmar se da por bueno el desfase y arranca el recentrado de drift.
      //
      // OJO: se siembra B (que igual sigue el seno), NO se fuerza A a volumen
      // pleno ignorando el seno: eso haría que A llegue a su corte de loop a
      // volumen pleno → click + reinicio audible (bug "viento"). Y NO se siembra
      // A en dur/2: eso adelantaría su valle a la mitad del archivo (~14s) y, si B
      // aún no cubre, deja un HUECO (el audio "se corta a ~20s").
      let offsetConfirmed = false; // true al confirmar que el seed de B aterrizó
      let bSeeded = false; // B confirmó su salto al pico
      let bSeedTarget = -1; // posición objetivo del último seed (para confirmarlo)
      let bEntryFrac = 0; // 0→1 a 60 fps cuando B se habilita (evita el "tac" de habilitación)
      let bFadeTimer: ReturnType<typeof setInterval> | null = null;
      const B_ENTRY_FADE_MS = 180; // duración del fade de entrada de B (ms)
      const fadeState = { audibleStart: 0 }; // mutable: se resetea en resumePlayer
      const STARTUP_FADE_MS = 350;
      // Recentrado de drift a largo plazo (sesiones de horas): dos loops nativos
      // se desincronizan de a poco; si se rompe el desfase de 180° sin²+cos²
      // deja de dar 1 y reaparece la ondulación. Recentramos B hacia A+dur/2
      // solo en su valle de gain (seek inaudible), con throttle de 2 s.
      let lastResync = 0;
      // Ancla del fallback de seed (por si B nunca confirma su salto al pico) y
      // ventana de mute tras un seek de recentrado (mantener B en 0 en el salto).
      let firstLoadedAt = 0;
      const SEED_FALLBACK_MS = 1500;
      let recenterMuteUntil = 0;

      const setVol = (p: AudioPlayer, target: number) => {
        if (Math.abs(p.volume - target) > 0.004) {
          try {
            p.volume = target;
          } catch {
            // ignore
          }
        }
      };

      const attachFade = (p: AudioPlayer, isSecondary: boolean) => {
        return p.addListener("playbackStatusUpdate", (status) => {
          const cur = playersRef.current.get(id);
          if (!cur || (cur.a !== p && cur.b !== p)) return; // player viejo
          if (Platform.OS === "web" && !p.loop) {
            try {
              p.loop = true;
            } catch {
              // ignore
            }
          }
          const dur = status.duration ?? 0;
          const pos = status.currentTime ?? 0;

          // El fade-in (audibleStart) NO arranca apenas hay audio: espera a que la
          // capa B esté SEMBRADA y alineada (offsetConfirmed, abajo). Así el seekTo
          // del seed de B ocurre con AMBAS capas en silencio total y la PRIMERA
          // reproducción se comporta igual que una reanudación (sin ningún seek
          // audible = sin "tac"). Acá solo anclamos el reloj del fallback por si el
          // seed nunca confirma (no dejar el sonido mudo para siempre).
          if (dur > 0 && firstLoadedAt === 0) firstLoadedAt = Date.now();
          // Reanudación: si el offset YA está confirmado en este closure (el seed
          // seek ocurrió hace rato), habilitar el fade-in de INMEDIATO — sin esperar
          // el fallback — para que el re-tap rápido suene al instante. En la 1ª
          // reproducción offsetConfirmed todavía es false acá, así que esto NO
          // adelanta el fade antes del seed (ambas capas siguen en silencio).
          if (offsetConfirmed && fadeState.audibleStart === 0) {
            fadeState.audibleStart = Date.now();
          }
          if (
            fadeState.audibleStart === 0 &&
            firstLoadedAt > 0 &&
            Date.now() - firstLoadedAt > SEED_FALLBACK_MS
          ) {
            fadeState.audibleStart = Date.now();
          }

          // Sembrar la capa B en el pico (aPos+dur/2) y CONFIRMAR que el seek
          // aterrizó antes de darlo por bueno. Mientras no confirme, se reintenta
          // (los reintentos pasan en pos baja → inaudibles) y B queda muteada.
          if (isSecondary && dur > 0 && !bSeeded) {
            if (bSeedTarget >= 0) {
              let serr = Math.abs(pos - bSeedTarget);
              serr = Math.min(serr, dur - serr); // distancia circular
              if (serr < 0.3) {
                bSeeded = true;
                offsetConfirmed = true;
                // Arrancar el throttle del recentrado AHORA: el seed aterriza con
                // hasta 0.3 s de error (tolerancia de confirmación). Ese error NO
                // es drift, pero dispararía un seekTo de recentrado en el primer
                // valle de B (~1 s en loops cortos) → "tac". Posponer el primer
                // recentrado 2 s salta ese primer valle; el drift real (lento) se
                // corrige en valles posteriores, ya muteados.
                lastResync = Date.now();
                // Recién ahora (B alineada) habilitamos el fade-in global: el seek
                // del seed ya ocurrió en silencio, así que la 1ª reproducción no
                // tiene ningún seek audible → sin "tac".
                if (fadeState.audibleStart === 0) fadeState.audibleStart = Date.now();
                // Fade de entrada a 60 fps, independiente de los ticks de audio
                // (en iOS los ticks llegan cada ~200 ms → bEntry calculado inline
                // ya vale 1 al primer tick siguiente → el fade nunca corría).
                bEntryFrac = 0;
                if (bFadeTimer) clearInterval(bFadeTimer);
                const bFadeStart = Date.now();
                bFadeTimer = setInterval(() => {
                  bEntryFrac = Math.min(1, (Date.now() - bFadeStart) / B_ENTRY_FADE_MS);
                  const base2 = baseVolumesRef.current.get(id) ?? volume;
                  const st = fadeState.audibleStart === 0
                    ? 0
                    : Math.min(1, (Date.now() - fadeState.audibleStart) / STARTUP_FADE_MS);
                  // Aplicar a 60 fps sin gain (B está en su pico ≈1 tras el seed).
                  // El intervalo NO para hasta que AMBOS fades estén completos:
                  // si para cuando startup<1, el primer tick del listener aplica
                  // base×gain×startup_nuevo con un escalón de 120ms → TAC.
                  setVol(p, base2 * bEntryFrac * st * masterVolumeRef.current);
                  if (bEntryFrac >= 1 && st >= 1) {
                    clearInterval(bFadeTimer!);
                    bFadeTimer = null;
                  }
                }, 16);
              }
            }
            if (!bSeeded) {
              const aPos = cur.a.currentTime ?? 0;
              bSeedTarget = (((aPos + dur / 2) % dur) + dur) % dur;
              try {
                void p.seekTo(bSeedTarget);
              } catch {
                // ignore
              }
            }
          }

          const gain = dur > 0 ? Math.abs(Math.sin(Math.PI * (pos / dur))) : 1;
          const base = baseVolumesRef.current.get(id) ?? volume;
          // Fade-in global (~0.35 s) desde silencio: evita un click por el salto
          // inicial de B al pico. Solo afecta el arranque (mucho antes de cualquier
          // borde de loop), así que sigue siendo seam-safe.
          const startup =
            fadeState.audibleStart === 0 ? 0 : Math.min(1, (Date.now() - fadeState.audibleStart) / STARTUP_FADE_MS);
          // B muteada hasta confirmar su salto al pico (así no se oye ningún
          // transitorio del seed); A siempre suena (su borde de loop es inaudible).
          // bEntryFrac se actualiza a 60 fps por setInterval (no por este tick lento).
          // Mientras bFadeTimer está activo, el intervalo es el único que escribe
          // el volumen de B: si el listener también lo escribe con un escalón de
          // 120 ms produce exactamente el TAC que queremos evitar.
          if (isSecondary && bFadeTimer !== null) {
            // El intervalo ya está manejando el volumen de B → no interferir.
          } else {
            let volTarget = isSecondary
              ? (bSeeded ? base * gain * bEntryFrac : 0)
              : base * gain;
            // Ventana de mute tras un seek de recentrado: mantener B en 0 mientras
            // dura el salto de posición (si no, el siguiente tick restauraría el
            // gain justo sobre la discontinuidad de onda → "tac").
            if (isSecondary && Date.now() < recenterMuteUntil) volTarget = 0;
            setVol(p, volTarget * startup * masterVolumeRef.current);
          }

          // Recentrado de drift de la capa B contra A: mantener el desfase dur/2,
          // corrigiendo SOLO en el valle de B (gain bajo → seek inaudible).
          if (isSecondary && dur > 0 && offsetConfirmed && gain < 0.06) {
            const aPos = cur.a.currentTime ?? 0;
            const desired = (((aPos + dur / 2) % dur) + dur) % dur;
            let err = Math.abs(pos - desired);
            err = Math.min(err, dur - err); // distancia circular
            const now = Date.now();
            if (err > 0.06 && now - lastResync > 2000) {
              lastResync = now;
              // El seekTo de recentrado es una discontinuidad de onda → "tac"
              // audible aunque el gain sea bajo. Ya solo recentramos en el valle
              // PROFUNDO (gain<0.06) y, además, mantenemos B en 0 durante el salto
              // y un instante después (recenterMuteUntil): el corte ocurre en
              // silencio real y el volumen se restaura recién cuando B sigue en su
              // valle → el pinchazo queda inaudible. (En reanudación NO hay seek
              // porque el offset ya está fino → por eso el TAC solo aparecía la 1ª.)
              // Mute acotado al valle: en loops cortos 260 ms se pasarían del valle
              // (un leve dip de nivel); escalar con la duración y techar en 260 ms.
              recenterMuteUntil = now + Math.min(260, Math.round(dur * 35));
              try { p.volume = 0; } catch { /* ignore */ }
              try {
                void p.seekTo(desired);
              } catch {
                // ignore
              }
            }
          }
        });
      };

      const subA = attachFade(a, false);
      const subB = attachFade(b, true);
      loopSubsRef.current.set(id, [subA, subB]);
      // Registrar el par ANTES de play() (el guard del listener compara la
      // identidad del player contra el par registrado).
      playersRef.current.set(id, pair);
      a.play();
      b.play();
      return pair;
    } catch {
      return null;
    }
  }, []);

  /** Destruye de verdad un sonido (libera el player). Busca en activos e idle. */
  const destroyPlayer = useCallback((id: string) => {
    const pf = parkFadeRef.current.get(id);
    if (pf) { clearInterval(pf); parkFadeRef.current.delete(id); }
    const subs = loopSubsRef.current.get(id);
    if (subs) {
      subs.forEach((s) => {
        try {
          s.remove();
        } catch {
          // ignore
        }
      });
      loopSubsRef.current.delete(id);
    }
    baseVolumesRef.current.delete(id);
    const pair = playersRef.current.get(id) ?? idlePlayersRef.current.get(id);
    playersRef.current.delete(id);
    idlePlayersRef.current.delete(id);
    if (!pair) return;
    pair.clearBFade?.();
    [pair.a, pair.b].forEach((p) => {
      try {
        p.pause();
      } catch {
        // ignore
      }
      try {
        p.remove();
      } catch {
        // ignore
      }
    });
  }, []);

  /**
   * "Estaciona" un sonido: lo pausa y mutea pero lo deja CARGADO en memoria
   * (no destruye el player ni sus listeners), para que reactivarlo sea
   * instantáneo. Capa el caché a IDLE_CACHE_MAX descartando el más viejo.
   */
  const parkPlayer = useCallback(
    (id: string) => {
      const pair = playersRef.current.get(id);
      if (!pair) {
        // Por si ya estaba idle (no debería): no dejar fantasmas.
        if (idlePlayersRef.current.has(id)) return;
        return;
      }
      // Mover a idle YA (para que un re-tap inmediato lo reanude), pero apagar con
      // un fade-out corto (~120 ms) en vez de cortar a 0 de golpe → sin "tac" al
      // detener. Una vez fuera de playersRef el listener del crossfade se inhibe
      // (su guard no encuentra el par), así que solo este intervalo toca el volumen.
      playersRef.current.delete(id);
      idlePlayersRef.current.delete(id);
      idlePlayersRef.current.set(id, pair);
      pair.clearBFade?.();
      const prevFade = parkFadeRef.current.get(id);
      if (prevFade) clearInterval(prevFade);
      let v0a = 0;
      let v0b = 0;
      try { v0a = pair.a.volume; } catch { /* ignore */ }
      try { v0b = pair.b.volume; } catch { /* ignore */ }
      const FADE_MS = 120;
      const t0 = Date.now();
      const iv = setInterval(() => {
        const k = Math.max(0, 1 - (Date.now() - t0) / FADE_MS);
        try { pair.a.volume = v0a * k; } catch { /* ignore */ }
        try { pair.b.volume = v0b * k; } catch { /* ignore */ }
        if (k <= 0) {
          clearInterval(iv);
          parkFadeRef.current.delete(id);
          try { pair.a.pause(); } catch { /* ignore */ }
          try { pair.b.pause(); } catch { /* ignore */ }
        }
      }, 16);
      parkFadeRef.current.set(id, iv);
      while (idlePlayersRef.current.size > IDLE_CACHE_MAX) {
        const oldest = idlePlayersRef.current.keys().next().value as string | undefined;
        if (oldest === undefined) break;
        destroyPlayer(oldest);
      }
    },
    [destroyPlayer],
  );

  /**
   * Reactiva un sonido estacionado (vuelve a playersRef y le da play). El
   * crossfade ya estaba alineado (offsetConfirmed quedó true en su closure), así
   * que retoma sin re-confirmar ni cortes. Devuelve el par o null si no estaba.
   */
  const resumePlayer = useCallback((id: string, vol: number): SoundPlayers | null => {
    const pair = idlePlayersRef.current.get(id);
    if (!pair) return null;
    idlePlayersRef.current.delete(id);
    // Cancelar un fade-out de apagado en curso (re-tap rápido) y arrancar desde
    // silencio: resetFade reinicia el fade-in, que rampa de 0 al volumen objetivo.
    const pf = parkFadeRef.current.get(id);
    if (pf) { clearInterval(pf); parkFadeRef.current.delete(id); }
    try { pair.a.volume = 0; } catch { /* ignore */ }
    try { pair.b.volume = 0; } catch { /* ignore */ }
    baseVolumesRef.current.set(id, vol);
    // Volver a registrar ANTES de play() (el guard del listener compara identidad).
    playersRef.current.set(id, pair);
    // Resetear el fade-in: si no se hace, audibleStart del closure tiene el valor
    // original → startup = 1 en el primer tick → salto brusco de volumen → click.
    pair.resetFade?.();
    try {
      pair.a.play();
    } catch {
      // ignore
    }
    try {
      pair.b.play();
    } catch {
      // ignore
    }
    return pair;
  }, []);

  const clearSleepTimer = useCallback(() => {
    if (sleepIntervalRef.current) {
      clearInterval(sleepIntervalRef.current);
      sleepIntervalRef.current = null;
    }
    sleepEndTimeRef.current = null;
    setSleepTimerRemaining(null);
  }, []);

  const toggleSound = useCallback(
    (id: string): boolean => {
      const prev = activeSoundsRef.current;
      const exists = prev.some((s) => s.id === id);

      if (exists) {
        const removingOwner = lockOwnerRef.current === playersRef.current.get(id)?.a;
        if (removingOwner) clearLockScreen();
        // Estacionar (no destruir) para que reactivarlo sea instantáneo. Si el
        // sonido corre en el motor BPM, apagarlo ahí (parkPlayer es no-op para
        // sonidos que nunca tuvieron player expo).
        if (getSoundById(id)?.bpm !== undefined && bpmSystemRef.current === "engine") {
          bpmAudioEngine.stop(id);
        }
        parkPlayer(id);
        const next = prev.filter((s) => s.id !== id);
        setActiveSounds(next);
        setLoadedPresetId(null);

        // Si ya no quedan sonidos rítmicos, liberar el clock BPM
        const anyBpmLeft = next.some((s) => getSoundById(s.id)?.bpm !== undefined);
        if (!anyBpmLeft && bpmValueRef.current !== null) {
          stopBpmScheduler();
          bpmClockRef.current = null;
          bpmValueRef.current = null;
          bpmPausePhaseRef.current = null;
          bpmSystemRef.current = null;
          setActiveBpm(null);
        }

        if (next.length === 0) {
          setIsPlaying(false);
          isPlayingRef.current = false;
          setIsSheetOpen(false);
          clearSleepTimer();
        } else if (removingOwner) {
          // El owner del lock screen se quitó → transferir al siguiente player.
          syncLockScreen();
        }
        return true;
      }

      if (prev.length >= MAX_ACTIVE_SOUNDS) return false;

      // ── Compatibilidad de BPM ──────────────────────────────────────────────
      // Sonidos de distintos BPM no se pueden mezclar: rechazar si el BPM del
      // nuevo sonido es distinto al que ya está fijado en la mezcla.
      const soundDef = getSoundById(id);
      const soundBpm = soundDef?.bpm;
      if (soundBpm !== undefined && bpmValueRef.current !== null && bpmValueRef.current !== soundBpm) {
        return false;
      }

      // Mezcla y sesión son mutuamente excluyentes (comparten Now Playing).
      stopSessionPlayback();
      void ensureAudioMode();

      // ── Sonido BPM por el MOTOR (react-native-audio-api) ──────────────────
      if (soundBpm !== undefined) {
        if (bpmValueRef.current === null) {
          bpmSystemRef.current = bpmAudioEngine.isReady() ? "engine" : "expo";
        }
        if (bpmSystemRef.current === "engine") {
          void bpmAudioEngine.play(id, {
            bpm: soundBpm,
            loopBars: soundDef?.loopBars ?? 2,
            volume: DEFAULT_VOLUME,
          });
          if (bpmValueRef.current === null) {
            bpmValueRef.current = soundBpm;
            bpmPausePhaseRef.current = null;
            setActiveBpm(soundBpm);
          }
          if (!isPlayingRef.current) applyPlaying(true);
          setActiveSounds([...prev, { id, volume: DEFAULT_VOLUME }]);
          setLoadedPresetId(null);
          syncLockScreen();
          return true;
        }
      }

      // ── Camino expo-audio (sonidos no-BPM, o BPM en fallback) ─────────────
      // Si está estacionado (apagado hace poco), retomarlo al instante; si no,
      // crear el player desde cero (decodifica el mp3).
      const player = resumePlayer(id, DEFAULT_VOLUME) ?? createPlayerFor(id, DEFAULT_VOLUME);
      // Sin archivo de audio (o falla de carga): no agregar un sonido "fantasma"
      if (!player) return true;

      // ── Sincronía de sonidos BPM (reloj maestro, fallback expo) ───────────
      if (soundBpm !== undefined) {
        if (bpmValueRef.current === null) {
          // Primer sonido BPM: el reloj nace en fase 0, así que el player DEBE
          // estar en 0. resumePlayer (sonido estacionado) lo retoma desde su
          // currentTime viejo → hay que rebobinarlo o el loop arranca desfasado
          // hasta el primer borde del scheduler.
          try { void player.a.seekTo(0); } catch { /* ignore */ }
          bpmClockRef.current = Date.now();
          bpmValueRef.current = soundBpm;
          bpmPausePhaseRef.current = null;
          setActiveBpm(soundBpm);
          startBpmScheduler();
        } else if (isPlayingRef.current && bpmClockRef.current !== null) {
          // Sonido BPM adicional con la mezcla sonando: alinearlo de inmediato a
          // la fase actual del loop maestro (entra "en el groove") en vez de
          // cuantizar al beat (eso desfasaba el patrón → desincronización
          // irregular). El scheduler lo mantiene bloqueado en los próximos bordes.
          const loopMs = (60 / soundBpm) * 8 * 1000;
          const phase = ((Date.now() - bpmClockRef.current) % loopMs) / 1000;
          try { void player.a.seekTo(phase); } catch { /* ignore */ }
        }
      }

      // Si la mezcla estaba pausada, retomar todos al sumar un sonido
      if (!isPlayingRef.current) {
        applyPlaying(true);
      }
      setActiveSounds([...prev, { id, volume: DEFAULT_VOLUME }]);
      setLoadedPresetId(null);
      syncLockScreen();
      return true;
    },
    [
      createPlayerFor,
      resumePlayer,
      parkPlayer,
      ensureAudioMode,
      clearSleepTimer,
      applyPlaying,
      syncLockScreen,
      clearLockScreen,
      startBpmScheduler,
      stopBpmScheduler,
    ],
  );

  const setVolume = useCallback((id: string, volume: number) => {
    // Solo guardar el nivel deseado: el listener del crossfade lo aplica con el
    // gain de cada capa en el próximo tick (~120 ms). NO setear player.volume
    // directo acá: pisaría el gain del fade y daría un salto de volumen en el
    // empalme del loop.
    if (getSoundById(id)?.bpm !== undefined && bpmSystemRef.current === "engine") {
      bpmAudioEngine.setVolume(id, volume);
    }
    baseVolumesRef.current.set(id, volume);
    setActiveSounds((prev) => prev.map((s) => (s.id === id ? { ...s, volume } : s)));
  }, []);


  const moveSound = useCallback((id: string, direction: "up" | "down") => {
    setActiveSounds((prev) => {
      const idx = prev.findIndex((s) => s.id === id);
      if (idx < 0) return prev;
      const target = direction === "up" ? idx - 1 : idx + 1;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      const [moved] = next.splice(idx, 1);
      next.splice(target, 0, moved);
      return next;
    });
  }, []);

  const removeSound = useCallback(
    (id: string) => {
      const removingOwner = lockOwnerRef.current === playersRef.current.get(id)?.a;
      if (removingOwner) clearLockScreen();
      // Si el sonido corre en el motor BPM, apagarlo ahí (parkPlayer es no-op).
      if (getSoundById(id)?.bpm !== undefined && bpmSystemRef.current === "engine") {
        bpmAudioEngine.stop(id);
      }
      // Estacionar (no destruir): si lo vuelven a agregar, arranca al instante.
      parkPlayer(id);
      const next = activeSoundsRef.current.filter((s) => s.id !== id);
      setActiveSounds(next);
      setLoadedPresetId(null);
      // Si ya no quedan sonidos rítmicos, liberar el reloj maestro BPM.
      const anyBpmLeft = next.some((s) => getSoundById(s.id)?.bpm !== undefined);
      if (!anyBpmLeft && bpmValueRef.current !== null) {
        stopBpmScheduler();
        bpmClockRef.current = null;
        bpmValueRef.current = null;
        bpmPausePhaseRef.current = null;
        bpmSystemRef.current = null;
        setActiveBpm(null);
      }
      if (next.length === 0) {
        setIsPlaying(false);
        isPlayingRef.current = false;
        setIsSheetOpen(false);
        clearSleepTimer();
      } else if (removingOwner) {
        syncLockScreen();
      }
    },
    [parkPlayer, clearSleepTimer, clearLockScreen, syncLockScreen, stopBpmScheduler],
  );

  const togglePlay = useCallback(() => {
    if (activeSoundsRef.current.length === 0) return;
    const next = !isPlayingRef.current;
    // Al retomar la mezcla, cortar la sesión (comparten Now Playing).
    if (next) stopSessionPlayback();
    applyPlaying(next);
    // Al pausar mantenemos el lock screen (en estado pausado) para poder
    // retomar desde la pantalla bloqueada; al retomar reaseguramos el owner.
    if (next) syncLockScreen();
  }, [applyPlaying, syncLockScreen]);

  const stopAll = useCallback(() => {
    // Frenar el reloj maestro BPM y liberar el clock.
    stopBpmScheduler();
    bpmClockRef.current = null;
    bpmValueRef.current = null;
    bpmPausePhaseRef.current = null;
    bpmSystemRef.current = null;
    setActiveBpm(null);
    bpmAudioEngine.stopAll();

    // Cancelar cualquier fade-out de audio en curso (re-entradas rápidas) y
    // apagar de inmediato sus players: ya están desacoplados de los refs, así
    // que si no los frenamos acá quedan sonando huérfanos a volumen parcial.
    if (fadeRafRef.current != null) {
      cancelAnimationFrame(fadeRafRef.current);
      fadeRafRef.current = null;
    }
    if (fadeTeardownRef.current != null) {
      const prevTeardown = fadeTeardownRef.current;
      fadeTeardownRef.current = null;
      prevTeardown();
    }

    // Quitar los listeners del loop YA: si siguen vivos, modulan el volumen en
    // cada tick y pelean contra el fade-out manual de abajo.
    loopSubsRef.current.forEach((subs) => {
      subs.forEach((s) => {
        try {
          s.remove();
        } catch {
          // ignore
        }
      });
    });
    loopSubsRef.current.clear();

    // Capturar los players a apagar y DESACOPLAR los refs de forma SÍNCRONA: si
    // alguien encadena stopAll() + toggleSound() en el mismo tick (p. ej. el tap
    // de una card de Sonidos Naturaleza al re-entrar), el nuevo player entra en
    // un map limpio y NO lo toca el fade/teardown de la mezcla anterior.
    const pairsToStop = [
      ...playersRef.current.values(),
      ...idlePlayersRef.current.values(),
    ];
    playersRef.current.clear();
    idlePlayersRef.current.clear();
    baseVolumesRef.current.clear();
    // Cortar cualquier fade-out de apagado en curso: stopAll hace su propio fade.
    parkFadeRef.current.forEach((iv) => clearInterval(iv));
    parkFadeRef.current.clear();

    // La UI reacciona AHORA (mismo tick): las cards se deseleccionan y animan su
    // giro/escala junto con el fade de la hoja, sin demora ni salto. El audio se
    // apaga aparte, abajo, con su propio fade-out. activeSoundsRef se resetea de
    // forma síncrona para que un toggleSound() encadenado lea el estado vacío.
    clearLockScreen();
    setActiveSounds([]);
    activeSoundsRef.current = [];
    setIsPlaying(false);
    isPlayingRef.current = false;
    setLoadedPresetId(null);
    setIsSheetOpen(false);
    clearSleepTimer();

    // Fade-out de audio (~340 ms) y recién después pause+remove: nada de corte
    // de golpe. El trabajo pesado (remove de varios players) queda al final del
    // fade, no en el mismo frame que arranca, para no trabar la animación.
    if (pairsToStop.length === 0) return;
    const startVols = pairsToStop.map((pair) => {
      let a = 0;
      let b = 0;
      try { a = pair.a.volume; } catch { /* ignore */ }
      try { b = pair.b.volume; } catch { /* ignore */ }
      return { pair, a, b };
    });
    const FADE_MS = 340;
    const t0 = Date.now();
    const teardown = () => {
      pairsToStop.forEach((pair) => {
        [pair.a, pair.b].forEach((p) => {
          try { p.pause(); } catch { /* ignore */ }
          try { p.remove(); } catch { /* ignore */ }
        });
      });
    };
    fadeTeardownRef.current = teardown;
    const step = () => {
      const k = Math.min(1, (Date.now() - t0) / FADE_MS);
      const m = 1 - k;
      startVols.forEach(({ pair, a, b }) => {
        try { pair.a.volume = a * m; } catch { /* ignore */ }
        try { pair.b.volume = b * m; } catch { /* ignore */ }
      });
      if (k < 1) {
        fadeRafRef.current = requestAnimationFrame(step);
      } else {
        fadeRafRef.current = null;
        fadeTeardownRef.current = null;
        teardown();
      }
    };
    fadeRafRef.current = requestAnimationFrame(step);
  }, [clearSleepTimer, clearLockScreen, stopBpmScheduler]);
  stopAllRef.current = stopAll;

  const openSheet = useCallback(() => setIsSheetOpen(true), []);
  const closeSheet = useCallback(() => setIsSheetOpen(false), []);

  const [inmersivoOpen, setInmersivoOpen] = useState(false);
  const [inmersivoPresetId, setInmersivoPresetId] = useState<string | null>(null);
  const openImmersivo = useCallback((presetId: string) => {
    setInmersivoPresetId(presetId);
    setInmersivoOpen(true);
  }, []);
  const closeImmersivo = useCallback(() => setInmersivoOpen(false), []);

  const importPreset = useCallback(
    (preset: MixPreset) => {
      const alreadyExists = presetsRef.current.some((p) => p.id === preset.id);
      if (alreadyExists) return;
      persistPresets([preset, ...presetsRef.current]);
    },
    [persistPresets],
  );

  const savePreset = useCallback(
    (input: SaveMixInput) => {
      if (activeSoundsRef.current.length === 0) return;
      const preset: MixPreset = {
        id: Date.now().toString(),
        name: input.name.trim() || "Mi mezcla",
        description: input.description?.trim() || undefined,
        image: input.image,
        category: input.category,
        sounds: activeSoundsRef.current.map((s) => ({ ...s })),
        createdAt: new Date().toISOString(),
      };
      persistPresets([preset, ...presetsRef.current]);
    },
    [persistPresets],
  );

  const updatePreset = useCallback(
    (id: string, input: SaveMixInput) => {
      const exists = presetsRef.current.some((p) => p.id === id);
      if (!exists) return;
      persistPresets(
        presetsRef.current.map((p) =>
          p.id === id
            ? {
                ...p,
                name: input.name.trim() || p.name,
                description: input.description?.trim() || undefined,
                image: input.image,
                coverUri: input.coverUri,
                coverGeometryId: input.coverGeometryId,
                coverCreationId: input.coverCreationId,
                category: input.category,
                sounds: activeSoundsRef.current.map((s) => ({ ...s })),
              }
            : p,
        ),
      );
      // La mezcla activa vuelve a estar "ligada" al preset recién actualizado.
      setLoadedPresetId(id);
      loadedPresetIdRef.current = id;
    },
    [persistPresets],
  );

  const updatePresetMeta = useCallback(
    (id: string, meta: MixMetaUpdate) => {
      const exists = presetsRef.current.some((p) => p.id === id);
      if (!exists) return;
      persistPresets(
        presetsRef.current.map((p) =>
          p.id === id
            ? {
                ...p,
                ...(meta.name !== undefined ? { name: meta.name.trim() || p.name } : {}),
                ...(meta.description !== undefined ? { description: meta.description?.trim() || undefined } : {}),
                ...(meta.image !== undefined ? { image: meta.image } : {}),
                ...(meta.coverUri !== undefined ? { coverUri: meta.coverUri } : {}),
                ...(meta.coverGeometryId !== undefined ? { coverGeometryId: meta.coverGeometryId } : {}),
                ...(meta.coverCreationId !== undefined ? { coverCreationId: meta.coverCreationId } : {}),
              }
            : p,
        ),
      );
    },
    [persistPresets],
  );

  const duplicatePreset = useCallback(
    (id: string) => {
      const orig = presetsRef.current.find((p) => p.id === id);
      if (!orig) return;
      const copy: MixPreset = {
        ...orig,
        id: Date.now().toString(),
        name: `${orig.name} (copia)`,
        createdAt: new Date().toISOString(),
        sharedId: undefined,
        sounds: orig.sounds.map((s) => ({ ...s })),
      };
      persistPresets([copy, ...presetsRef.current]);
    },
    [persistPresets],
  );

  const loadPreset = useCallback(
    (preset: MixPreset) => {
      // Mezcla y sesión son mutuamente excluyentes (comparten Now Playing).
      stopSessionPlayback();
      // Soltar el lock screen del owner viejo antes de desmontarlo.
      clearLockScreen();
      // Desmontar la mezcla actual
      loopSubsRef.current.forEach((subs) => {
        subs.forEach((s) => {
          try {
            s.remove();
          } catch {
            // ignore
          }
        });
      });
      loopSubsRef.current.clear();
      playersRef.current.forEach((pair) => {
        [pair.a, pair.b].forEach((p) => {
          try {
            p.pause();
          } catch {
            // ignore
          }
          try {
            p.remove();
          } catch {
            // ignore
          }
        });
      });
      playersRef.current.clear();
      idlePlayersRef.current.forEach((pair) => {
        [pair.a, pair.b].forEach((p) => {
          try {
            p.pause();
          } catch {
            // ignore
          }
          try {
            p.remove();
          } catch {
            // ignore
          }
        });
      });
      idlePlayersRef.current.clear();
      baseVolumesRef.current.clear();
      parkFadeRef.current.forEach((iv) => clearInterval(iv));
      parkFadeRef.current.clear();

      void ensureAudioMode();
      const playable = preset.sounds
        .filter((s) => SOUND_MAP[s.id])
        .slice(0, MAX_ACTIVE_SOUNDS);
      // Liberar el reloj maestro BPM previo y el motor antes de armar la nueva mezcla.
      stopBpmScheduler();
      bpmClockRef.current = null;
      bpmValueRef.current = null;
      bpmPausePhaseRef.current = null;
      bpmAudioEngine.stopAll();
      bpmSystemRef.current = null;
      const hasBpm = playable.some((s) => getSoundById(s.id)?.bpm !== undefined);
      if (hasBpm) {
        bpmSystemRef.current = bpmAudioEngine.isReady() ? "engine" : "expo";
      }

      const created: ActiveSound[] = [];
      playable.forEach((s) => {
        const def = getSoundById(s.id);
        if (def?.bpm !== undefined && bpmSystemRef.current === "engine") {
          void bpmAudioEngine.play(s.id, {
            bpm: def.bpm,
            loopBars: def.loopBars ?? 2,
            volume: s.volume,
          });
          created.push({ id: s.id, volume: s.volume });
        } else {
          const p = createPlayerFor(s.id, s.volume);
          if (p) created.push({ id: s.id, volume: s.volume });
        }
      });
      // Si el preset trae algún sonido rítmico, fijar el BPM activo.
      const firstBpm = created
        .map((s) => getSoundById(s.id)?.bpm)
        .find((bpm) => bpm !== undefined);
      if (firstBpm !== undefined) {
        bpmValueRef.current = firstBpm;
        setActiveBpm(firstBpm);
        if (bpmSystemRef.current === "expo") {
          bpmClockRef.current = Date.now();
          startBpmScheduler();
        }
      } else {
        setActiveBpm(null);
      }
      setActiveSounds(created);
      setIsPlaying(created.length > 0);
      isPlayingRef.current = created.length > 0;
      // Set sincrónico: syncLockScreen lee loadedPresetIdRef para el título.
      const nextLoadedId = created.length > 0 ? preset.id : null;
      setLoadedPresetId(nextLoadedId);
      loadedPresetIdRef.current = nextLoadedId;
      clearSleepTimer();
      if (created.length > 0) syncLockScreen();
    },
    [
      createPlayerFor,
      ensureAudioMode,
      clearSleepTimer,
      clearLockScreen,
      syncLockScreen,
      startBpmScheduler,
      stopBpmScheduler,
    ],
  );

  const deletePreset = useCallback(
    (id: string) => {
      persistPresets(presetsRef.current.filter((p) => p.id !== id));
      // Si se borra el preset que está sonando, la mezcla activa ya no proviene
      // de uno guardado → reaparece el botón Guardar.
      if (loadedPresetIdRef.current === id) setLoadedPresetId(null);
    },
    [persistPresets],
  );

  const setPresetShared = useCallback(
    (id: string, sharedId: number | null) => {
      persistPresets(
        presetsRef.current.map((p) =>
          p.id === id ? { ...p, sharedId: sharedId ?? undefined } : p,
        ),
      );
    },
    [persistPresets],
  );

  const togglePresetFavorite = useCallback(
    (id: string) => {
      persistPresets(
        presetsRef.current.map((p) =>
          p.id === id ? { ...p, favorited: !p.favorited } : p,
        ),
      );
    },
    [persistPresets],
  );

  const setSleepTimer = useCallback(
    (minutes: number | null) => {
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
          applyPlayingRef.current(false);
        } else {
          setSleepTimerRemaining(remaining);
        }
      }, 1000);
    },
    [],
  );

  // ── AppState: cuando la app vuelve al frente, verificar timer ────
  // setInterval se throttlea en background/pantalla bloqueada. Al reanudar
  // calculamos el tiempo restante real con Date.now() y paramos si expiró.
  useEffect(() => {
    const handleAppState = (nextState: AppStateStatus) => {
      if (nextState !== "active") return;
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
        applyPlayingRef.current(false);
      } else {
        setSleepTimerRemaining(remaining);
      }
    };
    const sub = AppState.addEventListener("change", handleAppState);
    return () => sub.remove();
  }, []);

  // ── Registrar la mezcla como "stoppable" por la sesión ────────────
  // (PlayerContext llama stopMixPlayback() al iniciar una sesión)
  useEffect(() => {
    registerMixStopper(() => stopAllRef.current());
    return () => registerMixStopper(null);
  }, []);

  // ── Limpieza al desmontar ─────────────────────────────────────────
  useEffect(() => {
    return () => {
      clearLockScreen();
      stopBpmScheduler();
      loopSubsRef.current.forEach((subs) => {
        subs.forEach((s) => {
          try {
            s.remove();
          } catch {
            // ignore
          }
        });
      });
      loopSubsRef.current.clear();
      playersRef.current.forEach((pair) => {
        [pair.a, pair.b].forEach((p) => {
          try {
            p.remove();
          } catch {
            // ignore
          }
        });
      });
      playersRef.current.clear();
      idlePlayersRef.current.forEach((pair) => {
        [pair.a, pair.b].forEach((p) => {
          try {
            p.remove();
          } catch {
            // ignore
          }
        });
      });
      idlePlayersRef.current.clear();
      parkFadeRef.current.forEach((iv) => clearInterval(iv));
      parkFadeRef.current.clear();
      if (sleepIntervalRef.current) clearInterval(sleepIntervalRef.current);
      void bpmAudioEngine.dispose();
    };
  }, [clearLockScreen, stopBpmScheduler]);

  const isActive = useCallback(
    (id: string) => activeSounds.some((s) => s.id === id),
    [activeSounds],
  );
  const getVolume = useCallback(
    (id: string) => activeSounds.find((s) => s.id === id)?.volume ?? DEFAULT_VOLUME,
    [activeSounds],
  );

  return (
    <MixerContext.Provider
      value={{
        activeSounds,
        isActive,
        getVolume,
        toggleSound,
        setVolume,
        removeSound,
        moveSound,
        isPlaying,
        togglePlay,
        stopAll,
        presets,
        savePreset,
        updatePreset,
        updatePresetMeta,
        duplicatePreset,
        loadPreset,
        deletePreset,
        setPresetShared,
        togglePresetFavorite,
        importPreset,
        loadedPresetId,
        activeBpm,
        sleepTimerRemaining,
        setSleepTimer,
        masterVolume,
        setMasterVolume,
        isSheetOpen,
        openSheet,
        closeSheet,
        inmersivoOpen,
        inmersivoPresetId,
        openImmersivo,
        closeImmersivo,
      }}
    >
      {children}
    </MixerContext.Provider>
  );
}

export function useMixer() {
  const ctx = useContext(MixerContext);
  if (!ctx) throw new Error("useMixer debe usarse dentro de <MixerProvider>");
  return ctx;
}
