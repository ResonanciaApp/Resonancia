/**
 * SacredGlyph — dibuja una geometría sagrada con SVG.
 * Usado tanto en las miniaturas de la galería como en las capas del
 * fondo interactivo (Geometrix). Todo se dibuja en un viewBox 0–100.
 */
import React from "react";
import Svg, { Circle, Ellipse, G, Line, Path, Polygon } from "react-native-svg";

import type { GeometryId } from "@/data/geometries";

const C = 50;

/**
 * Extensión visual (radio máximo, en unidades del viewBox 0–100) que ocupa
 * cada geometría. Se usa para normalizar el tamaño aparente: cada glyph se
 * escala para que su contenido llene el mismo radio (TARGET_EXTENT), de modo
 * que todas se vean del mismo tamaño en miniaturas, tabs y capas.
 */
const TARGET_EXTENT = 39;
const EXTENT: Record<GeometryId, number> = {
  "flor-vida": 36,
  "semilla-vida": 39,
  vesica: 36,
  metatron: 40,
  merkaba: 40,
  "sri-yantra": 47,
  toroide: 43,
  mandala: 46,
  espiral: 47,
  pentagrama: 46,
  hexagrama: 45,
  triquetra: 40,
  "arbol-vida": 47,
  "fruto-vida": 39,
  "huevo-vida": 41,
  "cubo-vida": 36,
  octagrama: 46,
  eneagrama: 47,
  "nudo-celta": 40,
  "yin-yang": 46,
  circulos: 46,
  loto: 46,
  cuadrado: 40,
  circulo: 42,
  triangulo: 44,
};

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
    case "arbol-vida": {
      // 10 sefirot del Árbol de la Vida cabalístico + senderos.
      const nodes: [number, number][] = [
        [50, 9],   // 0 Keter
        [73, 23],  // 1 Chokmah
        [27, 23],  // 2 Binah
        [73, 45],  // 3 Chesed
        [27, 45],  // 4 Geburah
        [50, 56],  // 5 Tiferet
        [73, 67],  // 6 Netzach
        [27, 67],  // 7 Hod
        [50, 78],  // 8 Yesod
        [50, 92],  // 9 Malkuth
      ];
      const paths: [number, number][] = [
        [0, 1], [0, 2], [1, 2], [1, 3], [2, 4], [1, 5], [2, 5],
        [3, 4], [3, 5], [4, 5], [3, 6], [4, 7], [5, 6], [5, 7],
        [5, 8], [6, 7], [6, 8], [7, 8], [6, 9], [7, 9], [8, 9], [0, 5],
      ];
      const lines = paths.map(([a, b], i) => (
        <Line
          key={`l${i}`}
          x1={nodes[a][0]}
          y1={nodes[a][1]}
          x2={nodes[b][0]}
          y2={nodes[b][1]}
          strokeWidth={sw * 0.55}
          strokeOpacity={0.55}
        />
      ));
      const circles = nodes.map(([x, y], i) => (
        <Circle key={`n${i}`} cx={x} cy={y} r={5.5} />
      ));
      return [...lines, ...circles];
    }
    case "fruto-vida": {
      // 13 círculos separados del Fruto de la Vida.
      const D = 15.5;
      const centers: [number, number][] = [[C, C]];
      [0, 60, 120, 180, 240, 300].forEach((a) => centers.push(pt(D, a)));
      [0, 60, 120, 180, 240, 300].forEach((a) => centers.push(pt(2 * D, a)));
      return centers.map(([x, y], i) => (
        <Circle key={`c${i}`} cx={x} cy={y} r={D / 2} />
      ));
    }
    case "huevo-vida": {
      // Huevo de la Vida: 6 círculos tangentes alrededor de un centro vacío.
      const D = 13;
      const cs = [0, 60, 120, 180, 240, 300].map((a) => pt(D, a));
      return [
        ...cs.map(([x, y], i) => <Circle key={`c${i}`} cx={x} cy={y} r={D} />),
        <Circle key="ring" cx={C} cy={C} r={41} />,
      ];
    }
    case "cubo-vida": {
      // Cubo isométrico (wireframe) — dos caras unidas.
      const front: [number, number][] = [[28, 42], [64, 42], [64, 78], [28, 78]];
      const off: [number, number] = [13, -13];
      const back: [number, number][] = front.map(([x, y]) => [x + off[0], y + off[1]]);
      const sq = (pts: [number, number][]) =>
        pts.map((p) => `${p[0]},${p[1]}`).join(" ");
      const connectors = front.map(([x, y], i) => (
        <Line key={`k${i}`} x1={x} y1={y} x2={back[i][0]} y2={back[i][1]} />
      ));
      return [
        <Polygon key="front" points={sq(front)} />,
        <Polygon key="back" points={sq(back)} />,
        ...connectors,
      ];
    }
    case "octagrama": {
      // Estrella de 8 puntas: dos cuadrados girados 45°.
      return [
        <Circle key="ring" cx={C} cy={C} r={46} />,
        <Polygon key="a" points={poly(42, 4, -90)} />,
        <Polygon key="b" points={poly(42, 4, -45)} />,
      ];
    }
    case "eneagrama": {
      // 9 puntas: círculo + triángulo (9-3-6) + héxada (1-4-2-8-5-7).
      const p = [0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => pt(44, -90 + i * 40));
      const line = (idx: number[], key: string) => (
        <Polygon
          key={key}
          points={idx.map((i) => `${p[i][0].toFixed(2)},${p[i][1].toFixed(2)}`).join(" ")}
        />
      );
      return [
        <Circle key="o" cx={C} cy={C} r={47} />,
        line([0, 3, 6], "tri"),
        line([1, 4, 2, 8, 5, 7], "hex"),
        ...p.map(([x, y], i) => <Circle key={`d${i}`} cx={x} cy={y} r={1.8} />),
      ];
    }
    case "nudo-celta": {
      // Nudo trébol (trefoil) paramétrico — clásico celta.
      const s = 13;
      const pts: string[] = [];
      for (let deg = 0; deg <= 360; deg += 4) {
        const t = (deg * Math.PI) / 180;
        const x = C + s * (Math.sin(t) + 2 * Math.sin(2 * t));
        const y = C + s * (Math.cos(t) - 2 * Math.cos(2 * t));
        pts.push(`${x.toFixed(2)},${y.toFixed(2)}`);
      }
      let d = "";
      pts.forEach((q, i) => {
        d += i === 0 ? `M${q}` : ` L${q}`;
      });
      d += " Z";
      return [<Path key="knot" d={d} />];
    }
    case "yin-yang": {
      return [
        <Circle key="o" cx={C} cy={C} r={46} />,
        <Path key="s" d="M50,4 A23,23 0 0 1 50,50 A23,23 0 0 0 50,96" />,
        <Circle key="d1" cx={C} cy={27} r={4} fill={undefined} />,
        <Circle key="d2" cx={C} cy={73} r={4} />,
      ];
    }
    case "circulos": {
      return [10, 20, 30, 40, 46].map((r, i) => (
        <Circle key={`r${i}`} cx={C} cy={C} r={r} />
      )).concat(<Circle key="dot" cx={C} cy={C} r={2.5} />);
    }
    case "loto": {
      const arr: React.ReactNode[] = [<Circle key="o" cx={C} cy={C} r={46} />];
      // Pétalos exteriores largos.
      for (let i = 0; i < 12; i++) {
        const ang = i * 30;
        const [px, py] = pt(30, ang);
        arr.push(
          <Ellipse key={`o${i}`} cx={px} cy={py} rx={5} ry={16} transform={`rotate(${ang + 90} ${px} ${py})`} />,
        );
      }
      // Pétalos interiores, alternados.
      for (let i = 0; i < 12; i++) {
        const ang = i * 30 + 15;
        const [px, py] = pt(16, ang);
        arr.push(
          <Ellipse key={`i${i}`} cx={px} cy={py} rx={3.5} ry={9} transform={`rotate(${ang + 90} ${px} ${py})`} />,
        );
      }
      arr.push(<Circle key="c" cx={C} cy={C} r={5} />);
      return arr;
    }
    case "cuadrado": {
      return [<Polygon key="sq" points={poly(40, 4, -45)} />];
    }
    case "circulo": {
      return [<Circle key="c" cx={C} cy={C} r={42} />];
    }
    case "triangulo": {
      return [<Polygon key="tri" points={poly(44, 3, -90)} />];
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

function SacredGlyphImpl({ id, color, size, strokeWidth = 1.2, opacity = 1 }: SacredGlyphProps) {
  // Escala uniforme para que todas las geometrías llenen el mismo radio.
  const k = TARGET_EXTENT / (EXTENT[id] ?? 44);
  // Compensar el grosor para que el trazo se vea igual tras el escalado.
  const sw = strokeWidth / k;
  const t = C - C * k;
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" opacity={opacity}>
      <G
        transform={`translate(${t.toFixed(3)} ${t.toFixed(3)}) scale(${k.toFixed(4)})`}
        stroke={color}
        fill="none"
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {elements(id, sw)}
      </G>
    </Svg>
  );
}

// Memoizado: durante el pellizco en vivo el objetivo redibuja su SVG en cada
// frame (zoom = tamaño real, no transform); las demás capas conservan props
// idénticas y se saltan el re-render (no reconstruyen su árbol de elementos).
export const SacredGlyph = React.memo(SacredGlyphImpl);
