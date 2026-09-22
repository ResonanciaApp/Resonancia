import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { getMoodById } from "@/data/moods";
import type { MoodHistoryRecord } from "@/data/mood-history";
import {
  buildMoodCalendarMonth,
  localMoodDayKey,
  MOOD_CALENDAR_WEEKDAYS,
} from "@/data/mood-calendar";

type Props = {
  month: Date;
  records: MoodHistoryRecord[];
  showMonthTitle?: boolean;
};

export function MoodCalendar({
  month,
  records,
  showMonthTitle = true,
}: Props) {
  const calendar = React.useMemo(
    () => buildMoodCalendarMonth(month, records),
    [month, records],
  );
  const todayKey = localMoodDayKey(new Date());

  return (
    <View>
      {showMonthTitle && <Text style={styles.monthTitle}>{calendar.label}</Text>}
      <View style={styles.weekdayRow}>
        {MOOD_CALENDAR_WEEKDAYS.map((label) => (
          <Text key={label} style={styles.weekdayLabel}>{label}</Text>
        ))}
      </View>
      <View style={styles.grid}>
        {calendar.cells.map((cell) => {
          if (!cell.date || !cell.day) {
            return <View key={cell.key} style={styles.dayCell} />;
          }
          const moodId = cell.record?.moodIds[0];
          const mood = moodId ? getMoodById(moodId) : undefined;
          const isToday = cell.key === todayKey;
          return (
            <View
              key={cell.key}
              style={styles.dayCell}
              accessible
              accessibilityLabel={`${cell.day} de ${calendar.label}${mood ? `, ${mood.label}` : ", sin registro"}`}
            >
              <View
                style={[
                  styles.moodCircle,
                  mood && styles.moodCircleActive,
                  isToday && styles.todayCircle,
                ]}
              >
                {mood ? <Text style={styles.moodEmoji}>{mood.emoji}</Text> : null}
              </View>
              <Text style={[styles.dayNumber, isToday && styles.todayNumber]}>
                {cell.day}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  monthTitle: {
    fontFamily: "Manrope",
    color: "#F9F9F9",
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 18,
  },
  weekdayRow: {
    flexDirection: "row",
    marginBottom: 10,
  },
  weekdayLabel: {
    width: `${100 / 7}%`,
    fontFamily: "Manrope",
    color: "rgba(249,249,249,0.62)",
    fontSize: 9,
    lineHeight: 13,
    fontWeight: "700",
    textAlign: "center",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 9,
  },
  dayCell: {
    width: `${100 / 7}%`,
    minHeight: 51,
    alignItems: "center",
  },
  moodCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.13)",
    alignItems: "center",
    justifyContent: "center",
  },
  moodCircleActive: {
    borderColor: "rgba(255,255,255,0.38)",
    backgroundColor: "rgba(255,255,255,0.10)",
  },
  todayCircle: {
    borderWidth: 2,
    borderColor: "#BE9650",
  },
  moodEmoji: {
    fontSize: 19,
  },
  dayNumber: {
    marginTop: 3,
    fontFamily: "Manrope",
    color: "rgba(249,249,249,0.70)",
    fontSize: 10,
    lineHeight: 13,
    fontWeight: "500",
  },
  todayNumber: {
    color: "#F9F9F9",
    fontWeight: "800",
    textDecorationLine: "underline",
  },
});