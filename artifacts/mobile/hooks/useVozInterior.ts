import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
  createAudioPlayer,
  type AudioPlayer,
} from "expo-audio";
import { useCallback, useEffect, useRef, useState } from "react";

export type VozEntry = {
  id: string;
  uri: string;
  durationMs: number;
  createdAt: string;
  title?: string;
  isFavorite?: boolean;
};

const STORAGE_KEY = "@voz_interior";

export function useVozInterior() {
  const [entries, setEntries] = useState<VozEntry[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [playingPositionMs, setPlayingPositionMs] = useState(0);

  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const soundRef = useRef<AudioPlayer | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const isRecordingRef = useRef(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => raw && setEntries(JSON.parse(raw) as VozEntry[]))
      .catch(() => {});
    return () => {
      timerRef.current && clearInterval(timerRef.current);
      try { soundRef.current?.pause(); soundRef.current?.remove(); } catch {}
    };
  }, []);

  const persist = useCallback(async (updated: VozEntry[]) => {
    setEntries(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }, []);

  const startRecording = useCallback(async (): Promise<boolean> => {
    try {
      const perm = await AudioModule.requestRecordingPermissionsAsync();
      if (!perm.granted) return false;

      // Detener reproducción activa antes de grabar
      try { soundRef.current?.pause(); soundRef.current?.remove(); } catch {}
      soundRef.current = null;

      try {
        await setAudioModeAsync({
          allowsRecording: true,
          playsInSilentMode: true,
        });
      } catch {}

      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();

      isRecordingRef.current = true;
      startTimeRef.current = Date.now();
      setElapsedMs(0);
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setElapsedMs(Date.now() - startTimeRef.current);
      }, 100);

      return true;
    } catch {
      setIsRecording(false);
      return false;
    }
  }, [audioRecorder]);

  const stopRecording = useCallback(async () => {
    if (!isRecordingRef.current) return;
    isRecordingRef.current = false;

    timerRef.current && clearInterval(timerRef.current);
    timerRef.current = null;

    const durationMs = Date.now() - startTimeRef.current;

    setIsRecording(false);
    setElapsedMs(0);

    try {
      await audioRecorder.stop();
      const uri = audioRecorder.uri;
      if (uri) {
        const entry: VozEntry = {
          id: Date.now().toString(),
          uri,
          durationMs,
          createdAt: new Date().toISOString(),
          title: "",
          isFavorite: false,
        };
        setEntries((prev) => {
          const updated = [entry, ...prev];
          AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated)).catch(() => {});
          return updated;
        });
      }
    } catch {}

    try {
      await setAudioModeAsync({
        allowsRecording: false,
        playsInSilentMode: true,
      });
    } catch {}
  }, [audioRecorder]);

  const deleteAllEntries = useCallback(async () => {
    try { soundRef.current?.pause(); soundRef.current?.remove(); } catch {}
    soundRef.current = null;
    setPlayingId(null);
    setPlayingPositionMs(0);
    setEntries([]);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([]));
  }, []);

  const deleteEntry = useCallback(
    async (id: string) => {
      setEntries((prev) => {
        const updated = prev.filter((e) => e.id !== id);
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated)).catch(() => {});
        return updated;
      });
      if (playingId === id) {
        try { soundRef.current?.pause(); soundRef.current?.remove(); } catch {}
        soundRef.current = null;
        setPlayingId(null);
        setPlayingPositionMs(0);
      }
    },
    [playingId],
  );

  const updateEntry = useCallback(
    async (id: string, patch: Partial<Pick<VozEntry, "title" | "isFavorite">>) => {
      setEntries((prev) => {
        const updated = prev.map((e) => (e.id === id ? { ...e, ...patch } : e));
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated)).catch(() => {});
        return updated;
      });
    },
    [],
  );

  const playEntry = useCallback(
    async (entry: VozEntry) => {
      try {
        // Limpiar player anterior
        if (soundRef.current) {
          try { soundRef.current.pause(); soundRef.current.remove(); } catch {}
          soundRef.current = null;
        }

        // Tap en la misma entrada → detener
        if (playingId === entry.id) {
          setPlayingId(null);
          setPlayingPositionMs(0);
          return;
        }

        // expo-audio es el dueño único de la sesión de audio; no reconfigurar aquí.
        const player = createAudioPlayer({ uri: entry.uri });
        player.play();

        // Seguimiento de posición mediante polling liviano (~200ms)
        const pollInterval = setInterval(() => {
          if (!soundRef.current) { clearInterval(pollInterval); return; }
          try {
            const pos = Math.round((soundRef.current.currentTime ?? 0) * 1000);
            setPlayingPositionMs(pos);
          } catch {}
        }, 200);

        // Al terminar, limpiar
        player.addListener("playbackStatusUpdate", (status) => {
          if (status.didJustFinish) {
            clearInterval(pollInterval);
            try { player.remove(); } catch {}
            if (soundRef.current === player) soundRef.current = null;
            setPlayingId(null);
            setPlayingPositionMs(0);
          }
        });

        soundRef.current = player;
        setPlayingId(entry.id);
        setPlayingPositionMs(0);
      } catch {
        setPlayingId(null);
      }
    },
    [playingId],
  );

  return {
    entries,
    isRecording,
    elapsedMs,
    playingId,
    playingPositionMs,
    startRecording,
    stopRecording,
    deleteEntry,
    deleteAllEntries,
    updateEntry,
    playEntry,
  };
}
