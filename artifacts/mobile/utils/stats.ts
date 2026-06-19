// ── Shared stats helpers ───────────────────────────────────────────────────────

export function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function startOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return startOfDay(d);
}

export function computeCurrentStreak(events: { playedAt: string }[]): number {
  if (!events.length) return 0;
  const days = new Set(events.map((e) => dayKey(new Date(e.playedAt))));
  const today = new Date();
  const todayKey = dayKey(today);
  const yKey = dayKey(daysAgo(1));

  let cursor: Date;
  if (days.has(todayKey)) cursor = startOfDay(today);
  else if (days.has(yKey)) cursor = daysAgo(1);
  else return 0;

  let count = 0;
  const walk = new Date(cursor);
  while (days.has(dayKey(walk))) {
    count++;
    walk.setDate(walk.getDate() - 1);
  }
  return count;
}

export function computeActiveDays(events: { playedAt: string }[]): number {
  return new Set(events.map((e) => dayKey(new Date(e.playedAt)))).size;
}

export function formatMinutes(minutes: number): string {
  if (minutes <= 0) return "0 min";
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}
