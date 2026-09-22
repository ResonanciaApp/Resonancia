import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getGetQuoteOfTheDayQueryKey,
  useGetQuoteOfTheDay,
  type DailyQuoteDecoration,
  type DailyQuotePalette,
  type QuoteOfTheDayResponse,
} from "@workspace/api-client-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AppState } from "react-native";

import { getQuoteOfTheDay as getBundledQuote, type Quote } from "@/data/quotes";

const TIME_ZONE = "America/Santiago";
const CACHE_KEY = "resonancia_quote_of_day_v1";

export type QuoteOfTheDay = Quote & {
  date: string;
  paletteId: DailyQuotePalette;
  decorationId: DailyQuoteDecoration;
  decorationsEnabled: boolean;
};

type CachedQuote = QuoteOfTheDay & { receivedAt: string };

function getChileDate(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function parseAssignment(value: unknown, today: string): QuoteOfTheDay | null {
  if (!value || typeof value !== "object") return null;
  const assignment = value as Partial<QuoteOfTheDayResponse>;
  if (
    typeof assignment.date !== "string" ||
    assignment.date !== today ||
    typeof assignment.text !== "string" ||
    !assignment.text.trim() ||
    typeof assignment.author !== "string" ||
    !assignment.author.trim()
  ) {
    return null;
  }
  return {
    date: today,
    text: assignment.text.trim(),
    author: assignment.author.trim(),
    paletteId:
      assignment.paletteId === "violet" ||
      assignment.paletteId === "ocean" ||
      assignment.paletteId === "ruby" ||
      assignment.paletteId === "amber" ||
      assignment.paletteId === "original"
        ? assignment.paletteId
        : "jade",
    decorationId:
      assignment.decorationId === "vesica" ||
      assignment.decorationId === "seed" ||
      assignment.decorationId === "flower" ||
      assignment.decorationId === "metatron"
        ? assignment.decorationId
        : "circles",
    decorationsEnabled: assignment.decorationsEnabled !== false,
  };
}

function parseCachedQuote(raw: string | null, today: string): QuoteOfTheDay | null {
  if (!raw) return null;
  try {
    return parseAssignment(JSON.parse(raw), today);
  } catch {
    return null;
  }
}

export function useQuoteOfTheDay() {
  const today = getChileDate();
  const fallback = useMemo(() => {
    const quote = getBundledQuote();
    return {
      ...quote,
      date: today,
      paletteId: "jade" as const,
      decorationId: "circles" as const,
      decorationsEnabled: true,
    };
  }, [today]);
  const [cachedQuote, setCachedQuote] = useState<QuoteOfTheDay | null>(null);
  const { data, isLoading, refetch } = useGetQuoteOfTheDay(
    { timeZone: TIME_ZONE },
    {
      query: {
        queryKey: getGetQuoteOfTheDayQueryKey({ timeZone: TIME_ZONE }),
        staleTime: 0,
        refetchOnMount: "always",
      },
    },
  );

  const refresh = useCallback(() => {
    void refetch();
  }, [refetch]);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(CACHE_KEY)
      .then((raw) => {
        if (!cancelled) setCachedQuote(parseCachedQuote(raw, today));
      })
      .catch(() => {
        if (!cancelled) setCachedQuote(null);
      });
    return () => {
      cancelled = true;
    };
  }, [today]);

  useEffect(() => {
    const remoteQuote = parseAssignment(data, today);
    if (!remoteQuote) return;
    setCachedQuote(remoteQuote);
    const payload: CachedQuote = { ...remoteQuote, receivedAt: new Date().toISOString() };
    void AsyncStorage.setItem(CACHE_KEY, JSON.stringify(payload)).catch(() => {});
  }, [data, today]);

  useEffect(() => {
    let previousDate = today;
    const subscription = AppState.addEventListener("change", (state) => {
      if (state !== "active") return;
      const nextDate = getChileDate();
      if (nextDate !== previousDate) previousDate = nextDate;
      refresh();
    });
    const interval = setInterval(() => {
      const nextDate = getChileDate();
      if (nextDate !== previousDate) {
        previousDate = nextDate;
        refresh();
      }
    }, 60_000);
    return () => {
      subscription.remove();
      clearInterval(interval);
    };
  }, [refresh, today]);

  return {
    quote: cachedQuote ?? fallback,
    date: today,
    isLoading: isLoading && !cachedQuote,
    isRemote: cachedQuote !== null,
    refresh,
  };
}

export { getChileDate, parseAssignment, parseCachedQuote };