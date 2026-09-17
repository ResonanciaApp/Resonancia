import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  useGetPublicEmotionalPhrases,
} from "@workspace/api-client-react";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { MOOD_QUOTES, type MoodQuote } from "@/data/mood-quotes";
import { readMoodHistory } from "@/data/mood-history";
import type { MoodId } from "@/data/moods";
import {
  advanceMoodQuoteSlot,
  getNextMoodQuoteSlot,
  mergeMoodQuoteSlots,
  normalizeRotationState,
  reconcileRotationFromHistory,
  validateMoodQuoteSlots,
  type MoodQuoteRotationState,
  type MoodQuoteSlotMap,
} from "@/data/mood-quote-rotation";

const QUOTES_CACHE_KEY = "cdc_mood_quotes_snapshot_v1";
const ROTATION_CACHE_KEY = "cdc_mood_quotes_rotation_v1";

type MoodQuotesContextValue = {
  getQuoteForMood: (moodId: MoodId) => MoodQuote;
  completeCheckIn: <T>(
    moodId: MoodId,
    save: (slot: number) => Promise<T>,
  ) => Promise<{ result: T; quote: MoodQuote }>;
};

const MoodQuotesContext = createContext<MoodQuotesContextValue | null>(null);

let completionQueue = Promise.resolve();

function enqueueCompletion<T>(work: () => Promise<T>): Promise<T> {
  const next = completionQueue.then(work, work);
  completionQueue = next.then(
    () => undefined,
    () => undefined,
  );
  return next;
}

function getFallbackQuote(moodId: MoodId): MoodQuote {
  return MOOD_QUOTES[moodId];
}

function quoteFromSlot(
  moodId: MoodId,
  slot: number,
  remoteSlots: MoodQuoteSlotMap,
): MoodQuote {
  const fallback = getFallbackQuote(moodId);
  const text = remoteSlots[moodId]?.[slot] ?? fallback.text;
  return { ...fallback, text };
}

function parseCachedSlots(raw: string | null): MoodQuoteSlotMap {
  if (!raw) return {};
  try {
    return validateMoodQuoteSlots(JSON.parse(raw));
  } catch {
    return {};
  }
}

function parseCachedRotation(raw: string | null): MoodQuoteRotationState {
  if (!raw) return {};
  try {
    return normalizeRotationState(JSON.parse(raw));
  } catch {
    return {};
  }
}

export function MoodQuotesProvider({ children }: { children: ReactNode }) {
  const { data } = useGetPublicEmotionalPhrases();
  const [remoteSlots, setRemoteSlots] = useState<MoodQuoteSlotMap>({});
  const rotationRef = useRef<MoodQuoteRotationState>({});
  const loadedRotationRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [quotesRaw, rotationRaw, history] = await Promise.all([
          AsyncStorage.getItem(QUOTES_CACHE_KEY),
          AsyncStorage.getItem(ROTATION_CACHE_KEY),
          readMoodHistory(),
        ]);
        if (cancelled) return;
        const cachedQuotes = parseCachedSlots(quotesRaw);
        if (Object.keys(cachedQuotes).length > 0) {
          setRemoteSlots((current) =>
            mergeMoodQuoteSlots(cachedQuotes, current),
          );
        }
        if (loadedRotationRef.current) return;
        rotationRef.current = reconcileRotationFromHistory(
          parseCachedRotation(rotationRaw),
          history,
        );
        loadedRotationRef.current = true;
      } catch {
        loadedRotationRef.current = true;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!data) return;
    const validated = validateMoodQuoteSlots(data);
    if (Object.keys(validated).length === 0) return;
    setRemoteSlots((current) => {
      const merged = mergeMoodQuoteSlots(current, validated);
      AsyncStorage.setItem(
        QUOTES_CACHE_KEY,
        JSON.stringify({ moods: Object.entries(merged).map(([moodId, phrases]) => ({
          moodId,
          phrases: phrases?.map((text, index) => ({ slot: index + 1, text })),
        })) }),
      ).catch(() => {});
      return merged;
    });
  }, [data]);

  const getQuoteForMood = useCallback((moodId: MoodId): MoodQuote => {
    const slot = getNextMoodQuoteSlot(rotationRef.current, moodId);
    return quoteFromSlot(moodId, slot, remoteSlots);
  }, [remoteSlots]);

  const completeCheckIn = useCallback(
    <T,>(moodId: MoodId, save: (slot: number) => Promise<T>) =>
      enqueueCompletion(async () => {
        if (!loadedRotationRef.current) {
          try {
            const [rotationRaw, history] = await Promise.all([
              AsyncStorage.getItem(ROTATION_CACHE_KEY),
              readMoodHistory(),
            ]);
            rotationRef.current = reconcileRotationFromHistory(
              parseCachedRotation(rotationRaw),
              history,
            );
          } catch {
            rotationRef.current = {};
          }
          loadedRotationRef.current = true;
        }
        const slot = getNextMoodQuoteSlot(rotationRef.current, moodId);
        const quote = quoteFromSlot(moodId, slot, remoteSlots);
        const result = await save(slot);
        const nextRotation = advanceMoodQuoteSlot(rotationRef.current, moodId);
        rotationRef.current = nextRotation;
        await AsyncStorage.setItem(
          ROTATION_CACHE_KEY,
          JSON.stringify(nextRotation),
        ).catch(() => {});
        return { result, quote };
      }),
    [remoteSlots],
  );

  return (
    <MoodQuotesContext.Provider value={{ getQuoteForMood, completeCheckIn }}>
      {children}
    </MoodQuotesContext.Provider>
  );
}

export function useMoodQuotes(): MoodQuotesContextValue {
  const context = useContext(MoodQuotesContext);
  if (!context) {
    throw new Error("useMoodQuotes debe usarse dentro de MoodQuotesProvider");
  }
  return context;
}