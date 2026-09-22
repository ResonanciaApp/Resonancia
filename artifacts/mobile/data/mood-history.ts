import AsyncStorage from "@react-native-async-storage/async-storage";

import { getMoodById, type MoodId } from "@/data/moods";

const STORAGE_KEY = "@resonance_mood_history_v1";

function localDayKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export class MoodCheckInAlreadyExistsError extends Error {
  constructor() {
    super("Ya existe un registro de estado de ánimo para hoy");
    this.name = "MoodCheckInAlreadyExistsError";
  }
}

export type MoodHistoryRecord = {
  id: string;
  createdAt: string;
  moodIds: MoodId[];
  answers: Partial<Record<MoodId, string>>;
  quoteRotation?: {
    moodId: MoodId;
    slot: number;
  };
};

function isMoodId(value: unknown): value is MoodId {
  return typeof value === "string" && Boolean(getMoodById(value));
}

function parseRecords(raw: string | null): MoodHistoryRecord[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((record): record is Record<string, unknown> => Boolean(record) && typeof record === "object")
      .map((record) => {
        const rawRotation = record.quoteRotation;
        const quoteRotation =
          rawRotation &&
          typeof rawRotation === "object" &&
          isMoodId((rawRotation as Record<string, unknown>).moodId) &&
          Number.isInteger((rawRotation as Record<string, unknown>).slot) &&
          Number((rawRotation as Record<string, unknown>).slot) >= 0 &&
          Number((rawRotation as Record<string, unknown>).slot) < 7
            ? {
                moodId: (rawRotation as { moodId: MoodId }).moodId,
                slot: Number((rawRotation as Record<string, unknown>).slot),
              }
            : undefined;
        return {
          id: typeof record.id === "string" ? record.id : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          createdAt: typeof record.createdAt === "string" ? record.createdAt : new Date().toISOString(),
          moodIds: Array.isArray(record.moodIds)
            ? record.moodIds.filter(isMoodId)
            : [],
          answers: record.answers && typeof record.answers === "object"
            ? Object.fromEntries(
                Object.entries(record.answers).filter(([key, value]) => isMoodId(key) && typeof value === "string"),
              ) as Partial<Record<MoodId, string>>
            : {},
          quoteRotation,
        };
      })
      .filter((record) => record.moodIds.length > 0)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch {
    return [];
  }
}

export async function readMoodHistory(): Promise<MoodHistoryRecord[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  return parseRecords(raw);
}

export async function saveMoodCheckIn(
  moodIds: MoodId[],
  answers: Partial<Record<MoodId, string>>,
  quoteRotation?: MoodHistoryRecord["quoteRotation"],
): Promise<MoodHistoryRecord[]> {
  const current = await readMoodHistory();
  const today = localDayKey(new Date());
  if (current.some((record) => localDayKey(new Date(record.createdAt)) === today)) {
    throw new MoodCheckInAlreadyExistsError();
  }
  const record: MoodHistoryRecord = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    createdAt: new Date().toISOString(),
    moodIds: moodIds.slice(0, 1),
    answers,
    quoteRotation,
  };
  const next = [record, ...current];
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}