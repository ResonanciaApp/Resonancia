/**
 * SacredGlyph — dibuja una geometría sagrada con SVG.
 * Usado tanto en las miniaturas de la galería como en las capas del
 * fondo interactivo (Geometrix). Todo se dibuja en un viewBox 0–100.
 */
import React from "react";
import Svg, { Circle, Ellipse, G, Line, Path, Polygon } from "react-native-svg";

import type { GeometryId } from "@/data/geometries";

const C = 50;

function pt(r: number, angleDeg: number, cx = C, cy = C): [number, number] {
  const a = (angleDeg * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
}

function poly(r: number, sides: number, rot = -90, cx = C, cy = C): string {
  const out: string[] = [];
  for (let i = 0; i < sides; i++) {
    const [x, y] = pt(r, rot + (i * 360) / sides, cx, cy);
    out.push(`${x.toFixed(2)},${y.toFixed(2)}`);
  }
  return out.join(" ");
}

/** Retícula triangular (hex) para Flor / Semilla de la Vida. */
function lattice(R: number, rings: number): [number, number][] {
  const pts: [number, number][] = [];
  const ax: [number, number] = [R, 0];
  const bx: [number, number] = [R * Math.cos(Math.PI / 3), R * Math.sin(Math.PI / 3)];
  for (let i = -rings; i <= rings; i++) {
    for (let j = -rings; j <= rings; j++) {
      const dist = (Math.abs(i) + Math.abs(j) + Math.abs(i + j)) / 2;
      if (dist <= rings) pts.push([C + i * ax[0] + j * bx[0], C + i * ax[1] + j * bx[1]]);
    }
  }
  return pts;
}

function elements(id: GeometryId, sw: number): React.ReactNode {
  switch (id) {
    case "flor-vida": {
      const cs = lattice(11, 2);
      return [
        ...cs.map(([x, y], i) => <Circle key={`c${i}`} cx={x} cy={y} r={11} />),
        <Circle key="b1" cx={C} cy={C} r={33} />,
        <Circle key="b2" cx={C} cy={C} r={36} />,
      ];
    }
    case "semilla-vida": {
      const cs = lattice(13, 1);
      return [
        ...cs.map(([x, y], i) => <Circle key={`c${i}`} cx={x} cy={y} r={13} />),
        <Circle key="ring" cx={C} cy={C} r={39} />,
      ];
    }
    case "vesica": {
      const d = 12;
      return [
        <Circle key="a" cx={C - d} cy={C} r={24} />,
        <Circle key="b" cx={C + d} cy={C} r={24} />,
      ];
    }
    case "metatron": {
      const D = 16;
      const centers: [number, number][] = [[C, C]];
      [0, 60, 120, 180, 240, 300].forEach((a) => centers.push(pt(D, a)));
      [0, 60, 120, 180, 240, 300].forEach((a) => centers.push(pt(2 * D, a)));
      const lines: React.ReactNode[] = [];
      for (let i = 0; i < centers.length; i++) {
        for (let j = i + 1; j < centers.length; j++) {
          lines.push(
            <Line
              key={`l${i}-${j}`}
              x1={centers[i][0]}
              y1={centers[i][1]}
              x2={centers[j][0]}
              y2={centers[j][1]}
              strokeWidth={sw * 0.5}
              strokeOpacity={0.5}
            />,
          );
        }
      }
      const circles = centers.map(([x, y], i) => (
        <Circle key={`c${i}`} cx={x} cy={y} r={D / 2} />
      ));
      return [...lines, ...circles];
    }
    case "merkaba": {
      const ups = [-90, 30, 150].map((a, i) => {
        const [x, y] = pt(40, a);
        return <Line key={`u${i}`} x1={x} y1={y} x2={C} y2={C} strokeWidth={sw * 0.5} strokeOpacity={0.5} />;
      });
      const dns = [90, 210, 330].map((a, i) => {
        const [x, y] = pt(40, a);
        return <Line key={`d${i}`} x1={x} y1={y} x2={C} y2={C} strokeWidth={sw * 0.5} strokeOpacity={0.5} />;
      });
      return [
        <Polygon key="up" points={poly(40, 3, -90)} />,
        <Polygon key="dn" points={poly(40, 3, 90)} />,
        ...ups,
        ...dns,
      ];
    }
    case "hexagrama": {
      return [
        <Circle key="ring" cx={C} cy={C} r={45} />,
        <Polygon key="up" points={poly(38, 3, -90)} />,
        <Polygon key="dn" points={poly(38, 3, 90)} />,
      ];
    }
    case "sri-yantra": {
      const up = [40, 31, 22, 13].map((r, i) => <Polygon key={`u${i}`} points={poly(r, 3, -90)} />);
      const dn = [44, 35, 26, 17, 9].map((r, i) => <Polygon key={`d${i}`} points={poly(r, 3, 90)} />);
      return [
        <Circle key="ring" cx={C} cy={C} r={47} />,
        ...dn,
        ...up,
        <Circle key="bindu" cx={C} cy={C} r={1.8} />,
      ];
    }
    case "toroide": {
      const N = 12;
      const arr: React.ReactNode[] = [];
      for (let i = 0; i < N; i++) {
        arr.push(
          <Ellipse
            key={`e${i}`}
            cx={C}
            cy={C}
            rx={43}
            ry={13}
            transform={`rotate(${(i * 180) / N} ${C} ${C})`}
          />,
        );
      }
      arr.push(<Circle key="c" cx={C} cy={C} r={5} />);
      return arr;
    }
    case "mandala": {
      const arr: React.ReactNode[] = [
        <Circle key="o" cx={C} cy={C} r={46} />,
        <Circle key="m" cx={C} cy={C} r={33} />,
        <Circle key="cc" cx={C} cy={C} r={6} />,
      ];
      for (let i = 0; i < 12; i++) {
        const ang = i * 30;
        const [px, py] = pt(22, ang);
        arr.push(
          <Ellipse key={`p${i}`} cx={px} cy={py} rx={5} ry={12} transform={`rotate(${ang + 90} ${px} ${py})`} />,
        );
      }
      for (let i = 0; i < 12; i++) {
        const ang = i * 30 + 15;
        const [px, py] = pt(39, ang);
        arr.push(
          <Ellipse key={`q${i}`} cx={px} cy={py} rx={3.5} ry={8} transform={`rotate(${ang + 90} ${px} ${py})`} />,
        );
      }
      return arr;
    }
    case "espiral": {
      const pts: string[] = [];
      for (let deg = 0; deg <= 1080; deg += 7) {
        const t = (deg * Math.PI) / 180;
        const r = 2.0 * Math.exp(0.158 * t);
        if (r > 47) break;
        const a = t - Math.PI / 2;
        pts.push(`${(C + r * Math.cos(a)).toFixed(2)},${(C + r * Math.sin(a)).toFixed(2)}`);
      }
      let d = "";
      pts.forEach((p, i) => {
        d += i === 0 ? `M${p}` : ` L${p}`;
      });
      return [<Path key="s" d={d} />];
    }
    case "pentagrama": {
      const v = [0, 1, 2, 3, 4].map((i) => pt(42, -90 + i * 72));
      const order = [0, 2, 4, 1, 3];
      const points = order.map((i) => `${v[i][0].toFixed(2)},${v[i][1].toFixed(2)}`).join(" ");
      return [
        <Circle key="o" cx={C} cy={C} r={46} />,
        <Polygon key="star" points={points} />,
      ];
    }
    case "triquetra": {
      const arr: React.ReactNode[] = [];
      [-90, 30, 150].forEach((ang, i) => {
        const [x, y] = pt(11, ang);
        arr.push(<Circle key={`c${i}`} cx={x} cy={y} r={20} />);
      });
      arr.push(<Circle key="o" cx={C} cy={C} r={40} />);
      return arr;
    }
    default:
      return null;
  }
}

export interface SacredGlyphProps {
  id: GeometryId;
  color: string;
  size: number;
  strokeWidth?: number;
  opacity?: number;
}

export function SacredGlyph({ id, color, size, strokeWidth = 1.2, opacity = 1 }: SacredGlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" opacity={opacity}>
      <G
        stroke={color}
        fill="none"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {elements(id, strokeWidth)}
      </G>
    </Svg>
  );
}
