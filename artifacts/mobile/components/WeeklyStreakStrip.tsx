import { Feather } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";

import { usePlayer } from "@/context/PlayerContext";

const GOLD = "#BE8744";
const TEXT = "#e8e8e8";
const MUTED = "#c2c2c2";

const RING_SIZE = 88;
const STROKE_W = 7;
const RADIUS = (RING_SIZE - STROKE_W) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** Minutos que hay que escuchar en el día para que cuente como "día activo". */
const GOAL_MINUTES = 5;

const DAY_LABELS = ["L", "M", "M", "J", "V", "S", "D"];

type StreakMessage = {
  highlight?: string;
  body: string;
};

const STREAK_MESSAGES: Record<number, StreakMessage> = {
  0: {
    body: "Todavía no completaste ninguna sesión.\nElige una y da el primer paso.",
  },
  1: {
    highlight: "Excelente comienzo.",
    body: "Ya llevas un día conectado contigo.\nMañana continúa tu racha.",
  },
  2: {
    highlight: "¡Dos días seguidos!",
    body: "Estás construyendo un hábito.\nSigue así mañana también.",
  },
  3: {
    highlight: "Tres días de presencia.",
    body: "Ya estás en ritmo. La constancia\nes la base de todo cambio.",
  },
  4: {
    highlight: "¡A mitad de la semana!",
    body: "Cuatro días de conexión contigo.\nEl hábito ya está tomando forma.",
  },
  5: {
    highlight: "Cinco días — ¡increíble!",
    body: "Tu mente y tu cuerpo lo agradecen.\nQueda poco para completar la semana.",
  },
  6: {
    highlight: "Casi una semana completa.",
    body: "Solo falta un día.\nVas a lograrlo, ¡no pares ahora!",
  },
  7: {
    highlight: "¡Semana completa! 🌟",
    body: "Completaste los 7 días de esta semana.\nEso es dedicación de verdad.",
  },
};

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

/** Lunes de la semana que contiene `d` (00:00). */
function startOfWeek(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  const dow = copy.getDay();
  const diff = dow === 0 ? -6 : 1 - dow;
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

  const dashOffset = CIRCUMFERENCE * (1 - activeCount / 7);
  const msg = STREAK_MESSAGES[activeCount] ?? STREAK_MESSAGES[0];

  return (
    <View style={styles.card}>
      {/* Anillo de progreso */}
      <View style={styles.ringWrap}>
        <Svg width={RING_SIZE} height={RING_SIZE}>
          {/* Pista de fondo */}
          <Circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RADIUS}
            stroke="rgba(255,255,255,0.13)"
            strokeWidth={STROKE_W}
            fill="none"
          />
          {/* Arco activo */}
          <Circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RADIUS}
            stroke={GOLD}
            strokeWidth={STROKE_W}
            fill="none"
            strokeDasharray={`${CIRCUMFERENCE}`}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            rotation="-90"
            origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
          />
        </Svg>
        <View style={styles.ringCenter}>
          <Text style={styles.ringCount}>{activeCount}</Text>
          <Text style={styles.ringLabel}>Días</Text>
        </View>
      </View>

      {/* Bolitas de días */}
      <View style={styles.row}>
        {DAY_LABELS.map((label, i) => {
          const met = activeFlags[i];
          const isToday = i === todayIndex;
          return (
            <View key={i} style={styles.dayCol}>
              {met ? (
                <View style={[styles.circle, styles.circleActive]}>
                  <Feather name="check" size={21} color="rgba(255,255,255,0.9)" />
                </View>
              ) : (
                <View style={[styles.circle, styles.circleInactive, isToday && styles.circleToday]} />
              )}
              <Text style={[styles.dayLabel, isToday && styles.dayLabelToday]}>{label}</Text>
            </View>
          );
        })}
      </View>

      {/* Mensaje por cantidad de días */}
      <View style={styles.messageWrap}>
        {msg.highlight != null && (
          <Text style={styles.messageHighlight}>{msg.highlight}</Text>
        )}
        <Text style={styles.message}>{msg.body}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 14,
    gap: 13,
    alignItems: "center",
  },
  ringWrap: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  ringCenter: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  ringCount: {
    color: TEXT,
    fontSize: 26,
    fontWeight: "700",
    lineHeight: 30,
  },
  ringLabel: {
    color: MUTED,
    fontSize: 11,
    fontWeight: "500",
    letterSpacing: 0.3,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  dayCol: {
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  circle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  circleActive: {
    backgroundColor: "rgba(255,255,255,0.20)",
    borderWidth: 2,
    borderColor: GOLD,
  },
  circleInactive: {
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  circleToday: {
    borderWidth: 1.5,
    borderColor: GOLD,
    backgroundColor: "rgba(255,255,255,0.064)",
  },
  dayLabel: {
    color: MUTED,
    fontSize: 12,
    fontWeight: "600",
  },
  dayLabelToday: {
    color: TEXT,
  },
  messageWrap: {
    alignItems: "center",
    gap: 3,
    marginTop: 7,
  },
  messageHighlight: {
    color: GOLD,
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: 0.2,
  },
  message: {
    color: TEXT,
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
  },
});
