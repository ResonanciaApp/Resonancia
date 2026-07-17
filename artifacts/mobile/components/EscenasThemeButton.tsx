import React, { useCallback, useEffect, useRef, useState } from "react";
import { Pressable } from "react-native";
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Path, RadialGradient, Stop } from "react-native-svg";

import { useSceneTheme } from "@/context/SceneThemeContext";

// Vesica Piscis (de data/glyph-strings.ts, glifo "vesica"):
// dos círculos cx=38/62, cy=50, r=24 en viewBox 0 0 100 100.
const S = 53; // display size
const VB = 100;
const R = 24;
const REST_DX = 12; // media distancia en reposo (cx 38/62)
// Trazo de 2 px en pantalla → unidades de viewBox
const STROKE_W = 2 * (VB / S);
const STROKE_OPACITY = 0.25;

const WHITE = "#FFFFFF";

// Animación "Cruce Zen": los círculos intercambian de lado atravesándose (0,8 s).
const ANIM_MS = 800;

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/** Lente (intersección) de dos círculos de radio R centrados en (50±dx, 50).
 *  null = coinciden (círculo pleno); recalculada por cuadro durante el cruce. */
function lensPath(dx: number): string | null {
  const d = Math.abs(dx) * 2;
  if (d < 0.6) return null;
  const h = Math.sqrt(R * R - (d / 2) * (d / 2));
  return (
    `M 50 ${50 - h} ` +
    `A ${R} ${R} 0 0 1 50 ${50 + h} ` +
    `A ${R} ${R} 0 0 1 50 ${50 - h} Z`
  );
}

/** Aclara un color hex (multiplica canales, clamp 255). */
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

  // t ∈ [0,1] del cruce; en reposo t=1 (geometría idéntica al reposo inicial)
  const [t, setT] = useState(1);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const handlePress = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    // Avance por cuadro fijo (no reloj de pared): si el hilo JS se bloquea,
    // la animación se reanuda donde quedó y completa el ciclo entero.
    const STEP = 16.7 / ANIM_MS;
    let p = 0;
    const tick = () => {
      p = Math.min(1, p + STEP);
      setT(p);
      if (p < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        rafRef.current = null;
        // Abrir al terminar el último cuadro, sin ningún setTimeout,
        // para que no haya fracción de demora perceptible.
        onPress();
      }
    };
    setT(0);
    rafRef.current = requestAnimationFrame(tick);
  }, [onPress]);

  // dx: +12 → −12 (los círculos se cruzan e intercambian de lado)
  const dx = REST_DX * (1 - 2 * easeInOutCubic(t));
  const cxL = 50 - dx;
  const cxR = 50 + dx;
  const lens = lensPath(dx);
  // Brillo central: máximo cuando los círculos coinciden, 0 en reposo
  const glow = 1 - Math.abs(dx) / REST_DX;

  return (
    <Pressable onPress={handlePress} hitSlop={10} style={style}>
      <Svg width={S} height={S} viewBox={`0 0 ${VB} ${VB}`}>
        <Defs>
          <SvgLinearGradient id="vesicaCrescentGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={top} />
            <Stop offset="1" stopColor={bottom} />
          </SvgLinearGradient>
          <RadialGradient id="vesicaGlowGrad" cx="0.5" cy="0.5" r="0.5">
            <Stop offset="0" stopColor={WHITE} stopOpacity="0.9" />
            <Stop offset="1" stopColor={WHITE} stopOpacity="0" />
          </RadialGradient>
        </Defs>

        {/* Medialunas: relleno suave */}
        <Circle cx={cxL} cy={50} r={R} fill="url(#vesicaCrescentGrad)" fillOpacity={0.35} />
        <Circle cx={cxR} cy={50} r={R} fill="url(#vesicaCrescentGrad)" fillOpacity={0.35} />

        {/* Fondo de la intersección (lente) — #f9f9f9 al 60%.
            Al coincidir los círculos (dx≈0) la lente es el círculo completo. */}
        {lens === null ? (
          <Circle cx={50} cy={50} r={R} fill="#f9f9f9" fillOpacity={0.2} />
        ) : (
          <Path d={lens} fill="#f9f9f9" fillOpacity={0.2} />
        )}

        {/* Destello central durante el cruce */}
        {glow > 0.01 && (
          <Circle cx={50} cy={50} r={R * 0.9} fill="url(#vesicaGlowGrad)" opacity={glow * 0.55} />
        )}

        <Circle
          cx={cxL} cy={50} r={R}
          stroke={WHITE}
          strokeWidth={STROKE_W}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          opacity={STROKE_OPACITY}
        />
        <Circle
          cx={cxR} cy={50} r={R}
          stroke={WHITE}
          strokeWidth={STROKE_W}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          opacity={STROKE_OPACITY}
        />
      </Svg>
    </Pressable>
  );
}
