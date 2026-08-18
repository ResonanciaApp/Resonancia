import { useEffect, useRef, useState, useCallback } from "react";
import { createAudioPlayer, type AudioPlayer } from "expo-audio";
import { registerSoundStopper, stopSessionPlayback, stopMixPlayback, stopChatPlayback } from "@/context/audioBridge";

interface UseDescansoPlayerOptions {
  timerMinutes: number;
  fadeVolume: boolean;
}

interface UseDescansoPlayerReturn {
  selectedId: string | null;
  isPlaying: boolean;
  /** True mientras el audio remoto todavía está cargando (antes del primer frame audible). */
  isLoading: boolean;
  elapsedSeconds: number;
  durationSeconds: number;
  toggle: (id: string, audioUri: string | null) => void;
  togglePause: () => void;
  stop: () => void;
}

const FADE_TICK_MS = 2000;
const ELAPSED_TICK_MS = 1000;

export function useDescansoPlayer({
  timerMinutes,
  fadeVolume,
}: UseDescansoPlayerOptions): UseDescansoPlayerReturn {
  const playerRef      = useRef<AudioPlayer | null>(null);
  const fadeTimerRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [selectedId,  setSelectedId]  = useState<string | null>(null);
  const [isPlaying,   setIsPlaying]   = useState(false);
  const [isLoading,   setIsLoading]   = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const durationSeconds = timerMinutes > 0 ? timerMinutes * 60 : 0;

  const clearFade = useCallback(() => {
    if (fadeTimerRef.current) {
      clearInterval(fadeTimerRef.current);
      fadeTimerRef.current = null;
    }
  }, []);

  const clearElapsed = useCallback(() => {
    if (elapsedTimerRef.current) {
      clearInterval(elapsedTimerRef.current);
      elapsedTimerRef.current = null;
    }
  }, []);

  const stopCurrent = useCallback(() => {
    clearFade();
    clearElapsed();
    if (playerRef.current) {
      try { playerRef.current.pause(); } catch {}
      try { playerRef.current.remove(); } catch {}
      playerRef.current = null;
    }
    setSelectedId(null);
    setIsPlaying(false);
    setIsLoading(false);
    setElapsedSeconds(0);
  }, [clearFade, clearElapsed]);

  const togglePause = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;
    setIsPlaying((prev) => {
      const next = !prev;
      try {
        if (next) player.play(); else player.pause();
      } catch {}
      return next;
    });
  }, []);

  const startFade = useCallback((totalMs: number) => {
    clearFade();
    if (!fadeVolume || totalMs <= 0 || !playerRef.current) return;
    const steps       = Math.ceil(totalMs / FADE_TICK_MS);
    let stepsDone     = 0;
    fadeTimerRef.current = setInterval(() => {
      stepsDone++;
      const player = playerRef.current;
      if (!player) { clearFade(); return; }
      const newVol = Math.max(0, 1 - stepsDone / steps);
      try { player.volume = newVol; } catch {}
      if (newVol <= 0) {
        clearFade();
        stopCurrent();
      }
    }, FADE_TICK_MS);
  }, [fadeVolume, clearFade, stopCurrent]);

  const toggle = useCallback((id: string, audioUri: string | null) => {
    if (selectedId === id) {
      stopCurrent();
      return;
    }
    stopCurrent();
    // Sonido de Descanso y sesión/mezcla son mutuamente excluyentes (comparten Now Playing).
    stopSessionPlayback();
    stopMixPlayback();
    stopChatPlayback();
    if (!audioUri) {
      setSelectedId(id);
      setIsPlaying(false);
      return;
    }
    const player = createAudioPlayer({ uri: audioUri });
    player.loop  = true;
    player.play();
    playerRef.current = player;
    // Spinner de carga hasta que el buffer remoto realmente empieza a sonar.
    setIsLoading(true);
    const sub = player.addListener("playbackStatusUpdate", (status) => {
      // Ignorar si este player ya fue reemplazado/parado.
      if (playerRef.current !== player) { sub.remove(); return; }
      if (status.isLoaded && (status.playing || status.currentTime > 0)) {
        setIsLoading(false);
        sub.remove();
      }
    });
    setSelectedId(id);
    setIsPlaying(true);
    setElapsedSeconds(0);

    clearElapsed();
    elapsedTimerRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, ELAPSED_TICK_MS);

    if (timerMinutes > 0) {
      const totalMs = timerMinutes * 60 * 1000;
      setTimeout(() => {
        if (!fadeVolume) stopCurrent();
      }, totalMs);
      startFade(totalMs);
    }
  }, [selectedId, timerMinutes, fadeVolume, stopCurrent, startFade, clearElapsed]);

  useEffect(() => {
    registerSoundStopper(() => stopCurrent());
    return () => registerSoundStopper(null);
  }, [stopCurrent]);

  useEffect(() => () => { stopCurrent(); }, [stopCurrent]);

  return { selectedId, isPlaying, isLoading, elapsedSeconds, durationSeconds, toggle, togglePause, stop: stopCurrent };
}
