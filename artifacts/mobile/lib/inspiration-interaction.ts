/** A query refresh may replace every day object without changing user selection. */
export function initialInspirationDate(dates: readonly string[], requested: string | undefined, today: string): string {
  const target = requested || today;
  return dates.includes(target) ? target : dates[0];
}

/** Do not commit halfway through a drag, including a debounce between frames. */
export function settledInspirationIndex(offset: number, width: number, count: number): number | null {
  if (!Number.isFinite(offset) || !Number.isFinite(width) || width <= 0 || count < 1) return null;
  const index = Math.round(offset / width);
  if (index < 0 || index >= count || Math.abs(offset - index * width) > 1) return null;
  return index;
}

export function commitInspirationDate(previous: string, next: string, entrance: number) {
  return previous === next ? { selected: previous, entrance } : { selected: next, entrance: entrance + 1 };
}