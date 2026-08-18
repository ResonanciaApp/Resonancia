/**
 * WeekDayDots — fila de 7 bolitas de días de la semana.
 * La letra del día se muestra dentro del círculo.
 */
import { Feather } from "@expo/vector-icons";
import { useStreak } from "@/hooks/useStreak";
import { LinearGradient } from "expo-linear-gradient";
import { Dimensions, StyleSheet, Text, View } from "react-native";
import React, { useMemo } from "react";
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop } from "react-native-svg";

import { useSceneTheme } from "@/context/SceneThemeContext";

const SCREEN_W = Dimensions.get("window").width;
const GRID_PAD = 19;
const COMP_W   = SCREEN_W - GRID_PAD * 2;

const DAY_LABELS = ["L", "M", "M", "J", "V", "S", "D"];



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
  return `rgb(${Math.round(hue2rgb(hh + 1/3) * 255)},${Math.round(hue2rgb(hh) * 255)},${Math.round(hue2rgb(hh - 1/3) * 255)})`;
}

export function WeekDayDots() {
  const { weekFlags, todayIndex } = useStreak();
  const { theme } = useSceneTheme();

  const isTibet = theme.id === "tibet";
  const waveHigh = isTibet ? brightenHex(theme.gradient[0], 68) : "#FFE3A0";
  const waveMid  = isTibet ? brightenHex(theme.gradient[0], 52) : "#D6A451";
  const borderColor0 = waveHigh;
  const borderColor1 = waveMid;

  const gradColors = [
    brightenHex(theme.gradient[0], 10),
    brightenHex(theme.gradient[1] ?? theme.gradient[0], 10),
  ] as [string, string];

  const activeFlags = weekFlags;

  return (
    <View style={s.row}>
      {DAY_LABELS.map((label, i) => {
        const met     = activeFlags[i];
        const isToday = i === todayIndex;
        return (
          <View key={i} style={s.dayCol}>
            {met ? (
              <View style={[s.circleCompleted, { backgroundColor: "rgba(255,255,255,0.18)", borderWidth: 2, borderColor: "#F9F9F9" }]}>
                <Feather name="check" size={22} color="#fff" />
              </View>
            ) : isToday ? (
              <View style={s.circleGradientBorder}>
                <Svg width={42} height={42} style={[StyleSheet.absoluteFill, { backgroundColor: "transparent" }]}>
                  <Defs>
                    <SvgGradient id="wddToday" x1="0.5" y1="0" x2="0.5" y2="1">
                      <Stop offset="0" stopColor={borderColor0} stopOpacity="0.78" />
                      <Stop offset="1" stopColor={borderColor1} stopOpacity="0.70" />
                    </SvgGradient>
                  </Defs>
                  <Circle cx={21} cy={21} r={19} stroke="url(#wddToday)" strokeWidth={2} fill="rgba(255,255,255,0.18)" />
                </Svg>
                <Text style={s.labelToday}>{label}</Text>
              </View>
            ) : (
              <View style={[s.circle, s.circleInactive]}>
                <Text style={s.labelInactive}>{label}</Text>
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dayCol: {
    alignItems: "center",
    flex: 1,
  },
  circleCompleted: {
    width: 39,
    height: 39,
    borderRadius: 19.5,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  circleGradientBorder: {
    width: 42,
    height: 42,
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
  },
  circleInactive: {
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  labelToday: {
    fontFamily: "Manrope",
    fontSize: 17,
    fontWeight: "700",
    color: "#FBFBFB",
  },
  labelInactive: {
    fontFamily: "Manrope",
    fontSize: 17,
    fontWeight: "600",
    color: "#c2c2c2",
  },
});
