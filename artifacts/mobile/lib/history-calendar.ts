export type CompletedHistoryEntry = {
  sessionId: string;
  playedAt: string;
  categoryLabel?: string;
};

function localDayKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function dedupeCompletedHistoryByDay(
  entries: CompletedHistoryEntry[],
): CompletedHistoryEntry[] {
  const bySessionAndDay = new Map<string, CompletedHistoryEntry>();

  for (const entry of entries) {
    const key = `${entry.sessionId}:${localDayKey(new Date(entry.playedAt))}`;
    const existing = bySessionAndDay.get(key);
    if (
      !existing ||
      new Date(entry.playedAt).getTime() > new Date(existing.playedAt).getTime()
    ) {
      bySessionAndDay.set(key, entry);
    }
  }

  return [...bySessionAndDay.values()];
}