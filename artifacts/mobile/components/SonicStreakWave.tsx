import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useDayRollover } from "@/hooks/useDayRollover";
import { computeWeekFlags } from "@/utils/stats";
import React, { useMemo } from "react";
import { Dimensions, StyleSheet, Text, View } from "react-native";
import Svg, {
  Circle,
  G,
  Path,
} from "react-native-svg";

import { usePlayer } from "@/context/PlayerContext";
import { WIDGET_GREEN_SOLID } from "@/constants/colors";

// ─── Ring ────────────────────────────────────────────────────────────────────
const RING_SIZE    = 79;

// ─── Layout ──────────────────────────────────────────────────────────────────
const SCREEN_W  = Dimensions.get("window").width;
const GRID_PAD  = 36;
const COMP_W    = SCREEN_W - GRID_PAD * 2;
const SVG_H     = 64;
const CY        = SVG_H / 2;
const NUM_BOX_W = 88;
const SIDE_GAP  = 15;
const INSET     = 25;
const WAVE_W    = (COMP_W - NUM_BOX_W) / 2 - SIDE_GAP;
const AMP       = 12;
const N_CYCLES  = 3;

// ─── Data ────────────────────────────────────────────────────────────────────
const GOAL_DAYS    = 7;
const DAY_LABELS   = ["L", "M", "M", "J", "V", "S", "D"];



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
const RIGHT_START = COMP_W / 2 + NUM_BOX_W / 2 + SIDE_GAP - INSET;
const LEFT_START  = COMP_W / 2 - NUM_BOX_W / 2 - SIDE_GAP + INSET;

export function SonicStreakDays({
  activeFlags,
  todayIndex,
  daysMarginTop = 0,
  circleSize = 39,
}: {
  activeFlags: boolean[];
  todayIndex: number;
  idPrefix?: string;
  daysMarginTop?: number;
  circleSize?: number;
}) {
  const inactiveCircleSize = circleSize - 2;
  const circleCenter = circleSize / 2;
  const circleRadius = circleCenter - 2;

  return (
    <View style={[styles.row, daysMarginTop ? { marginTop: daysMarginTop } : undefined]}>
      {DAY_LABELS.map((label, i) => {
        const met = activeFlags[i];
        const isToday = i === todayIndex;
        return (
          <View key={i} style={styles.dayCol}>
            {met ? (
              <View style={[styles.circleGradientBorder, { width: circleSize, height: circleSize }]}>
                <Svg width={circleSize} height={circleSize} style={[StyleSheet.absoluteFill, { backgroundColor: "transparent" }]}>
                  <Circle cx={circleCenter} cy={circleCenter} r={circleRadius} stroke={WIDGET_GREEN_SOLID} strokeWidth={2.9} fill="rgba(255,255,255,0.18)" />
                </Svg>
                <Feather name="check" size={18} color="rgba(255,255,255,0.9)" />
              </View>
            ) : isToday ? (
              <View style={[styles.circleGradientBorder, { width: circleSize, height: circleSize }]}>
                <Svg width={circleSize} height={circleSize} style={[StyleSheet.absoluteFill, { backgroundColor: "transparent" }]}>
                  <Circle cx={circleCenter} cy={circleCenter} r={circleRadius} stroke={WIDGET_GREEN_SOLID} strokeWidth={2.9} fill="rgba(255,255,255,0.18)" />
                </Svg>
              </View>
            ) : (
              <View
                style={[
                  styles.circle,
                  styles.circleInactive,
                  {
                    width: inactiveCircleSize,
                    height: inactiveCircleSize,
                    borderRadius: inactiveCircleSize / 2,
                  },
                ]}
              />
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
  );
}

// ─── Component ───────────────────────────────────────────────────────────────
export function SonicStreakWave() {
  const { statEvents } = usePlayer();
  const todayKey = useDayRollover();

  const { weekCount, activeFlags, todayIndex } = useMemo(() => {
    const { flags, weekCount: weekCnt, todayIndex: todayIdx } = computeWeekFlags(statEvents);
    return { weekCount: weekCnt, activeFlags: flags, todayIndex: todayIdx };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statEvents, todayKey]);

  const weekMessage = useMemo(() => {
    if (weekCount <= 0) return "Completa tu primer día de esta semana y empieza tu racha";
    if (weekCount === 1) return "¡Completaste 1 día esta semana! Sigue así";
    if (weekCount < GOAL_DAYS) return `¡Completaste ${weekCount} días esta semana! Sigue así`;
    return "¡Semana completa! 7 de 7 días, increíble";
  }, [weekCount]);

  const rawProgress = Math.min(weekCount / GOAL_DAYS, 1);
  const progress    = rawProgress > 0 ? Math.min(rawProgress + 12 / WAVE_W, 1) : 0;
  const fadeZone    = Math.min(0.18, 20 / WAVE_W);
  const fadeStart   = Math.max(0.07, progress - fadeZone);
  const fadeEnd     = progress;

  return (
    <View style={styles.card}>
      {/* ── Contador a la izquierda + texto a la derecha ── */}
      <View style={{ flexDirection: "row", alignItems: "center", width: COMP_W, paddingVertical: 18, marginTop: -45, gap: 16 }}>
        <MaterialCommunityIcons name="spa" size={68} color="#FFFFFF" />
        <View style={{ flex: 1 }}>
          <Text style={styles.countLine}>
            {weekCount} {weekCount === 1 ? "Día de racha" : "Días de racha"}
          </Text>
          <Text style={styles.sideText}>
            Medita al menos 3 días a la semana y transforma tu vida
          </Text>
        </View>
      </View>

      {/* ── Bolitas de días ── */}
      <SonicStreakDays activeFlags={activeFlags} todayIndex={todayIndex} />

      {/* ── Mensaje semanal ── */}
      <View style={styles.messageWrap}>
        <Text style={styles.message}>{weekMessage}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.035)",
    borderRadius: 16,
    paddingTop: 73,
    paddingBottom: 18,
    paddingHorizontal: 16,
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
    transform: [{ translateY: -2 }],
  },
  ringCount: {
    fontFamily: "Manrope",
    color: "#F9F9F9",
    fontSize: 42,
    fontWeight: "700",
    lineHeight: 46,
    transform: [{ translateY: 7 }],
  },
  ringLabel: {
    fontFamily: "Manrope",
    color: "rgba(255,255,255,0.95)",
    fontSize: 10,
    fontWeight: "300",
    letterSpacing: 0.3,
  },
  countLine: {
    fontFamily: "Manrope",
    fontSize: 19,
    fontWeight: "700",
    color: "#F9F9F9",
    marginBottom: 4,
  },
  sideText: {
    fontFamily: "Manrope",
    fontSize: 14,
    lineHeight: 20,
    color: "#F4F4F4",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: COMP_W,
    marginTop: -7,
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
