import { useEffect, useRef, useState, useCallback } from "react";
import { createAudioPlayer, type AudioPlayer } from "expo-audio";

interface UseDescansoPlayerOptions {
  timerMinutes: number;
  fadeVolume: boolean;
}

interface UseDescansoPlayerReturn {
  selectedId: string | null;
  isPlaying: boolean;
  toggle: (id: string, audioUri: string | null) => void;
  stop: () => void;
}

const FADE_TICK_MS = 2000;

export function useDescansoPlayer({
  timerMinutes,
  fadeVolume,
}: UseDescansoPlayerOptions): UseDescansoPlayerReturn {
  const playerRef     = useRef<AudioPlayer | null>(null);
  const fadeTimerRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const [selectedId,  setSelectedId]  = useState<string | null>(null);
  const [isPlaying,   setIsPlaying]   = useState(false);

  const clearFade = useCallback(() => {
    if (fadeTimerRef.current) {
      clearInterval(fadeTimerRef.current);
      fadeTimerRef.current = null;
    }
  }, []);

  const stopCurrent = useCallback(() => {
    clearFade();
    if (playerRef.current) {
      try { playerRef.current.pause(); } catch {}
      try { playerRef.current.remove(); } catch {}
      playerRef.current = null;
    }
    setSelectedId(null);
    setIsPlaying(false);
  }, [clearFade]);

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
    if (!audioUri) {
      setSelectedId(id);
      setIsPlaying(false);
      return;
    }
    const player = createAudioPlayer({ uri: audioUri });
    player.loop  = true;
    player.play();
    playerRef.current = player;
    setSelectedId(id);
    setIsPlaying(true);

    if (timerMinutes > 0) {
      const totalMs = timerMinutes * 60 * 1000;
      setTimeout(() => {
        if (!fadeVolume) stopCurrent();
      }, totalMs);
      startFade(totalMs);
    }
  }, [selectedId, timerMinutes, fadeVolume, stopCurrent, startFade]);

  useEffect(() => () => { stopCurrent(); }, [stopCurrent]);

  return { selectedId, isPlaying, toggle, stop: stopCurrent };
}
