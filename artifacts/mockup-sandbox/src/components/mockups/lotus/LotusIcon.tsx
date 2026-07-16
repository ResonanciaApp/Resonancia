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

// Each petal rotates around the flower base (36, 62) in a 72×84 viewBox.
// One unified petal path points straight up from the base.
// center=0°, lower±22°, middle±44°, upper±63°
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

// Petal pointing straight up from (CX, CY): wide, rounded, lotus-like
// Width ≈ 18 at widest, height ≈ 40
const PETAL_PATH = `M ${CX} ${CY} C ${CX - 16} ${CY - 10} ${CX - 14} ${CY - 30} ${CX} ${CY - 40} C ${CX + 14} ${CY - 30} ${CX + 16} ${CY - 10} ${CX} ${CY} Z`;

interface Props {
  state: number;
  size?: number;
}

export function LotusIcon({ state, size = 48 }: Props) {
  const active = new Set(STATE_ACTIVE[Math.min(7, Math.max(0, state))]);
  const full = state === 7;
  const sw = 1.4;

  return (
    <svg
      width={size}
      height={Math.round(size * 84 / 72)}
      viewBox="0 0 72 84"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Halo — state 7 only */}
      {full && (
        <ellipse cx={CX} cy={CY - 20} rx={24} ry={22} fill={GOLD} opacity="0.06" />
      )}

      {/* Stem */}
      <path
        d={`M ${CX} ${CY} L ${CX} ${CY + 18}`}
        stroke={GOLD} strokeWidth={sw} strokeLinecap="round"
      />
      {/* Stem side leaves */}
      <path
        d={`M ${CX} ${CY + 12} Q ${CX - 7} ${CY + 8} ${CX - 4} ${CY + 3}`}
        stroke={GOLD} strokeWidth={sw * 0.65} strokeLinecap="round"
      />
      <path
        d={`M ${CX} ${CY + 12} Q ${CX + 7} ${CY + 8} ${CX + 4} ${CY + 3}`}
        stroke={GOLD} strokeWidth={sw * 0.65} strokeLinecap="round"
      />

      {/* Petals — back to front */}
      {PETALS.map(({ id, angle }) => {
        const isActive = active.has(id);
        return (
          <path
            key={id}
            d={PETAL_PATH}
            transform={`rotate(${angle}, ${CX}, ${CY})`}
            stroke={isActive ? GOLD : GRAY}
            fill={isActive ? GOLD : "none"}
            strokeWidth={sw}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        );
      })}

      {/* Sparkle — state 7 only */}
      {full && (
        <g stroke={GOLD} strokeLinecap="round">
          <line x1={CX}     y1={CY - 46} x2={CX}     y2={CY - 41} strokeWidth="1.3" />
          <line x1={CX - 3} y1={CY - 43.5} x2={CX + 3} y2={CY - 43.5} strokeWidth="1.3" />
          <line x1={CX - 2.2} y1={CY - 45.5} x2={CX - 1.2} y2={CY - 44.5} strokeWidth="0.9" opacity="0.6" />
          <line x1={CX + 2.2} y1={CY - 45.5} x2={CX + 1.2} y2={CY - 44.5} strokeWidth="0.9" opacity="0.6" />
        </g>
      )}
    </svg>
  );
}
