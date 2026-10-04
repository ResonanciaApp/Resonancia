export const SCENE_THEME_FADE_MS = 600;
export const SCENE_THEME_HAPTIC_OFFSETS = [0, 200, 400] as const;

/** Snapshot a partially completed fade before changing its destination. */
export function blendThemePalette(from: readonly string[], to: readonly string[], opacity: number): string[] {
  const amount = Math.max(0, Math.min(1, opacity));
  return to.map((color, index) => {
    const previous = from[index] ?? from[from.length - 1];
    const channels = [1, 3, 5].map((offset) => {
      const a = parseInt(previous.slice(offset, offset + 2), 16);
      const b = parseInt(color.slice(offset, offset + 2), 16);
      return Math.round(a + (b - a) * amount).toString(16).padStart(2, "0");
    });
    return `#${channels.join("")}`;
  });
}

export function scheduleSceneThemeHaptics(
  impact: () => void,
  schedule: (callback: () => void, delay: number) => ReturnType<typeof setTimeout> = setTimeout,
  cancel: (timer: ReturnType<typeof setTimeout>) => void = clearTimeout,
) {
  let cancelled = false;
  const timers = SCENE_THEME_HAPTIC_OFFSETS.map((offset) =>
    schedule(() => { if (!cancelled) impact(); }, offset),
  );
  return () => {
    cancelled = true;
    timers.forEach(cancel);
  };
}