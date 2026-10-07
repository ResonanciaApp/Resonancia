export const REFLECTION_SHARE_CHARACTER_LIMIT = 160;
export const REFLECTION_STORY_MIN_BACKGROUND_SCALE = 1;
export const REFLECTION_STORY_MAX_BACKGROUND_SCALE = 3;
export const REFLECTION_STORY_TEXT_X_LIMIT = 100 / 1080;
export const REFLECTION_STORY_TEXT_Y_LIMIT = 500 / 1920;
export const REFLECTION_STORY_AVATAR_SIZE = 124;
export const REFLECTION_STORY_AVATAR_X_MIN = 62 / 1080;
export const REFLECTION_STORY_AVATAR_Y_MIN = 62 / 1920;
export type ReflectionStoryAvatarPosition = { x: number; y: number };
export const DEFAULT_REFLECTION_STORY_AVATAR_POSITION: ReflectionStoryAvatarPosition = { x: 0.5, y: 0.66 };

export function clampReflectionStoryAvatarPosition(position: ReflectionStoryAvatarPosition): ReflectionStoryAvatarPosition {
  return {
    x: clamp(position.x, REFLECTION_STORY_AVATAR_X_MIN, 1 - REFLECTION_STORY_AVATAR_X_MIN),
    y: clamp(position.y, REFLECTION_STORY_AVATAR_Y_MIN, 1 - REFLECTION_STORY_AVATAR_Y_MIN),
  };
}

export type ReflectionStoryComposition = {
  backgroundScale: number;
  backgroundX: number;
  backgroundY: number;
  textX: number;
  textY: number;
};

export const DEFAULT_REFLECTION_STORY_COMPOSITION: ReflectionStoryComposition = {
  backgroundScale: 1,
  backgroundX: 0,
  backgroundY: 0,
  textX: 0,
  textY: 0,
};

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

export function reflectionBackgroundOffsetLimit(scale: number): number {
  const safeScale = clamp(
    scale,
    REFLECTION_STORY_MIN_BACKGROUND_SCALE,
    REFLECTION_STORY_MAX_BACKGROUND_SCALE,
  );
  return (safeScale - 1) / 2;
}

export function clampReflectionStoryComposition(
  composition: ReflectionStoryComposition,
): ReflectionStoryComposition {
  const backgroundScale = clamp(
    composition.backgroundScale,
    REFLECTION_STORY_MIN_BACKGROUND_SCALE,
    REFLECTION_STORY_MAX_BACKGROUND_SCALE,
  );
  const backgroundOffsetLimit = reflectionBackgroundOffsetLimit(backgroundScale);
  const backgroundX = backgroundOffsetLimit === 0
    ? 0
    : clamp(composition.backgroundX, -backgroundOffsetLimit, backgroundOffsetLimit);
  const backgroundY = backgroundOffsetLimit === 0
    ? 0
    : clamp(composition.backgroundY, -backgroundOffsetLimit, backgroundOffsetLimit);

  return {
    backgroundScale,
    backgroundX,
    backgroundY,
    textX: clamp(composition.textX, -REFLECTION_STORY_TEXT_X_LIMIT, REFLECTION_STORY_TEXT_X_LIMIT),
    textY: clamp(composition.textY, -REFLECTION_STORY_TEXT_Y_LIMIT, REFLECTION_STORY_TEXT_Y_LIMIT),
  };
}

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

/** Only our storage URLs can be preserved as object references. */
export function reflectionAvatarObjectPath(uri: string, apiBase: string): string | null {
  let path = uri;
  if (/^https?:\/\//i.test(uri)) {
    if (!apiBase) return null;
    try {
      const parsed = new URL(uri);
      if (parsed.origin !== new URL(apiBase).origin) return null;
      path = parsed.pathname;
    } catch { return null; }
  }
  if (path.startsWith("/api/storage/objects/")) return path.replace("/api/storage/", "/");
  return path.startsWith("/objects/") ? path : null;
}

export function getStableIdempotencyKey(
  payload: unknown,
  state: { hash: string; key: string }
): { hash: string; key: string } {
  const hash = JSON.stringify(payload);
  if (hash !== state.hash || !state.key) {
    return { hash, key: Date.now().toString() + Math.random().toString(36).substring(2, 9) };
  }
  return state;
}