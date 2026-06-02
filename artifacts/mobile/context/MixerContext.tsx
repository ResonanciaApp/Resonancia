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
const PRESETS_KEY = "@resonance_mixer_presets";
const DEFAULT_VOLUME = 0.7;

/** Las dos capas del mismo sonido que se crossfadean entre sí (ver MixerContext). */
type SoundPlayers = { a: AudioPlayer; b: AudioPlayer };

export type ActiveSound = { id: string; volume: number };
export type MixPreset = {
  id: string;
  name: string;
  description?: string;
  /** Key de la galería de imágenes (config/mix-images.ts), ej: "lluvia". */
  image?: string;
  category: MixCategory;
  sounds: ActiveSound[];
  createdAt: string;
  /** ID de la mezcla compartida en la comunidad (si el autor la compartió). */
  sharedId?: number;
};

export type SaveMixInput = {
  name: string;
  description?: string;
  image?: string;
  category: MixCategory;
};

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
  /** Clona un preset existente con un nuevo id y nombre "(copia)". */
  duplicatePreset: (id: string) => void;
  loadPreset: (preset: MixPreset) => void;
  deletePreset: (id: string) => void;
  /** Marca/desmarca un preset local como compartido en la comunidad. */
  setPresetShared: (id: string, sharedId: number | null) => void;
  /** ID del preset cargado actualmente (null si la mezcla activa no proviene de uno guardado o fue modificada). */
  loadedPresetId: string | null;
  sleepTimerRemaining: number | null;
  setSleepTimer: (minutes: number | null) => void;
  /** Si el editor en hoja inferior (MixerSheet) está abierto. */
  isSheetOpen: boolean;
  openSheet: () => void;
  closeSheet: () => void;
};

const MixerContext = createContext<MixerContextType | null>(null);

export function MixerProvider({ children }: { children: React.ReactNode }) {
  const [activeSounds, setActiveSounds] = useState<ActiveSound[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [presets, setPresets] = useState<MixPreset[]>([]);
  const [sleepTimerRemaining, setSleepTimerRemaining] = useState<number | null>(null);
  const [loadedPresetId, setLoadedPresetId] = useState<string | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  /**
   * Dos capas (a/b) del MISMO sonido por id, para el crossfade del loop. Las dos
   * suenan en loop nativo desfasadas media vuelta: cuando una llega a su corte
   * (volumen 0) la otra está en su pico, así el empalme es imperceptible. La capa
   * `a` es además el ancla del lock-screen (siempre playing=true).
   */
  const playersRef = useRef<Map<string, SoundPlayers>>(new Map());
  /** Subscripciones de status (fade) por sonido: una por capa. */
  const loopSubsRef = useRef<Map<string, { remove: () => void }[]>>(new Map());
  /**
   * Volumen "objetivo" elegido por el usuario para cada sonido. El volumen REAL
   * del player se modula con un fade en los bordes del loop (ver createPlayerFor),
   * así que la fuente de verdad del nivel deseado vive acá, no en player.volume.
   */
  const baseVolumesRef = useRef<Map<string, number>>(new Map());
  const sleepIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
    setIsPlaying(next);
  }, []);
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
    void ensureAudioMode();
  }, [ensureAudioMode]);

  const createPlayerFor = useCallback((id: string, volume: number): SoundPlayers | null => {
    const file = SOUND_MAP[id];
    if (!file) return null;
    try {
      baseVolumesRef.current.set(id, volume);

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
        p.volume = 0; // arranca en 0; el gain del fade lo sube
        return p;
      };
      const a = makeLayer();
      const b = makeLayer();
      const pair: SoundPlayers = { a, b };

      // La capa B se desfasa media vuelta una sola vez, cuando ya hay duración.
      let bOffsetApplied = false;
      // Phase-lock: dos players nativos independientes pueden ir driftando en
      // sesiones de horas (cada uno reinicia su loop en un instante ligeramente
      // distinto). Si se rompe el desfase de 180°, sin²+cos² deja de dar 1 y
      // reaparece la ondulación de volumen. Periódicamente recentramos B hacia
      // A+dur/2, PERO solo cuando B está casi en silencio (gain bajo, o sea cerca
      // de su borde de loop) para que el seek sea inaudible. Throttle a 2 s.
      let lastResync = 0;

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
          if (isSecondary && !bOffsetApplied && dur > 0) {
            bOffsetApplied = true;
            try {
              void p.seekTo(dur / 2);
            } catch {
              // ignore
            }
          }
          const base = baseVolumesRef.current.get(id) ?? volume;
          const pos = status.currentTime ?? 0;
          const gain = dur > 0 ? Math.abs(Math.sin(Math.PI * (pos / dur))) : 1;
          const target = base * gain;
          if (Math.abs(p.volume - target) > 0.004) {
            try {
              p.volume = target;
            } catch {
              // ignore
            }
          }

          // Recentrado de fase de B contra A (solo en el valle de gain de B).
          if (isSecondary && bOffsetApplied && dur > 0 && gain < 0.12) {
            const aPos = cur.a.currentTime ?? 0;
            const expected = (((aPos + dur / 2) % dur) + dur) % dur;
            let err = Math.abs(pos - expected);
            err = Math.min(err, dur - err); // distancia circular
            const now = Date.now();
            if (err > 0.06 && now - lastResync > 2000) {
              lastResync = now;
              try {
                void p.seekTo(expected);
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

  const destroyPlayer = useCallback((id: string) => {
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
    const pair = playersRef.current.get(id);
    if (!pair) return;
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
    playersRef.current.delete(id);
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
        destroyPlayer(id);
        const next = prev.filter((s) => s.id !== id);
        setActiveSounds(next);
        setLoadedPresetId(null);
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

      // Mezcla y sesión son mutuamente excluyentes (comparten Now Playing).
      stopSessionPlayback();
      void ensureAudioMode();
      const player = createPlayerFor(id, DEFAULT_VOLUME);
      // Sin archivo de audio (o falla de carga): no agregar un sonido "fantasma"
      if (!player) return true;
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
      destroyPlayer,
      ensureAudioMode,
      clearSleepTimer,
      applyPlaying,
      syncLockScreen,
      clearLockScreen,
    ],
  );

  const setVolume = useCallback((id: string, volume: number) => {
    // Solo guardar el nivel deseado: el listener del crossfade lo aplica con el
    // gain de cada capa en el próximo tick (~120 ms). NO setear player.volume
    // directo acá: pisaría el gain del fade y daría un salto de volumen en el
    // empalme del loop.
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
      destroyPlayer(id);
      const next = activeSoundsRef.current.filter((s) => s.id !== id);
      setActiveSounds(next);
      setLoadedPresetId(null);
      if (next.length === 0) {
        setIsPlaying(false);
        isPlayingRef.current = false;
        setIsSheetOpen(false);
        clearSleepTimer();
      } else if (removingOwner) {
        syncLockScreen();
      }
    },
    [destroyPlayer, clearSleepTimer, clearLockScreen, syncLockScreen],
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
    baseVolumesRef.current.clear();
    clearLockScreen();
    setActiveSounds([]);
    setIsPlaying(false);
    isPlayingRef.current = false;
    setLoadedPresetId(null);
    setIsSheetOpen(false);
    clearSleepTimer();
  }, [clearSleepTimer, clearLockScreen]);
  stopAllRef.current = stopAll;

  const openSheet = useCallback(() => setIsSheetOpen(true), []);
  const closeSheet = useCallback(() => setIsSheetOpen(false), []);

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
      baseVolumesRef.current.clear();

      void ensureAudioMode();
      const playable = preset.sounds
        .filter((s) => SOUND_MAP[s.id])
        .slice(0, MAX_ACTIVE_SOUNDS);
      const created: ActiveSound[] = [];
      playable.forEach((s) => {
        const p = createPlayerFor(s.id, s.volume);
        if (p) created.push({ id: s.id, volume: s.volume });
      });
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
    [createPlayerFor, ensureAudioMode, clearSleepTimer, clearLockScreen, syncLockScreen],
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
      if (sleepIntervalRef.current) clearInterval(sleepIntervalRef.current);
    };
  }, [clearLockScreen]);

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
        duplicatePreset,
        loadPreset,
        deletePreset,
        setPresetShared,
        loadedPresetId,
        sleepTimerRemaining,
        setSleepTimer,
        isSheetOpen,
        openSheet,
        closeSheet,
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
