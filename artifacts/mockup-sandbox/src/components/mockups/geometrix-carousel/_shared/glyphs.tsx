import React from "react";

export type GlyphProps = {
  color: string;
  size?: number;
  strokeWidth?: number;
  style?: React.CSSProperties;
};

// Axial hex lattice: returns center points within `rings` rings.
// Neighboring centers are exactly `s` apart, so using r === s draws
// classic overlapping "flower" circles.
function hexPoints(rings: number, s: number, cx = 50, cy = 50) {
  const pts: Array<[number, number]> = [];
  for (let q = -rings; q <= rings; q++) {
    for (let r = -rings; r <= rings; r++) {
      if (Math.abs(-q - r) > rings) continue;
      const x = cx + s * (q + r / 2);
      const y = cy + s * ((r * Math.sqrt(3)) / 2);
      pts.push([x, y]);
    }
  }
  return pts;
}

function ring(count: number, radius: number, phase = -90, cx = 50, cy = 50) {
  return Array.from({ length: count }, (_, i) => {
    const a = ((phase + (360 / count) * i) * Math.PI) / 180;
    return [cx + radius * Math.cos(a), cy + radius * Math.sin(a)] as [number, number];
  });
}

const Svg: React.FC<GlyphProps & { children: React.ReactNode }> = ({
  color,
  size = 100,
  strokeWidth = 1.1,
  style,
  children,
}) => (
  <svg
    viewBox="0 0 100 100"
    width={size}
    height={size}
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={style}
  >
    {children}
  </svg>
);

export const FlowerOfLife: React.FC<GlyphProps> = (p) => {
  const pts = hexPoints(2, 11);
  return (
    <Svg {...p}>
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={11} />
      ))}
      <circle cx={50} cy={50} r={34} strokeWidth={(p.strokeWidth ?? 1.1) * 1.25} />
    </Svg>
  );
};

export const SeedOfLife: React.FC<GlyphProps> = (p) => {
  const pts = hexPoints(1, 14);
  return (
    <Svg {...p}>
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={14} />
      ))}
      <circle cx={50} cy={50} r={32} strokeWidth={(p.strokeWidth ?? 1.1) * 1.25} />
    </Svg>
  );
};

export const Metatron: React.FC<GlyphProps> = (p) => {
  const inner = ring(6, 18);
  const outer = ring(6, 36);
  const nodes = [...inner, ...outer];
  const lines: Array<[number[], number[]]> = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      lines.push([nodes[i], nodes[j]]);
    }
  }
  return (
    <Svg {...p}>
      {lines.map(([a, b], i) => (
        <line key={i} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} strokeWidth={(p.strokeWidth ?? 1.1) * 0.5} opacity={0.55} />
      ))}
      {nodes.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={7} />
      ))}
      <circle cx={50} cy={50} r={7} />
    </Svg>
  );
};

export const Merkaba: React.FC<GlyphProps> = (p) => (
  <Svg {...p}>
    <polygon points="50,10 85,70 15,70" />
    <polygon points="50,90 15,30 85,30" />
    <circle cx={50} cy={50} r={40} strokeWidth={(p.strokeWidth ?? 1.1) * 0.8} opacity={0.6} />
  </Svg>
);

export const SriYantra: React.FC<GlyphProps> = (p) => (
  <Svg {...p}>
    <circle cx={50} cy={50} r={42} strokeWidth={(p.strokeWidth ?? 1.1) * 1.1} />
    <polygon points="50,14 84,72 16,72" />
    <polygon points="50,86 16,28 84,28" />
    <polygon points="50,26 72,66 28,66" />
    <polygon points="50,74 28,34 72,34" />
    <circle cx={50} cy={50} r={3.4} fill={p.color} />
  </Svg>
);

export const Torus: React.FC<GlyphProps> = (p) => (
  <Svg {...p}>
    {[40, 31, 22, 13].map((r, i) => (
      <circle key={i} cx={50} cy={50} r={r} />
    ))}
    <ellipse cx={50} cy={50} rx={40} ry={15} opacity={0.7} />
    <ellipse cx={50} cy={50} rx={15} ry={40} opacity={0.7} />
    <circle cx={50} cy={50} r={3.2} fill={p.color} />
  </Svg>
);
