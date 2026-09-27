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
  calm: ["rgba(100,224,112,0.52)", "rgba(46,174,73,0.28)"],
  discomfort: ["rgba(255,174,38,0.82)", "rgba(245,92,24,0.62)"],
  anger: ["rgba(255,76,67,0.86)", "rgba(214,27,35,0.64)"],
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
    fontSize: 11,
    lineHeight: 15,
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
    width: 37,
    height: 37,
    borderRadius: 18.5,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.28)",
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  moodCircleActive: {
    backgroundColor: "transparent",
  },
  todayCircle: {
    borderWidth: 2,
  },
  moodEmoji: {
    fontSize: 19,
  },
  dayNumber: {
    marginTop: 3,
    fontFamily: "Manrope",
    color: "rgba(249,249,249,0.70)",
    fontSize: 12,
    lineHeight: 15,
    fontWeight: "500",
  },
  todayNumber: {
    color: "#F9F9F9",
    fontWeight: "800",
    textDecorationLine: "underline",
  },
});