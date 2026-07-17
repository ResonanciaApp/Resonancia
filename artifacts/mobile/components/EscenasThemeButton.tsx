import React from "react";
import { Pressable } from "react-native";
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Path, Stop } from "react-native-svg";

import { useSceneTheme } from "@/context/SceneThemeContext";

// Vesica Piscis (de data/glyph-strings.ts, glifo "vesica"):
// dos círculos cx=38/62, cy=50, r=24 en viewBox 0 0 100 100.
const S = 45; // display size
const VB = 100;
// Trazo de 1 px en pantalla → unidades de viewBox
const STROKE_W = 1 * (VB / S);

const CIRCLES = [
  { cx: 38, cy: 50, r: 24 },
  { cx: 62, cy: 50, r: 24 },
];

// Intersección de ambos círculos: x=50, y=50±√(24²−12²)≈50±20.78
const LENS_TOP = 50 - Math.sqrt(24 * 24 - 12 * 12);
const LENS_BOTTOM = 50 + Math.sqrt(24 * 24 - 12 * 12);
// Lente (vesica): arco derecho del círculo izquierdo + arco izquierdo del derecho
const LENS_PATH =
  `M 50 ${LENS_TOP} ` +
  `A 24 24 0 0 1 50 ${LENS_BOTTOM} ` +
  `A 24 24 0 0 1 50 ${LENS_TOP} Z`;

const WHITE = "#FFFFFF";

/** Aclara un color hex un 50% (multiplica canales, clamp 255). */
function brighten(hex: string, factor = 1.5): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  const ch = (v: number) => Math.min(255, Math.round(v * factor));
  const r = ch((n >> 16) & 255);
  const g = ch((n >> 8) & 255);
  const b = ch(n & 255);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

interface Props {
  onPress: () => void;
  style?: object;
}

export function EscenasThemeButton({ onPress, style }: Props) {
  const { theme } = useSceneTheme();
  const [g0, g1] = theme.gradient;
  const top = brighten(g0);
  const bottom = brighten(g1);
  // Lente (fondo interno): 40% más de brillo extra
  const lensTop = brighten(g0, 1.5 * 1.4);
  const lensBottom = brighten(g1, 1.5 * 1.4);

  return (
    <Pressable onPress={onPress} hitSlop={10} style={style}>
      <Svg width={S} height={S} viewBox={`0 0 ${VB} ${VB}`}>
        <Defs>
          <SvgLinearGradient id="vesicaCrescentGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={top} />
            <Stop offset="1" stopColor={bottom} />
          </SvgLinearGradient>
          <SvgLinearGradient id="vesicaLensGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={lensTop} />
            <Stop offset="1" stopColor={lensBottom} />
          </SvgLinearGradient>
        </Defs>

        {/* Medialunas: relleno suave del mismo degradado para que no se vean
            más oscuras que el fondo por contraste con la lente brillante */}
        {CIRCLES.map((c, i) => (
          <Circle
            key={`f${i}`}
            cx={c.cx} cy={c.cy} r={c.r}
            fill="url(#vesicaCrescentGrad)"
            fillOpacity={0.35}
          />
        ))}

        {/* Fondo de la intersección (lente) — degradado del tema aclarado */}
        <Path d={LENS_PATH} fill="url(#vesicaLensGrad)" />

        {CIRCLES.map((c, i) => (
          <Circle
            key={i}
            cx={c.cx} cy={c.cy} r={c.r}
            stroke={WHITE}
            strokeWidth={STROKE_W}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            opacity={0.5}
          />
        ))}
      </Svg>
    </Pressable>
  );
}
