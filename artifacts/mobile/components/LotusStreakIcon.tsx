import React from "react";
import Svg, { Ellipse, G, Line, Path } from "react-native-svg";

const GOLD = "#E9C26B";
const GRAY = "#5C5A76";

type PetalId =
  | "center"
  | "lowerLeft"
  | "lowerRight"
  | "middleLeft"
  | "middleRight"
  | "upperLeft"
  | "upperRight";

const STATE_ACTIVE: PetalId[][] = [
  [],
  ["center"],
  ["center", "lowerLeft"],
  ["center", "lowerLeft", "lowerRight"],
  ["center", "lowerLeft", "lowerRight", "middleLeft"],
  ["center", "lowerLeft", "lowerRight", "middleLeft", "middleRight"],
  ["center", "lowerLeft", "lowerRight", "middleLeft", "middleRight", "upperLeft"],
  ["center", "lowerLeft", "lowerRight", "middleLeft", "middleRight", "upperLeft", "upperRight"],
];

// Back-to-front render order (outer petals behind inner ones)
const PETALS: { id: PetalId; angle: number }[] = [
  { id: "upperLeft",   angle: -63 },
  { id: "upperRight",  angle:  63 },
  { id: "middleLeft",  angle: -44 },
  { id: "middleRight", angle:  44 },
  { id: "lowerLeft",   angle: -22 },
  { id: "lowerRight",  angle:  22 },
  { id: "center",      angle:   0 },
];

const CX = 36;
const CY = 62;

// Petal pointing straight up from (CX, CY)
const PETAL = `M ${CX} ${CY} C ${CX - 16} ${CY - 10} ${CX - 14} ${CY - 30} ${CX} ${CY - 40} C ${CX + 14} ${CY - 30} ${CX + 16} ${CY - 10} ${CX} ${CY} Z`;

interface Props {
  streak: number;
  size?: number;
}

export function LotusStreakIcon({ streak, size = 24 }: Props) {
  const state  = Math.min(7, Math.max(0, streak));
  const active = new Set(STATE_ACTIVE[state]);
  const full   = state === 7;
  const sw     = 1.5;
  const h      = Math.round(size * 84 / 72);

  return (
    <Svg width={size} height={h} viewBox="0 0 72 84">
      {/* Halo — state 7 */}
      {full && (
        <Ellipse
          cx={CX} cy={CY - 20} rx={24} ry={22}
          fill={GOLD} fillOpacity={0.07}
        />
      )}

      {/* Stem */}
      <Path
        d={`M ${CX} ${CY} L ${CX} ${CY + 18}`}
        stroke={GOLD} strokeWidth={sw} strokeLinecap="round"
      />
      {/* Side leaves on stem */}
      <Path
        d={`M ${CX} ${CY + 12} Q ${CX - 7} ${CY + 8} ${CX - 4} ${CY + 3}`}
        stroke={GOLD} strokeWidth={sw * 0.65} strokeLinecap="round"
      />
      <Path
        d={`M ${CX} ${CY + 12} Q ${CX + 7} ${CY + 8} ${CX + 4} ${CY + 3}`}
        stroke={GOLD} strokeWidth={sw * 0.65} strokeLinecap="round"
      />

      {/* Petals — back to front */}
      {PETALS.map(({ id, angle }) => {
        const isActive = active.has(id);
        // rotate(angle) around (CX, CY): translate → rotate → untranslate
        return (
          <G key={id} transform={`translate(${CX} ${CY}) rotate(${angle}) translate(${-CX} ${-CY})`}>
            <Path
              d={PETAL}
              stroke={isActive ? GOLD : GRAY}
              fill={isActive ? GOLD : "none"}
              strokeWidth={sw}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          </G>
        );
      })}

      {/* Sparkle — state 7 */}
      {full && (
        <G stroke={GOLD} strokeLinecap="round">
          <Line x1={CX}       y1={CY - 46} x2={CX}       y2={CY - 41} strokeWidth={1.3} />
          <Line x1={CX - 3}   y1={CY - 43.5} x2={CX + 3} y2={CY - 43.5} strokeWidth={1.3} />
          <Line x1={CX - 2.2} y1={CY - 45.5} x2={CX - 1.2} y2={CY - 44.5} strokeWidth={0.9} opacity={0.6} />
          <Line x1={CX + 2.2} y1={CY - 45.5} x2={CX + 1.2} y2={CY - 44.5} strokeWidth={0.9} opacity={0.6} />
        </G>
      )}
    </Svg>
  );
}
