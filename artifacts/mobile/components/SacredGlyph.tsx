/**
 * SacredGlyph — dibuja una geometría sagrada con SVG.
 * Usado tanto en las miniaturas de la galería como en las capas del
 * fondo interactivo (Geometrix). Todo se dibuja en un viewBox 0–100.
 */
import React from "react";
import Animated, {
  useAnimatedStyle,
  type SharedValue,
} from "react-native-reanimated";
import {
  Circle,
  ClipPath,
  Defs,
  Ellipse,
  G,
  Line,
  LinearGradient,
  Path,
  Polygon,
  Stop,
  SvgXml,
  Use,
} from "react-native-svg";

import type { GeometryId } from "@/data/geometries";
import { GLYPH_STRINGS } from "@/data/glyph-strings";

const C = 50;

/**
 * Extensión visual (radio máximo, en unidades del viewBox 0–100) que ocupa
 * cada geometría. Se usa para normalizar el tamaño aparente: cada glyph se
 * escala para que su contenido llene el mismo radio (TARGET_EXTENT), de modo
 * que todas se vean del mismo tamaño en miniaturas, tabs y capas.
 */
const TARGET_EXTENT = 39;
export const EXTENT: Record<string, number> = {
  caleidoscopio: 44,
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
  cuadrado:               40,
  circulo:                42,
  triangulo:              44,
  tetraedro:              44,
  hexaedro:               40,
  octaedro:               42,
  icosaedro:              43,
  dodecaedro:             44,
  cuboctaedro:            40,
  "espiral-fibonacci":    47,
  decagrama:              46,
  "cruz-solar":           42,
  "roseta-ocho":          46,
  "vector-equilibrium":   40,
  "metatron-expandido":   45,
  "torus-infinito":       45,
  ivm:                    40,
  "estrella-tetraedrica": 44,
  "hexagono-sagrado":     42,
  "estrella-12":          46,
  estrella:               46,
};

/**
 * Extensión real del contenido dibujado en cada geometría (en unidades del
 * viewBox 0–100, desde el centro 50,50).
 * - rx : semiancho horizontal (de centro a borde derecho del contenido)
 * - ry : semialtura vertical  (de centro a borde superior/inferior del contenido)
 *
 * Solo se listan las geometrías donde rx ≠ ry (tiles asimétricos) o donde el
 * contenido dibujado no llena el radio EXTENT (p.ej. polígonos rotados).
 * El resto se trata como circular: rx = ry = EXTENT[id].
 *
 * Valores calculados directamente de las coordenadas dibujadas en glyphElements.
 */
export const GLYPH_EXTENTS: Partial<Record<string, { rx: number; ry: number }>> = {
  // Vesica Piscis: dos círculos r=24 con centros a ±12 del centro → ancho > alto
  vesica:               { rx: 36,    ry: 24    },
  // Árbol de la Vida: muy alto (y 9..92 + r=5.5) y angosto (x 27..73 + r=5.5)
  "arbol-vida":         { rx: 28.5,  ry: 47.5  },
  // Merkaba: dos triángulos equiláteros, sin círculo exterior
  merkaba:              { rx: 34.64, ry: 40    },
  // Fruto de la Vida: lattice hexagonal (más ancho que alto)
  "fruto-vida":         { rx: 38.75, ry: 34.59 },
  // Cubo de la Vida: wireframe isométrico, bounding box ~cuadrado
  "cubo-vida":          { rx: 24.5,  ry: 24.5  },
  // Triángulo equilátero con vértice arriba: rx = ry × cos(30°)
  triangulo:            { rx: 38.1,  ry: 44    },
  // Tetraedro: triángulo + medianas, rx = ry × cos(30°)
  tetraedro:            { rx: 36.37, ry: 42    },
  // Hexaedro (cubo isométrico): hexágono con vértices a ±30° → rx < ry
  hexaedro:             { rx: 32.04, ry: 37    },
  // Cuadrado: rombo (rotado 45°), bounding box cuadrado
  cuadrado:             { rx: 28.28, ry: 28.28 },
  // Octaedro: rombo con vértices a 0/90/180/270° → cuadrado, rx = ry
  octaedro:             { rx: 40,    ry: 40    },
  // Icosaedro: top/bot en r=42, anillo exterior rx=34×cos(18°)
  icosaedro:            { rx: 32.33, ry: 42    },
  // Dodecaedro: pentágono exterior con vértice arriba
  dodecaedro:           { rx: 39.93, ry: 42    },
  // Cuboctaedro: hexágono con vértices a 0°,60°,… → rx > ry
  cuboctaedro:          { rx: 38,    ry: 32.91 },
  // Stella Octangula: dos triángulos (=merkaba) + pequeños interiores
  "estrella-tetraedrica": { rx: 34.64, ry: 40  },
  // Metatrón: lattice hexagonal de círculos (más ancho que alto)
  metatron:             { rx: 40,    ry: 35.7  },
  // IVM: lattice hexagonal de líneas (más ancho que alto)
  ivm:                  { rx: 36,    ry: 31.18 },
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

/**
 * Genera los centros de una malla hexagonal. angleDeg rota los vectores base
 * para cambiar la orientación del patrón:
 *   0°  → "flat-top"  (vecino directo a la derecha, ninguno arriba)
 *  -30° → "pointy-top" (vecino directo arriba = Flor de la Vida canónica)
 */
function lattice(R: number, rings: number, angleDeg = 0): [number, number][] {
  const pts: [number, number][] = [];
  const a = (angleDeg * Math.PI) / 180;
  const ax: [number, number] = [R * Math.cos(a), R * Math.sin(a)];
  const bx: [number, number] = [R * Math.cos(Math.PI / 3 + a), R * Math.sin(Math.PI / 3 + a)];
  for (let i = -rings; i <= rings; i++) {
    for (let j = -rings; j <= rings; j++) {
      const dist = (Math.abs(i) + Math.abs(j) + Math.abs(i + j)) / 2;
      if (dist <= rings) pts.push([C + i * ax[0] + j * bx[0], C + i * ax[1] + j * bx[1]]);
    }
  }
  return pts;
}

/** Grupo para trazo "fino" decorativo (0.5×/0.55× del principal). En modo
 *  pellizco `G` es un AnimatedG con `props50/props55` = animatedProps que
 *  contra-escalan el strokeWidth; en reposo/miniatura no se pasa y se usa un
 *  `<G>` estático con el trazo explícito. */
interface HalfStroke {
  G: React.ComponentType<any>;
  props50: Record<string, unknown>;
  props55: Record<string, unknown>;
}

/** Elementos SVG del glyph en coordenadas viewBox 0–100. Exportado para
 *  reusar dentro de un `<Pattern>` (p.ej. GeometrixPatternBg). */
export function glyphElements(
  id: GeometryId,
  sw: number,
  half?: HalfStroke,
): React.ReactNode {
  // Envuelve líneas decorativas de trazo fino en un grupo. Esas líneas NO
  // heredan el strokeWidth del <G> principal (lo fijan explícito), así que la
  // contra-escala del pellizco no las alcanzaba y engrosaban (muy visible en
  // metatron, que es casi todo líneas). Con `half` (pellizco) el grupo es un
  // AnimatedG cuyo strokeWidth se contra-escala igual que el resto; sin `half`
  // (miniaturas / patrón estático) es un <G> con el trazo explícito → idéntico.
  const wrapHalf = (
    children: React.ReactNode,
    factor: 0.5 | 0.55,
    strokeOpacity: number,
    key: string,
  ): React.ReactNode => {
    if (half) {
      const Wrap = half.G;
      const wp = factor === 0.55 ? half.props55 : half.props50;
      return (
        <Wrap key={key} strokeOpacity={strokeOpacity} {...wp}>
          {children}
        </Wrap>
      );
    }
    return (
      <G key={key} strokeWidth={sw * factor} strokeOpacity={strokeOpacity}>
        {children}
      </G>
    );
  };
  switch (id) {
    // El caleidoscopio se dibuja como geometría base (una cuña con espiral y
    // arcos internos), pero la simetría radial real se aplica en SacredGlyphImpl
    // con clipPath + <Use rotate> — ver la rama `kaleidoscope` allí.
    // Este case define el motivo base de la cuña (se usa también sin modo kaléido).
    case "caleidoscopio": {
      const r = 44;
      const pts = [
        `M ${C} ${C}`,
        `L ${(C + r * Math.cos(-Math.PI / 6)).toFixed(2)} ${(C + r * Math.sin(-Math.PI / 6)).toFixed(2)}`,
        `A ${r} ${r} 0 0 1 ${(C + r * Math.cos(Math.PI / 6)).toFixed(2)} ${(C + r * Math.sin(Math.PI / 6)).toFixed(2)}`,
        `Z`,
      ].join(" ");
      const inner = [8, 16, 24, 32, 40].map((ri) => (
        <Circle key={`ci${ri}`} cx={C} cy={C} r={ri} opacity={0.4} />
      ));
      const spokes = Array.from({ length: 12 }, (_, i) => {
        const a = (i * Math.PI) / 6;
        const x2 = (C + r * Math.cos(a)).toFixed(2);
        const y2 = (C + r * Math.sin(a)).toFixed(2);
        return <Line key={`sp${i}`} x1={C} y1={C} x2={x2} y2={y2} opacity={0.3} />;
      });
      return [
        ...inner,
        ...spokes,
        <Circle key="outer" cx={C} cy={C} r={r} />,
        <Circle key="mid" cx={C} cy={C} r={r * 0.55} />,
        <Circle key="inner" cx={C} cy={C} r={r * 0.25} />,
        <Path key="wedge" d={pts} opacity={0} />,
      ];
    }
    case "flor-vida": {
      const cs = lattice(11, 2, -30);
      return [
        ...cs.map(([x, y], i) => <Circle key={`c${i}`} cx={x} cy={y} r={11} />),
        <Circle key="b1" cx={C} cy={C} r={33} />,
        <Circle key="b2" cx={C} cy={C} r={36} />,
      ];
    }
    case "semilla-vida": {
      const cs = lattice(13, 1, -30);
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
      [-90, -30, 30, 90, 150, 210].forEach((a) => centers.push(pt(D, a)));
      [-90, -30, 30, 90, 150, 210].forEach((a) => centers.push(pt(2 * D, a)));
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
            />,
          );
        }
      }
      const circles = centers.map(([x, y], i) => (
        <Circle key={`c${i}`} cx={x} cy={y} r={D / 2} />
      ));
      return [wrapHalf(lines, 0.5, 0.5, "lines"), ...circles];
    }
    case "merkaba": {
      const ups = [-90, 30, 150].map((a, i) => {
        const [x, y] = pt(40, a);
        return <Line key={`u${i}`} x1={x} y1={y} x2={C} y2={C} />;
      });
      const dns = [90, 210, 330].map((a, i) => {
        const [x, y] = pt(40, a);
        return <Line key={`d${i}`} x1={x} y1={y} x2={C} y2={C} />;
      });
      return [
        <Polygon key="up" points={poly(40, 3, -90)} />,
        <Polygon key="dn" points={poly(40, 3, 90)} />,
        wrapHalf([...ups, ...dns], 0.5, 0.5, "lines"),
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
        />
      ));
      const circles = nodes.map(([x, y], i) => (
        <Circle key={`n${i}`} cx={x} cy={y} r={5.5} />
      ));
      return [wrapHalf(lines, 0.55, 0.55, "lines"), ...circles];
    }
    case "fruto-vida": {
      // 13 círculos separados del Fruto de la Vida.
      const D = 15.5;
      const centers: [number, number][] = [[C, C]];
      [-90, -30, 30, 90, 150, 210].forEach((a) => centers.push(pt(D, a)));
      [-90, -30, 30, 90, 150, 210].forEach((a) => centers.push(pt(2 * D, a)));
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
      // Cubo isométrico (wireframe) — dos caras unidas. Coordenadas elegidas para
      // que el bounding box del conjunto (cara frontal + trasera desplazada)
      // quede centrado en el viewBox (50,50): si no, queda abajo y a la derecha.
      const front: [number, number][] = [
        [25.5, 38.5],
        [61.5, 38.5],
        [61.5, 74.5],
        [25.5, 74.5],
      ];
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
    // ── Sólidos Platónicos ──────────────────────────────────────────────────
    case "tetraedro": {
      // Proyección: triángulo exterior + 3 medianas al centro (vértice superior)
      const verts = [0, 1, 2].map((i) => pt(42, -90 + i * 120));
      const lines: React.ReactNode[] = [];
      verts.forEach(([x, y], i) => {
        const [nx, ny] = verts[(i + 1) % 3];
        lines.push(<Line key={`s${i}`} x1={x} y1={y} x2={nx} y2={ny} />);
        lines.push(<Line key={`m${i}`} x1={x} y1={y} x2={C} y2={C} strokeOpacity={0.5} />);
      });
      lines.push(<Circle key="apex" cx={C} cy={C} r={3} />);
      return lines;
    }
    case "hexaedro": {
      // Proyección isométrica: hexágono + 3 diagonales principales = cubo wireframe
      const v = [0, 1, 2, 3, 4, 5].map((i) => pt(37, i * 60 - 30));
      const lines: React.ReactNode[] = [];
      v.forEach(([x, y], i) => {
        const [nx, ny] = v[(i + 1) % 6];
        lines.push(<Line key={`e${i}`} x1={x} y1={y} x2={nx} y2={ny} />);
      });
      ([[0, 3], [1, 4], [2, 5]] as [number, number][]).forEach(([a, b], i) =>
        lines.push(<Line key={`d${i}`} x1={v[a][0]} y1={v[a][1]} x2={v[b][0]} y2={v[b][1]} />),
      );
      return lines;
    }
    case "octaedro": {
      // Proyección: rombo (cuadrado rotado 45°) + líneas de aristas internas
      const r = 40;
      const pts: [number, number][] = [[C, C - r], [C + r, C], [C, C + r], [C - r, C]];
      return [
        ...pts.map(([x, y], i) => {
          const [nx, ny] = pts[(i + 1) % 4];
          return <Line key={`s${i}`} x1={x} y1={y} x2={nx} y2={ny} />;
        }),
        <Line key="v" x1={C} y1={C - r} x2={C} y2={C + r} strokeOpacity={0.5} />,
        <Line key="h" x1={C - r} y1={C} x2={C + r} y2={C} strokeOpacity={0.5} />,
        <Circle key="c" cx={C} cy={C} r={3} />,
      ];
    }
    case "icosaedro": {
      // 12 vértices: 1 top + 5 upper + 5 lower + 1 bottom, conectados por aristas
      const top: [number, number] = [C, C - 40];
      const bot: [number, number] = [C, C + 40];
      const up = [0, 1, 2, 3, 4].map((i) => pt(20, -90 + i * 72));
      const lo = [0, 1, 2, 3, 4].map((i) => pt(34, -90 + 36 + i * 72));
      const lines: React.ReactNode[] = [];
      up.forEach(([x, y], i) => {
        lines.push(<Line key={`tu${i}`} x1={top[0]} y1={top[1]} x2={x} y2={y} />);
        const [nx, ny] = up[(i + 1) % 5];
        lines.push(<Line key={`ur${i}`} x1={x} y1={y} x2={nx} y2={ny} />);
        lines.push(<Line key={`ul${i}`} x1={x} y1={y} x2={lo[i][0]} y2={lo[i][1]} />);
        lines.push(<Line key={`ul2${i}`} x1={x} y1={y} x2={lo[(i + 4) % 5][0]} y2={lo[(i + 4) % 5][1]} />);
      });
      lo.forEach(([x, y], i) => {
        lines.push(<Line key={`bl${i}`} x1={bot[0]} y1={bot[1]} x2={x} y2={y} />);
        const [nx, ny] = lo[(i + 1) % 5];
        lines.push(<Line key={`lr${i}`} x1={x} y1={y} x2={nx} y2={ny} />);
      });
      return [
        ...lines,
        <Circle key="top" cx={top[0]} cy={top[1]} r={2} />,
        <Circle key="bot" cx={bot[0]} cy={bot[1]} r={2} />,
      ];
    }
    case "dodecaedro": {
      // Diagrama de Schlegel simplificado: 3 pentágonos concéntricos con conexiones
      const p1 = [0, 1, 2, 3, 4].map((i) => pt(15, -90 + i * 72));
      const p2 = [0, 1, 2, 3, 4].map((i) => pt(28, -90 + 36 + i * 72));
      const p3 = [0, 1, 2, 3, 4].map((i) => pt(42, -90 + i * 72));
      const lines: React.ReactNode[] = [];
      const ring = (pts: [number, number][], key: string) =>
        pts.forEach(([x, y], i) => {
          const [nx, ny] = pts[(i + 1) % 5];
          lines.push(<Line key={`${key}${i}`} x1={x} y1={y} x2={nx} y2={ny} />);
        });
      ring(p1, "a"); ring(p2, "b"); ring(p3, "c");
      p1.forEach(([x, y], i) =>
        lines.push(<Line key={`12${i}`} x1={x} y1={y} x2={p2[i][0]} y2={p2[i][1]} />),
      );
      p2.forEach(([x, y], i) => {
        lines.push(<Line key={`23a${i}`} x1={x} y1={y} x2={p3[i][0]} y2={p3[i][1]} />);
        lines.push(<Line key={`23b${i}`} x1={x} y1={y} x2={p3[(i + 1) % 5][0]} y2={p3[(i + 1) % 5][1]} />);
      });
      return lines;
    }
    // ── Cuboctaedro / Vector Equilibrium ────────────────────────────────────
    case "cuboctaedro": {
      // Hexágono exterior + rayos al centro + hexágono interior rotado
      const outer = [0, 1, 2, 3, 4, 5].map((i) => pt(38, i * 60));
      const inner = [0, 1, 2, 3, 4, 5].map((i) => pt(22, i * 60 + 30));
      const lines: React.ReactNode[] = [];
      outer.forEach(([x, y], i) => {
        const [nx, ny] = outer[(i + 1) % 6];
        lines.push(<Line key={`o${i}`} x1={x} y1={y} x2={nx} y2={ny} />);
        lines.push(<Line key={`s${i}`} x1={x} y1={y} x2={C} y2={C} strokeOpacity={0.4} />);
      });
      inner.forEach(([x, y], i) => {
        const [nx, ny] = inner[(i + 1) % 6];
        lines.push(<Line key={`i${i}`} x1={x} y1={y} x2={nx} y2={ny} />);
        lines.push(<Line key={`c${i}`} x1={outer[i][0]} y1={outer[i][1]} x2={x} y2={y} />);
      });
      return [...lines, <Circle key="dot" cx={C} cy={C} r={2.5} />];
    }
    case "vector-equilibrium": {
      // Hexágono + todos los rayos + triángulos de equilibrio + círculo exterior
      const v = [0, 1, 2, 3, 4, 5].map((i) => pt(38, i * 60));
      const lines: React.ReactNode[] = [];
      v.forEach(([x, y], i) => {
        const [nx, ny] = v[(i + 1) % 6];
        lines.push(<Line key={`e${i}`} x1={x} y1={y} x2={nx} y2={ny} />);
        lines.push(<Line key={`s${i}`} x1={x} y1={y} x2={C} y2={C} />);
      });
      // Diagonales saltando un vértice (caras cuadradas del cuboctaedro)
      for (let i = 0; i < 6; i += 2) {
        const [ax, ay] = v[i]; const [bx, by] = v[(i + 2) % 6];
        lines.push(<Line key={`sq${i}`} x1={ax} y1={ay} x2={bx} y2={by} strokeOpacity={0.45} />);
      }
      lines.push(<Circle key="ring" cx={C} cy={C} r={38} />);
      lines.push(<Circle key="c" cx={C} cy={C} r={3} />);
      return lines;
    }
    // ── Espirales ────────────────────────────────────────────────────────────
    case "espiral-fibonacci": {
      // Doble espiral áurea (sentidos opuestos) — característica de Fibonacci
      const spiral = (dir: 1 | -1): string => {
        const pts: string[] = [];
        for (let deg = 0; deg <= 1080; deg += 6) {
          const t = (deg * Math.PI) / 180;
          const r = 1.9 * Math.exp(0.158 * t);
          if (r > 46) break;
          pts.push(
            `${(C + r * Math.cos(dir * t - Math.PI / 2)).toFixed(2)},${(C + r * Math.sin(dir * t - Math.PI / 2)).toFixed(2)}`,
          );
        }
        let d = "";
        pts.forEach((p, i) => { d += i === 0 ? `M${p}` : ` L${p}`; });
        return d;
      };
      return [
        <Path key="s1" d={spiral(1)} />,
        <Path key="s2" d={spiral(-1)} strokeOpacity={0.45} />,
        <Circle key="c" cx={C} cy={C} r={2} />,
      ];
    }
    // ── Estrellas ────────────────────────────────────────────────────────────
    case "decagrama": {
      // Estrella de 10 puntas: dos pentágonos regulares (offset 36°) + círculo
      return [
        <Circle key="ring" cx={C} cy={C} r={46} />,
        <Polygon key="a" points={poly(40, 5, -90)} />,
        <Polygon key="b" points={poly(40, 5, -90 + 36)} />,
      ];
    }
    case "estrella-tetraedrica": {
      // Stella Octangula: dos tetraedros entrelazados — dos triángulos + réplica interna
      return [
        <Polygon key="t1" points={poly(40, 3, -90)} />,
        <Polygon key="t2" points={poly(40, 3, 90)} />,
        <Polygon key="i1" points={poly(20, 3, 90)} />,
        <Polygon key="i2" points={poly(20, 3, -90)} />,
        <Circle key="c" cx={C} cy={C} r={12} />,
      ];
    }
    case "estrella-12": {
      // Dodecagrama: dos hexágonos regulares (offset 30°) + círculo
      return [
        <Circle key="ring" cx={C} cy={C} r={46} />,
        <Polygon key="a" points={poly(40, 6, -90)} />,
        <Polygon key="b" points={poly(40, 6, -60)} />,
        <Circle key="c" cx={C} cy={C} r={3} />,
      ];
    }
    case "estrella": {
      // Heptagrama (7 puntas, conexión 7/2) + círculo exterior
      const v7 = [0, 1, 2, 3, 4, 5, 6].map((i) => pt(40, -90 + i * (360 / 7)));
      const order7 = [0, 2, 4, 6, 1, 3, 5];
      return [
        <Circle key="ring" cx={C} cy={C} r={44} />,
        <Polygon key="star" points={order7.map((i) => `${v7[i][0].toFixed(2)},${v7[i][1].toFixed(2)}`).join(" ")} />,
      ];
    }
    // ── Cruces y Rosetas ─────────────────────────────────────────────────────
    case "cruz-solar": {
      const r = 40;
      return [
        <Circle key="outer" cx={C} cy={C} r={r} />,
        <Circle key="inner" cx={C} cy={C} r={r * 0.33} />,
        <Line key="v" x1={C} y1={C - r} x2={C} y2={C + r} />,
        <Line key="h" x1={C - r} y1={C} x2={C + r} y2={C} />,
      ];
    }
    case "roseta-ocho": {
      // 8 pétalos elípticos alrededor del centro + círculo exterior
      const arr: React.ReactNode[] = [
        <Circle key="outer" cx={C} cy={C} r={44} />,
        <Circle key="c" cx={C} cy={C} r={5} />,
      ];
      for (let i = 0; i < 8; i++) {
        const ang = i * 45;
        const [px, py] = pt(22, ang);
        arr.push(
          <Ellipse key={`p${i}`} cx={px} cy={py} rx={7} ry={19}
            transform={`rotate(${ang + 90} ${px} ${py})`} />,
        );
      }
      return arr;
    }
    // ── Estructuras complejas ────────────────────────────────────────────────
    case "hexagono-sagrado": {
      // Hexágono + todos los diagonales + dos anillos + punto central
      const v = [0, 1, 2, 3, 4, 5].map((i) => pt(38, i * 60));
      const lines: React.ReactNode[] = [];
      v.forEach(([x, y], i) => {
        const [nx, ny] = v[(i + 1) % 6];
        lines.push(<Line key={`e${i}`} x1={x} y1={y} x2={nx} y2={ny} />);
      });
      for (let i = 0; i < 6; i++) {
        for (let j = i + 2; j < 6; j++) {
          if (i === 0 && j === 5) continue; // arista, no diagonal
          lines.push(
            <Line key={`d${i}-${j}`} x1={v[i][0]} y1={v[i][1]} x2={v[j][0]} y2={v[j][1]} strokeOpacity={0.45} />,
          );
        }
      }
      lines.push(<Circle key="outer" cx={C} cy={C} r={40} />);
      lines.push(<Circle key="inner" cx={C} cy={C} r={22} />);
      lines.push(<Circle key="c" cx={C} cy={C} r={3} />);
      return lines;
    }
    case "metatron-expandido": {
      // Metatrón estándar (13 círculos) + anillo exterior de 12 círculos
      const D = 13;
      const c0: [number, number] = [C, C];
      const r1 = [-90, -30, 30, 90, 150, 210].map((a) => pt(D, a)) as [number, number][];
      const r2 = [-90, -30, 30, 90, 150, 210].map((a) => pt(2 * D, a)) as [number, number][];
      const all: [number, number][] = [c0, ...r1, ...r2];
      // Líneas finas internas (trazo 0.5×) → grupo contra-escalable en pellizco.
      const innerLines: React.ReactNode[] = [];
      for (let i = 0; i < all.length; i++) {
        for (let j = i + 1; j < all.length; j++) {
          innerLines.push(
            <Line key={`l${i}-${j}`} x1={all[i][0]} y1={all[i][1]} x2={all[j][0]} y2={all[j][1]} />,
          );
        }
      }
      // Anillo exterior: trazo completo (hereda del <G> principal, ya compensado).
      const r3 = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((a) => pt(3 * D, a)) as [number, number][];
      const ringLines: React.ReactNode[] = r3.map(([x, y], i) => {
        const [nx, ny] = r3[(i + 1) % 12];
        return <Line key={`r3${i}`} x1={x} y1={y} x2={nx} y2={ny} />;
      });
      return [
        wrapHalf(innerLines, 0.5, 0.3, "lines"),
        ...ringLines,
        ...all.map(([x, y], i) => <Circle key={`c${i}`} cx={x} cy={y} r={D / 2} />),
        ...r3.map(([x, y], i) => <Circle key={`d${i}`} cx={x} cy={y} r={D / 3} />),
      ];
    }
    case "torus-infinito": {
      // Doble toro: dos conjuntos de elipses perpendiculares
      const arr: React.ReactNode[] = [];
      for (let i = 0; i < 8; i++) {
        arr.push(
          <Ellipse key={`a${i}`} cx={C} cy={C} rx={43} ry={12}
            transform={`rotate(${i * 22.5} ${C} ${C})`} />,
        );
        arr.push(
          <Ellipse key={`b${i}`} cx={C} cy={C} rx={12} ry={43}
            transform={`rotate(${i * 22.5} ${C} ${C})`} strokeOpacity={0.5} />,
        );
      }
      arr.push(<Circle key="c" cx={C} cy={C} r={43} />);
      return arr;
    }
    case "ivm": {
      // Lattice isotrópica vectorial: retícula triangular hex conectada
      const R = 12;
      const pts = lattice(R, 3, -30);
      const lines: React.ReactNode[] = [];
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[j][0] - pts[i][0];
          const dy = pts[j][1] - pts[i][1];
          if (Math.sqrt(dx * dx + dy * dy) < R * 1.05) {
            lines.push(
              <Line key={`${i}-${j}`} x1={pts[i][0].toFixed(2)} y1={pts[i][1].toFixed(2)}
                x2={pts[j][0].toFixed(2)} y2={pts[j][1].toFixed(2)} />,
            );
          }
        }
      }
      return lines;
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
  /** Factor de escala para los stroke-width del SVG (1 = sin cambio).
      Usar 0.45 para strokeMode "thin". Se aplica multiplicando cada
      valor stroke-width presente en el SVG string antes de renderizar. */
  strokeScale?: number;
  /** Grosor del contorno exterior en unidades del viewBox SVG (0–1 aprox).
      Solo tiene efecto en mosaicos (fill sin stroke-width). Calculado por
      el caller: outlineWidthPx * (100 / effectiveSize). 0 = sin contorno. */
  outlineWidth?: number;
  opacity?: number;
  /** Degradado del trazo [desde, hasta]. Si se pasa, manda sobre `color`.
      Debe ser una referencia estable (memo) para no romper React.memo. */
  gradient?: readonly [string, string];
  /** Modo caleidoscopio: replica el motivo con simetría radial de N segmentos. */
  kaleidoscope?: boolean;
  /** Número de segmentos radiales (4, 6, 8, 12). Solo activo con kaleidoscope=true. */
  kaleidSegments?: number;
  /** Escala de pellizco EN VIVO (UI thread). Si se pasa, el SVG se redibuja a
      `size * liveScaleSV` y el trazo se compensa (`strokeWidth / liveScaleSV`)
      para mantener el grosor VISUAL constante — sin transform (trazo nítido) y
      sin re-render de React. En reposo vale 1 → render idéntico al estático. */
  liveScaleSV?: SharedValue<number>;
  /** Modo wireframe para mosaicos: convierte fill sólido → stroke fino (0.4 SVG units).
      No tiene efecto en geometrías wireframe nativas (ya usan stroke). */
  wireframe?: boolean;
}

function SacredGlyphImpl({
  id,
  color,
  size,
  opacity = 1,
  strokeScale = 1,
  outlineWidth = 0,
  wireframe = false,
  gradient,
  kaleidoscope = false,
  kaleidSegments = 6,
  liveScaleSV,
}: SacredGlyphProps) {
  // Id único y seguro para SVG (useId trae ":" que algunos renderers no aceptan).
  const uid = React.useId().replace(/:/g, "");
  const gradId = `gg${uid}`;
  const clipId = `gc${uid}`;
  const motifId = `gm${uid}`;

  // Construye la cadena SVG (con o sin caleidoscopio) y sustituye el placeholder
  // de color. Se recalcula solo cuando cambian los parámetros visuales.
  const svgXml = React.useMemo(() => {
    let raw = GLYPH_STRINGS[id as string] ?? "";
    // Wireframe para mosaicos: convertir fill sólido → contorno fino (0.4 SVG units)
    // ANTES de sustituir el placeholder de color, para que el stroke también se coloree.
    if (wireframe) {
      raw = raw.replace(/fill="GLYPH_STROKE"/g, 'fill="none" stroke="GLYPH_STROKE" stroke-width="0.4"');
    }
    const ec = gradient ? `url(#${gradId})` : color;
    let content = raw ? raw.replace(/GLYPH_STROKE/g, ec) : "<g></g>";
    // strokeScale ≠ 1: escala proporcionalmente todos los stroke-width del SVG.
    // Preserva los anchos relativos entre trazos (si hay varios valores distintos)
    // y no afecta geometrías tipo fill (mosaicos) que no tienen stroke-width.
    if (strokeScale !== 1) {
      content = content.replace(/stroke-width="([^"]*)"/g, (_, v) => {
        const scaled = parseFloat(v) * strokeScale;
        return `stroke-width="${scaled.toFixed(4)}"`;
      });
    }
    const gradDefs = gradient
      ? `<linearGradient id="${gradId}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${gradient[0]}"/><stop offset="100%" stop-color="${gradient[1]}"/></linearGradient>`
      : "";

    // Atributos de contorno exterior (solo para mosaicos fill-based).
    const outlineAttrs =
      outlineWidth > 0
        ? ` stroke="${ec}" stroke-width="${outlineWidth.toFixed(4)}"`
        : "";

    // ── Sin caleidoscopio: SVG plano ──────────────────────────────────────
    const overflowAttr = wireframe ? ' overflow="visible"' : "";
    if (!kaleidoscope) {
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"${overflowAttr}${outlineAttrs}>${gradDefs ? `<defs>${gradDefs}</defs>` : ""}${content}</svg>`;
    }

    // ── Modo caleidoscopio: simetría radial de N segmentos ────────────────
    // El motivo completo se define una sola vez en <defs> (recortado a la cuña)
    // y se referencia N veces con <use transform="rotate(i*angle)"/>.
    const N = Math.max(2, Math.min(24, kaleidSegments));
    const wedgeAngle = 360 / N;
    const halfW = wedgeAngle / 2;
    const r = 72;
    const Cx = 50;
    const toRad = (d: number) => (d * Math.PI) / 180;
    const x1 = (Cx + r * Math.cos(toRad(-halfW))).toFixed(3);
    const y1 = (Cx + r * Math.sin(toRad(-halfW))).toFixed(3);
    const x2 = (Cx + r * Math.cos(toRad(halfW))).toFixed(3);
    const y2 = (Cx + r * Math.sin(toRad(halfW))).toFixed(3);
    const largeArc = wedgeAngle > 180 ? 1 : 0;
    const wedgePath = `M ${Cx} ${Cx} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
    const uses = Array.from({ length: N }, (_, i) =>
      `<use href="#${motifId}" transform="rotate(${(i * wedgeAngle).toFixed(3)} ${Cx} ${Cx})"/>`
    ).join("");
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"${overflowAttr}${outlineAttrs}><defs>${gradDefs}<clipPath id="${clipId}"><path d="${wedgePath}"/></clipPath><g id="${motifId}" clip-path="url(#${clipId})">${content}</g></defs>${uses}</svg>`;
  }, [id, color, gradient, gradId, clipId, motifId, kaleidoscope, kaleidSegments, strokeScale, outlineWidth, wireframe]);

  // Zoom en vivo (UI thread): cambia width/height por shared value sin re-render.
  const animStyle = useAnimatedStyle(() => {
    const s = size * (liveScaleSV != null ? liveScaleSV.value : 1);
    return { width: s, height: s };
  });

  return (
    <Animated.View style={[animStyle, { opacity }]}>
      <SvgXml xml={svgXml} width="100%" height="100%" />
    </Animated.View>
  );
}

// Memoizado: durante el pellizco en vivo el objetivo redibuja su SVG en cada
// frame (zoom = tamaño real, no transform); las demás capas conservan props
// idénticas y se saltan el re-render (no reconstruyen su árbol de elementos).
export const SacredGlyph = React.memo(SacredGlyphImpl);
