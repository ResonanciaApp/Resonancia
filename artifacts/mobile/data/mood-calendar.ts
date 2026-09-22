import type { MoodHistoryRecord } from "@/data/mood-history";

export const MOOD_CALENDAR_WEEKDAYS = ["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"];

export type MoodCalendarCell = {
  key: string;
  date: Date | null;
  day: number | null;
  record?: MoodHistoryRecord;
};

export type MoodCalendarMonth = {
  key: string;
  date: Date;
  label: string;
  cells: MoodCalendarCell[];
};

export function localMoodDayKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(date: Date): string {
  const value = date.toLocaleDateString("es-CL", {
    month: "long",
    year: "numeric",
  });
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function buildMoodCalendarMonth(
  monthDate: Date,
  records: MoodHistoryRecord[],
): MoodCalendarMonth {
  const date = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const year = date.getFullYear();
  const month = date.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leadingEmptyCells = (date.getDay() + 6) % 7;
  const recordsByDay = new Map<string, MoodHistoryRecord>();

  for (const record of records) {
    const recordDate = new Date(record.createdAt);
    if (recordDate.getFullYear() !== year || recordDate.getMonth() !== month) continue;
    const key = localMoodDayKey(recordDate);
    if (!recordsByDay.has(key)) recordsByDay.set(key, record);
  }

  const cells: MoodCalendarCell[] = Array.from(
    { length: leadingEmptyCells },
    (_, index) => ({
      key: `${monthKey(date)}-leading-${index}`,
      date: null,
      day: null,
    }),
  );

  for (let day = 1; day <= daysInMonth; day += 1) {
    const dayDate = new Date(year, month, day);
    const key = localMoodDayKey(dayDate);
    cells.push({
      key,
      date: dayDate,
      day,
      record: recordsByDay.get(key),
    });
  }

  const trailingEmptyCells = (7 - (cells.length % 7)) % 7;
  for (let index = 0; index < trailingEmptyCells; index += 1) {
    cells.push({
      key: `${monthKey(date)}-trailing-${index}`,
      date: null,
      day: null,
    });
  }

  return {
    key: monthKey(date),
    date,
    label: monthLabel(date),
    cells,
  };
}

export function buildMoodCalendarRange(
  records: MoodHistoryRecord[],
  throughDate = new Date(),
): MoodCalendarMonth[] {
  if (records.length === 0) return [];
  const validDates = records
    .map((record) => new Date(record.createdAt))
    .filter((date) => !Number.isNaN(date.getTime()));
  if (validDates.length === 0) return [];

  const firstRecordDate = validDates.reduce(
    (earliest, date) => date < earliest ? date : earliest,
    validDates[0],
  );
  const cursor = new Date(firstRecordDate.getFullYear(), firstRecordDate.getMonth(), 1);
  const end = new Date(throughDate.getFullYear(), throughDate.getMonth(), 1);
  const months: MoodCalendarMonth[] = [];

  while (cursor <= end) {
    months.push(buildMoodCalendarMonth(cursor, records));
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return months;
}