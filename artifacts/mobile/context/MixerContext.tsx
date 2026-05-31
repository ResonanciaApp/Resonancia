import { type AudioPlayer, createAudioPlayer, setAudioModeAsync } from "expo-audio";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { SOUND_MAP } from "@/config/sound-map";
import type { MixCategory } from "@/data/mix-categories";

/** Máximo de sonidos sonando a la vez (CPU/batería en móviles normales) */
export const MAX_ACTIVE_SOUNDS = 5;
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
  isPlaying: boolean;
  togglePlay: () => void;
  stopAll: () => void;
  presets: MixPreset[];
  savePreset: (input: SaveMixInput) => void;
  loadPreset: (preset: MixPreset) => void;
  deletePreset: (id: string) => void;
  /** ID del preset cargado actualmente (null si la mezcla activa no proviene de uno guardado o fue modificada). */
  loadedPresetId: string | null;
  sleepTimerRemaining: number | null;
  setSleepTimer: (minutes: number | null) => void;
};

const MixerContext = createContext<MixerContextType | null>(null);

export function MixerProvider({ children }: { children: React.ReactNode }) {
  const [activeSounds, setActiveSounds] = useState<ActiveSound[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [presets, setPresets] = useState<MixPreset[]>([]);
  const [sleepTimerRemaining, setSleepTimerRemaining] = useState<number | null>(null);
  const [loadedPresetId, setLoadedPresetId] = useState<string | null>(null);

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

  // ── Cargar presets guardados ──────────────────────────────────────
  useEffect(() => {
    AsyncStorage.getItem(PRESETS_KEY).then((val) => {
      if (!val) return;
      try {
        const parsed = JSON.parse(val) as MixPreset[];
        // Migración: mezclas viejas no tenían categoría → default "dormir"
        const migrated = parsed.map((p) => ({
          ...p,
          category: p.category ?? "dormir",
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
      await setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: true });
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
        destroyPlayer(id);
        const next = prev.filter((s) => s.id !== id);
        setActiveSounds(next);
        setLoadedPresetId(null);
        if (next.length === 0) {
          setIsPlaying(false);
          clearSleepTimer();
        }
        return true;
      }

      if (prev.length >= MAX_ACTIVE_SOUNDS) return false;

      void ensureAudioMode();
      const player = createPlayerFor(id, DEFAULT_VOLUME);
      // Sin archivo de audio (o falla de carga): no agregar un sonido "fantasma"
      if (!player) return true;
      // Si la mezcla estaba pausada, retomar todos al sumar un sonido
      if (!isPlayingRef.current) {
        playersRef.current.forEach((p) => {
          try {
            p.play();
          } catch {
            // ignore
          }
        });
        setIsPlaying(true);
      }
      setActiveSounds([...prev, { id, volume: DEFAULT_VOLUME }]);
      setLoadedPresetId(null);
      return true;
    },
    [createPlayerFor, destroyPlayer, ensureAudioMode, clearSleepTimer],
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

  const removeSound = useCallback(
    (id: string) => {
      destroyPlayer(id);
      const next = activeSoundsRef.current.filter((s) => s.id !== id);
      setActiveSounds(next);
      setLoadedPresetId(null);
      if (next.length === 0) {
        setIsPlaying(false);
        clearSleepTimer();
      }
    },
    [destroyPlayer, clearSleepTimer],
  );

  const togglePlay = useCallback(() => {
    if (activeSoundsRef.current.length === 0) return;
    const next = !isPlayingRef.current;
    playersRef.current.forEach((p) => {
      try {
        next ? p.play() : p.pause();
      } catch {
        // ignore
      }
    });
    setIsPlaying(next);
  }, []);

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
    setActiveSounds([]);
    setIsPlaying(false);
    setLoadedPresetId(null);
    clearSleepTimer();
  }, [clearSleepTimer]);

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

  const loadPreset = useCallback(
    (preset: MixPreset) => {
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
      setLoadedPresetId(created.length > 0 ? preset.id : null);
      clearSleepTimer();
    },
    [createPlayerFor, ensureAudioMode, clearSleepTimer],
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
            playersRef.current.forEach((p) => {
              try {
                p.pause();
              } catch {
                // ignore
              }
            });
            setIsPlaying(false);
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    },
    [],
  );

  // ── Limpieza al desmontar ─────────────────────────────────────────
  useEffect(() => {
    return () => {
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
  }, []);

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
        isPlaying,
        togglePlay,
        stopAll,
        presets,
        savePreset,
        loadPreset,
        deletePreset,
        loadedPresetId,
        sleepTimerRemaining,
        setSleepTimer,
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
