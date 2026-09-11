import { createAudioPlayer, type AudioPlayer } from "expo-audio";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, AppState } from "react-native";
import { cancelAnimation, useSharedValue, withTiming } from "react-native-reanimated";

import { AUDIO_MAP } from "@/config/audio-map";
import {
  registerPreviewStopper,
  stopOtherAudioForPreview,
} from "@/context/audioBridge";
import type { Session } from "@/data/sessions";
import {
  SOUND_PREVIEW_DURATION_MS,
} from "@/lib/sound-preview";

export function useSoundPreview() {
  const playerRef = useRef<AudioPlayer | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const visualResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const progress = useSharedValue(0);

  const clearTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);

  const stop = useCallback(() => {
    clearTimer();
    cancelAnimation(progress);
    if (visualResetTimerRef.current) clearTimeout(visualResetTimerRef.current);
    visualResetTimerRef.current = setTimeout(() => {
      progress.value = 0;
      visualResetTimerRef.current = null;
    }, 350);
    try {
      playerRef.current?.pause();
      playerRef.current?.seekTo(0);
    } catch {}
    setActiveId(null);
    setIsPlaying(false);
  }, [clearTimer, progress]);

  const armFinish = useCallback((remainingMs: number) => {
    clearTimer();
    timerRef.current = setTimeout(stop, remainingMs);
  }, [clearTimer, stop]);

  const toggle = useCallback((session: Session) => {
    if (activeId === session.id) {
      stop();
      return;
    }

    const source = session.audioUri ? { uri: session.audioUri } : AUDIO_MAP[session.id];
    if (!source) {
      stop();
      Alert.alert(
        "Preview no disponible",
        "Esta sesión todavía no tiene un audio disponible para previsualizar.",
      );
      return;
    }

    stop();
    if (visualResetTimerRef.current) {
      clearTimeout(visualResetTimerRef.current);
      visualResetTimerRef.current = null;
    }
    stopOtherAudioForPreview();
    try {
      const player = playerRef.current ?? createAudioPlayer(null, { updateInterval: 100 });
      playerRef.current = player;
      player.loop = false;
      player.replace(source);
      player.seekTo(0);
      player.play();
      progress.value = 0;
      progress.value = withTiming(1, { duration: SOUND_PREVIEW_DURATION_MS });
      setActiveId(session.id);
      setIsPlaying(true);
      armFinish(SOUND_PREVIEW_DURATION_MS);
    } catch {
      stop();
    }
  }, [activeId, armFinish, progress, stop]);

  useEffect(() => {
    registerPreviewStopper(stop);
    const appStateSubscription = AppState.addEventListener("change", (state) => {
      if (state !== "active") stop();
    });
    return () => {
      appStateSubscription.remove();
      if (visualResetTimerRef.current) clearTimeout(visualResetTimerRef.current);
      registerPreviewStopper(null);
      stop();
      playerRef.current?.release();
      playerRef.current = null;
    };
  }, [stop]);

  return { activeId, isPlaying, progress, toggle, stop };
}