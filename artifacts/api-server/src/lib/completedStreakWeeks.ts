export type StreakDayAggregate = {
  localDay: string;
  minutes: number;
  completed: boolean;
};

export function normalizeStreakTimeZone(timeZone: string): string {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return timeZone;
  } catch {
    return "UTC";
  }
}

export function localDateKey(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function addUtcDays(dateKey: string, days: number): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

function mondayOf(dateKey: string): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return addUtcDays(dateKey, -(weekday === 0 ? 6 : weekday - 1));
}

export function getCompletedWeekStarts(
  aggregates: StreakDayAggregate[],
  timeZone: string,
  now: Date = new Date(),
): string[] {
  const tz = normalizeStreakTimeZone(timeZone);
  const today = localDateKey(now, tz);
  const currentMonday = mondayOf(today);
  const activeDays = new Set(
    aggregates
      .filter(
        (day) =>
          day.localDay <= today &&
          (day.minutes >= 3 || day.completed),
      )
      .map((day) => day.localDay),
  );

  if (activeDays.size === 0) return [];

  const earliestDay = Array.from(activeDays).sort()[0];
  let weekStart = mondayOf(earliestDay);
  const completedWeeks: string[] = [];

  while (weekStart <= currentMonday) {
    if (Array.from({ length: 7 }, (_, index) => addUtcDays(weekStart, index)).every((day) => activeDays.has(day))) {
      completedWeeks.push(weekStart);
    }
    weekStart = addUtcDays(weekStart, 7);
  }

  return completedWeeks;
}