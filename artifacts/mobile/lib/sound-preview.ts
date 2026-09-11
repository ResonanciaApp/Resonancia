export const SOUND_PREVIEW_DURATION_MS = 10_000;

export function getSoundPreviewElapsed(
  previousElapsedMs: number,
  startedAtMs: number,
  nowMs: number,
) {
  return Math.min(
    SOUND_PREVIEW_DURATION_MS,
    Math.max(0, previousElapsedMs + Math.max(0, nowMs - startedAtMs)),
  );
}

export function getSoundPreviewRemaining(elapsedMs: number) {
  return Math.max(0, SOUND_PREVIEW_DURATION_MS - elapsedMs);
}