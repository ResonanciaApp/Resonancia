/**
 * SacredGlyph mock for horizontal Geometrix demo
 * Simplified SVG versions of sacred geometries
 */
import React from "react";

export type GeometryId =
  | "flor-vida" | "semilla-vida" | "vesica" | "metatron"
  | "merkaba" | "sri-yantra" | "toroide" | "mandala"
  | "espiral" | "pentagrama" | "hexagrama" | "triquetra"
  | "arbol-vida" | "fruto-vida" | "huevo-vida" | "cubo-vida"
  | "octagrama" | "eneagrama" | "nudo-celta" | "yin-yang"
  | "circulos" | "loto" | "cuadrado" | "circulo" | "triangulo"
  | "tetraedro" | "hexaedro" | "octaedro" | "icosaedro"
  | "dodecaedro" | "cuboctaedro" | "espiral-fibonacci"
  | "decagrama" | "cruz-solar" | "roseta-ocho" | "caleidoscopio";

export const EXTENT = 100;
export const GLYPH_EXTENTS: Record<string, number> = {};

export const baseOf = (id: string): string => id.split("::")[0];

interface SacredGlyphProps {
  id: GeometryId;
  color?: string;
  size?: number;
  strokeWidth?: number;
  opacity?: number;
  style?: React.CSSProperties;
}

export function SacredGlyph({
  id,
  color = "#BE9650",
  size = 100,
  strokeWidth = 1,
  opacity = 1,
  style,
}: SacredGlyphProps) {
  const s = size;
  const c = color;
  const sw = strokeWidth;

  const renderGeometry = () => {
    const cx = s / 2;
    const cy = s / 2;
    const r = s * 0.38;

    switch (id) {
      case "flor-vida":
        return (
          <g>
            {/* Center circle */}
            <circle cx={cx} cy={cy} r={r * 0.35} fill="none" stroke={c} strokeWidth={sw} />
            {/* 6 surrounding circles */}
            {Array.from({ length: 6 }).map((_, i) => {
              const angle = (i * Math.PI) / 3;
              const x = cx + Math.cos(angle) * r * 0.35;
              const y = cy + Math.sin(angle) * r * 0.35;
              return <circle key={i} cx={x} cy={y} r={r * 0.35} fill="none" stroke={c} strokeWidth={sw} />;
            })}
            {/* Outer ring */}
            <circle cx={cx} cy={cy} r={r * 0.7} fill="none" stroke={c} strokeWidth={sw * 0.5} opacity={0.5} />
          </g>
        );

      case "semilla-vida":
        return (
          <g>
            <circle cx={cx} cy={cy} r={r * 0.3} fill="none" stroke={c} strokeWidth={sw} />
            {Array.from({ length: 6 }).map((_, i) => {
              const angle = (i * Math.PI) / 3;
              const x = cx + Math.cos(angle) * r * 0.3;
              const y = cy + Math.sin(angle) * r * 0.3;
              return <circle key={i} cx={x} cy={y} r={r * 0.3} fill="none" stroke={c} strokeWidth={sw} />;
            })}
          </g>
        );

      case "metatron":
        return (
          <g>
            {/* Cube */}
            <rect x={cx - r * 0.5} y={cy - r * 0.5} width={r} height={r} fill="none" stroke={c} strokeWidth={sw} />
            {/* Inner cube */}
            <rect x={cx - r * 0.25} y={cy - r * 0.25} width={r * 0.5} height={r * 0.5} fill="none" stroke={c} strokeWidth={sw} opacity={0.6} />
            {/* Connecting lines */}
            <line x1={cx - r * 0.5} y1={cy - r * 0.5} x2={cx - r * 0.25} y2={cy - r * 0.25} stroke={c} strokeWidth={sw * 0.5} />
            <line x1={cx + r * 0.5} y1={cy - r * 0.5} x2={cx + r * 0.25} y2={cy - r * 0.25} stroke={c} strokeWidth={sw * 0.5} />
            <line x1={cx - r * 0.5} y1={cy + r * 0.5} x2={cx - r * 0.25} y2={cy + r * 0.25} stroke={c} strokeWidth={sw * 0.5} />
            <line x1={cx + r * 0.5} y1={cy + r * 0.5} x2={cx + r * 0.25} y2={cy + r * 0.25} stroke={c} strokeWidth={sw * 0.5} />
          </g>
        );

      case "merkaba":
        return (
          <g>
            {/* Upward triangle */}
            <polygon points={`${cx},${cy - r * 0.6} ${cx - r * 0.5},${cy + r * 0.3} ${cx + r * 0.5},${cy + r * 0.3}`} fill="none" stroke={c} strokeWidth={sw} />
            {/* Downward triangle */}
            <polygon points={`${cx},${cy + r * 0.6} ${cx - r * 0.5},${cy - r * 0.3} ${cx + r * 0.5},${cy - r * 0.3}`} fill="none" stroke={c} strokeWidth={sw} />
            {/* Circle */}
            <circle cx={cx} cy={cy} r={r * 0.5} fill="none" stroke={c} strokeWidth={sw * 0.5} opacity={0.5} />
          </g>
        );

      case "sri-yantra":
        return (
          <g>
            {/* Outer triangles */}
            <polygon points={`${cx},${cy - r * 0.7} ${cx - r * 0.6},${cy + r * 0.4} ${cx + r * 0.6},${cy + r * 0.4}`} fill="none" stroke={c} strokeWidth={sw} />
            <polygon points={`${cx},${cy + r * 0.7} ${cx - r * 0.6},${cy - r * 0.4} ${cx + r * 0.6},${cy - r * 0.4}`} fill="none" stroke={c} strokeWidth={sw} />
            {/* Inner triangles */}
            <polygon points={`${cx},${cy - r * 0.4} ${cx - r * 0.35},${cy + r * 0.2} ${cx + r * 0.35},${cy + r * 0.2}`} fill="none" stroke={c} strokeWidth={sw * 0.7} />
            <polygon points={`${cx},${cy + r * 0.4} ${cx - r * 0.35},${cy - r * 0.2} ${cx + r * 0.35},${cy - r * 0.2}`} fill="none" stroke={c} strokeWidth={sw * 0.7} />
            {/* Center bindu */}
            <circle cx={cx} cy={cy} r={r * 0.06} fill={c} />
          </g>
        );

      case "toroide":
        return (
          <g>
            <circle cx={cx} cy={cy} r={r * 0.5} fill="none" stroke={c} strokeWidth={sw} />
            <circle cx={cx} cy={cy} r={r * 0.35} fill="none" stroke={c} strokeWidth={sw * 0.7} />
            <circle cx={cx} cy={cy} r={r * 0.2} fill="none" stroke={c} strokeWidth={sw * 0.5} />
            {/* Center dot */}
            <circle cx={cx} cy={cy} r={r * 0.05} fill={c} />
          </g>
        );

      case "vesica":
        return (
          <g>
            <circle cx={cx - r * 0.2} cy={cy} r={r * 0.45} fill="none" stroke={c} strokeWidth={sw} />
            <circle cx={cx + r * 0.2} cy={cy} r={r * 0.45} fill="none" stroke={c} strokeWidth={sw} />
            <line x1={cx} y1={cy - r * 0.35} x2={cx} y2={cy + r * 0.35} stroke={c} strokeWidth={sw * 0.5} opacity={0.5} />
          </g>
        );

      case "triquetra":
        return (
          <g>
            {Array.from({ length: 3 }).map((_, i) => {
              const angle = (i * Math.PI * 2) / 3 - Math.PI / 2;
              const x = cx + Math.cos(angle) * r * 0.2;
              const y = cy + Math.sin(angle) * r * 0.2;
              return <circle key={i} cx={x} cy={y} r={r * 0.35} fill="none" stroke={c} strokeWidth={sw} />;
            })}
            {/* Center knot */}
            <circle cx={cx} cy={cy} r={r * 0.08} fill="none" stroke={c} strokeWidth={sw} />
          </g>
        );

      case "mandala":
        return (
          <g>
            <circle cx={cx} cy={cy} r={r * 0.5} fill="none" stroke={c} strokeWidth={sw} />
            <circle cx={cx} cy={cy} r={r * 0.35} fill="none" stroke={c} strokeWidth={sw * 0.7} />
            <circle cx={cx} cy={cy} r={r * 0.2} fill="none" stroke={c} strokeWidth={sw * 0.5} />
            {/* Petals */}
            {Array.from({ length: 8 }).map((_, i) => {
              const angle = (i * Math.PI * 2) / 8;
              const x1 = cx + Math.cos(angle) * r * 0.2;
              const y1 = cy + Math.sin(angle) * r * 0.2;
              const x2 = cx + Math.cos(angle) * r * 0.5;
              const y2 = cy + Math.sin(angle) * r * 0.5;
              return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth={sw * 0.5} />;
            })}
          </g>
        );

      case "espiral":
        return (
          <g>
            <path
              d={`M ${cx} ${cy} ${Array.from({ length: 50 }).map((_, i) => {
                const a = i * 0.3;
                const r2 = (i / 50) * r * 0.5;
                const x = cx + Math.cos(a) * r2;
                const y = cy + Math.sin(a) * r2;
                return `L ${x} ${y}`;
              }).join(" ")}`}
              fill="none" stroke={c} strokeWidth={sw}
            />
          </g>
        );

      case "pentagrama":
        return (
          <g>
            <polygon
              points={Array.from({ length: 5 }).map((_, i) => {
                const angle = (i * Math.PI * 2) / 5 - Math.PI / 2;
                const x = cx + Math.cos(angle) * r * 0.5;
                const y = cy + Math.sin(angle) * r * 0.5;
                return `${x},${y}`;
              }).join(" ")}
              fill="none" stroke={c} strokeWidth={sw}
            />
            {/* Inner star */}
            <polygon
              points={Array.from({ length: 5 }).map((_, i) => {
                const angle = ((i * 2) * Math.PI * 2) / 5 - Math.PI / 2;
                const x = cx + Math.cos(angle) * r * 0.5;
                const y = cy + Math.sin(angle) * r * 0.5;
                return `${x},${y}`;
              }).join(" ")}
              fill="none" stroke={c} strokeWidth={sw}
            />
          </g>
        );

      case "hexagrama":
        return (
          <g>
            <polygon points={`${cx},${cy - r * 0.5} ${cx - r * 0.43},${cy + r * 0.25} ${cx + r * 0.43},${cy + r * 0.25}`} fill="none" stroke={c} strokeWidth={sw} />
            <polygon points={`${cx},${cy + r * 0.5} ${cx - r * 0.43},${cy - r * 0.25} ${cx + r * 0.43},${cy - r * 0.25}`} fill="none" stroke={c} strokeWidth={sw} />
          </g>
        );

      case "arbol-vida":
        return (
          <g>
            {/* 10 circles in tree pattern */}
            <circle cx={cx} cy={cy - r * 0.4} r={r * 0.08} fill="none" stroke={c} strokeWidth={sw} />
            <circle cx={cx - r * 0.25} cy={cy - r * 0.15} r={r * 0.08} fill="none" stroke={c} strokeWidth={sw} />
            <circle cx={cx + r * 0.25} cy={cy - r * 0.15} r={r * 0.08} fill="none" stroke={c} strokeWidth={sw} />
            <circle cx={cx - r * 0.4} cy={cy + r * 0.1} r={r * 0.08} fill="none" stroke={c} strokeWidth={sw} />
            <circle cx={cx} cy={cy + r * 0.1} r={r * 0.08} fill="none" stroke={c} strokeWidth={sw} />
            <circle cx={cx + r * 0.4} cy={cy + r * 0.1} r={r * 0.08} fill="none" stroke={c} strokeWidth={sw} />
            <circle cx={cx - r * 0.25} cy={cy + r * 0.35} r={r * 0.08} fill="none" stroke={c} strokeWidth={sw} />
            <circle cx={cx + r * 0.25} cy={cy + r * 0.35} r={r * 0.08} fill="none" stroke={c} strokeWidth={sw} />
            <circle cx={cx - r * 0.4} cy={cy + r * 0.4} r={r * 0.08} fill="none" stroke={c} strokeWidth={sw} />
            <circle cx={cx + r * 0.4} cy={cy + r * 0.4} r={r * 0.08} fill="none" stroke={c} strokeWidth={sw} />
            {/* Connecting lines */}
            <line x1={cx} y1={cy - r * 0.32} x2={cx - r * 0.25} y2={cy - r * 0.07} stroke={c} strokeWidth={sw * 0.3} />
            <line x1={cx} y1={cy - r * 0.32} x2={cx + r * 0.25} y2={cy - r * 0.07} stroke={c} strokeWidth={sw * 0.3} />
            <line x1={cx - r * 0.25} y1={cy - r * 0.07} x2={cx - r * 0.4} y2={cy + r * 0.02} stroke={c} strokeWidth={sw * 0.3} />
            <line x1={cx - r * 0.25} y1={cy - r * 0.07} x2={cx} y2={cy + r * 0.02} stroke={c} strokeWidth={sw * 0.3} />
          </g>
        );

      case "yin-yang":
        return (
          <g>
            <circle cx={cx} cy={cy} r={r * 0.45} fill="none" stroke={c} strokeWidth={sw} />
            <path d={`M ${cx} ${cy - r * 0.45} A ${r * 0.225} ${r * 0.225} 0 0 1 ${cx} ${cy} A ${r * 0.225} ${r * 0.225} 0 0 0 ${cx} ${cy + r * 0.45} A ${r * 0.45} ${r * 0.45} 0 0 1 ${cx} ${cy - r * 0.45}`} fill="none" stroke={c} strokeWidth={sw * 0.7} />
            <circle cx={cx} cy={cy - r * 0.22} r={r * 0.06} fill={c} />
            <circle cx={cx} cy={cy + r * 0.22} r={r * 0.06} fill="none" stroke={c} strokeWidth={sw} />
          </g>
        );

      case "circulo":
        return <circle cx={cx} cy={cy} r={r * 0.45} fill="none" stroke={c} strokeWidth={sw} />;

      case "triangulo":
        return <polygon points={`${cx},${cy - r * 0.45} ${cx - r * 0.4},${cy + r * 0.35} ${cx + r * 0.4},${cy + r * 0.35}`} fill="none" stroke={c} strokeWidth={sw} />;

      case "cuadrado":
        return <rect x={cx - r * 0.35} y={cy - r * 0.35} width={r * 0.7} height={r * 0.7} fill="none" stroke={c} strokeWidth={sw} />;

      case "loto":
        return (
          <g>
            <circle cx={cx} cy={cy} r={r * 0.1} fill={c} />
            {Array.from({ length: 8 }).map((_, i) => {
              const angle = (i * Math.PI * 2) / 8 - Math.PI / 2;
              const x = cx + Math.cos(angle) * r * 0.3;
              const y = cy + Math.sin(angle) * r * 0.3;
              return <ellipse key={i} cx={x} cy={y} rx={r * 0.15} ry={r * 0.08} fill="none" stroke={c} strokeWidth={sw} transform={`rotate(${(i * 360) / 8} ${x} ${y})`} />;
            })}
          </g>
        );

      case "tetraedro":
        return (
          <g>
            <polygon points={`${cx},${cy - r * 0.5} ${cx - r * 0.43},${cy + r * 0.25} ${cx + r * 0.43},${cy + r * 0.25}`} fill="none" stroke={c} strokeWidth={sw} />
            <line x1={cx} y1={cy - r * 0.5} x2={cx} y2={cy + r * 0.1} stroke={c} strokeWidth={sw * 0.5} />
            <line x1={cx - r * 0.43} y1={cy + r * 0.25} x2={cx} y2={cy + r * 0.1} stroke={c} strokeWidth={sw * 0.5} />
            <line x1={cx + r * 0.43} y1={cy + r * 0.25} x2={cx} y2={cy + r * 0.1} stroke={c} strokeWidth={sw * 0.5} />
          </g>
        );

      case "icosaedro":
      case "dodecaedro":
      case "hexaedro":
      case "octaedro":
        return (
          <g>
            <circle cx={cx} cy={cy} r={r * 0.45} fill="none" stroke={c} strokeWidth={sw} />
            <polygon points={`${cx},${cy - r * 0.3} ${cx + r * 0.28},${cy - r * 0.1} ${cx + r * 0.18},${cy + r * 0.25} ${cx - r * 0.18},${cy + r * 0.25} ${cx - r * 0.28},${cy - r * 0.1}`} fill="none" stroke={c} strokeWidth={sw} />
          </g>
        );

      case "espiral-fibonacci":
        return (
          <g>
            <path
              d={`M ${cx} ${cy} Q ${cx + r * 0.3} ${cy} ${cx + r * 0.3} ${cy + r * 0.3} Q ${cx + r * 0.3} ${cy + r * 0.6} ${cx} ${cy + r * 0.6} Q ${cx - r * 0.3} ${cy + r * 0.6} ${cx - r * 0.3} ${cy + r * 0.3} Q ${cx - r * 0.3} ${cy} ${cx} ${cy}`}
              fill="none" stroke={c} strokeWidth={sw}
            />
            <path
              d={`M ${cx} ${cy} Q ${cx} ${cy - r * 0.2} ${cx + r * 0.2} ${cy - r * 0.2} Q ${cx + r * 0.4} ${cy - r * 0.2} ${cx + r * 0.4} ${cy} Q ${cx + r * 0.4} ${cy + r * 0.2} ${cx + r * 0.2} ${cy + r * 0.2}`}
              fill="none" stroke={c} strokeWidth={sw * 0.7}
            />
          </g>
        );

      case "caleidoscopio":
        return (
          <g>
            {Array.from({ length: 12 }).map((_, i) => {
              const angle = (i * Math.PI * 2) / 12;
              const x1 = cx + Math.cos(angle) * r * 0.15;
              const y1 = cy + Math.sin(angle) * r * 0.15;
              const x2 = cx + Math.cos(angle) * r * 0.5;
              const y2 = cy + Math.sin(angle) * r * 0.5;
              return (
                <g key={i}>
                  <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth={sw * 0.5} />
                  <circle cx={x2} cy={y2} r={r * 0.04} fill={c} opacity={0.5} />
                </g>
              );
            })}
            <circle cx={cx} cy={cy} r={r * 0.15} fill="none" stroke={c} strokeWidth={sw} />
          </g>
        );

      default:
        return (
          <g>
            <circle cx={cx} cy={cy} r={r * 0.45} fill="none" stroke={c} strokeWidth={sw} />
            <circle cx={cx} cy={cy} r={r * 0.25} fill="none" stroke={c} strokeWidth={sw * 0.7} />
          </g>
        );
    }
  };

  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} style={{ ...style, opacity }}>
      {renderGeometry()}
    </svg>
  );
}
