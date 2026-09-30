import { describe, expect, it } from "vitest";
import {
  getCompletedWeekStarts,
  localDateKey,
  normalizeStreakTimeZone,
  type StreakDayAggregate,
} from "./completedStreakWeeks";

const activeWeek = (monday: string): StreakDayAggregate[] =>
  Array.from({ length: 7 }, (_, index) => {
    const [year, month, day] = monday.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day + index));
    return {
      localDay: `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`,
      minutes: 3,
      completed: false,
    };
  });

describe("completed historical streak weeks", () => {
  it("returns only complete Monday-Sunday weeks, including across month and year boundaries", () => {
    const newYearWeek = activeWeek("2024-12-30");
    const incompleteWeek = activeWeek("2025-01-06").slice(1);

    expect(
      getCompletedWeekStarts([...newYearWeek, ...incompleteWeek], "UTC", new Date("2025-01-20T12:00:00Z")),
    ).toEqual(["2024-12-30"]);
  });

  it("treats each calendar day as active once, using aggregate minutes or a completed session", () => {
    const week = activeWeek("2025-02-03");
    week[1] = { ...week[1], minutes: 1, completed: true };
    week[2] = { ...week[2], minutes: 2.99 };
    week[3] = { ...week[3], minutes: 0, completed: true };
    const repeatedPlayDay = { ...week[0], minutes: 3 };

    expect(
      getCompletedWeekStarts(
        [...week.filter((day) => day.localDay !== "2025-02-03"), week[0], repeatedPlayDay],
        "UTC",
        new Date("2025-02-17T12:00:00Z"),
      ),
    ).toEqual([]);
    const completedByMinutes = week.map((day) =>
      day.localDay === "2025-02-05" || day.localDay === "2025-02-06"
        ? { ...day, minutes: 3 }
        : day,
    );
    expect(
      getCompletedWeekStarts(completedByMinutes, "UTC", new Date("2025-02-17T12:00:00Z")),
    ).toEqual(["2025-02-03"]);
  });

  it("uses local dates through timezone offsets and DST transitions, and ignores future calendar days", () => {
    expect(normalizeStreakTimeZone("Not/A_Timezone")).toBe("UTC");
    expect(localDateKey(new Date("2025-03-09T06:59:00Z"), "America/New_York")).toBe("2025-03-09");
    expect(localDateKey(new Date("2025-03-09T07:01:00Z"), "America/New_York")).toBe("2025-03-09");
    expect(localDateKey(new Date("2025-03-10T03:59:00Z"), "America/New_York")).toBe("2025-03-09");
    expect(localDateKey(new Date("2025-03-10T04:01:00Z"), "America/New_York")).toBe("2025-03-10");
    expect(localDateKey(new Date("2025-01-06T01:00:00Z"), "America/Los_Angeles")).toBe("2025-01-05");

    const pastWeek = activeWeek("2025-02-10");
    const nextWeek = activeWeek("2025-02-24");
    expect(
      getCompletedWeekStarts([...pastWeek, ...nextWeek], "UTC", new Date("2025-02-23T12:00:00Z")),
    ).toEqual(["2025-02-10"]);
  });

  it("counts the current week as soon as its seventh day is active on Sunday", () => {
    expect(getCompletedWeekStarts(
      activeWeek("2025-02-17"), "UTC", new Date("2025-02-23T12:00:00Z"),
    )).toEqual(["2025-02-17"]);
  });

  it("evaluates full history without a recent-play retention window", () => {
    const retainedHistoryBoundaryWeek = activeWeek("2018-06-04");
    const recentWeek = activeWeek("2025-03-03");
    expect(
      getCompletedWeekStarts(
        [...retainedHistoryBoundaryWeek, ...recentWeek],
        "UTC",
        new Date("2025-03-10T12:00:00Z"),
      ),
    ).toEqual(["2018-06-04", "2025-03-03"]);
  });
});