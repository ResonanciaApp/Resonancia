export const REFLECTION_SHARE_CHARACTER_LIMIT = 100;

type SegmenterLike = {
  segment(value: string): Iterable<unknown>;
};

type SegmenterConstructor = new (
  locale?: string | string[],
  options?: { granularity: "grapheme" },
) => SegmenterLike;

function isAttachedCodePoint(codePoint: number): boolean {
  return (
    (codePoint >= 0x0300 && codePoint <= 0x036f)
    || (codePoint >= 0x1ab0 && codePoint <= 0x1aff)
    || (codePoint >= 0x1dc0 && codePoint <= 0x1dff)
    || (codePoint >= 0x20d0 && codePoint <= 0x20ff)
    || (codePoint >= 0xfe00 && codePoint <= 0xfe0f)
    || (codePoint >= 0xfe20 && codePoint <= 0xfe2f)
    || (codePoint >= 0x1f3fb && codePoint <= 0x1f3ff)
  );
}

function fallbackGraphemeCount(value: string): number {
  let count = 0;
  let joinsNext = false;
  for (const character of value) {
    const codePoint = character.codePointAt(0) ?? 0;
    if (codePoint === 0x200d) {
      joinsNext = true;
      continue;
    }
    if (isAttachedCodePoint(codePoint)) continue;
    if (joinsNext) {
      joinsNext = false;
      continue;
    }
    count += 1;
  }
  return count;
}

export function reflectionCharacterCount(message: string): number {
  const value = message.trim();
  const Segmenter = (Intl as typeof Intl & { Segmenter?: SegmenterConstructor }).Segmenter;
  if (!Segmenter) return fallbackGraphemeCount(value);
  return Array.from(new Segmenter("es", { granularity: "grapheme" }).segment(value)).length;
}

export function canShareReflection(message: string): boolean {
  return reflectionCharacterCount(message) <= REFLECTION_SHARE_CHARACTER_LIMIT;
}