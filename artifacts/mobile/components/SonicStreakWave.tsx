import { Feather } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { Dimensions, StyleSheet, Text, View } from "react-native";
import Svg, {
  Circle,
  ClipPath,
  Defs,
  G,
  LinearGradient as SvgGradient,
  Path,
  Rect,
  Stop,
} from "react-native-svg";

import { usePlayer } from "@/context/PlayerContext";
import { useSceneTheme } from "@/context/SceneThemeContext";

// ─── Layout ──────────────────────────────────────────────────────────────────
const SCREEN_W  = Dimensions.get("window").width;
const GRID_PAD  = 19;
const COMP_W    = SCREEN_W - GRID_PAD * 2;
const SVG_H     = 64;
const CY        = SVG_H / 2;
const NUM_BOX_W = 88;
const SIDE_GAP  = 15;
const WAVE_W    = (COMP_W - NUM_BOX_W) / 2 - SIDE_GAP;
const AMP       = 12;
const N_CYCLES  = 3;

// ─── Data ────────────────────────────────────────────────────────────────────
const GOAL_DAYS    = 7;
const GOAL_MINUTES = 5;
const DAY_LABELS   = ["L", "M", "M", "J", "V", "S", "D"];
const DEBUG_DAYS   = 4; // ← TEST: poner null para datos reales

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

// ─── Wave paths ───────────────────────────────────────────────────────────────
function buildRightPath(): string {
  const pw = WAVE_W / N_CYCLES;
  const hw = pw / 2;
  let d = `M 0,0`;
  for (let c = 0; c < N_CYCLES; c++) {
    const x0 = c * pw;
    d += ` C ${(x0 + hw * 0.36).toFixed(1)},${-AMP} ${(x0 + hw * 0.64).toFixed(1)},${-AMP} ${(x0 + hw).toFixed(1)},0`;
    d += ` C ${(x0 + hw * 1.36).toFixed(1)},${AMP} ${(x0 + hw * 1.64).toFixed(1)},${AMP} ${(x0 + pw).toFixed(1)},0`;
  }
  return d;
}

function buildLeftPath(): string {
  const pw = WAVE_W / N_CYCLES;
  const hw = pw / 2;
  let d = `M 0,0`;
  for (let c = 0; c < N_CYCLES; c++) {
    const x0 = c * pw;
    d += ` C ${-(x0 + hw * 0.36).toFixed(1)},${-AMP} ${-(x0 + hw * 0.64).toFixed(1)},${-AMP} ${-(x0 + hw).toFixed(1)},0`;
    d += ` C ${-(x0 + hw * 1.36).toFixed(1)},${AMP} ${-(x0 + hw * 1.64).toFixed(1)},${AMP} ${-(x0 + pw).toFixed(1)},0`;
  }
  return d;
}

const RIGHT_PATH  = buildRightPath();
const LEFT_PATH   = buildLeftPath();
const RIGHT_START = COMP_W / 2 + NUM_BOX_W / 2 + SIDE_GAP;
const LEFT_START  = COMP_W / 2 - NUM_BOX_W / 2 - SIDE_GAP;

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

  const borderColor0 = brightenHex(theme.gradient[0], 60);
  const borderColor1 = brightenHex(theme.gradient[0], 50);

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

  const progress = Math.min(weekCount / GOAL_DAYS, 1);
  const activeW  = WAVE_W * progress;
  const clipH    = AMP * 2 + 8;
  const clipY    = -AMP - 4;

  const streakBody = weekCount === 0
    ? STREAK_MESSAGE_ZERO
    : `Resonaste ${weekCount} ${weekCount === 1 ? "día" : "días"} de esta semana.`;

  return (
    <View style={styles.card}>
      {/* ── Ondas + número ── */}
      <View style={{ width: COMP_W, height: SVG_H, alignItems: "center", justifyContent: "center" }}>
        <Svg width={COMP_W} height={SVG_H} style={StyleSheet.absoluteFill}>
          <Defs>
            {/* ── Inactiva derecha: opacidad 0 en ambos extremos → punta afilada ── */}
            <SvgGradient id="swInactR" x1={0} y1={0} x2={WAVE_W} y2={0} gradientUnits="userSpaceOnUse">
              <Stop offset="0"    stopColor="#714A70" stopOpacity="0"    />
              <Stop offset="0.06" stopColor="#714A70" stopOpacity="0.25" />
              <Stop offset="0.86" stopColor="#714A70" stopOpacity="0.25" />
              <Stop offset="1"    stopColor="#714A70" stopOpacity="0"    />
            </SvgGradient>
            {/* ── Inactiva izquierda (misma lógica, eje −x) ── */}
            <SvgGradient id="swInactL" x1={0} y1={0} x2={-WAVE_W} y2={0} gradientUnits="userSpaceOnUse">
              <Stop offset="0"    stopColor="#714A70" stopOpacity="0"    />
              <Stop offset="0.06" stopColor="#714A70" stopOpacity="0.25" />
              <Stop offset="0.86" stopColor="#714A70" stopOpacity="0.25" />
              <Stop offset="1"    stopColor="#714A70" stopOpacity="0"    />
            </SvgGradient>
            {/* ── Activa derecha: dorado + fade en punta exterior ── */}
            <SvgGradient id="swGradR" x1={0} y1={0} x2={WAVE_W} y2={0} gradientUnits="userSpaceOnUse">
              <Stop offset="0"    stopColor="#FFE3A0" stopOpacity="0.7" />
              <Stop offset="0.06" stopColor="#FFE3A0" stopOpacity="1"   />
              <Stop offset="0.5"  stopColor="#D6A451" stopOpacity="1"   />
              <Stop offset="0.86" stopColor="#A9723E" stopOpacity="1"   />
              <Stop offset="1"    stopColor="#A9723E" stopOpacity="0"   />
            </SvgGradient>
            {/* ── Activa izquierda ── */}
            <SvgGradient id="swGradL" x1={0} y1={0} x2={-WAVE_W} y2={0} gradientUnits="userSpaceOnUse">
              <Stop offset="0"    stopColor="#FFE3A0" stopOpacity="0.7" />
              <Stop offset="0.06" stopColor="#FFE3A0" stopOpacity="1"   />
              <Stop offset="0.5"  stopColor="#D6A451" stopOpacity="1"   />
              <Stop offset="0.86" stopColor="#A9723E" stopOpacity="1"   />
              <Stop offset="1"    stopColor="#A9723E" stopOpacity="0"   />
            </SvgGradient>
            <ClipPath id="swClipR">
              <Rect x={0}        y={clipY} width={activeW} height={clipH} />
            </ClipPath>
            <ClipPath id="swClipL">
              <Rect x={-activeW} y={clipY} width={activeW} height={clipH} />
            </ClipPath>
          </Defs>

          {/* Onda derecha */}
          <G transform={`translate(${RIGHT_START}, ${CY})`}>
            <Path d={RIGHT_PATH} stroke="url(#swInactR)" strokeWidth={3} strokeLinecap="butt" fill="none" />
            <G clipPath="url(#swClipR)">
              <Path d={RIGHT_PATH} stroke="url(#swGradR)" strokeWidth={3} strokeLinecap="butt" fill="none" />
            </G>
          </G>

          {/* Onda izquierda */}
          <G transform={`translate(${LEFT_START}, ${CY})`}>
            <Path d={LEFT_PATH} stroke="url(#swInactL)" strokeWidth={3} strokeLinecap="butt" fill="none" />
            <G clipPath="url(#swClipL)">
              <Path d={LEFT_PATH} stroke="url(#swGradL)" strokeWidth={3} strokeLinecap="butt" fill="none" />
            </G>
          </G>
        </Svg>

        {/* Número centrado */}
        <View style={styles.numberWrap} pointerEvents="none">
          <Text style={styles.number}>{weekCount}</Text>
          <Text style={styles.days}>{weekCount === 1 ? "DÍA" : "DÍAS"}</Text>
        </View>
      </View>

      {/* ── Bolitas de días ── */}
      <View style={styles.row}>
        {DAY_LABELS.map((label, i) => {
          const met     = activeFlags[i];
          const isToday = i === todayIndex;
          return (
            <View key={i} style={styles.dayCol}>
              {met ? (
                <View style={styles.circleGradientBorder}>
                  <Svg width={39} height={39} style={[StyleSheet.absoluteFill, { backgroundColor: "transparent" }]}>
                    <Defs>
                      <SvgGradient id={`swsg${i}`} x1="0.5" y1="0" x2="0.5" y2="1">
                        <Stop offset="0" stopColor={borderColor0} stopOpacity="0.6" />
                        <Stop offset="1" stopColor={borderColor1} stopOpacity="0.53" />
                      </SvgGradient>
                    </Defs>
                    <Circle cx={19.5} cy={19.5} r={17.5} stroke={`url(#swsg${i})`} strokeWidth={2} fill="rgba(255,255,255,0.11)" />
                  </Svg>
                  <Feather name="check" size={18} color="rgba(255,255,255,0.9)" />
                </View>
              ) : isToday ? (
                <View style={styles.circleGradientBorder}>
                  <Svg width={39} height={39} style={[StyleSheet.absoluteFill, { backgroundColor: "transparent" }]}>
                    <Defs>
                      <SvgGradient id="swsgToday" x1="0.5" y1="0" x2="0.5" y2="1">
                        <Stop offset="0" stopColor={borderColor0} stopOpacity="0.6" />
                        <Stop offset="1" stopColor={borderColor1} stopOpacity="0.53" />
                      </SvgGradient>
                    </Defs>
                    <Circle cx={19.5} cy={19.5} r={17.5} stroke="url(#swsgToday)" strokeWidth={2} fill="rgba(255,255,255,0.11)" />
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

      {/* ── Mensaje ── */}
      <View style={styles.messageWrap}>
        <Text style={styles.message}>
          {weekCount > 0 ? `¡Excelente comienzo! ${streakBody}` : streakBody}
        </Text>
        <Text style={styles.message}>¡Lo estás haciendo muy bien!</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    paddingVertical: 18,
    gap: 13,
    alignItems: "center",
  },
  numberWrap: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  number: {
    color: "#E8B85D",
    fontSize: 42,
    fontWeight: "700",
    lineHeight: 44,
    letterSpacing: -1,
    textAlign: "center",
  },
  days: {
    color: "#D8CEDD",
    fontSize: 8,
    fontWeight: "400",
    letterSpacing: 2.5,
    textAlign: "center",
    transform: [{ translateY: 0 }],
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: COMP_W,
    marginTop: -12,
  },
  dayCol: {
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  circleGradientBorder: {
    width: 39,
    height: 39,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
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
    backgroundColor: "rgba(255,255,255,0.11)",
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
    paddingHorizontal: 14,
    width: COMP_W,
  },
  message: {
    color: "#FBFBFB",
    fontSize: 12,
    fontWeight: "300",
    lineHeight: 19,
    textAlign: "center",
    marginTop: -3,
  },
});
