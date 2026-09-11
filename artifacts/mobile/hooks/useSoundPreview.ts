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
  getSoundPreviewElapsed,
  getSoundPreviewRemaining,
  SOUND_PREVIEW_DURATION_MS,
} from "@/lib/sound-preview";

export function useSoundPreview() {
  const playerRef = useRef<AudioPlayer | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startedAtRef = useRef(0);
  const elapsedRef = useRef(0);
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
    progress.value = 0;
    elapsedRef.current = 0;
    try {
      playerRef.current?.pause();
      playerRef.current?.seekTo(0);
    } catch {}
    setActiveId(null);
    setIsPlaying(false);
  }, [clearTimer, progress]);

  const armFinish = useCallback((remainingMs: number) => {
    clearTimer();
    startedAtRef.current = Date.now();
    timerRef.current = setTimeout(stop, remainingMs);
  }, [clearTimer, stop]);

  const toggle = useCallback((session: Session) => {
    if (activeId === session.id) {
      if (isPlaying) {
        clearTimer();
        elapsedRef.current = getSoundPreviewElapsed(
          elapsedRef.current,
          startedAtRef.current,
          Date.now(),
        );
        cancelAnimation(progress);
        playerRef.current?.pause();
        setIsPlaying(false);
      } else {
        const remaining = getSoundPreviewRemaining(elapsedRef.current);
        if (remaining <= 0) {
          stop();
          return;
        }
        startedAtRef.current = Date.now();
        playerRef.current?.play();
        progress.value = withTiming(1, { duration: remaining });
        setIsPlaying(true);
        armFinish(remaining);
      }
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
    stopOtherAudioForPreview();
    try {
      const player = playerRef.current ?? createAudioPlayer(null, { updateInterval: 100 });
      playerRef.current = player;
      player.loop = false;
      player.replace(source);
      player.seekTo(0);
      player.play();
      elapsedRef.current = 0;
      startedAtRef.current = Date.now();
      progress.value = 0;
      progress.value = withTiming(1, { duration: SOUND_PREVIEW_DURATION_MS });
      setActiveId(session.id);
      setIsPlaying(true);
      armFinish(SOUND_PREVIEW_DURATION_MS);
    } catch {
      stop();
    }
  }, [activeId, armFinish, clearTimer, isPlaying, progress, stop]);

  useEffect(() => {
    registerPreviewStopper(stop);
    const appStateSubscription = AppState.addEventListener("change", (state) => {
      if (state !== "active") stop();
    });
    return () => {
      appStateSubscription.remove();
      registerPreviewStopper(null);
      stop();
      playerRef.current?.release();
      playerRef.current = null;
    };
  }, [stop]);

  return { activeId, isPlaying, progress, toggle, stop };
}