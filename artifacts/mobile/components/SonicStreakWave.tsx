import { Feather } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { Dimensions, StyleSheet, Text, View } from "react-native";
import Svg, {
  Circle,
  Defs,
  LinearGradient as SvgGradient,
  Stop,
} from "react-native-svg";

import { usePlayer } from "@/context/PlayerContext";
import { useSceneTheme } from "@/context/SceneThemeContext";

// ─── Layout ──────────────────────────────────────────────────────────────────
const SCREEN_W  = Dimensions.get("window").width;
const GRID_PAD  = 19;
const COMP_W    = SCREEN_W - GRID_PAD * 2;

// ─── Data ────────────────────────────────────────────────────────────────────
const GOAL_MINUTES = 5;
const DAY_LABELS   = ["L", "M", "M", "J", "V", "S", "D"];
const DEBUG_DAYS   = 3; // ← TEST: poner null para datos reales

const STREAK_MESSAGE_ZERO =
  "Todavía no completaste ninguna sesión.\nElige una y da el primer paso.";

function dayKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function startOfWeek(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  const dow = copy.getDay();
  copy.setDate(copy.getDate() + (dow === 0 ? -6 : 1 - dow));
  return copy;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function brightenHex(hex: string, pct: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let hh = 0, s = 0;
  let l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: hh = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: hh = ((b - r) / d + 2) / 6; break;
      case b: hh = ((r - g) / d + 4) / 6; break;
    }
  }
  l = Math.min(1, l + pct / 100);
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hue2rgb = (t: number) => {
    if (t < 0) t += 1; if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };
  const rr = Math.round(hue2rgb(hh + 1/3) * 255);
  const gg = Math.round(hue2rgb(hh) * 255);
  const bb = Math.round(hue2rgb(hh - 1/3) * 255);
  return `rgb(${rr},${gg},${bb})`;
}

// ─── Component ───────────────────────────────────────────────────────────────
export function SonicStreakWave() {
  const { statEvents } = usePlayer();
  const { theme } = useSceneTheme();

  // Tibet: colores derivados del tema. Resto: dorado fijo.
  const isTibet = theme.id === "tibet";
  const borderColor0 = isTibet ? brightenHex(theme.gradient[0], 68) : "#FFE3A0";
  const borderColor1 = isTibet ? brightenHex(theme.gradient[0], 52) : "#D6A451";

  const { weekCount, activeFlags, todayIndex } = useMemo(() => {
    const byDay = new Map<string, number>();
    for (const e of statEvents) {
      const k = dayKey(new Date(e.playedAt));
      byDay.set(k, (byDay.get(k) ?? 0) + (e.minutes ?? 0));
    }
    const today  = new Date();
    const monday = startOfWeek(today);
    const flags: boolean[] = [];
    let weekCnt  = 0;
    let todayIdx = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const met = (byDay.get(dayKey(d)) ?? 0) >= GOAL_MINUTES;
      flags.push(met);
      if (met) weekCnt++;
      if (dayKey(d) === dayKey(today)) todayIdx = i;
    }
    const finalCnt = DEBUG_DAYS ?? weekCnt;
    return {
      weekCount:   finalCnt,
      activeFlags: DEBUG_DAYS != null
        ? Array.from({ length: 7 }, (_, i) => i < DEBUG_DAYS)
        : flags,
      todayIndex: todayIdx,
    };
  }, [statEvents]);

  const streakBody = weekCount === 0
    ? STREAK_MESSAGE_ZERO
    : `Resonaste ${weekCount} ${weekCount === 1 ? "día" : "días"} de esta semana.`;

  return (
    <View style={styles.card}>
      {/* ── Bolitas de días ── */}
      <View style={styles.row}>
        {DAY_LABELS.map((label, i) => {
          const met     = activeFlags[i];
          const isToday = i === todayIndex;
          return (
            <View key={i} style={styles.dayCol}>
              {met ? (
                <View style={[styles.circleGradientBorder, styles.circleMetFill]}>
                  <Feather name="check" size={24} color="rgba(255,255,255,0.9)" />
                </View>
              ) : isToday ? (
                <View style={styles.circleGradientBorder}>
                  <Svg width={39} height={39} style={[StyleSheet.absoluteFill, { backgroundColor: "transparent" }]}>
                    <Defs>
                      <SvgGradient id="swsgToday" x1="0.5" y1="0" x2="0.5" y2="1">
                        <Stop offset="0" stopColor={borderColor0} stopOpacity="0.78" />
                        <Stop offset="1" stopColor={borderColor1} stopOpacity="0.70" />
                      </SvgGradient>
                    </Defs>
                    <Circle cx={19.5} cy={19.5} r={17.5} stroke="url(#swsgToday)" strokeWidth={2} fill="rgba(255,255,255,0.18)" />
                  </Svg>
                </View>
              ) : (
                <View style={[styles.circle, styles.circleInactive]} />
              )}
              <Text style={[
                styles.dayLabel,
                isToday && styles.dayLabelToday,
                !met && !isToday && styles.dayLabelInactive,
              ]}>
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
    paddingTop: 16,
    paddingBottom: 18,
    gap: 13,
    alignItems: "center",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: COMP_W,
    marginTop: 13,
  },
  dayCol: {
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  circleGradientBorder: {
    width: 39,
    height: 39,
    borderRadius: 19.5,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  circleMetFill: {
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  circle: {
    width: 37,
    height: 37,
    borderRadius: 18.5,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 5,
    marginBottom: 1,
  },
  circleInactive: {
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  dayLabel: {
    fontFamily: "Manrope",
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
    paddingHorizontal: 14,
    width: COMP_W,
  },
  message: {
    fontFamily: "Manrope",
    color: "#FBFBFB",
    fontSize: 12,
    fontWeight: "300",
    lineHeight: 19,
    textAlign: "center",
    marginTop: -3,
  },
});
