import { Feather } from "@expo/vector-icons";
import { useStreak } from "@/hooks/useStreak";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import React, { useMemo } from "react";
import { Dimensions, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from "react-native-svg";

import { useSceneTheme } from "@/context/SceneThemeContext";

const GOLD = "#F9F9F9";

const TEXT = "#FBFBFB";
const MUTED = "#c2c2c2";

const SCREEN_W = Dimensions.get("window").width;
const GRID_PAD = 19;
const ROW_W = SCREEN_W - GRID_PAD * 2;

const RING_SIZE = 91;
const STROKE_W = 7;
const RADIUS = (RING_SIZE - STROKE_W) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;



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
    highlight: "¡Excelente comienzo!",
    body: "Ya llevas un día conectado contigo.",
  },
  2: {
    highlight: "¡Dos días seguidos!",
    body: "Estás construyendo un hábito.",
  },
  3: {
    highlight: "Tres días de presencia.",
    body: "Ya estás en ritmo.",
  },
  4: {
    highlight: "¡A mitad de la semana!",
    body: "Cuatro días de conexión contigo.",
  },
  5: {
    highlight: "Cinco días — ¡increíble!",
    body: "Tu mente y tu cuerpo lo agradecen.",
  },
  6: {
    highlight: "Casi una semana completa.",
    body: "Solo falta un día.",
  },
  7: {
    highlight: "¡Semana completa! 🌟",
    body: "Completaste los 7 días de esta semana.",
  },
};

/** Sube la luminosidad de un color hex por `amount` puntos (0-100 escala HSL). */
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
    const q = newL < 0.5 ? newL * (1 + s) : newL + s - newL * s;
    const p = 2 * newL - q;
    rr = hue2rgb(p, q, h + 1 / 3);
    gg = hue2rgb(p, q, h);
    bb = hue2rgb(p, q, h - 1 / 3);
  }

  const toHex = (x: number) => Math.round(x * 255).toString(16).padStart(2, "0");
  return `#${toHex(rr)}${toHex(gg)}${toHex(bb)}`;
}




export function WeeklyStreakStrip() {
  const { weekFlags, weekCount, todayIndex } = useStreak();
  const { theme } = useSceneTheme();

  const streakBorderColors: [string, string] = ["#F9F9F9", "#F9F9F9"];

  const activeFlags = weekFlags;
  const activeCount = weekCount;

  const dashOffset = CIRCUMFERENCE * (1 - activeCount / 7);
  const msg = STREAK_MESSAGES[activeCount] ?? STREAK_MESSAGES[0];

  return (
    <View style={styles.card}>
      {/* Anillo de progreso */}
      <View
        style={{
          width: RING_SIZE + 18,
          height: RING_SIZE + 18,
          borderRadius: (RING_SIZE + 18) / 2,
          marginTop: -10,
          shadowColor: "#000",
          shadowOffset: { width: 1, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 4,
          elevation: 2,
        }}
      >
        <View
          style={[styles.ringWrap, {
            width: RING_SIZE + 18,
            height: RING_SIZE + 18,
            borderRadius: (RING_SIZE + 18) / 2,
            overflow: "hidden",
          }]}
        >
          <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(27,6,15,0.07)" }]} pointerEvents="none" />
          <LinearGradient
            colors={["rgba(255,255,255,0.07)", "rgba(255,255,255,0)"]}
            start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          <Svg width={RING_SIZE} height={RING_SIZE}>
            <Defs>
              <SvgLinearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor="#F9F9F9" />
                <Stop offset="1" stopColor="#F9F9F9" />
              </SvgLinearGradient>
            </Defs>
            <Circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RADIUS}
              stroke="rgba(255,255,255,0.13)"
              strokeWidth={STROKE_W}
              fill="none"
            />
            <Circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RADIUS}
              stroke="url(#ringGrad)"
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
            <Text style={styles.ringLabel}>{activeCount === 1 ? "Día" : "Días"}</Text>
          </View>
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
              <Text style={[styles.dayLabel, isToday && styles.dayLabelToday, (!met && !isToday) && styles.dayLabelInactivePos]}>{label}</Text>
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
    borderRadius: RING_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  ringCenter: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  ringCount: {
    fontFamily: "Manrope",
    color: "#F9F9F9",
    fontSize: 34,
    fontWeight: "700",
    lineHeight: 37,
  },
  ringLabel: {
    fontFamily: "Manrope",
    color: "rgba(255,255,255,0.95)",
    fontSize: 10,
    fontWeight: "300",
    letterSpacing: 0.3,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: ROW_W,
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
  circleToday: {
    backgroundColor: "rgba(255,255,255,0.064)",
  },
  dayLabel: {
    fontFamily: "Manrope",
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

  messageWrap: {
    alignItems: "center",
    gap: 3,
    marginTop: 3,
  },
  messageHighlight: {
    fontFamily: "Manrope",
    color: "#FBFBFB",
    fontSize: 12,
    fontWeight: "300",
    textAlign: "center",
    letterSpacing: 0.2,
  },
  message: {
    fontFamily: "Manrope",
    color: TEXT,
    fontSize: 12,
    lineHeight: 19,
    textAlign: "center",
    marginTop: -3,
  },
});
