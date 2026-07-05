import { Feather } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { usePlayer } from "@/context/PlayerContext";

const GOLD = "#BE8744";
const TEXT = "#e8e8e8";
const MUTED = "#c2c2c2";

/** Minutos que hay que escuchar en el día para que cuente como "día activo". */
const GOAL_MINUTES = 5;

const DAY_LABELS = ["L", "M", "M", "J", "V", "S", "D"];

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

/** Lunes de la semana que contiene `d` (00:00). */
function startOfWeek(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  const dow = copy.getDay(); // 0 = domingo
  const diff = dow === 0 ? -6 : 1 - dow; // retroceder hasta el lunes
  copy.setDate(copy.getDate() + diff);
  return copy;
}

function minutesByDay(events: { playedAt: string; minutes: number }[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const e of events) {
    const k = dayKey(new Date(e.playedAt));
    map.set(k, (map.get(k) ?? 0) + (e.minutes ?? 0));
  }
  return map;
}

export function WeeklyStreakStrip() {
  const { statEvents } = usePlayer();

  const { activeFlags, activeCount, todayIndex } = useMemo(() => {
    const byDay = minutesByDay(statEvents);
    const monday = startOfWeek(new Date());
    const flags: boolean[] = [];
    let count = 0;
    let todayIdx = 0;
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const met = (byDay.get(dayKey(d)) ?? 0) >= GOAL_MINUTES;
      flags.push(met);
      if (met) count++;
      if (dayKey(d) === dayKey(today)) todayIdx = i;
    }
    return { activeFlags: flags, activeCount: count, todayIndex: todayIdx };
  }, [statEvents]);

  const message = `Muy bien! Usaste Resonancia ${activeCount} días esta semana.\n¡Continúa así!`;

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        {DAY_LABELS.map((label, i) => {
          const met = activeFlags[i];
          const isToday = i === todayIndex;
          return (
            <View key={i} style={styles.dayCol}>
              <View
                style={[
                  styles.circle,
                  met ? styles.circleActive : styles.circleInactive,
                  isToday && !met && styles.circleToday,
                ]}
              >
                {met && <Feather name="check" size={16} color="#1B060F" />}
              </View>
              <Text style={[styles.dayLabel, isToday && styles.dayLabelToday]}>{label}</Text>
            </View>
          );
        })}
      </View>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 14,
    gap: 13,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dayCol: {
    alignItems: "center",
    gap: 8,
  },
  circle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  circleActive: {
    backgroundColor: GOLD,
  },
  circleInactive: {
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  circleToday: {
    borderWidth: 1.5,
    borderColor: GOLD,
  },
  dayLabel: {
    color: MUTED,
    fontSize: 12,
    fontWeight: "600",
  },
  dayLabelToday: {
    color: TEXT,
  },
  message: {
    color: TEXT,
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
  },
});
