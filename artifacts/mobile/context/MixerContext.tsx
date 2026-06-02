import { type AudioPlayer, createAudioPlayer, setAudioModeAsync } from "expo-audio";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "react-native";
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

  /** Un AudioPlayer por sonido activo, keyed por sound id */
  const playersRef = useRef<Map<string, AudioPlayer>>(new Map());
  const sleepIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const activeSoundsRef = useRef<ActiveSound[]>([]);
  activeSoundsRef.current = activeSounds;
  const isPlayingRef = useRef(false);
  isPlayingRef.current = isPlaying;
  const presetsRef = useRef<MixPreset[]>([]);
  presetsRef.current = presets;
  const loadedPresetIdRef = useRef<string | null>(null);
  loadedPresetIdRef.current = loadedPresetId;

  // ── Lock-screen / Now Playing ─────────────────────────────────────
  /** Player que "posee" los controles de pantalla bloqueada (uno solo a la vez). */
  const lockOwnerRef = useRef<AudioPlayer | null>(null);
  /** Suscripción al status del owner (para reflejar play/pausa remoto). */
  const lockSubRef = useRef<{ remove: () => void } | null>(null);
  /** Activación postergada hasta que el track tenga duración válida (evita NaN). */
  const lockPendingRef = useRef(false);

  /** Reproduce/pausa todos los players de la mezcla y actualiza el estado. */
  const applyPlaying = useCallback((next: boolean) => {
    isPlayingRef.current = next; // sincrónico: el listener del lock screen lo lee
    playersRef.current.forEach((p) => {
      try {
        next ? p.play() : p.pause();
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
    const first = playersRef.current.values().next().value as AudioPlayer | undefined;
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
    lockPendingRef.current = true;
    lockSubRef.current = first.addListener("playbackStatusUpdate", (status) => {
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
      // TODA la mezcla. Comparamos contra el ref (actualizado sincrónicamente
      // en applyPlaying) para no entrar en bucle con nuestros propios cambios.
      if (typeof status.playing === "boolean" && status.playing !== isPlayingRef.current) {
        applyPlayingRef.current(status.playing);
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

  const createPlayerFor = useCallback((id: string, volume: number) => {
    const file = SOUND_MAP[id];
    if (!file) return null;
    try {
      const player = createAudioPlayer(null);
      player.loop = true;
      player.replace(file);
      player.volume = volume;
      player.play();
      playersRef.current.set(id, player);
      return player;
    } catch {
      return null;
    }
  }, []);

  const destroyPlayer = useCallback((id: string) => {
    const p = playersRef.current.get(id);
    if (!p) return;
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
    playersRef.current.delete(id);
  }, []);

  const clearSleepTimer = useCallback(() => {
    if (sleepIntervalRef.current) {
      clearInterval(sleepIntervalRef.current);
      sleepIntervalRef.current = null;
    }
    setSleepTimerRemaining(null);
  }, []);

  const toggleSound = useCallback(
    (id: string): boolean => {
      const prev = activeSoundsRef.current;
      const exists = prev.some((s) => s.id === id);

      if (exists) {
        const removingOwner = lockOwnerRef.current === playersRef.current.get(id);
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
    const p = playersRef.current.get(id);
    if (p) {
      try {
        p.volume = volume;
      } catch {
        // ignore
      }
    }
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
      const removingOwner = lockOwnerRef.current === playersRef.current.get(id);
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
    playersRef.current.forEach((p) => {
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
    playersRef.current.clear();
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
      playersRef.current.forEach((p) => {
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
      playersRef.current.clear();

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
        setSleepTimerRemaining(null);
        return;
      }
      setSleepTimerRemaining(minutes * 60);
      sleepIntervalRef.current = setInterval(() => {
        setSleepTimerRemaining((prev) => {
          if (prev == null) return null;
          if (prev <= 1) {
            if (sleepIntervalRef.current) {
              clearInterval(sleepIntervalRef.current);
              sleepIntervalRef.current = null;
            }
            applyPlayingRef.current(false);
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    },
    [],
  );

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
      playersRef.current.forEach((p) => {
        try {
          p.remove();
        } catch {
          // ignore
        }
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
