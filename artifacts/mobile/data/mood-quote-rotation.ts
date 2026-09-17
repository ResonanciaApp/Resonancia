import type { MoodId } from "@/data/moods";

export const MOOD_QUOTE_SLOT_COUNT = 7;

export type MoodQuoteSlotMap = Partial<Record<MoodId, string[]>>;
export type MoodQuoteRotationState = Partial<Record<MoodId, number>>;

const moodIds = new Set<MoodId>([
  "estresado",
  "ansioso",
  "cansado",
  "inepto",
  "triste",
  "solo",
  "deprimido",
  "desmotivado",
  "enojado",
  "adolorido",
  "agradecido",
  "emocionado",
  "lleno-de-amor",
  "feliz",
  "en-paz",
  "esperanzado",
  "contento",
  "presente",
]);

export function normalizeRotationState(value: unknown): MoodQuoteRotationState {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const normalized: MoodQuoteRotationState = {};
  for (const [moodId, slot] of Object.entries(value)) {
    if (!moodIds.has(moodId as MoodId) || typeof slot !== "number" || !Number.isInteger(slot)) {
      continue;
    }
    normalized[moodId as MoodId] =
      ((slot % MOOD_QUOTE_SLOT_COUNT) + MOOD_QUOTE_SLOT_COUNT) % MOOD_QUOTE_SLOT_COUNT;
  }
  return normalized;
}

export function getNextMoodQuoteSlot(
  state: MoodQuoteRotationState,
  moodId: MoodId,
): number {
  return normalizeRotationState(state)[moodId] ?? 0;
}

export function getPrimaryMoodId(moodIds: MoodId[]): MoodId | undefined {
  return moodIds[0];
}

export function advanceMoodQuoteSlot(
  state: MoodQuoteRotationState,
  moodId: MoodId,
): MoodQuoteRotationState {
  return {
    ...normalizeRotationState(state),
    [moodId]: (getNextMoodQuoteSlot(state, moodId) + 1) % MOOD_QUOTE_SLOT_COUNT,
  };
}

export function reconcileRotationFromHistory(
  state: MoodQuoteRotationState,
  records: Array<{ quoteRotation?: { moodId: MoodId; slot: number } }>,
): MoodQuoteRotationState {
  const next = normalizeRotationState(state);
  const reconciled = new Set<MoodId>();
  for (const record of records) {
    const rotation = record.quoteRotation;
    if (
      !rotation ||
      reconciled.has(rotation.moodId) ||
      !moodIds.has(rotation.moodId) ||
      !Number.isInteger(rotation.slot) ||
      rotation.slot < 0 ||
      rotation.slot >= MOOD_QUOTE_SLOT_COUNT
    ) {
      continue;
    }
    next[rotation.moodId] = (rotation.slot + 1) % MOOD_QUOTE_SLOT_COUNT;
    reconciled.add(rotation.moodId);
  }
  return next;
}

export function validateMoodQuoteSlots(value: unknown): MoodQuoteSlotMap {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const result: MoodQuoteSlotMap = {};
  const moods = (value as { moods?: unknown }).moods;
  if (!Array.isArray(moods)) return result;

  for (const item of moods) {
    if (!item || typeof item !== "object") continue;
    const moodId = (item as { moodId?: unknown }).moodId;
    if (typeof moodId !== "string" || !moodIds.has(moodId as MoodId)) continue;
    const phrases = (item as { phrases?: unknown }).phrases;
    if (!Array.isArray(phrases) || phrases.length !== MOOD_QUOTE_SLOT_COUNT) continue;
    const slots = phrases.map((phrase) => {
      if (!phrase || typeof phrase !== "object") return null;
      const slot = (phrase as { slot?: unknown }).slot;
      const text = (phrase as { text?: unknown }).text;
      if (
        typeof slot !== "number" ||
        !Number.isInteger(slot) ||
        slot < 1 ||
        slot > MOOD_QUOTE_SLOT_COUNT ||
        typeof text !== "string" ||
        !text.trim()
      ) return null;
      return { slot, text: text.trim() };
    });
    if (slots.some((slot) => slot === null)) continue;
    const ordered = Array.from({ length: MOOD_QUOTE_SLOT_COUNT }, (_, index) =>
      slots.find((slot) => slot?.slot === index + 1)?.text ?? null,
    );
    if (ordered.some((text) => text === null)) continue;
    result[moodId as MoodId] = ordered as string[];
  }
  return result;
}

export function mergeMoodQuoteSlots(
  ...maps: MoodQuoteSlotMap[]
): MoodQuoteSlotMap {
  return maps.reduce<MoodQuoteSlotMap>(
    (merged, map) => ({ ...merged, ...map }),
    {},
  );
}