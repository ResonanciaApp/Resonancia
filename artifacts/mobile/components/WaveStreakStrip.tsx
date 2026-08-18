import { Feather } from "@expo/vector-icons";
import { useStreak } from "@/hooks/useStreak";
import React, { useMemo } from "react";
import { Dimensions, StyleSheet, Text, View } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  type SharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";
import Svg, { Circle, Defs, G, LinearGradient as SvgLinearGradient, Path, Stop } from "react-native-svg";

import { useSceneTheme } from "@/context/SceneThemeContext";

const SCREEN_W = Dimensions.get("window").width;
const GRID_PAD = 19;
const COMP_W = SCREEN_W - GRID_PAD * 2;
const SVG_H = 118;
const CX = COMP_W / 2;
const CY = SVG_H * 0.47;

const N_WAVES = 7;
const CENTER_GAP = 33;
const BASE_GAP = 11;      // hueco entre onda 0 y 1
const GAP_GROW = 1.10;    // cada hueco es 10% mayor que el anterior

// Distancias acumuladas desde el centro para cada onda
const WAVE_OFFSETS: number[] = (() => {
  const offsets: number[] = [];
  let acc = CENTER_GAP;
  for (let i = 0; i < N_WAVES; i++) {
    offsets.push(acc);
    acc += BASE_GAP * Math.pow(GAP_GROW, i);
  }
  return offsets;
})();
const BASE_ARC_H = 32;
const ARC_H_INC = 10;
const BASE_DEPTH = 11;
const DEPTH_INC = 5;


const DAY_LABELS = ["L", "M", "M", "J", "V", "S", "D"];


const STREAK_MESSAGE_ZERO = "Todavía no completaste ninguna sesión.\nElige una y da el primer paso.";

// Sube la luminosidad de un color hex en `pct` puntos (HSL)
function brightenHex(hex: string, pct: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let hh = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) hh = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) hh = ((b - r) / d + 2) / 6;
    else hh = ((r - g) / d + 4) / 6;
  }
  const l2 = Math.min(1, l + pct / 100);
  const q = l2 < 0.5 ? l2 * (1 + s) : l2 + s - l2 * s;
  const p = 2 * l2 - q;
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

type RGB = { r: number; g: number; b: number };

function hexToRgb(hex: string): RGB {
  const h = hex.replace("#", "");
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

// Eleva el color para que el canal máximo sea al menos `target` (asegura visibilidad)
function liftBrightness(c: RGB, target = 200): RGB {
  const max = Math.max(c.r, c.g, c.b, 1);
  if (max >= target) return c;
  const scale = target / max;
  return {
    r: Math.min(255, Math.round(c.r * scale)),
    g: Math.min(255, Math.round(c.g * scale)),
    b: Math.min(255, Math.round(c.b * scale)),
  };
}

function lerpColor(a: RGB, b: RGB, t: number): string {
  const r = Math.round(a.r + (b.r - a.r) * t);
  const g = Math.round(a.g + (b.g - a.g) * t);
  const b2 = Math.round(a.b + (b.b - a.b) * t);
  return `rgb(${r},${g},${b2})`;
}

function getWaveComponents(
  waveIndex: number,
  activeWaves: number,
  satLow: RGB,
  satHigh: RGB,
  inactiveColor: RGB,
): { color: string; opacity: number } {
  // t=1 → más interior (index 0), t=0 → más exterior (index N_WAVES-1)
  const tPos = 1 - waveIndex / (N_WAVES - 1);

  if (waveIndex >= activeWaves) {
    // Onda siguiente a la racha: tinte del tema sutil
    if (waveIndex === activeWaves && activeWaves > 0) {
      const opacity = 0.38 + 0.22 * tPos;
      return { color: lerpColor(inactiveColor, satHigh, 0.38), opacity };
    }
    // Resto inactivas
    const opacity = 0.28 + 0.30 * tPos;
    return { color: `rgb(${inactiveColor.r},${inactiveColor.g},${inactiveColor.b})`, opacity };
  }
  // Activas: rampa de saturación de color + rampa de opacidad interior→exterior
  const tColor = activeWaves <= 1 ? 1 : waveIndex / (activeWaves - 1);
  const opacity = 0.18 + 0.82 * tPos; // exterior: 0.18, interior: 1.0
  return { color: lerpColor(satLow, satHigh, tColor), opacity };
}

function wavePath(side: "left" | "right", index: number): string {
  const offset = WAVE_OFFSETS[index];
  const x = side === "left" ? CX - offset : CX + offset;
  const arcH = BASE_ARC_H + index * ARC_H_INC + (index === 3 ? 3 : 0) + (index === 4 ? 4 : 0) + (index === 5 ? 6 : 0) + (index === 6 ? 8 : 0);
  const depth = BASE_DEPTH + index * DEPTH_INC;
  const top = CY - arcH / 2;
  const bot = CY + arcH / 2;
  const qx = side === "left" ? x - depth : x + depth;
  return `M ${x.toFixed(1)} ${top.toFixed(1)} Q ${qx.toFixed(1)} ${CY.toFixed(1)} ${x.toFixed(1)} ${bot.toFixed(1)}`;
}

type Props = { scrollY?: SharedValue<number>; hideWaves?: boolean };

// Fade empieza al 60% del recorrido (~146px), completa en ~180px (≈600ms scroll)
const FADE_START = 146;
const FADE_END   = 386;

export function WaveStreakStrip({ scrollY, hideWaves = false }: Props) {
  const { currentStreak, weekFlags, weekCount: weekCnt, todayIndex: todayIdx } = useStreak();
  const { theme } = useSceneTheme();
  const streakBorderColors: [string, string] = [
    brightenHex(theme.gradient[0], 60),
    brightenHex(theme.gradient[0], 50),
  ];

  // Colores de ondas derivados del tema — misma intensidad/degradado, hue del tema
  const NEUTRAL_WARM: RGB = { r: 165, g: 155, b: 148 };
  const waveSatHigh: RGB = liftBrightness(hexToRgb(theme.gradient[0]), 200);
  const waveSatLow:  RGB = {
    r: Math.round((waveSatHigh.r + NEUTRAL_WARM.r) / 2),
    g: Math.round((waveSatHigh.g + NEUTRAL_WARM.g) / 2),
    b: Math.round((waveSatHigh.b + NEUTRAL_WARM.b) / 2),
  };
  const waveInactive: RGB = liftBrightness(hexToRgb(theme.gradient[1] ?? theme.gradient[0]), 130);

  const DEBUG_STREAK: number | null = null; // racha real (sin override de pruebas)

  const finalCnt = DEBUG_STREAK ?? weekCnt;
  const consecutiveStreak = DEBUG_STREAK ?? currentStreak;
  const activeWaves = Math.min(finalCnt, N_WAVES);
  const activeFlags = DEBUG_STREAK != null ? Array.from({ length: 7 }, (_, i) => i < DEBUG_STREAK) : weekFlags;
  const todayIndex = todayIdx;
  const weekCount = finalCnt;

  const fadeStyle = useAnimatedStyle(() => ({
    opacity: scrollY
      ? interpolate(scrollY.value, [FADE_START, FADE_END], [1, 0], Extrapolation.CLAMP)
      : 1,
  }));

  const streakBody = weekCount === 0
    ? STREAK_MESSAGE_ZERO
    : `Resonaste ${weekCount} ${weekCount === 1 ? "día" : "días"} de esta semana.`;

  return (
    <View style={styles.card}>
      {/* ── Ondas + número ── */}
      <Animated.View style={[{ width: COMP_W, height: SVG_H, marginTop: 0 }, fadeStyle]}>
        {!hideWaves && (
          <Svg width={COMP_W} height={SVG_H} style={{ position: "absolute", top: -2, left: 0, right: 0, bottom: 0 }}>
            <Defs>
              {Array.from({ length: N_WAVES }, (_, i) => {
                const { color, opacity } = getWaveComponents(i, activeWaves, waveSatLow, waveSatHigh, waveInactive);
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

            <G>
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
        )}

        {/* Número centrado */}
        <View style={[StyleSheet.absoluteFill, styles.numberWrap]} pointerEvents="none">
          <View style={{ marginTop: 4, marginLeft: 3 }}>
            <Text style={styles.numberText}>{weekCount}</Text>
            <Text style={styles.daysLabel}>{weekCount === 1 ? "DÍA" : "DÍAS"}</Text>
          </View>
        </View>
      </Animated.View>

      {/* ── Bolitas de días ── */}
      <View style={[styles.row, { marginTop: -22 }]}>
        {DAY_LABELS.map((label, i) => {
          const met = activeFlags[i];
          const isToday = i === todayIndex;
          return (
            <View key={i} style={styles.dayCol}>
              {met ? (
                <View style={styles.circleGradientBorder}>
                  <Svg width={39} height={39} style={[StyleSheet.absoluteFill, { backgroundColor: "transparent" }]}>
                    <Defs>
                      <SvgLinearGradient id={`sg${i}`} x1="0.5" y1="0" x2="0.5" y2="1">
                        <Stop offset="0" stopColor={streakBorderColors[0]} stopOpacity="0.70" />
                        <Stop offset="1" stopColor={streakBorderColors[1]} stopOpacity="0.63" />
                      </SvgLinearGradient>
                    </Defs>
                    <Circle cx={19.5} cy={19.5} r={17.5} stroke={`url(#sg${i})`} strokeWidth={2} fill="rgba(255,255,255,0.11)" />
                  </Svg>
                  <Feather name="check" size={18} color="rgba(255,255,255,0.9)" />
                </View>
              ) : isToday ? (
                <View style={styles.circleGradientBorder}>
                  <Svg width={39} height={39} style={[StyleSheet.absoluteFill, { backgroundColor: "transparent" }]}>
                    <Defs>
                      <SvgLinearGradient id="sgToday" x1="0.5" y1="0" x2="0.5" y2="1">
                        <Stop offset="0" stopColor={streakBorderColors[0]} stopOpacity="0.70" />
                        <Stop offset="1" stopColor={streakBorderColors[1]} stopOpacity="0.63" />
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
    alignItems: "center",
    justifyContent: "center",
    gap: 0,
  },
  numberText: {
    fontFamily: "Manrope",
    color: "#F9F9F9",
    fontSize: 42,
    fontWeight: "700",
    lineHeight: 44,
    letterSpacing: -1,
  },
  daysLabel: {
    fontFamily: "Manrope",
    color: "#f9f9f9",
    fontSize: 8,
    fontWeight: "400",
    letterSpacing: 2.5,
    marginTop: 1,
    transform: [{ translateY: 4 }],
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
    color: "#FBFBFB",
    fontSize: 12,
    fontWeight: "300",
    lineHeight: 19,
    textAlign: "center",
    marginTop: -3,
  },
});
