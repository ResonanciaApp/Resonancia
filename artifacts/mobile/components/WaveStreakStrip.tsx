import { Feather } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { Dimensions, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Defs, G, LinearGradient as SvgLinearGradient, Path, Stop } from "react-native-svg";

import { usePlayer } from "@/context/PlayerContext";
import { useSceneTheme } from "@/context/SceneThemeContext";

const SCREEN_W = Dimensions.get("window").width;
const GRID_PAD = 19;
const COMP_W = SCREEN_W - GRID_PAD * 2;
const SVG_H = 118;
const CX = COMP_W / 2;
const CY = SVG_H * 0.47;

const N_WAVES = 7;
const CENTER_GAP = 30;
const SPACING = 13;
const BASE_ARC_H = 28;
const ARC_H_INC = 9;
const BASE_DEPTH = 7;
const DEPTH_INC = 5;

const COLOR_ACTIVE = "#D6A451";
const COLOR_HIGHLIGHT = "#FFE6A8";
const GOAL_MINUTES = 5;
const DAY_LABELS = ["L", "M", "M", "J", "V", "S", "D"];

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function startOfWeek(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  const dow = copy.getDay();
  copy.setDate(copy.getDate() + (dow === 0 ? -6 : 1 - dow));
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

function computeConsecutiveStreak(events: { playedAt: string; minutes: number }[]): number {
  const byDay = minutesByDay(events);
  const today = new Date();
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    d.setHours(0, 0, 0, 0);
    if ((byDay.get(dayKey(d)) ?? 0) >= GOAL_MINUTES) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

type StreakMessage = { highlight?: string; body: string };
const STREAK_MESSAGES: Record<number, StreakMessage> = {
  0: { body: "Todavía no completaste ninguna sesión.\nElige una y da el primer paso." },
  1: { highlight: "¡Excelente comienzo!", body: "Ya llevas un día conectado contigo." },
  2: { highlight: "¡Dos días seguidos!", body: "Estás construyendo un hábito." },
  3: { highlight: "Tres días de presencia.", body: "Ya estás en ritmo." },
  4: { highlight: "¡A mitad de la semana!", body: "Cuatro días de conexión contigo." },
  5: { highlight: "Cinco días — ¡increíble!", body: "Tu mente y tu cuerpo lo agradecen." },
  6: { highlight: "Casi una semana completa.", body: "Solo falta un día." },
  7: { highlight: "¡Semana completa! 🌟", body: "Completaste los 7 días de esta semana." },
};

function getWaveComponents(waveIndex: number, activeWaves: number): { color: string; opacity: number } {
  if (waveIndex >= activeWaves) {
    const opacity = Math.max(0.10, 0.28 - waveIndex * 0.025);
    return { color: "rgb(140,68,87)", opacity };
  }
  if (activeWaves > 0 && waveIndex === activeWaves - 1) return { color: COLOR_HIGHLIGHT, opacity: 1 };
  return { color: COLOR_ACTIVE, opacity: 1 };
}

function wavePath(side: "left" | "right", index: number): string {
  const offset = CENTER_GAP + index * SPACING;
  const x = side === "left" ? CX - offset : CX + offset;
  const arcH = BASE_ARC_H + index * ARC_H_INC;
  const depth = BASE_DEPTH + index * DEPTH_INC;
  const top = CY - arcH / 2;
  const bot = CY + arcH / 2;
  const qx = side === "left" ? x - depth : x + depth;
  return `M ${x.toFixed(1)} ${top.toFixed(1)} Q ${qx.toFixed(1)} ${CY.toFixed(1)} ${x.toFixed(1)} ${bot.toFixed(1)}`;
}

export function WaveStreakStrip() {
  const { statEvents } = usePlayer();
  const { theme } = useSceneTheme();

  const DEBUG_STREAK = 7; // ← quitar para producción

  const { streakBorderColors, consecutiveStreak, activeWaves, activeFlags, todayIndex, weekCount } = useMemo(() => {
    if (DEBUG_STREAK > 0) {
      return {
        streakBorderColors: ["#F7CB6B", "#FBA980"] as [string, string],
        consecutiveStreak: DEBUG_STREAK,
        activeWaves: Math.min(DEBUG_STREAK, N_WAVES),
        activeFlags: Array.from({ length: 7 }, (_, i) => i < DEBUG_STREAK),
        todayIndex: Math.min(DEBUG_STREAK - 1, 6),
        weekCount: Math.min(DEBUG_STREAK, 7),
      };
    }

    const byDay = minutesByDay(statEvents);
    const today = new Date();

    // Consecutive streak (for number display + wave activation)
    let streak = 0;
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      d.setHours(0, 0, 0, 0);
      if ((byDay.get(dayKey(d)) ?? 0) >= GOAL_MINUTES) streak++;
      else break;
    }

    // Weekly flags (for bolitas row)
    const monday = startOfWeek(today);
    const flags: boolean[] = [];
    let weekCnt = 0;
    let todayIdx = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const met = (byDay.get(dayKey(d)) ?? 0) >= GOAL_MINUTES;
      flags.push(met);
      if (met) weekCnt++;
      if (dayKey(d) === dayKey(today)) todayIdx = i;
    }

    const border: [string, string] = ["#F7CB6B", "#FBA980"];

    return {
      streakBorderColors: border,
      consecutiveStreak: streak,
      activeWaves: Math.min(weekCnt, N_WAVES),
      activeFlags: flags,
      todayIndex: todayIdx,
      weekCount: weekCnt,
    };
  }, [statEvents]);

  const msgKey = Math.min(weekCount, 7);
  const msg = STREAK_MESSAGES[msgKey] ?? STREAK_MESSAGES[0];

  return (
    <View style={styles.card}>
      {/* ── Ondas + número ── */}
      <View style={{ width: COMP_W, height: SVG_H, marginTop: 20 }}>
        <Svg width={COMP_W} height={SVG_H} style={StyleSheet.absoluteFill}>
          <Defs>
            {Array.from({ length: N_WAVES }, (_, i) => {
              const { color, opacity } = getWaveComponents(i, activeWaves);
              return (
                <SvgLinearGradient key={`wg${i}`} id={`wg${i}`} x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0"    stopColor={color} stopOpacity="0" />
                  <Stop offset="0.16" stopColor={color} stopOpacity={opacity} />
                  <Stop offset="0.84" stopColor={color} stopOpacity={opacity} />
                  <Stop offset="1"    stopColor={color} stopOpacity="0" />
                </SvgLinearGradient>
              );
            })}
          </Defs>

          <G transform="translate(-2, 0)">
            {/* Ondas izquierda (de exterior a interior para que el interior quede encima) */}
            {Array.from({ length: N_WAVES }, (_, i) => N_WAVES - 1 - i).map((waveIdx) => (
              <Path
                key={`L${waveIdx}`}
                d={wavePath("left", waveIdx)}
                stroke={`url(#wg${waveIdx})`}
                strokeWidth={1.6}
                strokeLinecap="butt"
                fill="none"
              />
            ))}
            {/* Ondas derecha */}
            {Array.from({ length: N_WAVES }, (_, i) => N_WAVES - 1 - i).map((waveIdx) => (
              <Path
                key={`R${waveIdx}`}
                d={wavePath("right", waveIdx)}
                stroke={`url(#wg${waveIdx})`}
                strokeWidth={1.6}
                strokeLinecap="butt"
                fill="none"
              />
            ))}
          </G>
        </Svg>

        {/* Número centrado */}
        <View style={[StyleSheet.absoluteFill, styles.numberWrap]} pointerEvents="none">
          <Text style={styles.numberText}>{consecutiveStreak}</Text>
          <Text style={styles.daysLabel}>{consecutiveStreak === 1 ? "DÍA" : "DÍAS"}</Text>
        </View>
      </View>

      {/* ── Bolitas de días ── */}
      <View style={[styles.row, { marginTop: -20 }]}>
        {DAY_LABELS.map((label, i) => {
          const met = activeFlags[i];
          const isToday = i === todayIndex;
          return (
            <View key={i} style={styles.dayCol}>
              {met ? (
                <View style={styles.circleGradientBorder}>
                  <Svg width={39} height={39} style={StyleSheet.absoluteFill}>
                    <Defs>
                      <SvgLinearGradient id={`sg${i}`} x1="0.5" y1="0" x2="0.5" y2="1">
                        <Stop offset="0" stopColor={streakBorderColors[0]} />
                        <Stop offset="1" stopColor={streakBorderColors[1]} />
                      </SvgLinearGradient>
                    </Defs>
                    <Circle cx={19.5} cy={19.5} r={17.5} stroke={`url(#sg${i})`} strokeWidth={2} fill="rgba(255,255,255,0.11)" />
                  </Svg>
                  <Feather name="check" size={18} color="rgba(255,255,255,0.9)" />
                </View>
              ) : isToday ? (
                <View style={styles.circleGradientBorder}>
                  <Svg width={39} height={39} style={StyleSheet.absoluteFill}>
                    <Defs>
                      <SvgLinearGradient id="sgToday" x1="0.5" y1="0" x2="0.5" y2="1">
                        <Stop offset="0" stopColor={streakBorderColors[0]} />
                        <Stop offset="1" stopColor={streakBorderColors[1]} />
                      </SvgLinearGradient>
                    </Defs>
                    <Circle cx={19.5} cy={19.5} r={17.5} stroke="url(#sgToday)" strokeWidth={2} fill="rgba(255,255,255,0.11)" />
                  </Svg>
                </View>
              ) : (
                <View style={[styles.circle, styles.circleInactive, styles.circleInactiveSize]} />
              )}
              <Text style={[styles.dayLabel, isToday && styles.dayLabelToday, (!met && !isToday) && styles.dayLabelInactive]}>{label}</Text>
            </View>
          );
        })}
      </View>

      {/* ── Mensaje ── */}
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
  numberWrap: {
    alignItems: "center",
    justifyContent: "center",
    gap: 0,
  },
  numberText: {
    color: "#F7CB6B",
    fontSize: 42,
    fontWeight: "700",
    lineHeight: 44,
    letterSpacing: -1,
    textShadowColor: "rgba(247,203,107,0.45)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 14,
  },
  daysLabel: {
    color: "#f9f9f9",
    fontSize: 8,
    fontWeight: "400",
    letterSpacing: 2.5,
    marginTop: 1,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: COMP_W,
    marginTop: 1,
  },
  dayCol: {
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  circle: {
    width: 39,
    height: 39,
    borderRadius: 19.5,
    alignItems: "center",
    justifyContent: "center",
  },
  circleGradientBorder: {
    width: 39,
    height: 39,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  circleInactive: {
    backgroundColor: "rgba(255,255,255,0.11)",
  },
  circleInactiveSize: {
    width: 37,
    height: 37,
    borderRadius: 18.5,
    marginTop: 5,
    marginBottom: 1,
  },
  dayLabel: {
    color: "#c2c2c2",
    fontSize: 10,
    fontWeight: "600",
    marginTop: -2,
  },
  dayLabelToday: {
    color: "#FBFBFB",
  },
  dayLabelInactive: {
    marginTop: -2,
  },
  messageWrap: {
    alignItems: "center",
    gap: 3,
    marginTop: 3,
  },
  messageHighlight: {
    color: "#FBFBFB",
    fontSize: 12,
    fontWeight: "300",
    textAlign: "center",
    letterSpacing: 0.2,
  },
  message: {
    color: "#FBFBFB",
    fontSize: 12,
    lineHeight: 19,
    textAlign: "center",
    marginTop: -3,
  },
});
