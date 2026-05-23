import AsyncStorage from "@react-native-async-storage/async-storage";
import { Audio } from "expo-av";
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

  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => raw && setEntries(JSON.parse(raw) as VozEntry[]))
      .catch(() => {});
    return () => {
      timerRef.current && clearInterval(timerRef.current);
      soundRef.current?.unloadAsync().catch(() => {});
    };
  }, []);

  const persist = useCallback(async (updated: VozEntry[]) => {
    setEntries(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }, []);

  const startRecording = useCallback(async (): Promise<boolean> => {
    try {
      const perm = await Audio.requestPermissionsAsync();
      if (!perm.granted) return false;

      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });
      } catch {}

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.LOW_QUALITY,
      );

      recordingRef.current = recording;
      startTimeRef.current = Date.now();
      setElapsedMs(0);
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setElapsedMs(Date.now() - startTimeRef.current);
      }, 100);

      return true;
    } catch (e) {
      setIsRecording(false);
      return false;
    }
  }, []);

  const stopRecording = useCallback(async () => {
    if (!recordingRef.current) return;

    timerRef.current && clearInterval(timerRef.current);
    timerRef.current = null;

    const durationMs = Date.now() - startTimeRef.current;
    const rec = recordingRef.current;
    recordingRef.current = null;

    setIsRecording(false);
    setElapsedMs(0);

    try {
      await rec.stopAndUnloadAsync();
      const uri = rec.getURI();
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
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });
    } catch {}
  }, []);

  const deleteEntry = useCallback(
    async (id: string) => {
      setEntries((prev) => {
        const updated = prev.filter((e) => e.id !== id);
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated)).catch(() => {});
        return updated;
      });
      if (playingId === id) {
        await soundRef.current?.stopAsync().catch(() => {});
        await soundRef.current?.unloadAsync().catch(() => {});
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
        if (soundRef.current) {
          await soundRef.current.stopAsync().catch(() => {});
          await soundRef.current.unloadAsync().catch(() => {});
          soundRef.current = null;
        }

        if (playingId === entry.id) {
          setPlayingId(null);
          setPlayingPositionMs(0);
          return;
        }

        try {
          await Audio.setAudioModeAsync({
            allowsRecordingIOS: false,
            playsInSilentModeIOS: true,
          });
        } catch {}

        const { sound } = await Audio.Sound.createAsync(
          { uri: entry.uri },
          { shouldPlay: true },
          (status) => {
            if (!status.isLoaded) return;
            setPlayingPositionMs(status.positionMillis ?? 0);
            if (status.didJustFinish) {
              setPlayingId(null);
              setPlayingPositionMs(0);
              sound.unloadAsync().catch(() => {});
              soundRef.current = null;
            }
          },
        );
        soundRef.current = sound;
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
    updateEntry,
    playEntry,
  };
}
