export type RoutineScheduleRecord = {
  repeatDays: number[];
  repeatEnabled?: boolean;
  completedDates: string[];
  skippedDates: string[];
  archivedAt: string | null;
  retiredFromDate?: string | null;
  createdAt: string;
};

export function getRoutineOccurrenceKey(dateKey: string, occurrenceIndex = 0): string {
  return occurrenceIndex > 0 ? `${dateKey}#${occurrenceIndex + 1}` : dateKey;
}

export function hasRoutineDateEntry(entries: string[], dateKey: string): boolean {
  return entries.some((entry) => entry === dateKey || entry.startsWith(`${dateKey}#`));
}

export function getRoutineDateKey(date = new Date()): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

export function getRoutineWeekday(date = new Date()): number {
  const day = date.getDay();
  return day === 0 ? 6 : day - 1;
}

export function getRoutineDateFromKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day, 12);
}

export function isRoutineActivityScheduledForDate(
  activity: RoutineScheduleRecord,
  date: Date,
): boolean {
  const dateKey = getRoutineDateKey(date);
  const createdKey = getRoutineDateKey(new Date(activity.createdAt));
  if (dateKey < createdKey) return false;
  if (activity.retiredFromDate && dateKey >= activity.retiredFromDate) return false;
  if (activity.archivedAt) {
    const archivedKey = getRoutineDateKey(new Date(activity.archivedAt));
    if (dateKey >= archivedKey) return false;
  }
  if (activity.repeatEnabled === false) return dateKey === createdKey;
  return activity.repeatDays.includes(getRoutineWeekday(date));
}

export function canMutateRoutineDate(
  activity: RoutineScheduleRecord,
  dateKey: string,
): boolean {
  return isRoutineActivityScheduledForDate(activity, getRoutineDateFromKey(dateKey));
}

export function retireRoutineFromDate<T extends RoutineScheduleRecord>(
  activity: T,
  dateKey: string,
): T {
  if (activity.retiredFromDate && activity.retiredFromDate <= dateKey) return activity;
  return {
    ...activity,
    retiredFromDate: dateKey,
  };
}

export function mergeRoutineRetirementDate(
  first?: string | null,
  second?: string | null,
): string | null {
  if (!first) return second ?? null;
  if (!second) return first;
  return first <= second ? first : second;
}

export function completeRoutineDate<T extends RoutineScheduleRecord>(
  activity: T,
  dateKey: string,
): T {
  const alreadyCompleted = activity.completedDates.includes(dateKey);
  const wasSkipped = activity.skippedDates.includes(dateKey);
  if (alreadyCompleted && !wasSkipped) return activity;
  return {
    ...activity,
    completedDates: alreadyCompleted
      ? activity.completedDates
      : [...activity.completedDates, dateKey].sort(),
    skippedDates: wasSkipped
      ? activity.skippedDates.filter((date) => date !== dateKey)
      : activity.skippedDates,
  };
}

export function skipRoutineDate<T extends RoutineScheduleRecord>(
  activity: T,
  dateKey: string,
): T {
  const alreadySkipped = activity.skippedDates.includes(dateKey);
  const wasCompleted = activity.completedDates.includes(dateKey);
  if (alreadySkipped && !wasCompleted) return activity;
  return {
    ...activity,
    skippedDates: alreadySkipped
      ? activity.skippedDates
      : [...activity.skippedDates, dateKey].sort(),
    completedDates: wasCompleted
      ? activity.completedDates.filter((date) => date !== dateKey)
      : activity.completedDates,
  };
}