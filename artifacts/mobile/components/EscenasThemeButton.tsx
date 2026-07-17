import React from "react";
import { Pressable } from "react-native";
import Svg, { Circle } from "react-native-svg";

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

const WHITE = "#FFFFFF";

interface Props {
  onPress: () => void;
  style?: object;
}

export function EscenasThemeButton({ onPress, style }: Props) {
  return (
    <Pressable onPress={onPress} hitSlop={10} style={style}>
      <Svg width={S} height={S} viewBox={`0 0 ${VB} ${VB}`}>
        {CIRCLES.map((c, i) => (
          <Circle
            key={i}
            cx={c.cx} cy={c.cy} r={c.r}
            stroke={WHITE}
            strokeWidth={STROKE_W}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            opacity={0.75}
          />
        ))}
      </Svg>
    </Pressable>
  );
}
