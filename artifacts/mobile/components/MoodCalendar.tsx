import React from "react";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Text, View } from "react-native";

import { getMoodById, type MoodId } from "@/data/moods";
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

type MoodTone = "joy" | "calm" | "discomfort" | "anger";

const MOOD_TONES: Record<MoodId, MoodTone> = {
  estresado: "discomfort",
  ansioso: "discomfort",
  cansado: "discomfort",
  inepto: "discomfort",
  triste: "discomfort",
  solo: "discomfort",
  deprimido: "discomfort",
  desmotivado: "discomfort",
  enojado: "anger",
  adolorido: "discomfort",
  agradecido: "joy",
  emocionado: "joy",
  "lleno-de-amor": "joy",
  feliz: "joy",
  "en-paz": "calm",
  esperanzado: "joy",
  contento: "joy",
  presente: "calm",
};

const MOOD_GRADIENTS: Record<MoodTone, readonly [string, string]> = {
  joy: ["rgba(128,207,244,0.38)", "rgba(79,151,215,0.18)"],
  calm: ["rgba(120,211,168,0.36)", "rgba(70,151,112,0.17)"],
  discomfort: ["rgba(255,192,82,0.72)", "rgba(242,126,38,0.48)"],
  anger: ["rgba(255,116,62,0.82)", "rgba(230,55,34,0.58)"],
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
  const weeks = React.useMemo(
    () => Array.from(
      { length: calendar.cells.length / 7 },
      (_, index) => calendar.cells.slice(index * 7, index * 7 + 7),
    ),
    [calendar.cells],
  );

  return (
    <View>
      {showMonthTitle && <Text style={styles.monthTitle}>{calendar.label}</Text>}
      <View style={styles.weekdayRow}>
        {MOOD_CALENDAR_WEEKDAYS.map((label) => (
          <Text key={label} style={styles.weekdayLabel}>{label}</Text>
        ))}
      </View>
      <View style={styles.grid}>
        {weeks.map((week, weekIndex) => (
          <View key={`${calendar.key}-week-${weekIndex}`} style={styles.weekRow}>
            {week.map((cell) => {
              if (!cell.date || !cell.day) {
                return <View key={cell.key} style={styles.dayCell} />;
              }
              const moodId = cell.record?.moodIds[0];
              const mood = moodId ? getMoodById(moodId) : undefined;
              const isToday = cell.key === todayKey;
              const circleStyle = [
                styles.moodCircle,
                mood && styles.moodCircleActive,
                isToday && styles.todayCircle,
              ];
              return (
                <View
                  key={cell.key}
                  style={styles.dayCell}
                  accessible
                  accessibilityLabel={`${cell.day} de ${calendar.label}${mood ? `, ${mood.label}` : ", sin registro"}`}
                >
                  {mood ? (
                    <LinearGradient
                      colors={MOOD_GRADIENTS[MOOD_TONES[mood.id]]}
                      start={{ x: 0.15, y: 0 }}
                      end={{ x: 0.85, y: 1 }}
                      style={circleStyle}
                    >
                      <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                    </LinearGradient>
                  ) : (
                    <View style={circleStyle} />
                  )}
                  <Text style={[styles.dayNumber, isToday && styles.todayNumber]}>
                    {cell.day}
                  </Text>
                </View>
              );
            })}
          </View>
        ))}
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
    flex: 1,
    fontFamily: "Manrope",
    color: "rgba(249,249,249,0.62)",
    fontSize: 9,
    lineHeight: 13,
    fontWeight: "700",
    textAlign: "center",
  },
  grid: {
    rowGap: 9,
  },
  weekRow: {
    flexDirection: "row",
  },
  dayCell: {
    flex: 1,
    minHeight: 51,
    alignItems: "center",
  },
  moodCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.13)",
    backgroundColor: "rgba(0,0,0,0.40)",
    alignItems: "center",
    justifyContent: "center",
  },
  moodCircleActive: {
    borderColor: "rgba(255,255,255,0.38)",
    backgroundColor: "transparent",
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