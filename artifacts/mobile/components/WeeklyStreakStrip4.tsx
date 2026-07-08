import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Stop, Text as SvgText } from "react-native-svg";

import { useSceneTheme } from "@/context/SceneThemeContext";
import { usePlayer } from "@/context/PlayerContext";

const TEXT = "#e8e8e8";
const MUTED = "#c2c2c2";

const RING_TOTAL = 114;

const GOAL_MINUTES = 5;
const DAY_LABELS = ["L", "M", "M", "J", "V", "S", "D"];

type StreakMessage = { highlight?: string; body: string };

const STREAK_MESSAGES: Record<number, StreakMessage> = {
  0:  { body: "Todavía no completaste ninguna sesión.\nElige una y da el primer paso." },
  1:  { highlight: "¡Excelente comienzo!", body: "Ya llevas un día conectado contigo." },
  2:  { highlight: "¡Dos días seguidos!", body: "Estás construyendo un hábito." },
  3:  { highlight: "Tres días de presencia.", body: "Ya estás en ritmo." },
  4:  { highlight: "¡A mitad de la semana!", body: "Cuatro días de conexión contigo." },
  5:  { highlight: "Cinco días — ¡increíble!", body: "Tu mente y tu cuerpo lo agradecen." },
  6:  { highlight: "Casi una semana completa.", body: "Solo falta un día." },
  7:  { highlight: "¡Semana completa! 🌟", body: "Completaste los 7 días de esta semana." },
};

function brightenHex(hex: string, amount: number): string {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  const newL = Math.min(1, l + amount / 100);
  const hue2rgb = (p: number, q: number, t: number) => {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };
  let rr: number, gg: number, bb: number;
  if (s === 0) {
    rr = gg = bb = newL;
  } else {
    const q2 = newL < 0.5 ? newL * (1 + s) : newL + s - newL * s;
    const p2 = 2 * newL - q2;
    rr = hue2rgb(p2, q2, h + 1 / 3);
    gg = hue2rgb(p2, q2, h);
    bb = hue2rgb(p2, q2, h - 1 / 3);
  }
  const toHex = (x: number) => Math.round(x * 255).toString(16).padStart(2, "0");
  return `#${toHex(rr)}${toHex(gg)}${toHex(bb)}`;
}

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

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

export function WeeklyStreakStrip4() {
  const { statEvents } = usePlayer();
  const { theme } = useSceneTheme();

  const streakBorderColors = useMemo(
    () => [brightenHex(theme.gradient[0], 62), brightenHex(theme.gradient[0], 18)] as [string, string],
    [theme.gradient[0]]
  );

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
      {/* ── Fila superior: card full-width detrás + anillo encima ── */}
      <View style={styles.topRow}>
        {/* Card mensaje — ocupa todo el ancho, queda detrás del anillo */}
        <View style={styles.msgCard}>
          {/* 1. Blur base */}
          <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
          {/* 2. Inner glow vertical — luminoso arriba, fade abajo */}
          <LinearGradient
            colors={["rgba(255,255,255,0.07)", "rgba(255,255,255,0)"]}
            start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          {/* 3. Brillo top-edge hairline */}
          <LinearGradient
            colors={["rgba(255,255,255,0)", "rgba(255,255,255,0.10)", "rgba(255,255,255,0)"]}
            locations={[0, 0.5, 1]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={{ position: "absolute", top: 0, left: 0, right: 0, height: StyleSheet.hairlineWidth }}
            pointerEvents="none"
          />
          {msg.highlight != null && (
            <Text style={styles.messageHighlight}>{msg.highlight}</Text>
          )}
          <Text style={styles.message}>{msg.body}</Text>
        </View>

        {/* Divisor vertical */}
        <View style={styles.divider} />

        {/* Anillo de progreso — encima de la card */}
        <View
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: RING_TOTAL,
            height: RING_TOTAL,
            borderRadius: RING_TOTAL / 2,
            zIndex: 2,
            shadowColor: "#000",
            shadowOffset: { width: 3, height: 4 },
            shadowOpacity: 0.35,
            shadowRadius: 7,
            elevation: 8,
          }}
        >
          <View
            style={{
              width: RING_TOTAL,
              height: RING_TOTAL,
              borderRadius: RING_TOTAL / 2,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <View style={styles.ringCenter}>
              <Svg width={52} height={50}>
                <Defs>
                  <SvgLinearGradient id="goldNum" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor="#E9C46A" />
                    <Stop offset="1" stopColor="#BE8744" />
                  </SvgLinearGradient>
                </Defs>
                <SvgText x="26" y="44" fill="url(#goldNum)" fontSize={44} fontWeight="700" textAnchor="middle">
                  {String(activeCount)}
                </SvgText>
              </Svg>
              <Text style={styles.ringLabel}>{activeCount === 1 ? "Día" : "Días"}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* ── Bolitas de días (posición original — fila completa) ── */}
      <View style={styles.row}>
        {DAY_LABELS.map((label, i) => {
          const met = activeFlags[i];
          const isToday = i === todayIndex;
          return (
            <View key={i} style={styles.dayCol}>
              {met ? (
                <View style={styles.circleGradientBorder}>
                  <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
                  <LinearGradient
                    colors={["rgba(255,255,255,0.07)", "rgba(255,255,255,0)"]}
                    start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
                    style={StyleSheet.absoluteFill}
                    pointerEvents="none"
                  />
                  <Svg width={42} height={42} style={StyleSheet.absoluteFill}>
                    <Defs>
                      <SvgLinearGradient id={`sg4_${i}`} x1="0.5" y1="0" x2="0.5" y2="1">
                        <Stop offset="0" stopColor={streakBorderColors[0]} />
                        <Stop offset="1" stopColor={streakBorderColors[1]} />
                      </SvgLinearGradient>
                    </Defs>
                    <Circle cx={21} cy={21} r={19} stroke={`url(#sg4_${i})`} strokeWidth={2} fill="none" />
                  </Svg>
                  <Feather name="check" size={19} color="rgba(255,255,255,0.9)" />
                </View>
              ) : isToday ? (
                <View style={styles.circleGradientBorder}>
                  <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
                  <LinearGradient
                    colors={["rgba(255,255,255,0.07)", "rgba(255,255,255,0)"]}
                    start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
                    style={StyleSheet.absoluteFill}
                    pointerEvents="none"
                  />
                  <Svg width={42} height={42} style={StyleSheet.absoluteFill}>
                    <Defs>
                      <SvgLinearGradient id="sg4Today" x1="0.5" y1="0" x2="0.5" y2="1">
                        <Stop offset="0" stopColor={streakBorderColors[0]} />
                        <Stop offset="1" stopColor={streakBorderColors[1]} />
                      </SvgLinearGradient>
                    </Defs>
                    <Circle cx={21} cy={21} r={19} stroke="url(#sg4Today)" strokeWidth={2} fill="none" />
                  </Svg>
                </View>
              ) : (
                <View style={styles.circleGradientBorder}>
                  <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
                  <LinearGradient
                    colors={["rgba(255,255,255,0.07)", "rgba(255,255,255,0)"]}
                    start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
                    style={StyleSheet.absoluteFill}
                    pointerEvents="none"
                  />
                </View>
              )}
              <Text style={[styles.dayLabel, isToday && styles.dayLabelToday, (!met && !isToday) && styles.dayLabelInactivePos]}>
                {label}
              </Text>
            </View>
          );
        })}
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
  },
  topRow: {
    position: "relative",
    height: RING_TOTAL,
    marginHorizontal: -14,
    marginTop: 25,
  },
  msgCard: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.12)",
    paddingLeft: RING_TOTAL + 27,
    paddingRight: 14,
    paddingVertical: 12,
    justifyContent: "center",
    gap: 4,
  },
  ringCenter: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 14,
  },
  divider: {
    position: "absolute",
    left: RING_TOTAL,
    top: 16,
    bottom: 16,
    width: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
    zIndex: 1,
  },
  ringCount: {
    color: "#ffffff",
    fontSize: 44,
    fontWeight: "700",
    lineHeight: 47,
  },
  ringLabel: {
    color: "rgba(255,255,255,0.95)",
    fontSize: 12,
    fontWeight: "300",
    letterSpacing: 0.3,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignSelf: "stretch",
    marginHorizontal: -14,
    marginTop: 1,
  },
  dayCol: {
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  circle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  circleGradientBorder: {
    width: 42,
    height: 42,
    borderRadius: 21,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  circleInactive: {
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  circleInactiveSize: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginTop: 5,
    marginBottom: 1,
  },
  dayLabel: {
    color: MUTED,
    fontSize: 10,
    fontWeight: "600",
    marginTop: -2,
  },
  dayLabelToday: {
    color: TEXT,
  },
  dayLabelInactivePos: {
    marginTop: -2,
  },
  messageHighlight: {
    color: "rgba(255,255,255,0.90)",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  message: {
    color: TEXT,
    fontSize: 12,
    lineHeight: 18,
  },
});
