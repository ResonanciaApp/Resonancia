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
/**
 * Cuántos sonidos apagados se mantienen CARGADOS en memoria (pausados+muteados)
 * para que volver a activarlos sea instantáneo (sin esperar el decode del mp3).
 * Al superar el tope se descarta el más viejo de verdad (libera memoria).
 */
const IDLE_CACHE_MAX = 12;
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
        p.volume = 0; // arranca en 0; el gain del crossfade lo sube
        return p;
      };
      const a = makeLayer();
      const b = makeLayer();
      const pair: SoundPlayers = { a, b };

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
      let audibleStart = 0; // primer tick con dur válida → ancla del fade-in
      const STARTUP_FADE_MS = 350;
      // Recentrado de drift a largo plazo (sesiones de horas): dos loops nativos
      // se desincronizan de a poco; si se rompe el desfase de 180° sin²+cos²
      // deja de dar 1 y reaparece la ondulación. Recentramos B hacia A+dur/2
      // solo en su valle de gain (seek inaudible), con throttle de 2 s.
      let lastResync = 0;

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

          // Primer tick con duración válida = primer audio real → ancla del fade-in.
          if (dur > 0 && audibleStart === 0) audibleStart = Date.now();

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
            audibleStart === 0 ? 0 : Math.min(1, (Date.now() - audibleStart) / STARTUP_FADE_MS);
          // B muteada hasta confirmar su salto al pico (así no se oye ningún
          // transitorio del seed); A siempre suena (su borde de loop es inaudible).
          setVol(p, (isSecondary && !bSeeded ? 0 : base * gain) * startup);

          // Recentrado de drift de la capa B contra A: mantener el desfase dur/2,
          // corrigiendo SOLO en el valle de B (gain bajo → seek inaudible).
          if (isSecondary && dur > 0 && offsetConfirmed && gain < 0.12) {
            const aPos = cur.a.currentTime ?? 0;
            const desired = (((aPos + dur / 2) % dur) + dur) % dur;
            let err = Math.abs(pos - desired);
            err = Math.min(err, dur - err); // distancia circular
            const now = Date.now();
            if (err > 0.06 && now - lastResync > 2000) {
              lastResync = now;
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
      [pair.a, pair.b].forEach((p) => {
        try {
          p.volume = 0; // muteado mientras está estacionado
        } catch {
          // ignore
        }
        try {
          p.pause();
        } catch {
          // ignore
        }
      });
      playersRef.current.delete(id);
      // Reinsertar al final para que cuente como "el más reciente" (LRU).
      idlePlayersRef.current.delete(id);
      idlePlayersRef.current.set(id, pair);
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
    baseVolumesRef.current.set(id, vol);
    // Volver a registrar ANTES de play() (el guard del listener compara identidad).
    playersRef.current.set(id, pair);
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
        // Estacionar (no destruir) para que reactivarlo sea instantáneo.
        parkPlayer(id);
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
      // Si está estacionado (apagado hace poco), retomarlo al instante; si no,
      // crear el player desde cero (decodifica el mp3).
      const player = resumePlayer(id, DEFAULT_VOLUME) ?? createPlayerFor(id, DEFAULT_VOLUME);
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
      resumePlayer,
      parkPlayer,
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
      // Estacionar (no destruir): si lo vuelven a agregar, arranca al instante.
      parkPlayer(id);
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
    [parkPlayer, clearSleepTimer, clearLockScreen, syncLockScreen],
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
    clearLockScreen();
    setActiveSounds([]);
    // Resetear el ref de forma SÍNCRONA: el estado (setActiveSounds) recién se
    // refleja en el próximo render, pero si alguien encadena stopAll() +
    // toggleSound() en el mismo tick (p. ej. el tap de una card de Sonidos
    // Naturaleza al re-entrar), toggleSound leería activeSoundsRef con el sonido
    // todavía "presente" y lo quitaría en vez de agregarlo → no suena nada.
    activeSoundsRef.current = [];
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
