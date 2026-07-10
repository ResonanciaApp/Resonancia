import React, { useMemo } from "react";
import { Dimensions, StyleSheet, Text, View } from "react-native";
import Svg, {
  ClipPath,
  Defs,
  G,
  LinearGradient as SvgGradient,
  Path,
  Rect,
  Stop,
} from "react-native-svg";

import { usePlayer } from "@/context/PlayerContext";

// ─── Layout ──────────────────────────────────────────────────────────────────
const SCREEN_W   = Dimensions.get("window").width;
const GRID_PAD   = 19;
const COMP_W     = SCREEN_W - GRID_PAD * 2;
const SVG_H      = 64;
const CY         = SVG_H / 2;
const NUM_BOX_W  = 88;    // ancho reservado para número + "DÍAS"
const SIDE_GAP   = 20;    // espacio entre número y inicio de onda
const WAVE_W     = (COMP_W - NUM_BOX_W) / 2 - SIDE_GAP;
const AMP        = 12;    // amplitud en px
const N_CYCLES   = 3;     // ondulaciones por lado

// ─── Data ────────────────────────────────────────────────────────────────────
const GOAL_DAYS    = 7;
const GOAL_MINUTES = 5;
const DEBUG_DAYS   = 4; // ← TEST: poner null para datos reales

function dayKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

// ─── Wave path builders ───────────────────────────────────────────────────────
// Onda derecha: de x=0 (junto al número) hacia x=WAVE_W (extremo)
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

// Onda izquierda: espejo exacto — de x=0 (junto al número) hacia x=-WAVE_W (extremo)
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

const RIGHT_PATH = buildRightPath();
const LEFT_PATH  = buildLeftPath();

// Posición X de cada onda en el SVG (en coordenadas del grupo)
const RIGHT_START = COMP_W / 2 + NUM_BOX_W / 2 + SIDE_GAP;
const LEFT_START  = COMP_W / 2 - NUM_BOX_W / 2 - SIDE_GAP;

// ─── Component ───────────────────────────────────────────────────────────────
export function SonicStreakWave() {
  const { statEvents } = usePlayer();

  const weekCount = useMemo(() => {
    const byDay = new Map<string, number>();
    for (const e of statEvents) {
      const k = dayKey(new Date(e.playedAt));
      byDay.set(k, (byDay.get(k) ?? 0) + (e.minutes ?? 0));
    }
    const today = new Date();
    const dow   = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() + (dow === 0 ? -6 : 1 - dow));
    monday.setHours(0, 0, 0, 0);
    let cnt = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      if ((byDay.get(dayKey(d)) ?? 0) >= GOAL_MINUTES) cnt++;
    }
    return DEBUG_DAYS ?? cnt;
  }, [statEvents]);

  const progress = Math.min(weekCount / GOAL_DAYS, 1);
  const activeW  = WAVE_W * progress;
  const clipH    = AMP * 2 + 8;
  const clipY    = -AMP - 4;

  return (
    <View style={styles.container}>
      <Svg width={COMP_W} height={SVG_H} style={StyleSheet.absoluteFill}>
        <Defs>
          {/* Gradiente onda derecha: claro junto al número → oscuro en el extremo */}
          <SvgGradient
            id="gradR"
            x1={0} y1={0}
            x2={WAVE_W} y2={0}
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset="0"   stopColor="#FFE3A0" />
            <Stop offset="0.5" stopColor="#D6A451" />
            <Stop offset="1"   stopColor="#A9723E" />
          </SvgGradient>

          {/* Gradiente onda izquierda: claro junto al número (x=0) → oscuro en extremo (x=-WAVE_W) */}
          <SvgGradient
            id="gradL"
            x1={0}        y1={0}
            x2={-WAVE_W}  y2={0}
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset="0"   stopColor="#FFE3A0" />
            <Stop offset="0.5" stopColor="#D6A451" />
            <Stop offset="1"   stopColor="#A9723E" />
          </SvgGradient>

          {/* Clip onda derecha: desde x=0 (número) hasta x=activeW */}
          <ClipPath id="clipR">
            <Rect x={0}       y={clipY} width={activeW} height={clipH} />
          </ClipPath>

          {/* Clip onda izquierda: desde x=-activeW hasta x=0 (número) */}
          <ClipPath id="clipL">
            <Rect x={-activeW} y={clipY} width={activeW} height={clipH} />
          </ClipPath>
        </Defs>

        {/* ── Onda derecha ── */}
        <G transform={`translate(${RIGHT_START}, ${CY})`}>
          {/* Inactiva (fondo completo) */}
          <Path
            d={RIGHT_PATH}
            stroke="rgba(113,74,112,0.25)"
            strokeWidth={3}
            strokeLinecap="round"
            fill="none"
          />
          {/* Activa (recortada por progreso, degradado dorado) */}
          <G clipPath="url(#clipR)">
            <Path
              d={RIGHT_PATH}
              stroke="url(#gradR)"
              strokeWidth={3}
              strokeLinecap="round"
              fill="none"
            />
          </G>
        </G>

        {/* ── Onda izquierda (espejo) ── */}
        <G transform={`translate(${LEFT_START}, ${CY})`}>
          {/* Inactiva */}
          <Path
            d={LEFT_PATH}
            stroke="rgba(113,74,112,0.25)"
            strokeWidth={3}
            strokeLinecap="round"
            fill="none"
          />
          {/* Activa */}
          <G clipPath="url(#clipL)">
            <Path
              d={LEFT_PATH}
              stroke="url(#gradL)"
              strokeWidth={3}
              strokeLinecap="round"
              fill="none"
            />
          </G>
        </G>
      </Svg>

      {/* Número centrado sobre el SVG */}
      <View style={styles.numberWrap} pointerEvents="none">
        <Text style={styles.number}>{weekCount}</Text>
        <Text style={styles.days}>{weekCount === 1 ? "DÍA" : "DÍAS"}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: COMP_W,
    height: SVG_H,
    alignSelf: "center",
    justifyContent: "center",
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
    transform: [{ translateY: 4 }],
  },
});
